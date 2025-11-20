from fastapi import Request, HTTPException
from typing import Optional
import redis.asyncio as redis
from app.core.config import settings
import structlog

logger = structlog.get_logger()

# Subscription tier limits (enhancements per month)
TIER_LIMITS = {
    "free": 3,
    "basic": 10,
    "premium": 50,
    "enterprise": -1,  # unlimited
}

# Daily limit (applies to all tiers for section-level enhancements)
# Adjusted: allow overriding per specific test user.
DEFAULT_DAILY_LIMIT = 10

# Per-user daily overrides (user_id/email depending on identification upstream)
USER_DAILY_OVERRIDES = {
    # test user account request: set back to 10 (explicit for clarity)
    "test@example.com": 10,
}

_redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """Get or create Redis client for rate limiting."""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
            await _redis_client.ping()
            logger.info("rate_limiter.redis.connected")
        except Exception as e:
            logger.error("rate_limiter.redis.failed", error=str(e))
            # Return None if Redis unavailable - rate limiting will be disabled
            return None
    return _redis_client


async def check_rate_limit(user_id: str, tier: str = "free", limit_type: str = "monthly") -> dict:
    """Check if user has remaining enhancement quota.
    
    Args:
        user_id: User identifier
        tier: Subscription tier (free, basic, premium, enterprise)
        limit_type: "monthly" for tier-based limits or "daily" for daily 10/day limit
    
    Returns:
        dict with keys: allowed (bool), remaining (int), limit (int), reset_at (int timestamp)
    """
    # Determine limit based on type
    if limit_type == "daily":
        limit = USER_DAILY_OVERRIDES.get(user_id, DEFAULT_DAILY_LIMIT)
    else:
        limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
    
    # Unlimited tier (monthly only)
    if limit == -1 and limit_type == "monthly":
        return {"allowed": True, "remaining": -1, "limit": -1, "reset_at": None}
    
    redis_client = await get_redis_client()
    if not redis_client:
        # Redis unavailable - allow request but log warning
        logger.warning("rate_limiter.redis.unavailable", user_id=user_id)
        return {"allowed": True, "remaining": limit, "limit": limit, "reset_at": None}
    
    # Get key based on limit type
    import time
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    
    if limit_type == "daily":
        day_key = f"rate_limit:daily:{user_id}:{now.year}:{now.month}:{now.day}"
        rate_key = day_key
        # Reset at end of day
        tomorrow = now + timedelta(days=1)
        reset_at = int(datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, 0).timestamp())
    else:
        month_key = f"rate_limit:{user_id}:{now.year}:{now.month}"
        rate_key = month_key
        # Reset at end of month
        import calendar
        last_day = calendar.monthrange(now.year, now.month)[1]
        reset_at = int(datetime(now.year, now.month, last_day, 23, 59, 59).timestamp())
    
    # Get current usage
    try:
        usage = await redis_client.get(rate_key)
        usage = int(usage) if usage else 0
        
        remaining = limit - usage
        allowed = remaining > 0
        
        return {
            "allowed": allowed,
            "remaining": max(0, remaining),
            "limit": limit,
            "reset_at": reset_at,
            "usage": usage,
            "retry_after": reset_at - int(now.timestamp()) if not allowed else None
        }
    except Exception as e:
        logger.error("rate_limiter.check.failed", error=str(e), user_id=user_id)
        # On error, allow request
        return {"allowed": True, "remaining": limit, "limit": limit, "reset_at": None}


async def increment_usage(user_id: str, limit_type: str = "monthly") -> None:
    """Increment enhancement usage counter for user.
    
    Args:
        user_id: User identifier
        limit_type: "monthly" or "daily"
    """
    redis_client = await get_redis_client()
    if not redis_client:
        logger.warning("rate_limiter.increment.redis.unavailable", user_id=user_id)
        return
    
    from datetime import datetime
    now = datetime.utcnow()
    
    if limit_type == "daily":
        rate_key = f"rate_limit:daily:{user_id}:{now.year}:{now.month}:{now.day}"
        expiry = 60 * 60 * 48  # 48 hours (safety buffer)
    else:
        rate_key = f"rate_limit:{user_id}:{now.year}:{now.month}"
        expiry = 60 * 60 * 24 * 60  # 60 days
    
    try:
        # Increment counter
        await redis_client.incr(rate_key)
        # Set expiry
        await redis_client.expire(rate_key, expiry)
        logger.info("rate_limiter.increment.success", user_id=user_id, key=rate_key, type=limit_type)
    except Exception as e:
        logger.error("rate_limiter.increment.failed", error=str(e), user_id=user_id)


async def rate_limit_middleware(request: Request, user_id: str, tier: str = "free") -> None:
    """Middleware to check rate limits before allowing enhancement requests.
    
    Raises HTTPException 429 if limit exceeded.
    """
    # Only apply to enhancement endpoints
    if "/upload" not in request.url.path or request.url.query.get("enhance") != "true":
        return
    
    result = await check_rate_limit(user_id, tier)
    
    if not result["allowed"]:
        logger.warning("rate_limiter.limit_exceeded", user_id=user_id, tier=tier)
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": f"You have used all {result['limit']} enhancements for this month. Upgrade your plan for more.",
                "limit": result["limit"],
                "remaining": 0,
                "reset_at": result["reset_at"]
            }
        )
