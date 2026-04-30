import os
from dotenv import load_dotenv

load_dotenv()

REQUIRED_ENV = ["GOOGLE_API_KEY", "SECRET_KEY", "REDIS_URL"]
for _key in REQUIRED_ENV:
    if not os.getenv(_key):
        raise EnvironmentError(f"Missing required environment variable: {_key}")

GOOGLE_API_KEY  = os.getenv("GOOGLE_API_KEY")
SECRET_KEY      = os.getenv("SECRET_KEY")
REDIS_URL       = os.getenv("REDIS_URL")
DATABASE_URL    = os.getenv("DATABASE_URL", "sqlite:///site.db")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
CHROME_PATH     = os.getenv("CHROME_PATH")
