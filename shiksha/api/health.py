"""Health/readiness endpoint.

``GET /health`` probes the four external dependencies the pipeline needs —
Postgres/SQLite, Redis, a headless Chrome/Chromium binary, and FFmpeg — and
reports each independently. Returns ``200`` when every *critical* dependency is
up, otherwise ``503`` so load balancers and ``docker-compose`` healthchecks can
gate traffic. The check is intentionally cheap (no LLM/network calls).
"""

import logging
import os
import shutil

from flask import jsonify
from sqlalchemy import text

from shiksha import app, config, db, limiter

logger = logging.getLogger(__name__)


def _check_db() -> tuple[bool, str]:
    try:
        db.session.execute(text("SELECT 1"))
        return True, "ok"
    except Exception as exc:  # pragma: no cover - depends on live DB
        return False, str(exc)[:120]


def _check_redis() -> tuple[bool, str]:
    if not config.REDIS_URL:
        return False, "REDIS_URL not set"
    try:
        import redis
        redis.from_url(config.REDIS_URL, socket_connect_timeout=2).ping()
        return True, "ok"
    except Exception as exc:
        return False, str(exc)[:120]


def _check_chrome() -> tuple[bool, str]:
    from shiksha.core.helpers import get_chrome_path
    path = get_chrome_path()
    return (True, path) if (path and os.path.exists(path)) else (False, "no chrome/chromium binary found")


def _check_ffmpeg() -> tuple[bool, str]:
    path = shutil.which("ffmpeg")
    return (True, path) if path else (False, "ffmpeg not on PATH")


@app.route("/health", methods=["GET"])
@limiter.exempt
def health():
    checks = {
        "database": _check_db(),
        "redis": _check_redis(),
        "chrome": _check_chrome(),
        "ffmpeg": _check_ffmpeg(),
    }
    # Redis degrades gracefully (memory fallback); DB/Chrome/FFmpeg are hard deps
    # for the pipeline. Report Redis but don't fail readiness solely on it.
    critical = ("database", "chrome", "ffmpeg")
    healthy = all(checks[name][0] for name in critical)

    body = {
        "status": "ok" if healthy else "degraded",
        "checks": {name: {"ok": ok, "detail": detail} for name, (ok, detail) in checks.items()},
    }
    return jsonify(body), (200 if healthy else 503)
