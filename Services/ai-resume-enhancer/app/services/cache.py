import hashlib
import json
import asyncio
from typing import Optional
from app.core.config import settings

_IN_MEMORY = {}
_REDIS = None


def compute_cache_key(section: str, text: str, context: Optional[dict]) -> str:
    payload = json.dumps({"section": section, "text": text, "context": context}, sort_keys=True)
    h = hashlib.sha256(payload.encode()).hexdigest()
    return f"ai:cache:v1:{h}"


async def _get_redis():
    global _REDIS
    if _REDIS is not None:
        return _REDIS
    url = getattr(settings, "redis_url", None)
    if not url:
        return None
    try:
        import aioredis
        _REDIS = await aioredis.from_url(url)
        return _REDIS
    except Exception:
        return None


async def get(key: str):
    r = await _get_redis()
    if r:
        val = await r.get(key)
        if val is None:
            return None
        try:
            return json.loads(val)
        except Exception:
            return None
    return _IN_MEMORY.get(key)


async def set(key: str, value, ex: int = 3600):
    r = await _get_redis()
    if r:
        try:
            await r.set(key, json.dumps(value), ex=ex)
            return
        except Exception:
            pass
    _IN_MEMORY[key] = value
    # naive expiration: schedule deletion
    async def _expire():
        await asyncio.sleep(ex)
        _IN_MEMORY.pop(key, None)

    asyncio.create_task(_expire())


async def allow_ai_call(user_id: str, limit: int = 15) -> bool:
    # Redis-backed fixed-window per-day limiter when available
    r = await _get_redis()
    key = f"ai:rl:uid:{user_id}:{__import__('datetime').datetime.utcnow().strftime('%Y-%m-%d')}"
    if r:
        try:
            val = await r.incr(key)
            if val == 1:
                # expire in 24h
                await r.expire(key, 24 * 3600)
            return val <= limit
        except Exception:
            pass
    # fallback to in-memory limiter (per-process)
    val = _IN_MEMORY.get(key, 0) + 1
    _IN_MEMORY[key] = val
    return val <= limit


async def compute_cache_key_async(section: str, text: str, context: Optional[dict]):
    return compute_cache_key(section, text, context)
