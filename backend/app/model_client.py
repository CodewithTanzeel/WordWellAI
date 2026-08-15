# app/model_client.py
import httpx

def call_model(text: str) -> dict:
    # If HF space isn't ready, return this stub:
    # return {"label": "elevated_stress_signals", "confidence": 0.78}
    
    # Real implementation (wrap in try/except for timeouts):
    response = httpx.post(
        "https://YOUR-SPACE.hf.space/run/predict", 
        json={"data": [text]},
        timeout=10.0
    )
    # Parse and return the HF response here
    pass