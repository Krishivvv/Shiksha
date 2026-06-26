# Deploy Shiksha to Hugging Face Spaces (Option A — single capped demo)

This deploys the **whole app as one Docker container** on a free HF Space:
the web tier serves the SPA + API and runs the render pipeline in an in-process
background thread (no separate worker, no Redis, SQLite on ephemeral disk).

Prereqs: a Hugging Face account and a **write** token
(<https://huggingface.co/settings/tokens>). `git`, `python`, and the
`huggingface_hub` CLI. Replace `<USER>` with your HF username throughout.

---

## 1. Install the CLI and log in

```bash
pip install -U "huggingface_hub[cli]"
huggingface-cli login        # paste your WRITE token
```

## 2. Create the Docker Space

```bash
huggingface-cli repo create shiksha --type space --space_sdk docker -y
```

## 3. Populate the Space repo with the app

Copy **only tracked files** into the Space clone (this excludes `.env`,
`instance/`, generated artifacts, and `node_modules` automatically), then use
the HF-frontmatter README so HF treats it as a Docker Space on port 8000.

```bash
git clone https://huggingface.co/spaces/<USER>/shiksha hf-shiksha
cd hf-shiksha

# Export tracked files from the source repo into here (no secrets/artifacts):
git -C /path/to/oriental-hack archive HEAD | tar -x

# Use the Space README (YAML frontmatter: sdk=docker, app_port=8000):
cp deploy/huggingface/README.md README.md

git add -A
git commit -m "Deploy Shiksha demo (Option A: single Docker container)"
git push
```

> Windows PowerShell equivalent for the export step:
> ```powershell
> git -C F:\Ori-Hack\oriental-hack archive HEAD -o ..\shiksha.tar ; tar -x -f ..\shiksha.tar
> Copy-Item deploy\huggingface\README.md README.md -Force
> ```

The push triggers the HF build (installs Chromium + FFmpeg from the
`Dockerfile`). First build takes several minutes.

## 4. Set Space secrets and variables

In the Space UI → **Settings → Variables and secrets**, or via Python:

```python
from huggingface_hub import add_space_secret, add_space_variable
import secrets

repo = "<USER>/shiksha"
add_space_secret(repo, "SECRET_KEY", secrets.token_hex(32))
add_space_secret(repo, "GOOGLE_API_KEY", "<your-gemini-key>")   # or KODEKLOUD_API_KEY

add_space_variable(repo, "FLASK_ENV", "production")
add_space_variable(repo, "USE_TASK_QUEUE", "false")             # no Redis → thread fallback
add_space_variable(repo, "ALLOWED_ORIGINS", f"https://{repo.split('/')[0]}-shiksha.hf.space")
```

Setting/changing a secret restarts the Space.

## 5. Verify

```bash
curl -s https://<USER>-shiksha.hf.space/health | jq
# → {"status":"ok","checks":{"database":{"ok":true}, "chrome":{"ok":true}, "ffmpeg":{"ok":true}, ...}}
```

Then open `https://<USER>-shiksha.hf.space`, sign up, and generate a short video.
Put this URL in the top of the repo `README.md` (the **▶ Live demo** link).

---

## Demo caveats & tuning

- **Ephemeral storage:** accounts, videos and the SQLite DB reset whenever the
  Space rebuilds/sleeps. Fine for a portfolio demo; not for real users.
- **One slow job blocks the box:** keep prompts short. If the free CPU tier OOMs
  during Chromium capture, lower gunicorn workers — change the `Dockerfile` CMD
  to `--workers 1` and redeploy.
- **Redis-less:** the rate limiter and progress store fall back to in-process
  memory; `USE_TASK_QUEUE=false` keeps generation on the background thread.
- **Upgrade path:** to remove these caps, move to the production split in
  `DEPLOYMENT.md` (RQ worker + Neon + Upstash + R2).
