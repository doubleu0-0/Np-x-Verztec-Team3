import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import mysql.connector
import os

watch_folder = r"C:\Users\jiaye\ICP_Project\pipeline\data\raw_data"

db_config = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "jiayeetee15!",
    "database": "verztec_db"
}

class WatcherHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            print(f"🆕 File created: {event.src_path}")

            file_name = os.path.basename(event.src_path)
            file_type = os.path.splitext(file_name)[1].replace('.', '')
            file_path = event.src_path
            uploaded_by = 1
            department = "IT"
            access_level = "ALL"

            try:
                conn = mysql.connector.connect(**db_config)
                cursor = conn.cursor()
                sql = """
                    INSERT INTO files (file_name, file_type, uploaded_by, department, access_level, file_path)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                data = (file_name, file_type, uploaded_by, department, access_level, file_path)
                cursor.execute(sql, data)
                conn.commit()
                cursor.close()
                conn.close()
                print("✅ Database inserted new file record.")
            except Exception as e:
                print(f"❌ Database insert failed: {e}")

            subprocess.run(["python", "pipeline.py"])

if __name__ == "__main__":
    event_handler = WatcherHandler()
    observer = Observer()
    observer.schedule(event_handler, watch_folder, recursive=False)
    observer.start()
    print(f"👀 Watching folder: {watch_folder}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
