# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crowd-Aware DJ System — a real-time venue assistant that watches a crowd through a webcam, uses Gemini Vision to describe the scene and score its energy, and automatically recommends the next Spotify track when the vibe shifts. A DJ interface shows the current recommendation and allows manual override.

This is not a music transformation tool — it selects existing Spotify tracks. No audio processing.

## User Flow

```
1. Browser webcam captures a frame every 10 seconds
2. Frontend sends frame → POST /api/crowd/analyze
3. Gemini Vision describes the crowd: energy score (1–10) + sentiment label
4. Backend compares new energy to previous:
     - delta < 2 and same sentiment → return { "changed": false }
     - delta >= 2 OR new sentiment → fetch Spotify recommendations → return new track
5. Frontend auto-queues the track; DJ can override via POST /api/playback/override
6. DJ sees: current track, crowd description, energy level
```

## Architecture

```
Browser webcam (every 10s)
    ↓  POST /api/crowd/analyze
Gemini Vision → { description, energy: 1–10, sentiment }
    ↓
Change Detection (energy delta >= 2 OR sentiment changed)
    ↓
Spotify Recommendations API → track list
    ↓
{ changed, energy, description, sentiment, track }
    ↓
Frontend DJ interface (separate repo)
```

**Core components:**

| Component | Location | Responsibility |
|---|---|---|
| Flask app factory | `app/__init__.py` | App init, CORS, blueprints |
| Crowd route | `app/routes/crowd.py` | POST /api/crowd/analyze — full pipeline |
| Playback route | `app/routes/playback.py` | GET /api/playback/current, POST /api/playback/override |
| Crowd service | `app/services/crowd.py` | Gemini Vision → scene description + energy + sentiment |
| Spotify service | `app/services/spotify.py` | Client credentials auth + recommendations |
| Schemas | `app/models/schemas.py` | Dataclasses for SceneResult, Track, CrowdAnalyzeResponse |

## Commands

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run dev server
cd backend && python run.py

# Set up environment
cd backend && cp .env.example .env  # fill in all three keys

# Run tests
cd backend && pytest tests/

# Run single test
cd backend && pytest tests/test_crowd.py -v
```

## Environment Variables

See `backend/.env.example`. All three are required:
- `GEMINI_API_KEY` — Gemini Vision crowd analysis
- `SPOTIFY_CLIENT_ID` — Spotify developer app (client credentials, no user OAuth)
- `SPOTIFY_CLIENT_SECRET` — Spotify developer app

Get Spotify keys at: https://developer.spotify.com/dashboard (free, create an app)

## API Contract

```
POST /api/crowd/analyze
  Body:    { "image_base64": "<base64 JPEG>" }
  No change: { "changed": false, "energy": 5, "description": "..." }
  Changed:   { "changed": true, "energy": 8, "description": "...", "sentiment": "party",
               "track": { "name": "...", "artist": "...", "uri": "spotify:track:...",
                          "preview_url": "...", "spotify_url": "..." } }

GET /api/playback/current
  Response:  { "track": {...} | null, "source": "auto" | "override" | null }

POST /api/playback/override
  Body (option A): { "track": { "name": "...", "uri": "...", ... } }
  Body (option B): { "sentiment": "party" }   ← fetches a fresh recommendation
  Response:  { "track": {...}, "source": "override" }
```

## Sentiment → Spotify Mapping

Two modes only (demo scope):

| Sentiment | Use case | Seed Genres | Energy | Tempo |
|---|---|---|---|---|
| `calm` | classrooms, studying, libraries | classical, ambient, study | 0.25 | 72 BPM |
| `party` | dance floors, events, celebrations | pop, dance, hip-hop | 0.85 | 128 BPM |

## Computer Vision Approach

**We analyze the crowd as a whole scene, not individual faces.**

Gemini Vision is the correct tool for this. It receives a single webcam frame and describes the entire room — crowd density, body language, lighting, activity level — and returns an energy score + sentiment. This is fundamentally different from face-by-face emotion detection.

### Why not the individual-face libraries

| Library | What it sees | Why it doesn't fit |
|---|---|---|
| DeepFace | One face at a time | Would need to detect every face, run emotion on each, then average — fragile, misses room context |
| FER | One face at a time | Same problem, also less actively maintained |
| MediaPipe | Facial landmarks per face | Fast but requires manual aggregation; no scene understanding |
| OpenCV + models | Individual faces | Good for real-time but no crowd-level context |
| **Gemini Vision** ✅ | **Entire scene** | Sees the whole room, reads body language, understands context (e.g. "students working quietly" vs "people dancing") |

### Why Gemini Vision is the right choice for crowds

- Sees the whole frame — density, movement, posture, lighting, venue type
- Understands *why* the energy is what it is (context-aware)
- Returns structured JSON: `{ description, energy: 1–10, sentiment }`
- One API call per frame — no per-face loop needed
- Already integrated — `app/services/crowd.py`

### Trade-off

Gemini requires an internet connection and has ~1–3s latency per frame. This is acceptable because frames are only captured every 10 seconds, not every frame of video.

## Key Constraints

- Never store webcam frames — process base64 in memory only, discard after Gemini responds
- Spotify uses **Client Credentials** (app-level) — no per-user login required
- Change detection threshold is configurable via `Config.ENERGY_CHANGE_THRESHOLD` (default: 2)
- Both energy delta AND sentiment change can trigger a new recommendation independently
- Crowd state (`_state`) and playback state (`_current`) are in-memory — reset on server restart
