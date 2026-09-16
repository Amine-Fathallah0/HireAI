"""
API endpoint to export CV data in format compatible with job-matcher service
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, Any, List
import structlog
import re
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
    resume_id = str(resume_doc.get("_id")) if resume_doc.get("_id") else None
    
    # If we have an enhanced version, prefer its sections
    if enhanced_version and "sections" in enhanced_version:
        sections = enhanced_version["sections"]
        logger.info(f"Using enhanced version with {len(sections)} sections")
    
    logger.info(f"Extracting CV data from {len(sections)} sections")
    
    # Extract data from sections
    cv_data = {
        "personal_info": {},
        "summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "certifications": [],
        "languages": [],
        "experience_level": "entry",
        "resume_id": resume_id
    }
    
    for section in sections:
        section_title = (section.get("title") or section.get("type", "")).lower()
        section_text = section.get("text", "")
        
        logger.debug(f"Processing section: '{section_title}' ({len(section_text)} chars)")
        
        # Personal Information / Contact
        if any(keyword in section_title for keyword in ["personal", "contact", "info", "header"]):
            cv_data["personal_info"] = _extract_personal_info(section_text, cv_data["personal_info"])
        
        # Summary / Objective
        elif any(keyword in section_title for keyword in ["summary", "objective", "profile", "about"]):
            cv_data["summary"] = section_text.strip()
            logger.debug(f"Extracted summary: {len(cv_data['summary'])} chars")
        
        # Skills - IMPROVED
        elif any(keyword in section_title for keyword in ["skill", "technical", "competenc", "expertise"]):
            extracted_skills = _extract_skills(section_text)
            cv_data["skills"].extend(extracted_skills)
            logger.info(f"✅ Extracted {len(extracted_skills)} skills from '{section_title}': {extracted_skills[:3]}...")
        
        # Experience
        elif any(keyword in section_title for keyword in ["experience", "work", "employment", "history"]):
            cv_data["experience"].append({
                "title": section.get("title", "Professional Experience"),
                "company": "Various",  # Would need better parsing
                "duration": "N/A",
                "description": section_text.strip(),
                "key_achievements": []
            })
            logger.debug(f"Extracted experience entry")
        
        # Education
        elif any(keyword in section_title for keyword in ["education", "academic", "qualification"]):
            cv_data["education"].append({
                "degree": section.get("title", "Degree"),
                "institution": "N/A",  # Would need better parsing
                "graduation_year": None,
                "field_of_study": section_text.strip()
            })
            logger.debug(f"Extracted education entry")
        
        # Certifications
        elif any(keyword in section_title for keyword in ["certification", "certificate", "license", "credential"]):
            certs = _extract_list_items(section_text)
            cv_data["certifications"].extend(certs)
            logger.debug(f"Extracted {len(certs)} certifications")
        
        # Languages
        elif "language" in section_title:
            langs = _extract_languages(section_text)
            cv_data["languages"].extend(langs)
            logger.debug(f"Extracted {len(langs)} languages")
    
    # CRITICAL: Fallback if no skills found
    if not cv_data["skills"]:
        logger.warning("⚠️  NO SKILLS FOUND! Attempting fallback extraction...")
        cv_data["skills"] = _fallback_skill_extraction(sections)
        
        if not cv_data["skills"]:
            logger.error("❌ CRITICAL: Still no skills after fallback! CV will have 0% match score!")
    
    # Determine experience level based on experience count
    cv_data["experience_level"] = _determine_experience_level(cv_data["experience"])
    
    # Log final extraction results
    logger.info("=" * 60)
    logger.info("CV DATA EXTRACTION COMPLETE")
    logger.info(f"Name: {cv_data['personal_info'].get('name', 'Unknown')}")
    logger.info(f"Skills: {len(cv_data['skills'])} total")
    logger.info(f"Skills preview: {cv_data['skills'][:5]}")
    logger.info(f"Experience: {len(cv_data['experience'])} entries")
    logger.info(f"Education: {len(cv_data['education'])} entries")
    logger.info(f"Experience Level: {cv_data['experience_level']}")
    logger.info("=" * 60)
    
    return cv_data


def _extract_personal_info(text: str, existing_info: dict) -> dict:
    """Extract personal information from text"""
    lines = text.split("\n")
    info = existing_info.copy()
    
    for line in lines:
        line = line.strip()
        
        # Email - use regex for better matching
        if "@" in line and not info.get("email"):
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', line)
            if email_match:
                info["email"] = email_match.group(0)
        
        # Phone - improved regex
        elif not info.get("phone"):
            phone_match = re.search(r'[\+]?[(]?\d{1,4}[)]?[-\s\.]?\(?\d{1,3}\)?[-\s\.]?\d{1,4}[-\s\.]?\d{1,4}[-\s\.]?\d{1,9}', line)
            if phone_match:
                info["phone"] = phone_match.group(0)
        
        # Name (first non-empty line that's not email/phone)
        elif line and not info.get("name") and "@" not in line and len(line) > 2:
            # Skip if line is mostly numbers
            if sum(c.isdigit() for c in line) < len(line) * 0.3:
                info["name"] = line
    
    return info


def _extract_skills(text: str) -> List[str]:
    """
    Extract skills from text with support for multiple formats:
    - Comma-separated: "Python, Java, SQL"
    - Newline-separated: "Python\nJava\nSQL"
    - Bullet points: "• Python\n• Java"
    - Pipe-separated: "Python | Java"
    - Semicolon-separated: "Python; Java"
    """
    skills = []
    
    # Remove common bullet points and markers
    text = re.sub(r'^[\s•●○▪▫■□★☆►▻→⇒⇨-]+', '', text, flags=re.MULTILINE)
    
    # Method 1: Comma-separated (most common)
    if text.count(",") >= 2:  # At least 2 commas = likely comma-separated
        skills = [s.strip() for s in text.split(",") if s.strip()]
    
    # Method 2: Pipe-separated
    elif "|" in text:
        skills = [s.strip() for s in text.split("|") if s.strip()]
    
    # Method 3: Semicolon-separated
    elif text.count(";") >= 2:
        skills = [s.strip() for s in text.split(";") if s.strip()]
    
    # Method 4: Newline-separated (each line is a skill)
    elif "\n" in text:
        skills = [
            s.strip() 
            for s in text.split("\n") 
            if s.strip() and 2 <= len(s.strip()) <= 100
        ]
    
    # Method 5: Single line with spaces (last resort, only for short text)
    elif len(text) < 200 and text.count(" ") <= 10:
        skills = [s.strip() for s in text.split() if 2 <= len(s.strip()) <= 50]
    
    # Clean up skills
    cleaned_skills = []
    for skill in skills:
        # Remove trailing punctuation
        skill = skill.rstrip('.,;:!?')
        # Remove leading bullets/dashes
        skill = re.sub(r'^[-•●○▪▫■□★☆►▻→⇒⇨\s]+', '', skill)
        # Skip if too short or too long
        if 2 <= len(skill) <= 100:
            # Avoid duplicates (case-insensitive)
            if not any(skill.lower() == existing.lower() for existing in cleaned_skills):
                cleaned_skills.append(skill)
    
    return cleaned_skills


def _extract_list_items(text: str) -> List[str]:
    """Extract list items (for certifications, etc.)"""
    # Remove bullets
    text = re.sub(r'^[\s•●○▪▫■□★☆►▻→⇒⇨-]+', '', text, flags=re.MULTILINE)
    
    items = []
    if "\n" in text:
        items = [s.strip() for s in text.split("\n") if s.strip()]
    elif "," in text:
        items = [s.strip() for s in text.split(",") if s.strip()]
    elif text.strip():
        items = [text.strip()]
    
    return items


def _extract_languages(text: str) -> List[str]:
    """Extract languages from text"""
    # Try comma-separated first
    if "," in text:
        langs = [s.strip() for s in text.split(",") if s.strip()]
    # Then newline-separated
    elif "\n" in text:
        langs = [s.strip() for s in text.split("\n") if s.strip()]
    else:
        langs = [text.strip()] if text.strip() else []
    
    # Clean up (remove proficiency levels if present)
    cleaned_langs = []
    for lang in langs:
        # Remove proficiency indicators like "(Native)", "(Fluent)", etc.
        lang = re.sub(r'\([^)]*\)', '', lang).strip()
        # Remove dashes and proficiency levels
        lang = re.sub(r'\s*[-–—]\s*(Native|Fluent|Professional|Basic|Elementary).*', '', lang, flags=re.IGNORECASE).strip()
        if lang:
            cleaned_langs.append(lang)
    
    return cleaned_langs


def _fallback_skill_extraction(sections: List[dict]) -> List[str]:
    """
    Fallback method to extract skills when no dedicated skills section exists.
    Searches for skill-like patterns in the entire resume.
    """
    logger.warning("Using fallback skill extraction - resume may not have a proper Skills section")
    
    skills = set()  # Use set to avoid duplicates
    
    # Common technical skills keywords to look for
    skill_patterns = [
        # Programming languages
        r'\b(python|java|javascript|typescript|c\+\+|c#|ruby|php|swift|kotlin|go|rust|scala|r)\b',
        # Web frameworks
        r'\b(react|angular|vue|node\.?js|express|django|flask|spring|laravel|asp\.net)\b',
        # Databases
        r'\b(sql|mysql|postgresql|mongodb|redis|oracle|sqlite|dynamodb|cassandra)\b',
        # Cloud/DevOps
        r'\b(aws|azure|gcp|docker|kubernetes|jenkins|terraform|ansible|git)\b',
        # Data Science/AI
        r'\b(machine learning|deep learning|ai|data analysis|pandas|numpy|tensorflow|pytorch)\b',
        # Web technologies
        r'\b(html|css|rest api|graphql|json|xml)\b',
        # Methodologies
        r'\b(agile|scrum|devops|ci/cd)\b',
    ]
    
    # Search through all sections
    full_text = " ".join(section.get("text", "") for section in sections).lower()
    
    for pattern in skill_patterns:
        matches = re.finditer(pattern, full_text, re.IGNORECASE)
        for match in matches:
            # Capitalize properly
            skill = match.group(0)
            # Special cases for proper capitalization
            if skill.lower() in ['javascript', 'typescript', 'mongodb', 'postgresql', 'mysql', 'devops']:
                skill = skill.lower().title()
            elif skill.lower() in ['html', 'css', 'sql', 'api', 'xml', 'json', 'aws', 'gcp', 'ai', 'r']:
                skill = skill.upper()
            elif skill.lower() == 'node.js' or skill.lower() == 'nodejs':
                skill = 'Node.js'
            elif skill.lower() == 'asp.net':
                skill = 'ASP.NET'
            
            skills.add(skill)
    
    skills_list = sorted(list(skills))  # Sort alphabetically
    
    if skills_list:
        logger.info(f"✅ Fallback extraction found {len(skills_list)} skills: {skills_list[:5]}...")
    else:
        logger.error("❌ CRITICAL: No skills found even with fallback extraction!")
    
    return skills_list


def _determine_experience_level(experience_entries: List[dict]) -> str:
    """Determine experience level based on experience entries"""
    experience_count = len(experience_entries)
    
    # Also check for years mentioned in descriptions
    total_text = " ".join(entry.get("description", "") for entry in experience_entries).lower()
    
    # Look for year patterns
    year_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', total_text, re.IGNORECASE)
    max_years = max([int(y) for y in year_matches], default=0)
    
    # Determine level based on years or entry count
    if max_years >= 8 or experience_count >= 5:
        return "senior"
    elif max_years >= 4 or experience_count >= 3:
        return "mid"
    elif max_years >= 2 or experience_count >= 2:
        return "junior"
    else:
        return "entry"


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
        logger.info(f"Fetching CV data for resume_id={resume_id}, use_enhanced={use_enhanced}")
        
        # Get original resume
        resume_doc = await get_parsed_resume(resume_id)
        if not resume_doc:
            logger.error(f"Resume not found: {resume_id}")
            raise HTTPException(status_code=404, detail=f"Resume not found: {resume_id}")
        
        # Try to get enhanced version if requested
        enhanced_version = None
        if use_enhanced:
            try:
                enhanced_version = await get_latest_resume_version(resume_id)
                if enhanced_version:
                    logger.info(f"Using enhanced version for resume {resume_id}")
            except Exception as e:
                logger.warning(f"Could not fetch enhanced version: {str(e)}")
        
        # Extract CV data
        cv_data = extract_cv_data_from_resume(resume_doc, enhanced_version)
        
        # Ensure resume_id is set
        if not cv_data.get("resume_id"):
            cv_data["resume_id"] = resume_id
        
        logger.info(f"✅ CV data extracted successfully for {resume_id}: {len(cv_data['skills'])} skills")
        
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
        logger.error(f"Failed to extract CV data for {resume_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to extract CV data: {str(e)}")


@router.get("/user/{user_id}/latest-cv")
async def get_user_latest_cv(
    user_id: str, 
    use_enhanced: bool = True, 
    x_user_id: Optional[str] = Header(None)
) -> Any:
    """
    Get latest CV data for a user (for job-matcher integration)
    
    This endpoint is called by job-matcher service to fetch CV data for "Use Current CV" feature
    
    Args:
        user_id: User ID
        use_enhanced: If True, use enhanced version if available
        x_user_id: Optional user ID from header (for validation)
        
    Returns:
        CV data formatted for job-matcher service
    """
    try:
        logger.info(f"Fetching latest CV for user_id={user_id}, use_enhanced={use_enhanced}")
        
        # Query MongoDB for user's latest resume
        from app.db_mongo import get_db
        
        db = get_db()
        resumes_collection = db.resumes
        
        # Find latest resume for user
        cursor = resumes_collection.find({"user_id": user_id}).sort("_id", -1).limit(1)
        resumes = await cursor.to_list(length=1)
        
        if not resumes:
            logger.warning(f"No resume found for user_id: {user_id}")
            raise HTTPException(
                status_code=404, 
                detail=f"No resume found for user_id: {user_id}"
            )
        
        resume_doc = resumes[0]
        resume_id = str(resume_doc.get("_id"))
        
        logger.info(f"Found resume {resume_id} for user {user_id}")
        
        # Get enhanced version if requested
        enhanced_version = None
        if use_enhanced:
            try:
                enhanced_version = await get_latest_resume_version(resume_id)
                if enhanced_version:
                    logger.info(f"Using enhanced version for resume {resume_id}")
            except Exception as e:
                logger.warning(f"Could not fetch enhanced version: {str(e)}")
        
        # Extract CV data
        cv_data = extract_cv_data_from_resume(resume_doc, enhanced_version)
        
        # Ensure resume_id is set
        if not cv_data.get("resume_id"):
            cv_data["resume_id"] = resume_id
        
        logger.info(f"✅ User latest CV fetched: user_id={user_id}, resume_id={resume_id}, skills={len(cv_data['skills'])}")
        
        return {
            "user_id": user_id,
            "resume_id": resume_id,
            "cv_data": cv_data,
            "enhanced": enhanced_version is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch user CV for {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch user CV: {str(e)}")