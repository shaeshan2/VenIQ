"""
Playback State Route

GET  /api/playback/current   → what's currently queued/playing
POST /api/playback/override  → DJ manually picks a different song
"""

from flask import Blueprint, request, jsonify
from app.services.songs_db import get_song
from app.services.deezer import search_deezer

playback_bp = Blueprint("playback", __name__)

_current: dict = {"track": None, "source": None}  # source: "auto" | "override"


def set_current_track(track: dict, source: str = "auto") -> None:
    """Called by the crowd route when a new track is auto-selected."""
    _current["track"] = track
    _current["source"] = source


@playback_bp.route("/current", methods=["GET"])
def current():
    return jsonify(_current)


@playback_bp.route("/override", methods=["POST"])
def override():
    """
    Body (JSON), one of:
        { "track": { "name": "...", "artist": "...", ... } }
        { "sentiment": "party" }  → pick a fresh song for that sentiment
    """
    data = request.get_json(silent=True) or {}

    if "track" in data:
        track = data["track"]

    elif "sentiment" in data:
        sentiment = data["sentiment"]
        # Map sentiment to an energy midpoint for selection
        energy = 8 if sentiment == "party" else 3
        song = get_song(sentiment, energy)
        if not song:
            return jsonify({"error": "No tracks found for that sentiment"}), 404

        dz = search_deezer(song["name"], song["artist"])
        track = {
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

    else:
        return jsonify({"error": "Provide 'track' or 'sentiment'"}), 400

    set_current_track(track, source="override")
    return jsonify({"track": track, "source": "override"})
