"""
Gemini DJ Composer

Given a song reference (BPM, key, genre) and crowd state, asks Gemini to generate
a full musical composition as JSON. Tone.js in the browser then synthesizes it live.

The composition describes:
  - Exact drum patterns (16-step, per instrument)
  - Bass notes in the song's key
  - Pad chord matching the song's harmony
  - Lead melody in the song's key
  - Which layers are active at each energy level (1–10)
  - Effects per instrument (reverb, delay, filter)
"""

import os
import json
import re

_PROMPT = """You are an expert DJ and music producer. Your job is to compose a full live set
for Tone.js to synthesize in a browser — the way a real DJ would layer instruments at a club or rave.

SONG REFERENCE:
  Title:  {name}
  Artist: {artist}
  Genre:  {genre}
  Key:    {key}
  BPM:    {bpm}

CROWD STATE:
  Energy:      {energy}/10
  Mood:        {sentiment}
  Description: {description}

DJ KNOWLEDGE — Genre Instrument Patterns:
  EDM / House  → 4-on-the-floor kick every beat, snare on 2&4, 16th hi-hats, sawtooth bass, pad chords
  Trap         → 808 kick on 1&3, sparse snare on 2&4, rolling 32nd hi-hats, deep sub bass
  Hip-hop      → Boom-bap kick (1,3 + ghost 16ths), snare on 2&4, chopped bass
  Disco / Funk → 4-on-the-floor kick, snare 2&4, open hi-hat offbeats, funky 16th bass
  Trance       → Driving kick every beat, no snare on 1, punchy synth bass, euphoric pads
  Pop          → 4/4 kick, snare 2&4, 8th hi-hats, melodic bass follows chords
  Classic Rock → Heavy snare 2&4, moderate kick, power chords as pads, guitar-like lead
  Classical    → No drums (or very sparse), sustained chord pads, piano-like melody, heavy reverb
  Ambient      → No drums, evolving pad chords, sparse high notes, extreme reverb

ENERGY LAYERING RULES (more energy = more instruments, more density):
  1–2  → pad only — very sparse, dreamy
  3    → pad + bass — bass enters quietly
  4    → pad + bass + kick — beat starts
  5–6  → pad + bass + kick + snare — full beat
  7    → pad + bass + kick + snare + hihat_closed + lead — lead melody enters
  8    → same + hihat_open — groove intensifies
  9–10 → all instruments — maximum density and energy

DRUM PATTERN FORMAT: 16 steps per bar (each step = 1/16th note), 1=hit, 0=rest.
NOTES: Use scientific pitch notation (e.g. "F2", "Ab3", "C#4"). All notes MUST be in the song's key.

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "bpm": <number matching the song>,
  "key_root": "<root note, e.g. F or Ab>",
  "key_type": "<major or minor>",
  "instruments": {
    "kick": {
      "pattern": [<16 ints: 0 or 1>],
      "pitch": "<e.g. C1>",
      "pitch_decay": <0.05 to 0.15>,
      "volume_db": <-20 to -2>
    },
    "snare": {
      "pattern": [<16 ints>],
      "volume_db": <number>
    },
    "hihat_closed": {
      "pattern": [<16 ints>],
      "volume_db": <number>
    },
    "hihat_open": {
      "pattern": [<16 ints — only a few hits>],
      "volume_db": <number>
    },
    "bass": {
      "waveform": "<sawtooth|square|triangle>",
      "notes": [<4 notes in the key, e.g. "F2","Ab2","C3","Eb3">],
      "pattern": [<16 ints>],
      "volume_db": <number>,
      "filter_freq": <200 to 1200>
    },
    "pad": {
      "chord": [<3–4 notes forming the tonic chord, e.g. "F3","Ab3","C4">],
      "volume_db": <number>,
      "reverb_wet": <0.3 to 0.85>,
      "attack": <0.2 to 2.0>
    },
    "lead": {
      "waveform": "<square|sawtooth|triangle|sine>",
      "notes": [<4–8 melodic notes in the key>],
      "pattern": [<16 ints — sparse, musical>],
      "volume_db": <number>,
      "delay_time": "<4n|8n|16n>"
    }
  },
  "energy_layers": {
    "1":  ["pad"],
    "2":  ["pad"],
    "3":  ["pad", "bass"],
    "4":  ["pad", "bass", "kick"],
    "5":  ["pad", "bass", "kick", "snare"],
    "6":  ["pad", "bass", "kick", "snare"],
    "7":  ["pad", "bass", "kick", "snare", "hihat_closed", "lead"],
    "8":  ["pad", "bass", "kick", "snare", "hihat_closed", "hihat_open", "lead"],
    "9":  ["pad", "bass", "kick", "snare", "hihat_closed", "hihat_open", "lead"],
    "10": ["pad", "bass", "kick", "snare", "hihat_closed", "hihat_open", "lead"]
  }
}"""


def generate_composition(song: dict, energy: int, sentiment: str, description: str) -> dict:
    """
    Ask Gemini to compose a DJ set for the given song + crowd state.
    Falls back to a genre-appropriate hardcoded pattern if Gemini fails.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")

            prompt = _PROMPT.format(
                name=song["name"], artist=song["artist"],
                genre=song["genre"], key=song["key"], bpm=song["bpm"],
                energy=energy, sentiment=sentiment, description=description,
            )
            resp = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
            )
            text = re.sub(r"^```json\s*", "", resp.text.strip())
            text = re.sub(r"\s*```$", "", text)
            return json.loads(text)
        except Exception:
            pass  # fall through to hardcoded fallback

    return _fallback(song, sentiment)


def _fallback(song: dict, sentiment: str) -> dict:
    """Genre-appropriate fallback when Gemini is unavailable."""
    bpm = song.get("bpm", 128 if sentiment == "party" else 80)
    if sentiment == "party":
        return {
            "bpm": bpm,
            "key_root": "F", "key_type": "minor",
            "instruments": {
                "kick":         {"pattern": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], "pitch": "C1", "pitch_decay": 0.08, "volume_db": -6},
                "snare":        {"pattern": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], "volume_db": -8},
                "hihat_closed": {"pattern": [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], "volume_db": -14},
                "hihat_open":   {"pattern": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0], "volume_db": -12},
                "bass":         {"waveform": "sawtooth", "notes": ["F2","F2","C3","Eb3"], "pattern": [1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0], "volume_db": -10, "filter_freq": 800},
                "pad":          {"chord": ["F3","Ab3","C4","Eb4"], "volume_db": -18, "reverb_wet": 0.4, "attack": 0.5},
                "lead":         {"waveform": "square", "notes": ["F4","Eb4","C4","Ab3"], "pattern": [1,0,0,0,1,0,1,0,0,0,1,0,0,1,0,0], "volume_db": -14, "delay_time": "8n"},
            },
            "energy_layers": {
                "1":["pad"],"2":["pad"],"3":["pad","bass"],"4":["pad","bass","kick"],
                "5":["pad","bass","kick","snare"],"6":["pad","bass","kick","snare"],
                "7":["pad","bass","kick","snare","hihat_closed","lead"],
                "8":["pad","bass","kick","snare","hihat_closed","hihat_open","lead"],
                "9":["pad","bass","kick","snare","hihat_closed","hihat_open","lead"],
                "10":["pad","bass","kick","snare","hihat_closed","hihat_open","lead"],
            },
        }
    return {
        "bpm": bpm,
        "key_root": "C", "key_type": "major",
        "instruments": {
            "kick":         {"pattern": [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], "pitch": "C1", "pitch_decay": 0.12, "volume_db": -12},
            "snare":        {"pattern": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], "volume_db": -14},
            "hihat_closed": {"pattern": [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], "volume_db": -18},
            "hihat_open":   {"pattern": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "volume_db": -16},
            "bass":         {"waveform": "triangle", "notes": ["C2","G2","E2","A2"], "pattern": [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], "volume_db": -14, "filter_freq": 400},
            "pad":          {"chord": ["C4","E4","G4","B4"], "volume_db": -16, "reverb_wet": 0.7, "attack": 1.5},
            "lead":         {"waveform": "sine", "notes": ["C5","B4","G4","E4"], "pattern": [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0], "volume_db": -16, "delay_time": "4n"},
        },
        "energy_layers": {
            "1":["pad"],"2":["pad"],"3":["pad","bass"],"4":["pad","bass","kick"],
            "5":["pad","bass","kick","snare"],"6":["pad","bass","kick","snare"],
            "7":["pad","bass","kick","snare","hihat_closed","lead"],
            "8":["pad","bass","kick","snare","hihat_closed","hihat_open","lead"],
            "9":["pad","bass","kick","snare","hihat_closed","hihat_open","lead"],
            "10":["pad","bass","kick","snare","hihat_closed","hihat_open","lead"],
        },
    }
