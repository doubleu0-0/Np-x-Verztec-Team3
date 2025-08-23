Code to run ollama externally:
GPU
======
sudo apt update && sudo apt install -y curl git
curl -fsSL https://ollama.com/install.sh | sh
ollama serve

Local
========
ssh -L 11500:localhost:11434 user@192.222.50.109
ssh -L 11500:localhost:11434 ubuntu@192.222.51.0

GPU
=====================
curl http://localhost:11434
ollama pull llama3.3
ollama pull llama3.2
ollama pull llama3.2:1b

ollama run llama3.3
ollama run llama3.2
ollama run llama3.2:1b


Code to start server:
1) uvicorn main:app --host 0.0.0.0 --port 8000
2) npm run dev
3) npm run build
4) & "C:\Users\txcjs\.cloudflared\cloudflared-windows-amd64.exe" tunnel run 2bf2275e-99b1-4aab-ad8f-1d826d7e8dcd
5) cd "C:\Program Files\Redis"
6) redis-server --port 6380

"C:\Users\txcjs\anaconda3\envs\myenv\python.exe" "C:\Users\txcjs\OneDrive\Documents\Homework\Yr 3.1\ICP\plsgivea\pipeline\src\chroma_db_pipeline.py"
"C:\Users\txcjs\anaconda3\envs\myenv\python.exe" "C:\Users\txcjs\OneDrive\Documents\Homework\Yr 3.1\ICP\plsgivea\Watcher.py"


A100 SXM4
