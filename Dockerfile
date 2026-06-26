# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Shiksha — multi-stage image for the web service AND the RQ worker.
# The worker needs the full media toolchain (headless Chromium + FFmpeg); the
# web service shares the same image for parity. Override the command in compose
# / your platform to run the worker.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build a clean virtualenv with all Python deps ───────────────────
FROM python:3.13-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ── Stage 2: slim runtime with Chromium + FFmpeg ─────────────────────────────
FROM python:3.13-slim AS runtime

# System deps for the render pipeline. `chromium` provides the headless browser
# Pyppeteer drives (we point it at the system binary via CHROME_PATH, so it
# never downloads its own copy).
RUN apt-get update && apt-get install -y --no-install-recommends \
        chromium \
        ffmpeg \
        fonts-liberation \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/venv/bin:$PATH" \
    CHROME_PATH=/usr/bin/chromium \
    PYPPETEER_HOME=/tmp/pyppeteer \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_ENV=production

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY . .

# Drop privileges.
RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p output uploads segments voice final_videos pdf_images /tmp/pyppeteer \
    && chown -R appuser:appuser /app /tmp/pyppeteer
USER appuser

EXPOSE 8000

# Web service by default. The worker overrides this with:
#   rq worker video --url $REDIS_URL
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "wsgi:app"]
