import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning, message=".*grpcio.*")

import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import logging
import json
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

class WatcherHandler(FileSystemEventHandler):
    def __init__(self):
        pass
        
    def on_created(self, event):
        if not event.is_directory:
            file_path = Path(event.src_path)
            
            # Handle batch upload completion
            if file_path.name.startswith(".batch_upload_") and file_path.suffix == ".json":
                logging.info(f"Batch upload detected: {file_path.name}")
                self.handle_batch_upload(file_path)
                return
            
            # Skip metadata files and processing indicators
            if (file_path.suffix.lower() == ".json" or 
                file_path.name.startswith(".batch_upload_") or
                file_path.name.endswith(".meta.json")):
                logging.info(f"Ignored metadata/batch file: {file_path.name}")
                return
            
            # For any actual file upload, just trigger pipeline
            # (Database logging is handled by main.py)
            logging.info(f"File detected: {file_path.name} - triggering pipeline")
            self.trigger_pipeline()
    
    def handle_batch_upload(self, batch_file_path):
        """Handle completed batch upload - files are already in DB, just trigger pipeline"""
        try:
            with open(batch_file_path, 'r') as f:
                batch_info = json.load(f)
            
            logging.info(f"Processing batch {batch_info['batch_id']} with {batch_info['uploaded_files']} files")
            logging.info("Files already logged to database by backend API")
            
            # Run pipeline once for the entire batch
            self.trigger_pipeline()
            
            # Clean up batch indicator file
            batch_file_path.unlink()
            
        except Exception as e:
            logging.error(f"Failed to handle batch upload: {e}")
    
    def trigger_pipeline(self):
        """Trigger the processing pipeline"""
        try:
            logging.info("Triggering pipeline...")
            subprocess.run([
                "python",
                str(PIPELINE_SCRIPT)
            ])
            logging.info("🚀 Pipeline triggered successfully.")
        except subprocess.CalledProcessError as e:
            logging.error(f"❌ Failed to run pipeline: {e}")

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