from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.middleware.rate_limiter import check_rate_limit, TIER_LIMITS
import structlog

router = APIRouter()
logger = structlog.get_logger()


# Mock user tier database (in production, fetch from database)
MOCK_USER_TIERS = {
    "default": "free",
}


def get_user_tier(user_id: str) -> str:
    """Get user's subscription tier. 
    
    In production, query from database.
    For now, returns mock data.
    """
    return MOCK_USER_TIERS.get(user_id, "free")


@router.get("/tier")
async def get_current_tier(x_user_id: Optional[str] = Header(None)):
    """Get current user's subscription tier and limits."""
    user_id = x_user_id or "anonymous"
    tier = get_user_tier(user_id)
    
    return {
        "user_id": user_id,
        "tier": tier,
        "limits": {
            "enhancements_per_month": TIER_LIMITS.get(tier, TIER_LIMITS["free"]),
            "tier_name": tier.capitalize()
        }
    }


@router.get("/usage")
async def get_usage_stats(x_user_id: Optional[str] = Header(None)):
    """Get current user's usage statistics and remaining quota (monthly + daily)."""
    user_id = x_user_id or "anonymous"
    tier = get_user_tier(user_id)
    
    # Monthly usage (tier-based)
    monthly_result = await check_rate_limit(user_id, tier, limit_type="monthly")
    
    # Daily usage (10/day for section enhancements)
    daily_result = await check_rate_limit(user_id, tier, limit_type="daily")
    
    return {
        "user_id": user_id,
        "tier": tier,
        "monthly": {
            "usage": monthly_result.get("usage", 0),
            "limit": monthly_result["limit"],
            "remaining": monthly_result["remaining"],
            "reset_at": monthly_result["reset_at"],
            "unlimited": monthly_result["limit"] == -1
        },
        "daily": {
            "usage": daily_result.get("usage", 0),
            "limit": daily_result["limit"],
            "remaining": daily_result["remaining"],
            "reset_at": daily_result["reset_at"]
        },
        # Legacy fields for backward compatibility
        "usage": monthly_result.get("usage", 0),
        "limit": monthly_result["limit"],
        "remaining": monthly_result["remaining"],
        "reset_at": monthly_result["reset_at"],
        "unlimited": monthly_result["limit"] == -1
    }
