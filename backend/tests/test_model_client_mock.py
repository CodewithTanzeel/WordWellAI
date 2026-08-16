# tests/test_model_client_mock.py
"""
Tests for model_client – both the LM Studio remote path and the local heuristic.
"""
import json
import pytest
from app import model_client


# ---------------------------------------------------------------------------
# LM Studio remote path
# ---------------------------------------------------------------------------

def test_call_model_hits_lm_studio_when_model_url_set(monkeypatch):
    """When MODEL_URL is configured, the client calls /v1/chat/completions."""
    captured = {}
    monkeypatch.setattr(model_client, "MODEL_URL", "http://localhost:1234")

    def fake_post(url, json=None, timeout=None):
        captured["url"] = url
        captured["json"] = json

        class DummyResp:
            def json(self_inner):
                return {
                    "choices": [{
                        "message": {
                            "content": '{"label": "neutral", "confidence": 0.72}'
                        }
                    }]
                }
        return DummyResp()

    monkeypatch.setattr("httpx.post", fake_post)

    result = model_client.call_model("I feel okay today")

    assert captured["url"] == "http://localhost:1234/v1/chat/completions"
    assert captured["json"]["messages"][1]["content"] == "I feel okay today"
    assert result == {"label": "neutral", "confidence": 0.72}


def test_lm_studio_falls_back_to_heuristic_on_error(monkeypatch):
    """If the LM Studio call raises, the heuristic is used instead."""
    monkeypatch.setattr(model_client, "MODEL_URL", "http://localhost:1234")

    def bad_post(*a, **kw):
        raise ConnectionError("refused")

    monkeypatch.setattr("httpx.post", bad_post)

    result = model_client.call_model("I feel happy today")
    assert isinstance(result, dict)
    assert result["label"] != "elevated_stress_signals"


# ---------------------------------------------------------------------------
# Local heuristic – label routing
# ---------------------------------------------------------------------------

def test_heuristic_clearly_positive_text():
    r = model_client._local_heuristic("I feel so happy and grateful today, life is wonderful")
    assert r["label"] == "low_stress_signals"
    assert r["confidence"] >= 0.55


def test_heuristic_elevated_stress_text():
    r = model_client._local_heuristic(
        "I can't sleep, I feel completely hopeless and worthless, nothing helps"
    )
    assert r["label"] == "elevated_stress_signals"
    assert r["confidence"] >= 0.60


def test_heuristic_mild_stress_text():
    r = model_client._local_heuristic("I've been a bit worried and tired lately")
    assert r["label"] in ("mild_stress_signals", "neutral")


def test_heuristic_mixed_signals():
    r = model_client._local_heuristic(
        "I had a great day at work but I'm so anxious about tomorrow"
    )
    assert r["label"] == "mixed_signals"


def test_heuristic_neutral_no_signal():
    r = model_client._local_heuristic("the quick brown fox jumps over the lazy dog")
    assert r["label"] == "neutral"
    assert r["confidence"] <= 0.72


def test_heuristic_grey_area_im_fine():
    r = model_client._local_heuristic("I'm fine, I guess. Could be worse.")
    # Should not be elevated stress
    assert r["label"] not in ("elevated_stress_signals", "low_stress_signals")
    # Confidence should be conservatively low
    assert r["confidence"] <= 0.72


def test_heuristic_negation_flips_stress():
    # "not anxious" should NOT produce elevated_stress_signals
    r = model_client._local_heuristic("I am not anxious at all, feeling quite settled")
    assert r["label"] != "elevated_stress_signals"


def test_heuristic_negation_flips_positive():
    # "not happy" should not score as positive
    r = model_client._local_heuristic("I'm not happy, not feeling great either")
    assert r["label"] not in ("low_stress_signals",)


def test_heuristic_intensifier_boosts_confidence():
    mild   = model_client._local_heuristic("I feel stressed")
    strong = model_client._local_heuristic("I feel extremely stressed")
    assert strong["confidence"] >= mild["confidence"]


def test_heuristic_diminisher_lowers_confidence():
    base     = model_client._local_heuristic("I feel stressed")
    diminish = model_client._local_heuristic("I feel a little stressed")
    assert diminish["confidence"] <= base["confidence"]


def test_heuristic_short_text_lowers_confidence():
    short = model_client._local_heuristic("sad")
    long_  = model_client._local_heuristic(
        "I have been feeling really sad and lonely every single day this week"
    )
    assert long_["confidence"] >= short["confidence"]


def test_heuristic_phrase_pattern_beats_keywords():
    # "can't sleep" is a phrase pattern and should produce at least mild stress
    r = model_client._local_heuristic("I can't sleep")
    assert r["label"] in ("mild_stress_signals", "elevated_stress_signals", "mixed_signals")


def test_call_model_returns_valid_shape():
    result = model_client.call_model("I feel a little anxious about the meeting")
    assert isinstance(result, dict)
    assert "label" in result
    assert "confidence" in result
    assert 0.0 <= float(result["confidence"]) <= 1.0
