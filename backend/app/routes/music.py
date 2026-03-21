import os
import uuid
from flask import Blueprint, request, jsonify, send_file, current_app
from app.services.music_transform import transform_music, wav_to_mp3
from app.services.ingest import INGESTED_DIR, get_track_title

music_bp = Blueprint("music", __name__)

# In-memory session map: session_id → output mp3 path
_sessions: dict[str, dict] = {}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "audio", "output")


@music_bp.route("/transform", methods=["POST"])
def transform():
    """
    Transform one or more ingested tracks using mood + age profile.

    Body (JSON):
        track_ids   (list[str]): one or more track_ids from /api/ingest
        mood        (str):       "happy" | "sad" | "anxious" | "calm"
        age_bracket (str):       "young" | "middle" | "senior"

    Returns:
        { "playlist": [{ "session_id": "...", "audio_url": "...", "title": "..." }] }
    """
    data = request.get_json(silent=True) or {}
    track_ids = data.get("track_ids", [])
    mood = data.get("mood", "calm")
    age_bracket = data.get("age_bracket", "middle")

    if not track_ids:
        return jsonify({"error": "track_ids list is required"}), 400

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    playlist = []

    for track_id in track_ids:
        wav_path = os.path.join(INGESTED_DIR, f"{track_id}.wav")
        session_id = str(uuid.uuid4())
        output_path = os.path.join(OUTPUT_DIR, f"{session_id}.mp3")

        try:
            transform_music(wav_path, mood, age_bracket, output_path)
            audio_path = output_path
        except Exception:
            # Fall back: serve original WAV converted to MP3 unmodified
            try:
                import librosa
                y, sr = librosa.load(wav_path, sr=None, mono=True)
                wav_to_mp3(y, sr, output_path)
                audio_path = output_path
            except Exception:
                audio_path = None

        title = get_track_title(track_id)
        _sessions[session_id] = {"path": audio_path, "title": title}

        playlist.append({
            "session_id": session_id,
            "audio_url": f"/api/stream/{session_id}",
            "title": title,
        })

    return jsonify({"playlist": playlist})


@music_bp.route("/stream/<session_id>", methods=["GET"])
def stream(session_id: str):
    """Stream a transformed audio file."""
    entry = _sessions.get(session_id)
    path = entry.get("path") if entry else None

    if not path or not os.path.exists(path):
        fallback = current_app.config.get("FALLBACK_TRACK", "")
        if fallback and os.path.exists(fallback):
            return send_file(fallback, mimetype="audio/mpeg", conditional=True)
        return jsonify({"error": "Audio not found"}), 404

    return send_file(path, mimetype="audio/mpeg", conditional=True)
