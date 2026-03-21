# Person 2 Frontend Module

Implements:
- Spotify preview player (`preview_url` 30s clip)
- DJ override panel (6 sentiment buttons)
- `POST /api/playback/override`
- `GET /api/playback/current` polling sync
- "Now Playing" with name, artist, source
- Crowd context display (latest analyzed sentiment + energy)

## Files

- `index.html` - standalone demo page
- `app.js` - app bootstrap and wiring
- `initPerson2UI.js` - one-call integration initializer for Person 1
- `playbackApi.js` - backend API client + polling helper
- `musicPlayer.js` - "Now Playing" UI + preview playback
- `djControls.js` - override sentiment buttons
- `transformMusic.js` - required deliverable adapter function

## Quick Run

1) Start backend:

```bash
cd backend
python run.py
```

2) Serve frontend static files from repo root:

```bash
python -m http.server 8080
```

3) Open:
- `http://localhost:8080/frontend/person2/index.html`

Optional custom API base:
- `http://localhost:8080/frontend/person2/index.html?playbackBaseUrl=http://localhost:5000/api/playback`

## Integration Notes (Person 1 + Person 2)

If Person 1 gets a new track from `POST /api/crowd/analyze` (`changed: true`), they can still use:
- backend route logic already updates playback state (`source: "auto"`)
- this module's polling (`GET /api/playback/current`) picks it up automatically

No direct coupling is required.

### Mount in Person 1 page

```js
import { initPerson2UI } from "/frontend/person2/initPerson2UI.js";

const mountEl = document.getElementById("dj-controls-root");
const person2 = await initPerson2UI(mountEl, {
  playbackBaseUrl: "http://localhost:5000/api/playback",
  pollIntervalMs: 3000,
});

// From Person 1 analyze loop result:
// const analyze = await fetch("/api/crowd/analyze", ...)
person2.syncFromAnalyzeResponse({
  changed: true,
  sentiment: "party",
  energy: 8,
  track: {
    name: "Track Name",
    artist: "Artist Name",
    uri: "spotify:track:...",
    preview_url: "https://p.scdn.co/mp3-preview/...",
    spotify_url: "https://open.spotify.com/track/...",
  },
});

// Optional cleanup if route/page unmounts
// person2.stop();
```

## Required Deliverable Function

```js
import { transformMusic } from "./transformMusic.js";

const modified = await transformMusic({ id: "input-audio" }, "party");
console.log(modified.modified_audio); // preview_url or spotify_url
```

Because this project selects tracks instead of DSP audio transformations, `modified_audio` is represented as a playable URL (prefer `preview_url`).
