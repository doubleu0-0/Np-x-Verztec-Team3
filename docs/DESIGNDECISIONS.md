# Design Decisions

This document outlines the key architectural and technological decisions made in building our AI-powered chatbot system. 
A need for scalability, security, maintainability, and responsiveness in real-world settings drove these decisions.

## 🏠 1. Local Self-Hosting vs Cloud APIs
We chose to self-host all components to avoid sending sensitive corporate data to third-party APIs.
For instance, using ElevenLabs for Text-To-Speech would expose internal responses to their servers, a major security and compliance risk.
Additionally, cloud APIs often charge per usage, which adds up quickly in production environments.
#### ✅ Benefits: Enhanced privacy, cost control, and better data compliance.

---

## 📦 2. ChromaDB vs FAISS
FAISS does not support fine-grained metadata filtering, which was a core requirement (e.g., restricting certain files from being queried based on country).
ChromaDB enables us to tag and filter vectors using metadata, offering better flexibility and control.
#### ✅ Benefits: Metadata filtering, better enforcement of access policies.

---

## 🧠 3. Multi-Stage LLaMA Inference
We used the LLaMA model multiple times in a single user flow:

First: Process the user's prompt.

Second: Summarise context retrieved from ChromaDB.

Third: Evaluate citations.
#### ✅ Benefits: Modular reasoning, better citation accuracy, easier debugging.

---

## ⚛️ 4. Vite + React vs HTML + CSS
React enables component-based development and dynamic state handling.
Vite offers rapid hot-reloading and performance benefits during development.
#### ✅ Benefits: Faster development, better structure, reusable components.

---

## 🚀 5. FastAPI vs Flask
FastAPI provides automatic validation, async support, and better scalability out-of-the-box.
#### ✅ Benefits: Async capabilities, better performance.
