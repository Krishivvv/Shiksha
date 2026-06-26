import asyncio
import base64
import logging
from pathlib import Path

from jinja2 import Template

from shiksha.core.helpers import get_chrome_path, safe_launch

logger = logging.getLogger(__name__)

# base.html lives alongside the package templates regardless of CWD.
_BASE_HTML = Path(__file__).resolve().parent.parent / "templates" / "base.html"

CHROME_PATH = get_chrome_path()


def generate_html(js_code, output_html_path="temp_render.html"):
    """Render the p5.js sketch into the capture HTML template; returns its path."""
    template_text = _BASE_HTML.read_text(encoding="utf-8")
    template = Template(template_text)
    rendered_html = template.render(code=js_code)
    logger.debug("Rendered animation template")
    Path(output_html_path).write_text(rendered_html, encoding="utf-8")
    return output_html_path


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
        for _ in range(30):  # wait up to ~30 seconds
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
