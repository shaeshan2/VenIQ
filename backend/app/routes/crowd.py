"""
Crowd Analysis Route

POST /api/crowd/analyze
  - Receives a base64 webcam frame
  - Runs Gemini scene description
  - Checks if crowd energy has shifted significantly
  - If shifted: fetches Spotify recommendations and returns a new track
  - If stable:  returns { "changed": false } so frontend keeps playing
"""

from flask import Blueprint, request, jsonify, current_app
from app.services.crowd import describe_crowd
from app.services.spotify import get_recommendations
from app.routes.playback import set_current_track

crowd_bp = Blueprint("crowd", __name__)

# Persists between requests — tracks previous scene state
_state: dict = {"energy": None, "sentiment": None}


@crowd_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Body (JSON):
        image_base64 (str): base64-encoded JPEG frame from the webcam

    Response (crowd stable):
        { "changed": false, "energy": 5, "description": "..." }

    Response (crowd shifted):
        { "changed": true, "energy": 8, "description": "...",
          "track": { "name": "...", "artist": "...", "uri": "...", "preview_url": "...", "spotify_url": "..." } }
    """
    data = request.get_json(silent=True) or {}
    image_b64 = data.get("image_base64")

    if not image_b64 or not isinstance(image_b64, str):
        return jsonify({"error": "image_base64 is required"}), 400

    scene = describe_crowd(image_b64)
    new_energy = scene["energy"]
    new_sentiment = scene["sentiment"]
    description = scene["description"]
    analysis_source = scene.get("analysis_source", "gemini")
    fallback_reason = scene.get("fallback_reason")
    threshold = current_app.config.get("ENERGY_CHANGE_THRESHOLD", 2)

    prev_energy = _state["energy"]
    prev_sentiment = _state["sentiment"]

    # First call, or energy has shifted significantly, or sentiment category changed
    energy_shifted = prev_energy is None or abs(new_energy - prev_energy) >= threshold
    sentiment_shifted = prev_sentiment != new_sentiment

    if not energy_shifted and not sentiment_shifted:
        payload = {
            "changed": False,
            "energy": new_energy,
            "description": description,
            "sentiment": new_sentiment,
            "analysis_source": analysis_source,
        }
        if fallback_reason:
            payload["fallback_reason"] = fallback_reason
        return jsonify(payload)

    # Update state
    _state["energy"] = new_energy
    _state["sentiment"] = new_sentiment

    tracks = get_recommendations(new_sentiment, limit=5)
    if not tracks:
        payload = {
            "changed": True,
            "energy": new_energy,
            "description": description,
            "sentiment": new_sentiment,
            "track": None,
            "error": "Spotify returned no tracks",
            "analysis_source": analysis_source,
        }
        if fallback_reason:
            payload["fallback_reason"] = fallback_reason
        return jsonify(payload)

    track = tracks[0]
    set_current_track(track, source="auto")

    payload = {
        "changed": True,
        "energy": new_energy,
        "description": description,
        "sentiment": new_sentiment,
        "track": track,
        "analysis_source": analysis_source,
    }
    if fallback_reason:
        payload["fallback_reason"] = fallback_reason
    return jsonify(payload)
