from flask import Blueprint, request, jsonify
from app.services.gemini import analyze_frame

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.route("", methods=["POST"])
def analyze():
    """
    Analyze webcam frame → mood + age bracket.

    Body (JSON):
        image_base64 (str): base64-encoded JPEG from the webcam
        survey (dict, optional): { "stress": 1-5, "energy": 1-5 }

    Returns:
        { "mood": "calm", "age_bracket": "senior", "confidence": 0.87 }
    """
    data = request.get_json(silent=True) or {}
    image_b64 = data.get("image_base64")

    if not image_b64:
        return jsonify({"error": "image_base64 is required"}), 400

    survey = data.get("survey")
    result = analyze_frame(image_b64=image_b64, survey=survey)

    return jsonify(result)
