# Pantry Ingredient Scanner — POC

FastAPI backend + React (Vite) frontend, 5 screens:

1. **Add Ingredients** — Take Photo / Upload from Gallery + live preview
2. **Analyzing** — loading animation while photos are sent to the backend
3. **Review Ingredients** — editable chips (name, qty, unit), low-confidence items flagged, add/remove
4. **Pantry** — merged confirmed ingredients, grouped by category
5. **Generate Recipes** — stub screen showing pantry contents feeding into recipe generation

## Run it

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to the backend on :8000.

Ingredient detection is mocked out of the box (no API key needed). Set `ANTHROPIC_API_KEY` before starting the backend to switch to real Claude vision recognition — see `backend/README.md`.
