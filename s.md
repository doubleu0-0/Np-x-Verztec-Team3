# 📌 NP Team 3 × Verztec Lunar AI

**Lunar AI** is an intelligent chatbot designed to handle corporate queries for Verztec. This project integrates a modern web interface built with Vite, React, alongside a FastAPI backend and Redis for caching.

---

## 📑 Table of Contents

* [About](#about)
* [Tech Stack](#tech-stack)
* [System Architecture](#system-architecture)
* [Backend Setup](#backend-setup)

  * [Dependencies](#backend-dependencies)
  * [Environment Variables](#environment-variables)
  * [Running the Backend](#running-the-backend)
* [Frontend Setup](#frontend-setup)

  * [Dependencies](#frontend-dependencies)
  * [Running the Frontend](#running-the-frontend)
* [Redis Setup](#redis-setup)
* [Troubleshooting](#troubleshooting)
* [License](#license)

---

## 📖 About

**Lunar AI** serves as an AI-powered corporate assistant capable of responding to common organisational queries for Verztec. It leverages the Ollama Llama 3.2 model as its underlying large language model and is built for modularity, ease of deployment, and responsive performance.

---

## 🛠️ Tech Stack

* **Backend:** FastAPI, Ollama Llama 3.2
* **Frontend:** Vite, React, TailwindCSS, Three.js (`three`), React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
* **Cache/Message Broker:** Redis
* **Language:** Python 3.8, JavaScript (ES6)

---

## 🗂️ System Architecture

```plaintext
Client (Vite + React + TailwindCSS)
          │
          ├── HTTP API Calls (Axios)
          │
    FastAPI Backend (Python)
          │
   Ollama Llama 3.2 Model
          │
         Redis
```

---

## ⚙️ Backend Setup

### 🔗 Backend Dependencies

Ensure you have Python 3.8 installed.
Confirm its location with:

```powershell
Get-Command python
```

Take note of the *Source* path, for example: `C:\Program Files\Python38\python.exe`.

---

### 🔑 Environment Variables

Create a `.env` file within the `backend` directory containing:

```env
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
```

Populate these variables with the relevant database connection details.

---

### 🚦 Running the Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment (example for PowerShell):

   ```powershell
   & "C:\Program Files\Python38\python.exe" -m venv venv
   ```

3. Activate the virtual environment:

   * **Windows (PowerShell):**

     ```powershell
     .\venv\Scripts\activate.ps1
     ```

   * **Mac/Linux:**

     ```bash
     source ./venv/bin/activate
     ```

4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Pull the required Ollama models:

   ```bash
   ollama pull llama3.2
   ollama pull llama3.2:1b
   ```

6. Run the FastAPI server with hot reload:

   ```bash
   uvicorn main:app --reload
   ```

---

## 🧩 Frontend Setup

### 📦 Frontend Dependencies

Ensure you have Node.js installed.

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install core dependencies:

   ```bash
   npm install
   ```

3. Install additional packages:

   ```bash
   npm install axios
   npm install three@0.153.0 @react-three/fiber@8.13.6 @react-three/drei@9.53.1 --save
   ```

---

### 🚀 Running the Frontend

Start the local development server:

```bash
npm run dev
```

Access the application via the Vite local development URL displayed in your terminal output.

---

## 🗄️ Redis Setup

### 📌 Installation

Download Redis for Windows:

> [Redis Windows MSI — tporadowski](https://github.com/tporadowski/redis/releases)

Accept the default configuration during setup.

---

### ⚡ Running Redis

Launch the Redis server:

```powershell
cd "C:\Program Files\Redis"
.\redis-server.exe --port 6380
```

---

## 🛠️ Troubleshooting

* **Virtual Environment Issues:**
  If the virtual environment fails to activate, ensure your PowerShell execution policy allows script execution.

  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

* **Port Conflicts:**
  Confirm that ports used by FastAPI (default `8000` or custom) and Redis (`6380`) are not blocked by firewalls.

* **Ollama Model Not Found:**
  Re-run `ollama pull` commands if the model is not detected.

---

## 📄 License

This project is for educational purposes under Ngee Ann Polytechnic’s collaboration with Verztec. Please refer to your team’s license guidelines or institutional policy for external usage.

---

## ✅ Contributing

For internal team use: keep branches well named and submit pull requests with clear commit messages.

---

**If you wish**, I can format this into a ready-to-paste `README.md` and supply you with an optional `docs/` folder template (for endpoints, component explanations, or database schema). Let me know and I shall prepare it straight away.
