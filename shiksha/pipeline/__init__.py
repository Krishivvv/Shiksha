"""Video-generation pipeline: orchestrator + animation, video, tts, pdf, quiz stages."""

from shiksha.pipeline.orchestrator import generate_video  # noqa: F401

__all__ = ["generate_video"]
