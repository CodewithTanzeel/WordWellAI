# Mental-LLM Web App — 20-Hour Hackathon Spec Sheet

**Goal:** Ship a working website where a user types a journal entry, gets a mental-health-signal prediction from Mental-Alpaca/Mental-FLAN-T5, and — if high-risk language is detected — sees crisis resources instead of (or alongside) the raw model output.

**Non-negotiable framing:** This is a *screening/reflection tool*, never a diagnosis. That language goes in the UI, the README, and the model prompt itself.

---

## 0. MVP Scope (cut everything else)

| In scope | Cut for hackathon |
|---|---|
| Single free-text input → single prediction (e.g. stress / depression severity) | Multi-task selection, account system |
| One model, one task, hosted via HF Space | Fine-tuning your own model live |
| Rule-based crisis keyword/signal check before rendering result | ML-based risk classifier as a separate model |
| SQLite logging of requests (no PII beyond the text itself) | Postgres, auth, user history dashboard |
| Deployed to Vercel (frontend) + Render/Fly/HF Space (backend) | Docker/K8s, CI/CD pipelines, monitoring stack |

If you have time left after both tracks converge, promote items from the right column — not before.

---

## 1. Architecture (locked at hour 0, do not change mid-hackathon)

```
User (browser)
   │
   ▼
Next.js + Tailwind frontend  (Vercel)
   │  POST /api/analyze  { text: string }
   ▼
FastAPI backend  (Render/Fly.io/HF Space)
   │  - safety pre-check (keyword/pattern rules)
   │  - if high-risk → short-circuit, return crisis payload
   │  - else → call model endpoint
   │  - log to SQLite
   ▼
HF Space (Gradio) running Mental-Alpaca (4-bit GGUF, llama.cpp)
   │  POST /run/predict  { text }
   ▼
Returns { label, confidence }
```

**Why this shape:** the heavy model never touches your laptops. Person 1 stands up the HF Space once, gets a stable public URL, and both of you build against it. This is what makes parallel work possible.

---

## 2. The API Contract — lock this at Hour 1, before splitting up

This is the single most important artifact for working in parallel. Once agreed, Person 2 can mock it and build the entire frontend without ever waiting on Person 1's backend being "done."

### `POST /api/analyze`

**Request:**
```json
{ "text": "string, 1-2000 chars" }
```

**Response (normal case):**
```json
{
  "status": "ok",
  "label": "elevated_stress_signals",
  "confidence": 0.78,
  "disclaimer": "This is not a diagnosis. If you're struggling, please talk to a professional.",
  "crisis": false
}
```

**Response (high-risk case — safety layer fired):**
```json
{
  "status": "ok",
  "label": null,
  "confidence": null,
  "crisis": true,
  "message": "It sounds like you might be going through something serious.",
  "resources": [
    { "name": "988 Suicide & Crisis Lifeline (US)", "contact": "call or text 988" },
    { "name": "Crisis Text Line", "contact": "text HOME to 741741" },
    { "name": "International Association for Suicide Prevention", "contact": "https://www.iasp.info/resources/Crisis_Centres/" }
  ]
}
```

**Error:**
```json
{ "status": "error", "message": "string" }
```

Person 2 should hardcode both success shapes as fixtures and build the whole UI (including the crisis-mode UI, which is a *different visual state*, not just different text) before the real backend is ready.

---

## 3. Person 1 — Model + Backend Track

**Owns:** HF Space, FastAPI service, safety layer, SQLite logging, backend deploy.

| Hours | Task | Done when |
|---|---|---|
| 0–1 | Lock API contract with Person 2 (section 2 above) | Both agree, contract written down |
| 1–3 | Stand up HF Space: Gradio app loading Mental-Alpaca 4-bit GGUF via llama.cpp (or mental-flan-t5 if GPU Space available) | Space has a public URL, returns a prediction via curl |
| 3–5 | FastAPI skeleton: `/api/analyze` endpoint, calls the Space, returns contract-shaped JSON | `curl localhost:8000/api/analyze` round-trips |
| 5–7 | Safety layer: keyword/regex pre-check (self-harm, suicide, crisis language) that short-circuits before the model call | Feed it 5 known high-risk test strings → all return `crisis: true` |
| 7–8 | SQLite logging (timestamp, input text, output label, crisis flag — no user identifiers) | Rows appear in DB after requests |
| 8–9 | **Sync point with Person 2** — connect real backend to real frontend, kill the mock | End-to-end request works from the live frontend |
| 9–11 | Error handling: model timeout, empty input, rate limiting (basic) | Bad inputs don't 500 |
| 11–13 | CORS, env config, deploy backend (Render/Fly/HF Space) | Backend reachable from deployed frontend, not just localhost |
| 13–15 | Buffer / fairness spot-check: run a handful of demographically varied test sentences, note anything alarming in a `KNOWN_LIMITATIONS.md` | Documented, not necessarily fixed |
| 15–18 | Bug fixes from integration testing with Person 2 | — |
| 18–20 | Final demo rehearsal, README, submission | — |

**Fallback if the Space/model setup eats too much time:** stub `/api/analyze` to return a canned response keyed off simple sentiment (even a basic keyword scorer) so the *product* still demos end-to-end. Label it clearly as a fallback in the README — judges respect honesty about scope cuts far more than a broken "real" demo.

---

## 4. Person 2 — Frontend Track

**Owns:** Next.js app, UI/UX, crisis-mode UI, frontend deploy.

| Hours | Task | Done when |
|---|---|---|
| 0–1 | Lock API contract with Person 1 | Same as above |
| 1–2 | Next.js + Tailwind scaffold, basic page: textarea + submit button | Renders locally |
| 2–4 | Mock `/api/analyze` (local JSON fixtures matching the contract, both normal and crisis shapes) | Frontend fully clickable against mock data |
| 4–6 | Build the **normal result** UI: label, confidence, disclaimer, "not a diagnosis" framing | Looks finished with mock data |
| 6–8 | Build the **crisis-mode** UI: distinct visual treatment (not just a text swap — calmer colors, resource list, no confidence/label shown), loading and error states | Looks finished with mock data |
| 8–9 | **Sync point with Person 1** — swap mock for real endpoint | Live requests hit the real backend |
| 9–12 | Polish: mobile responsiveness, accessibility (labels, contrast, focus states — this app will be used by people in distress, accessibility isn't optional here) | Passes a basic mobile + screen-reader pass |
| 12–14 | Landing/about section: what this is, what it isn't, link to the paper, link to crisis resources always-visible in footer (not just on trigger) | Present on every page |
| 14–16 | Deploy to Vercel, connect to deployed backend, test cross-origin | Public URL works end-to-end |
| 16–18 | Bug fixes from integration testing | — |
| 18–20 | Final demo rehearsal, screenshots for submission | — |

**Fallback if design polish runs long:** cut the landing/about page content down to 3 sentences and a resources link — never cut the crisis-mode visual distinction or the disclaimer. Those are the parts a judge (and a real user) will notice first.

---

## 5. Sync Points (both people, same room/call)

| Hour | What happens |
|---|---|
| 1 | Lock the API contract. Nobody starts building until this is agreed. |
| 8–9 | First real integration — swap mock for live backend. Budget this as its own block, integration always takes longer than expected. |
| 15 | Mid-late check: does the demo path (type text → see result → type crisis text → see resources) work end-to-end, live, on the deployed URLs? |
| 18 | Feature freeze. From here it's bugs and demo prep only. |

---

## 6. What NOT to build in 20 hours

- Your own fine-tuning run (use the pre-trained Mental-Alpaca/Mental-FLAN-T5 as-is)
- User accounts, auth, history
- Multi-task selection (stick to one task/label type)
- A custom risk-classifier model — a keyword/rule-based safety net is faster to build, easier to audit, and more predictable than training or prompting a second model under time pressure
- Real-time streaming responses — a simple request/response loop is enough

---

## 7. Corrections carried over from the architecture review

- `bitsandbytes` repo is `github.com/bitsandbytes-foundation/bitsandbytes` (not `bitnn/bitsandbytes`)
- Mental-Alpaca needs ~27GB and Mental-FLAN-T5 needs ~44GB VRAM to load at full precision — this is exactly why the Space/backend split matters; nobody should try to load these locally on a laptop. Use the pre-quantized 4-bit GGUF build for anything running outside a proper GPU Space.

---

## 8. Demo script (write this by hour 18)

1. Show the landing page, explain the "not a diagnosis" framing in one sentence.
2. Type a neutral journal entry → show the prediction + confidence + disclaimer.
3. Type a high-risk entry → show the crisis-mode UI firing instead of a label.
4. One sentence on the architecture (cloud model, thin client) and one on why that matters for a mental-health tool (privacy, no local storage of sensitive predictions beyond the log).
