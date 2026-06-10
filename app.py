import os
import json
import uuid
import logging
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()  # must be first, before any module that reads env vars at import time

import config

from flask import Flask, request, jsonify, send_file, send_from_directory, redirect
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_talisman import Talisman
from flask_wtf.csrf import CSRFProtect, generate_csrf

from models import db, User, Video, Quiz
from quiz import generate_quiz
from progress import set_progress, get_progress
from tasks import enqueue_generation
import storage

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

# ── Flask app ──────────────────────────────────────────────────────────────────

FRONTEND_BUILD = os.path.join(os.getcwd(), "frontend", "build")
app = Flask(__name__, static_folder=FRONTEND_BUILD, template_folder=FRONTEND_BUILD)

# Honour X-Forwarded-* from the nginx/Cloudflare reverse proxy so request.is_secure,
# the client IP (rate limiting) and generated URLs are correct behind TLS termination.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

# Fail fast on a missing/placeholder secret.
if not config.SECRET_KEY or config.SECRET_KEY in ("your-secret-key-change-me", "replace_with_random_64_char_hex_string"):
    raise RuntimeError("Set a real SECRET_KEY in your environment before running")

app.config.update(
    SECRET_KEY=config.SECRET_KEY,
    SQLALCHEMY_DATABASE_URI=config.DATABASE_URL,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SQLALCHEMY_ENGINE_OPTIONS=(
        {"pool_pre_ping": True, "pool_recycle": 280, "pool_size": 10, "max_overflow": 20}
        if config.IS_POSTGRES else {}
    ),
    UPLOAD_FOLDER=os.path.join(os.getcwd(), "uploads"),
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
os.makedirs(os.path.join(os.getcwd(), "output"), exist_ok=True)

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
)

csrf = CSRFProtect(app)


@app.after_request
def _security_response(response):
    # Permissions-Policy (override Talisman's default with a stricter policy).
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()"
    )
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

def _rate_limit_key():
    if current_user.is_authenticated:
        return f"user:{current_user.id}"
    return get_remote_address()


def _resolve_storage():
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
def load_user(user_id):
    return db.session.get(User, int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Authentication required. Please log in."}), 401


with app.app_context():
    db.create_all()


# ── Error handlers (JSON for API, SPA for everything else) ───────────────────────

def _wants_json():
    return request.path != "/" and (
        request.accept_mimetypes.best == "application/json"
        or request.path.rsplit("/", 1)[-1] in {
            "login", "signup", "logout", "generate-video", "generate-quiz",
            "upload-pdf", "download-video", "download-pdf", "history", "progress", "csrf-token",
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


# ── CSRF token endpoint (for the SPA bootstrap) ──────────────────────────────────

@app.route("/csrf-token", methods=["GET"])
def csrf_token():
    return jsonify({"csrf_token": generate_csrf()}), 200


# ── Frontend ───────────────────────────────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
@limiter.exempt
def serve_react(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


# ── Auth ───────────────────────────────────────────────────────────────────────

@app.route("/signup", methods=["POST"])
@limiter.limit("10 per minute")
def signup():
    data     = request.json or request.form
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    email    = (data.get("email") or "").strip().lower()

    if not username or not password or not email:
        return jsonify({"error": "Username, email, and password are required."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"error": "Please enter a valid email address."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists."}), 400

    new_user = User(username=username, email=email, password=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"success": True, "message": "Signup successful, please log in."}), 200


@app.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    if current_user.is_authenticated:
        return jsonify({"success": True, "message": "Already logged in."}), 200

    data       = request.json or request.form
    identifier = (data.get("username") or "").strip()
    password   = data.get("password") or ""

    user = (
        User.query.filter_by(email=identifier.lower()).first()
        if identifier and "@" in identifier
        else User.query.filter_by(username=identifier).first()
    )

    if user and check_password_hash(user.password, password):
        login_user(user)
        return jsonify({"success": True, "message": "Logged in successfully."}), 200
    return jsonify({"error": "Invalid credentials."}), 400


@app.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Logged out successfully."}), 200


# ── Video generation (async) ───────────────────────────────────────────────────

@app.route("/generate-video", methods=["POST"])
@login_required
@limiter.limit("3 per minute")
def generate_video_endpoint():
    prompt = request.form.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "Prompt is required."}), 400
    if len(prompt) > 2000:
        return jsonify({"error": "Prompt must be 2000 characters or fewer."}), 400

    # Handle optional file attachment
    attachment_filename = None
    attachment = request.files.get("attachment")
    if attachment and attachment.filename:
        filename = secure_filename(attachment.filename)
        if filename:
            folder = (
                os.path.join(app.config["UPLOAD_FOLDER"], "pdf")
                if filename.lower().endswith(".pdf")
                else os.path.join(app.config["UPLOAD_FOLDER"], "images")
            )
            os.makedirs(folder, exist_ok=True)
            attachment.save(os.path.join(folder, filename))
            attachment_filename = filename
            prompt += f" (See attached file: {filename})"

    task_id  = str(uuid.uuid4())
    username = current_user.username
    user_id  = current_user.id

    words             = prompt.split()
    computed_filename = secure_filename(f"{user_id}_{'_'.join(words[:10])}.mp4")
    user_output_folder = os.path.join("output", f"{username}_output")
    os.makedirs(user_output_folder, exist_ok=True)
    output_file_path = os.path.join(user_output_folder, computed_filename)

    # Create a pending DB record immediately so history shows it
    new_video = Video(
        user_id=user_id,
        filename=computed_filename,
        filepath=output_file_path,
        prompt_text=prompt,
        task_id=task_id,
        status="processing",
        attachment_filename=attachment_filename,
    )
    db.session.add(new_video)
    db.session.commit()
    video_db_id = new_video.id

    set_progress({"state": "processing", "step": "Initializing", "message": ""}, user_id=task_id)

    # Dispatch to the RQ worker pool (falls back to a background thread in dev).
    enqueue_generation(video_db_id, prompt, computed_filename, username, task_id)

    return jsonify({"task_id": task_id, "video_id": video_db_id}), 202


@app.route("/task-status/<task_id>", methods=["GET"])
@login_required
def task_status(task_id):
    info = get_progress(user_id=task_id)
    return jsonify(info), 200


# ── File serving ───────────────────────────────────────────────────────────────

def _safe_user_path(filename):
    """Resolve ``filename`` inside the current user's output folder, or None if it
    would escape that folder (path-traversal guard)."""
    safe_name = secure_filename(filename)
    if not safe_name or safe_name != filename:
        return None, None
    user_dir = os.path.abspath(os.path.join("output", f"{secure_filename(current_user.username)}_output"))
    full_path = os.path.abspath(os.path.join(user_dir, safe_name))
    if os.path.commonpath([user_dir, full_path]) != user_dir:
        return None, None
    return safe_name, full_path


@app.route("/upload-pdf", methods=["POST"])
@login_required
@limiter.limit("20 per minute")
def upload_pdf():
    if "attachment" not in request.files:
        return jsonify({"error": "No file part in request."}), 400
    file = request.files["attachment"]
    if not file.filename:
        return jsonify({"error": "No file selected."}), 400
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Invalid file type. PDF only."}), 400

    filename = secure_filename(file.filename)
    if not filename:
        return jsonify({"error": "Invalid filename."}), 400
    user_folder = os.path.join(app.config["UPLOAD_FOLDER"], f"{secure_filename(current_user.username)}_file", "pdf")
    os.makedirs(user_folder, exist_ok=True)
    save_path = os.path.join(user_folder, filename)
    file.save(save_path)
    return jsonify({"success": True, "filename": filename}), 200


@app.route("/download-video", methods=["GET"])
@login_required
def download_video():
    filename = request.args.get("filename", "").strip()
    if not filename:
        return jsonify({"error": "filename query parameter is required."}), 400

    safe_name, output_path = _safe_user_path(filename)
    if not safe_name:
        return jsonify({"error": "Invalid filename."}), 400

    key = f"outputs/{current_user.username}/{safe_name}"
    if storage.is_s3():
        if not storage.exists(key, output_path):
            return jsonify({"error": "File not found."}), 404
        return redirect(storage.presigned_url(key, download_name=safe_name))

    if not os.path.exists(output_path):
        return jsonify({"error": "File not found."}), 404
    return send_file(output_path, as_attachment=True)


@app.route("/download-pdf", methods=["GET"])
@login_required
def download_pdf():
    local_path = os.path.join("output", f"{secure_filename(current_user.username)}_output", "notes.pdf")
    key = f"outputs/{current_user.username}/notes.pdf"
    if storage.is_s3():
        if not storage.exists(key, local_path):
            return jsonify({"error": "PDF not found."}), 404
        return redirect(storage.presigned_url(key, download_name="study_notes.pdf"))

    if not os.path.exists(local_path):
        return jsonify({"error": "PDF not found."}), 404
    return send_file(local_path, mimetype="application/pdf", as_attachment=True, download_name="study_notes.pdf")


# ── Quiz ───────────────────────────────────────────────────────────────────────

@app.route("/generate-quiz", methods=["POST"])
@login_required
@limiter.limit("10 per minute")
def generate_quiz_endpoint():
    data     = request.get_json(silent=True) or {}
    script   = data.get("script")
    video_id = data.get("video_id")

    if not script:
        return jsonify({"error": "Script is required to generate quiz."}), 400

    quiz = generate_quiz(script)
    if not quiz:
        return jsonify({"error": "Quiz generation failed."}), 500

    # Persist if video_id provided and not already saved
    if video_id:
        video_rec = db.session.get(Video, int(video_id))
        if video_rec and video_rec.user_id == current_user.id:
            existing = Quiz.query.filter_by(video_id=video_id).first()
            if not existing:
                db.session.add(Quiz(video_id=video_id, questions=json.dumps(quiz)))
                db.session.commit()

    return jsonify({"success": True, "quiz": quiz}), 200


@app.route("/quiz/<int:video_id>", methods=["GET"])
@login_required
def get_quiz(video_id):
    video_rec = db.session.get(Video, video_id)
    if not video_rec or video_rec.user_id != current_user.id:
        return jsonify({"error": "Not found."}), 404
    quiz_rec = Quiz.query.filter_by(video_id=video_id).first()
    if not quiz_rec:
        return jsonify({"error": "Quiz not generated yet."}), 404
    return jsonify({"quiz": json.loads(quiz_rec.questions)}), 200


# ── History & progress ─────────────────────────────────────────────────────────

@app.route("/history", methods=["GET"])
@login_required
def history():
    page  = request.args.get("page", 1, type=int)
    limit = min(request.args.get("limit", 20, type=int), 100)
    q = Video.query.filter_by(user_id=current_user.id).order_by(Video.created_at.desc())
    pagination = q.paginate(page=page, per_page=limit, error_out=False)
    videos = [
        {
            "id":          v.id,
            "filename":    v.filename,
            "prompt_text": v.prompt_text,
            "status":      v.status,
            "task_id":     v.task_id,
            "created_at":  v.created_at.isoformat(),
        }
        for v in pagination.items
    ]
    return jsonify({"videos": videos, "total": pagination.total, "page": page, "pages": pagination.pages}), 200


@app.route("/progress", methods=["GET"])
@login_required
def progress():
    info = get_progress(user_id=str(current_user.id))
    return jsonify(info), 200


# ── Run (development only — use gunicorn via wsgi.py in production) ───────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
