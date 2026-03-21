import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_analyze_requires_image(client):
    res = client.post("/api/analyze", json={})
    assert res.status_code == 400


def test_analyze_returns_valid_structure_on_bad_key(client, monkeypatch):
    """With no API key, should fall back gracefully to calm/middle."""
    monkeypatch.setenv("GEMINI_API_KEY", "")
    # Tiny 1x1 white JPEG base64
    tiny_jpeg = (
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkS"
        "Ew8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAR"
        "CAABAAEDASIA"
    )
    res = client.post("/api/analyze", json={"image_base64": tiny_jpeg})
    assert res.status_code == 200
    data = res.get_json()
    assert data["mood"] in {"happy", "sad", "anxious", "calm"}
    assert data["age_bracket"] in {"young", "middle", "senior"}
    assert 0.0 <= data["confidence"] <= 1.0
