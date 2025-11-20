"""
New spec-compliant enhancement endpoint: POST /api/resumes/{resume_id}/enhance
Implements section-level enhancement with PII handling, ATS scoring, and history tracking.
"""
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.db_mongo import (
    get_parsed_resume,
    update_ai_analysis
)
from app.services.agents import orchestrate_enhancement
from app.services.ats_scoring import compute_ats_score, compute_keywords_added
from app.middleware.rate_limiter import check_rate_limit, increment_usage
from app.utils.anonymize import anonymize

router = APIRouter()


class SectionType(str, Enum):
    """Valid resume section types"""
    summary = "summary"
    experience = "experience"
    education = "education"
    skills = "skills"
    projects = "projects"
    certifications = "certifications"
    other = "other"


class EnhanceContext(BaseModel):
    """Optional context for enhancement"""
    job_title: Optional[str] = Field(None, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    section_index: Optional[int] = Field(None, ge=0)


class EnhanceRequest(BaseModel):
    """Request body for section enhancement"""
    section: SectionType
    text: str = Field(..., min_length=10, max_length=5000)
    context: Optional[EnhanceContext] = None

    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError("Text cannot be empty or whitespace only")
        return v.strip()


class ATSScore(BaseModel):
    """ATS scoring details"""
    score: float = Field(..., ge=0.0, le=1.0)
    factors: Dict[str, float]
    keywords_found: List[str] = []
    action_verbs_found: List[str] = []


class EnhanceResponse(BaseModel):
    """Response for enhancement request"""
    enhanced_text: str
    suggestions: List[str]
    ats_score_before: ATSScore
    ats_score_after: ATSScore
    keywords_added: List[str]
    confidence: float = Field(..., ge=0.0, le=1.0)
    pii_anonymized: bool
    processing_time_ms: int


@router.post("/resumes/{resume_id}/enhance", response_model=EnhanceResponse)
async def enhance_section(
    resume_id: str,
    request: EnhanceRequest,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """
    Enhance a specific resume section with AI-powered improvements.
    
    - Validates section type and text length
    - Anonymizes PII (emails, phones, URLs, names, addresses)
    - Applies multi-agent enhancement (Resume Writer, ATS Optimizer, Industry Expert)
    - Computes ATS score before/after and keywords added
    - Updates resume ai_analysis with enhancement history (capped at 50)
    - Enforces daily rate limit (10/day)
    
    Error codes:
    - 400: Invalid section type or text length
    - 404: Resume not found
    - 429: Rate limit exceeded (daily 10/day)
    - 500: Internal processing error
    """
    import time
    start_time = time.time()
    
    # Check daily rate limit (10/day)
    try:
        daily_check = await check_rate_limit(x_user_id, limit_type="daily")
        if not daily_check.get("allowed", True):
            retry_after = str(daily_check.get("retry_after") or 86400)  # seconds until reset
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": "Daily enhancement limit exceeded (10/day)",
                    "limit": daily_check.get("limit", 10),
                    "remaining": daily_check.get("remaining", 0),
                    "reset_at": daily_check.get("reset_at")
                },
                headers={"Retry-After": retry_after}
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rate limit check failed: {str(e)}")
    
    # Verify resume exists
    try:
        resume = await get_parsed_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    # Validate ownership (user_id matches)
    if resume.get("user_id") != x_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to enhance this resume")
    
    original_text = request.text
    
    # Compute ATS score BEFORE enhancement
    context_dict = request.context.dict() if request.context else {}
    ats_before_result = compute_ats_score(original_text, context_dict)
    ats_before = ATSScore(
        score=ats_before_result["score"],
        factors=ats_before_result["factors"],
        keywords_found=ats_before_result.get("keywords_found", []),
        action_verbs_found=ats_before_result.get("action_verbs_found", [])
    )
    
    # Orchestrate enhancement (PII is anonymized internally and NOT restored)
    try:
        enhancement_result = await orchestrate_enhancement(
            text=original_text,
            section_type=request.section.value,
            context=context_dict
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhancement failed: {str(e)}")
    
    enhanced_text = enhancement_result.get("enhancedText", original_text)
    suggestions = enhancement_result.get("suggestions", [])
    confidence = enhancement_result.get("confidence", 0.0)
    
    # Compute ATS score AFTER enhancement
    ats_after_result = compute_ats_score(enhanced_text, context_dict)
    ats_after = ATSScore(
        score=ats_after_result["score"],
        factors=ats_after_result["factors"],
        keywords_found=ats_after_result.get("keywords_found", []),
        action_verbs_found=ats_after_result.get("action_verbs_found", [])
    )
    
    # Compute keywords added
    keywords_added = compute_keywords_added(original_text, enhanced_text)
    
    # Update ai_analysis on resume document
    enhancement_entry = {
        "timestamp": datetime.utcnow(),
        "section": request.section.value,
        "ats_score_before": ats_before.score,
        "ats_score_after": ats_after.score,
        "confidence": confidence,
        "keywords_added": keywords_added,
        "context": context_dict
    }
    
    try:
        await update_ai_analysis(
            resume_id=resume_id,
            enhancement_entry=enhancement_entry,
            section_score={request.section.value: ats_after.score},
            overall_ats_score=ats_after.score  # Could average across sections
        )
    except Exception as e:
        # Log but don't fail the request
        print(f"Warning: Failed to update ai_analysis: {e}")
    
    # Increment daily usage
    try:
        await increment_usage(x_user_id, limit_type="daily")
    except Exception as e:
        print(f"Warning: Failed to increment usage: {e}")
    
    processing_time = int((time.time() - start_time) * 1000)
    
    return EnhanceResponse(
        enhanced_text=enhanced_text,
        suggestions=suggestions[:5],  # Top 5 suggestions
        ats_score_before=ats_before,
        ats_score_after=ats_after,
        keywords_added=keywords_added,
        confidence=round(confidence, 2),
        pii_anonymized=True,
        processing_time_ms=processing_time
    )
