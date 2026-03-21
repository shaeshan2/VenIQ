# Team Summary — 5 Hours Remaining

## What Are We Building?

A **DJ assistant** that watches a venue/crowd through a webcam, detects the vibe (energy + sentiment), and automatically recommends Spotify tracks to match the mood. The DJ can also manually override at any time.

```
Webcam frame (base64)
    ↓
Gemini Vision → { description, energy: 1–10, sentiment }
    ↓
Energy/sentiment shifted? ─── no ──→ { "changed": false } (keep playing)
    │
    yes
    ↓
Spotify API → recommended track → frontend plays it
```

## What's Built (Backend)

| File | Status | What It Does |
|---|---|---|
| `app/services/crowd.py` | **Done** | Sends frame to Gemini, returns `{ description, energy, sentiment }` |
| `app/services/spotify.py` | **Done** | Client Credentials auth + `/v1/recommendations` by sentiment |
| `app/routes/crowd.py` | **Done** | `POST /api/crowd/analyze` — main loop endpoint |
| `app/routes/playback.py` | **Done** | `GET /api/playback/current` + `POST /api/playback/override` |
| `app/__init__.py` | **Done** | Flask factory, CORS, blueprints registered |
| `config.py` | **Done** | Env vars loaded (Gemini key, Spotify creds, threshold) |
| `app/models/schemas.py` | **Done** | Dataclasses (SceneResult, Track, CrowdAnalyzeResponse) |

## API Endpoints (3 total)

### `POST /api/crowd/analyze`
The main loop — frontend calls this every few seconds with a webcam frame.
```json
// Request
{ "image_base64": "<base64 jpeg>" }

// Response (no change)
{ "changed": false, "energy": 5, "description": "Students studying quietly" }

// Response (vibe shifted)
{ "changed": true, "energy": 8, "sentiment": "party", "description": "...",
  "track": { "name": "...", "artist": "...", "uri": "spotify:track:...", "preview_url": "...", "spotify_url": "..." } }
```

### `GET /api/playback/current`
Returns what's currently queued.
```json
{ "track": { "name": "...", ... } | null, "source": "auto" | "override" | null }
```

### `POST /api/playback/override`
DJ manually picks a song or sentiment.
```json
// By track
{ "track": { "name": "...", "artist": "...", "uri": "..." } }

// By sentiment (fetches a fresh recommendation)
{ "sentiment": "party" }
```

## Sentiment Categories

| Sentiment | Genres | Energy | Example |
|---|---|---|---|
| `study` | classical, ambient | 0.25 | Library, quiet hall |
| `chill` | chill, indie | 0.40 | Coffee shop hangout |
| `calm` | classical, sleep | 0.20 | Empty lounge |
| `party` | pop, dance, hip-hop | 0.85 | Dance floor |
| `intense` | rock, electronic | 0.90 | Concert, sports |
| `romantic` | jazz, soul, r&b | 0.35 | Dim-lit dinner |

## Environment Variables Needed

```
GEMINI_API_KEY=...           # Google AI Studio → create key
SPOTIFY_CLIENT_ID=...        # Spotify Developer Dashboard
SPOTIFY_CLIENT_SECRET=...    # same dashboard
```

## Work Split — 5 Hours

### Person 1: Frontend — Webcam + Main Loop
- Capture webcam frame, encode as base64
- Call `POST /api/crowd/analyze` every 3–5 seconds
- Display: scene description, energy bar, current sentiment
- When `changed: true`, update the player with the new track
- **Big font, simple layout** — designed for a live demo

### Person 2: Frontend — Music Player + DJ Controls
- Build the Spotify player component (use `preview_url` for 30s clips, or Spotify embed)
- "Override" panel: 6 sentiment buttons (study/chill/calm/party/intense/romantic)
- Call `POST /api/playback/override` when DJ clicks a sentiment
- Show "Now Playing" with track name, artist, source (auto vs. override)
- Poll `GET /api/playback/current` to stay synced

### Person 3: Backend — Testing + Edge Cases + Demo Polish
- Write tests for all 3 endpoints (mock Gemini + Spotify)
- Handle edge cases: Gemini timeout, Spotify rate limit, empty results
- Add `GET /api/health` endpoint for quick status check
- Ensure fallback behavior works (no API keys → default "chill" sentiment)
- Add CORS preflight handling if frontend has issues

### Person 4: Integration + Demo Prep
- Set up all API keys (Gemini + Spotify) and verify end-to-end
- Test the full loop: webcam → analyze → track recommendation → playback
- Prepare demo script: show 2–3 different "crowd" scenarios
- Record backup video in case live demo fails
- Pitch: "What if the music in a room could feel the room?"

## Timeline

| Time | Milestone |
|---|---|
| Now → +1h | Frontend skeletons + backend tests passing |
| +1h → +3h | Webcam loop working end-to-end, player playing tracks |
| +3h → +4h | DJ override working, UI polish, error handling |
| +4h → +5h | Demo rehearsal, backup recording, pitch script |

## Quick Start

```bash
cd backend
cp .env.example .env        # fill in keys
pip install -r requirements.txt
python run.py                # runs on http://localhost:5001
```

## Person 1 Frontend Integration Rules (Required)

1) Use backend URL `http://localhost:5001`.
2) Poll every 3-5 seconds.
3) Prevent overlapping requests (skip poll tick if one request is in-flight).
4) Accept both payload shapes from `POST /api/crowd/analyze`:
   - `changed: false` -> keep current track, only update vibe UI (description/energy)
   - `changed: true` -> update player with `track` if present
5) If webcam returns data URL strings (e.g. `data:image/jpeg;base64,...`), backend now handles this format.
