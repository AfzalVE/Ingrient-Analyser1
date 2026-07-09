import time
import uuid
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from vision import recognize_ingredients

app = FastAPI(title="Pantry Ingredient Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # POC only - lock this down in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory "database" for the POC --------------------------------------
PANTRY: List[dict] = []

LOW_CONFIDENCE_THRESHOLD = 0.75


class ConfirmedIngredient(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    quantity: float
    unit: str
    confidence: Optional[float] = None


class ConfirmPayload(BaseModel):
    ingredients: List[ConfirmedIngredient]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_images(photos: List[UploadFile] = File(...)):
    """Accepts one or more photos, runs (mock or real) AI recognition on each,
    and returns a merged, de-duplicated ingredient list ready for review."""
    start = time.time()
    merged: dict[str, dict] = {}

    for photo in photos:
        image_bytes = await photo.read()
        media_type = photo.content_type or "image/jpeg"
        detections = recognize_ingredients(image_bytes, media_type)

        for item in detections:
            key = item["name"].lower()
            if key in merged:
                # seen in another photo - merge quantity, keep the higher confidence
                merged[key]["quantity"] += item["quantity"]
                merged[key]["confidence"] = max(merged[key]["confidence"], item["confidence"])
            else:
                merged[key] = {
                    "id": str(uuid.uuid4()),
                    "name": item["name"],
                    "category": item["category"],
                    "quantity": item["quantity"],
                    "unit": item["unit"],
                    "confidence": item["confidence"],
                    "needs_confirmation": item["confidence"] < LOW_CONFIDENCE_THRESHOLD,
                }

    results = sorted(merged.values(), key=lambda x: (-x["confidence"]))
    return {
        "photos_analyzed": len(photos),
        "ingredients": results,
        "processing_ms": int((time.time() - start) * 1000),
    }


@app.post("/api/pantry/confirm")
def confirm_ingredients(payload: ConfirmPayload):
    """Saves the user-confirmed ingredient list into the pantry, merging with
    anything already there (matched by name)."""
    for ing in payload.ingredients:
        existing = next((p for p in PANTRY if p["name"].lower() == ing.name.lower()), None)
        if existing:
            existing["quantity"] += ing.quantity
            existing["unit"] = ing.unit
        else:
            PANTRY.append({
                "id": ing.id or str(uuid.uuid4()),
                "name": ing.name,
                "category": ing.category,
                "quantity": ing.quantity,
                "unit": ing.unit,
            })
    return {"pantry": PANTRY}


@app.get("/api/pantry")
def get_pantry():
    return {"pantry": PANTRY}


@app.delete("/api/pantry/{item_id}")
def delete_pantry_item(item_id: str):
    global PANTRY
    PANTRY = [p for p in PANTRY if p["id"] != item_id]
    return {"pantry": PANTRY}


@app.post("/api/pantry/clear")
def clear_pantry():
    global PANTRY
    PANTRY = []
    return {"pantry": PANTRY}
