from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Header
from typing import Any, Optional
import fitz
import io
import uuid
import structlog
from app.services.pinecone_client import upsert_resume_section
from app.services.groq_client import parse_resume_with_groq
from app.db_mongo import (
    save_parsed_resume,
    get_parsed_resume,
    get_latest_resume_version,
    get_resume_versions,
)
from app.services.crew_agents import enhance_resume_flow
from app.services.agents import orchestrate_enhancement
from app.db_mongo import save_resume_version
from app.core.config import settings
from app.middleware.rate_limiter import check_rate_limit, increment_usage

router = APIRouter()
logger = structlog.get_logger()


def _is_pdf_magic(contents: bytes) -> bool:
    # Accept if %PDF appears near the start (some files may have BOM/headers)
    head = contents[:1024]
    return b"%PDF" in head


def _malware_scan_stub(contents: bytes) -> bool:
    # Placeholder: integrate an actual malware scanner (ClamAV, etc.) in production.
    return True


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), enhance: Optional[bool] = Query(False), x_user_id: Optional[str] = Header(None)) -> Any:
    user_id = x_user_id or "anonymous"
    
    # Check rate limits if enhancement requested
    if enhance:
        from fastapi import Request
        from app.middleware.rate_limiter import get_user_tier
        tier = get_user_tier(user_id)
        
        # This would normally be called from middleware, but we'll check inline here
        from app.middleware.rate_limiter import check_rate_limit
        rate_check = await check_rate_limit(user_id, tier)
        if not rate_check["allowed"]:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"You have used all {rate_check['limit']} enhancements for this month. Upgrade your plan for more.",
                    "limit": rate_check["limit"],
                    "remaining": 0,
                    "reset_at": rate_check["reset_at"]
                }
            )
    
    # Basic validation
    if file.content_type not in ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    if file.content_type == "application/pdf":
        if not _is_pdf_magic(contents):
            raise HTTPException(status_code=400, detail="Invalid PDF file (magic bytes mismatch)")
        if not _malware_scan_stub(contents):
            raise HTTPException(status_code=400, detail="File failed malware scan")
        try:
            doc = fitz.open(stream=contents, filetype="pdf")
            text = "\n\n".join(page.get_text() for page in doc)
            metadata = {"pages": doc.page_count}
        except Exception as e:
            logger.error("pdf.parse.error", error=str(e))
            raise HTTPException(status_code=500, detail="Failed to parse PDF")
    else:
        # For docx, a production implementation should use python-docx or textract
        text = ""
        metadata = {}

    # Ask Groq (or stub) to return structured JSON sections
    try:
        parsed = await parse_resume_with_groq(text)
    except Exception as e:
        logger.error("groq.parse.failed", error=str(e))
        parsed = {"sections": []}

    # Ensure sections is a list
    sections = parsed.get("sections") if isinstance(parsed, dict) else []
    if not isinstance(sections, list):
        sections = []

    # Build document for MongoDB
    resume_id = str(uuid.uuid4())
    doc = {
        "_id": resume_id,
        "user_id": user_id,  # Store user_id for querying
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(contents),
        "metadata": metadata,
        "text": text,
        "sections": sections,
        "version": 1,
    }

    # Persist to MongoDB
    try:
        db_id = await save_parsed_resume(doc)
    except Exception as e:
        logger.error("mongo.save.failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to persist parsed resume")

    # Upsert embeddings for each section (background-friendly)
    import asyncio as _asyncio

    for s in doc["sections"]:
        try:
            # run in thread since pinecone client is sync
            await _asyncio.to_thread(upsert_resume_section, resume_id, s.get("title") or "section", s.get("text", ""), {"filename": file.filename})
        except Exception:
            logger.exception("pinecone.upsert.failed")

    result = {"resume_id": resume_id, "db_id": db_id, "sections": len(doc["sections"])}

    # Optional enhancement flow: run LLM-based agents per section and persist a new version
    if enhance:
        try:
            agents_results = []
            for s in doc["sections"]:
                section_text = s.get("text", "")
                section_type = s.get("title") or s.get("type") or "section"
                agent_out = await orchestrate_enhancement(section_text, section_type, context={})
                agents_results.append({
                    "title": section_type,
                    "text": agent_out.get("enhancedText"),
                    "suggestions": agent_out.get("suggestions"),
                    "confidence": agent_out.get("confidence"),
                    "agent_outputs": agent_out.get("agent_outputs")  # Include individual agent contributions
                })

            version_doc = {
                "version_id": str(uuid.uuid4()),
                "resume_id": resume_id,
                "agents": agents_results,
                "sections": agents_results,
            }
            # persist new version
            ver_id = await save_resume_version(resume_id, version_doc)
            # upsert embeddings for new sections
            for s in agents_results:
                try:
                    await _asyncio.to_thread(upsert_resume_section, resume_id, s.get("title") or "section", s.get("text", ""), {"version_id": version_doc["version_id"]})
                except Exception:
                    logger.exception("pinecone.upsert.failed")

            result["enhancement"] = {"version_id": version_doc["version_id"], "db_id": ver_id}
            
            # Increment usage counter after successful enhancement
            await increment_usage(user_id)
            
        except Exception as e:
            logger.error("enhancement.failed", error=str(e))
            result["enhancement_error"] = str(e)

    return result


@router.post("/{resume_id}/enhance")
async def enhance_existing_resume(resume_id: str, x_user_id: Optional[str] = Header(None)) -> Any:
    """Enhance an existing resume by its ID."""
    user_id = x_user_id or "anonymous"
    
    # Get the original resume
    doc = await get_parsed_resume(resume_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get user's tier from header or default to free
    tier = "free"  # TODO: Get from user service
    
    # Check rate limit - DISABLED FOR TESTING
    # rate_limit_result = await check_rate_limit(user_id, tier)
    # if not rate_limit_result["allowed"]:
    #     logger.warning("rate_limit_exceeded", user_id=user_id, tier=tier)
    #     raise HTTPException(
    #         status_code=429,
    #         detail={
    #             "message": f"Monthly enhancement limit reached. You have {rate_limit_result['remaining']} of {rate_limit_result['limit']} enhancements remaining.",
    #             "limit": rate_limit_result["limit"],
    #             "remaining": rate_limit_result["remaining"],
    #             "reset_at": rate_limit_result["reset_at"]
    #         }
    #     )
    
    # Extract text from sections
    full_text = "\n\n".join([s.get("text", "") for s in doc.get("sections", [])])
    
    # Run enhancement for each section or as a whole
    try:
        # Enhance the full resume (use "summary" as section type for full resume)
        enhanced_result = await orchestrate_enhancement(full_text, section_type="summary")
        
        # Save enhanced version
        version_doc = {
            "sections": [{
                "type": "enhanced",
                "title": "Enhanced Resume",
                "text": enhanced_result["enhancedText"],
                "suggestions": enhanced_result.get("suggestions", []),
                "confidence": enhanced_result.get("confidence", 0.0),
                "agent_outputs": enhanced_result.get("agent_outputs", {}),
                "pii_protected": enhanced_result.get("pii_protected", False)
            }],
            "metadata": {"enhanced": True, "user_id": user_id},
            "timestamp": None  # MongoDB will add timestamp
        }
        
        await save_resume_version(resume_id=resume_id, version_doc=version_doc)
        
        # Increment usage counter
        await increment_usage(user_id)
        
        logger.info("resume_enhanced", resume_id=resume_id, user_id=user_id)
        
        return {
            "resume_id": resume_id,
            "status": "enhanced",
            "enhanced": True
        }
        
    except Exception as e:
        logger.error("enhancement_failed", resume_id=resume_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Enhancement failed: {str(e)}")


@router.get("/{resume_id}")
async def get_resume(resume_id: str) -> Any:
    doc = await get_parsed_resume(resume_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Not Found")
    return doc


@router.get("/{resume_id}/latest")
async def get_latest(resume_id: str) -> Any:
    """Return the latest enhancement version for a resume (agents' output)."""
    doc = await get_latest_resume_version(resume_id)
    if not doc:
        raise HTTPException(status_code=404, detail="No enhancements found")
    return doc


@router.get("/{resume_id}/versions")
async def list_versions(resume_id: str, limit: int = Query(20, ge=1, le=200)) -> Any:
    """List enhancement versions for a resume with newest first."""
    docs = await get_resume_versions(resume_id, limit=limit)
    return {"count": len(docs), "items": docs}
