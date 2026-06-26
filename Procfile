# Process definitions for PaaS platforms (Railway, Render, Heroku-style).
# `release` runs DB migrations on each deploy; `web` serves the API + SPA;
# `worker` drains the video-generation queue.
release: flask --app wsgi:app db upgrade
web: gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:app
worker: rq worker video --url $REDIS_URL
