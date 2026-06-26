"""Test configuration.

Environment is set **before** ``shiksha`` is imported so the app builds with a
hermetic, key-free config (no real LLM/Redis/S3). ``load_dotenv`` does not
override already-set vars, so a developer's real ``.env`` can't leak into tests.
"""

import os
import secrets
import tempfile

os.environ.setdefault("SECRET_KEY", secrets.token_hex(32))
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite:///" + os.path.join(tempfile.gettempdir(), "shiksha_test.db").replace("\\", "/"),
)
# Force a hermetic config regardless of any local .env.
os.environ["REDIS_URL"] = ""
os.environ["USE_TASK_QUEUE"] = "false"
os.environ["GOOGLE_API_KEY"] = ""
os.environ["KODEKLOUD_API_KEY"] = ""
os.environ["KODEKLOUD_API_KEY_BACKUP"] = ""
os.environ["STORAGE_BACKEND"] = "local"

import pytest


@pytest.fixture()
def app():
    import shiksha
    from shiksha.models import db
    shiksha.app.config.update(TESTING=True, WTF_CSRF_ENABLED=False)
    with shiksha.app.app_context():
        # Reset schema each test so a persistent SQLite file can't leak state.
        db.drop_all()
        db.create_all()
        yield shiksha.app
        db.session.remove()


@pytest.fixture()
def client(app):
    return app.test_client()
