# NP x Verztec — Team 3

## Lunar AI: AI-Powered Chatbot with Avatar

Lunar AI is an intelligent assistant designed to **free up employees’ time** by automating repetitive corporate-related queries, enabling teams to focus on what truly drives the business.

---

## 🧰 Tech Stack

| Component        | Technology                     |
|------------------|--------------------------------|
| Backend          | FastAPI + Python               |
| Frontend         | Vite + React                   |
| Database         | MySQL (local instance)         |
| Vector Store     | ChromaDB                       |
| Caching Layer    | Redis (local instance)         |
| Model Inference  | LLaMA 3.2 via Ollama (self-hosted) |

---

## 📁 Key Project Structure

root/

├── backend/ # FastAPI app logic

├── frontend/ # Vite + React frontend (avatar and UI)

├── pipeline/ # File processing

├── docs/ # System documentation and handover notes

├── SQL/ # SQL scripts for table creation

├── .env.example # Template for required environment variables

├── start-all.ps1 # Powershell startup script

└── README.md # This file

---

## ⚙️ System Requirements

Before setting up, ensure the following dependencies are installed:

1. **Ollama** - for LLaMA model inference  
   🔗 [Download Ollama](https://ollama.com/download)
   
3. **Redis (Windows MSI)** - caching layer  
   🔗 [Download Redis msi](https://github.com/tporadowski/redis/releases)

4. **MySQL Server + Workbench** - database for user and session logging  
   🔗 [MySQL Enterprise Edition (Server)](https://www.oracle.com/mysql/technologies/mysql-enterprise-edition-downloads.html#windows)  
   🔗 [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

---

## 🚀 Quickstart (Local Setup)

### 1️. Clone the Repository

```bash
git clone https://github.com/doubleu0-0/Np-x-Verztec-Team3.git
cd Np-x-Verztec-Team3
```

### 2. Set Up MySQL Database
- Open MySQL Workbench
- Execute the SQL scripts found in the SQL/ folder to create required tables and users.

### 3. Environment Variables
- Copy .env.example and rename it to .env. Fill in the required values.

### 4. Create a start-all.ps1 file based on start-all.ps1.example

### 5. Set Up Python Virtual Environment
- Run the following commands in a PowerShell terminal
```powershell
cd backend

# Find your Python path (if unsure)
Get-Command python

# Example path:
# "C:\Program Files\Python38\python.exe"

# Create virtual environment (replace path with yours)
& "C:\Program Files\Python38\python.exe" -m venv venv
```

### 6. Start the Entire Stack
- In the same Powershell terminal, run the following command
```powershell
cd ../
```

- Still in the same Powershell terminal, run the following command
```powershell
.\start-all.ps1
```
