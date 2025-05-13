# Document Processing and Embedding Pipeline

The source code has many python files: 1 pipeline.py file, and a code for the lambda function

This Python script processes raw documents containing the policies of the company, extracts the text, splits the content into chunks, generates embeddings, and uploads them into a vector database.

This script is run by an EC2 instance triggered by a lambda function whenever an object is uploaded to the S3 bucket containing all the company data.

The trigger for the lambda function is the uploading of the __trigger__.ready file into S3 (Make sure to upload it first, so it gets processed last).

---

## Table of Contents

- [Pipeline Overview](#pipeline-overview)
- [AWS Architecture](#aws-architecture)
- [Extraction Capabilities](#extraction-capabilities)
- [Why We Use Chunks](#why-we-use-chunks)
- [Sample of Chunking Overlap](#sample-of-chunking-overlap-using-recursivecharactertextsplitter)
- [Deployment Note](#deployment-note)
- [Core Assumptions](#core-assumptions)
- [Known Limitations](#known-limitations)
- [AWS Setup](#aws-setup)

---

## Pipeline Overview

1. Downloads log file from S3
2. Cleans the raw_data folder for clean extraction
3. Downloads raw data from S3
4. Extract the document text (PDF, DOCX, DOC)  
5. Chunk the text using overlap-aware splitting  
6. Embed the text chunks into dense vectors  
7. Upload the vectors to the Pinecone database  
8. Updates the log file in S3

---

## AWS Architecture

- **Trigger**: Uploading a special file named `__trigger__.ready` to the RAW_DATA folder in the main S3 bucket starts the pipeline.
- **Execution**: An EC2 instance is launched by the Lambda trigger to run the processing script.
- **Isolation**: Log files are uploaded to a separate S3 logging bucket for better monitoring and security.
---

## Extraction Capabilities

**File Types Supported**

- `.pdf`
- `.docx`
- `.doc` (converted to `.docx` using Spire.Doc)

**Handles:**
- Lists (Nested, custom list icons)
- Most tables (DOCX, DOC)
- Hyperlinks (DOCX)

**Limitations:**
- Images are not processed
- Complex PDF tables are inconsistently parsed (Even big companies like Accenture struggle)

---

## Why We Use Chunks

Data is split into chunks for several important reasons:

1. **Improved Search Relevance**  
   Vector databases like Pinecone work best with smaller, self-contained pieces of text. This allows the system to return precise and contextually relevant results.

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

## Deployment Note

**Since this is run separately, there is no dependency issues – hooray!**
If you want more accuracy, change the model to one that has more dimensions for better accuracy.
Since this pipeline is triggered when a new object is uploaded, we don't have to worry about the number of documents being too much to handle.
---

## Core Assumptions

1. Tables in PDFs are minimal and basic, especially for sensitive content (e.g., employee data).

---

## Known Limitations

- Tables are not handled very well in PDFs — this is a common limitation of all open-source tools. However, basic tables can be extracted.
- Images are unsupported.
- .doc files have to be converted to .docx before processing due to the EC2 instance not having a word document installed
- When converting the .doc to .docx, we are using Spire.Doc, where the free version will have this watermark: Evaluation Warning: The document was created with Spire.Doc for Python.

---

## AWS Setup

Here are the steps to replicate the AWS infrastructure:

1) Create an EC2 instance, must use windows AMI (We used t3.large, but can scale up/down based on needs -- cost is really low since we are running it only for the duration of the pipeline.py file)
2) Create SNS topic and subscribe to it
3) Create S3 bucket to store python file, folder to store raw data
4) Create another bucket to store logs
5) Create lambda function
6) Create and attach IAM roles for lambda and EC2 (Ensure they have the appropriate EC2, SNS, SSM access)
7) Create an event notifcation for S3 for all new files in RAW_DATA/, with suffix of .ready, then attach it to lambda function
8) Paste the aws_lambda.py code into lambda
9) Connect to the EC2 instance, and copy paste the aws_requirements.txt file (step by step) into the AMI to set it up if you have not done so before
10) Turn off the auto recovery function for EC2 instance


Xue Cong
13 May 2025