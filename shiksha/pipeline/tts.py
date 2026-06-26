"""Text-to-speech stage.

Synthesises per-segment voiceovers with Microsoft Edge TTS (no API key needed),
writing an ``.mp3`` the FFmpeg merge stage later muxes onto the animation.
"""

from pathlib import Path

import edge_tts

from shiksha.core.helpers import run_async_safely

VOICE = "en-US-AriaNeural"


async def _tts_async(save_file_path: str, script: str) -> None:
    Path(save_file_path).parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(script, voice=VOICE)
    await communicate.save(save_file_path)


def generate_voice(save_file_path: str, script: str) -> None:
    """Synthesise ``script`` to ``save_file_path`` (blocking, thread-safe)."""
    run_async_safely(_tts_async(save_file_path, script))
