import time
import uuid
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from vision import recognize_ingredients, client as openai_client

app = FastAPI(title="AI Pantry Scanner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

PANTRY_FILE = os.path.join(os.path.dirname(__file__), "pantry_db.json")
PANTRY = []

def load_pantry():
    global PANTRY
    if os.path.exists(PANTRY_FILE):
        try:
            with open(PANTRY_FILE, "r", encoding="utf-8") as f:
                PANTRY = json.load(f)
        except Exception as e:
            print("Error loading pantry:", e)
            PANTRY = []
    else:
        PANTRY = []

def save_pantry():
    try:
        with open(PANTRY_FILE, "w", encoding="utf-8") as f:
            json.dump(PANTRY, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Error saving pantry:", e)

load_pantry()

LOW_CONFIDENCE_THRESHOLD = 0.75


# -----------------------------
# Models
# -----------------------------

class ConfirmedIngredient(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    quantity: float
    unit: str
    confidence: Optional[float] = None


class ConfirmPayload(BaseModel):
    ingredients: List[ConfirmedIngredient]


class RecipeRequest(BaseModel):
    dish_name: Optional[str] = None


# -----------------------------
# Health
# -----------------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}


# -----------------------------
# Analyze Images
# -----------------------------

@app.post("/api/analyze")
async def analyze_images(
    photos: List[UploadFile] = File(...)
):

    start = time.time()

    merged = {}

    for photo in photos:

        image = await photo.read()

        result = recognize_ingredients(
            image,
            photo.content_type or "image/jpeg"
        )

        # ===============================
        # COOKED FOOD
        # ===============================

        if result.get("type") == "dish":
            recipe_data = result.get("recipe", {})
            structured_ingredients = []
            raw_ings = recipe_data.get("ingredients", [])
            for item in raw_ings:
                if isinstance(item, str):
                    in_p = any(p["name"].lower() in item.lower() or item.lower() in p["name"].lower() for p in PANTRY if p.get("name"))
                    structured_ingredients.append({"name": item, "amount": "", "in_pantry": in_p})
                elif isinstance(item, dict):
                    name_str = str(item.get("name", ""))
                    in_p = item.get("in_pantry", any(p["name"].lower() in name_str.lower() or name_str.lower() in p["name"].lower() for p in PANTRY if p.get("name")))
                    structured_ingredients.append({"name": name_str, "amount": str(item.get("amount", item.get("quantity", ""))), "in_pantry": in_p})
            recipe_data["ingredients_used"] = structured_ingredients

            chip_ingredients = []
            for item in structured_ingredients:
                name = item.get("name", "Ingredient").title()
                amt_str = item.get("amount", "")
                qty = 1.0
                unit = "pcs"
                if amt_str:
                    parts = amt_str.split()
                    for p in parts:
                        clean_p = p.replace(".", "", 1)
                        if clean_p.isdigit():
                            qty = float(p)
                            break
                    if "g" in amt_str.lower() or "gram" in amt_str.lower(): unit = "g"
                    elif "kg" in amt_str.lower(): unit = "kg"
                    elif "ml" in amt_str.lower(): unit = "ml"
                    elif "cup" in amt_str.lower(): unit = "cup"
                    elif "tbsp" in amt_str.lower(): unit = "tbsp"
                    elif "tsp" in amt_str.lower(): unit = "tsp"

                chip_ingredients.append({
                    "id": str(uuid.uuid4()),
                    "name": name,
                    "category": "other",
                    "quantity": qty,
                    "unit": unit,
                    "confidence": 0.95,
                    "needs_confirmation": False
                })

            return {
                "type": "dish",
                "recipe": recipe_data,
                "ingredients": chip_ingredients,
                "photos_analyzed": len(photos),
                "processing_ms": int((time.time() - start) * 1000)
            }

        # ===============================
        # INGREDIENTS
        # ===============================

        for item in result.get("ingredients", []):

            key = item.get("name", "Item").lower()

            if key in merged:

                merged[key]["quantity"] += item["quantity"]

                merged[key]["confidence"] = max(

                    merged[key]["confidence"],

                    item["confidence"]

                )

            else:

                merged[key] = {

                    "id": str(uuid.uuid4()),

                    "name": item["name"],

                    "category": item["category"],

                    "quantity": item["quantity"],

                    "unit": item["unit"],

                    "confidence": item["confidence"],

                    "needs_confirmation":

                        item["confidence"] < LOW_CONFIDENCE_THRESHOLD

                }

    ingredients = sorted(

        merged.values(),

        key=lambda x: -x["confidence"]

    )

    return {

        "type": "ingredients",

        "ingredients": ingredients,

        "photos_analyzed": len(photos),

        "processing_ms": int(

            (time.time() - start) * 1000

        )

    }


# -----------------------------
# Confirm Pantry
# -----------------------------

@app.post("/api/pantry/confirm")
def confirm_ingredients(payload: ConfirmPayload):

    for ing in payload.ingredients:

        existing = next(

            (

                p

                for p in PANTRY

                if p["name"].lower()

                == ing.name.lower()

            ),

            None,

        )

        if existing:

            existing["quantity"] += ing.quantity

        else:

            PANTRY.append(

                {

                    "id": ing.id or str(uuid.uuid4()),

                    "name": ing.name,

                    "category": ing.category,

                    "quantity": ing.quantity,

                    "unit": ing.unit,

                }

            )

    save_pantry()
    return {

        "pantry": PANTRY

    }


# -----------------------------
# Pantry
# -----------------------------

@app.get("/api/pantry")
def pantry():

    return {

        "pantry": PANTRY

    }


@app.delete("/api/pantry/{item_id}")
def delete_item(item_id: str):

    global PANTRY

    PANTRY = [

        p

        for p in PANTRY

        if p["id"] != item_id

    ]

    save_pantry()
    return {

        "pantry": PANTRY

    }


@app.post("/api/pantry/clear")
def clear():

    global PANTRY

    PANTRY = []
    save_pantry()

    return {

        "pantry": PANTRY

    }


@app.post("/api/recipes")
def generate_recipes(payload: RecipeRequest = None):
    pantry_names = [p["name"] for p in PANTRY if p.get("name")]
    dish_prompt = f"specifically around '{payload.dish_name}'" if payload and payload.dish_name else "practical and delicious based on these items"

    if not pantry_names and not (payload and payload.dish_name):
        return {"recipes": []}

    prompt = f"""
You are an expert AI Chef.
User's current pantry ingredients: {pantry_names}
Generate exactly 3 diverse, practical recipes {dish_prompt}.

For each recipe, you MUST list the exact ingredients used ("what ingredients are used in that") along with an `in_pantry` boolean indicating if the item is already in the user's pantry.

Return ONLY JSON matching exactly this schema:
{{
  "recipes": [
    {{
      "id": "rec-1",
      "title": "Moong Dal & Vegetable Curry",
      "description": "A comforting, protein-packed Indian lentil dish made with ingredients from your pantry.",
      "time": "30 mins",
      "difficulty": "Easy",
      "servings": "2-3",
      "ingredients_used": [
        {{"name": "Moong Dal", "amount": "1 cup", "in_pantry": true}},
        {{"name": "Tomatoes", "amount": "2 chopped", "in_pantry": true}},
        {{"name": "Ghee", "amount": "1 tbsp", "in_pantry": true}},
        {{"name": "Salt & Spices", "amount": "to taste", "in_pantry": false}}
      ],
      "steps": [
        "Rinse moong dal and boil with 3 cups of water until tender.",
        "Heat ghee in a pan, sauté onions and tomatoes until soft.",
        "Combine cooked dal with the sautéed mixture and simmer for 5 minutes."
      ],
      "nutrition": {{
        "calories": "310 kcal",
        "protein": "16 g",
        "carbs": "44 g",
        "fat": "9 g"
      }},
      "tips": [
        "Soak the dal for 15 minutes before boiling for faster cooking."
      ]
    }}
  ]
}}
"""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2500,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content.strip()
        data = json.loads(text)
        recipes = data.get("recipes", [])
        # Ensure ingredients_used check
        for r in recipes:
            if "ingredients_used" not in r and "ingredients" in r:
                structured = []
                for item in r["ingredients"]:
                    if isinstance(item, str):
                        in_p = any(p["name"].lower() in item.lower() or item.lower() in p["name"].lower() for p in PANTRY if p.get("name"))
                        structured.append({"name": item, "amount": "", "in_pantry": in_p})
                    elif isinstance(item, dict):
                        structured.append(item)
                r["ingredients_used"] = structured
        return {"recipes": recipes}
    except Exception as e:
        print("Recipe Generation Error:", str(e))
        return {"recipes": []}