# Website

## FastAPI Setup

### Dependencies

- Python 3.8

### Setup

- `cd backend`
- `Get-Command python` and get the Source e.g "C:\Program Files\Python38\python.exe"
- Create a virtual environment (powershell): & "C:\Program Files\Python38\python.exe" -m venv venv
- Activate the virtual environment:
  - Mac/Linux: `source ./venv/bin/activate`
  - Windows ((powershell)): `.\venv\Scripts\activate.ps1`
- Install the dependencies from [requirements.txt](./backend/requirements.txt)
  - `pip install -r requirements.txt`
- Edit the database credentials in Watcher.py and backend/main.py

### Run the backend

- `ollama pull llama3.2`
- `ollama pull llama3.2:1b`
- `uvicorn main:app --reload`



## Frontend (Vite, React, TailwindCSS)

### Dependencies 

- NodeJS

### Setup 

- `cd frontend`
- `npm install`
- `npm install axios`

### Run the App

- `npm run dev`
- click on the local vite url shown
