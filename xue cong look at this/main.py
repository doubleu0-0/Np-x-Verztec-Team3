# 3. main.py add code 

import shutil 

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(file)))
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "pipeline", "data", "raw_data")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    print(f"[DEBUG] Saving file to: {file_path}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": f"File '{file.filename}' uploaded successfully."}
