# Person B — Frontend Build Guide

Follow this top to bottom. Tests already exist in `frontend/tests/` — your job is to make them pass, in the order below.

---

## 0. Setup (15 min)

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
mkdir -p components
```

Copy `vitest.config.ts` and `tests/setup.ts` from this bundle into your project root / tests folder if they're not already there.

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Run the tests now, on purpose:
```bash
npx vitest run tests/JournalForm.test.tsx
```
You should get a "failed to resolve import" error for `../components/JournalForm`. That's correct — nothing exists yet.

**Before writing any code**, sync with Person A on the API contract (in `TDD-SHEET.md`). You're about to build the entire UI against mocked responses shaped exactly like what the real backend will return — get those shapes right now so you don't rework components later.

---

## 1. `components/JournalForm.tsx` — make `JournalForm.test.tsx` green

```bash
npx vitest run tests/JournalForm.test.tsx
```

Props the test expects:
```tsx
type Props = {
  onSubmit: (text: string) => void;
  isSubmitting?: boolean;
};
export function JournalForm({ onSubmit, isSubmitting }: Props) { ... }
```
Needs: a `<textarea>`, a submit `<button>`, disabled when empty or over 2000 chars (with a visible message), disabled + loading text when `isSubmitting`.

---

## 2. `components/ResultView.tsx` — make `ResultView.test.tsx` green

```bash
npx vitest run tests/ResultView.test.tsx
```

```tsx
type Result = {
  status: "ok";
  label: string;
  confidence: number;
  disclaimer: string;
  crisis: false;
};
export function ResultView({ result }: { result: Result }) { ... }
```
Show the label, confidence as a rounded percentage (`0.78` → `"78%"`), and the disclaimer text always visible — never hidden behind a tooltip or "read more."

---

## 3. `components/CrisisView.tsx` — make `CrisisView.test.tsx` green

```bash
npx vitest run tests/CrisisView.test.tsx
```

```tsx
type CrisisResult = {
  crisis: true;
  message: string;
  resources: { name: string; contact: string }[];
};
export function CrisisView({ result }: { result: CrisisResult }) { ... }
```
Requirements from the tests, don't skip these:
- Root container needs `data-testid="crisis-panel"`
- Needs `role="alert"` so screen readers announce it immediately
- No label, no confidence, no percentage anywhere
- This is a **different component with different styling**, not `ResultView` with a text swap — calmer colors, no confidence chrome, resource list front and center

---

## 4. `components/CheckInCount.tsx` — make `CheckInCount.test.tsx` green

```bash
npx vitest run tests/CheckInCount.test.tsx
```

```tsx
export function CheckInCount({ count }: { count: number }) { ... }
```
Plain language only: something like "You've checked in 3 times." At `count === 0`, welcome them — don't say "day 0" or anything streak-shaped. No progress bar, no goal number, no badge/points/streak language anywhere. The test scans your rendered output for those words and fails if it finds them — this isn't a style suggestion, it's enforced.

---

## 5. Sync with Person A (hour 8–9)

Get the real backend URL. Set it as an env var:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Swap any mock `fetch` calls for real ones pointed at `${process.env.NEXT_PUBLIC_API_URL}/api/analyze` and `/api/checkins`. You'll also need a device id — generate a random string once and store it (e.g. `localStorage`), send it as the `X-Device-Id` header on every request.

---

## 6. Wire it together — make `App.test.tsx` green

```bash
npx vitest run tests/App.test.tsx
```

Build the top-level `App` (or your page component, exported as `App` to match the test import) that:
1. Fetches `/api/checkins` on mount and renders `<CheckInCount>`
2. Renders `<JournalForm>` and on submit, POSTs to `/api/analyze`
3. Based on the response's `crisis` field, renders either `<ResultView>` or `<CrisisView>`
4. Refetches `/api/checkins` after a successful submit so the count updates

---

## 7. Polish (hour 9–14, budget your time)

In priority order — stop and move to deploy once you run low on time, don't let polish eat the deploy window:
1. Mobile responsiveness (this is a website — test on an actual phone width)
2. Accessibility: labels on the textarea, visible focus states, sufficient color contrast — this app may be used by people in distress, this isn't optional
3. Always-visible crisis resources link in the footer (not just on trigger)
4. Landing/about copy: what this is, what it isn't, 3 sentences max

---

## 8. Deploy (hour 14–16)

```bash
npx vercel
```
Set `NEXT_PUBLIC_API_URL` to Person A's deployed backend URL in Vercel's environment variables. Confirm CORS is working by actually submitting an entry on the deployed site, not just checking it builds.

Checklist before you call it done:
```
[ ] All tests green locally (npm test)
[ ] Frontend deployed and reachable from a public URL
[ ] Points at the real deployed backend, not localhost
[ ] Normal entry → ResultView renders correctly, live
[ ] High-risk entry → CrisisView renders correctly, live
[ ] Check-in count increments after a real submit
[ ] Works on a phone-width viewport
```

---

## 9. Rest of the hours

Keep the suite green after every change:
```bash
npm test
```
Fix bugs found during integration testing with Person A. Rehearse the demo script (in the earlier spec) at least once before presenting.
