import base64
import json
import os
from typing import List

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def recognize_ingredients(
    image_bytes: bytes,
    media_type: str = "image/jpeg",
) -> List[dict]:

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """
You are an expert food ingredient recognition AI.

Analyze the uploaded image carefully.

Detect ONLY ingredients that are actually visible.

Include:
- Fruits
- Vegetables
- Meat
- Fish
- Dairy
- Eggs
- Rice
- Bread
- Pasta
- Spices
- Herbs
- Packaged foods
- Beverages
- Frozen foods
- Canned foods

If the image contains a cooked dish like:
- Biryani
- Pizza
- Burger
- Pasta
- Curry
- Fried Rice
- Sandwich

Infer the most likely visible ingredients ONLY.

DO NOT guess ingredients that cannot reasonably be identified.

Return ONLY valid JSON.

Format:

[
  {
    "name":"Chicken",
    "category":"meat",
    "quantity":500,
    "unit":"g",
    "confidence":0.97
  }
]

No markdown.
No explanation.
Only JSON.
"""

    response = client.responses.create(
        model="gpt-4.1",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": prompt,
                    },
                    {
                        "type": "input_image",
                        "image_url": f"data:{media_type};base64,{image_base64}",
                    },
                ],
            }
        ],
        max_output_tokens=1000,
    )

    text = response.output_text.strip()

    try:
        data = json.loads(text)

        results = []

        for item in data:
            results.append({
                "name": item.get("name", "").title(),
                "category": item.get("category", "other"),
                "quantity": item.get("quantity", 1),
                "unit": item.get("unit", "pcs"),
                "confidence": item.get("confidence", 0.90),
            })

        return results

    except Exception as e:
        print("Vision Parsing Error:", e)
        print(text)
        return []