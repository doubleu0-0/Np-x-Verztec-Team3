# === FastAPI Core ===
from fastapi import FastAPI, Request, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# === Security & Auth ===
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import bcrypt
from dotenv import load_dotenv

# === Pydantic Models ===
from pydantic import BaseModel, EmailStr

# === Database & Files ===
import pymysql
import pymysql.cursors
from openpyxl import load_workbook

# === LLMs & Vector Store ===
import ollama
import chromadb
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings, StorageContext, VectorStoreIndex, get_response_synthesizer
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core.vector_stores import MetadataFilter, MetadataFilters, FilterOperator
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine

# === Utilities ===
from datetime import datetime, timedelta
from urllib.parse import quote
from enum import Enum
from typing import Generator, Optional, List
import re
import io
import os
import json
import shutil
from pathlib import Path

# --- REDIS ---
import redis
from fastapi import Header, Security
from typer import prompt

PROJECT_ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = PROJECT_ROOT / "pipeline" / "data" / "raw_data"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables from .env
load_dotenv(PROJECT_ROOT / ".env")
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6380, db=0, decode_responses=True)

# Set up Ollama and HuggingFace embedding
Settings.embed_model = HuggingFaceEmbedding(model_name="intfloat/e5-large-v2")
embed_model = HuggingFaceEmbedding(model_name="intfloat/e5-large-v2")
remote_base_url = "http://localhost:11434"

# Instantiate the Ollama LLM
llm = Ollama(model="llama3.2:latest", request_timeout=120.0, temperature=0, context_window=4096, base_url=remote_base_url)
light_llm = Ollama(model="llama3.2:1b",context_window=1024,base_url=remote_base_url)
Settings.llm = llm
memory = ChatMemoryBuffer.from_defaults(token_limit=1024)


# Initialize ChromaDB client
PERSIST_DIR = PROJECT_ROOT / "pipeline" / "data" / "ChromaDB"

db = chromadb.PersistentClient(path=str(PERSIST_DIR))
chroma_collection = db.get_or_create_collection("quickstart")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)
index = VectorStoreIndex.from_vector_store(vector_store, storage_context=storage_context)
query_engine = index.as_query_engine(similarity_top_k=5, streaming=True)


# --- Utility to get user info from token/redis ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        session = redis_client.get(f"user_token:{user_id}")
        if not session:
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        session_data = json.loads(session)
        return session_data
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    

# Prompt template
prompt_template = """
You are Verztec's AI HR assistant.

Your task is to extract all meaningful HR-related questions or concerns from the user's message.

For each item:
- Assign a concise label (e.g., "Leave entitlement", "Workplace harassment")
- Rewrite the question or concern in a short, clear form — **do not add explanations, notes, or assumptions**
- Only include relevant HR-related content, not exhaustive-(e.g., leave, claims, WFH, policies, pantry, etiquette, misconduct, benefits, office or organisation-related matters)
- Always rewrite from the user's point of view using "I" instead of "you" unless specified
- Ignore all non-HR and off-topic content

⚠️ Your response must strictly follow this format:
1. **[Label]**: [Simplified question or concern]

❌ Do NOT include commentary, explanations, extra notes, or anything outside the format above.

If no HR-related questions or concerns are found, respond exactly: No HR-related questions or concerns detected.

Below is the raw user message, between <user></user> tags. Only process what's inside:

<user>
{user_input}
</user>
"""

# Pydantic model
class UserMessage(BaseModel):
    message: str
    model: str = "llama3.2:latest"  # default model

def get_llm(model_name: str):
    if model_name == "llama3.2:1b":
        return Ollama(model="llama3.2:1b", context_window=2048, base_url=remote_base_url)
    elif model_name == "llama3.2:latest":
        return Ollama(model="llama3.2:latest", request_timeout=120.0, context_window=4096, base_url=remote_base_url)
    elif model_name == "llama3.3":
        return Ollama(model="llama3.3", request_timeout=120.0, context_window=4096, base_url=remote_base_url)

# Call LLM and parse output
def extract_questions(user_input: str) -> list[str]:
    prompt = prompt_template.format(user_input=user_input)
    llm_model = get_llm(model_name="llama3.2:latest")  # Default to latest model
    response = llm_model.complete(prompt)
    raw_text = response.text.strip()
    print(f"[LLM] Raw response: {raw_text}")
    # If no HR-related content detected
    if "no hr-related questions or concerns are detected" in raw_text.lower():
        return []

    # Extract formatted entries
    question_list = []
    for line in raw_text.split("\n"):
        match = re.match(r"\d+\.\s+\**(.*?)\**:\s+(.*)", line.strip())
        if match:
            label, question = match.groups()
            question_list.append(f"{label.strip()}: {question.strip()}")

    return question_list

# --- Update /process endpoint ---
@app.post("/process")
async def process_message(
    data: UserMessage,
    current_user: dict = Depends(get_current_user)
):
    llm_model = get_llm(model_name=data.model)
    questions = extract_questions(data.message)

    response_text = ""
    if not questions:
        print("[INFO] No HR-related questions found. Generating fallback...")
        fallback_prompt = f"""
            The user said:

            "{data.message}"

            If the message isn't about HR (like leave, claims, benefits, or work policies), respond naturally
            and warmly — as if you're a friendly, empathetic colleague. 
            If the user says something sweet, casual, or emotional (like "I love you", "thank you", or "you're the best"), 
            feel free to respond in kind — e.g., "Awww, thank you!", "You're so kind!", or "That means a lot 🥹".

            If you're unsure what they meant, gently guide them toward HR-related topics like leave, WFH, or company policy — 
            but still sound friendly and non-robotic.

            Your reply should feel human, light-hearted, and understanding.
"""
        chat_engine = index.as_chat_engine(
            chat_mode="context",
            memory=memory,
            system_prompt=(fallback_prompt),
            llm=llm_model
        )
        fallback_response = chat_engine.chat(data.message)
        response_text = fallback_response.response
        result = {"questions": [], "fallback": fallback_response.response}
    else:
        response_text = "\n".join(questions)
        result = {"questions": questions}

    # Log conversation here
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO chatbot_logs (user_id, conversation_id, query, response)
                VALUES (%s, %s, %s, %s)
            """
            user_id = current_user["user_id"]
            conversation_id = str(user_id)  # Or use a real conversation id if you have one

            cursor.execute(sql, (user_id, conversation_id, data.message, response_text))
        conn.commit()
    finally:
        conn.close()

    return result


# --- Update /stream endpoint ---
@app.post("/stream")
async def stream_answer(
    data: UserMessage,
    current_user: dict = Depends(get_current_user)
):
    
    # Set up the LLM based on user role
    role = current_user.get("role")
    country = current_user.get("country")

    if role == "ADMIN":
        retriever = VectorIndexRetriever(index=index, similarity_top_k=5)
    else:
        filters = MetadataFilters(
            filters=[
                MetadataFilter(key=country, value="True", operator=FilterOperator.EQUAL)
            ]
        )
        retriever = VectorIndexRetriever(index=index, similarity_top_k=5, filters=filters)

    llm_model = get_llm(model_name=data.model)
    response_synthesizer = get_response_synthesizer(response_mode="tree_summarize", llm=llm_model, streaming=True)
    query_engine = RetrieverQueryEngine(retriever=retriever, response_synthesizer=response_synthesizer)
    user_prompt = data.message
    
    print(f"[STREAM] Querying with: {data.message}")
    response = query_engine.query(f"{user_prompt}")

    if response is None:
        llm_model = get_llm(model_name="llama3.2:latest")  # Default to latest model
        fallback_text = llm_model.complete(f"You are Verztec's AI HR assistant. The user asked you about: {user_prompt}. "
                              "The information was not found in the index, respond with: "
                              "I am sorry, but I do not have information on (info)."
                              "This might be due to a lack of permissions."
                              f"As a {role}, you are allowed to access documents in {country}."
                              f"User role: {role}, country: {country}.")
        raw_text = fallback_text.text.strip()
        return StreamingResponse(iter([raw_text]), media_type="text/plain")

    '''
    chat_engine = index.as_chat_engine(
            chat_mode="context",
            memory=memory,
            system_prompt=f"""
            You are Verztec's AI HR assistant.
            You have access to the full conversation history and should use it to answer follow-up questions.
            You are able to provide information about HR policies, leave, benefits, claims, WFH, or company policies.
            Answer all questions in a friendly and human-like manner. If you are not confident about the answer,
            you should tell the user that you are not sure and suggest they contact HR directly.
            """,
            llm=llm_model
        )
    response = chat_engine.stream_chat(data.message)
    '''
    # This buffer will store the full response for logging
    full_response = []

    def stream_generator():
        buffer = io.StringIO()
        # Stream the main response content
        try:
            for token in response.response_gen:
                if token is not None:
                    buffer.write(token)
                    yield token
        except Exception as e:
            yield f"\n\n[ERROR streaming response: {e}]"

        def get_real_file(filename):
            base = Path(filename).with_suffix('')
            for ext in [".pdf", ".docx", ".doc"]:
                real_path = base.with_suffix(ext)
                file_path = UPLOAD_DIR / real_path.name
                if file_path.exists():
                    return real_path.name
            return filename  # fallback

        # Generate citations (Only show the unqiue files of the top 3 nodes)
        top_nodes = response.source_nodes[:3]

        cited_docs = {}
        for node_score in top_nodes:
            node = node_score.node
            original = node.metadata.get("source") or node.metadata.get("title")
            if not original:
                continue

            real_file = get_real_file(original)
            if real_file not in cited_docs:
                url = f"http://localhost:8000/download/{quote(real_file)}"
                cited_docs[real_file] = url

        # Yield citations section only if there are valid docs
        if cited_docs:
            yield "\n\n**📄 Cited Documents:**\n"
            for name, url in cited_docs.items():
                yield f"- [{name}]({url})\n"

    # This wrapper allows us to perform logging after streaming is complete
    def streaming_with_logging():
        generator = stream_generator()
        buffer = io.StringIO()
        for token in generator:
            buffer.write(token)
            yield token
        final_response = buffer.getvalue()

        # Log to DB after full response is available
        try:
            conn = get_db()
            with conn.cursor() as cursor:
                sql = """
                    INSERT INTO chatbot_logs (user_id, conversation_id, query, response)
                    VALUES (%s, %s, %s, %s)
                """
                user_id = current_user["user_id"]
                conversation_id = str(user_id)
                cursor.execute(sql, (user_id, conversation_id, user_prompt, final_response))
            conn.commit()
        finally:
            conn.close()

    return StreamingResponse(streaming_with_logging(), media_type="text/plain")


# Download files
@app.get("/download/{filename}")
def download_file(filename: str):
    path = UPLOAD_DIR / filename
    return FileResponse(str(path))


@app.get("/models")
def get_models():
    # List your available models here
    return {
        "models": [
            {"name": "llama3.3", "label": "lunar ai 4"},
            {"name": "llama3.2:latest", "label": "lunar ai 3 large"},
            {"name": "llama3.2:1b", "label": "lunar ai 3 mini"},
        ]
    }



# === Auth Configuration ===
SECRET_KEY = "verztec_secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# === DB Connection ===
def get_db():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

@app.get("/users")
async def get_users():
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users")
            users = cursor.fetchall()  # Now a list of dicts
        return users
    finally:
        conn.close()

@app.get("/list-files", response_model=List[str])
def list_files():
    folder_path = Path(__file__).resolve().parent.parent / "pipeline" / "data" / "raw_data"
    if not folder_path.exists():
        return []
    return [f.name for f in folder_path.iterdir() if f.is_file()]

@app.delete("/delete-file/{filename}")
def delete_file(filename: str):
    folder_path = Path(__file__).resolve().parent.parent / "pipeline" / "data" / "raw_data"
    file_path = folder_path / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        file_path.unlink()
        return JSONResponse(content={"message": f"Deleted '{filename}' successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# === Models ===
class Role(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    USER = "USER"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# === Utility ===
def verify_password(plain_pw, hashed_pw):
    return bcrypt.checkpw(plain_pw.encode('utf-8'), hashed_pw.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# === Routes ===
@app.post("/login", response_model=TokenResponse)
def login_user(user: UserLogin, request: Request):
    db = get_db()
    cursor = db.cursor(pymysql.cursors.DictCursor)
    status = "FAILURE"
    user_id = None

    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        user_record = cursor.fetchone()

        if user_record and verify_password(user.password, user_record["password_hash"]):
            user_id = user_record["user_id"]
            status = "SUCCESS"

            # Store session data
            session_data = {
                "user_id": user_record["user_id"],
                "username": user_record["username"],
                "role": user_record["role"],
                "department": user_record["department"],
                "country": user_record["country"]
            }

            # Generate token
            token = create_access_token(session_data)

            # Store token in Redis with session info (as JSON string)
            redis_client.setex(
                f"user_token:{user_id}",
                ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                json.dumps(session_data)
            )

            # Log successful login
            cursor.execute("""
                INSERT INTO login_logs (user_id, status)
                VALUES (%s, %s)
                """, (user_id, status))

            db.commit()
            return {"access_token": token, "token_type": "bearer"}

        else:
            # Log failed login (if user exists or not)
            if user_record:
                user_id = user_record["user_id"]

            cursor.execute("""
                INSERT INTO login_logs (user_id, status)
                VALUES (%s, %s)
                """, (user_id, status))

            db.commit()
            raise HTTPException(status_code=401, detail="Invalid email or password")

    finally:
        cursor.close()
        db.close()

@app.get("/profile")
def read_profile(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Check if session exists in Redis
        session = redis_client.get(f"user_token:{user_id}")
        if not session:
            raise HTTPException(status_code=401, detail="Session expired or invalid")

        return {"user_id": user_id, "session": json.loads(session)}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# === Conversation Logging Endpoint ===
class ChatLog(BaseModel):
    query: str
    response: str


@app.post("/log_conversation/")
async def log_conversation(
    log: ChatLog,
    current_user: dict = Depends(get_current_user)
):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO chatbot_logs (user_id, conversation_id, query, response)
                VALUES (%s, %s, %s, %s)
            """

            user_id = current_user["user_id"]
            conversation_id = str(user_id)

            cursor.execute(sql, (
                user_id,
                conversation_id,
                log.query,
                log.response
            ))
        conn.commit()
        return {"message": "Conversation logged successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logging failed: {str(e)}")
    finally:
        conn.close()
        
# User model
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    department: str
    role: Role
    country: str

    
# Password hashing
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


# Upload XLSX and insert users
@app.post("/upload-xlsx")
async def upload_xlsx(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")

    try:
        contents = await file.read()
        wb = load_workbook(filename=io.BytesIO(contents))
        sheet = wb.active

        conn = get_db()
        cursor = conn.cursor()
        results = []

        for i, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            username, email, password, department, role, country = row
            line_result = {"line": i, "username": username, "status": "success", "message": "Inserted"}

            # --- Validation ---
            if not username or not role or not country or not department:
                line_result.update({"status": "error", "message": "Missing required fields"})
                results.append(line_result)
                continue

            if current_user["role"] == "MANAGER":
                if role != "USER":
                    raise HTTPException(
                        status_code=400,
                        detail=f"Managers can only create USER accounts"
                    )
                if country != current_user["country"]:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Country must be {current_user['country']}"
                    )
                if department != current_user["department"]:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Department must be {current_user['department']}"
                    )

            if not isinstance(email, str) or not email.endswith("@verztec.com"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid or missing email"
                )

            hashed_pw = hash_password(password)
            
            # --- Insert ---
            try:
                cursor.execute("""
                    INSERT INTO users (username, email, password_hash, department, role, country)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (username, email, hashed_pw, department, role, country))

                created_user_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO upload_user_logs (user_id, created_user_id)
                    VALUES (%s, %s)
                """, (current_user["user_id"], created_user_id))

            except pymysql.err.IntegrityError:
                continue  # Skip duplicate entries

        conn.commit()
        cursor.close()
        conn.close()

        return {"message": "User data processed", "result": results}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

def check_manager_permission(current_user, target_department, target_country):
    if current_user["role"] == "ADMIN":
        return True
    if current_user["role"] == "MANAGER":
        return (current_user["department"] == target_department and
                current_user["country"] == target_country)
    return False

@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    countries: str = Form(...),
    departments: str = Form(...),
    visibility: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    countries_list = json.loads(countries)
    departments_list = json.loads(departments)

    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # --- Save metadata as a sidecar JSON file ---
    meta = {
        "departments": departments_list,
        "countries": countries_list,
        "visibility": visibility,
        "uploaded_by": current_user.get("username"),
    }
    meta_path = file_path.with_suffix(file_path.suffix + ".meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    return {"message": f"File '{file.filename}' uploaded successfully."}


# Handl Logout
@app.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        redis_client.delete(f"user_token:{user_id}")
        return {"message": "Logged out successfully"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Serve React frontend
# app.mount(
#     "/",
#     StaticFiles(directory=r"C:\Users\txcjs\OneDrive\Documents\Homework\Yr 3.1\ICP\Presentation\frontend\dist", html=True),
#     name="static"
# )
