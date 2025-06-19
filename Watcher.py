import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import pymysql
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

# Automatically resolve absolute project path
PROJECT_ROOT = Path(__file__).resolve().parent
WATCH_FOLDER = PROJECT_ROOT / "pipeline" / "data" / "raw_data"
PIPELINE_SCRIPT = PROJECT_ROOT / "pipeline" / "src" / "chroma_db_pipeline.py"

# Load environment variables from .env
load_dotenv(PROJECT_ROOT / ".env")
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# Load database configuration
DB_CONFIG = {
    "host": DB_HOST,
    "user": DB_USER,
    "password": DB_PASS,
    "database": DB_NAME
}

class WatcherHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            file_path = Path(event.src_path)
            if file_path.suffix.lower() == ".json":
                logging.info(f"Ignored .json file: {file_path.name}")
                return  # Skip processing for .json files
            
            logging.info(f"New file created: {event.src_path}")

            file_name = file_path.name
            file_type = file_path.suffix.lstrip(".").lower()
            uploaded_by = 1 
            department = "IT"
            access_level = "ALL"

            try:
                conn = pymysql.connect(**DB_CONFIG)
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO files (file_name, file_type, uploaded_by, department, access_level, file_path)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (file_name, file_type, uploaded_by, department, access_level, str(file_path)))
                    conn.commit()
                conn.close()
                logging.info("✅ Database entry created.")
            except Exception as e:
                logging.error(f"❌ Failed to insert into database: {e}")

            try:
                logging.info("Triggering pipeline...")
                subprocess.run([
                    "python",
                    str(PIPELINE_SCRIPT)
                ])
                logging.info("🚀 Pipeline triggered successfully.")
                logging.info(f"👀 Watching folder: {WATCH_FOLDER}")
            except subprocess.CalledProcessError as e:
                logging.error(f"❌ Failed to run pipeline.py: {e}")

if __name__ == "__main__":
    logging.info(f"👀 Watching folder: {WATCH_FOLDER}")
    event_handler = WatcherHandler()
    observer = Observer()
    observer.schedule(event_handler, str(WATCH_FOLDER), recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()