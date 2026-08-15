# app/model_client.py
import httpx

def call_model(text: str) -> dict:
    """Call the HuggingFace Space model.

    Returns a dict with ``label`` and ``confidence`` keys.
    Falls back to a deterministic stub on any error.
    """
    try:
        response = httpx.post(
            "https://YOUR-SPACE.hf.space/run/predict",
            json={"data": [text]},
            timeout=10.0,
        )
        payload = response.json()
        # Expected shape: {"data": [{"label": ..., "confidence": ...}]}
        if isinstance(payload, dict) and "data" in payload:
            first = payload["data"][0]
            return {"label": first.get("label"), "confidence": first.get("confidence")}
    except Exception:
        # Any failure – fall back to static stub.
        pass
    return {"label": "elevated_stress_signals", "confidence": 0.78}