import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
    SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    PORT = int(os.getenv("PORT", "5001"))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ENERGY_CHANGE_THRESHOLD = 2   # min delta on 1–10 scale to trigger new recommendation
    DEFAULT_MOOD = "chill"
