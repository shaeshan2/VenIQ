"""
DJ Song Database

Top 100 most popular songs organized for crowd-aware DJ use.
Fields: name, artist, bpm, key, duration_s, genre, energy (1–10), sentiment, year.

  energy 1–3  → calm/ambient/classical   (sentiment: "calm")
  energy 4–5  → focus/relaxed acoustic   (sentiment: "calm")
  energy 6–7  → warm-up / crowd-building (sentiment: "party")
  energy 8–10 → main floor / rave peak   (sentiment: "party")
"""

import random

SONGS: list[dict] = [
    # ── CALM: Classical / Ambient (energy 1–2) ────────────────────────────────
    {"name": "Clair de Lune",          "artist": "Claude Debussy",                "bpm": 72,  "key": "Db major", "duration_s": 330, "genre": "classical",     "energy": 1,  "sentiment": "calm",  "year": 1905},
    {"name": "Gymnopédie No. 1",       "artist": "Erik Satie",                    "bpm": 60,  "key": "D major",  "duration_s": 180, "genre": "classical",     "energy": 1,  "sentiment": "calm",  "year": 1888},
    {"name": "Weightless",             "artist": "Marconi Union",                 "bpm": 60,  "key": "none",     "duration_s": 480, "genre": "ambient",       "energy": 1,  "sentiment": "calm",  "year": 2011},
    {"name": "Nuvole Bianche",         "artist": "Ludovico Einaudi",              "bpm": 55,  "key": "E major",  "duration_s": 349, "genre": "neoclassical",  "energy": 2,  "sentiment": "calm",  "year": 2004},
    {"name": "Una Mattina",            "artist": "Ludovico Einaudi",              "bpm": 76,  "key": "E major",  "duration_s": 156, "genre": "neoclassical",  "energy": 2,  "sentiment": "calm",  "year": 2004},
    {"name": "Nocturne Op. 9 No. 2",   "artist": "Frédéric Chopin",               "bpm": 66,  "key": "Eb major", "duration_s": 241, "genre": "classical",     "energy": 1,  "sentiment": "calm",  "year": 1832},
    {"name": "River Flows in You",     "artist": "Yiruma",                        "bpm": 84,  "key": "A major",  "duration_s": 209, "genre": "new age",       "energy": 2,  "sentiment": "calm",  "year": 2001},
    {"name": "Air on the G String",    "artist": "Johann Sebastian Bach",         "bpm": 60,  "key": "D major",  "duration_s": 248, "genre": "classical",     "energy": 1,  "sentiment": "calm",  "year": 1731},
    {"name": "Moonlight Sonata",       "artist": "Ludwig van Beethoven",          "bpm": 54,  "key": "C# minor", "duration_s": 354, "genre": "classical",     "energy": 2,  "sentiment": "calm",  "year": 1802},
    {"name": "Experience",             "artist": "Ludovico Einaudi",              "bpm": 90,  "key": "C minor",  "duration_s": 285, "genre": "neoclassical",  "energy": 3,  "sentiment": "calm",  "year": 2013},

    # ── CALM: Lo-fi / Acoustic / Folk (energy 3–4) ───────────────────────────
    {"name": "Snowfall",               "artist": "Øneheart reidenshi",            "bpm": 78,  "key": "F major",  "duration_s": 196, "genre": "lo-fi",         "energy": 3,  "sentiment": "calm",  "year": 2021},
    {"name": "Let Her Go",             "artist": "Passenger",                     "bpm": 76,  "key": "G major",  "duration_s": 252, "genre": "folk",          "energy": 3,  "sentiment": "calm",  "year": 2012},
    {"name": "Holocene",               "artist": "Bon Iver",                      "bpm": 78,  "key": "E major",  "duration_s": 331, "genre": "indie folk",    "energy": 3,  "sentiment": "calm",  "year": 2011},
    {"name": "The Scientist",          "artist": "Coldplay",                      "bpm": 75,  "key": "F major",  "duration_s": 309, "genre": "alternative",   "energy": 3,  "sentiment": "calm",  "year": 2002},
    {"name": "Canon in D",             "artist": "Johann Pachelbel",              "bpm": 72,  "key": "D major",  "duration_s": 213, "genre": "classical",     "energy": 3,  "sentiment": "calm",  "year": 1680},
    {"name": "Skinny Love",            "artist": "Bon Iver",                      "bpm": 104, "key": "Ab major", "duration_s": 209, "genre": "indie folk",    "energy": 4,  "sentiment": "calm",  "year": 2007},
    {"name": "Yellow",                 "artist": "Coldplay",                      "bpm": 88,  "key": "B major",  "duration_s": 269, "genre": "alternative",   "energy": 4,  "sentiment": "calm",  "year": 2000},
    {"name": "Budapest",               "artist": "George Ezra",                   "bpm": 95,  "key": "C major",  "duration_s": 196, "genre": "indie pop",     "energy": 4,  "sentiment": "calm",  "year": 2014},
    {"name": "The Night We Met",       "artist": "Lord Huron",                    "bpm": 106, "key": "B major",  "duration_s": 213, "genre": "indie folk",    "energy": 4,  "sentiment": "calm",  "year": 2015},
    {"name": "Fast Car",               "artist": "Tracy Chapman",                 "bpm": 95,  "key": "A major",  "duration_s": 297, "genre": "folk rock",     "energy": 4,  "sentiment": "calm",  "year": 1988},
    {"name": "Somewhere Only We Know", "artist": "Keane",                         "bpm": 76,  "key": "A major",  "duration_s": 235, "genre": "alternative",   "energy": 3,  "sentiment": "calm",  "year": 2004},
    {"name": "Here Comes the Sun",     "artist": "The Beatles",                   "bpm": 129, "key": "A major",  "duration_s": 185, "genre": "classic rock",  "energy": 4,  "sentiment": "calm",  "year": 1969},
    {"name": "Hallelujah",             "artist": "Leonard Cohen",                 "bpm": 64,  "key": "C major",  "duration_s": 269, "genre": "folk",          "energy": 2,  "sentiment": "calm",  "year": 1984},
    {"name": "Sound of Silence",       "artist": "Simon & Garfunkel",             "bpm": 104, "key": "E minor",  "duration_s": 186, "genre": "folk rock",     "energy": 3,  "sentiment": "calm",  "year": 1964},
    {"name": "Hey Jude",               "artist": "The Beatles",                   "bpm": 74,  "key": "F major",  "duration_s": 431, "genre": "classic rock",  "energy": 4,  "sentiment": "calm",  "year": 1968},
    {"name": "Wonderwall",             "artist": "Oasis",                         "bpm": 87,  "key": "F# minor", "duration_s": 258, "genre": "britpop",       "energy": 4,  "sentiment": "calm",  "year": 1995},
    {"name": "Time After Time",        "artist": "Cyndi Lauper",                  "bpm": 89,  "key": "C major",  "duration_s": 243, "genre": "pop",           "energy": 4,  "sentiment": "calm",  "year": 1983},
    {"name": "Fix You",                "artist": "Coldplay",                      "bpm": 138, "key": "Bb major", "duration_s": 295, "genre": "alternative",   "energy": 5,  "sentiment": "calm",  "year": 2005},

    # ── CALM: Mid-energy focus (energy 5) ─────────────────────────────────────
    {"name": "Viva la Vida",           "artist": "Coldplay",                      "bpm": 138, "key": "Ab major", "duration_s": 242, "genre": "alternative",   "energy": 5,  "sentiment": "calm",  "year": 2008},
    {"name": "Africa",                 "artist": "Toto",                          "bpm": 92,  "key": "Ab major", "duration_s": 295, "genre": "pop rock",      "energy": 5,  "sentiment": "calm",  "year": 1982},
    {"name": "Dreams",                 "artist": "Fleetwood Mac",                 "bpm": 120, "key": "F major",  "duration_s": 257, "genre": "soft rock",     "energy": 4,  "sentiment": "calm",  "year": 1977},
    {"name": "Space Oddity",           "artist": "David Bowie",                   "bpm": 147, "key": "C major",  "duration_s": 315, "genre": "art rock",      "energy": 4,  "sentiment": "calm",  "year": 1969},
    {"name": "Stand By Me",            "artist": "Ben E. King",                   "bpm": 122, "key": "A major",  "duration_s": 178, "genre": "soul",          "energy": 3,  "sentiment": "calm",  "year": 1961},

    # ── PARTY: Warm-up / Crowd Building (energy 6–7) ─────────────────────────
    {"name": "Shape of You",           "artist": "Ed Sheeran",                    "bpm": 96,  "key": "C# minor", "duration_s": 234, "genre": "pop",           "energy": 6,  "sentiment": "party", "year": 2017},
    {"name": "Uptown Funk",            "artist": "Mark Ronson ft. Bruno Mars",    "bpm": 115, "key": "D minor",  "duration_s": 270, "genre": "funk pop",      "energy": 7,  "sentiment": "party", "year": 2014},
    {"name": "One Dance",              "artist": "Drake",                         "bpm": 104, "key": "C# major", "duration_s": 173, "genre": "afrobeats",     "energy": 6,  "sentiment": "party", "year": 2016},
    {"name": "Happy",                  "artist": "Pharrell Williams",             "bpm": 160, "key": "F major",  "duration_s": 233, "genre": "pop",           "energy": 7,  "sentiment": "party", "year": 2013},
    {"name": "Can't Stop the Feeling", "artist": "Justin Timberlake",             "bpm": 113, "key": "C major",  "duration_s": 237, "genre": "pop",           "energy": 7,  "sentiment": "party", "year": 2016},
    {"name": "Butter",                 "artist": "BTS",                           "bpm": 110, "key": "Eb major", "duration_s": 164, "genre": "k-pop",         "energy": 7,  "sentiment": "party", "year": 2021},
    {"name": "Levitating",             "artist": "Dua Lipa",                      "bpm": 103, "key": "F major",  "duration_s": 203, "genre": "pop",           "energy": 7,  "sentiment": "party", "year": 2020},
    {"name": "Dynamite",               "artist": "BTS",                           "bpm": 114, "key": "C major",  "duration_s": 199, "genre": "k-pop",         "energy": 7,  "sentiment": "party", "year": 2020},
    {"name": "Watermelon Sugar",       "artist": "Harry Styles",                  "bpm": 95,  "key": "E major",  "duration_s": 174, "genre": "pop",           "energy": 6,  "sentiment": "party", "year": 2019},
    {"name": "Sweet Caroline",         "artist": "Neil Diamond",                  "bpm": 72,  "key": "A major",  "duration_s": 202, "genre": "pop",           "energy": 7,  "sentiment": "party", "year": 1969},
    {"name": "Dancing Queen",          "artist": "ABBA",                          "bpm": 101, "key": "A major",  "duration_s": 231, "genre": "disco",         "energy": 7,  "sentiment": "party", "year": 1976},
    {"name": "September",              "artist": "Earth Wind & Fire",             "bpm": 126, "key": "D major",  "duration_s": 215, "genre": "funk",          "energy": 7,  "sentiment": "party", "year": 1978},
    {"name": "I Will Survive",         "artist": "Gloria Gaynor",                 "bpm": 117, "key": "A minor",  "duration_s": 195, "genre": "disco",         "energy": 7,  "sentiment": "party", "year": 1978},
    {"name": "24K Magic",              "artist": "Bruno Mars",                    "bpm": 109, "key": "F major",  "duration_s": 226, "genre": "r&b",           "energy": 7,  "sentiment": "party", "year": 2016},
    {"name": "Flowers",                "artist": "Miley Cyrus",                   "bpm": 117, "key": "E major",  "duration_s": 200, "genre": "pop",           "energy": 7,  "sentiment": "party", "year": 2023},
    {"name": "Anti-Hero",              "artist": "Taylor Swift",                  "bpm": 97,  "key": "D major",  "duration_s": 200, "genre": "pop",           "energy": 7,  "sentiment": "party", "year": 2022},
    {"name": "Moves Like Jagger",      "artist": "Maroon 5 ft. Christina Aguilera","bpm":128, "key": "G major",  "duration_s": 201, "genre": "pop",           "energy": 8,  "sentiment": "party", "year": 2011},
    {"name": "Thriller",               "artist": "Michael Jackson",               "bpm": 118, "key": "C# minor", "duration_s": 357, "genre": "pop",           "energy": 7,  "sentiment": "party", "year": 1982},
    {"name": "Billie Jean",            "artist": "Michael Jackson",               "bpm": 117, "key": "F minor",  "duration_s": 294, "genre": "pop",           "energy": 8,  "sentiment": "party", "year": 1983},

    # ── PARTY: Main Floor (energy 8–9) ────────────────────────────────────────
    {"name": "Blinding Lights",        "artist": "The Weeknd",                    "bpm": 171, "key": "F minor",  "duration_s": 200, "genre": "synth-pop",     "energy": 9,  "sentiment": "party", "year": 2019},
    {"name": "Animals",                "artist": "Martin Garrix",                 "bpm": 128, "key": "F major",  "duration_s": 186, "genre": "edm",           "energy": 9,  "sentiment": "party", "year": 2013},
    {"name": "Levels",                 "artist": "Avicii",                        "bpm": 128, "key": "F major",  "duration_s": 197, "genre": "edm",           "energy": 9,  "sentiment": "party", "year": 2011},
    {"name": "Wake Me Up",             "artist": "Avicii",                        "bpm": 124, "key": "B minor",  "duration_s": 247, "genre": "folk edm",      "energy": 8,  "sentiment": "party", "year": 2013},
    {"name": "Don't You Worry Child",  "artist": "Swedish House Mafia",           "bpm": 128, "key": "E minor",  "duration_s": 269, "genre": "edm",           "energy": 9,  "sentiment": "party", "year": 2012},
    {"name": "Titanium",               "artist": "David Guetta ft. Sia",          "bpm": 126, "key": "F major",  "duration_s": 245, "genre": "edm",           "energy": 8,  "sentiment": "party", "year": 2011},
    {"name": "Lean On",                "artist": "Major Lazer ft. DJ Snake",      "bpm": 98,  "key": "G minor",  "duration_s": 175, "genre": "edm",           "energy": 8,  "sentiment": "party", "year": 2015},
    {"name": "Stay",                   "artist": "The Kid LAROI ft. Justin Bieber","bpm": 170, "key": "C# major", "duration_s": 141, "genre": "pop",           "energy": 9,  "sentiment": "party", "year": 2021},
    {"name": "good 4 u",               "artist": "Olivia Rodrigo",                "bpm": 166, "key": "A major",  "duration_s": 178, "genre": "pop punk",      "energy": 9,  "sentiment": "party", "year": 2021},
    {"name": "As It Was",              "artist": "Harry Styles",                  "bpm": 174, "key": "A minor",  "duration_s": 167, "genre": "indie pop",     "energy": 8,  "sentiment": "party", "year": 2022},
    {"name": "HUMBLE.",                "artist": "Kendrick Lamar",                "bpm": 150, "key": "E major",  "duration_s": 177, "genre": "hip-hop",       "energy": 9,  "sentiment": "party", "year": 2017},
    {"name": "Industry Baby",          "artist": "Lil Nas X ft. Jack Harlow",     "bpm": 149, "key": "D# major", "duration_s": 212, "genre": "hip-hop",       "energy": 9,  "sentiment": "party", "year": 2021},
    {"name": "Starboy",                "artist": "The Weeknd ft. Daft Punk",      "bpm": 186, "key": "F minor",  "duration_s": 230, "genre": "r&b",           "energy": 9,  "sentiment": "party", "year": 2016},
    {"name": "God's Plan",             "artist": "Drake",                         "bpm": 77,  "key": "Ab major", "duration_s": 198, "genre": "hip-hop",       "energy": 8,  "sentiment": "party", "year": 2018},
    {"name": "Don't Stop 'Til You Get Enough", "artist": "Michael Jackson",       "bpm": 118, "key": "Ab major", "duration_s": 365, "genre": "disco",         "energy": 8,  "sentiment": "party", "year": 1979},
    {"name": "Just Dance",             "artist": "Lady Gaga ft. Colby O'Donis",   "bpm": 119, "key": "B major",  "duration_s": 241, "genre": "dance pop",     "energy": 9,  "sentiment": "party", "year": 2008},
    {"name": "Sugar",                  "artist": "Maroon 5",                      "bpm": 122, "key": "Bb major", "duration_s": 235, "genre": "pop",           "energy": 8,  "sentiment": "party", "year": 2014},
    {"name": "Locked Out of Heaven",   "artist": "Bruno Mars",                    "bpm": 144, "key": "Bb minor", "duration_s": 233, "genre": "pop rock",      "energy": 9,  "sentiment": "party", "year": 2012},
    {"name": "Telephone",              "artist": "Lady Gaga ft. Beyoncé",         "bpm": 122, "key": "C minor",  "duration_s": 340, "genre": "dance pop",     "energy": 9,  "sentiment": "party", "year": 2009},
    {"name": "Gimme! Gimme! Gimme!",   "artist": "ABBA",                          "bpm": 130, "key": "A minor",  "duration_s": 284, "genre": "disco",         "energy": 8,  "sentiment": "party", "year": 1979},

    # ── PARTY: Peak / Rave / Anthem (energy 10) ───────────────────────────────
    {"name": "Sandstorm",              "artist": "Darude",                        "bpm": 136, "key": "Bb minor", "duration_s": 226, "genre": "trance",        "energy": 10, "sentiment": "party", "year": 1999},
    {"name": "Turn Down for What",     "artist": "DJ Snake ft. Lil Jon",          "bpm": 100, "key": "F# major", "duration_s": 196, "genre": "trap edm",      "energy": 10, "sentiment": "party", "year": 2013},
    {"name": "Mr. Brightside",         "artist": "The Killers",                   "bpm": 148, "key": "C major",  "duration_s": 222, "genre": "indie rock",    "energy": 10, "sentiment": "party", "year": 2003},
    {"name": "Clarity",                "artist": "Zedd ft. Foxes",                "bpm": 128, "key": "E minor",  "duration_s": 271, "genre": "edm",           "energy": 10, "sentiment": "party", "year": 2012},
    {"name": "Kernkraft 400",          "artist": "Zombie Nation",                 "bpm": 136, "key": "A minor",  "duration_s": 309, "genre": "techno",        "energy": 10, "sentiment": "party", "year": 1999},
    {"name": "Don't Stop Believin'",   "artist": "Journey",                       "bpm": 119, "key": "E major",  "duration_s": 251, "genre": "classic rock",  "energy": 10, "sentiment": "party", "year": 1981},
    {"name": "Jump Around",            "artist": "House of Pain",                 "bpm": 100, "key": "E minor",  "duration_s": 210, "genre": "hip-hop",       "energy": 10, "sentiment": "party", "year": 1992},
    {"name": "Stronger",               "artist": "Kanye West",                    "bpm": 106, "key": "Eb minor", "duration_s": 312, "genre": "hip-hop",       "energy": 10, "sentiment": "party", "year": 2007},
    {"name": "Sicko Mode",             "artist": "Travis Scott",                  "bpm": 155, "key": "A major",  "duration_s": 312, "genre": "hip-hop",       "energy": 10, "sentiment": "party", "year": 2018},
    {"name": "Party Rock Anthem",      "artist": "LMFAO ft. Lauren Bennett",      "bpm": 130, "key": "Ab major", "duration_s": 277, "genre": "electro hop",   "energy": 10, "sentiment": "party", "year": 2011},
    {"name": "Bohemian Rhapsody",      "artist": "Queen",                         "bpm": 72,  "key": "Bb major", "duration_s": 354, "genre": "rock",          "energy": 10, "sentiment": "party", "year": 1975},
    {"name": "Don't Stop Me Now",      "artist": "Queen",                         "bpm": 156, "key": "F major",  "duration_s": 209, "genre": "rock",          "energy": 10, "sentiment": "party", "year": 1979},
    {"name": "Sweet Child O' Mine",    "artist": "Guns N' Roses",                 "bpm": 124, "key": "Db major", "duration_s": 356, "genre": "hard rock",     "energy": 10, "sentiment": "party", "year": 1987},
    {"name": "All Star",               "artist": "Smash Mouth",                   "bpm": 104, "key": "F# major", "duration_s": 238, "genre": "pop rock",      "energy": 8,  "sentiment": "party", "year": 1999},
    {"name": "Teenage Dream",          "artist": "Katy Perry",                    "bpm": 120, "key": "Ab major", "duration_s": 217, "genre": "pop",           "energy": 9,  "sentiment": "party", "year": 2010},
]


def get_song(sentiment: str, energy: int, recently_played: list[str] | None = None) -> dict | None:
    """
    Pick the best song from the database for the current crowd state.

    Selects songs within ±2 energy of the target, avoids recently played tracks,
    then picks randomly from the top 5 closest matches.

    Args:
        sentiment:       "party" or "calm"
        energy:          crowd energy 1–10
        recently_played: list of "name|artist" keys to skip

    Returns:
        A copy of the song dict, or None if the pool is empty.
    """
    played = set(recently_played or [])
    pool = [s for s in SONGS if s["sentiment"] == sentiment]

    def _key(s: dict) -> str:
        return f"{s['name']}|{s['artist']}"

    # Songs within ±2 energy of target, not recently played
    close = [s for s in pool if abs(s["energy"] - energy) <= 2 and _key(s) not in played]

    # Expand if nothing close
    if not close:
        close = [s for s in pool if _key(s) not in played]

    # Fall back to full pool (ignore recently_played) if everything played
    if not close:
        close = pool

    if not close:
        return None

    # Sort by proximity to target energy; pick randomly from top 5
    close.sort(key=lambda s: abs(s["energy"] - energy))
    return random.choice(close[:5]).copy()
