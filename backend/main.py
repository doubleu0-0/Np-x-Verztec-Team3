from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from fastapi import FastAPI
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
llm = Ollama(model="llama3.2:latest", request_timeout=120.0, temperature=0, context_window=4096)
Settings.llm = llm

# FAISS index loading
persist_dir = "../Embedded"
faiss_path = "faiss.index"
faiss_index = faiss.read_index(os.path.join(persist_dir, faiss_path))
vector_store = FaissVectorStore(faiss_index=faiss_index)
storage_context = StorageContext.from_defaults(persist_dir=persist_dir, vector_store=vector_store)
index = load_index_from_storage(storage_context)
query_engine = index.as_query_engine(similarity_top_k=5, streaming = True)

# This your llama-mini
light_llm = Ollama(
    model="llama3.2:1b",
    context_window=1024
)
# Prompt template
prompt_template = """
You are Verztec's AI HR assistant.

Your task is to extract all meaningful HR-related questions or concerns from the user's message.

For each item:
- Assign a concise label (e.g., "Leave entitlement", "Workplace harassment")
- Rewrite the question or concern in a short, clear form — **do not add explanations, notes, or assumptions**
- Only include relevant HR-related content, not exhaustive-(e.g., leave, claims, WFH, policies, misconduct, benefits, office or organisation-related matters)
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

# Call LLM and parse output
def extract_questions(user_input: str) -> list[str]:
    prompt = prompt_template.format(user_input=user_input)
    response = llm.complete(prompt)
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
        fallback = light_llm.complete(fallback_prompt).text.strip()
        return {"questions": [], "fallback": fallback}

    return {"questions": questions}


@app.post("/stream")
async def stream_answer(data: UserMessage):
    def stream_generator():
        print(f"[STREAM] Querying with: {data.message}")
        response = query_engine.query(data.message)

        for token in response.response_gen:
            yield token

    return StreamingResponse(stream_generator(), media_type="text/plain")


@app.post("/generate")
def generate(data: UserMessage):
    prompt = data.message
    response = ollama.chat(model="llama3.2", messages=[{"role": "user", "content": prompt}])
    return {"response": response["message"]["content"]}
