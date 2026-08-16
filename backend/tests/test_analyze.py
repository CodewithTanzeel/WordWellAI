import pytest


# ---- normal path ----

def test_normal_input_returns_ok_with_label_and_confidence(client, mock_model_ok, device_headers):
    resp = client.post("/api/analyze", json={"text": "work has been stressful lately"}, headers=device_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["crisis"] is False
    assert isinstance(body["label"], str)
    assert 0.0 <= body["confidence"] <= 1.0


def test_normal_response_matches_contract_shape(client, mock_model_ok, device_headers):
    resp = client.post("/api/analyze", json={"text": "feeling okay today"}, headers=device_headers)
    body = resp.json()
    for key in ("status", "label", "confidence", "disclaimer", "crisis"):
        assert key in body


def test_normal_response_includes_disclaimer_text(client, mock_model_ok, device_headers):
    resp = client.post("/api/analyze", json={"text": "feeling okay today"}, headers=device_headers)
    assert "not a diagnosis" in resp.json()["disclaimer"].lower()

def test_analyze_uses_model_input(client, capture_model_call, device_headers):
    client.post(
        "/api/analyze",
        json={"text": "my feeling"},
        headers=device_headers,
    )
    assert capture_model_call["text"] == "my feeling"

# ---- crisis path ----

def test_high_risk_input_returns_crisis_true(client, device_headers):
    resp = client.post(
        "/api/analyze",
        json={"text": "I don't want to be alive anymore"},
        headers=device_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["crisis"] is True
    assert body["status"] == "ok"


def test_crisis_response_excludes_label_and_confidence(client, device_headers):
    resp = client.post(
        "/api/analyze",
        json={"text": "I have a plan to hurt myself"},
        headers=device_headers,
    )
    body = resp.json()
    assert body["label"] is None
    assert body["confidence"] is None


def test_crisis_response_includes_resources_list(client, device_headers):
    resp = client.post(
        "/api/analyze",
        json={"text": "I've been thinking about ending it all"},
        headers=device_headers,
    )
    body = resp.json()
    assert isinstance(body["resources"], list)
    assert len(body["resources"]) >= 1
    assert "name" in body["resources"][0]
    assert "contact" in body["resources"][0]


def test_crisis_path_never_calls_the_model(client, monkeypatch, device_headers):
    from app import model_client

    called = {"hit": False}

    def fake_call_model(text):
        called["hit"] = True
        return {"label": "x", "confidence": 0.5}

    monkeypatch.setattr(model_client, "call_model", fake_call_model)

    client.post("/api/analyze", json={"text": "I want to end it all"}, headers=device_headers)
    assert called["hit"] is False, "model must never be called on a high-risk input"


# ---- edge cases / errors ----

def test_empty_text_returns_error(client, device_headers):
    resp = client.post("/api/analyze", json={"text": ""}, headers=device_headers)
    assert resp.status_code in (400, 422)


def test_text_over_length_limit_returns_error(client, device_headers):
    resp = client.post("/api/analyze", json={"text": "a" * 5000}, headers=device_headers)
    assert resp.status_code in (400, 422)


def test_model_timeout_returns_graceful_error_not_500(client, mock_model_timeout, device_headers):
    resp = client.post("/api/analyze", json={"text": "a normal low-risk entry"}, headers=device_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "error"
    assert "message" in body
