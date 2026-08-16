# tests/test_model_client_mock.py
import pytest, json
from unittest import mock
from app import model_client

def test_call_model_requests_correct_payload(monkeypatch):
    # Capture the arguments passed to httpx.post
    captured = {}

    def fake_post(url, json=None, timeout=None):
        captured["url"] = url
        captured["json"] = json
        captured["timeout"] = timeout
        # Return a minimal object mimicking httpx.Response
        class DummyResp:
            def json(self):
                return {"label": "neutral", "confidence": 0.99}
        return DummyResp()

    monkeypatch.setattr("httpx.post", fake_post)

    text = "Testing model input"
    model_client.call_model(text)

    assert captured["url"] == "https://YOUR-SPACE.hf.space/run/predict"
    # The API expects a list under the ``data`` key
    assert captured["json"] == {"data": [text]}
    assert captured["timeout"] == 10.0
