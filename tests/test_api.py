"""API smoke tests: health, validation, auth, and that protected routes 401."""


def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code in (200, 503)  # 503 only if chrome/ffmpeg absent on CI
    body = r.get_json()
    assert set(body["checks"]) == {"database", "redis", "chrome", "ffmpeg"}


def test_csrf_token_endpoint(client):
    r = client.get("/csrf-token")
    assert r.status_code == 200 and "csrf_token" in r.get_json()


def test_signup_validation_rejects_short_password(client):
    r = client.post("/signup", json={"username": "u", "email": "u@e.com", "password": "short"})
    assert r.status_code == 400
    assert "password" in r.get_json()["error"].lower()


def test_signup_then_login_flow(client):
    r = client.post("/signup", json={"username": "alice", "email": "alice@example.com", "password": "password123"})
    assert r.status_code == 200, r.get_json()
    r = client.post("/login", json={"username": "alice", "password": "password123"})
    assert r.status_code == 200 and r.get_json()["success"] is True


def test_protected_route_requires_auth(client):
    assert client.get("/history").status_code == 401
    assert client.post("/generate-video", data={"prompt": "hi"}).status_code == 401


def test_generate_quiz_requires_auth(client):
    assert client.post("/generate-quiz", json={"script": [{"voice_script": "x"}]}).status_code == 401
