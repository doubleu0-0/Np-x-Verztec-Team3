# Create Virtual Environment Manually First

# Getting the root directory
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Defining subpaths
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"
$RedisPath = "C:\Program Files\Redis"

# Activating Python venv
Write-Host "Activating Python virtual environment..."
Set-Location $BackendPath
& "$BackendPath\venv\Scripts\Activate.ps1"

# Installing Python dependencies
Write-Host "Installing backend dependencies..."
pip install -r requirements.txt

# Running install_languages.py
Write-Host "Installing translation languages..."
python install_languages.py

# Pulling Ollama models
Write-Host "Pulling Ollama models..."
ollama pull llama3.2
ollama pull llama3.2:1b

# Starting Redis server
Write-Host "Starting Redis server..."
Start-Process -NoNewWindow -FilePath "$RedisPath\redis-server.exe" -ArgumentList "--port 6380"

# Starting FastAPI backend
Write-Host "Starting FastAPI backend..."
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "uvicorn main:app --reload" -WorkingDirectory $BackendPath

# Starting Watcher.py
Write-Host "Starting Watcher.py..."
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "python Watcher.py" -WorkingDirectory $ProjectRoot

# Setting up and starting the frontend
Write-Host "Installing frontend dependencies..."
Set-Location $FrontendPath
npm install
npm install axios
npm install three@0.153.0 @react-three/fiber@8.13.6 @react-three/drei@9.53.1 --save

Write-Host "Starting Vite React frontend..."
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "npm run dev" -WorkingDirectory $FrontendPath
