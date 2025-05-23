# Document Processing and Embedding Pipeline

The folder contains the source code to run the pipeline itself, but also an alternative that can be ran on aws, should the company decide to migrate it's database.

This Python script processes raw documents containing the policies of the company, extracts the text, splits the content into chunks, generates embeddings, and uploads them into a vector database.

This script is run by the server once the file watcher detects any changes in the raw_data folder
---

## Table of Contents

- [Pipeline Overview](#pipeline-overview)
- [Extraction Capabilities](#extraction-capabilities)
- [Why We Use Chunks](#why-we-use-chunks)
- [Sample of Chunking Overlap](#sample-of-chunking-overlap-using-recursivecharactertextsplitter)
- [Known Limitations](#known-limitations)

---

## Pipeline Overview

1. File watcher waits for any changes in the raw_data folder
2. Changes trigger to code to run the pipeline
3. Extract the document text
4. Chunk the text using overlap-aware splitting  
5. Embed the text chunks into dense vectors  
6. Upload the vectors to the FAISS index  
7. Updates the log file

---

## Extraction Capabilities

**File Types Supported**
- PDF
- DOCX, DOC
- XLSX, XLS
- PPTX, PPT
- CSV
- TXT
- HTML
- Markdown


**Handles:**
- Lists (Nested, custom list icons)
- Tables
- Hyperlinks

**Limitations:**
- Images are not processed
- Complex PDF tables are inconsistently parsed (Even big companies like Accenture struggle)

---

## Why We Use Chunks

Data is split into chunks for several important reasons:

1. **Improved Search Relevance**  
   Vector databases like FAISS work best with smaller, self-contained pieces of text. This allows the system to return precise and contextually relevant results.

2. **LLM Input Constraints**  
   Language models can only process a limited number of tokens. Chunking allows us to select only the most relevant text when forming a prompt.

3. **Context Preservation via Overlap**  
   We enable overlap between chunks so that things like lists or multi-step instructions remain intact even when split. This ensures semantic search does not return incomplete or ambiguous segments.

4. **Efficiency and Modularity**  
   Chunks can be embedded and uploaded independently, supporting parallelism and incremental updates.

5. **Supports Retrieval-Augmented Generation (RAG)**  
   Chunks make it possible to pull targeted content into a prompt when querying the LLM. Instead of sending the whole document, we send the most relevant chunk(s).

---

## Sample of Chunking Overlap Using `RecursiveCharacterTextSplitter`

--- Chunk 1 ---
...
2. Organizing Work Materials:
o Sort through physical documents. Shred or dispose of sensitive documents no longer
needed. Remove all name cards and old files outside the bin near the lift area.
--- Chunk 2 ---
2. Organizing Work Materials:
o Sort through physical documents. Shred or dispose of sensitive documents no longer
needed. Remove all name cards and old files outside the bin near the lift area.
o Return all company property (e.g., laptop, keyboard, employment card, medical card, office
keys etc) to the designated person or department.
...

The overlapping section ensures continuity between chunks, especially useful for questions about lists or step-by-step processes.

---

## Known Limitations

- Tables are not handled very well in PDFs — this is a common limitation of all open-source tools. However, basic tables can be extracted.
- Images are unsupported.
---



Xue Cong
13 May 2025