import os
import tempfile
from flask import Blueprint, request, jsonify
from app.services.ingest import ingest_youtube, ingest_mp3

ingest_bp = Blueprint("ingest", __name__)

ALLOWED_EXTENSIONS = {"mp3", "wav", "m4a", "ogg"}


@ingest_bp.route("", methods=["POST"])
def ingest():
    """
    Accept a YouTube URL or an MP3 file upload and return a track_id.

    JSON body (YouTube):
        { "youtube_url": "https://youtube.com/watch?v=..." }

    Multipart form (file upload):
        file: <audio file>

    Returns:
        { "track_id": "<uuid>", "title": "Song Title", "duration_s": 210 }
    """
    # YouTube URL path
    data = request.get_json(silent=True) or {}
    youtube_url = data.get("youtube_url")
    if youtube_url:
        try:
            result = ingest_youtube(youtube_url)
            return jsonify({
                "track_id": result["track_id"],
                "title": result["title"],
                "duration_s": result["duration_s"],
            })
        except Exception as e:
            return jsonify({"error": f"YouTube ingest failed: {str(e)}"}), 422

    # File upload path
    if "file" not in request.files:
        return jsonify({"error": "Provide youtube_url or a file upload"}), 400

    f = request.files["file"]
    ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"Unsupported file type: {ext}"}), 415

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        f.save(tmp.name)
        tmp_path = tmp.name

    try:
        result = ingest_mp3(tmp_path)
        return jsonify({
            "track_id": result["track_id"],
            "title": result["title"],
            "duration_s": result["duration_s"],
        })
    except Exception as e:
        return jsonify({"error": f"File ingest failed: {str(e)}"}), 422
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
