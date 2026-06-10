import asyncio
import base64
import logging
from pathlib import Path
from jinja2 import Template
import os
import shutil
from helper import safe_launch

logger = logging.getLogger(__name__)

def generate_html(js_code, output_html_path="temp_render.html"):
    template_text = Path("base.html").read_text()
    template = Template(template_text)
    rendered_html = template.render(code=js_code)
    logger.debug("Rendered animation template")
    Path(output_html_path).write_text(rendered_html, encoding="utf-8")
    return output_html_path

if os.name == "nt":  # Windows
    possible_paths = [
        os.getenv("CHROME_PATH"),
        shutil.which("chrome"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    ]
    # Select the first path that is not None and exists on disk.
    CHROME_PATH = next((p for p in possible_paths if p and os.path.exists(p)), None)
    if not CHROME_PATH:
        # Fallback: assume "chrome" is in the PATH.
        CHROME_PATH = "chrome"
else:
    # Linux / Unix. Try the common binary names or a default location.
    CHROME_PATH = (
        os.getenv("CHROME_PATH") or
        shutil.which("google-chrome-stable") or
        shutil.which("google-chrome") or
        shutil.which("chromium-browser") or
        shutil.which("chromium") or
        shutil.which("chrome") or
        "/usr/bin/google-chrome-stable"
    )


async def record_animation(html_path, segment_id, duration, segments_folder="segments"):
   #CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe"

    browser = await safe_launch(
        headless=True,
        executablePath=CHROME_PATH,
        args=["--no-sandbox"]
    )

    try:
        page = await browser.newPage()
        page.on('console', lambda msg: logger.debug('[JS] %s', msg.text))

        await page.goto(f"file://{str(Path(html_path).absolute())}", {"timeout": 30000})
        logger.debug("Page loaded")

        await page.waitForSelector("canvas")
        logger.debug("Canvas found")

        await page.evaluate("""
            window.onerror = function(msg, src, line, col, err) {
                console.error("JSERROR: " + msg + " at " + line + ":" + col);
                return true;
            };
        """)

        logger.debug("Injecting CCapture setup and base64 save logic...")

        await page.evaluate(f"""
            try {{
                const capturer = new CCapture({{
                    format: 'webm',
                    framerate: 60,
                    name: '{segment_id}'
                }});
                capturer.start();

                let frameCount = 0;
                const maxFrames = {duration * 60};
                window.blobBase64 = null;

                function captureFrame() {{
                    try {{
                        capturer.capture(document.querySelector('canvas'));
                        frameCount++;

                        if (frameCount >= maxFrames) {{
                            console.log("Max frames reached: " + frameCount);
                            capturer.stop();
                            capturer.save(function(blob) {{
                                console.log("capturer.save() called");
                                const reader = new FileReader();
                                reader.onloadend = function() {{
                                    console.log("base64 generated");
                                    const base64Data = reader.result.split(',')[1];
                                    window.blobBase64 = base64Data;
                                }};
                                reader.onerror = function(e) {{
                                    console.error("FileReader error", e);
                                }};
                                try {{
                                    reader.readAsDataURL(blob);
                                }} catch (err) {{
                                    console.error("Failed to read blob:", err.message);
                                }}
                            }});
                        }} else {{
                            requestAnimationFrame(captureFrame);
                        }}
                    }} catch(e) {{
                        console.error("Error during captureFrame:", e.message);
                    }}
                }}

                captureFrame();
            }} catch(e) {{
                console.error("Top-level capture setup error:", e.message);
            }}
        """)

        logger.debug("Waiting %s seconds for animation to complete...", duration + 10)
        await asyncio.sleep(duration + 10)

        # Wait for blobBase64 to be ready
        logger.debug("Waiting for blobBase64 to be set...")
        for i in range(30):  # wait up to ~30 seconds
            ready = await page.evaluate("typeof window.blobBase64 === 'string' && window.blobBase64.length > 1500") # 1000
            if ready:
                logger.debug("Blob is ready")
                break
            await asyncio.sleep(1.5) # 1
        else:
            raise RuntimeError("Timed out waiting for blob base64.")

        # Decode and save
        base64_str = await page.evaluate("window.blobBase64")
        video_data = base64.b64decode(base64_str)

        out_path = Path(segments_folder) / f"{segment_id}.webm"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(video_data)
        logger.info("Video saved to %s", out_path)

    finally:
        await browser.close()
        logger.debug("Browser closed")