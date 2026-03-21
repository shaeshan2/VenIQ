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

