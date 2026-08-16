# WordWellAI Full Integration Guide

This guide explains how to integrate the Hugging Face Space model with the WordWellAI backend and frontend.

## Architecture Overview

```
Frontend (Next.js + React)
    ↓
Backend (FastAPI + Uvicorn)
    ↓
Model Pipeline (in order of priority):
  1. Hugging Face Space (gradio-client)
  2. LM Studio (OpenAI-compatible endpoint)
  3. Local heuristic fallback
```

## Setup

### 1. Install Backend Dependencies

```bash
cd WordWellAI
python -m pip install -r requirements.txt
```

### 2. Environment Variables

Set these in your `.env` file or shell:

```bash
# Hugging Face Space integration
HF_SPACE_URL=warishabilal05/my-lfm25-demo
HF_TOKEN=your_hugging_face_token_here

# Optional: LM Studio (if running locally)
MODEL_URL=http://localhost:1234

# Optional: API key for backend authentication
API_KEY=your_api_key_here
```

### 3. Run the Backend

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will try to use the Space model first, then LM Studio, then fall back to the local heuristic.

### 4. Run the Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## How It Works

### Request Flow

1. **User submits journal entry** in the frontend
2. **Frontend sends POST to `/api/analyze`** with device ID and text
3. **Backend processes**:
   - Validates text (length, non-empty)
   - Records check-in count
   - Runs safety filter (crisis detection)
   - If safe, calls the model pipeline
4. **Model pipeline** (tries in order):
   - ✅ **Hugging Face Space** (if `HF_SPACE_URL` set)
     - Calls `warishabilal05/my-lfm25-demo` via gradio-client
     - Expects JSON response: `{"label": "...", "confidence": ...}`
   - ✅ **LM Studio** (if `MODEL_URL` set)
     - Calls OpenAI-compatible endpoint
     - Sends system prompt + user text
   - ✅ **Local Heuristic** (always available)
     - Pattern matching + keyword scoring
     - No external dependencies
5. **Backend returns result** with label and confidence
6. **Frontend displays result** with appropriate UI

### Response Format

All model calls return:
```json
{
  "label": "low_stress_signals|mild_stress_signals|mixed_signals|elevated_stress_signals|neutral",
  "confidence": 0.0-1.0
}
```

### Valid Labels

- `low_stress_signals` — clearly positive, settled, content
- `mild_stress_signals` — mild worry, tiredness, or low mood; not alarming
- `mixed_signals` — genuine mix of positive and distress cues
- `neutral` — no clear emotional signal
- `elevated_stress_signals` — clear distress, anxiety, burnout, or persistent low mood

## Testing

### Test the Space Directly

```bash
# From the root directory
python hf_token.py
```

This tests the gradio-client connection to the Space.

### Test the Backend

```bash
cd backend
python -m pytest
```

All tests should pass with any model (Space, LM Studio, or local heuristic).

### Test the Full Pipeline

1. Start the backend: `uvicorn app.main:app --reload`
2. Start the frontend: `npm run dev`
3. Submit a journal entry in the UI
4. Check backend logs to see which model was used

## Troubleshooting

### Issue: "Unable to initialize Gradio Client"
**Solution**: Ensure `HF_SPACE_URL` is set and the Space is live.

```bash
echo $HF_SPACE_URL  # Should output: warishabilal05/my-lfm25-demo
```

### Issue: "Model timeout or error"
**Solution**: The Space is likely unavailable or the backend can't reach it. The system will automatically fall back to LM Studio or the local heuristic.

### Issue: Backend returns error
**Solution**: Check backend logs. The local heuristic should still work as a fallback.

```bash
tail -f backend_err.log
```

## Deployment

### Push the Space to Hugging Face

```bash
cd hf-space-demo
hf auth login
git init
git add .
git commit -m "WordWellAI LFM2.5-2.6B Classification Space"
git remote add origin https://huggingface.co/warishabilal05/my-lfm25-demo
git push --set-upstream origin main
```

### Deploy the Backend

Use any of these:
- **Fly.io**: `flyctl deploy`
- **Render**: Connect GitHub repo to Render
- **Heroku**: `git push heroku main`
- **Docker**: Build and deploy container

### Set Environment Variables on Production

```bash
# On Fly.io
flyctl secrets set HF_SPACE_URL=warishabilal05/my-lfm25-demo HF_TOKEN=your_token

# On Render
# Add secrets in the Render dashboard
```

## Files Modified for Integration

- `backend/app/model_client.py` — Added `_call_hf_space()` function
- `hf-space-demo/app.py` — Updated to return proper JSON
- `requirements.txt` — Added `gradio-client`
- `hf_token.py` — Test script for Space connectivity

## Next Steps

1. ✅ Confirm HF Space is live
2. ✅ Set `HF_SPACE_URL` and `HF_TOKEN` environment variables
3. ✅ Run backend tests: `pytest`
4. ✅ Start backend and frontend
5. ✅ Submit journal entry to test end-to-end
6. ✅ Deploy to production

---

**Questions?** Check the backend logs or run `hf_token.py` to debug.
