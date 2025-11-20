from typing import Optional, Any, Dict, List
import asyncio
import structlog
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = structlog.get_logger()

_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_url)
        logger.info("mongo.client.init", url=settings.mongo_url)
    return _client


def get_db():
    return get_client()[settings.mongo_db_name]


async def save_parsed_resume(doc: Dict[str, Any]) -> str:
    db = get_db()
    # Ensure _id is set to resume_id for string-based lookup
    if "resume_id" in doc:
        doc["_id"] = doc["resume_id"]
    res = await db.resumes.insert_one(doc)
    logger.info("mongo.inserted.resume", id=str(res.inserted_id))
    return str(res.inserted_id)


async def save_resume_version(resume_id: str, version_doc: Dict[str, Any]) -> str:
    db = get_db()
    version_doc["resume_id"] = resume_id
    res = await db.resume_versions.insert_one(version_doc)
    logger.info("mongo.inserted.resume_version", id=str(res.inserted_id))
    return str(res.inserted_id)


async def get_parsed_resume(resume_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    doc = await db.resumes.find_one({"_id": resume_id})
    if doc is None:
        return None
    # Convert ObjectId fields to str if present
    doc = _normalize_bson(doc)
    return doc


async def get_latest_resume_version(resume_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    doc = await db.resume_versions.find_one({"resume_id": resume_id}, sort=[("_id", -1)])
    if doc is None:
        return None
    return _normalize_bson(doc)


async def get_resume_versions(resume_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    db = get_db()
    cursor = db.resume_versions.find({"resume_id": resume_id}).sort("_id", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_normalize_bson(d) for d in docs]


async def update_ai_analysis(
    resume_id: str,
    enhancement_entry: Dict[str, Any],
    section_score: Dict[str, float],
    overall_ats_score: float
) -> None:
    """
    Update ai_analysis on resume document.
    - Append to enhancement_history (capped at 50 most recent)
    - Update section_scores
    - Update overall_ats_score
    - Update last_analyzed and updated_at timestamps
    """
    from datetime import datetime
    db = get_db()
    
    # Prepare update operations
    update_ops = {
        "$push": {
            "ai_analysis.enhancement_history": {
                "$each": [enhancement_entry],
                "$slice": -50  # Keep only last 50 entries
            }
        },
        "$set": {
            "ai_analysis.last_analyzed": datetime.utcnow(),
            "ai_analysis.overall_ats_score": overall_ats_score,
            "updated_at": datetime.utcnow()
        }
    }
    
    # Update section_scores
    for section, score in section_score.items():
        update_ops["$set"][f"ai_analysis.section_scores.{section}"] = score
    
    result = await db.resumes.update_one(
        {"_id": resume_id},
        update_ops,
        upsert=False
    )
    
    if result.matched_count == 0:
        logger.warning("mongo.update_ai_analysis.not_found", resume_id=resume_id)
    else:
        logger.info("mongo.update_ai_analysis.success", resume_id=resume_id)


def _normalize_bson(doc: Dict[str, Any]) -> Dict[str, Any]:
    from bson import ObjectId
    from datetime import datetime

    def _convert(v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, datetime):
            return v.isoformat()
        if isinstance(v, dict):
            return {k: _convert(val) for k, val in v.items()}
        if isinstance(v, list):
            return [_convert(x) for x in v]
        return v

    return {k: _convert(v) for k, v in doc.items()}
