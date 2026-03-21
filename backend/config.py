import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ENERGY_CHANGE_THRESHOLD = 3   # min delta on 1–10 scale to trigger new recommendation
    DEFAULT_MOOD = "chill"
