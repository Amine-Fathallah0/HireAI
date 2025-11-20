from typing import List, Dict, Optional

def create_embedding(text: str) -> List[float]:
    # Placeholder. In production, call the chosen embedding provider.
    # Here we return a deterministic small vector for tests.
    h = sum(ord(c) for c in text) % 100
    return [float((h + i) % 10) / 10.0 for i in range(8)]

def upsert_embedding(resume_id: str, section_type: str, vector: List[float], metadata: Optional[Dict] = None):
    # Persist to vector DB / Postgres index in production. Stub for scaffold.
    return {"status": "ok", "vector_id": f"vec-{resume_id}-{section_type}"}
