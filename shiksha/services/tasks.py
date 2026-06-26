"""Background video-generation jobs.

The video pipeline is CPU/RAM heavy (headless Chrome + FFmpeg) and runs for
minutes. Doing that inline — or in unbounded per-request threads — is the
fastest way to take the origin down under load. So generation is dispatched to
an RQ worker pool backed by Redis.

If the queue is unavailable (e.g. local dev with no worker running) we fall
back to a single background thread so the app still works, just without the
concurrency ceiling.

Run a worker in production with:
    rq worker video --url $REDIS_URL
"""

import logging
import os
import threading

from shiksha import config

logger = logging.getLogger(__name__)

# Fully-qualified path RQ uses to import the job in the worker process.
_JOB_PATH = "shiksha.services.tasks.run_generation"

_queue = None


def get_queue():
    """Return a lazily-created RQ queue, or ``None`` if unavailable."""
    global _queue
    if _queue is None and config.USE_TASK_QUEUE and config.REDIS_URL:
        try:
            from redis import Redis
            from rq import Queue

            _queue = Queue(
                config.RQ_QUEUE_NAME,
                connection=Redis.from_url(config.REDIS_URL),
                default_timeout=config.JOB_TIMEOUT,
            )
        except Exception:
            logger.exception("Could not initialise RQ queue; falling back to threads")
            _queue = None
    return _queue


def enqueue_generation(video_db_id, prompt, computed_filename, username, task_id) -> str:
    """Dispatch a generation job. Returns ``'queued'`` (RQ) or ``'thread'`` (fallback)."""
    queue = get_queue()
    if queue is not None:
        queue.enqueue(
            _JOB_PATH,
            video_db_id, prompt, computed_filename, username, task_id,
            job_timeout=config.JOB_TIMEOUT,
        )
        logger.info("Enqueued generation job task_id=%s via RQ", task_id)
        return "queued"

    threading.Thread(
        target=run_generation,
        args=(video_db_id, prompt, computed_filename, username, task_id),
        daemon=True,
    ).start()
    logger.info("Started generation in background thread task_id=%s (RQ unavailable)", task_id)
    return "thread"


def run_generation(video_db_id, prompt, computed_filename, username, task_id) -> None:
    """Execute the full pipeline. Runs inside an RQ worker or a fallback thread.

    Imports are deferred so the (heavy) media pipeline is only loaded inside the
    worker process, never in the lightweight web process.
    """
    from shiksha import app, db
    from shiksha.models import Video
    from shiksha.pipeline import generate_video
    from shiksha.services import storage
    from shiksha.services.progress import set_progress

    with app.app_context():
        video_rec = db.session.get(Video, video_db_id)
        try:
            success, script = generate_video(prompt, computed_filename, username, task_id=task_id)
            output_file_path = os.path.join("output", f"{username}_output", computed_filename)

            if success and os.path.exists(output_file_path):
                # Push artifacts to object storage if configured (non-fatal).
                try:
                    storage.save_file(output_file_path, f"outputs/{username}/{computed_filename}")
                    pdf_path = os.path.join("output", f"{username}_output", "notes.pdf")
                    if os.path.exists(pdf_path):
                        storage.save_file(pdf_path, f"outputs/{username}/notes.pdf")
                except Exception:
                    logger.exception("Artifact upload failed (task %s)", task_id)

                set_progress(
                    {"state": "completed", "filename": computed_filename, "step": "Completed", "script": script},
                    user_id=task_id,
                )
                if video_rec:
                    video_rec.status = "completed"
            else:
                set_progress(
                    {"state": "failed", "step": "Error", "message": "File not found after generation"},
                    user_id=task_id,
                )
                if video_rec:
                    video_rec.status = "failed"
        except Exception as e:
            logger.exception("Video generation failed for task %s", task_id)
            set_progress({"state": "failed", "step": "Error", "message": str(e)}, user_id=task_id)
            if video_rec:
                video_rec.status = "failed"
                video_rec.error_message = str(e)
        finally:
            if video_rec is not None:
                db.session.commit()
