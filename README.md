# [VenIQ](https://veniq.vercel.app/)

**Crowd-aware music that adapts in real time.** A webcam watches the room; Gemini reads the scene; the right track plays. Built at MacHacks 2026.

[![MacHacks 2026](https://img.shields.io/badge/MacHacks-2026-7c3aed?style=flat-square)](https://devpost.com/software/veniq)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-lightgrey?style=flat-square&logo=flask)](https://flask.palletsprojects.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini)

---

Live Demo: https://veniq.vercel.app/ 

---

## Screenshots

![VenIQ landing](./docs/landing.jpg)
![VenIQ editor](./docs/editor1.jpg)
![VenIQ editor](./docs/editor2.jpg)

---

## How it works

Two layers run simultaneously — one fast and local, one slow and smart.

```
Browser webcam
  │
  ├─► MediaPipe (~60fps, client-side)
  │     FaceLandmarker  → 478 landmarks → blink rate, smile, brow furrow
  │     PoseLandmarker  → 33 keypoints × 6 people → hands raised, crowd count
  │     → packed into a natural-language context string
  │
  └─► POST /api/crowd/analyze  (every 3s)
        │
        Gemini 2.5 Flash  ←  JPEG frame + MediaPipe context
        → { sentiment, energy: 1–10, description }
        │
        Changed?  |ΔE| ≥ 3  or  sentiment flip
        ├── No  → hold
        └── Yes → curated 30-track DB → Deezer preview → Tone.js crossfade
```

**Change detection** uses a threshold + 30-second cooldown so jitter doesn't kill the queue. **Tone.js** runs two Player nodes through independent Filter and Volume chains; crossfades are a randomly selected lowpass sweep, highpass sweep, or straight cut; both volume nodes ramp simultaneously without bleed.

The DJ always has a manual override (`POST /api/playback/override`).

---

## Quick start

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set GEMINI_API_KEY
python run.py          # → http://localhost:5000
```

**Frontend**
```bash
cd machacks-main
npm install
npm run dev            # → http://localhost:3000
```

The live editor is at `/editor`. Tests: `cd backend && pytest tests/ -v`.

---

## Environment

| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Scene analysis via Gemini 2.5 Flash |
| `YOUTUBE_API_KEY` | No | Optional integrations |

Deezer track search uses the public API — no key needed.

---

## Repo layout

```
backend/
  app/services/crowd.py       Gemini vision → energy + sentiment
  app/services/songs_db.py    30-track curated catalog
  app/services/deezer.py      preview clips + album art via Deezer public API
  app/routes/crowd.py         POST /api/crowd/analyze  (main pipeline)
  app/routes/playback.py      GET/POST /api/playback/*

machacks-main/
  src/app/editor/             live DJ interface
  src/lib/mediapipe-analyzer  client-side vision (FaceLandmarker + PoseLandmarker)
  src/lib/api.ts              typed backend client
```

---

## Stack

| | |
|---|---|
| Local vision | MediaPipe Tasks — FaceLandmarker (478pts), PoseLandmarker (33pts × 6 people) |
| Cloud vision | Google Gemini 2.5 Flash |
| Audio | Tone.js (crossfading), Deezer Public API (previews + metadata) |
| Frontend | Next.js 16, React 19, Tailwind CSS, Framer Motion, TypeScript |
| Backend | Python, Flask 3, pytest |

---

## Team

Built at **MacHacks 2026** by [Shaeshan Kunalan](https://github.com/shaeshan2), [Marco Dava](https://github.com/MarcoDava), and [Midulan Mathinathan](https://github.com/midulan).

Check out the Devpost [here](https://devpost.com/software/veniq)
