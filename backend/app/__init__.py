from flask import Flask
from flask_cors import CORS
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.crowd import crowd_bp
    from app.routes.playback import playback_bp
    from app.routes.dj_generate import dj_bp

    app.register_blueprint(crowd_bp, url_prefix="/api/crowd")
    app.register_blueprint(playback_bp, url_prefix="/api/playback")
    app.register_blueprint(dj_bp, url_prefix="/api/dj")

    return app
