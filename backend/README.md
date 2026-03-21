# Backend Crowd Mood Detection API

This module provides scene-level crowd vibe analysis for the DJ assistant.
It analyzes the room/crowd atmosphere from a webcam frame and does **not** identify people.

## Endpoint

`POST /api/crowd/analyze`

## Request

Content-Type: `application/json`

```json
{
  "image_base64": "<base64-encoded JPEG frame>"
}
```

### Image/Base64 assumptions
- `image_base64` must be a non-empty string.
- Payload should be a base64-encoded JPEG frame.
- Frame is processed in memory only (not persisted to disk).

## Response

### When vibe has not changed meaningfully

```json
{
  "changed": false,
  "energy": 5,
  "description": "Students studying quietly in a lounge."
}
```

### When vibe changed

```json
{
  "changed": true,
  "energy": 8,
  "sentiment": "party",
  "description": "Crowd is active and dancing near the stage.",
  "track": {
    "name": "Example Track",
    "artist": "Example Artist",
    "uri": "spotify:track:123",
    "preview_url": "https://...",
    "spotify_url": "https://open.spotify.com/track/123"
  }
}
```

If Spotify is unavailable, response still returns crowd analysis with:
- `"track": null`

## Allowed sentiment values

- `study`
- `chill`
- `calm`
- `party`
- `intense`
- `romantic`

## Energy scale

- `1-3`: quiet / low activity
- `4-6`: moderate activity
- `7-10`: high activity / energetic crowd

Energy is always normalized to an integer between 1 and 10.

## Fallback behavior

If Gemini is unavailable, times out, or returns invalid output, backend returns safe normalized fallback crowd analysis:

```json
{
  "description": "Moderately relaxed room",
  "energy": 4,
  "sentiment": "chill"
}
```

Fallback is designed for graceful demo behavior (avoid frontend breakage).

## Environment variables

- `GEMINI_API_KEY` (required for live Gemini crowd analysis)
- `FLASK_ENV` (recommended: `development` or `production`)
- `PORT` (optional, defaults to `5001`)

## Real Webcam Verification (Gemini path)

Use this when you want to verify real computer vision, not fallback mode.

1) Start backend:

```bash
cd backend
source .venv/bin/activate
python run.py
```

2) In another terminal, run webcam test script:

```bash
cd backend
source .venv/bin/activate
python scripts/test_webcam_crowd.py --url "http://127.0.0.1:5001/api/crowd/analyze"
```

If response includes `"analysis_source": "fallback"`, Gemini path did not run successfully.

## Frontend Polling Contract (Person 1)

- Call `POST /api/crowd/analyze` every `3000-5000ms`
- Do not run overlapping requests
- Handle both response shapes:
  - `changed: false` -> keep current track, update vibe display only
  - `changed: true` -> update track/player if `track` exists

Example polling logic:

```javascript
let inFlight = false;

async function pollCrowd(analyzeUrl, imageBase64, onVibe, onTrack) {
  if (inFlight) return;
  inFlight = true;
  try {
    const res = await fetch(analyzeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64 }), // raw base64 or data URL both accepted
    });
    const data = await res.json();

    // Always update vibe UI from current response.
    onVibe({ energy: data.energy, description: data.description, sentiment: data.sentiment ?? null });

    if (data.changed && data.track) {
      onTrack(data.track);
    }
  } finally {
    inFlight = false;
  }
}
```

