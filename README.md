# VenIQ

**The room becomes the DJ’s co-pilot.** VenIQ watches the crowd through the browser camera, understands what the *space* feels like—not individual faces—and when the energy or mood meaningfully shifts, it proposes music that actually fits. You stay in control: the system suggests; you decide.

Built for **MacHacks** as a full-stack experiment in **ambient intelligence** for live settings: classrooms that flip into parties, lounges that tighten up, or any venue where the vibe is the product.

---

## Why this isn’t “just another mood app”

Most “emotion AI” products chase faces one by one, average scores, and hope for the best. That breaks in real rooms: bad angles, backs turned, lighting, and context (exam week vs. Friday night) all get lost.

**VenIQ takes a different stance:**

1. **Scene-first vision** — We send a single frame to **Gemini** and ask for a *plain-language* description of what people are doing together. No per-face emotion APIs, no storing video—frames live in memory for the request, then they’re gone.

2. **Transparent “second brain”** — Classification isn’t a black box. A **fast, rule-based layer** maps keywords in that description to **sentiment** (`calm` vs `party`), **confidence**, and **energy (1–10)**. You can read the code, tweak the signals, and reason about failures—without burning tokens on every tweak.

3. **Curated musical ground truth** — Recommendations aren’t a generic infinite scroll. We built a **hand-picked catalog of 30 reference tracks** spanning BPM, key, genre, and era—from ambient and neoclassical to EDM and anthems—so picks are **musically intentional**, then enriched with **Deezer** (preview clips, artwork, deep links) via their public API.

4. **Built like a real booth** — **Change detection** respects hysteresis: big shifts matter; jitter doesn’t. A **cooldown** stops the stack from thrashing. **Playback state** and **analysis history** are first-class so the UI can show *why* a song appeared—and **override** stays one API call away.

5. **Sound in the browser** — The **Next.js** workspace pairs with **Tone.js** so adaptive, generative, and layered audio ideas can live next to the same session that’s reading the room.

---

## How it flows

```
Browser webcam (interval sampling)
        │
        ▼
POST /api/crowd/analyze  ──►  Gemini: “What’s happening in the frame?”
        │                              (natural language)
        ▼
                    Rule-based scorer → sentiment + energy + confidence
        │
        ▼
        Shifted meaningfully? (threshold + cooldown)
        │
        ├── No  → { changed: false, description, energy, … }
        │
        └── Yes → Pick from curated DB → Deezer search → track + previews
                      │
                      ▼
              Frontend + optional override (POST /api/playback/override)
```

---

## Repository layout

| Path | Role |
|------|------|
| `backend/` | Flask API — crowd pipeline, playback state, analysis history |
| `backend/app/services/crowd.py` | Two-stage vision: Gemini description → keyword sentiment/energy |
| `backend/app/services/songs_db.py` | Curated 30-track reference database |
| `backend/app/services/deezer.py` | Deezer search for previews & metadata |
| `machacks-main/` | Next.js 16 app — landing, editor workspace, Tone.js, UI |

---

## Quick start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # add your keys
python run.py
```

### Frontend

```bash
cd machacks-main
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the app; point the frontend at your Flask base URL as configured in your environment.

### Tests

```bash
cd backend && pytest tests/ -v
```

---

## Environment

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Scene descriptions (Gemini vision / flash) |
| `YOUTUBE_API_KEY` | Optional integrations that use YouTube Data API (see `.env.example` notes) |

Deezer track lookup uses the **public** search API (no key required for basic usage in this project).

---

## API snapshot

- **`POST /api/crowd/analyze`** — Body: `{ "image_base64": "..." }`. Returns crowd fields, `changed`, optional `track` with Deezer-friendly fields when a new pick fires.
- **`GET /api/crowd/history`** — Full log of analyses for timelines and debugging.
- **`DELETE /api/crowd/history`** — Clear history.
- **`GET /api/playback/current`** / **`POST /api/playback/override`** — What’s playing and manual override.

See route docstrings under `backend/app/routes/` for the exact JSON shapes.

---

## Tech stack

- **Python / Flask** — API, orchestration, in-memory session state  
- **Google Gemini** — Vision-to-language scene understanding  
- **Deezer API** — Previews and metadata for human-verified catalog picks  
- **Next.js 16, React 19, Tailwind, Framer Motion** — Product UI  
- **Tone.js** — Web audio and adaptive sound layers  

---

## Philosophy (the one-liner for judges)

> VenIQ doesn’t guess your smile—it reads the *room*, explains itself in words you can audit, and hands you music that respects both **crowd physics** and **musical craft**, with a DJ always in the loop.

---

## Team & context

MacHacks project — **VenIQ**: crowd-aware intelligence for adaptive playback and creative tooling. PRs and issues welcome; if you extend the catalog or scoring rules, keep them **explainable**—that’s the point.
