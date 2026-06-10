import os
import json
import asyncio
import logging
import subprocess
from pathlib import Path
from jinja2 import Template
import tempfile
import shutil
import time
from dotenv import load_dotenv

load_dotenv()  # must run before any module that reads env vars at import time

from openai import OpenAI
from google import genai
from google.genai import types
import edge_tts
from werkzeug.utils import secure_filename

import config
from prompts import script_system_prompt, animation_system_prompt, pdf_system_prompt
from video import merge_with_ffmpeg, merge_videos
from animation import generate_html, record_animation
from helper import safe_launch, clear_folder, run_async_safely
from progress import set_progress
from pdf import extract_last_frame, generate_pdf

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

# ── Chrome path ──────────────────────────────────────────────────────────────

if os.name == "nt":
    possible_paths = [
        os.getenv("CHROME_PATH"),
        shutil.which("chrome"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    CHROME_PATH = next((p for p in possible_paths if p and os.path.exists(p)), None) or "chrome"
else:
    CHROME_PATH = (
        os.getenv("CHROME_PATH")
        or shutil.which("google-chrome-stable")
        or shutil.which("google-chrome")
        or shutil.which("chromium-browser")
        or shutil.which("chromium")
        or shutil.which("chrome")
        or "/usr/bin/google-chrome-stable"
    )

logger.info("Using Chrome path: %s", CHROME_PATH)


# ── LLM ──────────────────────────────────────────────────────────────────────

def generate_response(msg_history, model="gemini-2.0-flash"):
    """Use KodeKloud OpenAI-compatible API if configured; fallback to Gemini."""
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
        logger.warning("All KodeKloud attempts exhausted. Falling back to Gemini...")

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

    def _to_gemini_role(role):
        return "user" if role == "user" else "model"

    contents = [
        types.Content(role=_to_gemini_role(m["role"]), parts=[types.Part(text=m["content"])])
        for m in messages
    ]

    config = types.GenerateContentConfig(system_instruction=system_instruction) if system_instruction else None

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = _genai_client.models.generate_content(model=model, contents=contents, config=config)
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


# ── TTS ───────────────────────────────────────────────────────────────────────

async def _tts_async(save_file_path, script):
    # Ensure parent directory exists
    Path(save_file_path).parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(script, voice="en-US-AriaNeural")
    await communicate.save(save_file_path)


def generate_voice(save_file_path, script):
    run_async_safely(_tts_async(save_file_path, script))


# ── Utilities ─────────────────────────────────────────────────────────────────

def safe_text(text):
    return text.encode("utf-8", errors="replace").decode("utf-8")


def extract_code_from_response(content):
    if isinstance(content, str):
        return content
    for block in content:
        if hasattr(block, 'type') and block.type == 'text':
            return block.text
    return None


def safe_parse_json(gpt_output):
    try:
        if gpt_output.startswith("```json"):
            gpt_output = gpt_output.strip()[7:-3].strip()
        elif gpt_output.startswith("```"):
            gpt_output = gpt_output.strip()[3:-3].strip()
        return json.loads(gpt_output)
    except json.JSONDecodeError as e:
        logger.error("JSON parsing failed: %s\nRaw output (first 500 chars): %s", e, gpt_output[:500])
        return None


# ── Animation ─────────────────────────────────────────────────────────────────

def generate_valid_animation_code(prompt, max_attempts=3, task_id="global"):
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
            # Remove first line (```js or ```) and last line (```)
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            clean_code = "\n".join(lines)

        try:
            is_valid, logs = run_async_safely(validate_code_in_browser(clean_code))
            past_error = "\n".join(logs) if isinstance(logs, list) else str(logs)
        except Exception as e:
            logger.warning("Validation error: %s", e)
            is_valid = False

        if is_valid:
            logger.info("Valid animation code generated on attempt %d", attempt)
            return clean_code
        else:
            msg_history.append({"role": "assistant", "content": clean_code})
            msg_history.append({"role": "user", "content": f"The code has an error: {past_error}. Fix it and regenerate the animation: {prompt}"})
            logger.warning("Animation code invalid, retrying...")

    raise RuntimeError("All attempts to generate valid animation code failed.")


async def validate_code_in_browser(js_code):
    html_template = """
    <html>
      <head>
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
    logs = []
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

def generate_placeholder_video(segment_id, duration, seg_folder):
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

def generate_video(user_prompt, output_filename, username, task_id="global"):
    """Generate a full educational video. Returns (success: bool, script: list)."""

    seg_folder   = f"segments/{username}"
    voice_folder = f"voice/{username}"
    final_folder = f"final_videos/{username}"
    pdf_folder   = f"pdf_images/{username}"

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
        voiceover  = segment["voice_script"]
        animation  = segment["animation"]
        duration   = segment["duration"]

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
