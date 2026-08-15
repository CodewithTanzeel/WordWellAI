# Eixy Lively Intro & Reaction Plan

## Goal

Make Eixy feel alive: on first load she introduces herself with animated text, she sits in a fixed floating position on the right side of the screen, and she reacts to user actions with distinct animations.

---

## Current State

- `components/Eixy.tsx` exists with 3 states (`intro`, `positive`, `elevated`) and auto-fading bubble logic.
- `App.tsx` renders `<Eixy state="intro" isVisible={showEixy} />` inside the centered `<header>`.
- The sprite image `/eixy.svg` is a static pixel-art asset.

---

## Proposed Changes

### 1. Reposition Eixy to fixed floating spot (right side)

- Remove Eixy from `<header>` in `App.tsx`.
- Render Eixy as a fixed/floating element in the bottom-right quadrant of the viewport (matching the red-circle position in the screenshot).
- Use `fixed bottom-8 right-8` (or similar) with a z-index above the background but below the nav.
- Keep her size at `w-20 h-20 sm:w-24 sm:h-24`.

### 2. Intro animation with word-by-word text reveal

- On initial mount (`isVisible` true, state `intro`), play a staggered word-reveal animation on the bubble text.
- CSS approach: wrap each word in a `<span>` with `inline-block` and animate `opacity` + `translateY` with increasing `animation-delay`.
- Fallback for reduced motion: instant reveal (honor existing `prefers-reduced-motion` global rule).

### 3. Idle "alive" animations

- Add a subtle CSS float/bob animation to the sprite container (e.g., `translateY` oscillation over 3s, infinite).
- Add a blinking animation to the sprite’s eyes (if the SVG supports it via CSS, or overlay a pseudo-element).
- Keep animations paused when `isVisible` is false.

### 4. Walking animation while user types

- When the textarea has content and the user is actively typing, Eixy does a side-to-side "walking" animation in the corner — like she's pacing while listening.
- Use CSS `translateX` keyframes (e.g., shift ±10px) on the sprite container.
- Trigger from `App.tsx` by passing a new `isListening` boolean prop to `Eixy` when `text.trim().length > 0`.
- Stop the walk and return to idle float when textarea is empty.

### 5. Reaction animations on user actions

| Action | Eixy reaction |
|---|---|
| User starts typing in textarea | Walking back-and-forth + bubble shows "Take your time..." |
| User submits entry | Eixy hides briefly, then reappears with result-state bubble |
| Result is positive | Gentle bounce + positive dialogue |
| Result is elevated | Slower, softer bounce + elevated dialogue |
| User clicks "NEW CHECK-IN" | Eixy re-enters with intro state |

- Implement via a new `reaction` prop or internal `useEffect` triggered from `App.tsx` callbacks.
- Keep the existing 8s auto-fade + hover/focus pause logic intact.

### 6. Accessibility

- Keep `aria-live="polite"` on the bubble.
- Add `aria-label` to the sprite container: "Eixy, your companion".
- Ensure animations respect `prefers-reduced-motion: reduce`.

---

## Open Questions

**Resolved:**
- **Positioning**: Fixed bottom-right corner, always visible (confirmed by user: "she should be visible also").
- **Typing reaction**: Walking back-and-forth animation while user is typing (confirmed by user).
- **Intro timing**: 400ms delay so the page renders first, then Eixy "wakes up."
- **Typing throttle**: Debounce at 800ms to avoid animation spam while typing.

**Remaining:**
1. **Sprite animation approach**: Does the current `eixy.svg` have separate layers (eyes, body) that can be animated independently via CSS, or is it a single flat image?  
   *Recommendation*: Inspect the SVG. If flat, use whole-sprite transform animations only. If layered, animate eyes separately for blink.

---

## Validation

- Visual check at 375px and 1440px widths.
- Verify Eixy doesn’t overlap form content on narrow screens; add `max-w-[80px]` or `right-4` on mobile if needed.
- Verify `prefers-reduced-motion` disables all Eixy animations.
- Run existing test suite; no test changes expected unless `App.tsx` layout shift breaks selectors.

---

## Out of Scope

- No new SVG artwork; animations work with the existing `eixy.svg`.
- No backend changes.
