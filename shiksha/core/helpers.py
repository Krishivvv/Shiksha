"""Low-level helpers shared by the pipeline: a signal-safe headless-Chrome
launcher, a thread-safe async runner, a single source of truth for the Chrome
executable path, and a recursive folder-clearer."""

import asyncio
import logging
import os
import shutil
import signal
import threading
from functools import lru_cache
from pathlib import Path

from pyppeteer import launch

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_chrome_path() -> str:
    """Resolve the Chrome/Chromium executable once, cross-platform.

    Honours ``CHROME_PATH`` first, then PATH lookups, then well-known install
    locations. Falls back to a bare ``"chrome"`` so a misconfigured env fails
    loudly at launch rather than at import.
    """
    env_path = os.getenv("CHROME_PATH")
    if os.name == "nt":
        candidates = [
            env_path,
            shutil.which("chrome"),
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ]
        return next((p for p in candidates if p and os.path.exists(p)), None) or "chrome"
    return (
        env_path
        or shutil.which("google-chrome-stable")
        or shutil.which("google-chrome")
        or shutil.which("chromium-browser")
        or shutil.which("chromium")
        or shutil.which("chrome")
        or "/usr/bin/google-chrome-stable"
    )


async def safe_launch(*args, **kwargs):
    original_signal = signal.signal

    def silent_blocker(sig, handler):
        logger.debug("[SafeLaunch] Ignored signal registration for sig=%s", sig)

    signal.signal = silent_blocker  # temporarily ignore
    try:
        return await launch(*args, **kwargs)
    finally:
        signal.signal = original_signal  # restore afterward

# Thread-local storage so each thread reuses one event loop instead of leaking them
_thread_local = threading.local()

def run_async_safely(coroutine):
    """Run an async coroutine from synchronous code, safe for use in threads."""
    # In a background thread there is never a running loop,
    # so always go through the except branch.
    try:
        loop = asyncio.get_running_loop()
        # If we somehow ARE inside a running loop, we cannot call
        # run_until_complete.  This shouldn't happen in the current
        # architecture, but guard against it anyway.
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, coroutine)
            return future.result()
    except RuntimeError:
        # No running loop – normal case for background threads
        loop = getattr(_thread_local, "loop", None)
        if loop is None or loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            _thread_local.loop = loop
        return loop.run_until_complete(coroutine)

def clear_folder(folder_path):
    folder = Path(folder_path)
    folder.mkdir(parents=True, exist_ok=True)

    for item in folder.iterdir():
        try:
            if item.is_file() or item.is_symlink():
                item.unlink()
            elif item.is_dir():
                # Recursively delete all contents
                for root, dirs, files in os.walk(item, topdown=False):
                    for file in files:
                        Path(root, file).unlink()
                    for subdir in dirs:
                        Path(root, subdir).rmdir()
                item.rmdir()
        except Exception as e:
            logger.warning("Failed to delete %s: %s", item, e)

    logger.debug("Cleared contents of folder: %s", folder)
