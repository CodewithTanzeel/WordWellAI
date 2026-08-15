# Sift Frontend Implementation Plan

**Status:** Ready for implementation
**Hard constraints:**
- Keep pixel/retro-game theme locked. CrisisView stays outside the theme.
- Component, dialogue, and alt-text all use **Eixy**.
- `frontend/public/eixy.svg` is the live asset (user manually renamed from `hixy.svg`).
- Backend `severity` field is out of scope; frontend types it and defaults to `"positive"` when absent.

**Log requirement:** Every change gets a dated `DESIGN_LOG.md` entry referencing the relevant plan section.

---

## Pre-flight — completed by user

- [x] `frontend/public/hixy.svg` manually renamed to `eixy.svg`
- [ ] `components/Hixy.tsx` image `src` updated from `/hixy.svg` to `/eixy.svg` (implementer step, Phase 0)
- [ ] `DESIGN_LOG.md` character-name entry updated to Eixy (implementer step, Phase 0)

---

## Phase 0 — Character name alignment (2 small edits before main work)

**Files:** `components/Hixy.tsx`

- Rename component file from `Hixy.tsx` → `Eixy.tsx` and update its export/import in `App.tsx`.
- Update image `src` from `/hixy.svg` to `/eixy.svg`.
- Update alt text from "Hixy" to "Eixy".
- Update `DIALOGUE` intro line to "Hi, I'm Eixy! ...".

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Character renamed to Eixy in code and dialogue; asset path updated to /eixy.svg"

---

## Phase 1 — Accessibility (highest priority)

### 1.1 Pixel font floor → 12px (Plan §2.1)
**Files:** `components/JournalForm.tsx`, `components/ResultView.tsx`, `components/CheckInCount.tsx`, `App.tsx`

| Location | Current | Change |
|---|---|---|
| `JournalForm.tsx:33` label | `text-[11px]` | `text-[12px]` |
| `ResultView.tsx:24` "WHAT WE NOTICED" | `text-[10px]` | `text-[12px]` |
| `CheckInCount.tsx:9` | `text-[9px]` | `text-[12px]` |
| `App.tsx:115` nav wordmark | `text-[11px]` | `text-[12px]` |
| `App.tsx:118` nav crisis link | `text-[9px]` | `text-[12px]` |
| `App.tsx:141` error text | `text-[10px]` | `text-[12px]` |

`ResultView.tsx:28` result label is `text-sm` — already ≥12px, leave alone.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Pixel font floor raised to 12px for content text (Plan §2.1)"

---

### 1.2 WCAG AA contrast — adjust `--muted` only (Plan §2.2)
**Files:** `app/globals.css`, `components/ResultView.tsx`, `App.tsx`

- Pairings to check: `--muted: #8b8b96` on `--paper: #f4f1ea` and on `--bg-game: #0f0f14`
- Light-background pairing expected to fail AA. Fix: shift `--muted` lightness only (same hue) until it passes 4.5:1 on `--paper`.
- No other token changes.

**Log:** `DESIGN_LOG.md` entry with exact old/new `--muted` value and which pairing it fixes.

---

### 1.3 Visible focus ring on submit button (Plan §2.3)
**Files:** `components/JournalForm.tsx`

- Textarea already has `focus-visible:ring-2 focus-visible:ring-[color:var(--accent-pink)]`.
- Add the same treatment to the submit button. Ensure ring is visible against pink background (use `--accent-pink-dark` ring or offset).

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Visible focus-visible ring added to submit button (Plan §2.3)"

---

### 1.4 Touch target padding on nav crisis link (Plan §2.4)
**Files:** `App.tsx`

- Nav "CRISIS RESOURCES ↓" link: add invisible padding (`py-3 px-2` or wrapping span) to reach ~44×44px.
- Audit other small interactive elements; pad similarly if needed.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Touch target padding added to nav crisis link (Plan §2.4)"

---

## Phase 2 — Flow & Interaction

### 2.1 "Write another entry" button (Plan §1.1)
**Files:** `App.tsx`, `components/JournalForm.tsx`, `components/ResultView.tsx`, `components/CrisisView.tsx`

- Lift `text` state from `JournalForm` to `App.tsx`: pass `value`, `onChange`, and `onClear` props.
- Reset function in `App.tsx`: clears `result`, calls `onClear` (clears textarea), then refocuses textarea via ref.
- Check-in count is preserved (locked design-log decision).
- Button: "▶ NEW CHECK-IN", `pixel-border-pink`, same `active:translate-x/y + shadow-none` press state as submit button.
- Render below both `ResultView` and `CrisisView`.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — New CHECK-IN button added under ResultView and CrisisView; form+result clear, count preserved (Plan §1.1)"

---

### 2.2 Scroll + focus management (Plan §1.2)
**Files:** `components/ResultView.tsx`, `components/CrisisView.tsx`, `App.tsx`

- Add `tabIndex={-1}` to panel roots.
- On mount, call `scrollIntoView({ behavior: "smooth", block: "start" })` then `.focus()`.
- `CrisisView` already has `role="alert"`; focus management covers sighted keyboard users.
- `prefers-reduced-motion` already handled globally.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Scroll + focus management added to ResultView and CrisisView panels (Plan §1.2)"

---

### 2.3 Fade/slide transitions (Plan §1.3)
**Files:** `app/globals.css`, `components/ResultView.tsx`, `components/CrisisView.tsx`

- ResultView: use existing `animate-fade-in` / `fadeInFast 0.3s`.
- CrisisView: new `fadeInSlow 0.25s ease-in-out` (slightly softer/slower entrance reinforces tonal split).
- Add `@keyframes fadeInSlow` to `globals.css`.
- Apply animation class to panel root on mount.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Fade transitions added to result/crisis panels; crisis uses slower entrance (Plan §1.3)"

---

### 2.4 Loading feedback — skip for now (Plan §1.4)
- Existing "▶ THINKING…" button text is sufficient per plan's low-priority designation.
- Revisit only if user requests.

---

## Phase 3 — Mobile Responsiveness

### 3.1 Nav bar at narrow widths (Plan §4.1)
**Files:** `App.tsx`

- Verify at 320–375px. Current `flex items-center justify-between px-6 py-4` is likely fine.
- If items crowd: reduce gap or stack vertically at `max-width: 360px`.

**Log:** `DESIGN_LOG.md` entry documenting any breakpoint adjustment made, or "no adjustment needed".

---

### 3.2 Textarea rows: 4 on mobile, 6 on desktop (Plan §4.2)
**Files:** `components/JournalForm.tsx`

- `rows={6}` is hardcoded. Change to `rows={4}` and use a `useMediaQuery` hook or CSS height to expand on `sm:` and up.
- Approach: set `rows={4}`, then apply `sm:min-h-[...]` or a media-query-driven className that increases height at the `sm` breakpoint. Don't rely on `rows` attribute alone since it's not responsive in HTML.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Textarea rows reduced to 4 on mobile, 6 on desktop (Plan §4.2)"

---

### 3.3 Real device width pass (Plan §4.3)
- Manual verification at 375px. No code changes unless issues found.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Mobile width pass completed at 375px; [fixes applied or 'no issues found']"

---

## Phase 4 — Visual Hierarchy

### 4.1 CheckInCount → header badge (Plan §3.2)
**Files:** `App.tsx`, `components/CheckInCount.tsx`

- Move `CheckInCount` from below panels into the nav bar, right-aligned next to the SIFT wordmark.
- Style as a small inline badge: reduce padding/font slightly to fit nav height, keep existing yellow border.
- Remove old `CheckInCount` placement from main content area.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — CheckInCount moved to header badge position (Plan §3.2)"

---

### 4.2 Spacing rhythm check (Plan §3.3)
**Files:** `App.tsx`

- With Eixy + ResultView/CrisisView + CheckInCount badge all visible, review `gap-8` and `py-16`.
- Adjust if cramped or sparse. No new tokens.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Spacing rhythm adjusted [detail changes] (Plan §3.3)"

---

## Phase 5 — Micro-interactions & Copy

### 5.1 Hover states on nav/footer links (Plan §5)
**Files:** `App.tsx`

- Nav link: `hover:text-[color:var(--accent-yellow)]` or lighter pink.
- Footer crisis text is not a link; leave alone.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Hover states added to nav link (Plan §5)"

---

### 5.2 Error messages: sentence case + 12px (Plan §6.1)
**Files:** `App.tsx`

- Font size already fixed in Phase 1.1.
- Remove `.toUpperCase()` on error display (line 143).
- Existing error strings are already sentence case; no copy changes needed.

**Log:** `DESIGN_LOG.md` entry "2026-08-15 — Error messages switched to sentence case and 12px (Plan §6.1)"

---

### 5.3 Retry affordance — skip for now (Plan §6.2)
- Button re-enabling after error is visually obvious enough. Revisit only if user requests.

---

## Execution order

1. Phase 0 (character rename in code)
2. Phase 1.1 → 1.2 → 1.3 → 1.4
3. Phase 2.1 → 2.2 → 2.3
4. Phase 3.1 → 3.2 → 3.3
5. Phase 4.1 → 4.2
6. Phase 5.1 → 5.2

After each change: add a `DESIGN_LOG.md` entry in the prescribed format.
