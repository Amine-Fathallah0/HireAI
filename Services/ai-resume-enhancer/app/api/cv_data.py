"""
API endpoint to export CV data in format compatible with job-matcher service
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, Any
import structlog
from app.db_mongo import get_parsed_resume, get_latest_resume_version

router = APIRouter()
logger = structlog.get_logger()


def extract_cv_data_from_resume(resume_doc: dict, enhanced_version: Optional[dict] = None) -> dict:
    """
    Transform resume document into job-matcher compatible CV data format
    
    Args:
        resume_doc: Original parsed resume document
        enhanced_version: Optional enhanced version from agents
        
    Returns:
        CV data in job-matcher format
    """
    sections = resume_doc.get("sections", [])
    
    # If we have an enhanced version, prefer its sections
    if enhanced_version and "sections" in enhanced_version:
        sections = enhanced_version["sections"]
    
    # Extract data from sections
    cv_data = {
        "personal_info": {},
        "summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "certifications": [],
        "languages": [],
        "experience_level": "entry"
    }
    
    for section in sections:
        section_title = (section.get("title") or section.get("type", "")).lower()
        section_text = section.get("text", "")
        
        # Personal Information / Contact
        if any(keyword in section_title for keyword in ["personal", "contact", "info"]):
            # Simple extraction - in production, use NLP
            lines = section_text.split("\n")
            for line in lines:
                line = line.strip()
                if "@" in line and not cv_data["personal_info"].get("email"):
                    cv_data["personal_info"]["email"] = line
                elif any(char.isdigit() for char in line) and "phone" not in line.lower():
                    if not cv_data["personal_info"].get("phone"):
                        cv_data["personal_info"]["phone"] = line
                elif line and not cv_data["personal_info"].get("name"):
                    cv_data["personal_info"]["name"] = line
        
        # Summary / Objective
        elif any(keyword in section_title for keyword in ["summary", "objective", "profile", "about"]):
            cv_data["summary"] = section_text.strip()
        
        # Skills
        elif "skill" in section_title:
            # Extract skills from text (comma-separated or line-separated)
            if "," in section_text:
                skills = [s.strip() for s in section_text.split(",") if s.strip()]
            else:
                skills = [s.strip() for s in section_text.split("\n") if s.strip() and len(s.strip()) < 50]
            cv_data["skills"].extend(skills)
        
        # Experience
        elif any(keyword in section_title for keyword in ["experience", "work", "employment"]):
            # Simple extraction - in production, use structured parsing
            cv_data["experience"].append({
                "title": section.get("title", "Professional Experience"),
                "company": "Various",  # Would need better parsing
                "duration": "N/A",
                "description": section_text.strip(),
                "key_achievements": []
            })
        
        # Education
        elif "education" in section_title:
            cv_data["education"].append({
                "degree": section.get("title", "Degree"),
                "institution": "N/A",  # Would need better parsing
                "graduation_year": None,
                "field_of_study": section_text.strip()
            })
        
        # Certifications
        elif any(keyword in section_title for keyword in ["certification", "certificate", "license"]):
            certs = [s.strip() for s in section_text.split("\n") if s.strip()]
            cv_data["certifications"].extend(certs)
        
        # Languages
        elif "language" in section_title:
            langs = [s.strip() for s in section_text.split(",") if s.strip()]
            if not langs:
                langs = [s.strip() for s in section_text.split("\n") if s.strip()]
            cv_data["languages"].extend(langs)
    
    # Determine experience level based on experience count and text
    experience_count = len(cv_data["experience"])
    if experience_count >= 5:
        cv_data["experience_level"] = "senior"
    elif experience_count >= 2:
        cv_data["experience_level"] = "mid"
    else:
        cv_data["experience_level"] = "entry"
    
    return cv_data


@router.get("/{resume_id}/cv-data")
async def get_cv_data(resume_id: str, use_enhanced: bool = True) -> Any:
    """
    Get CV data in job-matcher compatible format
    
    Args:
        resume_id: Resume ID
        use_enhanced: If True, use enhanced version if available (default: True)
        
    Returns:
        CV data formatted for job-matcher service
    """
    try:
        # Get original resume
        resume_doc = await get_parsed_resume(resume_id)
        if not resume_doc:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Try to get enhanced version if requested
        enhanced_version = None
        if use_enhanced:
            try:
                enhanced_version = await get_latest_resume_version(resume_id)
            except Exception as e:
                logger.warning("Could not fetch enhanced version", error=str(e))
        
        # Extract CV data
        cv_data = extract_cv_data_from_resume(resume_doc, enhanced_version)
        
        logger.info("CV data extracted", resume_id=resume_id, enhanced=enhanced_version is not None)
        
        return {
            "resume_id": resume_id,
            "cv_data": cv_data,
            "enhanced": enhanced_version is not None,
            "metadata": {
                "filename": resume_doc.get("filename"),
                "version": resume_doc.get("version", 1)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to extract CV data", resume_id=resume_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to extract CV data: {str(e)}")


@router.get("/user/{user_id}/latest-cv")
async def get_user_latest_cv(user_id: str, use_enhanced: bool = True, x_user_id: Optional[str] = Header(None)) -> Any:
    """
    Get latest CV data for a user (for job-matcher integration)
    
    This endpoint is called by job-matcher service to fetch CV data for "Use Current CV" feature
    
    Args:
        user_id: User ID
        use_enhanced: If True, use enhanced version if available
        
    Returns:
        CV data formatted for job-matcher service
    """
    try:
        # Query MongoDB for user's latest resume
        from app.db_mongo import get_db
        
        db = get_db()
        resumes_collection = db.resumes
        
        # Find latest resume for user
        cursor = resumes_collection.find({"user_id": user_id}).sort("_id", -1).limit(1)
        resumes = await cursor.to_list(length=1)
        
        if not resumes:
            raise HTTPException(
                status_code=404, 
                detail=f"No resume found for user_id: {user_id}"
            )
        
        resume_doc = resumes[0]
        resume_id = resume_doc.get("_id")
        
        # Get enhanced version if requested
        enhanced_version = None
        if use_enhanced:
            try:
                enhanced_version = await get_latest_resume_version(resume_id)
            except Exception:
                pass
        
        # Extract CV data
        cv_data = extract_cv_data_from_resume(resume_doc, enhanced_version)
        
        # Add resume_id to cv_data for job-matcher to use
        cv_data["resume_id"] = resume_id
        
        logger.info("User latest CV fetched", user_id=user_id, resume_id=resume_id)
        
        return {
            "user_id": user_id,
            "resume_id": resume_id,
            "cv_data": cv_data,
            "enhanced": enhanced_version is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch user CV", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to fetch user CV: {str(e)}")
