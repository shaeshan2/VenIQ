"""
Playback State Route

GET  /api/playback/current   → what's currently queued/playing
POST /api/playback/override  → DJ manually picks a different song
"""

import random
from flask import Blueprint, request, jsonify
from app.services.deezer import fetch_chart_tracks, pick_genre_for_tags, search_deezer, search_by_mood
from app.services.songs_db import get_song
from app import limiter

playback_bp = Blueprint("playback", __name__)

_current: dict = {"track": None, "source": None}  # source: "auto" | "override"

# Persistent history for override picks — prevents cycling between the same few songs.
# Stores "name|artist" strings (compatible with find_best_match key format).
_override_played: list[str] = []
_OVERRIDE_HISTORY_MAX = 30

# Sentiment → vibe_tags for override requests
_SENTIMENT_TAGS = {
    "party":      ["energetic", "dancing", "electronic", "euphoric", "rave"],
    "calm":       ["peaceful", "ambient", "gentle", "tranquil", "classical"],
    "focused":    ["focused", "lo-fi", "study", "steady", "minimal"],
    "happy":      ["joyful", "upbeat", "feel-good", "bright", "fun"],
    "excited":    ["upbeat", "energetic", "anthemic", "feel-good", "bright"],
    "melancholic":["melancholic", "introspective", "atmospheric", "emotional", "reflective"],
    "anxious":    ["peaceful", "tranquil", "calm", "gentle", "soothing"],
    "bored":      ["upbeat", "joyful", "playful", "bright", "fun"],
}

# New emotions that route through calm/focused keyword search vs charts
_STUDY_SENTIMENTS = {"focused", "calm", "tired", "stressed", "melancholic", "anxious", "bored"}
_CHART_SENTIMENTS = {"party", "happy", "excited"}


def set_current_track(track: dict, source: str = "auto") -> None:
    """Called by the crowd route when a new track is auto-selected."""
    _current["track"] = track
    _current["source"] = source


@playback_bp.route("/current", methods=["GET"])
def current():
    return jsonify(_current)


@playback_bp.route("/override", methods=["POST"])
@limiter.limit("30 per minute")
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
        sentiment   = data["sentiment"]
        exclude_id  = str(data["exclude_id"]) if data.get("exclude_id") else None
        preferences = data.get("preferences") or []
        vibe_tags   = _SENTIMENT_TAGS.get(sentiment, ["upbeat", "feel-good"])

        # Study-type sentiments: keyword search (calm/focused pools cover all these)
        if sentiment in _STUDY_SENTIMENTS:
            # Route new emotions to the most musically appropriate keyword pool
            search_mood = {
                "melancholic": "focused",   # introspective / atmospheric
                "anxious":     "calm",      # soothing / grounding
                "bored":       "focused",   # gentle upbeat crossover
                "tired":       "calm",
                "stressed":    "calm",
            }.get(sentiment, sentiment)
            track = search_by_mood(search_mood, _override_played, preferences)
            if not track:
                return jsonify({"error": "No tracks found — Deezer may be unreachable"}), 503
        else:
            # Party / happy: mix current charts (70%) with all-time classics from static DB (30%)
            # Build a played set that works for both chart IDs and static DB name|artist keys
            played_ids   = {k for k in _override_played if "|" not in k}
            played_names = {k for k in _override_played if "|"     in k}

            use_static = random.random() < 0.30
            track = None

            if not use_static:
                genre_id     = pick_genre_for_tags(vibe_tags, preferences)
                chart_tracks = fetch_chart_tracks(genre_id, limit=100) or fetch_chart_tracks(0, limit=100)
                if chart_tracks:
                    pool = [t for t in chart_tracks[:30] if str(t["id"]) not in played_ids]
                    pool = pool or chart_tracks[:30]  # ignore history if fully exhausted
                    chosen = random.choice(pool)
                    track = {
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

            if track is None:
                # Static DB classic — pass name|artist history so find_best_match can exclude them
                song = find_best_match(vibe_tags, list(played_names))
                if not song:
                    energy = {"party": 8, "happy": 7}.get(sentiment, 5)
                    song = get_song(sentiment, energy, list(played_names))
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

    # Record in persistent history using both key formats
    name_key = f"{track['name']}|{track['artist']}"
    id_key   = str(track.get("deezer_id") or "")
    for key in filter(None, [name_key, id_key]):
        if key not in _override_played:
            _override_played.append(key)
    while len(_override_played) > _OVERRIDE_HISTORY_MAX:
        _override_played.pop(0)

    set_current_track(track, source="override")
    return jsonify({"track": track, "source": "override"})
