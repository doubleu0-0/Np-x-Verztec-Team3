#1. create watcher.py in the root directory (same as ReadMe.md)

import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import pymysql
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

# Automatically resolve absolute project path
PROJECT_ROOT = Path(__file__).resolve().parent
WATCH_FOLDER = PROJECT_ROOT / "pipeline" / "data" / "raw_data"
PIPELINE_SCRIPT = PROJECT_ROOT / "pipeline" / "src" / "pipeline.py"

# ✅ Updated database credentials
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Asimplepassword1!",
    "database": "verztec"
}

class WatcherHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            logging.info(f"🆕 New file created: {event.src_path}")

            file_path = Path(event.src_path)
            file_name = file_path.name
            file_type = file_path.suffix.lstrip(".").lower()
            uploaded_by = 1  # Modify dynamically if needed
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
                subprocess.run([
                    "python",
                    str(PIPELINE_SCRIPT)
                ])
                logging.info("🚀 Pipeline triggered successfully.")
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