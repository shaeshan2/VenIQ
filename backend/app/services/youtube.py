"""
YouTube Search Service

Searches YouTube Data API v3 for a song by name + artist.
Returns the first video ID so the frontend can embed the player.

Requires YOUTUBE_API_KEY in environment.
Free quota: 10,000 units/day — each search costs 100 units (~100 searches/day).
"""

import os
import requests

_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


def search_youtube(name: str, artist: str) -> dict | None:
    """
    Search YouTube for '<name> <artist> official audio'.

    Returns:
        { "video_id": "...", "title": "...", "channel": "...", "youtube_url": "..." }
        or None if no key / no result / error.
    """
    api_key = os.getenv("YOUTUBE_API_KEY", "")
    if not api_key:
        return None

    query = f"{name} {artist} official audio"
    try:
        resp = requests.get(
            _SEARCH_URL,
            params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "videoCategoryId": "10",  # Music category
                "maxResults": 1,
                "key": api_key,
            },
            timeout=10,
        )
        resp.raise_for_status()

        items = resp.json().get("items", [])
        if not items:
            return None

        item = items[0]
        video_id = item["id"]["videoId"]
        return {
            "video_id": video_id,
            "title": item["snippet"]["title"],
            "channel": item["snippet"]["channelTitle"],
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
        }
    except Exception:
        return None
