---
title: Shiksha
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 8000
pinned: true
license: mit
short_description: Prompt-to-video AI lessons with quizzes & notes
---

# Shiksha — live demo (Hugging Face Space)

Type a topic → get a narrated, animated lesson video with a quiz and PDF notes.

> ⚠️ **Demo limits (Option A, single container):** runs the render pipeline
> in an in-process background thread (no separate worker), uses SQLite on the
> Space's **ephemeral disk** (accounts/videos reset on rebuild), and serves
> artifacts from local disk. For the production split (web + worker + managed
> Postgres/Redis/R2) see `DEPLOYMENT.md` in the source repo.

This Space is built from the repo `Dockerfile` (Chromium + FFmpeg baked in).
Health: `GET /health` returns `200` when DB/Chrome/FFmpeg are up.

**Required Space secrets** (Settings → Variables and secrets):
- `SECRET_KEY` — `python -c "import secrets; print(secrets.token_hex(32))"`
- `GOOGLE_API_KEY` **or** `KODEKLOUD_API_KEY` — at least one LLM provider

**Recommended Space variables:**
- `FLASK_ENV=production`
- `USE_TASK_QUEUE=false`  (no Redis in the demo → use the thread fallback)
- `ALLOWED_ORIGINS=https://<your-space-subdomain>.hf.space`
