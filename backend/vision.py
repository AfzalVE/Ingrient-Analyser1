import base64
import json
import os
from typing import Dict, Any

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


PROMPT = """
You are an expert AI Food Recognition, Grocery Scanner, and Recipe Assistant.

Analyze the uploaded image carefully.

FIRST determine whether the image is:
1. Raw ingredients / groceries / pantry items (single items, multiple items, infographic, or grocery table)
OR
2. A cooked / prepared / ready-to-eat dish (e.g., Biryani, Pizza, Salad, Curry, Pasta).

------------------------------------------------
IF IT IS RAW INGREDIENTS OR GROCERIES
Identify every single ingredient visible or listed in the image. Be meticulous across all categories:
• Fresh Produce: fruits, vegetables, herbs (e.g., tomatoes, onions, spinach, coriander, ginger, garlic).
• Packaged Foods: boxed, bagged, or cartoned items (e.g., pasta, flour bags, tea leaves, snacks, noodles).
• Spices & Herbs: whole or powdered spices (e.g., cloves, cardamom, cumin, turmeric, chili powder, cinnamon).
• Canned / Frozen / Beverages: canned tomatoes, beans, frozen peas, milk bottles, juice, oil, sodas.
• Grains & Pulses: basmati rice, moong dal, toor dal, chickpeas, lentils, oats.
• Meat, Fish, Dairy, Bakery: chicken, fish, eggs, cheese, butter, ghee, bread.

Calculate realistic quantities and exact confidence scores (between 0.10 and 1.00). If an item is partially obscured, blurry, or uncertain, assign a confidence below 0.75 so the user can verify it.

Return ONLY JSON matching:
{
  "type":"ingredients",
  "ingredients":[
    {
      "name":"Tomato",
      "category":"produce",
      "quantity":2,
      "unit":"pcs",
      "confidence":0.97
    },
    {
      "name":"Cardamom",
      "category":"spices",
      "quantity":50,
      "unit":"g",
      "confidence":0.92
    }
  ]
}

------------------------------------------------
IF IT IS A COOKED DISH OR PREPARED MEAL
Identify the exact dish and generate a COMPLETE, practical recipe.
Must identify every primary ingredient used in the dish ("what ingredients are used in that") along with estimated quantities needed to make the dish.

Return ONLY JSON matching:
{
  "type":"dish",
  "recipe":{
    "title":"Chicken Biryani",
    "description":"Traditional Hyderabadi Chicken Biryani cooked with fragrant basmati rice, tender chicken, and rich spices.",
    "time":"60 mins",
    "difficulty":"Medium",
    "servings":"4",
    "ingredients":[
      "500 g Chicken",
      "2 cups Basmati Rice",
      "2 Onions sliced",
      "1 cup Yogurt",
      "2 tbsp Ghee",
      "4 Green Cardamoms & Cloves"
    ],
    "steps":[
      "Marinate chicken with yogurt, spices, ginger-garlic paste, and salt for 30 minutes.",
      "Wash and soak basmati rice for 20 minutes, then boil in spiced water until 70% cooked.",
      "In a heavy-bottomed pot, layer the marinated chicken and partially cooked rice with fried onions and ghee.",
      "Cover tightly and cook on dum (low heat) for 25 minutes until chicken is tender and rice is fluffy."
    ],
    "nutrition":{
      "calories":"650 kcal",
      "protein":"32 g",
      "carbs":"58 g",
      "fat":"24 g"
    },
    "tips":[
      "Use aged basmati rice for long, separate grains.",
      "Do not open the lid while cooking on dum to trap aromatic steam."
    ]
  }
}

Rules:
• Detect all visible ingredients accurately across produce, packaged, spices, canned, frozen, grains, and beverages.
• Never hallucinate impossible ingredients not present in the image.
• Categories MUST be exactly one of:
produce
meat
fish
dairy
packaged
spices
canned
frozen
beverages
grains
bakery
other

Return ONLY JSON. No markdown wrappers. No explanation text.
"""


def recognize_ingredients(
    image_bytes: bytes,
    media_type: str = "image/jpeg",
) -> Dict[str, Any]:
    if media_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
        media_type = "image/jpeg"

    image_base64 = base64.b64encode(image_bytes).decode()
    text = ""

    # Primary: gpt-4o with strict json_object response format
    try:
        chat_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{media_type};base64,{image_base64}"},
                        },
                    ],
                }
            ],
            max_tokens=2500,
            response_format={"type": "json_object"},
        )
        text = chat_response.choices[0].message.content.strip()
    except Exception as api_err:
        print("gpt-4o failed, trying responses create fallback:", str(api_err))
        try:
            response = client.responses.create(
                model="gpt-4.1",
                input=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": PROMPT},
                            {
                                "type": "input_image",
                                "image_url": f"data:{media_type};base64,{image_base64}",
                            },
                        ],
                    }
                ],
                max_output_tokens=2500,
            )
            text = response.output_text.strip()
        except Exception as fallback_err:
            print("Fallback Vision API Error:", str(fallback_err))
            return {
                "type": "ingredients",
                "ingredients": []
            }

    try:
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and start_idx <= end_idx:
            text = text[start_idx : end_idx + 1]

        data = json.loads(text)

        if data.get("type") == "dish":
            return data

        raw_list = data.get("ingredients") or data.get("items") or []
        if isinstance(data, list):
            raw_list = data

        ingredients = []
        for item in raw_list:
            if not isinstance(item, dict):
                continue
            ingredients.append({
                "name": str(item.get("name", item.get("ingredient", "Item"))).title(),
                "category": str(item.get("category", "other")).lower(),
                "quantity": float(item.get("quantity", 1)),
                "unit": str(item.get("unit", "pcs")),
                "confidence": float(item.get("confidence", 0.9))
            })

        return {
            "type": "ingredients",
            "ingredients": ingredients
        }

    except Exception as e:
        print("Vision Parsing Error:", str(e))
        return {
            "type": "ingredients",
            "ingredients": []
        }