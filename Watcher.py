#1. create watcher.py in the root directory (same as ReadMe.md)

import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import pymysql
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

# Automatically resolve absolute project path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
WATCH_FOLDER = os.path.join(PROJECT_ROOT, "pipeline", "data", "raw_data")
PIPELINE_SCRIPT = os.path.join(PROJECT_ROOT, "pipeline", "pipeline.py")

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

            file_name = os.path.basename(event.src_path)
            file_type = os.path.splitext(file_name)[1].lstrip(".").lower()
            file_path = event.src_path
            uploaded_by = 1  # Modify dynamically if needed
            department = "IT"
            access_level = "ALL"

            try:
                conn = pymysql.connect(**DB_CONFIG)
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO files (file_name, file_type, uploaded_by, department, access_level, file_path)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (file_name, file_type, uploaded_by, department, access_level, file_path))
                    conn.commit()
                conn.close()
                logging.info("✅ Database entry created.")
            except Exception as e:
                logging.error(f"❌ Failed to insert into database: {e}")

            try:
                subprocess.run([
                    "python",
                    os.path.join("pipeline", "src", "pipeline.py")
                ])
                logging.info("🚀 Pipeline triggered successfully.")
            except subprocess.CalledProcessError as e:
                logging.error(f"❌ Failed to run pipeline.py: {e}")

if __name__ == "__main__":
    logging.info(f"👀 Watching folder: {WATCH_FOLDER}")
    event_handler = WatcherHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_FOLDER, recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()