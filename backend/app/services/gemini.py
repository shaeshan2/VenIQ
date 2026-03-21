"""
Gemini Vision Service

Single responsibility: send a webcam frame to Gemini Vision and return
{ mood, age_bracket, confidence }.

No facial data is written to disk — the base64 bytes are processed in memory only.

Valid moods:       "happy" | "sad" | "anxious" | "calm"
Valid age brackets: "young" (18-35) | "middle" (36-60) | "senior" (60+)
"""

import base64
import json
import os
from typing import Optional
from config import Config

VALID_MOODS = {"happy", "sad", "anxious", "calm"}
VALID_AGE_BRACKETS = {"young", "middle", "senior"}
DEFAULT_MOOD = Config.DEFAULT_MOOD
DEFAULT_AGE_BRACKET = Config.DEFAULT_AGE_BRACKET


def analyze_frame(
    image_b64: str,
    survey: Optional[dict] = None,
) -> dict:
    """
    Analyze a webcam frame with Gemini Vision.

    Args:
        image_b64: base64-encoded JPEG/PNG (never written to disk)
        survey:    optional dict with user self-report keys e.g.
                   { "stress": 3, "energy": 2 }  (scale 1–5)

    Returns:
        { "mood": str, "age_bracket": str, "confidence": float }
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return _fallback("GEMINI_API_KEY not set")

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        image_bytes = base64.b64decode(image_b64)

        survey_context = ""
        if survey:
            survey_context = (
                f"\nThe user also self-reported: stress={survey.get('stress', 'N/A')}/5, "
                f"energy={survey.get('energy', 'N/A')}/5. "
                "Factor this into your mood classification."
            )

        prompt = (
            "Analyze this person's face carefully."
            "\n1. Classify their emotional state as exactly one of: happy, sad, anxious, calm."
            "\n2. Estimate their age bracket as exactly one of: young (18-35), middle (36-60), senior (60+)."
            f"{survey_context}"
            '\nReply with JSON only, no markdown: {"mood": "<label>", "age_bracket": "<label>", "confidence": <0.0-1.0>}'
        )

        response = model.generate_content(
            [{"mime_type": "image/jpeg", "data": image_bytes}, prompt]
        )

        raw = response.text.strip().strip("```json").strip("```").strip()
        result = json.loads(raw)

        mood = result.get("mood", DEFAULT_MOOD).lower()
        age_bracket = result.get("age_bracket", DEFAULT_AGE_BRACKET).lower()
        confidence = float(result.get("confidence", 0.7))

        if mood not in VALID_MOODS:
            mood = DEFAULT_MOOD
        if age_bracket not in VALID_AGE_BRACKETS:
            age_bracket = DEFAULT_AGE_BRACKET

        return {"mood": mood, "age_bracket": age_bracket, "confidence": min(confidence, 1.0)}

    except Exception as e:
        return _fallback(str(e))


def _fallback(reason: str) -> dict:
    return {
        "mood": DEFAULT_MOOD,
        "age_bracket": DEFAULT_AGE_BRACKET,
        "confidence": 0.0,
        "fallback_reason": reason,
    }
