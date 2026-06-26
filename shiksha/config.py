"""Central application configuration.

All environment-driven settings live here so the rest of the app never reads
os.getenv directly. Nothing here raises at import time — the app validates the
few hard requirements (SECRET_KEY) during startup so tooling/imports stay cheap.
"""

import os

from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


# ── Environment ──────────────────────────────────────────────────────────────
ENV = os.getenv("FLASK_ENV", "development").strip().lower()
IS_PRODUCTION = ENV == "production" or _bool("PRODUCTION", False)

# ── Secrets ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "")

# ── LLM providers (at least one needed at runtime, not enforced at import) ─────
GOOGLE_API_KEY           = os.getenv("GOOGLE_API_KEY")
KODEKLOUD_API_KEY        = os.getenv("KODEKLOUD_API_KEY")
KODEKLOUD_API_KEY_BACKUP = os.getenv("KODEKLOUD_API_KEY_BACKUP")
KODEKLOUD_BASE_URL       = os.getenv("KODEKLOUD_BASE_URL", "https://api.ai.kodekloud.com/v1")
KODEKLOUD_MODEL          = os.getenv("KODEKLOUD_MODEL", "google/gemini-3.1-pro-preview")

# ── Datastores ───────────────────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL")
_raw_db   = os.getenv("DATABASE_URL", "sqlite:///site.db")


def _normalize_db_url(url: str) -> str:
    """Force the psycopg (v3) driver for Postgres URLs.

    Managed platforms often hand out ``postgres://`` / ``postgresql://`` URLs,
    which SQLAlchemy maps to psycopg2 (not installed). We ship psycopg 3.
    """
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _normalize_db_url(_raw_db)
IS_POSTGRES  = DATABASE_URL.startswith("postgresql")

# ── HTTP / CORS ──────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if o.strip()
]

# Max request body (uploads). Default 50 MB.
MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH_MB", "50")) * 1024 * 1024

# ── Rendering ────────────────────────────────────────────────────────────────
CHROME_PATH = os.getenv("CHROME_PATH")

# External-call timeouts (seconds)
LLM_TIMEOUT     = int(os.getenv("LLM_TIMEOUT", "120"))
FFMPEG_TIMEOUT  = int(os.getenv("FFMPEG_TIMEOUT", "300"))

# ── Background task queue ────────────────────────────────────────────────────
# Default ON in production; falls back to a background thread if RQ/Redis are
# unavailable so local dev keeps working with zero extra processes.
USE_TASK_QUEUE = _bool("USE_TASK_QUEUE", IS_PRODUCTION)
RQ_QUEUE_NAME  = os.getenv("RQ_QUEUE_NAME", "video")
JOB_TIMEOUT    = int(os.getenv("JOB_TIMEOUT", "3600"))

# ── Artifact storage (local filesystem | S3 / Cloudflare R2) ─────────────────
STORAGE_BACKEND       = os.getenv("STORAGE_BACKEND", "local").strip().lower()  # local | s3
S3_BUCKET             = os.getenv("S3_BUCKET")
S3_ENDPOINT_URL       = os.getenv("S3_ENDPOINT_URL")  # set for Cloudflare R2
S3_REGION             = os.getenv("S3_REGION", "auto")
AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
