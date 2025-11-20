from typing import Dict, Any, Optional
import structlog
from app.services.provider_adapter import normalize_response
from app.services.groq_client import parse_resume_with_groq
from app.services.pinecone_client import upsert_resume_section
from app.db_mongo import save_resume_version
import uuid
import asyncio

logger = structlog.get_logger()


async def analyzer_agent(parsed_resume: Dict[str, Any], job_requirements: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    # Simple heuristic: extract keywords from sections
    sections = parsed_resume.get("sections", [])
    skills = set()
    for s in sections:
        text = s.get("text", "")
        # naive: look for words that look like skills (capitalized tokens)
        for token in set(text.split()):
            if token.isalpha() and token[0].isupper() and len(token) > 2:
                skills.add(token)
    return {"agent": "analyzer", "skills": list(skills)}


async def gap_finder_agent(parsed_resume: Dict[str, Any], job_requirements: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    analyzer = await analyzer_agent(parsed_resume, job_requirements)
    resume_skills = set(analyzer.get("skills", []))
    job_skills = set(job_requirements.get("skills", [])) if job_requirements else set()
    missing = list(job_skills - resume_skills)
    return {"agent": "gap_finder", "missing": missing}


async def rewriter_agent(parsed_resume: Dict[str, Any], job_requirements: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    # Use Groq to rewrite sections if available, otherwise perform simple rewrite
    sections = parsed_resume.get("sections", [])
    rewritten = []
    for s in sections:
        text = s.get("text", "")
        # simple rewrite: truncate long paragraphs and add 'Optimized' label
        new_text = (text[:1000] + "...") if len(text) > 1000 else text
        rewritten.append({"type": s.get("type"), "title": s.get("title"), "text": new_text})
    return {"agent": "rewriter", "sections": rewritten}


async def enhance_resume_flow(resume_id: str, parsed_resume: Dict[str, Any], job_requirements: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    # Run agents in parallel
    analyzer_task = asyncio.create_task(analyzer_agent(parsed_resume, job_requirements))
    gap_task = asyncio.create_task(gap_finder_agent(parsed_resume, job_requirements))
    rewriter_task = asyncio.create_task(rewriter_agent(parsed_resume, job_requirements))

    analyzer_res, gap_res, rewriter_res = await asyncio.gather(analyzer_task, gap_task, rewriter_task)

    # Build new version document
    version_doc = {
        "version_id": str(uuid.uuid4()),
        "resume_id": resume_id,
        "agents": {
            "analyzer": analyzer_res,
            "gap_finder": gap_res,
            "rewriter": rewriter_res,
        },
        "sections": rewriter_res.get("sections", []),
    }

    # persist new version
    inserted = await save_resume_version(resume_id, version_doc)

    # upsert embeddings for new sections
    for s in version_doc["sections"]:
        await asyncio.to_thread(upsert_resume_section, resume_id, s.get("title") or "section", s.get("text", ""), metadata={"version_id": version_doc["version_id"]})

    return {"version_id": version_doc["version_id"], "db_id": inserted}
