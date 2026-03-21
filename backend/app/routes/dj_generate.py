"""
DJ Generation Route

POST /api/dj/generate
  Body:     { "song": {...}, "energy": 7, "sentiment": "party", "description": "..." }
  Response: { "composition": { bpm, key_root, key_type, instruments, energy_layers } }
"""

from flask import Blueprint, request, jsonify
from app.services.gemini_composer import generate_composition

dj_bp = Blueprint("dj", __name__)


@dj_bp.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}
    song        = data.get("song")
    energy      = int(data.get("energy", 5))
    sentiment   = data.get("sentiment", "calm")
    description = data.get("description", "")

    if not song:
        return jsonify({"error": "song is required"}), 400

    composition = generate_composition(song, energy, sentiment, description)
    return jsonify({"composition": composition})
