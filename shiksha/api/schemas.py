"""Request-validation schemas (pydantic v2).

Every state-changing route validates its untrusted input through one of these
models before touching the database or the pipeline. Validation failures are
surfaced as a flat ``{"error": "..."}`` 400 by :func:`validate`, matching the
error shape the SPA already expects.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, ValidationError, field_validator


class _Strict(BaseModel):
    """Base model that strips whitespace and rejects unknown fields."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")


class SignupSchema(_Strict):
    username: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=256)


class LoginSchema(_Strict):
    # Accepts either a username or an email address in a single field.
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=256)


class GenerateVideoSchema(_Strict):
    prompt: str = Field(min_length=1, max_length=2000)


class GenerateQuizSchema(_Strict):
    # ``script`` is the JSON segment list produced by the pipeline.
    script: list[dict[str, Any]] = Field(min_length=1)
    video_id: int | None = None

    @field_validator("script")
    @classmethod
    def _segments_have_voice(cls, v: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not all("voice_script" in seg for seg in v):
            raise ValueError("each script segment must contain a 'voice_script' field")
        return v


def first_error(exc: ValidationError) -> str:
    """Render the first pydantic error as a short, user-facing message."""
    err = exc.errors()[0]
    loc = ".".join(str(p) for p in err.get("loc", ())) or "request"
    return f"{loc}: {err.get('msg', 'invalid value')}"


def validate(schema: type[BaseModel], data: dict[str, Any]) -> tuple[BaseModel | None, str | None]:
    """Validate ``data`` against ``schema``.

    Returns ``(model, None)`` on success or ``(None, message)`` on failure so
    callers can ``return jsonify({"error": message}), 400``.
    """
    try:
        return schema.model_validate(data or {}), None
    except ValidationError as exc:
        return None, first_error(exc)
