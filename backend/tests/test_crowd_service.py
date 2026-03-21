import sys
import types

from app.services.crowd import describe_crowd


def _install_fake_genai(monkeypatch, fake_genai):
    # Ensure `import google.generativeai as genai` resolves to our stub.
    fake_google = types.ModuleType("google")
    fake_google.generativeai = fake_genai
    monkeypatch.setitem(sys.modules, "google", fake_google)
    monkeypatch.setitem(sys.modules, "google.generativeai", fake_genai)


def test_describe_crowd_falls_back_without_api_key(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    result = describe_crowd("dGVzdA==")
    assert result["analysis_source"] == "fallback"
    assert result["sentiment"] == "chill"
    assert result["energy"] == 4
    assert "fallback_reason" in result


def test_describe_crowd_falls_back_on_invalid_base64(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake")
    result = describe_crowd("!not-base64!")
    assert result["analysis_source"] == "fallback"
    assert result["sentiment"] == "chill"


def test_describe_crowd_falls_back_on_empty_image(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake")
    result = describe_crowd("   ")
    assert result["analysis_source"] == "fallback"
    assert result["description"] == "Moderately relaxed room"


def test_describe_crowd_parses_json_wrapped_in_text(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake")

    class FakeModel:
        def __init__(self, _name):
            pass

        def generate_content(self, _parts, **_kwargs):
            return types.SimpleNamespace(
                text='Result:\n```json\n{"description":"Busy room","energy":12,"sentiment":"PARTY"}\n```'
            )

    fake_genai = types.SimpleNamespace(
        configure=lambda **_kwargs: None,
        GenerativeModel=FakeModel,
    )
    _install_fake_genai(monkeypatch, fake_genai)

    result = describe_crowd("dGVzdA==")
    assert result["analysis_source"] == "gemini"
    assert result["description"] == "Busy room"
    assert result["energy"] == 10
    assert result["sentiment"] == "party"


def test_describe_crowd_normalizes_invalid_fields(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake")

    class FakeModel:
        def __init__(self, _name):
            pass

        def generate_content(self, _parts, **_kwargs):
            return types.SimpleNamespace(
                text='{"description":"","energy":"abc","sentiment":"unknown"}'
            )

    fake_genai = types.SimpleNamespace(
        configure=lambda **_kwargs: None,
        GenerativeModel=FakeModel,
    )
    _install_fake_genai(monkeypatch, fake_genai)

    result = describe_crowd("dGVzdA==")
    assert result["analysis_source"] == "gemini"
    assert result["description"] == "Crowd scene analyzed."
    assert result["energy"] == 4
    assert result["sentiment"] == "chill"


def test_describe_crowd_maps_sentiment_alias(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake")

    class FakeModel:
        def __init__(self, _name):
            pass

        def generate_content(self, _parts, **_kwargs):
            return types.SimpleNamespace(
                text='{"description":"quiet room","energy":5,"sentiment":"focused"}'
            )

    fake_genai = types.SimpleNamespace(
        configure=lambda **_kwargs: None,
        GenerativeModel=FakeModel,
    )
    _install_fake_genai(monkeypatch, fake_genai)

    result = describe_crowd("dGVzdA==")
    assert result["sentiment"] == "study"


def test_describe_crowd_rounds_and_clamps_energy(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake")

    class FakeModel:
        def __init__(self, _name):
            pass

        def generate_content(self, _parts, **_kwargs):
            return types.SimpleNamespace(
                text='{"description":"high energy","energy":10.7,"sentiment":"party"}'
            )

    fake_genai = types.SimpleNamespace(
        configure=lambda **_kwargs: None,
        GenerativeModel=FakeModel,
    )
    _install_fake_genai(monkeypatch, fake_genai)

    result = describe_crowd("dGVzdA==")
    assert result["energy"] == 10


def test_describe_crowd_truncates_long_description(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake")
    long_desc = "a" * 500

    class FakeModel:
        def __init__(self, _name):
            pass

        def generate_content(self, _parts, **_kwargs):
            return types.SimpleNamespace(
                text=f'{{"description":"{long_desc}","energy":5,"sentiment":"chill"}}'
            )

    fake_genai = types.SimpleNamespace(
        configure=lambda **_kwargs: None,
        GenerativeModel=FakeModel,
    )
    _install_fake_genai(monkeypatch, fake_genai)

    result = describe_crowd("dGVzdA==")
    assert len(result["description"]) <= 180
