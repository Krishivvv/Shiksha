"""Storage abstraction: local backend is a no-op; s3 backend uploads."""


from shiksha import config
from shiksha.services import storage


def test_local_backend_is_not_s3(monkeypatch):
    monkeypatch.setattr(config, "STORAGE_BACKEND", "local")
    assert storage.is_s3() is False


def test_save_file_local_is_noop_and_returns_key(monkeypatch, tmp_path):
    monkeypatch.setattr(config, "STORAGE_BACKEND", "local")
    f = tmp_path / "video.mp4"
    f.write_bytes(b"data")
    assert storage.save_file(str(f), "outputs/u/video.mp4") == "outputs/u/video.mp4"


def test_exists_local(monkeypatch, tmp_path):
    monkeypatch.setattr(config, "STORAGE_BACKEND", "local")
    f = tmp_path / "a.mp4"
    f.write_bytes(b"x")
    assert storage.exists("ignored-key", str(f)) is True
    assert storage.exists("ignored-key", str(tmp_path / "missing.mp4")) is False


def test_s3_backend_uploads(monkeypatch):
    monkeypatch.setattr(config, "STORAGE_BACKEND", "s3")
    monkeypatch.setattr(config, "S3_BUCKET", "bucket")

    calls = {}

    class FakeClient:
        def upload_file(self, local, bucket, key, ExtraArgs=None):
            calls["args"] = (local, bucket, key, ExtraArgs)

    monkeypatch.setattr(storage, "_client", lambda: FakeClient())

    assert storage.is_s3() is True
    key = storage.save_file("/tmp/x.mp4", "outputs/u/x.mp4")
    assert key == "outputs/u/x.mp4"
    assert calls["args"][1] == "bucket"
    assert calls["args"][2] == "outputs/u/x.mp4"
    assert calls["args"][3]["ContentType"] == "video/mp4"
