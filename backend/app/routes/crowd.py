"""
Crowd Analysis Route

POST /api/crowd/analyze
  - Receives a base64 webcam frame
  - Runs Gemini scene description
  - Checks if crowd energy or sentiment has shifted significantly
  - If shifted: picks a song from the curated database, searches YouTube, returns it
  - If stable:  returns { "changed": false }

GET /api/crowd/history
  - Returns the full log of every analysis result

DELETE /api/crowd/history
  - Clears the log
"""

import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from app.services.crowd import describe_crowd
from app.services.songs_db import get_song
from app.services.youtube import search_youtube
from app.routes.playback import set_current_track

crowd_bp = Blueprint("crowd", __name__)

# Persists between requests — tracks previous scene state + played songs
_state: dict = {
    "energy": None,
    "sentiment": None,
    "recently_played": [],
    "last_changed_at": 0.0,  # epoch seconds of last song change
}

SONG_CHANGE_COOLDOWN = 30  # seconds — ignore shifts for this long after a change

# Full log of every analysis — sent to frontend for display
_history: list[dict] = []


@crowd_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    image_b64 = data.get("image_base64")

    if not image_b64:
        return jsonify({"error": "image_base64 is required"}), 400

    scene = describe_crowd(image_b64)
    new_energy    = scene["energy"]
    new_sentiment = scene["sentiment"]
    confidence    = scene["confidence"]
    description   = scene["description"]
    threshold     = current_app.config.get("ENERGY_CHANGE_THRESHOLD", 2)
    timestamp     = datetime.utcnow().isoformat() + "Z"

    prev_energy    = _state["energy"]
    prev_sentiment = _state["sentiment"]
    secs_since_change = time.time() - _state["last_changed_at"]

    energy_shifted    = prev_energy is None or abs(new_energy - prev_energy) >= threshold
    sentiment_shifted = prev_sentiment != new_sentiment

    # Require BOTH a shift AND the cooldown to have elapsed before changing again
    if not (energy_shifted or sentiment_shifted) or (
        prev_energy is not None and secs_since_change < SONG_CHANGE_COOLDOWN
    ):
        entry = {
            "timestamp":   timestamp,
            "changed":     False,
            "energy":      new_energy,
            "sentiment":   new_sentiment,
            "confidence":  confidence,
            "description": description,
            "track":       None,
        }
        _history.append(entry)
        return jsonify(entry)

    _state["energy"]          = new_energy
    _state["sentiment"]       = new_sentiment
    _state["last_changed_at"] = time.time()

    song = get_song(new_sentiment, new_energy, _state["recently_played"])
    track = None

    if song:
        yt = search_youtube(song["name"], song["artist"])
        track = {
            "name":        song["name"],
            "artist":      song["artist"],
            "bpm":         song["bpm"],
            "key":         song["key"],
            "genre":       song["genre"],
            "duration_s":  song["duration_s"],
            "youtube_id":  yt["video_id"]    if yt else None,
            "youtube_url": yt["youtube_url"] if yt else None,
        }
        # Remember this song to avoid immediate repeats
        played_key = f"{song['name']}|{song['artist']}"
        if played_key not in _state["recently_played"]:
            _state["recently_played"].append(played_key)
            if len(_state["recently_played"]) > 20:
                _state["recently_played"].pop(0)

        set_current_track(track, source="auto")

    entry = {
        "timestamp":   timestamp,
        "changed":     True,
        "energy":      new_energy,
        "sentiment":   new_sentiment,
        "confidence":  confidence,
        "description": description,
        "track":       track,
    }
    if not track:
        entry["error"] = "No track found"

    _history.append(entry)
    return jsonify(entry)


@crowd_bp.route("/history", methods=["GET"])
def history():
    return jsonify({"count": len(_history), "history": _history})


@crowd_bp.route("/history", methods=["DELETE"])
def clear_history():
    _history.clear()
    _state["energy"]          = None
    _state["sentiment"]       = None
    _state["recently_played"] = []
    _state["last_changed_at"] = 0.0
    return jsonify({"cleared": True})
