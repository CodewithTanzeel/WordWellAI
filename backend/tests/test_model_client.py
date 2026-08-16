# tests/test_model_client.py
import pytest
from app import model_client

def test_call_model_returns_dict():
    result = model_client.call_model("I feel a little anxious")
    # The real endpoint returns a dict; the stub returns the same shape.
    assert isinstance(result, dict)
    assert "label" in result
    assert "confidence" in result
    # ``confidence`` should be a float between 0 and 1
    assert 0.0 <= float(result["confidence"]) <= 1.0
