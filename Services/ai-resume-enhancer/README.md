# AI Resume Enhancer - FastAPI Microservice

## Overview

A lightweight FastAPI microservice for parsing PDF resumes and optionally enhancing them using CrewAI agents.

**Core Flow (Flow B)**:
1. User uploads a PDF → service validates (content-type, magic bytes, max 5MB)
2. PyMuPDF extracts raw text; Groq (if configured) structures into sections
3. Parsed resume stored in MongoDB with versioning
4. Optional: User requests enhancement → three CrewAI agents improve sections → new version saved

## Quick Start

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Open http://localhost:8080/docs for API docs.

## API Endpoints

**POST** `/api/resume/upload?enhance=false|true`
- Upload PDF, optionally trigger CrewAI enhancement
- Returns: `resume_id`, `db_id`, `sections`, optionally `enhancement` result

**GET** `/api/resume/{resume_id}`
- Retrieve parsed resume document

## Environment

Copy `.env.example` to `.env`:
- `MONGO_URL`: MongoDB connection
- `CREWAI_API_KEY`, `CREWAI_API_URL`: CrewAI credentials (optional, uses stubs if blank)
- `PINECONE_API_KEY`: Vector DB (optional)

