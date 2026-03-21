# Crowd-Aware DJ — Flask API

## Run (recommended: repo virtualenv)

From the **repository root** (parent of `backend/`):

```bash
# Create venv once (if you don’t have it yet)
python3 -m venv venv

# Activate — macOS/Linux
source venv/bin/activate

# Install deps (includes google-generativeai for Gemini)
pip install -r backend/requirements.txt

cd backend
cp .env.example .env   # then add GEMINI_API_KEY and YOUTUBE_API_KEY
python run.py
```

Always run the server **with the same interpreter** that has the packages installed. If you use `python run.py` without activating `venv`, imports like `google.generativeai` will fail.

## Troubleshooting

### `No module named 'google'`

The Gemini SDK package is **`google-generativeai`** on PyPI (it provides `import google.generativeai`).

1. Activate the project venv (see above), **or**
2. Install into whatever Python you use for Flask:
   ```bash
   pip install -r requirements.txt
   ```

Verify:

```bash
python -c "import google.generativeai; print('ok')"
```

### `Scene analysis unavailable: GEMINI_API_KEY not set`

Ensure `backend/.env` exists and contains `GEMINI_API_KEY=...`, then restart Flask. `config.py` loads `.env` via `python-dotenv` from the current working directory when you run from `backend/`.
