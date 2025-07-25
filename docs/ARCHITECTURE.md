# System Architecture
  
The system is composed of three primary services that communicate internally:

![Architecture Diagram](../docs/architecture.png)

## Component Breakdown

### 1. Frontend (Vite + React)
- Hosts the user interface
- Sends REST API requests to the backend
- Displays translated chatbot responses and sentiment outputs

### 2. Backend (FastAPI)
- Receives frontend requests
- Performs user authentication
- Passes natural language prompts to the `pipeline/` module

### 3. Pipeline
- Loads and caches the LLaMA model via Ollama
- Embeds queries and performs FAISS similarity search
- Classifies sentiment and manages translations (via Argos Translate)
- Uses Redis for caching expensive operations

## Data Flow Summary

```plaintext
User → React → FastAPI → Pipeline → Ollama / FAISS / Redis → Response → React UI
