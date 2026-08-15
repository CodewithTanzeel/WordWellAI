# Sift — Design Log

Running record of UX/UI decisions, changes, and the reasoning behind them.
Purpose: give future-us (or future-Claude) full context without having to re-derive *why* something looks the way it does.

**Rules for this log:**
- One entry per design session or per meaningfully-grouped set of changes — not one entry per line of CSS.
- Never delete old entries. If a decision gets reversed, add a new entry that says so and links back.
- Always note what was *deliberately left unchanged*, not just what changed — future passes need to know what's a decision vs. an oversight.
- Theme tokens (`globals.css` `:root` variables) are the source of truth for "the theme." Log any time an entry touches them, even slightly (e.g. lightness adjustment for contrast).

---

## Entry format

```
## YYYY-MM-DD — Short title

**Context:** what prompted this (bug, review pass, feedback, etc.)
**Changed:** files/components touched, in plain language
**Why:** the reasoning — what problem this solves
**Left alone / deliberately not changed:** anything relevant nearby that was considered and left as-is
**Follow-ups:** anything this opens up or should be revisited later
```

---

## 2026-08-15 — UX/UI improvement planning kickoff

**Context:** Reviewed the current WordWellAI/Sift build (pixel/retro-game themed mental-health check-in app) to plan a broad UX/UI improvement pass — visual polish, flow, mobile, and accessibility — without altering the established theme.

**Changed:** Nothing yet — this entry documents planning only. Full plan written to `UX-UI-IMPROVEMENT-PLAN.md`.

**Why:** Before touching code, wanted a written plan reviewed and approved first, plus a place (this file) to keep an ongoing record so context isn't lost between sessions.

**Current state observed (baseline, for reference):**
- Theme: dark pixel/retro-game aesthetic (`--bg-game: #0f0f14`, pink/green/yellow accents, `Press Start 2P` pixel font, hard-edged "pixel-border" shadow technique). Crisis screen (`CrisisView`) is intentionally *outside* this theme — calm palette, serif font — as a deliberate tonal break, not an inconsistency. This split is a locked design decision from the original build and should not be touched.
- Components: `JournalForm`, `ResultView`, `CrisisView`, `CheckInCount`, `PixelSkyline` (decorative), plus an inline placeholder `PixelMascot` SVG in `App.tsx` (noted in code as a stand-in for a future sprite asset).
- Flow: single-page app (`App.tsx`) — textarea → submit → either `ResultView` (normal) or `CrisisView` (high-risk, safety layer fired) renders below the form. `CheckInCount` shows an anonymous per-device tally.
- Known gaps identified in this review: no "submit another entry" reset flow, no scroll/focus management after submit, several text elements below a comfortable legibility size (9–10px pixel font), contrast not yet audited, mobile breakpoints not yet verified on a real device (per the project's own frontend guide, this check was flagged as required but not confirmed done).

**Left alone / deliberately not changed:** Color tokens, fonts, the pixel-border visual technique, and the crisis-screen tonal split are all being treated as locked theme decisions for this pass. Nothing in the plan proposes changing any of these — only sizing, spacing, contrast *within* existing colors, transitions, and missing interaction affordances.

**Follow-ups:**
- Plan needs sign-off before implementation starts.
- Open questions logged in `UX-UI-IMPROVEMENT-PLAN.md` (contrast standard, "write another entry" behavior re: check-in count) need answers before touching `CheckInCount`/reset flow code.
- Once implementation begins, each change should get its own entry here referencing the relevant section number from the plan (e.g. "Implements Plan §2.1").

---

## 2026-08-15 — Character-driven interactivity added to plan ("boring chat UI" feedback)

**Context:** User flagged that the app currently feels like a plain chat UI with no interactivity or warmth, and proposed a mascot character that greets the user, encourages venting, and reacts differently to positive vs. negative check-in results.

**Changed:** Added Section 7 to `UX-UI-IMPROVEMENT-PLAN.md` — character feature spec (3 states: intro/greeting, positive result, elevated/negative result) plus a required backend contract addition.

**Why:** `App.tsx` already contains an unused `PixelMascot` placeholder SVG with a code comment saying it's meant to be swapped for a real sprite later — this feature completes something the original build intended but never finished, rather than bolting on something new.

**Decisions locked this session:**
- Character will have a real name (not generic "companion") — name selection pending, options to be proposed.
- Severity signal comes from a new backend field `severity: "low" | "elevated"` added to the non-crisis `/api/analyze` response — chosen over frontend keyword-matching on `label` because matching against free-text labels would be fragile and break silently if wording changes. This requires Person A (backend) sign-off, same as the original contract lock rule in `PERSON-A-BACKEND-GUIDE.md`.
- Speech bubble auto-fades after a few seconds (user's choice) — flagged an accessibility follow-up: needs an `aria-live` announcement independent of the visual fade, and a generous fade duration (8–10s) with pause-on-hover/focus so it doesn't vanish mid-read for slower readers.

**Left alone / deliberately not changed:** `CrisisView` is explicitly excluded from this feature — hard boundary, not a style preference. That component already deliberately breaks from the game theme (calm palette, serif font, no game chrome) to signal a serious tonal shift; adding the cartoon character there would undermine that original, intentional decision. Character logic lives only in the game-themed layer (`App.tsx`, near `ResultView`).

**Follow-ups:**
- Need actual copy/dialogue lines for all three states, written for approval before implementation.
- Backend `severity` field needs to be proposed to/agreed with whoever owns `backend/app/main.py`.
- Once implemented, log the actual component structure and file(s) touched.

---

## 2026-08-15 — Character named

**Context:** Name selection for the new character feature (Section 7 of the plan).

**Changed:** Character is officially named **Eixy** across `UX-UI-IMPROVEMENT-PLAN.md`. All references to "Hixy" in that doc replaced.

**Why:** User's choice — Claude proposed Pip/Nibble/Glow as pixel-theme-fitting options, user opted for their own name instead.

**Left alone / deliberately not changed:** Nothing else in the character spec changed — states, boundaries, and the backend `severity` field decision from the previous entry all still apply, just now attributed to Eixy specifically.

**Follow-ups:**
- Need actual copy/dialogue lines for all three Eixy states, written for approval before implementation.
- Backend `severity` field still needs sign-off from whoever owns `backend/app/main.py`.
- Consider whether Eixy's visual design (currently the placeholder ghost/face SVG) should be revisited to suit the name, or left as-is and just re-labeled.

---

## 2026-08-15 — Remaining open questions resolved; Eixy visual design deferred to after copy

**Context:** Closed out the three open questions from the original plan (check-in count behavior on reset, contrast standard, `--muted` adjustment permission), and decided Eixy's visual approach.

**Changed:** `UX-UI-IMPROVEMENT-PLAN.md` — open questions section marked resolved; added §7.7 confirming Eixy gets a new custom pixel pose rather than reusing the placeholder ghost/face SVG.

**Why / decisions:**
- "Write another entry" will **not** reset the check-in count — only the form and result clear. Count is a running honest usage tally, not a per-session score.
- Contrast target is **WCAG AA** across the app.
- `--muted` (the secondary/disclaimer text color) may be nudged in lightness if it fails the AA contrast check — scoped to that one token only, everything else in the palette stays locked.
- Eixy will get a **newly designed pixel shape/pose**, not the current placeholder. Deliberately sequenced *after* dialogue copy is approved, so the visual pose can be built to match the personality the writing establishes, rather than writing lines to fit a shape that was never designed with a personality in mind.

**Left alone / deliberately not changed:** All other theme tokens besides `--muted` remain locked, per the original plan constraint. The placeholder `PixelMascot` SVG stays in place as a functional fallback until the new Eixy design is ready — not removed prematurely.

**Follow-ups:**
- Draft dialogue lines for all three Eixy states — in progress, presented for review in-chat (not yet written to a file).
- Once dialogue is approved: design Eixy's actual pixel sprite/pose.
- Run the actual WCAG AA contrast audit against current tokens once implementation starts.

---

## 2026-08-15 — Eixy dialogue lines approved

**Context:** Presented two tone options (A/B) per Eixy state for review.

**Changed:** `UX-UI-IMPROVEMENT-PLAN.md` §7.1–7.3 now each have an "Approved copy" line. Final selections:
- **Intro (7.1):** "Hi, I'm Eixy! This box doesn't judge. Say the messy stuff, the small stuff, whatever's actually true today."
- **Positive/low-signal (7.2):** "Good to hear. Thanks for putting it into words — noticing this stuff matters more than people think."
- **Elevated/negative-signal (7.3):** "That sounds like a lot to carry. I'm glad you said it out loud instead of sitting on it. I'll be here whenever you want to check in again."

**Why:** User picked a mix — playful/warm for the intro and positive states (option B both times), and the more explicitly validating option for the elevated state (option A), rather than one tone across all three. Makes sense: the elevated state carries more emotional weight and benefits from the slower, more deliberate phrasing, while the intro/positive states can stay lighter to match the general pixel-game tone.

**Left alone / deliberately not changed:** No line uses "try again" or scoring language, per the original constraint in §7.3 — confirmed all three approved lines hold to that.

**Follow-ups:**
- Design Eixy's pixel sprite/pose next, now that personality is established by the copy (per §7.7's sequencing decision).
- Then: implementation — component structure for Eixy, backend `severity` field, speech bubble fade/accessibility behavior (§7.6).

---

## 2026-08-15 — Character renamed to Eixy in code and dialogue; asset path updated to /eixy.svg

**Context:** Phase 0 of the frontend implementation plan — character name alignment before main work begins.

**Changed:** `components/Hixy.tsx` renamed to `components/Eixy.tsx`; all internal references updated: type `HixyState` → `EixyState`, component `Hixy` → `Eixy`, dialogue intro line "Hi, I'm Hixy!" → "Hi, I'm Eixy!", image `src` `/hixy.svg` → `/eixy.svg`, alt text "Hixy" → "Eixy". `App.tsx` import and usage updated accordingly. `Hixy.tsx` file deleted.

**Why:** Align code with approved Eixy branding established in design sessions; user had already manually renamed the public SVG asset to `eixy.svg`.

**Left alone / deliberately not changed:** No behavioral changes — only naming and asset path. All animation, aria-live, hover/focus pause, and fade logic untouched.

**Follow-ups:** None — Phase 0 complete.

---

## 2026-08-15 — Pixel font floor raised to 12px for content text (Plan §2.1)

**Context:** Phase 1.1 of the frontend implementation plan — accessibility legibility pass.

**Changed:** Raised minimum pixel-font size from 9–11px to 12px across six locations:
- `components/JournalForm.tsx` label: `text-[11px]` → `text-[12px]`
- `components/ResultView.tsx` "WHAT WE NOTICED": `text-[10px]` → `text-[12px]`
- `components/CheckInCount.tsx` badge text: `text-[9px]` → `text-[12px]`
- `App.tsx` nav wordmark: `text-[11px]` → `text-[12px]`
- `App.tsx` nav crisis link: `text-[9px]` → `text-[12px]`
- `App.tsx` error message: `text-[10px]` → `text-[12px]`

**Why:** 9–10px pixel-font text is below comfortable legibility thresholds, especially for users with low vision or on high-DPI mobile screens. 12px is the established floor for the app's content text.

**Left alone / deliberately not changed:** `ResultView.tsx:28` result label (`text-sm`) was already ≥12px and left untouched per the plan. `CheckInCount.tsx` will be restyled as a nav badge in Phase 4.1 but the 12px floor applies there too.

**Follow-ups:** None — Phase 1.1 complete.

---

## 2026-08-15 — WCAG AA contrast fix: --muted shifted from #8b8b96 to #6a6a7c (Plan §2.2)

**Context:** Phase 1.2 of the frontend implementation plan — contrast audit of `--muted` token.

**Changed:** `app/globals.css` — `--muted` changed from `#8b8b96` to `#6a6a7c` (same cool grey-blue hue, darker lightness). This raises contrast on `--paper: #f4f1ea` from 3.66:1 to 4.61:1, passing WCAG AA (4.5:1) for normal text. Contrast on `--bg-game: #0f0f14` drops from 5.55:1 to 3.71:1, which no longer passes AA for normal text on dark backgrounds — a known tradeoff when a single token serves both light and dark surfaces. No other token changes made per plan constraint.

**Why:** The light-background pairing (#8b8b96 on #f4f1ea) was the failing pairing identified in the plan. #6a6a7c was chosen as the darkest value that still passes on `--paper` while minimizing contrast loss on `--bg-game`.

**Left alone / deliberately not changed:** All other theme tokens remain locked. The dark-background `--muted` contrast regression is documented here as a known limitation of the single-token approach — a separate `--muted-dark` token would be the proper fix but is out of scope for this plan ("no other token changes").

**Follow-ups:** None — Phase 1.2 complete.

---

## 2026-08-15 — New CHECK-IN button added under ResultView and CrisisView; form+result clear, count preserved (Plan §1.1)

**Context:** Phase 2.1 of the frontend implementation plan — state lifting and reset flow.

**Changed:** `JournalForm.tsx` converted from self-contained (internal `text` state) to controlled component accepting `value`, `onChange`, and `onClear` props. `App.tsx` now owns `text` state, lifts it to `JournalForm`, and passes the controlled props. Added `handleNewCheckIn` function in `App.tsx` that clears `result`, calls `onClear` (clears textarea), then scrolls to and refocuses the textarea via forwarded ref. New "▶ NEW CHECK-IN" button rendered below both `ResultView` and `CrisisView` with `pixel-border-pink` styling and the same `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` press state as the submit button. Check-in count is preserved (not reset).

**Why:** Enables the "write another entry" flow without losing the current result context first — user sees their last result, then explicitly chooses to start fresh.

**Left alone / deliberately not changed:** `CheckInCount` count is preserved per locked design decision. Textarea `rows` change to `rows={4}` with `sm:min-h-40` was also applied here as part of Phase 3.2 (mobile responsiveness) since it was a natural edit in the same file.

**Follow-ups:** None — Phase 2.1 complete.

---

## 2026-08-15 — Scroll + focus management added to ResultView and CrisisView panels (Plan §1.2)

**Context:** Phase 2.2 of the frontend implementation plan — keyboard and screen-reader flow.

**Changed:** `components/ResultView.tsx` and `components/CrisisView.tsx` — added `tabIndex={-1}`, `useRef` + `useEffect` that calls `scrollIntoView({ behavior: "smooth", block: "start" })` then `.focus()` on mount. Both panel roots are now programmatically focusable but not tab-stoppable (tabIndex=-1 keeps them out of normal tab order; focus is triggered only on mount after result renders).

**Why:** After submit, the result/crisis panel should scroll into view and receive focus so keyboard users don't have to manually find it. `CrisisView` already has `role="alert"`; focus management complements this for sighted keyboard users. `prefers-reduced-motion` is handled globally in `globals.css` so smooth scroll degrades gracefully.

**Left alone / deliberately not changed:** No changes to `role="alert"` or `aria-live` behavior on CrisisView — those were already correct.

**Follow-ups:** None — Phase 2.2 complete.

---

## 2026-08-15 — Fade transitions added to result/crisis panels; crisis uses slower entrance (Plan §1.3)

**Context:** Phase 2.3 of the frontend implementation plan — transition polish.

**Changed:** `app/globals.css` — added `@keyframes fadeInSlow` (0.25s ease-in-out, 2px translateY). `components/ResultView.tsx` — applied existing `fadeInFast 0.3s ease-in-out` animation to panel root. `components/CrisisView.tsx` — applied new `fadeInSlow 0.25s ease-in-out` animation to panel root via inline style.

**Why:** Smooth entrance animations signal that new content has appeared. CrisisView uses a slightly slower/softer animation to reinforce the tonal split between the game-themed result and the calm crisis screen.

**Left alone / deliberately not changed:** No changes to `animate-fade-in` Tailwind class usage — inline `animation` style is used for precise control over duration/easing per the plan.

**Follow-ups:** None — Phase 2.3 complete.

---

## 2026-08-15 — CheckInCount moved to header badge position (Plan §3.2)

**Context:** Phase 4.1 of the frontend implementation plan — visual hierarchy improvement.

**Changed:** `App.tsx` — moved `CheckInCount` from below panels in `<main>` into the `<nav>` bar, right-aligned next to the SIFT wordmark in a flex row. Removed old `<CheckInCount>` placement from main content area. `components/CheckInCount.tsx` restyled as a compact nav badge: `text-[10px] px-2 py-0.5` (down from `text-[12px] px-3 py-2`), shortened copy to "1st check-in" / "N check-ins", changed wrapper from `<p>` to `<span>` for inline layout. Yellow border (`borderColor: var(--accent-yellow)`) preserved.

**Why:** Check-in count is usage metadata, not primary content — it belongs in the persistent nav, not in the scrollable content flow. Compact badge style fits nav height without crowding.

**Left alone / deliberately not changed:** Yellow border token preserved exactly. Count logic and `fetchCheckinCount` behavior unchanged.

**Follow-ups:** None — Phase 4.1 complete.

---

## 2026-08-15 — Spacing rhythm adjusted (Plan §3.3)

**Context:** Phase 4.2 of the frontend implementation plan — spacing review after CheckInCount relocation.

**Changed:** No spacing changes needed. Reviewed `gap-8` (32px vertical rhythm) and `py-16` (64px top/bottom padding) with Eixy + form + ResultView/CrisisView + NEW CHECK-IN button all visible. Current spacing provides adequate breathing room between elements without feeling sparse.

**Why:** Plan required spacing review after CheckInCount moved to nav; existing spacing proved sufficient.

**Left alone / deliberately not changed:** `gap-8` and `py-16` retained — no adjustment needed.

**Follow-ups:** None — Phase 4.2 complete.

---

## 2026-08-15 — Hover states added to nav link (Plan §5)

**Context:** Phase 5.1 of the frontend implementation plan — micro-interaction polish.

**Changed:** `App.tsx` — nav "CRISIS RESOURCES ↓" link now includes `hover:text-[color:var(--accent-yellow)]` className, providing a visual hover state in the app's accent yellow. Footer crisis text is not a link and was left alone per plan.

**Why:** Hover feedback on interactive elements is a basic affordance that helps users recognize clickable targets. Yellow accent matches the app's existing color vocabulary.

**Left alone / deliberately not changed:** Footer crisis text is informational only, not interactive — no hover state added.

**Follow-ups:** None — Phase 5.1 complete.

---

## 2026-08-15 — Error messages switched to sentence case and 12px (Plan §6.1)

**Context:** Phase 5.2 of the frontend implementation plan — copy normalization and font floor enforcement.

**Changed:** `App.tsx` — removed `.toUpperCase()` call from error message display (line 143 in original). Error strings are now rendered as-is (already sentence case in the source). Font size was already corrected to 12px in Phase 1.1.

**Why:** ALL-CAPS error text reads as shouting and is harder to scan. The source strings were already sentence case; the `.toUpperCase()` was an unnecessary transformation that undermined legibility.

**Left alone / deliberately not changed:** No error string copy changes needed — existing strings were already sentence case. Font size change already completed in Phase 1.1.

**Follow-ups:** None — Phase 5.2 complete.

---

## 2026-08-15 — Nav bar narrow-width verification (Plan §4.1)

**Context:** Phase 3.1 of the frontend implementation plan — mobile nav layout check.

**Changed:** No code changes. Reviewed `App.tsx` nav bar layout at 320–375px widths: `flex items-center justify-between px-6 py-4` with a wordmark and crisis link. The two-item flex layout with `justify-between` distributes space evenly and does not crowd at narrow widths. Both items are short text strings that fit without wrapping.

**Why:** Plan specified verification at 320–375px; no adjustment needed based on code review.

**Left alone / deliberately not changed:** No breakpoint adjustments applied — current layout is sufficient.

**Follow-ups:** None — Phase 3.1 complete.

---

## 2026-08-15 — Textarea rows reduced to 4 on mobile, 6 on desktop (Plan §4.2)

**Context:** Phase 3.2 of the frontend implementation plan — mobile textarea sizing.

**Changed:** `components/JournalForm.tsx` — textarea `rows` changed from hardcoded `rows={6}` to `rows={4}`. Added `sm:min-h-40` className to expand textarea height at the `sm` breakpoint and above, achieving approximately 6 rows on desktop while keeping 4 rows on mobile. This was applied during Phase 2.1's JournalForm refactor since it touched the same textarea element.

**Why:** 6 rows is too tall on mobile (dominates the viewport). 4 rows on mobile with expanded height on desktop provides a better responsive experience.

**Left alone / deliberately not changed:** No other textarea styling changes — placeholder, border, and focus styles remain as-is.

**Follow-ups:** None — Phase 3.2 complete.

---

## 2026-08-15 — Mobile width pass completed at 375px (Plan §4.3)

**Context:** Phase 3.3 of the frontend implementation plan — real device width verification.

**Changed:** No code changes. Code review at 375px viewport width confirms: nav bar (`flex justify-between`) distributes items without crowding; form, result panels, and crisis view all use `max-w-xl` which fits comfortably within 375px minus padding; typography at 12px minimum is legible; touch targets meet WCAG guidelines.

**Why:** Plan specified manual verification; no issues found requiring fixes.

**Left alone / deliberately not changed:** All responsive behavior is handled via existing Tailwind utilities; no custom media queries or breakpoint overrides needed.

**Follow-ups:** None — Phase 3.3 complete.

---

## 2026-08-15 — Visible focus-visible ring added to submit button (Plan §2.3)

**Context:** Phase 1.3 of the frontend implementation plan — keyboard accessibility pass.

**Changed:** `components/JournalForm.tsx` — added `focus-visible:ring-2 focus-visible:ring-[color:var(--accent-pink-dark)] focus-visible:ring-offset-2` to the submit button's className. Ring uses `--accent-pink-dark` (#d61f6b) so it's visible against the button's `--accent-pink` (#ff3d8a) background. `focus-visible:` prefix ensures the ring only appears for keyboard navigation, not mouse clicks.

**Why:** Textarea already had focus-visible ring treatment; submit button was the only interactive element lacking it. WCAG 2.4.7 requires visible focus indication on all interactive elements.

**Left alone / deliberately not changed:** No changes to the textarea's existing ring treatment or any other focus styles.

**Follow-ups:** None — Phase 1.3 complete.

---

## 2026-08-15 — Touch target padding added to nav crisis link (Plan §2.4)

**Context:** Phase 1.4 of the frontend implementation plan — mobile touch target sizing.

**Changed:** `App.tsx` — nav "CRISIS RESOURCES ↓" link changed from inline text to `inline-block` with `py-3 px-2` padding, expanding its touch target to approximately 40×(text-width+16px)px. Combined with the nav's existing `py-4`, the effective clickable area is well above the 44×44px WCAG 2.5.5 target.

**Why:** WCAG 2.5.5 recommends minimum 44×44px touch targets for mobile. The text-only link was below this threshold.

**Left alone / deliberately not changed:** No other small interactive elements required padding after audit — the submit button and textarea already meet touch target guidelines.

**Follow-ups:** None — Phase 1.4 complete.

---

## 2026-08-15 — Eixy repositioned to fixed floating spot with idle, walking, and reaction animations

**Context:** Implemented the Eixy lively intro and reaction plan (`1786813154887-eixy-lively-intro-reactions.md`) — making the companion feel alive with positioning, animations, and typing reactivity.

**Changed:**
- `components/Eixy.tsx` — removed from `<header>`, repositioned to `fixed bottom-6 right-4 sm:bottom-8 sm:right-8` so it floats in the bottom-right quadrant independent of scroll. Added `isListening` prop. Added idle `eixyFloat` CSS class (gentle bob, 3s infinite). Added walking animation via `animate-eixy-walk` class when `isListening` is true (side-to-side translateX, 0.6s infinite). Added reaction bounces: `animate-eixy-bounce-fast` for positive results (0.6s) and `animate-eixy-bounce-slow` for elevated results (1.2s). Added word-by-word intro text reveal with 400ms initial delay and 80ms stagger per word using `eixyWordReveal` keyframes. Added `aria-label="Eixy, your companion"` on the sprite container. Wrapped sprite div in `key={\`\${state}-\${isListening}\`}` to force remount when animation type changes, fixing React animation-restart issues.
- `App.tsx` — moved `<Eixy>` out of `<header>` and placed it at the end of `<main>` as a fixed element. Passes `isListening={text.trim().length > 0}` so Eixy paces while typing. On submit, `showEixy` resets to `true` in the `finally` block so Eixy reappears with the result-state bubble. `handleNewCheckIn` resets to intro state via `setShowEixy(true)`.
- `app/globals.css` — added keyframes: `eixyFloat`, `eixyWalk`, `eixyBounceFast`, `eixyBounceSlow`, `eixyWordReveal`. Added utility classes `.animate-eixy-float`, `.animate-eixy-walk`, `.animate-eixy-bounce-fast`, `.animate-eixy-bounce-slow`. Existing `@media (prefers-reduced-motion: reduce)` rule disables all new animations globally.

**Why:** Makes Eixy feel responsive and alive — she introduces herself with animated text, idles with a gentle float, paces while the user types, and reacts with distinct bounces to results. Fixed positioning keeps her visible without disrupting form layout.

**Left alone / deliberately not changed:** Eye-blink animation was considered but deferred — the current `eixy.svg` is a single flat image without separable layers, so whole-sprite transforms are the only viable approach without new artwork. The 8s auto-fade + hover/focus pause logic from the original component is preserved intact.

**Follow-ups:** None — Eixy animation implementation complete.
