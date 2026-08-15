from fastapi import FastAPI, Request, HTTPException
from app.safety import is_high_risk
import app.model_client as model_client
from app import checkins

app = FastAPI()

@app.on_event("startup")
def startup():
    checkins.init_db()



@app.post("/api/analyze")
def analyze(request: Request, payload: dict):
    """Analyze user text, apply safety filter, call model, and record a check‑in.

    * ``payload`` must contain a ``text`` key.
    * ``X-Device-Id`` header identifies the device (defaults to ``"anonymous"``).
    """
    text = payload.get("text", "")
    device_id = request.headers.get("X-Device-Id", "anonymous")
    # Validation
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")
    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="Text exceeds length limit")
    
    # Record the interaction (both normal and crisis paths count as a check‑in)
    checkins.increment(device_id)

    # 1️⃣ Safety check – short‑circuit on high‑risk content
    if is_high_risk(text):
        return {
            "status": "ok",
            "label": None,
            "confidence": None,
            "crisis": True,
            "message": "It sounds like you might be going through something serious.",
            "resources": [
                {"name": "988 Suicide & Crisis Lifeline", "contact": "call or text 988"}
            ],
        }

    # 2️⃣ Model call – may raise; we handle gracefully
    try:
        result = model_client.call_model(text)
        return {
            "status": "ok",
            "label": result["label"],
            "confidence": result["confidence"],
            "disclaimer": "This is not a diagnosis. If you're struggling, please talk to a professional.",
            "crisis": False,
        }
    except Exception:
        return {"status": "error", "message": "Model timeout or error"}

@app.get("/api/checkins")
def get_checkins(request: Request):
    """Return the current check‑in count for the device identified by ``X-Device-Id``.
    The response schema matches the tests: ``{"count": <int>}``.
    """
    device_id = request.headers.get("X-Device-Id", "anonymous")
    return {"count": checkins.get_count(device_id)}

# Ensure DB is cleared on app shutdown to isolate tests
@app.on_event("shutdown")
def shutdown():
    """Delete the SQLite DB file on shutdown so each test starts fresh."""
    import os
    if os.path.exists("checkins.db"):
        os.remove("checkins.db")