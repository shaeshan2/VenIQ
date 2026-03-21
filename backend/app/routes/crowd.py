"""
Crowd Analysis Route

POST /api/crowd/analyze
  - Receives a base64 webcam frame
  - Runs Gemini scene description
  - Checks if crowd energy has shifted significantly
  - If shifted: fetches Spotify recommendations and returns a new track
  - If stable:  returns { "changed": false } so frontend keeps playing

GET /api/crowd/history
  - Returns the full log of every analysis result (for frontend display + testing)

DELETE /api/crowd/history
  - Clears the log
"""

from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from app.services.crowd import describe_crowd
from app.services.spotify import get_recommendations
from app.routes.playback import set_current_track

crowd_bp = Blueprint("crowd", __name__)

# Persists between requests — tracks previous scene state
_state: dict = {"energy": None, "sentiment": None}

# Full log of every analysis — sent to frontend for display
_history: list[dict] = []


@crowd_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Body (JSON):
        image_base64 (str): base64-encoded JPEG frame from the webcam

    Response (crowd stable):
        { "changed": false, "energy": 5, "description": "...", "sentiment": "calm", "timestamp": "..." }

    Response (crowd shifted):
        { "changed": true, "energy": 8, "description": "...", "sentiment": "party",
          "track": { "name": "...", "artist": "...", "uri": "...", "preview_url": "...", "spotify_url": "..." },
          "timestamp": "..." }
    """
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

    prev_energy   = _state["energy"]
    prev_sentiment = _state["sentiment"]

    energy_shifted   = prev_energy is None or abs(new_energy - prev_energy) >= threshold
    sentiment_shifted = prev_sentiment != new_sentiment

    if not energy_shifted and not sentiment_shifted:
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

    _state["energy"]    = new_energy
    _state["sentiment"] = new_sentiment

    tracks = get_recommendations(new_sentiment, limit=5)
    track = tracks[0] if tracks else None
    if track:
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
    if not tracks:
        entry["error"] = "Spotify returned no tracks"

    _history.append(entry)
    return jsonify(entry)


@crowd_bp.route("/history", methods=["GET"])
def history():
    """
    Returns every analysis result since the server started (or last clear).

    Response:
        {
          "count": 12,
          "history": [
            { "timestamp": "...", "changed": false, "energy": 5, "sentiment": "calm", "description": "...", "track": null },
            { "timestamp": "...", "changed": true,  "energy": 8, "sentiment": "party", "description": "...", "track": {...} },
            ...
          ]
        }
    """
    return jsonify({"count": len(_history), "history": _history})


@crowd_bp.route("/history", methods=["DELETE"])
def clear_history():
    """Wipe the log (useful between demo runs)."""
    _history.clear()
    return jsonify({"cleared": True})
