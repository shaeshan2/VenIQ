"""
Crowd Analysis Route

POST /api/crowd/analyze
  - Receives a base64 webcam frame
  - Runs Groq llama-4 scene description
  - Checks if crowd energy or sentiment has shifted significantly
  - If shifted: picks a song from Deezer charts (genre matched to vibe_tags)
  - If stable:  returns { "changed": false }

GET /api/crowd/history
  - Returns the full log of every analysis result

DELETE /api/crowd/history
  - Clears the log
"""

import random
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from app.services.crowd import describe_crowd, describe_individual, analyze_auto
from app.services.songs_db import get_song, find_best_match
from app.services.deezer import search_deezer, fetch_chart_tracks, pick_genre_for_tags
from app.routes.playback import set_current_track
from app import limiter

crowd_bp = Blueprint("crowd", __name__)

# Persists between requests — tracks previous scene state + played songs
_state: dict = {
    "energy":           None,
    "sentiment":        None,
    "recently_played":  [],       # list of deezer_id strings
    "last_changed_at":  0.0,      # epoch seconds of last song change
}

SONG_CHANGE_COOLDOWN = 30  # seconds — ignore shifts for this long after a change

# Full log of every analysis — sent to frontend for display
_history: list[dict] = []


_STUDY_TAGS = {"focused", "lo-fi", "study", "steady", "minimal", "deep work", "sparse",
               "calm", "peaceful", "ambient", "gentle", "tranquil", "classical", "soothing",
               "piano", "neoclassical", "meditative", "therapeutic", "slow", "quiet",
               "flowing", "atmospheric", "cinematic", "introspective", "reflective"}


def _is_study_vibe(vibe_tags: list[str]) -> bool:
    return any(t.lower() in _STUDY_TAGS for t in vibe_tags)


def _track_from_static_db(vibe_tags: list[str], recently_played: list[str]) -> dict | None:
    """Pick from the curated static DB and enrich with Deezer preview URL."""
    song = find_best_match(vibe_tags, recently_played) if vibe_tags else get_song("calm", 3, recently_played)
    if not song:
        return None
    dz = search_deezer(song["name"], song["artist"])
    return {
        "name":        song["name"],
        "artist":      song["artist"],
        "bpm":         song["bpm"],
        "key":         song["key"],
        "genre":       song["genre"],
        "duration_s":  song["duration_s"],
        "preview_url": dz["preview_url"] if dz else None,
        "deezer_url":  dz["deezer_url"]  if dz else None,
        "deezer_id":   dz["deezer_id"]   if dz else None,
        "cover_url":   dz["cover_url"]   if dz else None,
    }


def _pick_track_from_charts(vibe_tags: list[str], recently_played: list[str]) -> dict | None:
    """
    Select a track based on vibe:
    - Study/calm vibes → curated static DB (better quality for focus/ambient)
    - Energetic/social vibes → Deezer charts (70%) mixed with static DB classics (30%)
    """
    played_set = set(recently_played)

    if _is_study_vibe(vibe_tags):
        return _track_from_static_db(vibe_tags, recently_played)

    # Energetic/party/happy: mix charts with all-time classics
    use_static = random.random() < 0.30
    if not use_static:
        genre_id    = pick_genre_for_tags(vibe_tags) if vibe_tags else 0
        chart_tracks = fetch_chart_tracks(genre_id, limit=100)
        available   = [t for t in chart_tracks if str(t["id"]) not in played_set]

        if not available:
            chart_tracks = fetch_chart_tracks(0, limit=100)
            available = [t for t in chart_tracks if str(t["id"]) not in played_set]

        if available:
            pool   = available[:min(30, len(available))]
            chosen = random.choice(pool)
            return {
                "name":        chosen["title"],
                "artist":      chosen["artist"]["name"],
                "preview_url": chosen["preview"],
                "cover_url":   chosen["album"].get("cover_medium", ""),
                "deezer_url":  chosen.get("link", ""),
                "deezer_id":   chosen["id"],
                "bpm":         None,
                "key":         None,
                "genre":       None,
                "duration_s":  chosen.get("duration"),
            }

    # Static DB classic (also the fallback if charts fail)
    return _track_from_static_db(vibe_tags, recently_played)


@crowd_bp.route("/analyze", methods=["POST"])
@limiter.limit("20 per minute; 150 per hour")
def analyze():
    data      = request.get_json(silent=True) or {}
    image_b64 = data.get("image_base64")
    mode      = data.get("mode", "club")       # "club" | "study" | "auto"
    mediapipe = data.get("mediapipe") or {}    # optional MediaPipe context from browser

    if not image_b64:
        return jsonify({"error": "image_base64 is required"}), 400

    if mode == "auto":
        scene = analyze_auto(image_b64, mediapipe)
    elif mode == "study":
        scene = describe_individual(image_b64, mediapipe)
    else:
        scene = describe_crowd(image_b64, mediapipe)

    new_energy    = scene["energy"]
    new_sentiment = scene["sentiment"]
    confidence    = scene["confidence"]
    description   = scene["description"]
    coach_message = scene.get("coach_message")
    detected_mode = scene.get("detected_mode")   # only set in auto mode
    vibe_tags     = scene.get("vibe_tags") or []
    threshold     = current_app.config.get("ENERGY_CHANGE_THRESHOLD", 2)
    timestamp     = datetime.utcnow().isoformat() + "Z"

    prev_energy       = _state["energy"]
    prev_sentiment    = _state["sentiment"]
    secs_since_change = time.time() - _state["last_changed_at"]

    energy_shifted    = prev_energy is None or abs(new_energy - prev_energy) >= threshold
    sentiment_shifted = prev_sentiment != new_sentiment

    # Require a shift AND the cooldown to have elapsed before changing again
    if not (energy_shifted or sentiment_shifted) or (
        prev_energy is not None and secs_since_change < SONG_CHANGE_COOLDOWN
    ):
        entry = {
            "timestamp":     timestamp,
            "changed":       False,
            "energy":        new_energy,
            "sentiment":     new_sentiment,
            "confidence":    confidence,
            "description":   description,
            "coach_message": coach_message,
            "detected_mode": detected_mode,
            "track":         None,
        }
        _history.append(entry)
        return jsonify(entry)

    _state["energy"]          = new_energy
    _state["sentiment"]       = new_sentiment
    _state["last_changed_at"] = time.time()

    # Study mode: enrich vibe_tags based on emotion → music mood mapping
    effective_mode = detected_mode if mode == "auto" and detected_mode else mode
    if effective_mode == "study" and not vibe_tags:
        emotion_tag_map = {
            "focused":  ["focused", "lo-fi", "study", "steady"],
            "happy":    ["joyful", "upbeat", "feel-good", "bright"],
            "tired":    ["calm", "gentle", "ambient", "soothing"],
            "stressed": ["peaceful", "tranquil", "calm", "ambient"],
        }
        vibe_tags = emotion_tag_map.get(new_sentiment, ["calm"])

    track = _pick_track_from_charts(vibe_tags, _state["recently_played"])

    if track:
        played_key = str(track.get("deezer_id") or f"{track['name']}|{track['artist']}")
        if played_key not in _state["recently_played"]:
            _state["recently_played"].append(played_key)
            if len(_state["recently_played"]) > 50:
                _state["recently_played"].pop(0)

        set_current_track(track, source="auto")

    entry = {
        "timestamp":     timestamp,
        "changed":       True,
        "energy":        new_energy,
        "sentiment":     new_sentiment,
        "confidence":    confidence,
        "description":   description,
        "coach_message": coach_message,
        "detected_mode": detected_mode,
        "track":         track,
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
