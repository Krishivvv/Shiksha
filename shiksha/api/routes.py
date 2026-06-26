"""HTTP route handlers.

Registered directly on the application object created in :mod:`shiksha`. Every
state-changing route is guarded by Flask-Login (where auth is required),
Flask-Limiter, CSRF (global, via Flask-WTF), and a pydantic request schema.
"""

import json
import logging
import os
import uuid

from flask import jsonify, redirect, request, send_file, send_from_directory
from flask_login import current_user, login_required, login_user, logout_user
from flask_wtf.csrf import generate_csrf
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from shiksha import app, db, limiter
from shiksha.api.schemas import (
    GenerateQuizSchema,
    GenerateVideoSchema,
    LoginSchema,
    SignupSchema,
    validate,
)
from shiksha.models import Quiz, User, Video
from shiksha.pipeline.quiz import generate_quiz
from shiksha.services import storage
from shiksha.services.progress import get_progress, set_progress
from shiksha.services.tasks import enqueue_generation

logger = logging.getLogger(__name__)


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
    data, err = validate(SignupSchema, dict(request.json or request.form))
    if err:
        return jsonify({"error": err}), 400

    username = data.username
    email = data.email.lower()

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists."}), 400

    new_user = User(username=username, email=email, password=generate_password_hash(data.password))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"success": True, "message": "Signup successful, please log in."}), 200


@app.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    if current_user.is_authenticated:
        return jsonify({"success": True, "message": "Already logged in."}), 200

    data, err = validate(LoginSchema, dict(request.json or request.form))
    if err:
        return jsonify({"error": "Invalid credentials."}), 400

    identifier = data.username
    user = (
        User.query.filter_by(email=identifier.lower()).first()
        if "@" in identifier
        else User.query.filter_by(username=identifier).first()
    )

    if user and check_password_hash(user.password, data.password):
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
    data, err = validate(GenerateVideoSchema, {"prompt": request.form.get("prompt", "")})
    if err:
        return jsonify({"error": err}), 400
    prompt = data.prompt

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

    task_id = str(uuid.uuid4())
    username = current_user.username
    user_id = current_user.id

    words = prompt.split()
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
    # Only the task owner may read its progress.
    video_rec = Video.query.filter_by(task_id=task_id).first()
    if not video_rec or video_rec.user_id != current_user.id:
        return jsonify({"error": "Not found."}), 404
    info = get_progress(user_id=task_id)
    return jsonify(info), 200


# ── File serving ───────────────────────────────────────────────────────────────

def _safe_user_path(filename: str):
    """Resolve ``filename`` inside the current user's output folder, or ``(None, None)``
    if it would escape that folder (path-traversal guard)."""
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
    data, err = validate(GenerateQuizSchema, request.get_json(silent=True) or {})
    if err:
        return jsonify({"error": err}), 400

    quiz = generate_quiz(data.script)
    if not quiz:
        return jsonify({"error": "Quiz generation failed."}), 500

    # Persist if video_id provided and not already saved
    if data.video_id:
        video_rec = db.session.get(Video, data.video_id)
        if video_rec and video_rec.user_id == current_user.id:
            existing = Quiz.query.filter_by(video_id=data.video_id).first()
            if not existing:
                db.session.add(Quiz(video_id=data.video_id, questions=json.dumps(quiz)))
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
    page = request.args.get("page", 1, type=int)
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
