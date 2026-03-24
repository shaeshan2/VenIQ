"""
Crowd Scene Analysis Service — two modes

Club mode (two-stage pipeline):
  Stage 1 (Groq llama-4 vision): frame → plain-text crowd description
  Stage 2 (keyword scorer): description → { sentiment, confidence, energy }

Lock In mode (single Groq call):
  Reads one person's body language and emotion, returns structured JSON
  including a coach_message tailored to their state.
"""

import json
import os
import random
import time


def _groq_generate(prompt: str, image_b64: str, retries: int = 2, backoff: float = 5.0) -> str:
    """
    Call Groq llama-4-scout vision with retry on rate limit.
    Returns the raw text response.
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")

    from groq import Groq
    client = Groq(api_key=api_key)

    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
                max_tokens=600,
                temperature=0.2,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            err = str(e)
            if attempt < retries - 1 and ("429" in err or "rate" in err.lower()):
                time.sleep(backoff)
                continue
            raise


def _parse_json(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    t = text.strip()
    if "```" in t:
        # Extract content between first { and last }
        start = t.find("{")
        end   = t.rfind("}") + 1
        if start != -1 and end > start:
            t = t[start:end]
    return json.loads(t)


DEFAULT_SENTIMENT = "calm"
DEFAULT_ENERGY    = 5

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
    "excited": [
        "That energy is electric — channel it!",
        "Excitement is fuel. Use it while it lasts.",
        "Ride this wave — make it count.",
        "High energy mode activated. Go.",
    ],
    "melancholic": [
        "It's okay to feel this way. Let the music carry you.",
        "Even slow days move you forward.",
        "Reflective moments build the deepest focus.",
        "Sit with the feeling — then let it go.",
    ],
    "anxious": [
        "Breathe. 4 counts in, 4 counts out. You've got this.",
        "One thing at a time. Just one.",
        "The music will help. Tune out the noise.",
        "You are capable of handling this.",
    ],
    "bored": [
        "Boredom is the start of momentum — pick something small and start.",
        "Even 10 focused minutes changes the day.",
        "Low motivation is normal. Start anyway.",
        "Put the music on and just begin.",
    ],
}


def _fallback_message(emotion: str) -> str:
    pool = _COACH_MESSAGES.get(emotion, _COACH_MESSAGES["focused"])
    return random.choice(pool)


# Signals for the keyword-based fallback scorer (used when API key missing)
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


def _mp_face_hint(mp: dict) -> str:
    """Format MediaPipe face features as a natural-language hint."""
    if not mp:
        return ""
    parts = []
    if mp.get("face_detected") is False:
        return "MediaPipe detected no face."
    eye = mp.get("eye_openness")
    if eye is not None:
        parts.append(f"eye openness {eye:.2f} ({'very low — possibly tired' if eye < 0.35 else 'normal'})")
    smile = mp.get("smile_score")
    if smile is not None:
        parts.append(f"smile score {smile:.2f} ({'smiling' if smile > 0.3 else 'neutral/not smiling'})")
    brow = mp.get("brow_furrow")
    if brow is not None:
        parts.append(f"brow furrow {brow:.2f} ({'furrowed — possibly stressed' if brow > 0.4 else 'relaxed'})")
    emotion = mp.get("suggested_emotion")
    if emotion:
        parts.append(f"suggested emotion from landmarks: {emotion}")
    return ("MediaPipe face data: " + ", ".join(parts) + ".") if parts else ""


def _mp_pose_hint(mp: dict) -> str:
    """Format MediaPipe pose features as a hint."""
    if not mp:
        return ""
    parts = []
    count = mp.get("person_count")
    if count is not None:
        parts.append(f"{count} person(s) detected")
    hands = mp.get("hands_raised")
    if hands:
        parts.append(f"{hands} hand(s) raised above shoulder level")
    mode = mp.get("suggested_mode")
    if mode:
        parts.append(f"scene type suggests: {mode}")
    return ("MediaPipe pose data: " + ", ".join(parts) + ".") if parts else ""


# ── Prompt templates ──────────────────────────────────────────────────────────

_AUTO_PROMPT = """\
Analyze this webcam frame. Count the number of people visible.{mp_line}

Focus ONLY on body language, movement, posture, and group energy as they relate to music. Do NOT comment on physical appearance, clothing, hair, or ethnicity.

Return ONLY a valid JSON object. Use one of these two schemas:

If 1-4 people (small group or individual):
{{"scene_type":"study","description":"1-2 sentences: posture and energy as a music listener",\
"emotion":"focused|happy|tired|stressed|excited|melancholic|anxious|bored","energy":5,"confidence":0.8,\
"vibe_tags":["focused","lo-fi","steady"],\
"coach_message":"1-2 sentence motivational or calming message"}}

If 5 or more people (large crowd):
{{"scene_type":"club","description":"1-2 sentences: group activity and musical atmosphere",\
"sentiment":"party|calm|focused|happy|excited","energy":5,"confidence":0.8,\
"vibe_tags":["energetic","danceable","euphoric"]}}

Emotion/sentiment guide:
  focused = working steadily, heads down — vibe_tags: focused, steady, lo-fi, deep work, study, minimal
  happy = smiling, animated, social — vibe_tags: joyful, upbeat, feel-good, bright, fun, positive
  tired = slumped, low energy, drooping — vibe_tags: calm, ambient, gentle, quiet, slow, soothing, meditative
  stressed = tense, fidgeting, furrowed brow — vibe_tags: calm, ambient, peaceful, tranquil, soothing, still
  excited = alert, wide-eyed, high energy, eager — vibe_tags: upbeat, energetic, bright, feel-good, anthemic
  melancholic = sad, reflective, staring away, low energy but thoughtful — vibe_tags: melancholic, introspective, emotional, atmospheric, gentle
  anxious = restless, tense but distracted, nervous energy — vibe_tags: peaceful, tranquil, calm, gentle, soothing
  bored = disengaged, blank stare, slumped but not tired — vibe_tags: upbeat, joyful, bright, fun, playful
  party = dancing, cheering — vibe_tags: energetic, dancing, euphoric, rave, hype, anthemic
  calm = seated, relaxed — vibe_tags: relaxed, mellow, warm, chill, moderate

vibe_tags: 3-6 words from: energetic, dancing, euphoric, festival, rave, hype, loud, anthemic, chill, hip-hop, smooth, cool, funky, groovy, feel-good, nostalgic, joyful, danceable, driving, indie, dramatic, epic, peaceful, classical, meditative, tranquil, gentle, still, quiet, melancholic, introspective, atmospheric, minimal, focused, lo-fi, study, deep work, steady, contemplative, upbeat, sunny, optimistic, warm, bright, playful, carefree, celebratory, festive

Energy: 1=very still/quiet, 10=dancing/cheering/highly energetic

Return only the JSON. No markdown."""

_INDIVIDUAL_PROMPT = """\
Analyze the person in this image. Focus on body language, posture, and energy level as indicators of their study or work state. Do NOT comment on physical appearance, clothing, hair, or ethnicity.{mp_line}

Return ONLY a valid JSON object:
{{"description":"1-2 sentences: posture and energy as they relate to focus and music mood",\
"emotion":"focused|happy|tired|stressed","energy":5,"confidence":0.8,\
"vibe_tags":["focused","lo-fi","study"],\
"coach_message":"1-2 sentences motivating or calming them"}}

Emotion guide:
  focused = upright, engaged, steady work — vibe_tags: focused, steady, lo-fi, deep work, study, minimal
  happy = smiling, animated, positive energy — vibe_tags: joyful, upbeat, feel-good, bright, fun, sunny
  tired = slumped, head drooping, yawning — vibe_tags: calm, ambient, gentle, quiet, soothing, meditative
  stressed = tense, fidgeting, furrowed brow — vibe_tags: peaceful, tranquil, calm, still, soothing
  excited = bright-eyed, energetic, leaning in — vibe_tags: upbeat, energetic, bright, anthemic, feel-good
  melancholic = distant gaze, low energy, reflective — vibe_tags: melancholic, introspective, atmospheric, emotional
  anxious = restless movement, can't settle, nervous — vibe_tags: peaceful, tranquil, calm, gentle, soothing
  bored = blank stare, low engagement, not tired — vibe_tags: upbeat, joyful, playful, bright, fun
Coach guide: focused=affirm the flow, happy=celebrate, tired=suggest break, stressed=breathe+one step, excited=channel it, melancholic=validate feeling, anxious=ground them, bored=spark momentum

Return only the JSON. No markdown."""

_SCENE_PROMPT = """\
Describe what the people in this image are doing in 1-2 sentences.{mp_line}
Focus on their body language, movement, and energy level.
Be specific: are they sitting or standing? Are any hands raised?
Are people talking, laughing, cheering, or quietly working?
Do NOT comment on physical appearance, clothing, or ethnicity.
Reply with plain text only — no JSON, no labels."""


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_auto(image_b64: str, mediapipe: dict | None = None) -> dict:
    """
    Auto mode: single Groq call that detects scene type (1 person vs group)
    and returns the appropriate analysis fields.

    Returns all standard fields plus:
        "detected_mode": "study" | "club"
    """
    mp      = mediapipe or {}
    mp_hint = _mp_pose_hint(mp) or _mp_face_hint(mp)
    mp_line = f"\n\nAdditional sensor data from the browser: {mp_hint}" if mp_hint else ""

    prompt = _AUTO_PROMPT.format(mp_line=mp_line)

    try:
        text = _groq_generate(prompt, image_b64)
        data = _parse_json(text)
    except Exception as e:
        # Groq unavailable — fall back to keyword pipeline
        result = describe_crowd(image_b64, mediapipe)
        result["detected_mode"] = "club"
        result["coach_message"] = None
        return result

    scene_type = data.get("scene_type", "club")
    vibe_tags  = data.get("vibe_tags") or []

    if scene_type == "study":
        emotion = data.get("emotion", "focused")
        return {
            "description":   data.get("description", ""),
            "energy":        int(data.get("energy", 5)),
            "sentiment":     emotion,
            "confidence":    float(data.get("confidence", 0.7)),
            "coach_message": data.get("coach_message") or _fallback_message(emotion),
            "detected_mode": "study",
            "vibe_tags":     vibe_tags,
        }
    else:
        return {
            "description":   data.get("description", ""),
            "energy":        int(data.get("energy", 5)),
            "sentiment":     data.get("sentiment", "calm"),
            "confidence":    float(data.get("confidence", 0.7)),
            "coach_message": None,
            "detected_mode": "club",
            "vibe_tags":     vibe_tags,
        }


def describe_individual(image_b64: str, mediapipe: dict | None = None) -> dict:
    """
    Lock In mode: analyze a single person's emotional/focus state.

    Returns:
        {
            "description":   "Person is hunched over, rubbing their eyes...",
            "energy":        3,
            "sentiment":     "tired",       # focused | happy | tired | stressed
            "confidence":    0.85,
            "coach_message": "Stand up, take 5 deep breaths, then come back stronger.",
            "vibe_tags":     ["calm", "ambient", "gentle"],
        }
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return {
            "description":   "Analysis unavailable: GROQ_API_KEY not set",
            "energy":        5,
            "sentiment":     "focused",
            "confidence":    0.5,
            "coach_message": _fallback_message("focused"),
            "vibe_tags":     [],
        }

    mp      = mediapipe or {}
    mp_hint = _mp_face_hint(mp)
    mp_line = f"\n\nAdditional sensor data from MediaPipe face mesh: {mp_hint}" if mp_hint else ""

    prompt = _INDIVIDUAL_PROMPT.format(mp_line=mp_line)

    try:
        text = _groq_generate(prompt, image_b64)
        data = _parse_json(text)
        emotion = data.get("emotion", "focused")
        return {
            "description":   data.get("description", ""),
            "energy":        int(data.get("energy", 5)),
            "sentiment":     emotion,
            "confidence":    float(data.get("confidence", 0.7)),
            "coach_message": data.get("coach_message") or _fallback_message(emotion),
            "vibe_tags":     data.get("vibe_tags") or [],
        }
    except Exception as e:
        return {
            "description":   f"Analysis error: {e}",
            "energy":        5,
            "sentiment":     "focused",
            "confidence":    0.5,
            "coach_message": _fallback_message("focused"),
            "vibe_tags":     [],
        }


def describe_crowd(image_b64: str, mediapipe: dict | None = None) -> dict:
    """
    Fallback pipeline (no API key): webcam frame → description → keyword scoring.

    Returns:
        {
            "description": "Several people are sitting quietly...",
            "energy":      3,
            "sentiment":   "calm",
            "confidence":  0.82,
            "vibe_tags":   [],
        }
    """
    description = _describe_scene(image_b64, mediapipe or {})
    sentiment, confidence = _extract_sentiment(description)
    energy = _estimate_energy(description, sentiment)

    mp = mediapipe or {}
    if mp.get("hands_raised", 0) > 0:
        energy = min(10, energy + 1)

    return {
        "description": description,
        "energy":      energy,
        "sentiment":   sentiment,
        "confidence":  confidence,
        "coach_message": None,
        "vibe_tags":   [],
    }


# ── Fallback: keyword-based scene description + scoring ───────────────────────

def _describe_scene(image_b64: str, mediapipe: dict | None = None) -> str:
    mp      = mediapipe or {}
    mp_hint = _mp_pose_hint(mp)
    mp_line = f" Additional sensor data: {mp_hint}" if mp_hint else ""
    prompt  = _SCENE_PROMPT.format(mp_line=mp_line)

    try:
        return _groq_generate(prompt, image_b64)
    except Exception as e:
        return f"Scene analysis unavailable: {e}"


def _extract_sentiment(description: str) -> tuple[str, float]:
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
    text = description.lower()
    party_hits = sum(1 for kw in _PARTY_SIGNALS if kw in text)

    if sentiment == "party":
        return min(10, 6 + party_hits)
    else:
        calm_hits = sum(1 for kw in _CALM_SIGNALS if kw in text)
        return max(1, 5 - calm_hits)
