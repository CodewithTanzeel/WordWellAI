# Sift — UX/UI Improvement Plan

**Status:** Draft for review — no code changed yet.
**Constraint:** Keep the pixel/retro-game theme exactly as-is (tokens, fonts, palette, crisis-screen break-in-tone). This is a *polish and usability* pass, not a redesign.
**Scope:** `frontend/App.tsx`, `frontend/components/*`, `frontend/app/globals.css`

---

## How this is organized

Six categories, each with: the problem, why it matters, the fix (within the existing theme), and priority. Priority is about UX impact, not effort.

---

## 1. Flow & Interaction (Highest priority)

### 1.1 No way to submit a new entry after seeing a result
**Problem:** After `ResultView` or `CrisisView` renders, there's no button to clear and write again. The user has to manually delete the textarea contents.
**Why it matters:** This is a check-in tool — repeat use is the whole point. Right now the "loop" is broken.
**Fix:** Add a "Write another entry" / "▶ NEW CHECK-IN" button below both `ResultView` and `CrisisView` that clears `result`, clears the textarea, and refocuses it.
**Priority:** High

### 1.2 No scroll/focus management after submit
**Problem:** On mobile especially, after submitting, the result panel renders below the fold — user doesn't know something happened unless they scroll.
**Why it matters:** Silent state changes are disorienting, worse in a moment someone's already anxious about what the app will say.
**Fix:** On result/crisis render, scroll the panel into view (`scrollIntoView({ behavior: reduced-motion-safe })`) and move focus to it (`tabIndex={-1}` + `.focus()`) so both sighted and screen-reader users land on it immediately.
**Priority:** High — especially critical for `CrisisView`, where `role="alert"` announces it but doesn't move visual focus for sighted keyboard users.

### 1.3 Abrupt state jump-cuts
**Problem:** Empty → Result and Empty → Crisis currently just pop in with no transition.
**Why it matters:** A sudden appearance/disappearance reads as glitchy, especially for the crisis state where calm presentation matters most.
**Fix:** Simple fade/slide-in (150–200ms, respecting `prefers-reduced-motion`, which `globals.css` already handles globally). No theme change — just easing an existing cut.
**Priority:** Medium

### 1.4 Loading feedback is text-only
**Problem:** Submit button says "▶ THINKING…" but nothing else in the UI signals a request is in flight.
**Fix:** Subtle pixel-style loading indicator (e.g. blinking cursor block or animated segment bar reusing the `ResultView` segment style) near the form. Keep it optional/low-priority — text change may be sufficient, but worth testing.
**Priority:** Low

---

## 2. Accessibility (Highest priority — mental-health tool, non-negotiable per project's own guides)

### 2.1 Pixel font legibility floor
**Problem:** `Press Start 2P` is used at 9–11px in several places (`CheckInCount` at 9px, nav links at 9px, `ResultView` label at 10px). Pixel/blocky fonts are already harder to read than normal type; at sub-12px sizes this compounds for low-vision users or anyone reading on a phone in poor light.
**Fix:** Establish a minimum of 12px for any `.font-pixel` text used for actual content (not pure decoration). Increase line-height slightly where needed. Theme/typeface stays identical — just sizing.
**Priority:** High

### 2.2 Contrast audit
**Problem:** `--muted: #8b8b96` on `--paper: #f4f1ea` (used for the disclaimer text in `ResultView`) and `--muted` on `--bg-game: #0f0f14` (used for the intro paragraph in `App.tsx`) both need a contrast check — likely borderline or failing WCAG AA for body text.
**Fix:** Run actual contrast checks; if failing, shift `--muted` darker/lighter within the existing color family (same hue, adjusted lightness) rather than introducing a new color.
**Priority:** High

### 2.3 Button focus state
**Problem:** The submit button (`pixel-border-pink`) has no explicit `focus-visible` treatment — it relies on the browser default outline, which may not read clearly against the pink background.
**Fix:** Add a visible `focus-visible` ring/offset consistent with the textarea's existing pink focus ring treatment.
**Priority:** Medium

### 2.4 Touch target sizing
**Problem:** Need to verify nav links, footer link, and any small buttons meet the ~44×44px minimum touch target on mobile.
**Fix:** Add padding where needed without changing visual size of the text itself (invisible hit-area padding).
**Priority:** Medium

---

## 3. Visual Hierarchy & Polish

### 3.1 Result vs. Crisis panel entrance feels identical in weight
**Problem:** Both panels currently just appear in the same spot with the same amount of visual "announcement." Crisis should feel like it interrupts more gently but clearly.
**Fix:** Combine with 1.3 (transition) — crisis panel gets a slightly slower, softer entrance; normal result can be quicker/snappier, reinforcing the intentional tonal split the CSS comments already describe.
**Priority:** Medium

### 3.2 Check-in count is visually disconnected
**Problem:** `CheckInCount` sits alone below the result/crisis panel with no visual relationship to the rest of the page — easy to miss entirely.
**Fix:** Give it a clearer anchored position (e.g., pinned near the header, or styled as a small badge near the SIFT wordmark) so it reads as an ongoing stat, not a stray label.
**Priority:** Low–Medium

### 3.3 Spacing rhythm
**Problem:** Vertical gaps (`gap-8`, `py-16`, etc.) are consistent but not verified against real content — worth checking whether the page feels cramped or sparse once a result panel + crisis panel are both possible states.
**Fix:** Pass over spacing tokens once real content is on screen; adjust `gap`/`py` values only, no new tokens needed.
**Priority:** Low

---

## 4. Mobile Responsiveness

### 4.1 Nav bar at narrow widths
**Problem:** `SIFT` wordmark + "CRISIS RESOURCES ↓" link both live in one flex row — worth confirming they don't crowd or wrap awkwardly under ~360px.
**Fix:** Verify at 320–375px widths; adjust gap/font-size at that breakpoint only if needed.
**Priority:** Medium

### 4.2 Textarea sizing on small screens
**Problem:** `rows={6}` may take up most of the viewport on a small phone before any text is entered.
**Fix:** Consider `rows={4}` on mobile via a responsive class, expanding to 6 on larger screens.
**Priority:** Low

### 4.3 Real device test pass
**Fix:** After other fixes, do an actual pass at a phone-width viewport (this is explicitly called out as required in `PERSON-B-FRONTEND-GUIDE.md` §7 and hasn't been confirmed done yet).
**Priority:** Medium

---

## 5. Micro-interactions (within existing theme)

- Button press state already exists (`active:translate-x/y` + shadow removal) — good, keep as reference pattern.
- Consider applying the same "press" affordance to the new "Write another entry" button for consistency.
- Hover states on interactive elements (nav link, footer link) — currently none beyond underline; a subtle color shift on hover using existing accent colors would help on desktop.
**Priority:** Low (nice-to-have, do last)

---

## 6. Content & Microcopy

### 6.1 Error message legibility
**Problem:** Network/API error text uses `.font-pixel` at 10px, uppercased — same legibility issue as 2.1, and uppercased pixel font at small size is the hardest combination to read on this page.
**Fix:** Fold into 2.1's font-size floor; consider not uppercasing error text (sentence case reads faster under stress).
**Priority:** Medium

### 6.2 No retry affordance on error
**Problem:** If a request fails, the error shows but the form doesn't obviously invite a retry (button is just available again, not called out).
**Fix:** Minor — maybe just confirm the button re-enabling is sufficiently obvious; low-cost copy tweak like "Try again" as button label after an error state.
**Priority:** Low

---

## 7. Character-driven interactivity (new — addresses "feels like a boring chat UI")

**Problem:** The current flow (textarea → submit → text result) has no personality or warmth attached to it — it reads as a form, not a companion experience, despite the pixel/game theme suggesting otherwise. There's already an unused hook for this: `PixelMascot` in `App.tsx` is a static placeholder SVG that never reacts to anything (comment in code literally says "swap for the generated sprite asset later").

**Fix:** Turn the mascot into an active character named **Hixy** with three distinct states tied to the existing flow. No new screens or routes needed — same component, different message/pose per state.

### 7.1 Intro / greeting state
Shown on page load, before any text is submitted. Character + speech bubble with a short line encouraging the user to write freely and not hold back. This is the primary fix for "feels boring" — the first thing a user sees is a character talking to them, not a blank form.

**Approved copy:**
> "Hi, I'm Hixy! This box doesn't judge. Say the messy stuff, the small stuff, whatever's actually true today."

### 7.2 Positive / low-signal result state
Shown after a normal (non-crisis) result where the signal is low/mild. Character reacts warmly — the message should reinforce that noticing and naming feelings is the win, not the score itself. Avoid generic "yay you're fine" — keep it grounded.

**Approved copy:**
> "Good to hear. Thanks for putting it into words — noticing this stuff matters more than people think."

### 7.3 Elevated / negative-signal result state (still non-crisis)
Shown after a normal (non-crisis) result where the signal is elevated. Character shifts to empathetic, validating tone and gently invites another check-in later — framed as "I'm here when you want to check in again," not "try again" (which implies failure and is the wrong frame for this context).

**Approved copy:**
> "That sounds like a lot to carry. I'm glad you said it out loud instead of sitting on it. I'll be here whenever you want to check in again."

### 7.4 Hard boundary: character does NOT appear on `CrisisView`
`CrisisView` is already deliberately built to break out of the game theme entirely (calm palette, serif font, no game chrome) — see the comment already in that file. A cartoon character reacting to a crisis-level entry would undercut that intentional design decision. Character logic lives entirely in the game-themed layer (`App.tsx` / `ResultView` territory); `CrisisView` stays exactly as-is, untouched.

### 7.5 Backend contract addition needed
The current `/api/analyze` response has no field indicating severity for the non-crisis case — only `label` (free string) and `confidence` (model confidence, not severity). To pick between 7.2 and 7.3 reliably, add a minimal field to the non-crisis response shape:

```json
{
  "status": "ok",
  "label": "elevated_stress_signals",
  "confidence": 0.78,
  "disclaimer": "...",
  "crisis": false,
  "severity": "low" | "elevated"
}
```
Kept intentionally binary (matches the two reaction states) rather than a granular scale — smallest version that does the job, consistent with the project's existing "smallest possible version" philosophy (see the check-in count field in `TDD-SHEET.md`). This is a Person A (backend) contract change — needs sign-off from whoever owns `app/main.py` before frontend builds against it, same rule as the original contract.

### 7.6 Speech bubble behavior
Auto-fades after a few seconds (per decision). Implementation note: needs an accessible fallback so the fade doesn't hide content from screen-reader or low-vision users — bubble content should still be announced once via an `aria-live` region regardless of visual fade, and fade duration should be generous (8–10s) with a pause-on-hover/focus so it doesn't disappear mid-read.

### 7.7 Visual design
Hixy gets a **new pixel shape/pose**, not the current placeholder ghost/face SVG — to be designed once dialogue copy (7.8) is approved, so the pose can match the personality established by the writing rather than the other way around.

**Priority:** High — this is the single biggest lever for "doesn't feel boring," and it reuses an already-half-built hook in the code rather than adding new surface area.

---

## Decisions locked so far (character feature)
- Character is named **Hixy**.
- Severity comes from a new backend contract field (`severity: "low" | "elevated"`), not frontend keyword-matching on `label`.
- Speech bubble auto-fades after a few seconds, with accessibility fallback per 7.6.
- Character never appears on `CrisisView` — hard boundary, not just a style choice.

---

## Suggested implementation order

1. **Accessibility fixes (2.1–2.4)** — these are non-negotiable for a mental-health tool and touch every other component.
2. **Flow fixes (1.1, 1.2)** — "write another entry" + scroll/focus management. Biggest functional gap.
3. **Mobile pass (4.1–4.3)** — verify and fix at real breakpoints.
4. **Transitions & polish (1.3, 3.1, 3.2, 3.3)** — makes the app feel finished.
5. **Micro-interactions & copy (5, 6)** — last-mile polish.

---

## Open questions before implementation — RESOLVED

- ~~Should "Write another entry" preserve or clear the check-in count display state, or just reset the form?~~ **Resolved:** check-in count is preserved (not reset) — only the form/result clears. It's an honest usage counter, not a session score.
- ~~Any target contrast standard beyond WCAG AA, or is AA sufficient for this pass?~~ **Resolved:** WCAG AA.
- ~~OK to adjust `--muted` lightness slightly if the contrast audit fails, or should that color be treated as locked too?~~ **Resolved:** OK to adjust `--muted`'s lightness only, if the audit requires it. No other tokens touched.

---

*Once this plan is approved, each implemented change should get an entry in `DESIGN_LOG.md` (see that file) so we keep a running record of what changed and why.*
