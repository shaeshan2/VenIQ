"""
Deezer Service

search_deezer()       — search for a specific track (name + artist) → preview URL
fetch_chart_tracks()  — pull top tracks from Deezer's public chart API by genre
                        Results are cached in-memory for 1 hour per genre.

No API key required — Deezer's public REST endpoints are free for demo use.
"""

import time
import requests

_SEARCH_URL = "https://api.deezer.com/search"
_CHART_URL  = "https://api.deezer.com/chart/{genre_id}/tracks"

# Deezer genre IDs used for chart-based selection
GENRE_ALL         = 0
GENRE_POP         = 169
GENRE_HIP_HOP     = 152
GENRE_ELECTRONIC  = 116
GENRE_DANCE       = 165
GENRE_CLASSICAL   = 85
GENRE_ALTERNATIVE = 129
GENRE_RNB         = 173
GENRE_ROCK        = 106

# Map vibe_tags → ordered list of Deezer genre IDs (most relevant first)
_TAG_GENRES: dict[str, list[int]] = {
    # Party / high energy
    "energetic":      [GENRE_ELECTRONIC, GENRE_DANCE, GENRE_HIP_HOP],
    "dancing":        [GENRE_DANCE, GENRE_ELECTRONIC, GENRE_POP],
    "electronic":     [GENRE_ELECTRONIC, GENRE_DANCE],
    "rave":           [GENRE_ELECTRONIC, GENRE_DANCE],
    "hype":           [GENRE_HIP_HOP, GENRE_ELECTRONIC],
    "euphoric":       [GENRE_ELECTRONIC, GENRE_DANCE, GENRE_POP],
    "festival":       [GENRE_ELECTRONIC, GENRE_DANCE],
    "hip-hop":        [GENRE_HIP_HOP],
    "trap":           [GENRE_HIP_HOP],
    "loud":           [GENRE_HIP_HOP, GENRE_ELECTRONIC],
    "intense":        [GENRE_ELECTRONIC, GENRE_HIP_HOP],
    "driving":        [GENRE_ELECTRONIC, GENRE_ROCK],
    "synth":          [GENRE_ELECTRONIC, GENRE_POP],
    "anthemic":       [GENRE_ROCK, GENRE_POP],
    "rock":           [GENRE_ROCK],
    "indie rock":     [GENRE_ROCK, GENRE_ALTERNATIVE],
    "chaotic":        [GENRE_ELECTRONIC, GENRE_HIP_HOP],
    "wild":           [GENRE_HIP_HOP, GENRE_ELECTRONIC],
    # Happy / upbeat
    "joyful":         [GENRE_POP, GENRE_RNB],
    "upbeat":         [GENRE_POP, GENRE_DANCE],
    "feel-good":      [GENRE_POP, GENRE_RNB],
    "fun":            [GENRE_POP],
    "sunny":          [GENRE_POP],
    "bright":         [GENRE_POP, GENRE_ALTERNATIVE],
    "celebratory":    [GENRE_POP, GENRE_DANCE],
    "playful":        [GENRE_POP],
    "carefree":       [GENRE_POP],
    "optimistic":     [GENRE_POP, GENRE_ALTERNATIVE],
    "warm":           [GENRE_RNB, GENRE_POP],
    "positive":       [GENRE_POP],
    "happy":          [GENRE_POP],
    "empowering":     [GENRE_POP, GENRE_RNB],
    # Groovy / soulful
    "groovy":         [GENRE_RNB, GENRE_POP],
    "smooth":         [GENRE_RNB, GENRE_POP],
    "soul":           [GENRE_RNB],
    "funky":          [GENRE_RNB, GENRE_POP],
    "chill":          [GENRE_RNB, GENRE_ALTERNATIVE],
    "laid-back":      [GENRE_RNB],
    "cool":           [GENRE_RNB, GENRE_HIP_HOP],
    "mellow":         [GENRE_RNB, GENRE_ALTERNATIVE],
    # Nostalgic / classic
    "nostalgic":      [GENRE_ROCK, GENRE_POP],
    "classic":        [GENRE_ROCK, GENRE_POP],
    "danceable":      [GENRE_DANCE, GENRE_POP],
    "indie":          [GENRE_ALTERNATIVE],
    "festive":        [GENRE_POP, GENRE_DANCE],
    "social":         [GENRE_POP, GENRE_DANCE],
    # Calm / ambient
    "peaceful":       [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "calm":           [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "ambient":        [GENRE_CLASSICAL],
    "meditative":     [GENRE_CLASSICAL],
    "tranquil":       [GENRE_CLASSICAL],
    "classical":      [GENRE_CLASSICAL],
    "gentle":         [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "still":          [GENRE_CLASSICAL],
    "quiet":          [GENRE_CLASSICAL],
    "soothing":       [GENRE_CLASSICAL],
    "therapeutic":    [GENRE_CLASSICAL],
    "deeply calm":    [GENRE_CLASSICAL],
    "slow":           [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "melancholic":    [GENRE_ALTERNATIVE, GENRE_CLASSICAL],
    "introspective":  [GENRE_ALTERNATIVE],
    "atmospheric":    [GENRE_ALTERNATIVE, GENRE_ELECTRONIC],
    "cinematic":      [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "contemplative":  [GENRE_ALTERNATIVE, GENRE_CLASSICAL],
    "romantic":       [GENRE_CLASSICAL, GENRE_RNB],
    "tender":         [GENRE_CLASSICAL, GENRE_RNB],
    "hopeful":        [GENRE_ALTERNATIVE, GENRE_POP],
    "emotional":      [GENRE_ALTERNATIVE, GENRE_POP],
    "reflective":     [GENRE_ALTERNATIVE, GENRE_CLASSICAL],
    "folk":           [GENRE_ALTERNATIVE],
    "acoustic":       [GENRE_ALTERNATIVE],
    # Focused / study
    "focused":        [GENRE_ALTERNATIVE, GENRE_CLASSICAL],
    "lo-fi":          [GENRE_ALTERNATIVE],
    "study":          [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "minimal":        [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "steady":         [GENRE_ALTERNATIVE],
    "deep work":      [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "sparse":         [GENRE_CLASSICAL],
    "building":       [GENRE_CLASSICAL, GENRE_ELECTRONIC],
    "flowing":        [GENRE_CLASSICAL, GENRE_ALTERNATIVE],
    "nocturnal":      [GENRE_ELECTRONIC, GENRE_ALTERNATIVE],
    "slow-burn":      [GENRE_ALTERNATIVE, GENRE_ELECTRONIC],
    "piano":          [GENRE_CLASSICAL],
    "neoclassical":   [GENRE_CLASSICAL],
    "dramatic":       [GENRE_CLASSICAL, GENRE_ROCK],
    "epic":           [GENRE_ROCK, GENRE_CLASSICAL],
}


_PREF_GENRE_MAP: dict[str, int] = {
    "electronic": GENRE_ELECTRONIC,
    "hip-hop":    GENRE_HIP_HOP,
    "pop":        GENRE_POP,
    "r-n-b":      GENRE_RNB,
    "rock":       GENRE_ROCK,
    "classical":  GENRE_CLASSICAL,
}


def pick_genre_for_tags(vibe_tags: list[str], preferences: list[str] | None = None) -> int:
    """
    Vote on the best Deezer genre ID for the given vibe_tags.
    Each tag casts weighted votes for its genre list (first genre = 2 pts, rest = 1 pt).
    User preferences add a +3 bonus to their chosen genres.
    Returns the genre with the highest vote count.
    """
    from collections import Counter
    votes: Counter = Counter()
    for tag in vibe_tags:
        genres = _TAG_GENRES.get(tag.lower().strip(), [GENRE_POP])
        for i, g in enumerate(genres):
            votes[g] += 2 if i == 0 else 1
    if preferences:
        for pref in preferences:
            genre_id = _PREF_GENRE_MAP.get(pref.lower().strip())
            if genre_id is not None:
                votes[genre_id] += 3
    return votes.most_common(1)[0][0] if votes else GENRE_ALL


# ── Keyword search cache: keyword → (timestamp, list[track_dict]) ────────────
_keyword_cache: dict[str, tuple[float, list[dict]]] = {}

# Mood → genre-diverse keyword pools.
# Keys are intentionally from different genres so merged results cover wide ground.
_MOOD_KEYWORDS: dict[str, list[str]] = {
    "focused": [
        "lofi hip hop",           # lo-fi / beats
        "piano study classical",  # classical piano
        "post rock instrumental", # Mogwai / Explosions in the Sky territory
        "trip hop instrumental",  # Portishead / Massive Attack
        "ambient electronic",     # Brian Eno / Moby
        "indie folk acoustic",    # Jose Gonzalez / Nick Drake
        "jazz instrumental chill",# Miles Davis / Bill Evans
        "chillwave downtempo",    # Washed Out / Toro y Moi
        "neoclassical piano",     # Einaudi / Max Richter
        "deep focus beats",       # modern lo-fi producers
    ],
    "calm": [
        "ambient relaxing",
        "classical piano peaceful",
        "acoustic guitar relaxing",
        "jazz ballad soft",
        "sleep music gentle",
        "nature ambient sounds",
        "new age meditation",
        "singer songwriter soft",
        "chillout downtempo",
        "piano ballad emotional",
    ],
}


def search_deezer_by_keyword(keyword: str, limit: int = 100) -> list[dict]:
    """
    Search Deezer for tracks matching a freetext keyword.
    Returns up to `limit` tracks that have a preview URL.
    Results are cached in memory for 1 hour.
    """
    now = time.time()
    cached = _keyword_cache.get(keyword)
    if cached and (now - cached[0] < _CACHE_TTL):
        return cached[1]

    try:
        resp = requests.get(
            _SEARCH_URL,
            params={"q": keyword, "limit": limit},
            timeout=8,
        )
        resp.raise_for_status()
        tracks = [t for t in resp.json().get("data", []) if t.get("preview")]
        _keyword_cache[keyword] = (now, tracks)
        return tracks
    except Exception:
        return []


def search_by_mood(mood: str, recently_played: list[str] | None = None) -> dict | None:
    """
    Build a large, genre-diverse candidate pool by sampling 4 random keywords
    for the mood, merging and deduplicating all results, then picking a random
    track that hasn't been played recently.

    Using 4 keywords × ~100 results each gives ~200-350 unique tracks after
    dedup, drastically reducing repeats compared to a single-keyword approach.
    """
    import random as _random
    keywords = _MOOD_KEYWORDS.get(mood, [])
    if not keywords:
        return None

    played_set = set(recently_played or [])

    # Sample 4 distinct keywords (covers multiple genres)
    sample = _random.sample(keywords, min(4, len(keywords)))

    seen_ids: set = set()
    merged: list[dict] = []
    for kw in sample:
        for t in search_deezer_by_keyword(kw):
            if t["id"] not in seen_ids:
                seen_ids.add(t["id"])
                merged.append(t)

    # Filter recently played, then pick randomly from what's left
    available = [
        t for t in merged
        if str(t["id"]) not in played_set
        and f"{t['title']}|{t['artist']['name']}" not in played_set
    ]
    if not available:
        available = merged  # played everything? reset and allow repeats

    if not available:
        return None

    _random.shuffle(available)
    chosen = available[0]
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


# ── Chart cache: genre_id → (timestamp, list[track_dict]) ────────────────────
_chart_cache: dict[int, tuple[float, list[dict]]] = {}
_CACHE_TTL = 3600  # 1 hour


def fetch_chart_tracks(genre_id: int = GENRE_ALL, limit: int = 100) -> list[dict]:
    """
    Fetch top tracks from Deezer's chart for a given genre.
    Returns a list of Deezer track dicts (each has 'id', 'title', 'artist',
    'album', 'preview', 'link', 'rank').
    Results are cached in memory for 1 hour.
    """
    now = time.time()
    cached = _chart_cache.get(genre_id)
    if cached:
        ts, tracks = cached
        if now - ts < _CACHE_TTL:
            return tracks

    url = _CHART_URL.format(genre_id=genre_id)
    try:
        resp = requests.get(url, params={"limit": limit}, timeout=10)
        resp.raise_for_status()
        tracks = resp.json().get("data", [])
        # Only keep tracks that have a preview URL
        tracks = [t for t in tracks if t.get("preview")]
        _chart_cache[genre_id] = (now, tracks)
        return tracks
    except Exception:
        return []


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
