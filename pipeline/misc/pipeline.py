# This is outdated

import io
import sys
import os
import json
import unicodedata
import subprocess
import boto3
import shutil
from docx import Document
from spire.doc import Document as SpireDocument
from spire.doc import FileFormat
import win32com.client
from sentence_transformers import SentenceTransformer
import pdfplumber
from lxml import etree
from pinecone import Pinecone
from tqdm import tqdm
from langchain.text_splitter import RecursiveCharacterTextSplitter


PINECONE_API_KEY = "pcsk_4Zrgdk_JE48SUN5TDzkNnqYWdbszMCwwkJpQpQLq5MxQDw4a7vJGyiWEMeEJMWhv9CWADB"
PINECONE_ENV = "us-east-1"
INDEX_NAME = "internal-docs"
pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENV)
index = pc.Index(INDEX_NAME)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
model = SentenceTransformer("BAAI/bge-large-en")

# Hardcoded for windows AMI image
RAW_DATA = "C:\\temp\\raw_data"
LOG_FILE = "C:\\temp\\Logs\\processed_files.json"
S3_LOG_BUCKET = 'verztec-logs'
S3_LOG_KEY = "logs/processed_files.json"
os.makedirs(RAW_DATA, exist_ok=True)
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

# 0. Load data from S3
S3_BUCKET = 'verztec-policy-data'

def clear_raw_data_folder():
    """ Clears the raw data folder, ensures clean download and processing """
    if os.path.exists(RAW_DATA):
        shutil.rmtree(RAW_DATA)
    os.makedirs(RAW_DATA)

def download_files_from_s3():
    """ Downloads all files from S3 data bucket, provided they are supported formats """
    s3 = boto3.client('s3')
    os.makedirs(RAW_DATA, exist_ok=True)

    response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="RAW_DATA/")
    for obj in response.get('Contents', []):
        key = obj['Key']
        if not key.lower().endswith(('.pdf', '.docx', '.doc')):
            continue  # Skip unsupported files

        filename = os.path.basename(key)
        local_path = os.path.join(RAW_DATA, filename)
        print(f"Downloading {key} -> {local_path}")
        s3.download_file(S3_BUCKET, key, local_path)

def download_log_from_s3():
    """ Download log file from S3 bucket """
    s3 = boto3.client('s3')
    try:
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        s3.download_file(S3_LOG_BUCKET, S3_LOG_KEY, LOG_FILE)
        print("Downloaded existing log from S3.")
    except s3.exceptions.ClientError as e:
        print("No existing log file found in S3. Starting fresh.")
        with open(LOG_FILE, "w") as f:
            json.dump([], f)

def convert_doc_to_docx():
    """ 
    Processing of .doc files requires Word Application, which requires a license.
    So we will convert .doc files into .docx files for processing.
    """
    for filename in os.listdir(RAW_DATA):
        if filename.lower().endswith('.doc') and not filename.lower().endswith('.docx'):
            input_path = os.path.join(RAW_DATA, filename)
            output_path = os.path.splitext(input_path)[0] + ".docx"
            print(f"Converting {filename} to .docx...")

            try:
                doc = SpireDocument()
                doc.LoadFromFile(input_path)
                doc.SaveToFile(output_path, FileFormat.Docx2016)
                doc.Close()
                print(f"Converted {filename} to .docx successfully.")
                os.remove(input_path)

            except Exception as e:
                print(f"Failed to convert {filename} with Spire.Doc: {e}")



# 1. Extraction

def extract_text_from_pdf(file_path):
    """Extracts PDF, ignores images"""
    output = []

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            # Extract plain text
            plain_text = page.extract_text()
            if plain_text:
                output.append(plain_text.strip())

            # Extract tables
            tables = page.extract_tables()
            for table in tables:
                formatted_table = []
                for row in table:
                    row_text = " | ".join(cell.strip() if cell else "" for cell in row)
                    formatted_table.append(f"| {row_text} |")
                output.append("\n".join(formatted_table))

    return "\n\n".join(output)


def extract_text_from_doc(file_path):
    """Extracts .doc files, ignores images"""

    # Have to open the file in background because its old -_-
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    doc = word.Documents.Open(file_path)

    full_text = []
    content = doc.Content
    start = content.Start
    end = content.End
    bullets = {'•', '‣', '·', '‧', '–', '-', '*', '', '●', '■', '♦', '\uf0b7', 'o'}

    while start < end:
        current_range = doc.Range(start, start + 1)
        # Extract tables
        if current_range.Tables.Count > 0:
            table = current_range.Tables(1)
            table_text = []
            for row in table.Rows:
                row_text = []
                for cell in row.Cells:
                    cell_text = cell.Range.Text.strip().replace('\r', '').replace('\x07', '')
                    row_text.append(cell_text)
                table_text.append(' | '.join(row_text))
            full_text.append('\n'.join(table_text))
            start = table.Range.End

        # Extract paragraphs
        elif current_range.Paragraphs.Count > 0:
            para_range = current_range.Paragraphs(1).Range
            para_text = para_range.Text.strip().replace('\r', '').replace('\x07', '')
            para_text = unicodedata.normalize("NFKC", para_text) # Normalize to raw text

            if para_text:
                list_format = para_range.ListFormat
                indent = ''

                '''This chunk of code is to deal with microsoft word lists'''
                if list_format.ListType != 0:
                    # Get list indent level and marker
                    level = max(list_format.ListLevelNumber, 1)
                    indent = '    ' * (level - 1)
                    marker = list_format.ListString.strip()

                    # Some markers are invisible or from Wingdings/Symbol font (like '\uf0b7')
                    # These don't render well, so we substitute a standard bullet
                    if not marker.isprintable() or ord(marker[0]) >= 0xF000:
                        marker = '•'
                    para_text = f"{indent}{marker} {para_text}"

                else:
                    stripped = para_text.lstrip()
                    # Now check if the first character is a bullet point
                    if stripped and stripped[0] in bullets:
                        para_text = f"• {stripped[1:].lstrip()}"

                full_text.append(para_text)

            start = para_range.End
        else:
            start = current_range.End  # Fallback to avoid infinite loop

    doc.Close(False)
    word.Quit()
    return '\n\n'.join(full_text)


def extract_text_from_docx(file_path):
    """Extracts .docx files, ignores images"""
    doc = Document(file_path)
    full_text = []

    # Get the raw XML of the Word doc so we can manually look at paragraphs, tables, etc.
    doc_xml = doc.element
    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

    for element in doc_xml.body:
        # Extract text
        if element.tag == etree.QName(namespaces['w'], 'p'):
            # Detect if it's a list item
            num_pr = element.find('.//w:numPr', namespaces)
            is_list = num_pr is not None

            # Extract hyperlink stuff
            hyperlink = element.find('.//w:hyperlink', namespaces)
            if hyperlink is not None:

                # Hyperlink text
                texts = hyperlink.findall('.//w:t', namespaces)
                link_text = ''.join(t.text for t in texts if t.text)

                # Get the hyperlink target
                r_id = hyperlink.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                if r_id:
                    rels = doc.part.rels
                    url = rels[r_id]._target if r_id in rels else ''
                    plain_text = f"[{link_text}]({url})"
                else:
                    # No url found
                    plain_text = link_text
            else:
                # Plain text
                texts = element.findall('.//w:t', namespaces)
                plain_text = ''.join(t.text for t in texts if t.text)

            plain_text = plain_text.strip()
            if plain_text:
                if is_list:
                    plain_text = f"• {plain_text}"
                full_text.append(plain_text)

        # Extract tables
        elif element.tag == etree.QName(namespaces['w'], 'tbl'):
            for row in element.findall('.//w:tr', namespaces):
                cells = row.findall('.//w:tc', namespaces)
                row_cells = []
                for cell in cells:
                    texts = cell.findall('.//w:t', namespaces)
                    cell_text = ''.join(t.text for t in texts if t.text).strip()
                    row_cells.append(cell_text)
                formatted_row = '| ' + ' | '.join(row_cells) + ' |'
                full_text.append(formatted_row)

    return '\n'.join(full_text)

# 2. Chunking

def split_and_print_chunks(text, chunk_size=1000, chunk_overlap=200):
    """
    Splits the input text into chunks and prints each chunk with its index.

    Parameters:
        text (str): The text to be split.
        chunk_size (int): The maximum size of each chunk.
        chunk_overlap (int): The number of overlapping characters between chunks.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_text(text)


    print(f"Total chunks: {len(chunks)}\n")

    for i, chunk in enumerate(chunks):
        print(f"\n--- Chunk {i + 1} ---\n{chunk}\n{'-' * 60}")

    return chunks

# 3. Embedding

def embedding_chunks(file_path, chunks, model):
    """
    Encodes text chunks into embeddings and structures them with metadata.

    Parameters:
        file_path (str): Path to the source file (used for metadata).
        chunks (list): Chunked text data to be embedded.
        model_name (str): Name of the sentence transformer model to use.

    Returns:
        list: A list of dictionaries containing embeddings and metadata.
    """
    filename = os.path.basename(file_path)
    embeddings = model.encode(chunks)

    vector_data = [
        {
            "id": f"{filename}_chunk{i}",
            "values": embeddings[i].tolist(),
            "metadata": {
                "source": filename,
                "text": chunks[i],
                "chunk": i,
                "chunk_size": len(chunks[i])
            }
        }
        for i in range(len(chunks))
    ]

    print(f"\nEmbedded {len(vector_data)} chunks.\n")

    return vector_data


# 4. Upload to Pinecone

def upload_to_pinecone(vector_data, index_name, pinecone_api_key, pinecone_env, batch_size=100, namespace=None):
    """ Uploads a list of vectors to a Pinecone index """
    pc = Pinecone(api_key=pinecone_api_key, environment=pinecone_env)
    index = pc.Index(index_name)

    print(f"\nStarting upload to Pinecone index '{index_name}' (batch size: {batch_size})...")

    for start in tqdm(range(0, len(vector_data), batch_size), desc="Upserting to Pinecone"):
        batch = vector_data[start:start + batch_size]
        index.upsert(vectors=batch, namespace=namespace)

    print(f"\nUploaded {len(vector_data)} vectors to Pinecone index '{index_name}'.")

# 5. Update the logging to S3
def upload_log_to_s3():
    """ Updates the log file into S3 logging bucket (Different to prevent recursion) """
    s3 = boto3.client('s3')
    try:
        s3.upload_file(LOG_FILE, S3_LOG_BUCKET, S3_LOG_KEY)
        print("Uploaded log file to S3.")
    except Exception as e:
        print(f"Failed to upload log file: {e}")

# 6. Main Pipeline
def run_pipeline(raw_folder):
    """ Runs the pipeline to extract new files """
    new_files = []

    # Ensure log file exists and has valid JSON
    if not os.path.exists(LOG_FILE) or os.path.getsize(LOG_FILE) == 0:
        with open(LOG_FILE, "w") as f:
            json.dump([], f)

    with open(LOG_FILE, "r") as f:
        processed_files = set(json.load(f))


    for filename in os.listdir(raw_folder):
        if filename in processed_files:
            print(f'Skipping file: {filename}')
            continue  # skip already processed files

        print(f"\nProcessing file: {filename}")
        file_path = os.path.join(raw_folder, filename)
        
        try:
            if filename.endswith(".pdf"):
                extracted_text = extract_text_from_pdf(file_path)
            elif filename.endswith(".docx"):
                extracted_text = extract_text_from_docx(file_path)
            # elif filename.endswith(".doc"):
            #    extracted_text = extract_text_from_doc(file_path)
            else:
                continue  # skip unknown file types
            chunks = split_and_print_chunks(extracted_text, chunk_size=1000, chunk_overlap=200)
            vector_data = embedding_chunks(file_path, chunks, model)
            upload_to_pinecone(vector_data, INDEX_NAME, PINECONE_API_KEY, PINECONE_ENV, batch_size = 1, namespace = None)
            new_files.append(filename)
        except Exception as e:
            print(f'Failed to process: {filename}: {e}')

    # Update log file
    processed_files.update(new_files)
    with open(LOG_FILE, "w") as f:
        json.dump(list(processed_files), f)
    
    print("Pipeline completed. Database has been updated!")

if __name__ == "__main__":
    download_log_from_s3()
    clear_raw_data_folder()
    download_files_from_s3()
    convert_doc_to_docx()
    run_pipeline(RAW_DATA)
    upload_log_to_s3()