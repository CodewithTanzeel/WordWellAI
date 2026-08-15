# TDD Sheet — Sift, 20-Hour Hackathon

**Rule for both tracks:** every task starts by running the given test file and watching it fail (red), then writing the minimum code to pass (green), then a 5-minute cleanup pass (refactor) before moving on. Test files are already written below — don't skip straight to implementation.

**Setup (do this in the first 15 minutes, together):**

Backend:
```bash
pip install fastapi uvicorn pytest httpx --break-system-packages
```

Frontend:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

---

## Updated API contract (adds check-in count)

The check-in feature needs one addition to the contract locked in the earlier spec:

### `GET /api/checkins`
```json
{ "count": 4 }
```
No auth in the hackathon build — key it off a random device id stored in a cookie/localStorage, generated client-side. No text, no timestamps beyond what's needed to increment. This is intentionally the smallest possible version — a number, nothing gamified.

### `POST /api/analyze` — unchanged from before, but now also increments the check-in count as a side effect (once per completed analysis, not per keystroke).

---

## Person 1 — Backend, Test-First

Run tests from `backend/tests/`. Each file below is written to fail against empty stubs — build `app/safety.py`, `app/model_client.py`, `app/checkins.py`, `app/main.py` to turn them green, in that order.

| Hours | Red first (run this) | Then build | Green when |
|---|---|---|---|
| 0–1 | *(no tests yet — lock contract with Person 2)* | — | Contract doc agreed |
| 1–2 | `pytest tests/test_safety.py` | `app/safety.py` → `is_high_risk(text: str) -> bool` | All safety tests pass |
| 2–4 | `pytest tests/test_analyze.py -k normal` | `app/model_client.py` (stub returning a fixed label first, real HF Space call second) + `app/main.py` `/api/analyze` happy path | Normal-path tests pass |
| 4–5 | `pytest tests/test_analyze.py -k crisis` | Wire `is_high_risk` into `/api/analyze`, short-circuit before model call | Crisis-path tests pass |
| 5–6 | `pytest tests/test_analyze.py -k "error or empty or long"` | Input validation, timeout handling | Edge-case tests pass |
| 6–7 | `pytest tests/test_checkin.py` | `app/checkins.py` (SQLite increment/get, keyed by device id header) | Checkin tests pass |
| 7–8 | Full suite: `pytest` | Wire `/api/checkins` GET route, increment call inside `/api/analyze` | All green |
| 8–9 | **Sync with Person 2** — swap frontend mock for real backend | — | End-to-end manual test passes |
| 9–13 | Real HF Space integration (replace model stub with actual call), rerun full suite each change | — | Suite stays green with real model |
| 13–20 | Bug fixes as they surface from Person 2's integration; keep suite green after every fix | — | — |

---

## Person 2 — Frontend, Test-First

Run tests from `frontend/tests/`. Build `components/JournalForm.tsx`, `ResultView.tsx`, `CrisisView.tsx`, `CheckInCount.tsx` in that order.

| Hours | Red first (run this) | Then build | Green when |
|---|---|---|---|
| 0–1 | *(no tests yet — lock contract with Person 1)* | — | Contract doc agreed |
| 1–3 | `npx vitest run JournalForm.test.tsx` | `components/JournalForm.tsx` | JournalForm tests pass |
| 3–5 | `npx vitest run ResultView.test.tsx` | `components/ResultView.tsx` | ResultView tests pass |
| 5–7 | `npx vitest run CrisisView.test.tsx` | `components/CrisisView.tsx` — visually and structurally distinct from ResultView, not a text swap | CrisisView tests pass |
| 7–8 | `npx vitest run CheckInCount.test.tsx` | `components/CheckInCount.tsx` — plain count display, no streak/badge/points language | CheckInCount tests pass |
| 8–9 | **Sync with Person 1** — point the app at the real backend, mock removed | — | End-to-end manual test passes |
| 9–12 | `npx vitest run App.test.tsx` (integration, provided below) | Wire components together in `App`/page, real `fetch` calls | Integration test passes |
| 12–20 | Polish, mobile/a11y pass, deploy; keep `npx vitest run` green after every change | — | — |

---

## Sync points (unchanged from the main spec, still apply)

| Hour | What |
|---|---|
| 1 | Lock contract (now includes `/api/checkins`) |
| 8–9 | Swap mocks for the real thing on both sides |
| 15 | Full manual run-through on deployed URLs: normal entry, crisis entry, check-in count increments |
| 18 | Feature freeze |

---

## Guardrail baked into the tests, not just the design doc

`CheckInCount.test.tsx` and `test_checkin.py` both assert the *absence* of streak/points/badge language and any punitive framing. That's deliberate — it's the cheapest way to make sure the "keep it non-gamified" decision survives contact with 2am hackathon energy. If a future you tries to add a streak counter under time pressure, the test fails and says why.
