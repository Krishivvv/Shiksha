# Deployment

Shiksha is **not** a single-process app. A request kicks off a minutes-long,
CPU/RAM-heavy pipeline (headless Chromium frame capture + FFmpeg muxing + LLM
calls). Running that inline would tie up web workers and fall over under load,
so the system is intentionally **multi-service**:

| Service | Role | Scales on |
|---|---|---|
| **web** (gunicorn `wsgi:app`) | Serves the SPA + JSON API, enqueues jobs | Request volume |
| **worker** (`rq worker video`) | Runs the render pipeline (Chromium + FFmpeg) | Queue depth / CPU |
| **Redis** | RQ broker, progress store, rate-limit store | — |
| **Postgres** | Users, videos, quizzes | — |
| **Object storage** (S3 / R2) | Durable artifact storage + CDN delivery | — |

Chromium and FFmpeg must be present **in the worker image** (the `Dockerfile`
installs both and sets `CHROME_PATH=/usr/bin/chromium`).

---

## Phase 3 — Which deployment shape?

### Option A — Single capped demo (Hugging Face Spaces, Docker)
One container runs gunicorn; the in-process **thread fallback** in
[`shiksha/services/tasks.py`](shiksha/services/tasks.py) executes generation when
no RQ worker is present. SQLite on the ephemeral disk, local artifact storage.

- ✅ Cheapest/simplest; one `Dockerfile`, no managed services; great for a
  recruiter clicking a live link.
- ❌ No horizontal scaling; one slow job blocks others; disk is ephemeral
  (artifacts/DB vanish on restart); cold starts are slow (Chromium boot).
- **Mitigation:** cap concurrency (`--workers 1`), keep prompts short, treat it
  as a *demo*, not production.

### Option B — Production split (recommended for real traffic)
`web` + `worker` + managed Redis + managed Postgres + R2, from one image via
`docker-compose.yml` (local) or the platform mapping below (cloud).

- ✅ Real concurrency ceiling, durable data, artifacts survive restarts, the
  web tier stays responsive under load.
- ❌ More moving parts and a (small) managed-services bill.

**Verdict:** ship **Option A** as the public live demo (link in the README) and
keep **Option B** documented + `docker-compose`-runnable as the "this is how it
scales" story. Both run from the same image.

---

## Phase 4 — Production deploy (managed services)

Recommended free/cheap tiers: **Neon** (Postgres), **Upstash** (Redis),
**Cloudflare R2** (artifacts), **Vercel** (SPA), and any container host
(Railway / Render / Fly) for `web` + `worker`.

### 1. Provision and collect credentials

| Service | What you get | Env var |
|---|---|---|
| Neon | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` | `DATABASE_URL` |
| Upstash | `rediss://default:pass@xxx.upstash.io:6379` | `REDIS_URL` |
| Cloudflare R2 | bucket + S3 API token + account endpoint | `S3_*`, `AWS_*` |

### 2. Environment variables (set on **both** web and worker)

```bash
FLASK_ENV=production
SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))">

# Datastores (managed)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:pass@xxx.upstash.io:6379

# LLM — at least one
KODEKLOUD_API_KEY=<key>           # primary (OpenAI-compatible)
KODEKLOUD_API_KEY_BACKUP=<key>    # optional
GOOGLE_API_KEY=<key>              # quizzes + fallback (recommended to always set)

# Artifact storage → Cloudflare R2
STORAGE_BACKEND=s3
S3_BUCKET=shiksha-artifacts
S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
S3_REGION=auto
AWS_ACCESS_KEY_ID=<r2_access_key_id>
AWS_SECRET_ACCESS_KEY=<r2_secret_access_key>

# CORS — your real SPA origin(s)
ALLOWED_ORIGINS=https://shiksha.vercel.app

# Queue (on by default in production)
USE_TASK_QUEUE=true
RQ_QUEUE_NAME=video
CHROME_PATH=/usr/bin/chromium      # already set in the Docker image
```

### 3. Database migration (release step)

Migrations aren't committed yet (the dir is gitignored). One-time, locally:

```bash
export FLASK_APP=wsgi:app
flask db init        # first time only — generates migrations/
flask db migrate -m "initial schema"
git add migrations/ && git commit -m "Add initial DB migration"
```

Then on every deploy, the **release step** applies them (see `Procfile`):

```bash
flask --app wsgi:app db upgrade
```

> Until migrations are committed, `db.create_all()` in `shiksha/__init__.py`
> still bootstraps the schema on first boot — fine for the demo, but switch to
> `flask db upgrade` for production so schema changes are versioned.

### 4. Process commands

```bash
# web
gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:app
# worker (one or more)
rq worker video --url $REDIS_URL
```

### 5. Frontend → Vercel

```bash
cd frontend/vidlearn-frontend-main
# Vercel project: build = `npm run build`, output dir = ../../frontend/build
# Set VITE_API_URL=https://<your-api-host> so the SPA calls the API cross-origin,
# and add that Vercel domain to ALLOWED_ORIGINS on the API.
```

If you serve the SPA from Flask instead (single origin, simplest), leave
`VITE_API_URL` empty and let gunicorn serve `frontend/build/`.

### 6. Verify

```bash
curl -s https://<api-host>/health | jq      # database/redis/chrome/ffmpeg all ok
```

### Local parity

```bash
cp .env.example .env   # fill SECRET_KEY + an LLM key
docker compose up --build
# web → http://localhost:8000  ·  GET /health should be 200
```

---

## Phase 6 — Portfolio positioning

**GitHub repo description (set under ⚙️ → About):**

> AI educational-video generator — Flask + RQ pipeline that turns a prompt into a
> narrated, animated explainer video (LLM → p5.js → headless Chrome → FFmpeg)
> with auto-generated quizzes and study-note PDFs.

**Topics:** `generative-ai` · `llm` · `rag` · `flask` · `ffmpeg`
`video-generation` · `python` · `rq` · `react` · `mlops`

**Pinning / positioning:**
- **Pin this repo** on your GitHub profile — it's a full, multi-service system
  (web + async workers + storage + auth + security hardening), not a script.
- Lead the README with the **live demo link** and the **architecture diagram** —
  recruiters skim; the diagram communicates seniority in 5 seconds.
- In your resume, frame it around the *hard parts*: "designed an async
  RQ/Redis pipeline orchestrating LLM codegen, headless-Chrome capture and
  FFmpeg, with an S3/R2 storage abstraction and a `/health`-gated multi-service
  Docker deploy."
- Keep the demo on **Option A** so the link always works; reference
  `docker-compose.yml` + this doc as the production story.
