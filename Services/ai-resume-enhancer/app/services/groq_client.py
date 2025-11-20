from typing import Any, Dict, List
import os
import httpx
import structlog
from app.core.config import settings

logger = structlog.get_logger()


async def parse_resume_with_groq(text: str) -> Dict[str, Any]:
    """Call Groq chat completions API to extract structured sections from resume text.

    Returns a dict with keys: `sections` which is a list of {"type","title","text"}.
    """
    groq_url = settings.groq_api_url
    api_key = settings.groq_api_key
    if not groq_url or not api_key:
        logger.info("groq.stub", reason="no-config")
        # naive split fallback
        parts = [p.strip() for p in text.split("\n\n") if p.strip()]
        sections = []
        for i, p in enumerate(parts):
            title = None
            first_line = p.splitlines()[0] if p.splitlines() else ""
            if 1 <= len(first_line.split()) <= 5 and first_line.isupper():
                title = first_line
            sections.append({"type": "section", "title": title or f"section_{i+1}", "text": p})
        return {"sections": sections}

    # Use OpenAI-compatible chat completions format
    system_prompt = """You are a resume parser. Extract structured sections from the resume text.
Return a JSON object with a 'sections' array. Each section should have: type, title, text.
Example: {"sections": [{"type":"education","title":"Education","text":"..."}, ...]}"""
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Parse this resume:\n\n{text}"}
        ],
        "temperature": 0.1,
        "max_tokens": 2000
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(groq_url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            # Extract from OpenAI-style response
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            # Try to parse JSON from content
            import json
            try:
                parsed = json.loads(content)
                if "sections" in parsed:
                    return parsed
            except:
                pass
            # Fallback: treat as single section
            return {"sections": [{"type": "full_text", "title": "Resume", "text": content or text}]}
    except Exception as e:
        logger.error("groq.call.failed", error=str(e))
        # fallback to stub
        parts = [p.strip() for p in text.split("\n\n") if p.strip()]
        sections = [{"type": "section", "title": f"section_{i+1}", "text": p} for i, p in enumerate(parts)]
        return {"sections": sections}
