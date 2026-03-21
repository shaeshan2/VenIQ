"""
Spotify Recommendations Service

Uses Client Credentials flow (app-level auth, no per-user OAuth).
Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in environment.

Token is cached in module-level state and refreshed when expired.
"""

import os
import time
import random
import requests
from config import Config

_ACCOUNTS_URL = "https://accounts.spotify.com/api/token"
_RECOMMENDATIONS_URL = "https://api.spotify.com/v1/recommendations"

# Sentiment → Spotify audio feature targets
SENTIMENT_MAP: dict[str, dict] = {
    "calm":  {"seed_genres": ["classical", "sleep", "piano"],    "target_energy": 0.25, "target_valence": 0.45, "target_tempo": 72},
    "party": {"seed_genres": ["pop", "dance", "hip-hop"],        "target_energy": 0.85, "target_valence": 0.80, "target_tempo": 128},
}

_token_cache = {"token": None, "expires_at": 0}


def get_recommendations(sentiment: str, limit: int = 5) -> list[dict]:
    """
    Fetch track recommendations for a given sentiment.

    Args:
        sentiment: one of the keys in SENTIMENT_MAP
        limit:     number of tracks to return

    Returns:
        List of track dicts: [{ name, artist, uri, preview_url }, ...]
        Returns [] if Spotify credentials are missing or API call fails.
    """
    params = SENTIMENT_MAP.get(sentiment, SENTIMENT_MAP["chill"])

    try:
        token = _get_access_token()
        headers = {"Authorization": f"Bearer {token}"}

        # Spotify allows max 5 seed_genres
        seed_genres = ",".join(params["seed_genres"][:5])

        resp = requests.get(
            _RECOMMENDATIONS_URL,
            headers=headers,
            params={
                "seed_genres": seed_genres,
                "target_energy": params["target_energy"],
                "target_valence": params["target_valence"],
                "target_tempo": params["target_tempo"],
                "limit": limit,
            },
            timeout=10,
        )
        resp.raise_for_status()

        tracks = resp.json().get("tracks", [])
        return [_format_track(t) for t in tracks]

    except Exception:
        return []


def _get_access_token() -> str:
    """Return a cached or freshly fetched Client Credentials token."""
    if _token_cache["token"] and time.time() < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        raise RuntimeError("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set")

    resp = requests.post(
        _ACCOUNTS_URL,
        data={"grant_type": "client_credentials"},
        auth=(client_id, client_secret),
        timeout=10,
    )
    resp.raise_for_status()

    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
    return _token_cache["token"]


def _format_track(track: dict) -> dict:
    artists = ", ".join(a["name"] for a in track.get("artists", []))
    return {
        "name": track.get("name", "Unknown"),
        "artist": artists,
        "uri": track.get("uri", ""),
        "preview_url": track.get("preview_url"),
        "spotify_url": track.get("external_urls", {}).get("spotify", ""),
    }
