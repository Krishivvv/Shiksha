import json
import logging
import os
import threading

logger = logging.getLogger(__name__)

# Try Redis, fall back to in-memory dict
_client = None
_memory: dict = {}
_lock = threading.Lock()

_REDIS_URL = os.getenv("REDIS_URL")
if _REDIS_URL:
    try:
        import redis
        _client = redis.from_url(_REDIS_URL, decode_responses=True)
        _client.ping()
        logger.info("Progress: using Redis at %s", _REDIS_URL)
    except Exception:
        logger.warning("Progress: Redis unavailable, using in-memory store")
        _client = None

_TTL = 3600


def set_progress(progress_info: dict, user_id: str = "global") -> None:
    if _client:
        try:
            _client.setex(f"progress:{user_id}", _TTL, json.dumps(progress_info))
            return
        except Exception:
            logger.exception("Redis write failed for user_id=%s", user_id)
    with _lock:
        _memory[user_id] = progress_info


def get_progress(user_id: str = "global") -> dict:
    if _client:
        try:
            raw = _client.get(f"progress:{user_id}")
            if raw:
                return json.loads(raw)
        except Exception:
            logger.exception("Redis read failed for user_id=%s", user_id)
    with _lock:
        return _memory.get(user_id, {"state": "not_started", "step": "Not started", "message": ""})
