"""Pipeline orchestrator.

Drives the end-to-end generation of an educational video from a single prompt:

    prompt
      -> LLM script (JSON list of segments)
      -> per segment: LLM p5.js animation code  (statically vetted + validated
         in headless Chrome under a restrictive CSP)
      -> headless-Chrome frame capture (.webm)
      -> Edge-TTS voiceover (.mp3)
      -> FFmpeg mux (per-segment .mp4) + LLM study notes
      -> FFmpeg concat (final .mp4) + FPDF notes PDF

The function is synchronous and CPU/RAM heavy; it is meant to run inside an RQ
worker (see :mod:`shiksha.services.tasks`), never inline in the web process.
"""

import asyncio
import logging
import os
import re
import subprocess
import tempfile
from pathlib import Path

from jinja2 import Template

from shiksha import config
from shiksha.core.helpers import clear_folder, get_chrome_path, run_async_safely, safe_launch
from shiksha.core.llm import generate_response, safe_parse_json, safe_text
from shiksha.core.prompts import animation_system_prompt, pdf_system_prompt, script_system_prompt
from shiksha.pipeline.animation import generate_html, record_animation
from shiksha.pipeline.pdf import extract_last_frame, generate_pdf
from shiksha.pipeline.tts import generate_voice
from shiksha.pipeline.video import merge_videos, merge_with_ffmpeg
from shiksha.services.progress import set_progress

logger = logging.getLogger(__name__)

# ── Chrome path (single source of truth in core.helpers) ─────────────────────

CHROME_PATH = get_chrome_path()
logger.info("Using Chrome path: %s", CHROME_PATH)


# ── Generated-code safety (sandbox layer 1: static scan) ──────────────────────
# The LLM-authored p5.js sketch is untrusted code that we execute in a browser.
# Reject sketches that try to reach the network, touch storage, or eval strings
# before we ever render them. Layer 2 is the restrictive CSP in the HTML below.

_PROHIBITED_PATTERNS = [
    (r"\bfetch\s*\(", "network access (fetch)"),
    (r"\bXMLHttpRequest\b", "network access (XMLHttpRequest)"),
    (r"\bWebSocket\b", "network access (WebSocket)"),
    (r"\bimport\s*\(", "dynamic import"),
    (r"\beval\s*\(", "eval()"),
    (r"\bnew\s+Function\b", "new Function()"),
    (r"\blocalStorage\b", "localStorage access"),
    (r"\bsessionStorage\b", "sessionStorage access"),
    (r"\bdocument\.cookie\b", "cookie access"),
    (r"\bnavigator\.sendBeacon\b", "sendBeacon exfiltration"),
]


def validate_p5_code(js_code: str) -> tuple[bool, str | None]:
    """Static gate before rendering untrusted p5.js. Returns ``(ok, reason)``."""
    for pattern, reason in _PROHIBITED_PATTERNS:
        if re.search(pattern, js_code):
            return False, reason
    return True, None


# ── Animation generation + browser validation ────────────────────────────────

def generate_valid_animation_code(prompt: str, max_attempts: int = 3, task_id: str = "global") -> str:
    """Generate p5.js animation code, retrying with the error fed back to the LLM.

    Each candidate is statically vetted (:func:`validate_p5_code`) and then
    executed in headless Chrome to confirm it runs without JS errors. Raises
    ``RuntimeError`` if no attempt yields valid code.
    """
    past_error = ""
    msg_history = [
        {"role": "system", "content": animation_system_prompt},
        {"role": "user", "content": prompt},
    ]
    for attempt in range(1, max_attempts + 1):
        logger.info("Generating animation code (attempt %d)", attempt)
        set_progress({"state": "processing", "step": f"Generating animation (attempt {attempt})", "message": prompt}, user_id=task_id)
        clean_code = generate_response(msg_history)
        # Strip markdown fences if the LLM wrapped the code
        if clean_code.startswith("```"):
            lines = clean_code.strip().split("\n")
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            clean_code = "\n".join(lines)

        # Sandbox layer 1: static scan for dangerous APIs.
        ok, reason = validate_p5_code(clean_code)
        if not ok:
            logger.warning("Animation code rejected by static scan: %s", reason)
            msg_history.append({"role": "assistant", "content": clean_code})
            msg_history.append({"role": "user", "content": (
                f"The code is rejected for security ({reason}). Use only p5.js drawing "
                f"APIs — no network, storage, eval or dynamic imports. Regenerate: {prompt}"
            )})
            continue

        try:
            is_valid, logs = run_async_safely(validate_code_in_browser(clean_code))
            past_error = "\n".join(logs) if isinstance(logs, list) else str(logs)
        except Exception as e:
            logger.warning("Validation error: %s", e)
            is_valid = False

        if is_valid:
            logger.info("Valid animation code generated on attempt %d", attempt)
            return clean_code

        msg_history.append({"role": "assistant", "content": clean_code})
        msg_history.append({"role": "user", "content": f"The code has an error: {past_error}. Fix it and regenerate the animation: {prompt}"})
        logger.warning("Animation code invalid, retrying...")

    raise RuntimeError("All attempts to generate valid animation code failed.")


async def validate_code_in_browser(js_code: str) -> tuple[bool, list]:
    """Run ``js_code`` in headless Chrome under a restrictive CSP and report success.

    Sandbox layer 2: the CSP allows only the p5.js CDN script and blocks all
    network connections (``connect-src 'none'``), so a sketch cannot exfiltrate
    data even if the static scan is bypassed.
    """
    html_template = """
    <html>
      <head>
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com; connect-src 'none'; img-src data:; style-src 'unsafe-inline';">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
        <script>
          window.onerror = function(msg, src, line, col, err) {
            console.error("JSERROR:" + msg);
          };
        </script>
      </head>
      <body>
        <script>
          try {
              {{ code }}
              window.__animationLoaded = true;
          } catch(e) {
              console.error("JSERROR: " + e.message);
          }
        </script>
      </body>
    </html>
    """
    rendered = Template(html_template).render(code=js_code)
    html_path = Path(tempfile.gettempdir()) / "validate_animation.html"
    html_path.write_text(rendered, encoding="utf-8")

    browser = await safe_launch(headless=True, args=["--no-sandbox"], executablePath=CHROME_PATH)
    page = await browser.newPage()
    logs: list = []
    page.on("console", lambda msg: logs.append(msg.text))
    try:
        await page.goto(f"file://{html_path}", {"timeout": 30000})
        await asyncio.sleep(3)
        success = await page.evaluate("window.__animationLoaded === true")
    except Exception:
        success = False
    finally:
        await browser.close()
    has_js_error = any("JSERROR:" in log for log in logs)
    return (success and not has_js_error, logs)


# ── Placeholder video ─────────────────────────────────────────────────────────

def generate_placeholder_video(segment_id: str, duration: int, seg_folder: str) -> None:
    """Render a black placeholder clip so the pipeline survives a failed segment."""
    placeholder_path = f"{seg_folder}/{segment_id}.webm"
    os.makedirs(seg_folder, exist_ok=True)
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-f", "lavfi",
                "-i", f"color=c=black:s=1280x720:d={duration}",
                "-c:v", "libvpx", "-crf", "10", "-b:v", "1M",
                placeholder_path,
            ],
            check=True,
            capture_output=True,
            timeout=config.FFMPEG_TIMEOUT,
        )
        logger.info("Placeholder video created for segment %s", segment_id)
    except subprocess.TimeoutExpired:
        logger.error("Placeholder video creation timed out for segment %s", segment_id)
    except subprocess.CalledProcessError as e:
        logger.error("Failed to create placeholder video: %s", e.stderr.decode(errors="replace"))


# ── Main pipeline ─────────────────────────────────────────────────────────────

def generate_video(user_prompt: str, output_filename: str, username: str, task_id: str = "global") -> tuple[bool, list]:
    """Generate a full educational video. Returns ``(success, script)``."""

    seg_folder = f"segments/{username}"
    voice_folder = f"voice/{username}"
    final_folder = f"final_videos/{username}"
    pdf_folder = f"pdf_images/{username}"

    set_progress({"state": "processing", "step": "Initializing", "message": "Clearing folders"}, user_id=task_id)
    clear_folder(seg_folder)
    clear_folder(voice_folder)
    clear_folder(final_folder)
    clear_folder(pdf_folder)

    msg_history_script = [
        {"role": "system", "content": script_system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    set_progress({"state": "processing", "step": "Generating script", "message": user_prompt}, user_id=task_id)
    raw_script = generate_response(msg_history_script)
    script = safe_parse_json(raw_script)
    if not script:
        raise RuntimeError(f"Script generation returned invalid JSON. Raw (first 500 chars): {raw_script[:500]}")

    notes_list = []

    for idx, segment in enumerate(script):
        segment_id = segment["id"]
        voiceover = segment["voice_script"]
        animation = segment["animation"]
        duration = segment["duration"]

        logger.info("Processing segment %d/%d: %s", idx + 1, len(script), segment_id)
        set_progress({"state": "processing", "step": f"Processing {segment_id} ({idx+1}/{len(script)})", "message": "Generating animation"}, user_id=task_id)
        animation_prompt = f"{animation} to last at least {duration} seconds. The voiceover for this is {voiceover}"

        try:
            animation_code = generate_valid_animation_code(animation_prompt, task_id=task_id)
        except RuntimeError as e:
            logger.warning("Animation code failed for %s: %s — using placeholder", segment_id, e)
            animation_code = None

        if animation_code is not None:
            html_path = generate_html(animation_code)
            set_progress({"state": "processing", "step": f"Recording {segment_id}", "message": "Capturing animation"}, user_id=task_id)
            try:
                run_async_safely(record_animation(html_path, segment_id, duration, segments_folder=seg_folder))
            except Exception as e:
                logger.warning("Recording failed for %s: %s — using placeholder", segment_id, e)
                generate_placeholder_video(segment_id, duration, seg_folder)
        else:
            generate_placeholder_video(segment_id, duration, seg_folder)

        set_progress({"state": "processing", "step": f"Voiceover for {segment_id}", "message": "Synthesising voice"}, user_id=task_id)
        generate_voice(f"{voice_folder}/{segment_id}.mp3", voiceover)

        set_progress({"state": "processing", "step": f"Merging {segment_id}", "message": "Combining audio and video"}, user_id=task_id)
        merge_with_ffmpeg(
            f"{seg_folder}/{segment_id}.webm",
            f"{voice_folder}/{segment_id}.mp3",
            f"{final_folder}/{segment_id}.mp4",
        )
        logger.info("Segment %s complete", segment_id)

        # Generate PDF notes for this segment
        try:
            msg_history_pdf = [
                {"role": "system", "content": pdf_system_prompt},
                {"role": "user", "content": voiceover},
            ]
            pdf_content = safe_text(generate_response(msg_history_pdf))
            segment_img = extract_last_frame(
                f"{seg_folder}/{segment_id}.webm",
                f"{pdf_folder}/{segment_id}.png",
            )
            notes_list.append({"id": segment_id, "notes": pdf_content, "image_path": segment_img})
        except Exception as e:
            logger.warning("PDF notes generation failed for %s: %s", segment_id, e)
            notes_list.append({"id": segment_id, "notes": voiceover, "image_path": None})

    set_progress({"state": "processing", "step": "Merging final video", "message": "Combining all segments"}, user_id=task_id)

    user_output_folder = os.path.join("output", f"{username}_output")
    os.makedirs(user_output_folder, exist_ok=True)
    final_output_path = os.path.join(user_output_folder, output_filename)
    merge_videos(final_folder, final_output_path)

    pdf_filename = os.path.join(user_output_folder, "notes.pdf")
    if os.path.exists(pdf_filename):
        os.remove(pdf_filename)
    try:
        generate_pdf(notes_list, pdf_filename)
        logger.info("PDF notes generated")
    except Exception as e:
        logger.warning("PDF generation failed (non-fatal): %s", e)

    set_progress({"state": "processing", "step": "Completed", "message": "Video ready"}, user_id=task_id)
    return True, script
