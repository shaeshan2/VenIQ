"""
Audio Ingestion Service

Accepts either:
  - A YouTube URL  → downloads audio-only via yt-dlp, converts to WAV
  - An MP3 file path (already saved by the route) → converts to WAV

Returns a dict with track metadata and the path to the WAV file.
All ingested audio is stored in audio/ingested/<track_id>.wav
"""

import os
import uuid
import subprocess
from pathlib import Path

INGESTED_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "audio", "ingested")


def ingest_youtube(youtube_url: str) -> dict:
    """
    Download audio from a YouTube URL using yt-dlp.

    Requires: yt-dlp and ffmpeg installed on the system.
    pip install yt-dlp  /  brew install ffmpeg  /  apt install ffmpeg

    Returns:
        { "track_id": str, "title": str, "duration_s": int, "wav_path": str }
    """
    os.makedirs(INGESTED_DIR, exist_ok=True)
    track_id = str(uuid.uuid4())
    output_template = os.path.join(INGESTED_DIR, f"{track_id}.%(ext)s")

    # yt-dlp: audio only, best quality, convert to wav via ffmpeg post-processor
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--extract-audio",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "--output", output_template,
        "--print", "title",          # prints title to stdout before download
        "--no-warnings",
        youtube_url,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp failed: {result.stderr.strip()}")

    wav_path = os.path.join(INGESTED_DIR, f"{track_id}.wav")
    if not os.path.exists(wav_path):
        raise FileNotFoundError(f"Expected WAV not found after download: {wav_path}")

    title = result.stdout.strip().split("\n")[0] or "Unknown Title"
    duration_s = _get_duration(wav_path)

    return {"track_id": track_id, "title": title, "duration_s": duration_s, "wav_path": wav_path}


def ingest_mp3(mp3_path: str) -> dict:
    """
    Convert an uploaded MP3 file to WAV and register it.

    Args:
        mp3_path: absolute path to the saved MP3 upload

    Returns:
        { "track_id": str, "title": str, "duration_s": int, "wav_path": str }
    """
    os.makedirs(INGESTED_DIR, exist_ok=True)
    track_id = str(uuid.uuid4())
    wav_path = os.path.join(INGESTED_DIR, f"{track_id}.wav")

    # Use pydub (wraps ffmpeg) to convert
    from pydub import AudioSegment
    audio = AudioSegment.from_mp3(mp3_path)
    audio.export(wav_path, format="wav")

    title = Path(mp3_path).stem
    duration_s = int(len(audio) / 1000)

    return {"track_id": track_id, "title": title, "duration_s": duration_s, "wav_path": wav_path}


def _get_duration(wav_path: str) -> int:
    """Return duration in seconds using ffprobe, fallback to pydub."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", wav_path],
            capture_output=True, text=True, timeout=10,
        )
        return int(float(result.stdout.strip()))
    except Exception:
        from pydub import AudioSegment
        return int(len(AudioSegment.from_wav(wav_path)) / 1000)
