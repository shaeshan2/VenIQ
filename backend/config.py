import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    MAX_CONTENT_LENGTH = 64 * 1024 * 1024  # 64 MB — large enough for MP3 uploads
    FALLBACK_TRACK = os.path.join(os.path.dirname(__file__), "audio", "fallback", "calm_default.mp3")
    DEFAULT_MOOD = "calm"
    DEFAULT_AGE_BRACKET = "middle"
