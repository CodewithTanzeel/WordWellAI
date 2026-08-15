import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import model_client

@pytest.fixture(scope="function")
def client():
    """Provide a fresh TestClient for each test."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def device_headers():
    """Headers containing a default device identifier used by the checkin API."""
    return {"X-Device-Id": "test-device"}

@pytest.fixture(scope="function")
def mock_model_ok(monkeypatch):
    """Patch model_client.call_model to return a successful stub response."""
    def fake_call_model(_text: str):
        return {"label": "elevated_stress_signals", "confidence": 0.78}
    monkeypatch.setattr(model_client, "call_model", fake_call_model)
    yield

@pytest.fixture(scope="function")
def mock_model_timeout(monkeypatch):
    """Patch model_client.call_model to raise a timeout/exception for testing error handling."""
    def fake_call_model(_text: str):
        raise Exception("model timeout")
    monkeypatch.setattr(model_client, "call_model", fake_call_model)
    yield
