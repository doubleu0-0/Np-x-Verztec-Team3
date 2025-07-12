import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning, message=".*grpcio.*", module="opentelemetry.*")
# === FastAPI Core ===
from fastapi import FastAPI, Request, UploadFile, File, HTTPException, Depends, Form, Body
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
from io import BytesIO
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
from llama_index.core.base.embeddings.base import BaseEmbedding

# === Utilities ===
from datetime import datetime, timedelta
from urllib.parse import quote
from enum import Enum
from sentence_transformers import SentenceTransformer
from typing import Generator, Optional, List, Union
import re
import io
import os
import json
import shutil
from pathlib import Path
import itertools
import tempfile
import whisper
import openai
from datetime import datetime, timedelta

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
remote_base_url = "http://localhost:11434"

# Instantiate the Ollama LLM
llm = Ollama(model="llama3.2:latest", request_timeout=120.0, temperature=0, context_window=4096, base_url=remote_base_url)
light_llm = Ollama(model="llama3.2:1b",context_window=1024,base_url=remote_base_url)
Settings.llm = llm
memory = ChatMemoryBuffer.from_defaults(token_limit=1024)


# Initialize ChromaDB client
PERSIST_DIR = PROJECT_ROOT / "pipeline" / "data" / "ChromaDB"
model = SentenceTransformer("intfloat/e5-large-v2")

# ChromaDB embedding function
class HFChromaEmbedding:
    def __init__(self, model):
        self.model = model

    def __call__(self, input: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        if isinstance(input, str):
            input = [f"passage: {input}"]
            return self.model.encode(input, convert_to_numpy=True).tolist()[0]
        else:
            input = [f"passage: {text}" for text in input]
            return self.model.encode(input, convert_to_numpy=True).tolist()

    def name(self) -> str:
        return "HFChromaEmbedding-e5-large-v2"

chroma_embedding_fn = HFChromaEmbedding(model)

# LlamaIndex embedding class
class HFLlamaEmbedding(BaseEmbedding):
    model: SentenceTransformer
    def __init__(self, model):
        super().__init__(model=model)

    def _get_text_embedding(self, text: str) -> List[float]:
        return self.model.encode(f"passage: {text}", convert_to_numpy=True).tolist()

    def _get_text_embeddings(self, texts: List[str]) -> List[List[float]]:
        return self.model.encode([f"passage: {t}" for t in texts], convert_to_numpy=True).tolist()

    def _get_query_embedding(self, query: str) -> List[float]:
        return self.model.encode(f"query: {query}", convert_to_numpy=True).tolist()

    async def _aget_query_embedding(self, query: str) -> List[float]:
        return self._get_query_embedding(query)

llama_embedding_fn = HFLlamaEmbedding(model)

db = chromadb.PersistentClient(path=str(PERSIST_DIR))
chroma_collection = db.get_or_create_collection("quickstart", embedding_function=chroma_embedding_fn)
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
    print(f"[LLM] Extracted questions: {question_list}")
    return question_list


@app.post("/process")
async def process_message(
    data: UserMessage,
    current_user: dict = Depends(get_current_user)
):
    llm_model = get_llm(model_name=data.model)
    questions = extract_questions(data.message)
    user_prompt = data.message

    if not questions:
        print("[INFO] No HR-related questions found. Generating fallback...")
        fallback_prompt = f"""
        The user said: "{data.message}"
        You are Verztec's AI HR assistant. The user did not ask any HR-related questions or concerns.
        If the message isn't about HR (like leave, claims, benefits, or work policies), reply in a super casual, friendly manner. 
        No formal greetings, no sign-offs, no long explanations. Just a short, warm, human reply.
        If the user says something sweet or emotional (like "thank you" or "you're the best"), feel free to respond in kind—e.g., "Aww, thanks!", "You're awesome!", or use emojis.
        If you're not sure what they meant, gently ask if they have any HR-related questions, but keep it light and informal.

        Examples:
        User: Hi
        Assistant: Hey! 😊

        User: Thanks!
        Assistant: Aww, thank you! Let me know if you have any HR questions.

        User: I love you
        Assistant: Haha, you're the best! ❤️

        User: Hello
        Assistant: Hi there! How can I help you today?

        Now, reply to the user:
        """
        print(f"[Process] Querying with: {user_prompt}")
        query_engine = index.as_query_engine(streaming=True, llm=llm_model)
        response = query_engine.query(f"{fallback_prompt}")
    
        def stream_generator():
            buffer = io.StringIO()
            try:
                for token in response.response_gen:
                    if token is not None:
                        buffer.write(token)
                        yield token
            except Exception as e:
                yield f"\n\n[ERROR streaming response: {e}]"

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
    else:
        # Stream the questions as a single JSON object (one chunk)
        import json
        def questions_stream():
            yield json.dumps({"questions": questions})
        return StreamingResponse(questions_stream(), media_type="application/json")


@app.post("/stream")
async def stream_answer(
    data: UserMessage,
    current_user: dict = Depends(get_current_user)
):
    # Set up the LLM based on user role
    role = current_user.get("role")
    country = current_user.get("country")
    department = current_user.get("department")

    def normalize_key(key):
        return key.strip()

    country_key = normalize_key(country)
    department_key = normalize_key(department)


    if role == "ADMIN":
        retriever = VectorIndexRetriever(index=index, similarity_top_k=5)
    else:
        filters = MetadataFilters(
            filters=[
                MetadataFilter(key=country_key, value="True", operator=FilterOperator.EQ),
                MetadataFilter(key=department_key, value="True", operator=FilterOperator.EQ)
            ]
        )
        retriever = VectorIndexRetriever(index=index, similarity_top_k=5, filters=filters)

    llm_model = get_llm(model_name=data.model)
    response_synthesizer = get_response_synthesizer(response_mode="tree_summarize", llm=llm_model, streaming=True)
    query_engine = RetrieverQueryEngine(retriever=retriever, response_synthesizer=response_synthesizer)
    user_prompt = data.message

    print(f"[STREAM] Querying with: {data.message}")
    response = query_engine.query(f"{user_prompt}")

    # Helper to check for boilerplate/empty responses
    def is_response_empty(resp):
        BOILERPLATE = [
            "no response",
            "no relevant information found",
            "no answer found",
            "no content",
            "empty response"
        ]
        if resp is None:
            return True
        if hasattr(resp, "response"):
            text = str(resp.response).strip().lower()
            if not text or text in BOILERPLATE:
                return True
        if hasattr(resp, "response_gen"):
            try:
                gen = resp.response_gen
                peeked = list(itertools.islice(gen, 3))
                # Debug: print the peeked chunks
                print("[DEBUG] Peeked streaming chunks:")
                for i, chunk in enumerate(peeked):
                    print(f"  Chunk {i+1}: {repr(chunk)}")
                # Re-chain for later streaming
                resp.response_gen = itertools.chain(peeked, gen)
                joined = " ".join(str(t).strip().lower() for t in peeked if t)
                for phrase in BOILERPLATE:
                    if joined.startswith(phrase):
                        return True
                if not joined:
                    return True
            except Exception as e:
                print(f"[DEBUG] Exception while peeking response_gen: {e}")
                return True
        return False

    is_empty = is_response_empty(response)

    if is_empty:
        print("Empty Response")
        llm_model = get_llm(model_name="llama3.2:latest")
        fallback_text = llm_model.complete(
            f"You are Verztec's AI HR assistant. The user asked you about: {user_prompt}. "
            "The information was not found in the index. "
            "Respond ONLY in this exact format and do not add any extra information, tips, suggestions, or explanations:\n\n"
            "I am sorry, but I do not have information on (info).\n"
            "This might be due to a lack of permissions.\n"
            f"As a {role}, you are allowed to access documents in {country}.\n"
            f"User role: {role}, country: {country}. User question: {user_prompt}\n"
        )
        raw_text = fallback_text.text.strip()
        def fallback_stream():
            yield raw_text
        return StreamingResponse(fallback_stream(), media_type="text/plain")

    ''' # This the old one with chat engine
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

    def stream_generator():
        buffer = io.StringIO()
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
async def get_users(current_user: dict = Depends(get_current_user)):
    # Only allow ADMIN and MANAGER roles to view users
    if current_user["role"] not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view users")
    
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            if current_user["role"] == "MANAGER":
                # Managers only see users in their own country
                cursor.execute("""
                    SELECT user_id, username, email, role, department, country, updated_at
                    FROM users
                    WHERE country = %s
                    ORDER BY updated_at DESC
                """, (current_user["country"],))
            else:
                # Admins see all users
                cursor.execute("""
                    SELECT user_id, username, email, role, department, country, updated_at
                    FROM users
                    ORDER BY updated_at DESC
                """)
            users = cursor.fetchall()
            return users
    except Exception as e:
        print("ERROR in /users:", e)
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")
    finally:
        conn.close()


@app.get("/files")
async def get_files(current_user: dict = Depends(get_current_user)):
    # Only allow ADMIN and MANAGER roles to view files
    if current_user["role"] not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view files")
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            if current_user["role"] == "MANAGER":
                # Managers only see files for their country and department
                cursor.execute("""
                    SELECT 
                        f.file_id,
                        f.file_name,
                        u.username AS uploaded_by,
                        f.countries,
                        f.departments,
                        f.upload_time
                    FROM files f
                    LEFT JOIN users u ON f.uploaded_by = u.user_id
                    WHERE FIND_IN_SET(%s, REPLACE(f.countries, ', ', ',')) > 0
                    ORDER BY f.upload_time DESC
                """, (current_user["country"],))
            else:
                # Admins see all files
                cursor.execute("""
                    SELECT 
                        f.file_id,
                        f.file_name,
                        u.username AS uploaded_by,
                        f.countries,
                        f.departments,
                        f.upload_time
                    FROM files f
                    LEFT JOIN users u ON f.uploaded_by = u.user_id
                    ORDER BY f.upload_time DESC
                """)
            files = cursor.fetchall()
            # Convert bytes/None to string/list as needed
            for file in files:
                if isinstance(file["countries"], bytes):
                    file["countries"] = file["countries"].decode()
                if isinstance(file["departments"], bytes):
                    file["departments"] = file["departments"].decode()
            return files
    except Exception as e:
        print("ERROR in /files:", e)
        raise HTTPException(status_code=500, detail=f"Failed to fetch files: {str(e)}")
    finally:
        conn.close()


@app.get("/list-files", response_model=List[str])
def list_files():
    folder_path = Path(__file__).resolve().parent.parent / "pipeline" / "data" / "raw_data"
    if not folder_path.exists():
        return []
    return [f.name for f in folder_path.iterdir() if f.is_file()]

@app.delete("/delete-file/{filename}")
def delete_file(filename: str, current_user: dict = Depends(get_current_user)):
    folder_path = Path(__file__).resolve().parent.parent / "pipeline" / "data" / "raw_data"
    file_path = folder_path / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # Delete from ChromaDB and meta files first
        delete_docs_by_filename(filename)

        # --- Log deletion to file_deletion_logs and delete from DB ---
        conn = get_db()
        try:
            with conn.cursor() as cursor:
                # Fetch file info before deletion
                cursor.execute("SELECT * FROM files WHERE file_name = %s", (filename,))
                file_row = cursor.fetchone()
                if not file_row:
                    raise HTTPException(status_code=404, detail="File not found in database")

                # Log deletion
                cursor.execute("""
                    INSERT INTO file_deletion_logs (
                        deleted_file_name, deleted_file_type, department, access_level, file_path,
                        countries, batch_id, uploaded_by_username, deleted_by_username, deleted_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    file_row["file_name"],
                    file_row["file_type"],
                    file_row["department"],
                    file_row["access_level"],
                    file_row["file_path"],
                    file_row["countries"],
                    file_row.get("batch_id"),
                    # Get uploader username
                    get_username_by_user_id(file_row["uploaded_by"], cursor),
                    current_user.get("username"),
                    datetime.now()
                ))

                # Delete from files table
                cursor.execute("DELETE FROM files WHERE file_name = %s", (filename,))
            conn.commit()
        finally:
            conn.close()

        # Delete the file from disk
        file_path.unlink()
        return JSONResponse(content={"message": f"Deleted '{filename}' successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_username_by_user_id(user_id, cursor):
    cursor.execute("SELECT username FROM users WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()
    return user["username"] if user else None

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
        wb = load_workbook(filename=BytesIO(await file.read()), data_only=True)
        if "users to add" in wb.sheetnames:
            sheet = wb["users to add"]
        else:
            sheet = wb.active  # fallback to first sheet if not found

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

            if not isinstance(email, str) or not email.endswith("@gmail.com"):
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
    current_user: dict = Depends(get_current_user)
):
    countries_list = json.loads(countries)
    departments_list = json.loads(departments)

    file_path = UPLOAD_DIR / file.filename
    
    try:
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Save metadata as sidecar JSON file
        meta = {
            "departments": departments_list,
            "countries": countries_list,
            "uploaded_by": current_user.get("username"),
            "upload_time": datetime.now().isoformat()
        }
        meta_path = file_path.with_suffix(file_path.suffix + ".meta.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
        
        # Log to database
        conn = get_db()
        try:
            with conn.cursor() as cursor:
                # Get user ID - FIXED: use user_id column
                cursor.execute("SELECT user_id FROM users WHERE username = %s", (current_user.get("username"),))
                user_result = cursor.fetchone()
                user_id = user_result["user_id"] if user_result else 1
                
                # Insert into files table
                cursor.execute("""
                    INSERT INTO files (file_name, file_type, uploaded_by, department, access_level, file_path, 
                                     countries, departments, upload_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    file.filename,
                    file_path.suffix.lstrip(".").lower(),
                    user_id,
                    ",".join(departments_list),
                    "FILTERED",
                    str(file_path),
                    ",".join(countries_list),
                    ",".join(departments_list),
                    datetime.now()
                ))
                
                # INSERT INTO upload_file_logs table
                cursor.execute("""
                    INSERT INTO upload_file_logs (user_id, username, filename)
                    VALUES (%s, %s, %s)
                """, (
                    user_id,
                    current_user.get("username"),
                    file.filename
                ))
                
                conn.commit()
        finally:
            conn.close()
        
        return {"message": "File uploaded successfully", "filename": file.filename}
        
    except Exception as e:
        # Clean up files if DB insert fails
        if file_path.exists():
            file_path.unlink()
        if 'meta_path' in locals() and meta_path.exists():
            meta_path.unlink()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/batch-upload-files")
async def batch_upload_files(
    files: List[UploadFile] = File(...),
    countries: str = Form(...),
    departments: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    countries_list = json.loads(countries)
    departments_list = json.loads(departments)
    
    uploaded_files = []
    failed_files = []
    
    # Create a batch metadata file to signal the watcher
    batch_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    batch_meta_path = UPLOAD_DIR / f".batch_upload_{batch_id}.processing"
    
    try:
        # Create batch processing indicator
        with open(batch_meta_path, "w") as f:
            json.dump({
                "batch_id": batch_id,
                "total_files": len(files),
                "status": "processing",
                "started_at": datetime.now().isoformat()
            }, f)
        
        # Upload all files with their metadata AND log to database one by one
        for file in files:
            try:
                # Save the file
                file_path = UPLOAD_DIR / file.filename
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                # Save metadata as sidecar JSON file
                meta = {
                    "departments": departments_list,
                    "countries": countries_list,
                    "uploaded_by": current_user.get("username"),
                    "batch_id": batch_id,
                    "upload_time": datetime.now().isoformat()
                }
                meta_path = file_path.with_suffix(file_path.suffix + ".meta.json")
                with open(meta_path, "w", encoding="utf-8") as f:
                    json.dump(meta, f, indent=2)
                
                # Log to database (one by one, just like /upload-file)
                conn = get_db()
                try:
                    with conn.cursor() as cursor:
                        # Get user ID
                        cursor.execute("SELECT user_id FROM users WHERE username = %s", (current_user.get("username"),))
                        user_result = cursor.fetchone()
                        user_id = user_result["user_id"] if user_result else 1
                        
                        # Insert into files table
                        cursor.execute("""
                            INSERT INTO files (file_name, file_type, uploaded_by, department, access_level, file_path, 
                                             countries, departments, batch_id, upload_time)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            file.filename,
                            file_path.suffix.lstrip(".").lower(),
                            user_id,
                            ",".join(departments_list),
                            "FILTERED",
                            str(file_path),
                            ",".join(countries_list),
                            ",".join(departments_list),
                            batch_id,
                            datetime.now()
                        ))
                        
                        # INSERT INTO upload_file_logs table
                        cursor.execute("""
                            INSERT INTO upload_file_logs (user_id, username, filename)
                            VALUES (%s, %s, %s)
                        """, (
                            user_id,
                            current_user.get("username"),
                            file.filename
                        ))
                        
                        conn.commit()
                finally:
                    conn.close()
                
                uploaded_files.append(file.filename)
                print(f"✅ File {file.filename} uploaded and logged to both tables")
                
            except Exception as e:
                failed_files.append({"filename": file.filename, "error": str(e)})
                print(f"❌ Failed to upload {file.filename}: {e}")
                
                # Clean up file if something goes wrong
                if 'file_path' in locals() and file_path.exists():
                    file_path.unlink()
                if 'meta_path' in locals() and meta_path.exists():
                    meta_path.unlink()
        
        # Update batch status to completed
        with open(batch_meta_path, "w") as f:
            json.dump({
                "batch_id": batch_id,
                "total_files": len(files),
                "uploaded_files": len(uploaded_files),
                "failed_files": len(failed_files),
                "status": "completed",
                "started_at": datetime.now().isoformat(),
                "completed_at": datetime.now().isoformat()
            }, f)
        
        # Rename to trigger watcher (remove .processing extension)
        final_batch_path = UPLOAD_DIR / f".batch_upload_{batch_id}.json"
        batch_meta_path.rename(final_batch_path)
        
        return {
            "message": f"Batch upload completed. {len(uploaded_files)} files uploaded successfully.",
            "uploaded_files": uploaded_files,
            "failed_files": failed_files,
            "batch_id": batch_id
        }
        
    except Exception as e:
        # Clean up on error
        if batch_meta_path.exists():
            batch_meta_path.unlink()
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")


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

@app.post("/verify-admin-password")
async def verify_admin_password(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Get the user's stored password hash from database
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT password_hash FROM users WHERE user_id = %s", (current_user["user_id"],))
            user_record = cursor.fetchone()
            
            if not user_record:
                raise HTTPException(status_code=404, detail="User not found")
            # Hash the provided password and compare with stored hash
            if verify_password(data.get("password"), user_record["password_hash"]):
                return {"success": True}
            else:
                raise HTTPException(status_code=401, detail="Invalid password")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password verification failed: {str(e)}")
    finally:
        conn.close()

# for speech-to-textAdd commentMore actions
# change to medium or large for better performance only with GPU
model = whisper.load_model("base")

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not file:
        return {"text": "No file uploaded."}

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Load, process, and transcribe audio
        audio = whisper.load_audio(tmp_path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(model.device)

        # Detect language
        _, probs = model.detect_language(mel)
        detected_lang = max(probs, key=probs.get)
        print(f"Detected language: {detected_lang}")

        options = whisper.DecodingOptions(language=detected_lang)
        result = whisper.decode(model, mel, options)

        return {"text": result.text}
    finally:
        os.remove(tmp_path)

# for chat search functionality
@app.get("/search")
def search_chats(q: str = ""):
    connection = get_db()
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:  # <-- Use DictCursor here
            if q.strip() == "":
                # Return chats created in the last 30 days
                thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
                sql = """
                    SELECT log_id, query, response, created_at
                    FROM chatbot_logs
                    WHERE created_at >= %s
                    ORDER BY created_at DESC
                """
                cursor.execute(sql, (thirty_days_ago,))
            else:
                # Split search query into words (and ignore very short/common words)
                words = [word.lower() for word in q.strip().split() if len(word) >= 1]
                if not words:
                    return []

                # Build dynamic WHERE clause: all words must be present
                like_clauses = " AND ".join([
                    "(LOWER(query) LIKE %s OR LOWER(response) LIKE %s)"
                    for _ in words
                ])
                sql = f"""
                    SELECT log_id, query, response, created_at
                    FROM chatbot_logs
                    WHERE {like_clauses}
                    ORDER BY created_at DESC
                    LIMIT 20
                """
                params = []
                for word in words:
                    wildcard = f"%{word}%"
                    params.extend([wildcard, wildcard])  # one for query, one for response

                cursor.execute(sql, params)

            rows = cursor.fetchall()

            results = [
                {
                    "log_id": row["log_id"],
                    "query": row["query"],
                    "response": row["response"],
                    "created_at": row["created_at"].isoformat() if row["created_at"] else None
                }
                for row in rows
            ]

            return results
    finally:
        connection.close()

# for chat search functionality
@app.get("/chat-log/{log_id}")
def get_chat_log(log_id: int):
    connection = get_db()
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT query, response
                FROM chatbot_logs
                WHERE log_id = %s
            """
            cursor.execute(sql, (log_id,))
            rows = cursor.fetchall()

            if not rows:
                raise HTTPException(status_code=404, detail="Log not found")

            messages = []
            for row in rows:
                messages.append({"role": "user", "content": row["query"]})
                messages.append({"role": "assistant", "content": row["response"]})

            return {"messages": messages}
    finally:
        connection.close()

# Serve the pipeline/misc folder as /static
app.mount(
    "/static",
    StaticFiles(directory=str(PROJECT_ROOT / "pipeline" / "misc")),
    name="static",
)

@app.put("/users/{user_id}")
async def update_user(
    user_id: int,
    data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    # Fetch target user
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            target = cursor.fetchone()
            if not target:
                raise HTTPException(status_code=404, detail="User not found")

            # Only ADMIN can edit anyone. MANAGER can only edit USER or MANAGER in their own dept/country, not ADMINs.
            if current_user["role"] == "MANAGER":
                if target["role"] == "ADMIN":
                    raise HTTPException(status_code=403, detail="Managers cannot edit admins")
                if target["department"].strip().lower() != current_user["department"].strip().lower() or \
                   target["country"].strip().lower() != current_user["country"].strip().lower():
                    raise HTTPException(status_code=403, detail="Managers can only edit users in their own department and country")
                # Managers cannot set anyone to ADMIN
                if "role" in data and data["role"] == "ADMIN":
                    raise HTTPException(status_code=403, detail="Managers cannot set role to ADMIN")

            # Update allowed fields
            allowed_fields = ["email", "department", "country", "role"]

            updates = []
            params = []
            audit_logs = []
            now = datetime.now()

            for field in allowed_fields:
                if field in data and data[field] != target.get(field):
                    updates.append(f"{field} = %s")
                    params.append(data[field])
                    # Prepare audit log for this field
                    audit_logs.append({
                        "target_username": target["username"],
                        "changed_by_username": current_user["username"],
                        "field_name": field,
                        "old_value": target.get(field),
                        "new_value": data[field],
                        "changed_at": now
                    })

            if not updates:
                raise HTTPException(status_code=400, detail="No valid fields to update")
            
            # Update the database
            updates.append("updated_at = %s")
            params.append(now)
            params.append(user_id)
            sql = f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s"
            cursor.execute(sql, params)

            # Insert audit logs
            for log in audit_logs:
                cursor.execute(
                    """
                    INSERT INTO user_update_logs (target_username, changed_by_username, field_name, old_value, new_value, changed_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        log["target_username"],
                        log["changed_by_username"],
                        log["field_name"],
                        log["old_value"],
                        log["new_value"],
                        log["changed_at"]
                    )
                )

            conn.commit()
            return {"message": "User updated successfully"}
    finally:
        conn.close()

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            target = cursor.fetchone()
            if not target:
                raise HTTPException(status_code=404, detail="User not found")
            # Prevent users from deleting themselves
            if user_id == current_user["user_id"]:
                raise HTTPException(status_code=403, detail="You cannot delete your own account.")
            if current_user["role"] == "MANAGER":
                if target["role"] == "ADMIN":
                    raise HTTPException(status_code=403, detail="Managers cannot delete admins")
                # Managers can delete other managers and users in their own department and country
                if target["department"].strip().lower() != current_user["department"].strip().lower() or \
                   target["country"].strip().lower() != current_user["country"].strip().lower():
                    raise HTTPException(status_code=403, detail="Managers can only delete users in their own department and country")
            # Log deletion
            cursor.execute(
                """
                INSERT INTO user_deletion_logs (
                    deleted_username, deleted_email, department, role, country, deleted_by_username, deleted_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    target["username"],
                    target["email"],
                    target["department"],
                    target["role"],
                    target["country"],
                    current_user["username"],
                    datetime.now()
                )
            )
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
            conn.commit()
            return {"message": "User deleted successfully"}
    finally:
        conn.close()


@app.put("/update-file/{filename}")
async def update_file_metadata(
    filename: str,
    departments: List[str] = Form(...),
    countries: List[str] = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Updates file metadata (departments, countries) for a given file.
    - Updates all sidecar .meta.json files with the same base name
    - Updates the database record
    - Updates ChromaDB document metadata for this file
    - Logs changes to file_update_logs
    """
    file_path = UPLOAD_DIR / filename
    meta_path = file_path.with_suffix(file_path.suffix + ".meta.json")
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Metadata file not found")

    # Load metadata for the file (for passing to update_docs_with_metadata)
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    meta["departments"] = departments
    meta["countries"] = countries

    # Update DB and log changes
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # Get file_id and current values for logging
            cursor.execute("SELECT file_id, departments, countries FROM files WHERE file_name = %s", (filename,))
            file_row = cursor.fetchone()
            if not file_row:
                raise HTTPException(status_code=404, detail="File not found in database")
            file_id = file_row["file_id"]
            old_departments = file_row["departments"] or ""
            old_countries = file_row["countries"] or ""

            # Update the files table
            cursor.execute(
                "UPDATE files SET departments=%s, countries=%s WHERE file_name=%s",
                (",".join(departments), ",".join(countries), filename)
            )

            now = datetime.now()
            # Log changes for departments
            if old_departments != ",".join(departments):
                cursor.execute(
                    """
                    INSERT INTO file_update_logs (file_id, file_name, changed_by_username, field_name, old_value, new_value, changed_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        file_id,
                        filename,
                        current_user.get("username"),
                        "departments",
                        old_departments,
                        ",".join(departments),
                        now
                    )
                )
            # Log changes for countries
            if old_countries != ",".join(countries):
                cursor.execute(
                    """
                    INSERT INTO file_update_logs (file_id, file_name, changed_by_username, field_name, old_value, new_value, changed_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        file_id,
                        filename,
                        current_user.get("username"),
                        "countries",
                        old_countries,
                        ",".join(countries),
                        now
                    )
                )
        conn.commit()
    finally:
        conn.close()

    # Update ChromaDB and ALL .meta.json files with the same base name
    update_docs_with_metadata(filename, meta)

    return {"message": "File metadata updated"}


def update_docs_with_metadata(filename, file_metadata):
    """
    Updates all Chroma documents whose 'title' in metadata matches the given filename (tries all common extensions).
    Sets specified department and country flags. Preserves 'uploaded_by' and 'upload_time' if already set.
    Also updates all .meta.json files with the same base name.
    """
    import os
    import glob
    from datetime import datetime

    ALL_DEPARTMENTS = [
        "Human Resource", "Admin & Operations", "Project Management", "Procurement",
        "IT", "Marketing", "Business Development", "Finance", "Service Delivery"
    ]

    ALL_COUNTRIES = [
        "Singapore", "United Kingdom", "United States", "Thailand", "Indonesia",
        "Korea", "China", "Japan", "Vietnam", "Myanmar"
    ]

    # Use the provided lists
    departments = file_metadata.get("departments", [])
    countries = file_metadata.get("countries", [])

    # Extract base filename without extension
    base_name = os.path.splitext(filename)[0]
    possible_exts = [".pdf", ".doc", ".docx", ".txt"]
    updated_any = False

    # Update ChromaDB docs for all possible extensions
    all_docs = chroma_collection.get(limit=1000)
    for ext in possible_exts:
        full_title = f"{base_name}{ext}"
        matching_indices = [
            i for i, metadata in enumerate(all_docs["metadatas"])
            if metadata.get("title", "").lower() == full_title.lower()
        ]
        if not matching_indices:
            print(f"No documents found with title '{full_title}'")
            continue

        for i in matching_indices:
            doc_id = all_docs["ids"][i]
            original_doc = all_docs["documents"][i]
            original_metadata = all_docs["metadatas"][i]
            updated_metadata = original_metadata.copy()
            for dept in ALL_DEPARTMENTS:
                updated_metadata[dept] = "True" if dept in departments else "False"
            for country in ALL_COUNTRIES:
                updated_metadata[country] = "True" if country in countries else "False"
            if "uploaded_by" not in updated_metadata:
                updated_metadata["uploaded_by"] = file_metadata.get("uploaded_by", "")
            if "upload_time" not in updated_metadata:
                updated_metadata["upload_time"] = file_metadata.get("upload_time", datetime.now().isoformat())
            chroma_collection.update(
                ids=[doc_id],
                documents=[original_doc],
                metadatas=[updated_metadata]
            )
            print(f"Updated: {doc_id} ({original_metadata.get('title')})")
            updated_any = True

    if not updated_any:
        print("No matching documents found for any of the tried extensions.")

    # Update all .meta.json files with the same base name
    meta_files = glob.glob(str(UPLOAD_DIR / f"{base_name}.*.meta.json"))
    for meta_path in meta_files:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        meta["departments"] = departments
        meta["countries"] = countries
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

def delete_docs_by_filename(filename):
    """
    Deletes all Chroma documents whose 'title' in metadata matches the given filename 
    (tries all common extensions). Also deletes any associated .meta.json files.
    """
    import os
    import glob

    # Extract base filename without extension
    base_name = os.path.splitext(filename)[0]
    possible_exts = [".pdf", ".doc", ".docx", ".txt"]
    deleted_any = False

    # Check ChromaDB collection
    all_docs = chroma_collection.get(limit=1000)

    for ext in possible_exts:
        full_title = f"{base_name}{ext}"
        # Collect all matching doc IDs
        matching_ids = [
            all_docs["ids"][i]
            for i, metadata in enumerate(all_docs["metadatas"])
            if metadata.get("title", "").lower() == full_title.lower()
        ]

        if not matching_ids:
            print(f"No documents found with title '{full_title}'")
            continue

        # Delete all matching docs at once
        chroma_collection.delete(ids=matching_ids)
        print(f"Deleted documents with title '{full_title}' (IDs: {matching_ids})")
        deleted_any = True

    if deleted_any:
        print("Deletion successful.")
    else:
        print("No documents found for deletion.")

    # Delete associated .meta.json files
    meta_files = glob.glob(str(UPLOAD_DIR / f"{base_name}.*.meta.json"))
    for meta_path in meta_files:
        try:
            os.remove(meta_path)
            print(f"Deleted meta file: {meta_path}")
        except Exception as e:
            print(f"Error deleting meta file {meta_path}: {e}")
            
class FeedbackCreate(BaseModel):
    category: str
    message: str
    rating: Optional[int] = None
    
@app.post("/feedback")
async def create_feedback(feedback: FeedbackCreate):
    try:
        connection = get_db()  # Use your existing get_db function
        cursor = connection.cursor()
        query = "INSERT INTO feedback (category, message, rating) VALUES (%s, %s, %s)"
        cursor.execute(query, (feedback.category, feedback.message, feedback.rating))
        connection.commit()
        cursor.close()
        connection.close()
        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FeedbackStatusUpdate(BaseModel):
    status: str

class FeedbackResponse(BaseModel):
    id: int
    message: str
    category: str
    rating: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime
    
@app.get("/api/feedback", response_model=List[FeedbackResponse])
async def get_feedback(current_user: dict = Depends(get_current_user)):
    try:
        connection = get_db()
        cursor = connection.cursor()
        
        # Fetch all feedback from database
        query = """
        SELECT id, message, category, rating, status, created_at, updated_at 
        FROM feedback 
        ORDER BY created_at DESC
        """
        cursor.execute(query)
        feedbacks = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return feedbacks
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feedback: {str(e)}")

@app.put("/api/feedback/{feedback_id}/status")
async def update_feedback_status(
    feedback_id: int, 
    status_update: FeedbackStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        
        # Validate status
        valid_statuses = ["pending", "reviewed", "resolved"]
        if status_update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        connection = get_db()
        cursor = connection.cursor()
        
        # Check if feedback exists
        check_query = "SELECT id FROM feedback WHERE id = %s"
        cursor.execute(check_query, (feedback_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        # Update feedback status
        update_query = "UPDATE feedback SET status = %s, updated_at = NOW() WHERE id = %s"
        cursor.execute(update_query, (status_update.status, feedback_id))
        connection.commit()
        cursor.close()
        connection.close()
        
        return {"message": "Feedback status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating feedback status: {str(e)}")
