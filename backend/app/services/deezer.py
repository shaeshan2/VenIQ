"""
Deezer Search Service

Uses Deezer's public REST API (no auth required) to search for a track
and return its 30-second preview MP3 URL.

No API key needed — free-tier public endpoint, ~unlimited for demo use.
"""

import requests

_SEARCH_URL = "https://api.deezer.com/search"


def search_deezer(name: str, artist: str) -> dict | None:
    """
    Search Deezer for a track by name + artist.

    Returns:
        {
            "deezer_id":   int,
            "preview_url": "https://cdn...mp3",  # 30-second preview
            "deezer_url":  "https://www.deezer.com/track/...",
            "cover_url":   "https://...",         # album art (264x264)
        }
        or None if no result / error.
    """
    queries = [
        f'track:"{name}" artist:"{artist}"',
        f"{name} {artist}",
    ]
    for query in queries:
        try:
            resp = requests.get(
                _SEARCH_URL,
                params={"q": query, "limit": 5},
                timeout=8,
            )
            resp.raise_for_status()
            items = resp.json().get("data", [])
            for item in items:
                if item.get("preview"):
                    return {
                        "deezer_id":   item["id"],
                        "preview_url": item["preview"],
                        "deezer_url":  item["link"],
                        "cover_url":   item["album"].get("cover_medium", ""),
                    }
        except Exception:
            continue
    return None
