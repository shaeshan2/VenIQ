import os
import pytest
import numpy as np
import soundfile as sf
from app import create_app
from app.services.music_transform import transform_music


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


@pytest.fixture
def sample_wav(tmp_path):
    """Create a short 3-second sine-wave WAV for testing."""
    sr = 22050
    duration = 3
    t = np.linspace(0, duration, sr * duration)
    audio = (np.sin(2 * np.pi * 440 * t) * 0.5).astype(np.float32)
    path = str(tmp_path / "test_tone.wav")
    sf.write(path, audio, sr)
    return path


def test_transform_all_mood_age_combinations(sample_wav, tmp_path):
    moods = ["happy", "sad", "anxious", "calm"]
    ages = ["young", "middle", "senior"]
    for mood in moods:
        for age in ages:
            out = str(tmp_path / f"{mood}_{age}.mp3")
            transform_music(sample_wav, mood, age, out)
            assert os.path.exists(out), f"Missing output for {mood}/{age}"
            assert os.path.getsize(out) > 0


def test_transform_missing_input_raises():
    with pytest.raises(FileNotFoundError):
        transform_music("/nonexistent/path.wav", "calm", "middle", "/tmp/out.mp3")


def test_transform_endpoint_bad_request(client):
    res = client.post("/api/transform", json={})
    assert res.status_code == 400


def test_stream_unknown_session(client):
    res = client.get("/api/stream/totally-fake-id")
    assert res.status_code in {200, 404}  # 200 if fallback track exists
