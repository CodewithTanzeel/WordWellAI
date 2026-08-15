import os
import pytest
from fastapi.testclient import TestClient

# These imports are expected to fail until Person 1 builds app/main.py,
# app/safety.py, app/model_client.py, app/checkins.py.
# That failure is the intended starting "red" state.
from app.main import app  # noqa: E402
from app import checkins  # noqa: E402


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def fresh_checkin_db(tmp_path, monkeypatch):
    """Point the checkin store at a throwaway sqlite file for every test,
    so tests never share state or touch a real db."""
    test_db_path = tmp_path / "test_checkins.db"
    monkeypatch.setattr(checkins, "DB_PATH", str(test_db_path))
    checkins.init_db()
    yield
    if os.path.exists(test_db_path):
        os.remove(test_db_path)


@pytest.fixture()
def mock_model_ok(monkeypatch):
    """Stub the HF Space call so analyze tests don't depend on network."""
    from app import model_client

    def fake_call_model(text: str):
        return {"label": "elevated_stress_signals", "confidence": 0.78}

    monkeypatch.setattr(model_client, "call_model", fake_call_model)


@pytest.fixture()
def mock_model_timeout(monkeypatch):
    from app import model_client

    def fake_call_model(text: str):
        raise TimeoutError("model call timed out")

    monkeypatch.setattr(model_client, "call_model", fake_call_model)


@pytest.fixture()
def device_headers():
    return {"X-Device-Id": "test-device-abc123"}
