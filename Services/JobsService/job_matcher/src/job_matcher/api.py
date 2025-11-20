"""
FastAPI wrapper for JobMatcher CrewAI Flow
This provides REST API endpoints for the job matching microservice
"""

import os
import logging
from typing import Dict, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, HttpUrl
import httpx

from job_matcher.main import JobMatcherFlow

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Job Matcher Service",
    description="AI-powered job matching and resume optimization service",
    version="1.0.0",
    docs_url="/api/v1/jobs/docs",
    redoc_url="/api/v1/jobs/redoc",
    openapi_url="/api/v1/jobs/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment configuration
RESUME_SERVICE_URL = os.getenv("RESUME_SERVICE_URL", "http://resume-service:8083")
RESUME_SERVICE_ENABLED = os.getenv("RESUME_SERVICE_ENABLED", "false").lower() == "true"


# Request/Response Models
class JobMatchRequest(BaseModel):
    """Request model for job matching"""
    user_id: str = Field(..., description="User ID to fetch CV from resume service")
    job_url: HttpUrl = Field(..., description="URL of the job posting to analyze")
    cv_data: Optional[Dict] = Field(
        None, 
        description="Optional CV data. If not provided, will fetch from resume service using user_id"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "job_url": "https://www.linkedin.com/jobs/view/123456789",
                "cv_data": None  # Will be fetched from resume service
            }
        }


class JobMatchResponse(BaseModel):
    """Response model for job matching"""
    request_id: str = Field(..., description="Unique identifier for this matching request")
    user_id: str
    job_url: str
    status: str = Field(..., description="Status: processing, completed, failed")
    match_result: Optional[Dict] = Field(None, description="Matching results if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    created_at: str
    completed_at: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    timestamp: str
    resume_service_status: str
    dependencies: Dict[str, str]


# In-memory storage for job matching results (in production, use Redis/MongoDB)
job_match_results: Dict[str, Dict] = {}


async def fetch_cv_from_resume_service(user_id: str) -> Dict:
    """
    Fetch CV data from Resume Service (AI Resume Enhancer)
    
    Args:
        user_id: User ID to fetch CV for
        
    Returns:
        CV data dictionary in job-matcher compatible format
        
    Raises:
        HTTPException: If resume service is unavailable or CV not found
    """
    if not RESUME_SERVICE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Resume service not available",
                "message": "Resume service is not configured or enabled. Please provide cv_data in the request body.",
                "resume_service_url": RESUME_SERVICE_URL,
                "resume_service_enabled": RESUME_SERVICE_ENABLED
            }
        )
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Call the new cv-data endpoint that returns job-matcher compatible format
            response = await client.get(
                f"{RESUME_SERVICE_URL}/api/resume/user/{user_id}/latest-cv",
                params={"use_enhanced": True}  # Use enhanced version if available
            )
            
            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No resume found for user_id: {user_id}. Please upload a resume first."
                )
            
            response.raise_for_status()
            data = response.json()
            cv_data = data.get("cv_data")
            
            logger.info(f"✅ Fetched CV for user {user_id} from resume service (enhanced: {data.get('enhanced', False)})")
            return cv_data
            
    except httpx.TimeoutException:
        logger.error(f"❌ Timeout fetching CV from resume service for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Resume service request timed out"
        )
    except httpx.RequestError as e:
        logger.error(f"❌ Error connecting to resume service: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Resume service unavailable: {str(e)}"
        )


async def send_recommendations_to_resume_service(
    resume_id: str,
    user_id: str,
    job_url: str,
    match_result: Dict
):
    """
    Send job-specific recommendations to resume service
    
    Args:
        resume_id: Resume ID (if available)
        user_id: User ID
        job_url: Job URL
        match_result: Job matching results containing recommendations
    """
    if not RESUME_SERVICE_ENABLED:
        logger.warning("Resume service not enabled, skipping recommendation save")
        return
    
    try:
        # Extract job info and recommendations from match result
        job_data = match_result.get("scraped_job_details", {}) or match_result.get("scraped_job", {})
        job_title = job_data.get("title", "Unknown Position")
        company = job_data.get("company", "Unknown Company")
        match_score = match_result.get("overall_match_score", 0)
        
        # Extract recommendations
        recommendations_data = {
            "missing_skills": match_result.get("missing_skills", []),
            "keywords_to_add": match_result.get("ats_keywords", []),
            "sections_to_improve": [],
            "experience_gaps": [],
            "suggestions": [],
            "resume_optimization": match_result.get("resume_optimization", {})
        }
        
        # If we have resume_optimization, extract suggestions
        if "resume_optimization" in match_result:
            opt = match_result["resume_optimization"]
            if isinstance(opt, dict):
                for key, value in opt.items():
                    if isinstance(value, str):
                        recommendations_data["suggestions"].append(f"{key}: {value}")
                    elif isinstance(value, list):
                        recommendations_data["suggestions"].extend(value)
        
        # Send to resume service
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{RESUME_SERVICE_URL}/api/resume/recommendations",
                json={
                    "resume_id": resume_id or "unknown",
                    "user_id": user_id,
                    "job_url": job_url,
                    "job_title": job_title,
                    "company": company,
                    "match_score": match_score,
                    "recommendations": recommendations_data
                }
            )
            response.raise_for_status()
            result = response.json()
            logger.info(
                "Recommendations sent to resume service",
                recommendation_id=result.get("recommendation_id"),
                user_id=user_id
            )
            return result.get("recommendation_id")
            
    except Exception as e:
        logger.error(f"Failed to send recommendations to resume service: {e}")
        # Don't fail the job match if recommendation save fails
        return None


def process_job_match(request_id: str, user_id: str, job_url: str, cv_data: Dict):
    """
    Background task to process job matching
    
    Args:
        request_id: Unique request identifier
        user_id: User ID
        job_url: Job posting URL
        cv_data: CV data dictionary
    """
    try:
        logger.info(f"🚀 Starting job match processing for request {request_id}")
        
        # Update status to processing
        job_match_results[request_id]["status"] = "processing"
        
        # Create trigger payload for CrewAI Flow
        trigger_payload = {
            "cv_data": cv_data,
            "candidate_id": user_id,
            "job_url": job_url
        }
        
        # Run the JobMatcher Flow (synchronous call - CrewAI handles its own event loop)
        flow = JobMatcherFlow()
        result = flow.kickoff(inputs={"crewai_trigger_payload": trigger_payload})
        
        # Send recommendations to resume service (async, don't block on failure)
        import asyncio
        try:
            # Get resume_id if available (from cv_data metadata or user's latest resume)
            resume_id = cv_data.get("resume_id") if isinstance(cv_data, dict) else None
            
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            recommendation_id = loop.run_until_complete(
                send_recommendations_to_resume_service(resume_id, user_id, job_url, result)
            )
            loop.close()
            
            # Add recommendation_id to result
            if recommendation_id:
                result["recommendation_id"] = recommendation_id
                
        except Exception as e:
            logger.warning(f"Failed to save recommendations: {e}")
            # Continue even if recommendation save fails
        
        # Update results
        job_match_results[request_id].update({
            "status": "completed",
            "match_result": result,
            "completed_at": datetime.utcnow().isoformat()
        })
        
        logger.info(f"✅ Job match completed for request {request_id}")
        
    except Exception as e:
        logger.error(f"❌ Job match failed for request {request_id}: {e}")
        job_match_results[request_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat()
        })


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    
    # Check resume service health if enabled
    resume_service_status = "disabled"
    if RESUME_SERVICE_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{RESUME_SERVICE_URL}/health")
                resume_service_status = "healthy" if response.status_code == 200 else "unhealthy"
        except Exception:
            resume_service_status = "unavailable"
    
    return HealthResponse(
        status="healthy",
        service="job-matcher",
        timestamp=datetime.utcnow().isoformat(),
        resume_service_status=resume_service_status,
        dependencies={
            "mongodb": "connected",  # TODO: Add actual health checks
            "gemini_api": "configured" if os.getenv("GEMINI_API_KEY") else "not_configured",
            "firecrawl_api": "configured" if os.getenv("FIRECRAWL_API_KEY") else "not_configured"
        }
    )


@app.post("/api/v1/jobs/match", response_model=JobMatchResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_job_match(request: JobMatchRequest, background_tasks: BackgroundTasks):
    """
    Create a new job matching request
    
    This endpoint accepts a user_id and job_url, fetches the CV from the resume service,
    and processes the job match in the background.
    
    If cv_data is provided in the request, it will be used instead of fetching from resume service.
    """
    import uuid
    
    request_id = str(uuid.uuid4())
    logger.info(f"📨 Received job match request {request_id} for user {request.user_id}")
    
    try:
        # Get CV data - either from request or resume service
        if request.cv_data:
            logger.info(f"Using CV data provided in request for user {request.user_id}")
            cv_data = request.cv_data
        else:
            logger.info(f"Fetching CV from resume service for user {request.user_id}")
            cv_data = await fetch_cv_from_resume_service(request.user_id)
        
        # Initialize result tracking
        job_match_results[request_id] = {
            "request_id": request_id,
            "user_id": request.user_id,
            "job_url": str(request.job_url),
            "status": "queued",
            "match_result": None,
            "error": None,
            "created_at": datetime.utcnow().isoformat(),
            "completed_at": None
        }
        
        # Add to background tasks
        background_tasks.add_task(
            process_job_match,
            request_id,
            request.user_id,
            str(request.job_url),
            cv_data
        )
        
        return JobMatchResponse(**job_match_results[request_id])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating job match request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating job match request: {str(e)}"
        )


@app.get("/api/v1/jobs/match/{request_id}", response_model=JobMatchResponse)
async def get_job_match_result(request_id: str):
    """
    Get the result of a job matching request
    
    Returns the current status and result (if completed) of a job matching request.
    """
    if request_id not in job_match_results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job match request {request_id} not found"
        )
    
    return JobMatchResponse(**job_match_results[request_id])


@app.get("/api/v1/jobs/match")
async def list_job_matches(user_id: Optional[str] = None, limit: int = 10):
    """
    List job matching requests
    
    Optionally filter by user_id.
    """
    results = list(job_match_results.values())
    
    if user_id:
        results = [r for r in results if r["user_id"] == user_id]
    
    # Sort by created_at descending
    results.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "total": len(results),
        "results": results[:limit]
    }


@app.delete("/api/v1/jobs/match/{request_id}")
async def delete_job_match(request_id: str):
    """Delete a job match request and its results"""
    if request_id not in job_match_results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job match request {request_id} not found"
        )
    
    del job_match_results[request_id]
    return {"message": "Job match request deleted successfully"}


@app.get("/api/v1/jobs/config")
async def get_configuration():
    """Get current service configuration (for debugging)"""
    return {
        "resume_service": {
            "url": RESUME_SERVICE_URL,
            "enabled": RESUME_SERVICE_ENABLED
        },
        "apis": {
            "gemini": "configured" if os.getenv("GEMINI_API_KEY") else "not_configured",
            "firecrawl": "configured" if os.getenv("FIRECRAWL_API_KEY") else "not_configured"
        },
        "environment": os.getenv("ENVIRONMENT", "development")
    }


# Root redirect
@app.get("/")
async def root():
    """Root endpoint - redirect to docs"""
    return {
        "service": "Job Matcher Service",
        "version": "1.0.0",
        "docs": "/api/v1/jobs/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
