from flask import Flask
from flask_cors import CORS
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.analyze import analyze_bp
    from app.routes.ingest import ingest_bp
    from app.routes.music import music_bp

    app.register_blueprint(analyze_bp, url_prefix="/api/analyze")
    app.register_blueprint(ingest_bp, url_prefix="/api/ingest")
    app.register_blueprint(music_bp, url_prefix="/api")

    return app
