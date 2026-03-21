import pytest
from unittest.mock import patch
from app import create_app
from app.routes import crowd as crowd_module


@pytest.fixture(autouse=True)
def reset_crowd_state():
    """Reset crowd state between tests."""
    crowd_module._state["energy"] = None
    crowd_module._state["sentiment"] = None
    yield


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


MOCK_SCENE = {"description": "Crowded dance floor.", "energy": 8, "sentiment": "party"}
MOCK_TRACK = {"name": "Test Song", "artist": "Test Artist", "uri": "spotify:track:abc", "preview_url": None, "spotify_url": ""}


def test_analyze_requires_image(client):
    res = client.post("/api/crowd/analyze", json={})
    assert res.status_code == 400


def test_analyze_rejects_non_string_image_base64(client):
    res = client.post("/api/crowd/analyze", json={"image_base64": 123})
    assert res.status_code == 400


def test_first_call_always_returns_changed(client):
    with patch("app.routes.crowd.describe_crowd", return_value=MOCK_SCENE), \
         patch("app.routes.crowd.get_recommendations", return_value=[MOCK_TRACK]):
        res = client.post("/api/crowd/analyze", json={"image_base64": "dGVzdA=="})
    assert res.status_code == 200
    data = res.get_json()
    assert data["changed"] is True
    assert data["track"]["name"] == "Test Song"
    assert data["analysis_source"] == "gemini"


def test_stable_crowd_returns_no_change(client):
    crowd_module._state["energy"] = 8
    crowd_module._state["sentiment"] = "party"

    with patch("app.routes.crowd.describe_crowd", return_value=MOCK_SCENE), \
         patch("app.routes.crowd.get_recommendations", return_value=[MOCK_TRACK]):
        res = client.post("/api/crowd/analyze", json={"image_base64": "dGVzdA=="})
    assert res.status_code == 200
    data = res.get_json()
    assert data["changed"] is False
    assert data["sentiment"] == "party"
    assert data["analysis_source"] == "gemini"


def test_energy_shift_above_threshold_returns_changed(client):
    crowd_module._state["energy"] = 3   # was calm
    crowd_module._state["sentiment"] = "study"

    high_energy_scene = {"description": "Everyone dancing.", "energy": 9, "sentiment": "party"}
    with patch("app.routes.crowd.describe_crowd", return_value=high_energy_scene), \
         patch("app.routes.crowd.get_recommendations", return_value=[MOCK_TRACK]):
        res = client.post("/api/crowd/analyze", json={"image_base64": "dGVzdA=="})
    assert res.status_code == 200
    assert res.get_json()["changed"] is True


def test_sentiment_change_alone_triggers_recommendation(client):
    crowd_module._state["energy"] = 5
    crowd_module._state["sentiment"] = "study"

    # Same energy, different sentiment
    scene = {"description": "Same energy, romantic mood.", "energy": 5, "sentiment": "romantic"}
    with patch("app.routes.crowd.describe_crowd", return_value=scene), \
         patch("app.routes.crowd.get_recommendations", return_value=[MOCK_TRACK]):
        res = client.post("/api/crowd/analyze", json={"image_base64": "dGVzdA=="})
    assert res.get_json()["changed"] is True


def test_fallback_scene_fields_are_propagated(client):
    fallback_scene = {
        "description": "Scene appears relaxed with moderate-low activity.",
        "energy": 4,
        "sentiment": "chill",
        "analysis_source": "fallback",
        "fallback_reason": "Gemini timeout",
    }
    with patch("app.routes.crowd.describe_crowd", return_value=fallback_scene), \
         patch("app.routes.crowd.get_recommendations", return_value=[MOCK_TRACK]):
        res = client.post("/api/crowd/analyze", json={"image_base64": "dGVzdA=="})
    data = res.get_json()
    assert data["analysis_source"] == "fallback"
    assert data["fallback_reason"] == "Gemini timeout"
