"""WSGI entry point.

Run in production with: ``gunicorn wsgi:app`` (or ``wsgi:application``).
"""

from shiksha import app

# Ensure debug mode is off in production.
if __name__ != "__main__":
    app.config["DEBUG"] = False

# The WSGI callable for your server.
application = app


if __name__ == "__main__":
    # Development only — use gunicorn via wsgi:app in production.
    app.run(host="0.0.0.0", port=5000, debug=False)
