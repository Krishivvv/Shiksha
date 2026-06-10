<div align="center">
  <h1>🧠 Shishka AI</h1>
  <p><strong>Type a topic. Get a full animated lesson — script, visuals, voiceover, and a quiz.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg" />
  </p>
</div>

<br />

> **Shishka AI** turns a single text prompt (or an uploaded PDF) into a complete educational video: it writes the script, generates and renders `p5.js` animations frame-by-frame in a headless browser, narrates them with neural TTS, stitches everything together with FFmpeg, and generates a quiz and PDF study notes at the end.

---

## ✨ Features

- 🎬 **Automated video pipeline** — prompt → script → animation → voiceover → final `.mp4`.
- 🗣️ **Neural narration** via `edge-tts`.
- 🧠 **Auto-generated quizzes** and **PDF study notes** for every lesson.
- 🧪 **Headless animation rendering** with Pyppeteer + CCapture.js (p5.js).
- 📊 **Live progress** streamed to the UI while a video is generated.
- 🔐 **Accounts & history** — sign up, log in, and revisit past generations.

---

## 🏗️ Architecture & Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Landing page, auth, and the generation tool (SPA). |
| **Backend** | Python / Flask | REST API, auth, and pipeline orchestration. |
| **Task queue** | RQ + Redis | Runs the heavy generation pipeline off the request path. |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Users, videos, quizzes. |
| **Animation** | p5.js, Pyppeteer, CCapture | Generates code and renders it in headless Chrome. |
| **LLMs** | Google Gemini / KodeKloud (OpenAI-compatible) | Scripts, animation code, and quiz questions. |
| **Voice** | edge-tts | Converts the script to speech. |
| **Video** | FFmpeg | Merges frames + audio into the final video. |
| **Storage** | Local FS (dev) / S3 or Cloudflare R2 (prod) | Stores generated artifacts. |

---

## 🚀 Getting Started (local development)

### 1. Backend (Flask)

```bash
# from the repo root
python -m venv .venv && . .venv/Scripts/activate   # Windows
# source .venv/bin/activate                        # macOS / Linux

pip install -r requirements.txt

cp .env.example .env        # then fill in the values (see below)
python app.py               # http://localhost:5000
```

**Required environment variables** (see [.env.example](.env.example)):

| Variable | Notes |
| :--- | :--- |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GOOGLE_API_KEY` *or* `KODEKLOUD_API_KEY` | At least one LLM provider. |
| `REDIS_URL` | Local Redis or a free Upstash instance. |
| `DATABASE_URL` | Defaults to SQLite; use Postgres in production. |

> 🔒 **Never commit your `.env`.** It is gitignored. Keep real keys out of the repo and out of the frontend.

### 2. Frontend (React + Vite)

```bash
cd frontend/vidlearn-frontend-main
npm install
npm run dev          # dev server with HMR
npm run build        # outputs to ../../frontend/build (served by Flask)
```

---

## 🛰️ Production deployment

The app is designed to run behind **nginx (TLS via Let's Encrypt)** with **gunicorn** serving Flask and a separate **RQ worker** doing the heavy lifting.

```bash
# 1. Web server (handles API + serves the built SPA)
gunicorn --workers 4 --timeout 120 --bind 127.0.0.1:5000 wsgi:application

# 2. Background worker (run one or more)
rq worker video --url "$REDIS_URL"
```

Set these in the environment for production:

```env
FLASK_ENV=production
USE_TASK_QUEUE=true
DATABASE_URL=postgresql://user:pass@host:5432/shishka
ALLOWED_ORIGINS=https://your-domain.com
STORAGE_BACKEND=s3            # optional: persist artifacts to S3 / Cloudflare R2
```

In production the app automatically enables:

- **Secure session cookies** (`Secure`, `HttpOnly`, `SameSite=Lax`).
- **HSTS** and a strict **Content-Security-Policy** (plus `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) via Flask-Talisman.
- **CSRF protection** (Flask-WTF) on all state-changing endpoints.
- **Rate limiting** backed by Redis.

A sample nginx server block (TLS, SPA fallback, API proxy, long-term asset caching) is in [nginx.txt](nginx.txt).

---

## 🔐 Security & ops notes

- Static assets are content-hashed by Vite — serve `/assets/*` with `Cache-Control: immutable, max-age=31536000` and keep `index.html` uncacheable.
- Generated artifacts can be offloaded to object storage (`STORAGE_BACKEND=s3`) so the app scales horizontally.
- Run `pip-audit` (Python) and `npm audit` (frontend) before each release.

---

<div align="center">
  <sub>Built with ❤️ and a lot of caffeine by Krishiv.</sub>
</div>
