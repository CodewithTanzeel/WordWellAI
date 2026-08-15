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

**Changed:** Character is officially named **Hixy** across `UX-UI-IMPROVEMENT-PLAN.md`. All references to "Pip"/"name TBD" in that doc replaced.

**Why:** User's choice — Claude proposed Pip/Nibble/Glow as pixel-theme-fitting options, user opted for their own name instead.

**Left alone / deliberately not changed:** Nothing else in the character spec changed — states, boundaries, and the backend `severity` field decision from the previous entry all still apply, just now attributed to Hixy specifically.

**Follow-ups:**
- Need actual copy/dialogue lines for all three Hixy states, written for approval before implementation.
- Backend `severity` field still needs sign-off from whoever owns `backend/app/main.py`.
- Consider whether Hixy's visual design (currently the placeholder ghost/face SVG) should be revisited to suit the name, or left as-is and just re-labeled.

---

## 2026-08-15 — Remaining open questions resolved; Hixy visual design deferred to after copy

**Context:** Closed out the three open questions from the original plan (check-in count behavior on reset, contrast standard, `--muted` adjustment permission), and decided Hixy's visual approach.

**Changed:** `UX-UI-IMPROVEMENT-PLAN.md` — open questions section marked resolved; added §7.7 confirming Hixy gets a new custom pixel pose rather than reusing the placeholder ghost/face SVG.

**Why / decisions:**
- "Write another entry" will **not** reset the check-in count — only the form and result clear. Count is a running honest usage tally, not a per-session score.
- Contrast target is **WCAG AA** across the app.
- `--muted` (the secondary/disclaimer text color) may be nudged in lightness if it fails the AA contrast check — scoped to that one token only, everything else in the palette stays locked.
- Hixy will get a **newly designed pixel shape/pose**, not the current placeholder. Deliberately sequenced *after* dialogue copy is approved, so the visual pose can be built to match the personality the writing establishes, rather than writing lines to fit a shape that was never designed with a personality in mind.

**Left alone / deliberately not changed:** All other theme tokens besides `--muted` remain locked, per the original plan constraint. The placeholder `PixelMascot` SVG stays in place as a functional fallback until the new Hixy design is ready — not removed prematurely.

**Follow-ups:**
- Draft dialogue lines for all three Hixy states — in progress, presented for review in-chat (not yet written to a file).
- Once dialogue is approved: design Hixy's actual pixel sprite/pose.
- Run the actual WCAG AA contrast audit against current tokens once implementation starts.

---

## 2026-08-15 — Hixy dialogue lines approved

**Context:** Presented two tone options (A/B) per Hixy state for review.

**Changed:** `UX-UI-IMPROVEMENT-PLAN.md` §7.1–7.3 now each have an "Approved copy" line. Final selections:
- **Intro (7.1):** "Hi, I'm Hixy! This box doesn't judge. Say the messy stuff, the small stuff, whatever's actually true today."
- **Positive/low-signal (7.2):** "Good to hear. Thanks for putting it into words — noticing this stuff matters more than people think."
- **Elevated/negative-signal (7.3):** "That sounds like a lot to carry. I'm glad you said it out loud instead of sitting on it. I'll be here whenever you want to check in again."

**Why:** User picked a mix — playful/warm for the intro and positive states (option B both times), and the more explicitly validating option for the elevated state (option A), rather than one tone across all three. Makes sense: the elevated state carries more emotional weight and benefits from the slower, more deliberate phrasing, while the intro/positive states can stay lighter to match the general pixel-game tone.

**Left alone / deliberately not changed:** No line uses "try again" or scoring language, per the original constraint in §7.3 — confirmed all three approved lines hold to that.

**Follow-ups:**
- Design Hixy's pixel sprite/pose next, now that personality is established by the copy (per §7.7's sequencing decision).
- Then: implementation — component structure for Hixy, backend `severity` field, speech bubble fade/accessibility behavior (§7.6).
