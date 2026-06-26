import json
import logging
import re

from google import genai
from google.genai import types

from shiksha import config
from shiksha.core.prompts import quiz_system_prompt

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    """Lazily build the Gemini client so a missing key doesn't crash app import."""
    global _client
    if _client is None:
        if not config.GOOGLE_API_KEY:
            raise RuntimeError("GOOGLE_API_KEY is not configured; cannot generate quizzes.")
        _client = genai.Client(
            api_key=config.GOOGLE_API_KEY,
            http_options=types.HttpOptions(timeout=config.LLM_TIMEOUT * 1000),
        )
    return _client


def generate_quiz(script):
    try:
        full_text = "\n".join([s["voice_script"] for s in script])
        response = _get_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=quiz_system_prompt + "\n\nScript:\n" + full_text,
        )
        text = response.text

        questions = re.findall(
            r"Q:\s*(.*?)\nA\.\s*(.*?)\nB\.\s*(.*?)\nC\.\s*(.*?)\nD\.\s*(.*?)\nAnswer:\s*([A-D])",
            text,
            re.DOTALL,
        )
        # Accept any reasonably sized quiz instead of demanding exactly 10 —
        # LLM output length varies and a 6-question quiz beats a failure.
        return questions[:10] if len(questions) >= 4 else []
    except Exception:
        logger.exception("Quiz generation failed")
        return []


if __name__ == "__main__":
    with open("scripts.json", encoding="utf-8") as f:
        script = json.load(f)
    print(generate_quiz(script))
