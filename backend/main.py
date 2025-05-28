from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from pydantic import BaseModel
from llama_index.llms.ollama import Ollama
from fastapi.middleware.cors import CORSMiddleware
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from llama_index.vector_stores.faiss import FaissVectorStore
import re
import faiss
from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
import os
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse
from urllib.parse import quote

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up Ollama and HuggingFace embedding
Settings.embed_model = HuggingFaceEmbedding(model_name="intfloat/e5-large-v2")
embed_model = HuggingFaceEmbedding(model_name="intfloat/e5-large-v2")

# Instantiate the Ollama LLM
# llm = Ollama(model="llama3.2:latest", request_timeout=120.0, temperature=0, context_window=4096)
# Settings.llm = llm

# FAISS index loading
persist_dir = "../Embedded"
faiss_path = "faiss.index"
faiss_index = faiss.read_index(os.path.join(persist_dir, faiss_path))
vector_store = FaissVectorStore(faiss_index=faiss_index)
storage_context = StorageContext.from_defaults(persist_dir=persist_dir, vector_store=vector_store)
index = load_index_from_storage(storage_context)
query_engine = index.as_query_engine(similarity_top_k=5, streaming = True)

# This is llama-mini
'''
light_llm = Ollama(
    model="llama3.2:1b",
    context_window=1024
)
'''
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
        return Ollama(model="llama3.2:1b", context_window=1024)
    elif model_name == "llama3.2:latest":
        return Ollama(model="llama3.2:latest", request_timeout=120.0, context_window=4096)

# Call LLM and parse output
def extract_questions(user_input: str) -> list[str]:
    prompt = prompt_template.format(user_input=user_input)
    llm_model = get_llm(model_name="llama3.2:1b")
    response = llm_model.complete(prompt)
    raw_text = response.text.strip()

    # If no HR-related content detected
    if "no hr-related questions or concerns detected" in raw_text.lower():
        return []

    # Extract formatted entries
    question_list = []
    for line in raw_text.split("\n"):
        match = re.match(r"\d+\.\s+\**(.*?)\**:\s+(.*)", line.strip())
        if match:
            label, question = match.groups()
            question_list.append(f"{label.strip()}: {question.strip()}")

    return question_list

# Endpoint
@app.post("/process")
async def process_message(data: UserMessage):
    llm_model = get_llm(data.model)
    questions = extract_questions(data.message)

    if not questions:
        print("[INFO] No HR-related questions found. Generating fallback...")
        fallback_prompt = f"""
        The user said:

        "{data.message}"

        If it's not an HR question, feel free to respond naturally and politely — even if it's something casual or personal like "I love you".
        If it's unclear, gently suggest asking about HR topics like leave, benefits, claims, WFH, or company policies.
        Keep your reply friendly and human-like.
        """
        fallback = llm_model.complete(fallback_prompt).text.strip()
        return {"questions": [], "fallback": fallback}

    return {"questions": questions}


@app.post("/stream")
async def stream_answer(data: UserMessage):
    llm_model = get_llm(data.model)
    def stream_generator():
        print(f"[STREAM] Querying with: {data.message}")
        query_engine = index.as_query_engine(similarity_top_k=5, streaming = True, llm=llm_model)
        response = query_engine.query(data.message)

        # Stream the main response content
        for token in response.response_gen:
            yield token

        # Generate citations (Only show the unqiue files of the top 3 nodes)
        top_nodes = response.source_nodes[:3]

        cited_docs = {}
        for node_score in top_nodes:
            node = node_score.node
            filename = node.metadata.get("source") or node.metadata.get("title")
            if filename and filename not in cited_docs:
                url = f"http://localhost:8000/download/{quote(filename)}"
                cited_docs[filename] = url

        # Yield citations section only if there are valid docs
        if cited_docs:
            yield "\n\n**📄 Cited Documents:**\n"
            for name, url in cited_docs.items():
                yield f"- [{name}]({url})\n"

    return StreamingResponse(stream_generator(), media_type="text/plain")


# Download files
@app.get("/download/{filename}")
def download_file(filename: str):
    path = os.path.join("..", "raw_data", filename)
    return FileResponse(path)


@app.post("/generate")
def generate(data: UserMessage):
    prompt = data.message
    response = ollama.chat(model="llama3.2", messages=[{"role": "user", "content": prompt}])
    return {"response": response["message"]["content"]}


@app.get("/models")
def get_models():
    # List your available models here
    return {
        "models": [
            {"name": "llama3.2:latest", "label": "Llama 3 Large"},
            {"name": "llama3.2:1b", "label": "Llama 3 Mini"},
        ]
    }