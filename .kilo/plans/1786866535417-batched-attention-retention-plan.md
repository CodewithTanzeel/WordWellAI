# Batched Attention-Retention Plan

Two implementation batches, each ending with a GitHub commit checkpoint.

## Batch A — Quick wins (no new files, mostly small edits)

**Goal:** Fix the highest-friction UX pain points in one pass without changing architecture or adding new components.

### A1. Crisis resource links (`CrisisView.tsx`)
- Change each resource `<li>` content from plain text to actual `<a>` tags.
- Use `tel:988`, `sms:741741`, and any external URLs as appropriate.
- Keep the calm serif styling; only change interactivity.
- Validation: resources are clickable/tappable; CrisisView still hides Eixy.

### A2. Loading spinner (`JournalForm.tsx`)
- Add a small pixel-art spinner or pulsing dot beside the "▶ THINKING…" button text while `isSubmitting` is true.
- Reuse existing `prefers-reduced-motion` rule in `globals.css` so the spinner respects it.
- Validation: spinner appears during submit, disappears on result/error; no layout shift.

### A3. Error focus management (`App.tsx`)
- Add a `useRef` + `useEffect` that focuses the error `<p role="alert">` when `error` becomes non-null.
- Validation: after a failed submit, screen-reader users land on the error; keyboard users see the focus ring on the error text.

### A4. ResultView actionable bridge (`ResultView.tsx`)
- After the confidence bar, add a 1-line suggestion keyed to `result.label` (e.g., "joy" → notice what brought this; "anxiety" → name one small thing you can control).
- Keep it sentence-case, 12px pixel font, muted color.
- Validation: label-to-line mapping is predictable; no crash on unexpected label values.

### A5. Hover micro-feedback (`App.tsx` + `JournalForm.tsx`)
- Add `hover:brightness-110 transition-all duration-150` to the submit button, NEW CHECK-IN button, and crisis nav link.
- Validation: hover is visible on desktop; no layout shift; `prefers-reduced-motion` still respected.

### A6. DESIGN_LOG update
- Add entries for each sub-change in Batch A, referencing this plan.

**Commit checkpoint:** `git commit -m "Batch A: crisis links, spinner, error focus, result bridge, hover feedback"`

---

## Batch B — Eixy thinking pose + waiting state (new animation states)

**Goal:** Give Eixy distinct poses for the model-call window and for long absences, reducing the "frozen" feeling during loading and increasing liveness when the user is idle.

### B1. New keyframes in `globals.css`
- `eixyThink`: slow side-to-side rock (2.2s ease-in-out infinite) — distinct from float and walk.
- `eixyWait`: very slow vertical drift with occasional head-tilt (4s ease-in-out infinite) — signals "I'm here, no rush."

### B2. New prop on `Eixy.tsx`
- Add `isThinking?: boolean` prop. When true, overrides all other poses with `animate-eixy-think`.
- `isThinking` is set from `App.tsx` during `isSubmitting`.

### B3. Waiting state logic in `Eixy.tsx`
- Add a `useEffect` with a 20s timer: if `isVisible` is true and no state change occurs for 20s, switch to `"waiting"` pose + line ("Take your time.").
- Reset timer on any prop change (`state`, `isListening`, `isThinking`).
- Validation: waiting pose doesn't steal focus; timer doesn't fire during active typing or submit.

### B4. App.tsx wiring
- Pass `isThinking={isSubmitting}` to `<Eixy>`.
- Ensure `isThinking` and `isListening` don't conflict: `isListening` takes priority over `isThinking` (user is typing → walk; submit → think; idle → wait).

### B5. DESIGN_LOG update
- Add entries for each sub-change in Batch B, referencing this plan.

**Commit checkpoint:** `git commit -m "Batch B: Eixy thinking and waiting poses"`

---

## Out of scope for this plan
- Eixy custom sprite/pose redesign (deferred per §7.7)
- Streak visualization (needs localStorage timestamp schema decision)
- Progressive onboarding flow
- Mobile real-device screenshot verification

## Validation gates
- Run `npx vitest run` before each commit.
- Verify `prefers-reduced-motion` still kills all animations in both batches.
- Verify CrisisView never shows Eixy in any batch.
