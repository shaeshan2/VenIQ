"""
Crowd Scene Analysis Service — two-stage pipeline

Stage 1 (Gemini 2.5 Flash, vision):
  Input:  base64 JPEG webcam frame
  Output: plain-text description of what the people are doing

Stage 2 (rule-based keyword scorer, zero cost/latency):
  Input:  plain-text description
  Output: { sentiment: "calm"|"party", confidence: 0.0–1.0, energy: 1–10 }

Splitting the stages keeps vision costs low and makes sentiment logic
transparent, testable, and instant.
"""

import base64
import os

DEFAULT_SENTIMENT = "calm"
DEFAULT_ENERGY = 5

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
