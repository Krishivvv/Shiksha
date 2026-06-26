"""Shiksha application package.

Builds the Flask application at import time and exposes it (plus the shared
extension instances) as module-level attributes so the rest of the codebase can
``from shiksha import app, db, limiter, csrf``. The route handlers and the
health endpoint are registered at the bottom of this module, after the app and
its extensions exist, to avoid circular imports.

Entry points:
    * ``wsgi.py``           -> ``from shiksha import app``  (gunicorn ``wsgi:app``)
    * ``shiksha.services.tasks`` -> ``from shiksha import app, db`` (RQ worker)
"""

import logging
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()  # must be first, before any module that reads env vars at import time

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_login import LoginManager, current_user
from flask_migrate import Migrate
from flask_talisman import Talisman
from flask_wtf.csrf import CSRFProtect, generate_csrf
from werkzeug.middleware.proxy_fix import ProxyFix

from shiksha import config
from shiksha.models import User, db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

# ── Paths ────────────────────────────────────────────────────────────────────
# Repo root is the parent of this package; the compiled SPA lives in frontend/build.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_BUILD = os.path.join(ROOT_DIR, "frontend", "build")

# ── Flask app ──────────────────────────────────────────────────────────────────

app = Flask(__name__, static_folder=FRONTEND_BUILD, template_folder=FRONTEND_BUILD)

# Honour X-Forwarded-* from the nginx/Cloudflare reverse proxy so request.is_secure,
# the client IP (rate limiting) and generated URLs are correct behind TLS termination.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

# Fail fast on a missing/placeholder secret.
if not config.SECRET_KEY or config.SECRET_KEY in (
    "your-secret-key-change-me",
    "replace_with_random_64_char_hex_string",
):
    raise RuntimeError("Set a real SECRET_KEY in your environment before running")

app.config.update(
    SECRET_KEY=config.SECRET_KEY,
    SQLALCHEMY_DATABASE_URI=config.DATABASE_URL,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SQLALCHEMY_ENGINE_OPTIONS=(
        {"pool_pre_ping": True, "pool_recycle": 280, "pool_size": 10, "max_overflow": 20}
        if config.IS_POSTGRES else {}
    ),
    UPLOAD_FOLDER=os.path.join(ROOT_DIR, "uploads"),
    MAX_CONTENT_LENGTH=config.MAX_CONTENT_LENGTH,
    # Session cookie hardening
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=config.IS_PRODUCTION,
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
    # CSRF (Flask-WTF): token carried in a readable cookie + X-CSRFToken header
    WTF_CSRF_TIME_LIMIT=None,
    WTF_CSRF_SSL_STRICT=False,
)

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(os.path.join(ROOT_DIR, "output"), exist_ok=True)

db.init_app(app)
Migrate(app, db)

# ── Security headers (CSP / HSTS / X-Frame-Options / nosniff / Referrer-Policy) ──

_csp = {
    "default-src": "'self'",
    "script-src": "'self'",
    # React renders inline style attributes; the favicon is an inline data: SVG.
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:"],
    "media-src": "'self'",
    "connect-src": "'self'",
    "object-src": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "frame-ancestors": "'none'",
}

Talisman(
    app,
    content_security_policy=_csp,
    # nginx already redirects :80 -> :443, so don't double-redirect here (avoids loops);
    # ProxyFix lets Talisman still emit HSTS on proxied HTTPS requests.
    force_https=False,
    strict_transport_security=config.IS_PRODUCTION,
    strict_transport_security_max_age=31536000,
    strict_transport_security_include_subdomains=True,
    session_cookie_secure=config.IS_PRODUCTION,
    frame_options="DENY",
    referrer_policy="strict-origin-when-cross-origin",
    permissions_policy="camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
)

csrf = CSRFProtect(app)


@app.after_request
def _security_response(response):
    # Hand the CSRF token to the SPA via a readable cookie — but never on cacheable
    # static assets (a Set-Cookie there would defeat CDN/browser caching).
    path = request.path
    if not (path.startswith("/assets/") or path.startswith("/favicon")):
        if "csrf_token" not in request.cookies:
            response.set_cookie(
                "csrf_token", generate_csrf(),
                secure=config.IS_PRODUCTION, samesite="Lax", httponly=False,
            )
    return response


# CORS — restrict to known frontend origins (must be explicit when credentials are sent)
if config.IS_PRODUCTION and any("localhost" in o for o in config.ALLOWED_ORIGINS):
    logger.warning("ALLOWED_ORIGINS still contains localhost in production: %s", config.ALLOWED_ORIGINS)
CORS(
    app,
    resources={r"/*": {"origins": config.ALLOWED_ORIGINS}},
    supports_credentials=True,
    allow_headers=["Content-Type", "X-CSRFToken", "X-CSRF-Token"],
)


# ── Rate limiter ───────────────────────────────────────────────────────────────

def _rate_limit_key() -> str:
    """Rate-limit per authenticated user when possible, else per client IP."""
    if current_user.is_authenticated:
        return f"user:{current_user.id}"
    return get_remote_address()


def _resolve_storage() -> str:
    """Return a Redis URI for the limiter, or ``memory://`` if Redis is unreachable."""
    if config.REDIS_URL:
        try:
            import redis as _redis
            _redis.from_url(config.REDIS_URL).ping()
            return config.REDIS_URL
        except Exception:
            msg = "Redis unavailable (%s); rate limiter falling back to in-memory (per-process)"
            if config.IS_PRODUCTION:
                logger.error(msg + " — set a reachable REDIS_URL in production", config.REDIS_URL)
            else:
                logger.warning(msg, config.REDIS_URL)
    return "memory://"


limiter = Limiter(
    app=app,
    key_func=_rate_limit_key,
    default_limits=["1000 per hour"],
    storage_uri=_resolve_storage(),
)


# ── Flask-Login ────────────────────────────────────────────────────────────────

login_manager = LoginManager(app)
login_manager.login_view = "login"


@login_manager.user_loader
def load_user(user_id: str):
    return db.session.get(User, int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Authentication required. Please log in."}), 401


with app.app_context():
    db.create_all()


# ── Error handlers (JSON for API, SPA for everything else) ───────────────────────

def _wants_json() -> bool:
    return request.path != "/" and (
        request.accept_mimetypes.best == "application/json"
        or request.path.rsplit("/", 1)[-1] in {
            "login", "signup", "logout", "generate-video", "generate-quiz",
            "upload-pdf", "download-video", "download-pdf", "history", "progress",
            "csrf-token", "health",
        }
        or request.path.startswith(("/task-status", "/quiz"))
    )


@app.errorhandler(404)
def _not_found(e):
    if _wants_json():
        return jsonify({"error": "Not found."}), 404
    # Let the SPA render its own 404 route.
    return send_from_directory(app.static_folder, "index.html"), 404


@app.errorhandler(413)
def _too_large(e):
    return jsonify({"error": "Uploaded file is too large."}), 413


@app.errorhandler(429)
def _rate_limited(e):
    return jsonify({"error": "Too many requests. Please slow down and try again shortly."}), 429


@app.errorhandler(500)
def _server_error(e):
    logger.exception("Unhandled server error")
    return jsonify({"error": "An internal error occurred. Please try again later."}), 500


# ── Register routes (imported last to avoid circular imports) ────────────────────

from shiksha.api import health as _health  # noqa: E402,F401
from shiksha.api import routes as _routes  # noqa: E402,F401

__all__ = ["app", "db", "limiter", "csrf", "login_manager"]
