# Pantry Ingredient Scanner — Backend (FastAPI)

## Setup
```bash
cd backend
python -m venv venv && source venv/bin/activate   # optional
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Endpoints
- `POST /api/analyze` — multipart form, field `photos` (1..N image files). Returns merged, de-duplicated detected ingredients with `confidence` and `needs_confirmation`.
- `POST /api/pantry/confirm` — body `{ "ingredients": [...] }`. Saves confirmed ingredients into the pantry (merges by name).
- `GET /api/pantry` — current pantry contents.
- `DELETE /api/pantry/{item_id}` — remove one item.
- `POST /api/pantry/clear` — empty the pantry.

## Real AI recognition (optional)
By default ingredient detection is **mocked** (deterministic per-image, so demos are stable) so the POC runs with zero credentials.

Set `ANTHROPIC_API_KEY` in the environment to switch `vision.py` to call Claude's vision API for real ingredient detection from the uploaded photo. If the call fails for any reason, it silently falls back to the mock so the demo never breaks.
