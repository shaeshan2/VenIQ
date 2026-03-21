"""
Crowd Scene Analysis Service

Gemini-specific integration is isolated in this file so debugging, prompt updates,
and model swaps can happen in one place without touching route logic.
"""

import base64
import json
import os
from typing import Any

VALID_SENTIMENTS = {"study", "chill", "calm", "party", "intense", "romantic"}
DEFAULT_SENTIMENT = "chill"
DEFAULT_ENERGY = 4
GEMINI_MODEL_NAME = "gemini-1.5-flash"


def analyze_crowd_frame(image_base64: str) -> dict:
    """
    Gemini-facing adapter for scene-level crowd vibe analysis.

    Args:
        image_base64: base64-encoded webcam frame (JPEG bytes). Processed in-memory
                      only and never written to disk.

    Returns:
        {
            "description": str,
            "energy": int (1-10),
            "sentiment": str (allowed label),
            "analysis_source": "gemini" | "fallback",
            "fallback_reason": str (only when fallback used)
        }
    """
    # API key is expected from environment (.env via config loader).
    # If missing, we return a deterministic fallback to keep demo reliability.
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return _fallback("GEMINI_API_KEY not set")

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)

        image_bytes = base64.b64decode(image_base64, validate=True)

        prompt = (
            "You are analyzing a video frame from a venue or event space to help a DJ pick the right music.\n"
            "Analyze the overall room/crowd vibe only.\n"
            "Do NOT identify people, infer identity, or describe personal attributes.\n"
            "Describe the scene and determine the appropriate music sentiment.\n\n"
            "Reply with JSON only, no markdown:\n"
            '{"description": "<1-2 sentence description of venue and crowd>", '
            '"energy": <integer 1-10>, '
            '"sentiment": "<one of: study, chill, calm, party, intense, romantic>"}\n\n'
            "Guidelines:\n"
            "- energy 1-3: quiet, still, focused (libraries, empty rooms, study halls)\n"
            "- energy 4-6: moderate activity, conversation, casual gatherings\n"
            "- energy 7-10: high activity, dancing, cheering, crowded events\n"
            "- sentiment 'study': quiet focus, academic setting\n"
            "- sentiment 'chill': relaxed social atmosphere\n"
            "- sentiment 'calm': peaceful, low-key environment\n"
            "- sentiment 'party': dancing, celebration, nightlife\n"
            "- sentiment 'intense': high-energy concerts, sports, competitive events\n"
            "- sentiment 'romantic': intimate, dim lighting, couples"
        )

        response = model.generate_content(
            [{"mime_type": "image/jpeg", "data": image_bytes}, prompt]
        )

        raw = getattr(response, "text", "") or ""
        parsed = _extract_json_object(raw)
        result = _normalize_scene(parsed)

        result["analysis_source"] = "gemini"
        return result

    except Exception as e:
        return _fallback(str(e))


def describe_crowd(image_b64: str) -> dict:
    """
    Backward-compatible alias used by existing routes.
    """
    return analyze_crowd_frame(image_b64)


def _fallback(reason: str) -> dict:
    return {
        "description": "Scene appears relaxed with moderate-low activity.",
        "energy": DEFAULT_ENERGY,
        "sentiment": DEFAULT_SENTIMENT,
        "analysis_source": "fallback",
        "fallback_reason": reason,
    }


def _extract_json_object(raw_text: str) -> dict[str, Any]:
    """Extract and parse the first JSON object from a model response."""
    text = raw_text.strip()
    if not text:
        raise ValueError("Gemini returned empty response")

    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in Gemini response")

    candidate = text[start : end + 1]
    data = json.loads(candidate)
    if not isinstance(data, dict):
        raise ValueError("Gemini response JSON must be an object")
    return data


def _normalize_scene(scene: dict[str, Any]) -> dict:
    """Return a validated scene result matching the API contract."""
    description = str(scene.get("description", "")).strip()
    if not description:
        description = "Crowd scene analyzed."

    try:
        energy = int(scene.get("energy", DEFAULT_ENERGY))
    except (TypeError, ValueError):
        energy = DEFAULT_ENERGY
    energy = max(1, min(10, energy))

    sentiment = str(scene.get("sentiment", DEFAULT_SENTIMENT)).strip().lower()
    if sentiment not in VALID_SENTIMENTS:
        sentiment = DEFAULT_SENTIMENT

    return {"description": description, "energy": energy, "sentiment": sentiment}
