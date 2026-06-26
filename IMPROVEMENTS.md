# Improvements — prioritized action plan

Priorities: **P1** = do before calling it production-ready · **P2** = strongly
recommended · **P3** = polish. Each item lists the file(s), the concrete change,
and a rough estimate.

## P1 — Production-readiness blockers

| # | Change | File(s) | Est. |
|---|---|---|---|
| 1 | **Version the schema with migrations.** Run `flask db init/migrate` and commit `migrations/`; gate `db.create_all()` to non-production so prod relies on `flask db upgrade` (already in `Procfile`/`DEPLOYMENT.md`). | `shiksha/__init__.py` (guard `create_all`), new `migrations/` | 1h |
| 2 | **Replace Pyppeteer (0.0.25, unmaintained since 2018).** Migrate headless capture to **Playwright for Python** — actively maintained, bundles Chromium, async-native. Removes the brittle `safe_launch` signal hack and the manual `CHROME_PATH` dance. | `shiksha/core/helpers.py`, `shiksha/pipeline/animation.py`, `shiksha/pipeline/orchestrator.py`, `Dockerfile`, `requirements.txt` | 1–1.5d |
| 3 | **Timezone-aware timestamps.** `datetime.utcnow()` is deprecated in 3.12+ (warns in tests). Switch model defaults to `lambda: datetime.now(timezone.utc)`. | `shiksha/models/__init__.py` | 15m |
| 4 | **Don't silently fall back to threads in production.** The thread fallback masks a missing worker (jobs run in the web process). In prod, fail loudly if `USE_TASK_QUEUE` is on but Redis/RQ is unavailable. | `shiksha/services/tasks.py` | 30m |

## P2 — Strongly recommended

| # | Change | File(s) | Est. |
|---|---|---|---|
| 5 | **Expand test coverage:** authenticated `generate-video` happy path (mock `enqueue_generation`), `tasks.run_generation` success/failure DB transitions, and `progress` set/get. | `tests/test_tasks.py` (new), `tests/test_api.py` | 3h |
| 6 | **Structured request logging** with a request id correlated into pipeline progress, so a failed `task_id` is traceable end-to-end. | `shiksha/__init__.py`, `shiksha/services/progress.py` | 2h |
| 7 | **Build the SPA in CI/Docker** instead of committing `frontend/build/` (keeps binaries out of git). Add a Node build stage to the `Dockerfile` and drop the committed build. *(Deferred per current decision to keep build tracked for single-service serve.)* | `Dockerfile`, `.gitignore` | 2h |
| 8 | **Cap pipeline concurrency & resource use:** document/enforce `--workers 1` per worker container (Chromium is RAM-heavy), add per-job memory limits in compose. | `docker-compose.yml`, `DEPLOYMENT.md` | 1h |
| 9 | **Pin a `gemini` model id in config** rather than the hard-coded `"gemini-2.0-flash"`/`"gemini-2.5-flash"` literals scattered in `llm.py`/`quiz.py`. | `shiksha/config.py`, `shiksha/core/llm.py`, `shiksha/pipeline/quiz.py` | 30m |

## P3 — Polish

| # | Change | File(s) | Est. |
|---|---|---|---|
| 10 | Add explicit rate limit to `/logout` (currently only the global default). | `shiksha/api/routes.py` | 5m |
| 11 | Add full type hints to `record_animation`, `merge_*`, `generate_pdf`. | `shiksha/pipeline/*.py` | 1h |
| 12 | Add `pre-commit` (ruff + ruff-format) and an `.editorconfig`. | new `.pre-commit-config.yaml`, `.editorconfig` | 30m |
| 13 | Move `nginx.txt` → `deploy/nginx.conf`; remove dev sample `scripts.json` from the repo root. | repo root | 15m |
| 14 | Tighten the production CSP `style-src` (drop `'unsafe-inline'`) by hashing the SPA's inline styles. | `shiksha/__init__.py` | 1h |

---

## Phase 9 — Final verdict (before → after)

| Dimension | Before | After | Why |
|---|:---:|:---:|---|
| Code Quality | 6 | 8.5 | Flat root with duplicated `CHROME_PATH` and manual validation → packaged, type-hinted, pydantic-validated, deduped; ruff-clean |
| Architecture | 6.5 | 9 | Already had RQ/storage/progress services; now clean `api`/`core`/`pipeline`/`services` boundaries with deferred heavy imports |
| Documentation | 4 | 9 | README rewrite (live link, Mermaid, GIF placeholder), DEPLOYMENT.md, IMPROVEMENTS.md, module docstrings |
| Deployment Readiness | 3 | 8 | Was bare gunicorn notes → multi-stage Dockerfile, docker-compose, Procfile, `.dockerignore`, `/health` gating |
| Resume Value | 6 | 9 | Now reads as a multi-service system with CI/tests/diagram, not a script |
| Recruiter Appeal | 5 | 8.5 | Live-demo-first README, architecture diagram, MIT license, topics/pinning guidance |
| AI/ML Quality | 6.5 | 7.5 | Solid multi-provider fallback already; added generated-code sandbox; model ids still hard-coded (P2 #9) |
| Production Readiness | 4.5 | 7.5 | Added health probe, request validation, code sandbox, tests; Pyppeteer + committed migrations still pending (P1 #1–2) |
| GitHub Best Practices | 3 | 9 | Added CI (lint+test+build), gitleaks scan, Dependabot, LICENSE, tests; history verified secret-free |
| **Overall** | **5.0** | **8.3** | A reviewed, packaged, deployable, tested system with a clear scaling story |

