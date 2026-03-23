from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],          # no global default — set per-route
    storage_uri="memory://",    # in-process (fine for single Gunicorn worker)
)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    limiter.init_app(app)

    from app.routes.crowd import crowd_bp
    from app.routes.playback import playback_bp

    app.register_blueprint(crowd_bp, url_prefix="/api/crowd")
    app.register_blueprint(playback_bp, url_prefix="/api/playback")

    @app.errorhandler(429)
    def rate_limit_handler(e):
        return jsonify({"error": "Too many requests", "retry_after": str(e.description)}), 429

    return app
