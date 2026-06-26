"""Pipeline orchestrator: the generated-code safety gate, JSON coercion, and the
end-to-end control flow with every external call (LLM, Chrome, TTS, FFmpeg)
mocked out."""

import json

from shiksha.pipeline import orchestrator as orch

# ── Sandbox layer 1: static scan ─────────────────────────────────────────────

def test_validate_p5_code_accepts_safe_sketch():
    ok, reason = orch.validate_p5_code("function setup(){createCanvas(400,400);} function draw(){ellipse(50,50,80,80);}")
    assert ok is True and reason is None


def test_validate_p5_code_rejects_network_and_eval():
    for bad in ["fetch('https://evil')", "eval('x')", "new Function('a')",
                "localStorage.setItem('a','b')", "new WebSocket('wss://x')"]:
        ok, reason = orch.validate_p5_code(bad)
        assert ok is False and reason


def test_safe_parse_json_handles_fences():
    assert orch.safe_parse_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert orch.safe_parse_json("not json") is None


# ── End-to-end orchestration with mocks ──────────────────────────────────────

def test_generate_video_pipeline(monkeypatch):
    script = [
        {"id": "segment_1", "voice_script": "intro", "animation": "draw a circle", "duration": 2},
        {"id": "segment_2", "voice_script": "outro", "animation": "draw a square", "duration": 2},
    ]

    # First generate_response call returns the script; later calls return notes.
    responses = iter([json.dumps(script)] + ["notes"] * 10)
    monkeypatch.setattr(orch, "generate_response", lambda *a, **k: next(responses))
    monkeypatch.setattr(orch, "generate_valid_animation_code", lambda *a, **k: "// p5 code")
    monkeypatch.setattr(orch, "generate_html", lambda code, **k: "render.html")
    monkeypatch.setattr(orch, "record_animation", lambda *a, **k: None)
    monkeypatch.setattr(orch, "run_async_safely", lambda coro: None)
    monkeypatch.setattr(orch, "generate_voice", lambda *a, **k: None)
    monkeypatch.setattr(orch, "merge_with_ffmpeg", lambda *a, **k: None)
    monkeypatch.setattr(orch, "merge_videos", lambda *a, **k: None)
    monkeypatch.setattr(orch, "extract_last_frame", lambda *a, **k: None)
    monkeypatch.setattr(orch, "generate_pdf", lambda *a, **k: None)
    monkeypatch.setattr(orch, "clear_folder", lambda *a, **k: None)
    monkeypatch.setattr(orch, "set_progress", lambda *a, **k: None)

    success, returned = orch.generate_video("teach binary search", "out.mp4", "tester", task_id="t1")
    assert success is True
    assert returned == script


def test_generate_video_raises_on_bad_script(monkeypatch):
    monkeypatch.setattr(orch, "generate_response", lambda *a, **k: "definitely not json")
    monkeypatch.setattr(orch, "clear_folder", lambda *a, **k: None)
    monkeypatch.setattr(orch, "set_progress", lambda *a, **k: None)
    import pytest
    with pytest.raises(RuntimeError):
        orch.generate_video("x", "out.mp4", "tester")
