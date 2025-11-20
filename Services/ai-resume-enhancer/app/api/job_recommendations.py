"""
API endpoint to receive and store job-specific resume recommendations
from the job-matcher service
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, Any, List, Dict
import structlog
from datetime import datetime
import uuid
from app.db_mongo import get_parsed_resume, get_db

router = APIRouter()
logger = structlog.get_logger()

# MongoDB connection
db = get_db()
job_recommendations_collection = db["job_recommendations"]


class JobRecommendation:
    """Model for job-specific resume recommendations"""
    def __init__(
        self,
        resume_id: str,
        user_id: str,
        job_url: str,
        job_title: str,
        company: str,
        match_score: float,
        recommendations: Dict,
        created_at: datetime = None
    ):
        self.recommendation_id = str(uuid.uuid4())
        self.resume_id = resume_id
        self.user_id = user_id
        self.job_url = job_url
        self.job_title = job_title
        self.company = company
        self.match_score = match_score
        self.recommendations = recommendations
        self.created_at = created_at or datetime.utcnow()
        self.applied = False
        self.applied_at = None


@router.post("/recommendations")
async def save_job_recommendations(
    resume_id: str,
    user_id: str,
    job_url: str,
    job_title: Optional[str] = None,
    company: Optional[str] = None,
    match_score: Optional[float] = 0.0,
    recommendations: Dict = {},
    x_user_id: Optional[str] = Header(None)
) -> Any:
    """
    Save job-specific resume recommendations from job-matcher
    
    This endpoint receives recommendations from job-matcher service and stores them
    for later application by the user in the resume enhancer.
    
    Args:
        resume_id: ID of the resume
        user_id: User ID
        job_url: URL of the job posting
        job_title: Title of the job
        company: Company name
        match_score: Overall match score (0-100)
        recommendations: Dictionary containing:
            - missing_skills: List of skills to add
            - keywords_to_add: Keywords for ATS optimization
            - sections_to_improve: Which sections need work
            - experience_gaps: Experience areas to highlight
            - suggestions: General improvement suggestions
    
    Returns:
        Recommendation ID and summary
    """
    try:
        # Verify resume exists
        resume = await get_parsed_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Create recommendation document
        recommendation_doc = {
            "_id": str(uuid.uuid4()),
            "resume_id": resume_id,
            "user_id": user_id,
            "job_url": job_url,
            "job_title": job_title or "Unknown Position",
            "company": company or "Unknown Company",
            "match_score": match_score,
            "recommendations": {
                "missing_skills": recommendations.get("missing_skills", []),
                "keywords_to_add": recommendations.get("keywords_to_add", []),
                "sections_to_improve": recommendations.get("sections_to_improve", []),
                "experience_gaps": recommendations.get("experience_gaps", []),
                "suggestions": recommendations.get("suggestions", []),
                "resume_optimization": recommendations.get("resume_optimization", {}),
            },
            "applied": False,
            "applied_at": None,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Save to MongoDB
        result = await job_recommendations_collection.insert_one(recommendation_doc)
        
        logger.info(
            "Job recommendations saved",
            recommendation_id=recommendation_doc["_id"],
            resume_id=resume_id,
            user_id=user_id,
            match_score=match_score
        )
        
        return {
            "recommendation_id": recommendation_doc["_id"],
            "resume_id": resume_id,
            "job_title": job_title,
            "company": company,
            "match_score": match_score,
            "recommendations_count": {
                "missing_skills": len(recommendations.get("missing_skills", [])),
                "keywords": len(recommendations.get("keywords_to_add", [])),
                "sections_to_improve": len(recommendations.get("sections_to_improve", [])),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to save job recommendations", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save recommendations: {str(e)}"
        )


@router.get("/recommendations/{recommendation_id}")
async def get_recommendation(recommendation_id: str) -> Any:
    """Get specific job recommendation by ID"""
    try:
        recommendation = await job_recommendations_collection.find_one({"_id": recommendation_id})
        if not recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        return recommendation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch recommendation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/user/{user_id}")
async def get_user_recommendations(
    user_id: str,
    limit: int = 10,
    applied: Optional[bool] = None
) -> Any:
    """
    Get all job recommendations for a user
    
    Args:
        user_id: User ID
        limit: Maximum number of recommendations to return
        applied: Filter by applied status (None = all, True = applied only, False = pending only)
    """
    try:
        query = {"user_id": user_id}
        if applied is not None:
            query["applied"] = applied
        
        cursor = job_recommendations_collection.find(query).sort("created_at", -1).limit(limit)
        recommendations = await cursor.to_list(length=limit)
        
        return {
            "user_id": user_id,
            "count": len(recommendations),
            "recommendations": recommendations
        }
        
    except Exception as e:
        logger.error("Failed to fetch user recommendations", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/resume/{resume_id}")
async def get_resume_recommendations(resume_id: str, limit: int = 10) -> Any:
    """Get all job recommendations for a specific resume"""
    try:
        cursor = job_recommendations_collection.find(
            {"resume_id": resume_id}
        ).sort("created_at", -1).limit(limit)
        
        recommendations = await cursor.to_list(length=limit)
        
        return {
            "resume_id": resume_id,
            "count": len(recommendations),
            "recommendations": recommendations
        }
        
    except Exception as e:
        logger.error("Failed to fetch resume recommendations", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/{recommendation_id}/apply")
async def apply_recommendation(
    recommendation_id: str,
    x_user_id: Optional[str] = Header(None)
) -> Any:
    """
    Mark recommendation as applied and trigger resume enhancement
    
    This endpoint is called when user decides to apply the job-specific
    recommendations to their resume in the enhancer interface.
    
    Args:
        recommendation_id: Recommendation ID to apply
        
    Returns:
        Updated recommendation and enhancement instructions
    """
    try:
        # Get recommendation
        recommendation = await job_recommendations_collection.find_one({"_id": recommendation_id})
        if not recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        if recommendation.get("applied"):
            return {
                "status": "already_applied",
                "message": "This recommendation has already been applied",
                "applied_at": recommendation.get("applied_at")
            }
        
        # Mark as applied
        update_result = await job_recommendations_collection.update_one(
            {"_id": recommendation_id},
            {
                "$set": {
                    "applied": True,
                    "applied_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update recommendation")
        
        logger.info(
            "Recommendation applied",
            recommendation_id=recommendation_id,
            resume_id=recommendation.get("resume_id")
        )
        
        # Return enhancement instructions for the UI
        return {
            "status": "applied",
            "recommendation_id": recommendation_id,
            "resume_id": recommendation.get("resume_id"),
            "job_title": recommendation.get("job_title"),
            "company": recommendation.get("company"),
            "recommendations": recommendation.get("recommendations"),
            "message": "Recommendations are now ready to apply to your resume",
            "next_step": f"/resume/{recommendation.get('resume_id')}/enhance?recommendation_id={recommendation_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to apply recommendation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/recommendations/{recommendation_id}")
async def delete_recommendation(
    recommendation_id: str,
    x_user_id: Optional[str] = Header(None)
) -> Any:
    """Delete a job recommendation"""
    try:
        result = await job_recommendations_collection.delete_one({"_id": recommendation_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        logger.info("Recommendation deleted", recommendation_id=recommendation_id)
        
        return {"status": "deleted", "recommendation_id": recommendation_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete recommendation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
