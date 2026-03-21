# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adaptive Music Personalization System — an AI-powered backend that analyzes a user's mood and age from their webcam (plus an optional survey), then transforms music they choose (YouTube link or MP3 upload) across four dimensions: BPM, key, instrumentation, and overall flow. Output is a personalized playlist of the user's own songs, reshaped to match their emotional and demographic profile. Frontend is developed separately.

## User Flow

```
1. User opens app → webcam activates
2. Gemini Vision analyzes face → mood + estimated age bracket
3. Optional: user completes a short survey (refines mood/preference)
4. User submits music: YouTube URL (primary) or MP3 upload (fallback)
5. Backend downloads audio, applies transformations
6. Transformed track(s) returned as a playable playlist
```

## Architecture

```
Webcam frame + optional survey
    ↓
Gemini Vision API  →  { mood, age_bracket, confidence }
    ↓
Backend API (Flask)
    ├── /api/analyze   — runs Gemini, returns mood + age
    ├── /api/ingest    — accepts YouTube URL or MP3 upload, returns track_id
    ├── /api/transform — applies transformations, returns playlist
    └── /api/stream/<session_id> — streams transformed audio
    ↓
Music Transform Service
    →  BPM shift · key shift · instrumentation swap · flow adjustment
    ↓
Frontend playlist (separate repo)
```

**Core components:**

| Component | Location | Responsibility |
|---|---|---|
| Flask app factory | `app/__init__.py` | App init, CORS, blueprints |
| Analyze route | `app/routes/analyze.py` | POST /api/analyze — Gemini Vision → mood + age |
| Ingest route | `app/routes/ingest.py` | POST /api/ingest — YouTube download or MP3 upload |
| Transform route | `app/routes/music.py` | POST /api/transform, GET /api/stream |
| Gemini service | `app/services/gemini.py` | Webcam frame → mood + age via Gemini Vision |
| Music transform | `app/services/music_transform.py` | librosa/pydub — BPM, key, instruments, flow |
| YouTube ingestion | `app/services/ingest.py` | yt-dlp download + ffmpeg conversion to WAV |
| Schemas | `app/models/schemas.py` | Request/response dataclasses |

## Commands

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run dev server
cd backend && python run.py

# Set up environment variables
cd backend && cp .env.example .env  # fill in GEMINI_API_KEY

# Run tests
cd backend && pytest tests/

# Run single test file
cd backend && pytest tests/test_analyze.py -v
```

## Environment Variables

See `backend/.env.example`. Required:
- `GEMINI_API_KEY` — used for both mood detection and age estimation
- `FLASK_ENV` — `development` or `production`

## Transformation Parameters

All four dimensions are applied together based on the combined mood + age profile.

### Mood axis

| Mood | BPM | Key | Instrumentation | Flow |
|---|---|---|---|---|
| `sad` | -20% | shift down 1–2 semitones | piano, soft strings | slower attack, long decay |
| `anxious` | -15% | minor → more stable (e.g. shift +2) | ambient pad, steady pulse | even rhythm, reduce complexity |
| `happy` | +10% | shift up 1 semitone | brighter tones, lighter texture | upbeat phrasing |
| `calm` | no change | no change | minimal | no change |

### Age axis (layered on top of mood)

| Age Bracket | BPM adjustment | Additional notes |
|---|---|---|
| `young` (18–35) | +5% on top of mood | more dynamic range allowed |
| `middle` (36–60) | no additional change | baseline mood mapping |
| `senior` (60+) | -10% on top of mood | warmer instruments, reduced complexity |

Fallback: if Gemini analysis fails → `mood = "calm"`, `age_bracket = "middle"`.

## API Contract

```
POST /api/analyze
  Body: { "image_base64": "...", "survey": { "stress": 3, "energy": 2 } }
  Response: { "mood": "calm", "age_bracket": "senior", "confidence": 0.87 }

POST /api/ingest
  Body: { "youtube_url": "https://youtube.com/watch?v=..." }
  OR multipart form: file=<mp3>
  Response: { "track_id": "<uuid>", "title": "Song Title", "duration_s": 210 }

POST /api/transform
  Body: { "track_ids": ["<uuid>"], "mood": "sad", "age_bracket": "senior" }
  Response: { "playlist": [{ "session_id": "<uuid>", "audio_url": "/api/stream/<uuid>", "title": "..." }] }

GET /api/stream/<session_id>
  Response: audio/mpeg stream
```

## Key Constraints

- Never store facial image data — process the webcam frame in memory only, discard immediately after Gemini responds
- YouTube audio download must strip video; store only the audio WAV in `audio/ingested/`
- End-to-end latency target: < 5 seconds per track (transformation is the bottleneck)
- If transformation fails for a track, return the original unmodified audio with a warning flag
- Always inform the user what the system detected (mood, age bracket) — frontend displays this
