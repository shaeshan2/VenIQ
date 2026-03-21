"""
DJ Song Reference Database

30 songs chosen for maximum genre, key, and BPM diversity.
These are used as musical references — Gemini reads the BPM, key, and genre
to generate an appropriate live Tone.js composition.

Fields: name, artist, bpm, key, duration_s, genre, energy (1–10), sentiment, year.
"""

import random

SONGS: list[dict] = [
    # ── PARTY ──────────────────────────────────────────────────────────────────
    # EDM / House
    {"name": "Animals",                "artist": "Martin Garrix",              "bpm": 128, "key": "F major",  "duration_s": 186, "genre": "edm",           "energy": 9,  "sentiment": "party", "year": 2013},
    {"name": "Levels",                 "artist": "Avicii",                     "bpm": 128, "key": "F major",  "duration_s": 197, "genre": "edm",           "energy": 9,  "sentiment": "party", "year": 2011},
    {"name": "Clarity",                "artist": "Zedd ft. Foxes",             "bpm": 128, "key": "E minor",  "duration_s": 271, "genre": "edm",           "energy": 10, "sentiment": "party", "year": 2012},
    {"name": "Lean On",                "artist": "Major Lazer ft. DJ Snake",   "bpm": 98,  "key": "G minor",  "duration_s": 175, "genre": "edm",           "energy": 8,  "sentiment": "party", "year": 2015},
    # Trance / Rave
    {"name": "Sandstorm",              "artist": "Darude",                     "bpm": 136, "key": "Bb minor", "duration_s": 226, "genre": "trance",        "energy": 10, "sentiment": "party", "year": 1999},
    {"name": "Kernkraft 400",          "artist": "Zombie Nation",              "bpm": 136, "key": "A minor",  "duration_s": 309, "genre": "techno",        "energy": 10, "sentiment": "party", "year": 1999},
    # Trap / Hip-hop
    {"name": "HUMBLE.",                "artist": "Kendrick Lamar",             "bpm": 150, "key": "E major",  "duration_s": 177, "genre": "hip-hop",       "energy": 9,  "sentiment": "party", "year": 2017},
    {"name": "God's Plan",             "artist": "Drake",                      "bpm": 77,  "key": "Ab major", "duration_s": 198, "genre": "hip-hop",       "energy": 8,  "sentiment": "party", "year": 2018},
    {"name": "Sicko Mode",             "artist": "Travis Scott",               "bpm": 155, "key": "A major",  "duration_s": 312, "genre": "trap",          "energy": 10, "sentiment": "party", "year": 2018},
    {"name": "Turn Down for What",     "artist": "DJ Snake ft. Lil Jon",       "bpm": 100, "key": "F# major", "duration_s": 196, "genre": "trap edm",      "energy": 10, "sentiment": "party", "year": 2013},
    # Funk / Disco
    {"name": "Uptown Funk",            "artist": "Mark Ronson ft. Bruno Mars", "bpm": 115, "key": "D minor",  "duration_s": 270, "genre": "funk",          "energy": 7,  "sentiment": "party", "year": 2014},
    {"name": "September",              "artist": "Earth Wind & Fire",          "bpm": 126, "key": "D major",  "duration_s": 215, "genre": "disco",         "energy": 7,  "sentiment": "party", "year": 1978},
    {"name": "Dancing Queen",          "artist": "ABBA",                       "bpm": 101, "key": "A major",  "duration_s": 231, "genre": "disco",         "energy": 7,  "sentiment": "party", "year": 1976},
    # Synth-pop / Indie
    {"name": "Blinding Lights",        "artist": "The Weeknd",                 "bpm": 171, "key": "F minor",  "duration_s": 200, "genre": "synth-pop",     "energy": 9,  "sentiment": "party", "year": 2019},
    {"name": "As It Was",              "artist": "Harry Styles",               "bpm": 174, "key": "A minor",  "duration_s": 167, "genre": "indie pop",     "energy": 8,  "sentiment": "party", "year": 2022},
    # Rock anthems
    {"name": "Mr. Brightside",         "artist": "The Killers",                "bpm": 148, "key": "C major",  "duration_s": 222, "genre": "indie rock",    "energy": 10, "sentiment": "party", "year": 2003},
    {"name": "Don't Stop Believin'",   "artist": "Journey",                    "bpm": 119, "key": "E major",  "duration_s": 251, "genre": "classic rock",  "energy": 10, "sentiment": "party", "year": 1981},
    {"name": "Bohemian Rhapsody",      "artist": "Queen",                      "bpm": 72,  "key": "Bb major", "duration_s": 354, "genre": "rock",          "energy": 10, "sentiment": "party", "year": 1975},
    # Pop crowd-pleasers
    {"name": "Can't Stop the Feeling", "artist": "Justin Timberlake",          "bpm": 113, "key": "C major",  "duration_s": 237, "genre": "pop",           "energy": 7,  "sentiment": "party", "year": 2016},
    {"name": "Shape of You",           "artist": "Ed Sheeran",                 "bpm": 96,  "key": "C# minor", "duration_s": 234, "genre": "pop",           "energy": 6,  "sentiment": "party", "year": 2017},

    # ── CALM ───────────────────────────────────────────────────────────────────
    # Classical
    {"name": "Clair de Lune",          "artist": "Claude Debussy",             "bpm": 72,  "key": "Db major", "duration_s": 330, "genre": "classical",     "energy": 1,  "sentiment": "calm",  "year": 1905},
    {"name": "Gymnopédie No. 1",       "artist": "Erik Satie",                 "bpm": 60,  "key": "D major",  "duration_s": 180, "genre": "classical",     "energy": 1,  "sentiment": "calm",  "year": 1888},
    {"name": "River Flows in You",     "artist": "Yiruma",                     "bpm": 84,  "key": "A major",  "duration_s": 209, "genre": "new age",       "energy": 2,  "sentiment": "calm",  "year": 2001},
    # Neoclassical / Ambient
    {"name": "Weightless",             "artist": "Marconi Union",              "bpm": 60,  "key": "none",     "duration_s": 480, "genre": "ambient",       "energy": 1,  "sentiment": "calm",  "year": 2011},
    {"name": "Nuvole Bianche",         "artist": "Ludovico Einaudi",           "bpm": 55,  "key": "E major",  "duration_s": 349, "genre": "neoclassical",  "energy": 2,  "sentiment": "calm",  "year": 2004},
    {"name": "Experience",             "artist": "Ludovico Einaudi",           "bpm": 90,  "key": "C minor",  "duration_s": 285, "genre": "neoclassical",  "energy": 3,  "sentiment": "calm",  "year": 2013},
    # Folk / Lo-fi
    {"name": "Holocene",               "artist": "Bon Iver",                   "bpm": 78,  "key": "E major",  "duration_s": 331, "genre": "indie folk",    "energy": 3,  "sentiment": "calm",  "year": 2011},
    {"name": "The Scientist",          "artist": "Coldplay",                   "bpm": 75,  "key": "F major",  "duration_s": 309, "genre": "alternative",   "energy": 3,  "sentiment": "calm",  "year": 2002},
    {"name": "Yellow",                 "artist": "Coldplay",                   "bpm": 88,  "key": "B major",  "duration_s": 269, "genre": "alternative",   "energy": 4,  "sentiment": "calm",  "year": 2000},
    # Mid calm
    {"name": "Africa",                 "artist": "Toto",                       "bpm": 92,  "key": "Ab major", "duration_s": 295, "genre": "pop rock",      "energy": 5,  "sentiment": "calm",  "year": 1982},
]


def get_song(sentiment: str, energy: int, recently_played: list[str] | None = None) -> dict | None:
    """
    Pick the best-matching song from the database.
    Avoids recently played songs, prefers closest energy match.
    """
    played = set(recently_played or [])
    pool   = [s for s in SONGS if s["sentiment"] == sentiment]

    def key(s: dict) -> str:
        return f"{s['name']}|{s['artist']}"

    close = [s for s in pool if abs(s["energy"] - energy) <= 2 and key(s) not in played]
    if not close:
        close = [s for s in pool if key(s) not in played]
    if not close:
        close = pool
    if not close:
        return None

    close.sort(key=lambda s: abs(s["energy"] - energy))
    return random.choice(close[:5]).copy()
