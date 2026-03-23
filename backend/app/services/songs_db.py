"""
DJ Song Reference Database

42 songs chosen for genre, key, and BPM diversity.
Each song has a `tags` list of descriptive vibe words used for semantic matching.

Fields: name, artist, bpm, key, duration_s, genre, energy (1–10), sentiment, year, tags.
"""

import random

SONGS: list[dict] = [
    # ── PARTY ──────────────────────────────────────────────────────────────────
    {"name": "Animals",                "artist": "Martin Garrix",              "bpm": 128, "key": "F major",  "duration_s": 186, "genre": "edm",          "energy": 9,  "sentiment": "party",   "year": 2013,
     "tags": ["energetic", "dancing", "electronic", "euphoric", "festival", "rave", "hype", "loud"]},
    {"name": "Levels",                 "artist": "Avicii",                     "bpm": 128, "key": "F major",  "duration_s": 197, "genre": "edm",          "energy": 9,  "sentiment": "party",   "year": 2011,
     "tags": ["euphoric", "uplifting", "festival", "dancing", "electronic", "energetic", "rave"]},
    {"name": "Clarity",                "artist": "Zedd ft. Foxes",             "bpm": 128, "key": "E minor",  "duration_s": 271, "genre": "edm",          "energy": 10, "sentiment": "party",   "year": 2012,
     "tags": ["emotional", "energetic", "euphoric", "dance", "electronic", "powerful", "intense"]},
    {"name": "Lean On",                "artist": "Major Lazer ft. DJ Snake",   "bpm": 98,  "key": "G minor",  "duration_s": 175, "genre": "edm",          "energy": 8,  "sentiment": "party",   "year": 2015,
     "tags": ["upbeat", "danceable", "festive", "tropical", "energetic", "crowd", "social"]},
    {"name": "Sandstorm",              "artist": "Darude",                     "bpm": 136, "key": "Bb minor", "duration_s": 226, "genre": "trance",       "energy": 10, "sentiment": "party",   "year": 1999,
     "tags": ["intense", "rave", "energetic", "electronic", "driving", "anthemic", "nostalgic"]},
    {"name": "Kernkraft 400",          "artist": "Zombie Nation",              "bpm": 136, "key": "A minor",  "duration_s": 309, "genre": "techno",       "energy": 10, "sentiment": "party",   "year": 1999,
     "tags": ["intense", "rave", "energetic", "rowdy", "anthemic", "stadium", "crowd", "hype"]},
    {"name": "HUMBLE.",                "artist": "Kendrick Lamar",             "bpm": 150, "key": "E major",  "duration_s": 177, "genre": "hip-hop",      "energy": 9,  "sentiment": "party",   "year": 2017,
     "tags": ["confident", "hip-hop", "energetic", "assertive", "bold", "driving", "intense"]},
    {"name": "God's Plan",             "artist": "Drake",                      "bpm": 77,  "key": "Ab major", "duration_s": 198, "genre": "hip-hop",      "energy": 8,  "sentiment": "party",   "year": 2018,
     "tags": ["chill", "hip-hop", "laid-back", "cool", "smooth", "upbeat", "modern"]},
    {"name": "Sicko Mode",             "artist": "Travis Scott",               "bpm": 155, "key": "A major",  "duration_s": 312, "genre": "trap",         "energy": 10, "sentiment": "party",   "year": 2018,
     "tags": ["intense", "trap", "energetic", "wild", "hype", "chaotic", "heavy"]},
    {"name": "Turn Down for What",     "artist": "DJ Snake ft. Lil Jon",       "bpm": 100, "key": "F# major", "duration_s": 196, "genre": "trap edm",     "energy": 10, "sentiment": "party",   "year": 2013,
     "tags": ["wild", "chaotic", "intense", "rave", "loud", "hype", "rowdy", "party"]},
    {"name": "Uptown Funk",            "artist": "Mark Ronson ft. Bruno Mars", "bpm": 115, "key": "D minor",  "duration_s": 270, "genre": "funk",         "energy": 7,  "sentiment": "party",   "year": 2014,
     "tags": ["funky", "danceable", "groovy", "happy", "upbeat", "feel-good", "social", "fun"]},
    {"name": "September",              "artist": "Earth Wind & Fire",          "bpm": 126, "key": "D major",  "duration_s": 215, "genre": "disco",        "energy": 7,  "sentiment": "party",   "year": 1978,
     "tags": ["nostalgic", "danceable", "happy", "groovy", "feel-good", "social", "classic"]},
    {"name": "Dancing Queen",          "artist": "ABBA",                       "bpm": 101, "key": "A major",  "duration_s": 231, "genre": "disco",        "energy": 7,  "sentiment": "party",   "year": 1976,
     "tags": ["joyful", "nostalgic", "danceable", "happy", "upbeat", "classic", "fun"]},
    {"name": "Blinding Lights",        "artist": "The Weeknd",                 "bpm": 171, "key": "F minor",  "duration_s": 200, "genre": "synth-pop",    "energy": 9,  "sentiment": "party",   "year": 2019,
     "tags": ["driving", "synth", "energetic", "cinematic", "fast", "modern", "intense"]},
    {"name": "As It Was",              "artist": "Harry Styles",               "bpm": 174, "key": "A minor",  "duration_s": 167, "genre": "indie pop",    "energy": 8,  "sentiment": "party",   "year": 2022,
     "tags": ["indie", "upbeat", "emotional", "driving", "energetic", "modern", "danceable"]},
    {"name": "Mr. Brightside",         "artist": "The Killers",                "bpm": 148, "key": "C major",  "duration_s": 222, "genre": "indie rock",   "energy": 10, "sentiment": "party",   "year": 2003,
     "tags": ["anthemic", "indie rock", "energetic", "emotional", "driving", "crowd", "catchy"]},
    {"name": "Don't Stop Believin'",   "artist": "Journey",                    "bpm": 119, "key": "E major",  "duration_s": 251, "genre": "classic rock", "energy": 10, "sentiment": "party",   "year": 1981,
     "tags": ["anthemic", "rock", "uplifting", "feel-good", "nostalgic", "crowd", "classic"]},
    {"name": "Bohemian Rhapsody",      "artist": "Queen",                      "bpm": 72,  "key": "Bb major", "duration_s": 354, "genre": "rock",         "energy": 10, "sentiment": "party",   "year": 1975,
     "tags": ["dramatic", "epic", "rock", "powerful", "theatrical", "classic", "anthemic"]},
    {"name": "Can't Stop the Feeling", "artist": "Justin Timberlake",          "bpm": 113, "key": "C major",  "duration_s": 237, "genre": "pop",          "energy": 7,  "sentiment": "party",   "year": 2016,
     "tags": ["joyful", "danceable", "happy", "upbeat", "feel-good", "fun", "sunny"]},
    {"name": "Shape of You",           "artist": "Ed Sheeran",                 "bpm": 96,  "key": "C# minor", "duration_s": 234, "genre": "pop",          "energy": 6,  "sentiment": "party",   "year": 2017,
     "tags": ["groovy", "danceable", "upbeat", "pop", "feel-good", "catchy", "social"]},

    # ── CALM ───────────────────────────────────────────────────────────────────
    {"name": "Clair de Lune",          "artist": "Claude Debussy",             "bpm": 72,  "key": "Db major", "duration_s": 330, "genre": "classical",    "energy": 1,  "sentiment": "calm",    "year": 1905,
     "tags": ["peaceful", "classical", "meditative", "tranquil", "gentle", "still", "quiet"]},
    {"name": "Gymnopédie No. 1",       "artist": "Erik Satie",                 "bpm": 60,  "key": "D major",  "duration_s": 180, "genre": "classical",    "energy": 1,  "sentiment": "calm",    "year": 1888,
     "tags": ["peaceful", "melancholic", "slow", "classical", "minimal", "still", "quiet"]},
    {"name": "River Flows in You",     "artist": "Yiruma",                     "bpm": 84,  "key": "A major",  "duration_s": 209, "genre": "new age",      "energy": 2,  "sentiment": "calm",    "year": 2001,
     "tags": ["gentle", "romantic", "peaceful", "piano", "tender", "tranquil", "soothing"]},
    {"name": "Weightless",             "artist": "Marconi Union",              "bpm": 60,  "key": "none",     "duration_s": 480, "genre": "ambient",      "energy": 1,  "sentiment": "calm",    "year": 2011,
     "tags": ["deeply calm", "ambient", "meditative", "tranquil", "stress relief", "still", "therapeutic"]},
    {"name": "Nuvole Bianche",         "artist": "Ludovico Einaudi",           "bpm": 55,  "key": "E major",  "duration_s": 349, "genre": "neoclassical", "energy": 2,  "sentiment": "calm",    "year": 2004,
     "tags": ["melancholic", "neoclassical", "peaceful", "piano", "emotional", "gentle", "cinematic"]},
    {"name": "Experience",             "artist": "Ludovico Einaudi",           "bpm": 90,  "key": "C minor",  "duration_s": 285, "genre": "neoclassical", "energy": 3,  "sentiment": "calm",    "year": 2013,
     "tags": ["flowing", "neoclassical", "contemplative", "cinematic", "peaceful", "gentle", "building"]},
    {"name": "Holocene",               "artist": "Bon Iver",                   "bpm": 78,  "key": "E major",  "duration_s": 331, "genre": "indie folk",   "energy": 3,  "sentiment": "calm",    "year": 2011,
     "tags": ["introspective", "folk", "melancholic", "quiet", "atmospheric", "emotional", "gentle"]},
    {"name": "The Scientist",          "artist": "Coldplay",                   "bpm": 75,  "key": "F major",  "duration_s": 309, "genre": "alternative",  "energy": 3,  "sentiment": "calm",    "year": 2002,
     "tags": ["melancholic", "introspective", "emotional", "slow", "reflective", "gentle", "piano"]},
    {"name": "Yellow",                 "artist": "Coldplay",                   "bpm": 88,  "key": "B major",  "duration_s": 269, "genre": "alternative",  "energy": 4,  "sentiment": "calm",    "year": 2000,
     "tags": ["hopeful", "gentle", "warm", "acoustic", "emotional", "soft", "tender"]},
    {"name": "Africa",                 "artist": "Toto",                       "bpm": 92,  "key": "Ab major", "duration_s": 295, "genre": "pop rock",     "energy": 5,  "sentiment": "calm",    "year": 1982,
     "tags": ["warm", "moderate", "nostalgic", "feel-good", "classic", "relaxed", "mellow"]},
    {"name": "On the Nature of Daylight","artist": "Max Richter",              "bpm": 52,  "key": "E minor",  "duration_s": 269, "genre": "neoclassical", "energy": 2,  "sentiment": "calm",    "year": 2004,
     "tags": ["neoclassical", "peaceful", "cinematic", "melancholic", "gentle", "piano", "still", "tender"]},
    {"name": "Spiegel im Spiegel",     "artist": "Arvo Pärt",                  "bpm": 56,  "key": "A major",  "duration_s": 570, "genre": "classical",    "energy": 1,  "sentiment": "calm",    "year": 1978,
     "tags": ["classical", "minimal", "peaceful", "meditative", "still", "quiet", "tranquil", "therapeutic"]},
    {"name": "Roads",                  "artist": "Portishead",                 "bpm": 78,  "key": "G minor",  "duration_s": 311, "genre": "trip-hop",     "energy": 3,  "sentiment": "calm",    "year": 1994,
     "tags": ["melancholic", "atmospheric", "calm", "introspective", "gentle", "emotional", "nocturnal"]},
    {"name": "Skinny Love",            "artist": "Bon Iver",                   "bpm": 148, "key": "Eb major", "duration_s": 187, "genre": "indie folk",   "energy": 4,  "sentiment": "calm",    "year": 2008,
     "tags": ["folk", "acoustic", "emotional", "introspective", "gentle", "warm", "tender", "reflective"]},
    {"name": "Fix You",               "artist": "Coldplay",                   "bpm": 138, "key": "Eb major", "duration_s": 295, "genre": "alternative",  "energy": 4,  "sentiment": "calm",    "year": 2005,
     "tags": ["hopeful", "emotional", "gentle", "building", "calm", "piano", "warm", "uplifting"]},
    {"name": "Pink Moon",             "artist": "Nick Drake",                 "bpm": 72,  "key": "A major",  "duration_s": 124, "genre": "folk",         "energy": 1,  "sentiment": "calm",    "year": 1972,
     "tags": ["acoustic", "folk", "melancholic", "peaceful", "quiet", "minimal", "gentle", "nocturnal"]},
    {"name": "Lullaby",               "artist": "Sigur Ros",                  "bpm": 64,  "key": "Bb major", "duration_s": 477, "genre": "ambient",      "energy": 1,  "sentiment": "calm",    "year": 1999,
     "tags": ["ambient", "peaceful", "gentle", "dreamlike", "still", "quiet", "soothing", "meditative"]},
    {"name": "Autumn Leaves",         "artist": "Nat King Cole",              "bpm": 80,  "key": "G minor",  "duration_s": 206, "genre": "jazz",         "energy": 3,  "sentiment": "calm",    "year": 1956,
     "tags": ["jazz", "nostalgic", "mellow", "warm", "classic", "gentle", "romantic", "reflective"]},
    {"name": "Blue in Green",         "artist": "Miles Davis",                "bpm": 66,  "key": "G major",  "duration_s": 340, "genre": "jazz",         "energy": 2,  "sentiment": "calm",    "year": 1959,
     "tags": ["jazz", "peaceful", "melancholic", "gentle", "piano", "atmospheric", "nocturnal", "slow"]},
    {"name": "Strawberry Fields Forever", "artist": "The Beatles",            "bpm": 88,  "key": "A major",  "duration_s": 248, "genre": "classic rock", "energy": 3,  "sentiment": "calm",    "year": 1966,
     "tags": ["nostalgic", "dreamy", "psychedelic", "gentle", "classic", "warm", "introspective", "calm"]},

    # ── FOCUSED ─────────────────────────────────────────────────────────────────
    {"name": "Intro",                  "artist": "The xx",                     "bpm": 80,  "key": "E minor",  "duration_s": 130, "genre": "indie",        "energy": 3,  "sentiment": "focused", "year": 2009,
     "tags": ["minimal", "focused", "steady", "ambient", "lo-fi", "study", "quiet", "deep work"]},
    {"name": "Night Owl",              "artist": "Galimatias",                 "bpm": 82,  "key": "A minor",  "duration_s": 214, "genre": "lo-fi",        "energy": 3,  "sentiment": "focused", "year": 2015,
     "tags": ["lo-fi", "study", "chill", "focused", "nocturnal", "minimal", "smooth", "deep work"]},
    {"name": "Retrograde",             "artist": "James Blake",                "bpm": 86,  "key": "F major",  "duration_s": 244, "genre": "electronic",   "energy": 4,  "sentiment": "focused", "year": 2013,
     "tags": ["contemplative", "electronic", "focused", "slow-burn", "steady", "introspective", "deep"]},
    {"name": "On & On",                "artist": "Erykah Badu",                "bpm": 90,  "key": "D minor",  "duration_s": 295, "genre": "neo-soul",     "energy": 4,  "sentiment": "focused", "year": 1997,
     "tags": ["smooth", "soul", "focused", "steady", "mellow", "groove", "warm"]},
    {"name": "Comptine d'un autre été","artist": "Yann Tiersen",               "bpm": 76,  "key": "E minor",  "duration_s": 149, "genre": "neoclassical", "energy": 2,  "sentiment": "focused", "year": 2001,
     "tags": ["delicate", "piano", "focused", "quiet", "study", "gentle", "minimal", "cinematic"]},
    {"name": "Divenire",               "artist": "Ludovico Einaudi",           "bpm": 96,  "key": "G major",  "duration_s": 365, "genre": "neoclassical", "energy": 4,  "sentiment": "focused", "year": 2006,
     "tags": ["building", "neoclassical", "focused", "piano", "flowing", "steady", "deep work"]},
    {"name": "Opus 23",                "artist": "Dustin O'Halloran",          "bpm": 72,  "key": "A minor",  "duration_s": 201, "genre": "neoclassical", "energy": 2,  "sentiment": "focused", "year": 2011,
     "tags": ["minimal", "neoclassical", "focused", "study", "quiet", "introspective", "sparse"]},
    {"name": "Says",                   "artist": "Nils Frahm",                 "bpm": 82,  "key": "A minor",  "duration_s": 402, "genre": "ambient",      "energy": 3,  "sentiment": "focused", "year": 2013,
     "tags": ["ambient", "electronic", "focused", "steady", "building", "minimal", "deep work", "atmospheric"]},
    {"name": "Near Light",             "artist": "Olafur Arnalds",             "bpm": 66,  "key": "E major",  "duration_s": 249, "genre": "neoclassical", "energy": 2,  "sentiment": "focused", "year": 2013,
     "tags": ["neoclassical", "focused", "gentle", "piano", "atmospheric", "cinematic", "quiet", "study"]},
    {"name": "Teardrop",               "artist": "Massive Attack",             "bpm": 91,  "key": "Dm",       "duration_s": 320, "genre": "trip-hop",     "energy": 4,  "sentiment": "focused", "year": 1998,
     "tags": ["trip-hop", "focused", "steady", "atmospheric", "deep", "electronic", "hypnotic", "smooth"]},
    {"name": "Porcelain",              "artist": "Moby",                       "bpm": 97,  "key": "C minor",  "duration_s": 253, "genre": "ambient",      "energy": 3,  "sentiment": "focused", "year": 1999,
     "tags": ["ambient", "electronic", "focused", "steady", "atmospheric", "minimal", "calm", "deep work"]},
    {"name": "First Breath After Coma","artist": "Explosions in the Sky",      "bpm": 100, "key": "E major",  "duration_s": 478, "genre": "post-rock",    "energy": 5,  "sentiment": "focused", "year": 2003,
     "tags": ["post-rock", "building", "focused", "epic", "atmospheric", "instrumental", "steady", "flowing"]},
    {"name": "Breathe",                "artist": "Telepopmusik",               "bpm": 88,  "key": "F major",  "duration_s": 248, "genre": "downtempo",    "energy": 3,  "sentiment": "focused", "year": 2001,
     "tags": ["downtempo", "focused", "smooth", "ambient", "electronic", "steady", "chill", "atmospheric"]},
    {"name": "Karma Police",           "artist": "Radiohead",                  "bpm": 76,  "key": "A major",  "duration_s": 263, "genre": "alternative",  "energy": 4,  "sentiment": "focused", "year": 1997,
     "tags": ["alternative", "introspective", "focused", "contemplative", "steady", "slow-burn", "emotional"]},
    {"name": "Limit to Your Love",     "artist": "James Blake",                "bpm": 68,  "key": "F minor",  "duration_s": 222, "genre": "alternative",  "energy": 3,  "sentiment": "focused", "year": 2010,
     "tags": ["minimal", "piano", "focused", "quiet", "introspective", "deep", "slow", "study"]},
    {"name": "A Long Walk",            "artist": "Jill Scott",                 "bpm": 84,  "key": "G major",  "duration_s": 268, "genre": "neo-soul",     "energy": 3,  "sentiment": "focused", "year": 2000,
     "tags": ["soul", "smooth", "focused", "warm", "mellow", "laid-back", "steady", "soothing"]},
    # More focused — indie/folk/alternative
    {"name": "Heartbeats",             "artist": "Jose Gonzalez",              "bpm": 94,  "key": "F# minor", "duration_s": 189, "genre": "indie folk",   "energy": 3,  "sentiment": "focused", "year": 2003,
     "tags": ["acoustic", "folk", "focused", "gentle", "introspective", "minimal", "study", "quiet"]},
    {"name": "Sleeping at Last - Saturn", "artist": "Sleeping at Last",        "bpm": 63,  "key": "E major",  "duration_s": 302, "genre": "indie",        "energy": 2,  "sentiment": "focused", "year": 2014,
     "tags": ["cinematic", "piano", "focused", "gentle", "introspective", "minimal", "slow", "deep work"]},
    {"name": "No Surprises",           "artist": "Radiohead",                  "bpm": 75,  "key": "F major",  "duration_s": 228, "genre": "alternative",  "energy": 3,  "sentiment": "focused", "year": 1997,
     "tags": ["melancholic", "minimal", "focused", "gentle", "introspective", "piano", "steady", "slow"]},
    {"name": "Lua",                    "artist": "Bright Eyes",                "bpm": 68,  "key": "G major",  "duration_s": 254, "genre": "indie folk",   "energy": 3,  "sentiment": "focused", "year": 2005,
     "tags": ["folk", "acoustic", "focused", "introspective", "quiet", "gentle", "lo-fi", "study"]},
    {"name": "Hoppipolla",             "artist": "Sigur Ros",                  "bpm": 84,  "key": "E major",  "duration_s": 274, "genre": "post-rock",    "energy": 4,  "sentiment": "focused", "year": 2005,
     "tags": ["cinematic", "building", "focused", "atmospheric", "epic", "instrumental", "hopeful", "flowing"]},
    {"name": "Death With Dignity",     "artist": "Sufjan Stevens",             "bpm": 88,  "key": "G major",  "duration_s": 195, "genre": "indie folk",   "energy": 3,  "sentiment": "focused", "year": 2015,
     "tags": ["acoustic", "folk", "focused", "gentle", "introspective", "minimal", "piano", "study"]},
    {"name": "Unfinished Sympathy",    "artist": "Massive Attack",             "bpm": 91,  "key": "C major",  "duration_s": 296, "genre": "trip-hop",     "energy": 5,  "sentiment": "focused", "year": 1991,
     "tags": ["trip-hop", "orchestral", "focused", "smooth", "atmospheric", "steady", "deep", "driving"]},
    {"name": "All I Want",             "artist": "Kodaline",                   "bpm": 76,  "key": "E major",  "duration_s": 291, "genre": "alternative",  "energy": 3,  "sentiment": "focused", "year": 2013,
     "tags": ["emotional", "piano", "focused", "introspective", "gentle", "building", "cinematic", "slow"]},
    {"name": "Helplessness Blues",     "artist": "Fleet Foxes",                "bpm": 90,  "key": "D major",  "duration_s": 314, "genre": "indie folk",   "energy": 4,  "sentiment": "focused", "year": 2011,
     "tags": ["folk", "acoustic", "focused", "introspective", "harmonics", "warm", "building", "study"]},
    {"name": "Feel It All Around",     "artist": "Washed Out",                 "bpm": 100, "key": "C major",  "duration_s": 243, "genre": "chillwave",    "energy": 3,  "sentiment": "focused", "year": 2009,
     "tags": ["chillwave", "lo-fi", "focused", "dreamy", "atmospheric", "steady", "ambient", "smooth"]},
    {"name": "Atlas Hands",            "artist": "Benjamin Francis Leftwich",  "bpm": 72,  "key": "A major",  "duration_s": 280, "genre": "indie folk",   "energy": 2,  "sentiment": "focused", "year": 2011,
     "tags": ["acoustic", "folk", "focused", "gentle", "quiet", "introspective", "minimal", "study"]},
    {"name": "Glosoli",                "artist": "Sigur Ros",                  "bpm": 76,  "key": "B minor",  "duration_s": 426, "genre": "post-rock",    "energy": 4,  "sentiment": "focused", "year": 2005,
     "tags": ["post-rock", "building", "atmospheric", "focused", "cinematic", "epic", "instrumental", "deep work"]},

    # ── HAPPY ────────────────────────────────────────────────────────────────────
    {"name": "Happy",                  "artist": "Pharrell Williams",          "bpm": 160, "key": "F minor",  "duration_s": 233, "genre": "pop",          "energy": 7,  "sentiment": "happy",   "year": 2013,
     "tags": ["joyful", "upbeat", "sunny", "positive", "feel-good", "happy", "energetic", "fun"]},
    {"name": "Here Comes the Sun",     "artist": "The Beatles",                "bpm": 129, "key": "A major",  "duration_s": 185, "genre": "classic rock", "energy": 6,  "sentiment": "happy",   "year": 1969,
     "tags": ["optimistic", "warm", "uplifting", "gentle", "classic", "feel-good", "hopeful", "bright"]},
    {"name": "Good as Hell",           "artist": "Lizzo",                      "bpm": 95,  "key": "C major",  "duration_s": 159, "genre": "pop",          "energy": 7,  "sentiment": "happy",   "year": 2016,
     "tags": ["empowering", "upbeat", "positive", "feel-good", "joyful", "confident", "fun"]},
    {"name": "Shake It Off",           "artist": "Taylor Swift",               "bpm": 160, "key": "G major",  "duration_s": 219, "genre": "pop",          "energy": 8,  "sentiment": "happy",   "year": 2014,
     "tags": ["playful", "upbeat", "carefree", "danceable", "feel-good", "fun", "bright", "energetic"]},
    {"name": "Walking on Sunshine",    "artist": "Katrina and the Waves",      "bpm": 110, "key": "A major",  "duration_s": 239, "genre": "pop rock",     "energy": 8,  "sentiment": "happy",   "year": 1985,
     "tags": ["upbeat", "sunny", "energetic", "joyful", "feel-good", "classic", "positive", "bright"]},
    {"name": "I Gotta Feeling",        "artist": "The Black Eyed Peas",        "bpm": 128, "key": "G major",  "duration_s": 290, "genre": "pop",          "energy": 8,  "sentiment": "happy",   "year": 2009,
     "tags": ["celebratory", "upbeat", "social", "danceable", "festive", "feel-good", "joyful", "party"]},
]


def get_song(sentiment: str, energy: int, recently_played: list[str] | None = None) -> dict | None:
    """
    Pick the best-matching song by sentiment bucket + energy proximity.
    Falls back to 'calm' pool if the requested sentiment has no songs.
    """
    played = set(recently_played or [])
    pool   = [s for s in SONGS if s["sentiment"] == sentiment]
    if not pool:
        pool = [s for s in SONGS if s["sentiment"] == "calm"]

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


def find_best_match(vibe_tags: list[str], recently_played: list[str] | None = None) -> dict | None:
    """
    Semantic matching: score every song by tag overlap with the given vibe_tags.
    Returns the best-matching song, avoiding recently played.
    Falls back to get_song("calm", 3) if no tags match anything.
    """
    if not vibe_tags:
        return None

    query = {t.lower().strip() for t in vibe_tags}
    played = set(recently_played or [])

    scored: list[tuple[int, dict]] = []
    for song in SONGS:
        k = f"{song['name']}|{song['artist']}"
        if k in played:
            continue
        song_tags = {t.lower() for t in song.get("tags", [])}
        score = len(query & song_tags)
        scored.append((score, song))

    if not scored:
        return get_song("calm", 3, recently_played)

    scored.sort(key=lambda x: -x[0])
    top_score = scored[0][0]

    if top_score == 0:
        # No tag overlap — fall back to bucket matching
        return get_song("calm", 3, recently_played)

    # Randomly pick from the top tier (within 1 of best score)
    top_pool = [s for sc, s in scored if sc >= max(1, top_score - 1)]
    return random.choice(top_pool[:5]).copy()
