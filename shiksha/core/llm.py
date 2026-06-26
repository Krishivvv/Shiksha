"""LLM access layer.

Wraps the two supported providers behind a single :func:`generate_response`:

  * **KodeKloud** (OpenAI-compatible) is the primary generation provider when a
    key is configured, with an optional backup key and bounded retries.
  * **Google Gemini** is the fallback (and is also used directly by the quiz
    generator).

Also exposes the small JSON/text helpers the pipeline uses to coerce raw model
output into structured data.
"""

import json
import logging
import time

from google import genai
from google.genai import types
from openai import OpenAI

from shiksha import config

logger = logging.getLogger(__name__)

# ── API clients ──────────────────────────────────────────────────────────────

_kodekloud_api_key = config.KODEKLOUD_API_KEY
_kodekloud_backup_api_key = config.KODEKLOUD_API_KEY_BACKUP
_kodekloud_base_url = config.KODEKLOUD_BASE_URL
_kodekloud_model = config.KODEKLOUD_MODEL
_kodekloud_client = (
    OpenAI(api_key=_kodekloud_api_key, base_url=_kodekloud_base_url, timeout=config.LLM_TIMEOUT)
    if _kodekloud_api_key
    else None
)
_kodekloud_backup_client = (
    OpenAI(api_key=_kodekloud_backup_api_key, base_url=_kodekloud_base_url, timeout=config.LLM_TIMEOUT)
    if _kodekloud_backup_api_key
    else None
)

_google_api_key = config.GOOGLE_API_KEY
_genai_client = (
    genai.Client(
        api_key=_google_api_key,
        http_options=types.HttpOptions(timeout=config.LLM_TIMEOUT * 1000),
    )
    if _google_api_key
    else None
)

# Startup validation
if _kodekloud_client:
    logger.info("LLM provider: KodeKloud (%s) model=%s", _kodekloud_base_url, _kodekloud_model)
elif _genai_client:
    logger.info("LLM provider: Google Gemini (fallback)")
else:
    logger.error("NO LLM PROVIDER CONFIGURED — set KODEKLOUD_API_KEY or GOOGLE_API_KEY in .env")


# ── LLM ──────────────────────────────────────────────────────────────────────

def generate_response(msg_history: list[dict], model: str = "gemini-2.0-flash") -> str:
    """Return a completion for ``msg_history`` (OpenAI chat-message format).

    Tries KodeKloud (primary then backup key, with retry/backoff on transient
    errors) and falls back to Gemini. Raises ``RuntimeError`` if no provider can
    produce a non-empty response.
    """
    # ── Try KodeKloud first ──────────────────────────────────────────────
    if _kodekloud_client is not None:
        max_retries = 3
        clients = [("primary", _kodekloud_client)]
        if _kodekloud_backup_client is not None:
            clients.append(("backup", _kodekloud_backup_client))

        last_error = None
        for client_name, client in clients:
            for attempt in range(max_retries):
                try:
                    logger.info("LLM call via KodeKloud %s (attempt %d)", client_name, attempt + 1)
                    response = client.chat.completions.create(
                        model=_kodekloud_model,
                        messages=msg_history,
                    )
                    text = response.choices[0].message.content or ""
                    if not text.strip():
                        raise RuntimeError("LLM returned empty response")
                    return text
                except Exception as e:
                    last_error = e
                    error_text = str(e).lower()
                    is_retryable = (
                        "429" in error_text
                        or "rate limit" in error_text
                        or "quota" in error_text
                        or "401" in error_text
                        or "403" in error_text
                        or "unauthorized" in error_text
                        or "forbidden" in error_text
                        or "500" in error_text
                        or "502" in error_text
                        or "503" in error_text
                        or "timeout" in error_text
                        or "connection" in error_text
                    )
                    if is_retryable and attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 15
                        logger.warning(
                            "KodeKloud %s error (%s). Waiting %ds before retry...",
                            client_name, str(e), wait_time,
                        )
                        time.sleep(wait_time)
                        continue
                    logger.warning("KodeKloud %s failed after attempt %d: %s", client_name, attempt + 1, e)
                    break

            if client_name == "primary" and _kodekloud_backup_client is not None:
                logger.warning("Switching from primary to backup KodeKloud API key.")

        # If KodeKloud failed completely, fall through to Gemini
        logger.warning("All KodeKloud attempts exhausted. Falling back to Gemini... (last error: %s)", last_error)

    # ── Gemini fallback ──────────────────────────────────────────────────
    if _genai_client is None:
        raise RuntimeError(
            "LLM call failed: no working API provider. "
            "KodeKloud keys failed and no valid GOOGLE_API_KEY configured."
        )

    messages = msg_history[:]
    system_instruction = None

    if messages and messages[0]["role"] == "system":
        system_instruction = messages[0]["content"]
        messages = messages[1:]

    def _to_gemini_role(role: str) -> str:
        return "user" if role == "user" else "model"

    contents = [
        types.Content(role=_to_gemini_role(m["role"]), parts=[types.Part(text=m["content"])])
        for m in messages
    ]

    gen_config = types.GenerateContentConfig(system_instruction=system_instruction) if system_instruction else None

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = _genai_client.models.generate_content(model=model, contents=contents, config=gen_config)
            return response.text
        except Exception as e:
            if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e) or "Quota" in str(e):
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 15
                    logger.warning("Rate limited (%s). Waiting %ds and falling back to gemini-2.5-flash...", str(e), wait_time)
                    time.sleep(wait_time)
                    model = "gemini-2.5-flash"
                    continue
            raise RuntimeError(f"Gemini API call failed: {e}") from e


# ── Output helpers ──────────────────────────────────────────────────────────

def safe_text(text: str) -> str:
    """Replace characters that can't round-trip through UTF-8 (FPDF is picky)."""
    return text.encode("utf-8", errors="replace").decode("utf-8")


def extract_code_from_response(content):
    """Return the text payload from a string or a list of content blocks."""
    if isinstance(content, str):
        return content
    for block in content:
        if hasattr(block, "type") and block.type == "text":
            return block.text
    return None


def safe_parse_json(gpt_output: str):
    """Parse model output as JSON, tolerating ```json fenced blocks. None on failure."""
    try:
        if gpt_output.startswith("```json"):
            gpt_output = gpt_output.strip()[7:-3].strip()
        elif gpt_output.startswith("```"):
            gpt_output = gpt_output.strip()[3:-3].strip()
        return json.loads(gpt_output)
    except json.JSONDecodeError as e:
        logger.error("JSON parsing failed: %s\nRaw output (first 500 chars): %s", e, gpt_output[:500])
        return None
