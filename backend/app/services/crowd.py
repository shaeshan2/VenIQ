"""
Crowd Scene Analysis Service — two modes

Club mode (two-stage pipeline):
  Stage 1 (Gemini 2.5 Flash, vision): frame → plain-text crowd description
  Stage 2 (keyword scorer): description → { sentiment, confidence, energy }

Lock In mode (single Gemini call):
  Gemini reads one person's body language and emotion, returns structured JSON
  including a coach_message tailored to their state.
"""

import base64
import json
import os
import random

DEFAULT_SENTIMENT = "calm"
DEFAULT_ENERGY = 5

# ── Lock In mode: fallback coach messages per emotion ─────────────────────────

_COACH_MESSAGES: dict[str, list[str]] = {
    "focused": [
        "You're in the zone. Keep that energy.",
        "Locked in. Keep building.",
        "Flow state achieved — don't break it.",
        "This is what growth looks like.",
        "Every minute you stay focused is an investment in yourself.",
    ],
    "happy": [
        "Great energy! Ride this wave.",
        "That positive energy is your superpower today.",
        "Good vibes and good work — perfect combo.",
        "You're crushing it. Stay in this headspace.",
        "High spirits, high output. Keep going!",
    ],
    "tired": [
        "Almost there. A quick stretch can reset your focus.",
        "Stand up, take 5 deep breaths, then come back stronger.",
        "Tired is temporary. Done is forever.",
        "Your future self will thank you for this extra push.",
        "Even a 2-minute walk can recharge your brain.",
    ],
    "stressed": [
        "Take a deep breath. You've solved hard problems before.",
        "Pause for 30 seconds. Close your eyes. You've got this.",
        "Break it into the smallest possible task and do just that one thing.",
        "It's okay to feel overwhelmed. One step at a time.",
        "Progress over perfection. You're doing better than you think.",
    ],
}


def _fallback_message(emotion: str) -> str:
    pool = _COACH_MESSAGES.get(emotion, _COACH_MESSAGES["focused"])
    return random.choice(pool)

# Signals that indicate high crowd energy / party behaviour
_PARTY_SIGNALS = [
    "standing", "stand up", "stood up", "on their feet",
    "raising hand", "raised hand", "hands up", "hand in the air",
    "cheering", "cheer", "waving", "wave",
    "clapping", "clap", "applaud",
    "dancing", "dance",
    "jumping", "jump",
    "shouting", "yelling",
    "laughing loudly", "excited", "excitement",
    "energetic", "high energy", "lively", "animated",
    "celebrating", "celebration",
    "enthusiastic", "rowdy", "pumped",
    "smiling broadly", "big smiles",
]

# Signals that indicate low crowd energy / calm behaviour
_CALM_SIGNALS = [
    "sitting", "seated", "sitting down",
    "heads down", "head down", "looking down",
    "working", "studying", "writing", "typing", "reading",
    "quiet", "silence", "silent",
    "focused", "concentrating", "attentive",
    "still", "stationary", "not moving",
    "calm", "relaxed", "subdued", "low energy",
    "listening quietly", "passive",
]


def describe_individual(image_b64: str) -> dict:
    """
    Lock In mode: analyze a single person's emotional/focus state via Gemini.

    Returns:
        {
            "description":   "Person is hunched over, rubbing their eyes...",
            "energy":        3,
            "sentiment":     "tired",       # focused | happy | tired | stressed
            "confidence":    0.85,
            "coach_message": "Stand up, take 5 deep breaths, then come back stronger."
        }
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return {
            "description":   "Analysis unavailable: GEMINI_API_KEY not set",
            "energy":        5,
            "sentiment":     "focused",
            "confidence":    0.5,
            "coach_message": _fallback_message("focused"),
        }

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        image_bytes = base64.b64decode(image_b64)

        prompt = """Analyze the person in this image who appears to be studying or working.
Return ONLY a valid JSON object with these exact fields:
{
  "description": "1-2 sentences: posture, facial expression, body language",
  "emotion": "focused" | "happy" | "tired" | "stressed",
  "energy": <integer 1-10>,
  "confidence": <float 0.0-1.0>,
  "coach_message": "1-2 sentences motivating or calming them based on their state"
}

Emotion guide:
- focused: working steadily, neutral or attentive expression, upright posture
- happy: smiling, relaxed, positive expression, engaged with work
- tired: slumped, drooping eyes, resting head, yawning, low energy
- stressed: tense posture, furrowed brow, fidgeting, appears overwhelmed

Coach message guide:
- focused: affirm and encourage them to keep going
- happy: celebrate the positive energy, keep momentum
- tired: gentle encouragement, suggest a quick stretch or breath
- stressed: calming, reassuring — break the task into one small step

Return only the JSON. No markdown, no explanation."""

        response = model.generate_content(
            [{"mime_type": "image/jpeg", "data": image_bytes}, prompt]
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text[text.index("{"):]
            text = text[:text.rindex("}") + 1]

        data = json.loads(text)
        emotion = data.get("emotion", "focused")

        return {
            "description":   data.get("description", ""),
            "energy":        int(data.get("energy", 5)),
            "sentiment":     emotion,
            "confidence":    float(data.get("confidence", 0.7)),
            "coach_message": data.get("coach_message") or _fallback_message(emotion),
        }

    except Exception as e:
        return {
            "description":   f"Analysis error: {e}",
            "energy":        5,
            "sentiment":     "focused",
            "confidence":    0.5,
            "coach_message": _fallback_message("focused"),
        }


def describe_crowd(image_b64: str) -> dict:
    """
    Full pipeline: webcam frame → description → sentiment + confidence.

    Returns:
        {
            "description": "Several people are sitting quietly...",
            "energy":      3,
            "sentiment":   "calm",
            "confidence":  0.82      # 0.0–1.0
        }
    """
    description = _describe_scene(image_b64)
    sentiment, confidence = _extract_sentiment(description)
    energy = _estimate_energy(description, sentiment)

    return {
        "description": description,
        "energy": energy,
        "sentiment": sentiment,
        "confidence": confidence,
    }


# ── Stage 1: Gemini Vision ────────────────────────────────────────────────────

def _describe_scene(image_b64: str) -> str:
    """
    Ask Gemini to describe what the people in the frame are doing.
    Returns plain text — no sentiment classification here.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return "Scene analysis unavailable: GEMINI_API_KEY not set"

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        image_bytes = base64.b64decode(image_b64)

        prompt = (
            "Describe what the people in this image are doing in 1-2 sentences. "
            "Focus on their body language, movement, and energy level. "
            "Be specific: are they sitting or standing? Are any hands raised? "
            "Are people talking, laughing, cheering, or quietly working? "
            "Reply with plain text only — no JSON, no labels."
        )

        response = model.generate_content(
            [{"mime_type": "image/jpeg", "data": image_bytes}, prompt]
        )
        return response.text.strip()

    except Exception as e:
        return f"Scene analysis unavailable: {e}"


# ── Stage 2: Keyword-based sentiment scorer ───────────────────────────────────

def _extract_sentiment(description: str) -> tuple[str, float]:
    """
    Score the description against party/calm keyword lists.
    Returns (sentiment, confidence) where confidence is 0.0–1.0.
    """
    text = description.lower()

    party_hits = sum(1 for kw in _PARTY_SIGNALS if kw in text)
    calm_hits  = sum(1 for kw in _CALM_SIGNALS  if kw in text)
    total = party_hits + calm_hits

    if total == 0:
        return DEFAULT_SENTIMENT, 0.5

    party_ratio = party_hits / total

    if party_ratio >= 0.5:
        return "party", round(party_ratio, 2)
    else:
        return "calm", round(1 - party_ratio, 2)


def _estimate_energy(description: str, sentiment: str) -> int:
    """
    Estimate energy 1–10 from keyword density in the description.
    Party sentiment starts at 6, calm at 1.
    """
    text = description.lower()
    party_hits = sum(1 for kw in _PARTY_SIGNALS if kw in text)

    if sentiment == "party":
        return min(10, 6 + party_hits)
    else:
        calm_hits = sum(1 for kw in _CALM_SIGNALS if kw in text)
        return max(1, 5 - calm_hits)
