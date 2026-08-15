# Person A — Backend + Model Build Guide

Follow this top to bottom. Tests already exist in `backend/tests/` — your job is to make them pass, in the order below. Don't skip ahead; each file depends on the one before it existing.

---

## 0. Setup (15 min)

```bash
cd backend
pip install fastapi uvicorn pytest httpx --break-system-packages
mkdir -p app
touch app/__init__.py
```

Run the tests now, on purpose, and watch them fail:
```bash
python -m pytest tests/ -q
```
You should see `ModuleNotFoundError: No module named 'app.main'`. That's correct — this is your starting line, not a bug.

**Before writing any code**, sync with Person B on the API contract (already written in `TDD-SHEET.md` and the earlier spec sheet). Don't change response field names once you've agreed — Person B is building against these exact keys.

---

## 1. Get the model reachable first (hour 1–3, before touching `app/`)

Do this before writing `model_client.py` for real, because it's the slowest, most failure-prone step and you want to de-risk it early.

1. Create a Hugging Face Space (Gradio SDK).
2. Load `NEU-HAI/mental-alpaca` — for the hackathon, use a 4-bit GGUF quant (e.g. search `mradermacher/mental-alpaca-GGUF` on HF) served via `llama.cpp` inside the Space, not the full-precision model — full precision needs ~27GB VRAM which free Spaces don't have.
3. Expose a simple Gradio function: text in → `{label, confidence}` out.
4. Confirm it works with a raw request before writing any FastAPI code:
   ```bash
   curl -X POST https://YOUR-SPACE.hf.space/run/predict -H "Content-Type: application/json" -d '{"data": ["I feel stressed about work"]}'
   ```

**If this eats more than 3 hours, stop and use the fallback**: a keyword/sentiment stub in `model_client.py` that returns a plausible label. Write it down in `KNOWN_LIMITATIONS.md` and move on — the safety layer and API contract matter more to the demo than the model being "real."

---

## 2. `app/safety.py` — make `test_safety.py` green

```bash
python -m pytest tests/test_safety.py -q
```

Build one function:
```python
def is_high_risk(text: str) -> bool:
    ...
```

Read the test file for the exact phrases it must catch and the exact behavior on `None`/empty input (must never throw — this function cannot fail open). Use a keyword/pattern list to start; you can make it fancier later if time allows, but simple and correct beats clever and late here.

---

## 3. `app/model_client.py` + `app/main.py` happy path — make `test_analyze.py -k normal` green

```bash
python -m pytest tests/test_analyze.py -k normal -q
```

`model_client.py`:
```python
def call_model(text: str) -> dict:
    # returns {"label": str, "confidence": float}
    ...
```
Start this calling your HF Space from step 1. If the Space isn't ready yet, stub it with a fixed return value — the tests use `mock_model_ok` to patch this anyway, so your stub doesn't block frontend integration.

`app/main.py`:
```python
from fastapi import FastAPI
app = FastAPI()

@app.post("/api/analyze")
def analyze(...):
    ...
```
Match the response shape in the contract exactly: `status`, `label`, `confidence`, `disclaimer`, `crisis`.

---

## 4. Wire the safety layer in — make `test_analyze.py -k crisis` green

```bash
python -m pytest tests/test_analyze.py -k crisis -q
```

In `/api/analyze`: call `is_high_risk(text)` **before** calling the model. If true, return the crisis-shaped response and skip `call_model` entirely — one test (`test_crisis_path_never_calls_the_model`) checks this directly, not just the output shape.

---

## 5. Edge cases — make the rest of `test_analyze.py` green

```bash
python -m pytest tests/test_analyze.py -q
```

Handle: empty text, text over 2000 chars, model timeout (catch `TimeoutError`, return a `status: "error"` body with HTTP 200 — don't let it 500).

---

## 6. `app/checkins.py` — make `test_checkin.py` green

```bash
python -m pytest tests/test_checkin.py -q
```

SQLite-backed, keyed by `X-Device-Id` header (no auth, no user accounts — just an anonymous per-device counter). Functions needed:
```python
def init_db(): ...
def get_schema_sql() -> str: ...
def increment(device_id: str): ...
def get_count(device_id: str) -> int: ...
```
Read `test_checkin_record_stores_no_journal_text` carefully — the schema must never have a column that could hold journal content. Count and device id only.

Wire `/api/checkins` (GET) into `main.py`, and call `checkins.increment()` inside `/api/analyze` — once per completed request, including crisis-path requests (a person reaching out during a hard moment still counts as using the tool).

---

## 7. Full suite green

```bash
python -m pytest tests/ -q
```
All tests should pass now. If something's red, re-read the test — don't guess, the assertion message tells you exactly what's expected.

---

## 8. Sync with Person B (hour 8–9)

Run the backend locally:
```bash
uvicorn app.main:app --reload --port 8000
```
Give Person B the local URL, then the deployed one once you have it. Add CORS:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```
(`*` is fine for a hackathon demo — tighten it only if you have time to spare.)

---

## 9. Deploy (hour 11–13)

Pick one: Render, Fly.io, or a second HF Space with a Docker/Gradio wrapper around FastAPI. Whichever is fastest for you — don't research this mid-hackathon, decide now and move.

Checklist before you call it done:
```
[ ] All tests green locally
[ ] Backend deployed and reachable from a public URL
[ ] CORS allows the deployed frontend origin
[ ] /api/analyze and /api/checkins both work via curl against the deployed URL
[ ] KNOWN_LIMITATIONS.md written if you used any fallback (stub model, etc.)
```

---

## 10. Rest of the hours

Keep the suite green after every change:
```bash
python -m pytest tests/ -q
```
Fix bugs Person B finds during integration. Don't add scope — if you have spare time near the end, spend it on the fairness spot-check mentioned in the original spec (run a handful of demographically varied test sentences through the real model, note anything concerning), not on new features.
