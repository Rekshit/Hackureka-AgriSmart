from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import json
import os
import re

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyDcayurWppg4uY0iwBUtrjvfjiobzoLUnA"))


def to_number(value, default=0):
    try:
        return float(value)
    except Exception:
        return float(default)


def extract_json(text):
    raw = (text or "").strip()
    if not raw:
        raise ValueError("Empty Gemini response")
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found")
    return json.loads(match.group(0))


def normalize_payload(payload):
    raw_suit = payload.get("crop_suitability")
    if not isinstance(raw_suit, list):
        raw_suit = []

    crop_suitability = []
    for item in raw_suit:
        if not isinstance(item, dict):
            continue
        crop = str(item.get("crop", "")).strip()
        if not crop:
            continue
        try:
            pct = int(round(float(item.get("percentage", 0))))
        except Exception:
            pct = 0
        pct = max(0, min(100, pct))
        crop_suitability.append({"crop": crop, "percentage": pct})
    crop_suitability = crop_suitability[:4]

    raw_seeds = payload.get("recommended_seeds")
    if not isinstance(raw_seeds, list):
        raw_seeds = []

    recommended_seeds = []
    for seed in raw_seeds:
        if not isinstance(seed, dict):
            continue
        name = str(seed.get("name", "")).strip()
        if not name:
            continue
        recommended_seeds.append({
            "name": name,
            "crop": str(seed.get("crop", "")).strip(),
            "season": str(seed.get("season", "")).strip(),
            "yield_type": str(seed.get("yield_type", "")).strip()
        })
    recommended_seeds = recommended_seeds[:3]

    advice = str(payload.get("advice", "")).strip() or "No advice available."

    return {
        "crop_suitability": crop_suitability,
        "recommended_seeds": recommended_seeds,
        "advice": advice
    }


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json() or {}
    soil_data = data.get("soil_data") or {}

    nitrogen = to_number(data.get("nitrogen", soil_data.get("Nitrogen", 0)))
    phosphorus = to_number(data.get("phosphorus", soil_data.get("Phosphorus", 0)))
    potassium = to_number(data.get("potassium", soil_data.get("Potassium", 0)))
    selected_crop = str(data.get("crop", "")).strip() or "General"

    prompt = f"""
You are an experienced Indian agricultural scientist.

Soil Data:
- Nitrogen: {nitrogen} kg/ha
- Phosphorus: {phosphorus} kg/ha
- Potassium: {potassium} kg/ha
- Preferred Crop: {selected_crop}

Return strictly and only valid JSON in this exact schema:
{{
  "crop_suitability": [
    {{"crop": "Wheat", "percentage": 92}},
    {{"crop": "Rice", "percentage": 78}},
    {{"crop": "Mustard", "percentage": 85}},
    {{"crop": "Sugarcane", "percentage": 60}}
  ],
  "recommended_seeds": [
    {{
      "name": "HD-2067",
      "crop": "Wheat",
      "season": "Rabi",
      "yield_type": "High Yield"
    }},
    {{
      "name": "PBW-343",
      "crop": "Wheat",
      "season": "Rabi",
      "yield_type": "Medium Yield"
    }},
    {{
      "name": "Pusa Basmati",
      "crop": "Rice",
      "season": "Kharif",
      "yield_type": "Premium Yield"
    }}
  ],
  "advice": "Short agronomic advice in 1-3 sentences."
}}
Rules:
- Use only N, P, K values to decide recommendations.
- crop_suitability must contain exactly 4 items.
- recommended_seeds must contain exactly 3 items.
- Return JSON only. No markdown/code fences/extra explanation.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    try:
        result_json = normalize_payload(extract_json(getattr(response, "text", "")))
    except Exception:
        result_json = {
            "crop_suitability": [],
            "recommended_seeds": [],
            "advice": "Error generating advice"
        }

    return jsonify(result_json)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=True)

