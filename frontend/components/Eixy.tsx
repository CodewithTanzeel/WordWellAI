"use client";

import { useEffect, useRef, useState } from "react";
import { EixySprite } from "./EixySprite";

export type EixyState = "intro" | "positive" | "elevated";

const DIALOGUE: Record<EixyState, string> = {
  intro:
    "Hi, I'm Eixy! This box doesn't judge. Say the messy stuff, the small stuff, whatever's actually true today.",
  positive:
    "Good to hear. Thanks for putting it into words — noticing this stuff matters more than people think.",
  elevated:
    "That sounds like a lot to carry. I'm glad you said it out loud instead of sitting on it. I'll be here whenever you want to check in again.",
};

// Shown one at a time, in random rotation, while the user is actively typing —
// warm, encouraging lines about what it takes to put this into words at all.
const TYPING_QUOTES: string[] = [
  "Reaching out like this takes real guts — seriously.",
  "Not everyone says the hard stuff out loud. You're doing it right now!",
  "Asking for help is the brave move, not the weak one.",
  "You didn't have to write this. You're doing it anyway — that counts for a lot.",
  "Naming what's going on takes guts. Go you.",
  "Saying it instead of sitting on it? That's a win right there.",
];

// Generous fade so it never disappears mid-read; pauses on hover/focus.
const FADE_MS = 9000;

// How often the typing-state quote rotates while the user keeps typing.
const QUOTE_ROTATE_MS = 6000;

// Word-by-word intro reveal timing.
const WORD_REVEAL_INITIAL_DELAY_MS = 400;
const WORD_REVEAL_STAGGER_MS = 80;
const WORD_REVEAL_DURATION_MS = 300;

type Props = {
  state: EixyState;
  isVisible: boolean;
  /** True while the user has text in the box — triggers the "listening" run-in-place animation. */
  isListening?: boolean;
};

export function Eixy({ state, isVisible, isListening = false }: Props) {
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function startTimer() {
    clearTimer();
    if (!pausedRef.current) {
      timerRef.current = setTimeout(() => setBubbleVisible(false), FADE_MS);
    }
  }

  // Re-announce whenever the line changes. While actively typing, keep the
  // bubble visible continuously rather than letting it fade mid-quote-rotation
  // — the fade countdown only starts once typing stops.
  useEffect(() => {
    setBubbleVisible(true);
    if (isListening) {
      clearTimer();
    } else {
      startTimer();
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isListening]);

  // Pick a fresh random quote each time typing starts, then rotate to a new
  // (non-repeating) random quote on an interval for as long as typing continues.
  useEffect(() => {
    if (!isListening || TYPING_QUOTES.length === 0) return;
    setQuoteIndex(Math.floor(Math.random() * TYPING_QUOTES.length));
    if (TYPING_QUOTES.length <= 1) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => {
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * TYPING_QUOTES.length);
        }
        return next;
      });
    }, QUOTE_ROTATE_MS);
    return () => clearInterval(interval);
  }, [isListening]);

  function handlePause() {
    pausedRef.current = true;
    clearTimer();
  }

  function handleResume() {
    pausedRef.current = false;
    startTimer();
  }

  if (!isVisible) return null;

  // Listening (typing) always wins — Eixy jogs in place, actively paying attention.
  // Otherwise the pose reflects the current dialogue state.
  const poseClass = isListening
    ? "animate-eixy-walk"
    : state === "intro"
      ? "animate-eixy-float"
      : state === "positive"
        ? "animate-eixy-bounce-fast"
        : "animate-eixy-bounce-slow";

  // Word-by-word reveal is reserved for the intro greeting — the reaction
  // lines (positive/elevated) land as a single line so they read instantly
  // alongside the result they're responding to.
  const showWordReveal = state === "intro" && !isListening;
  const introWords = DIALOGUE.intro.split(" ");

  return (
    <div
      data-testid="eixy"
      className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8"
      aria-label={`Eixy, ${isListening ? "listening" : state}`}
    >
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onFocus={handlePause}
        onBlur={handleResume}
        tabIndex={0}
        className="pixel-border max-w-[60vw] px-4 py-3 text-center transition-opacity duration-500 focus-visible:ring-2 focus-visible:ring-[color:var(--accent-pink)] sm:max-w-xs"
        style={{
          backgroundColor: "var(--paper)",
          opacity: bubbleVisible ? 1 : 0,
          pointerEvents: bubbleVisible ? "auto" : "none",
        }}
      >
        <p
          key={state}
          className="font-pixel text-[12px] leading-relaxed text-[color:var(--ink)]"
        >
          {isListening ? (
            TYPING_QUOTES[quoteIndex]
          ) : showWordReveal ? (
            introWords.map((word, i) => (
              <span
                key={i}
                className="inline-block opacity-0"
                style={{
                  animation: `eixyWordReveal ${WORD_REVEAL_DURATION_MS}ms ease-out ${WORD_REVEAL_INITIAL_DELAY_MS + i * WORD_REVEAL_STAGGER_MS}ms forwards`,
                }}
              >
                {word}
                {i < introWords.length - 1 ? "\u00A0" : ""}
              </span>
            ))
          ) : (
            DIALOGUE[state]
          )}
        </p>
      </div>

      <div
        className={`h-16 w-16 origin-bottom drop-shadow-[3px_3px_0_var(--ink)] sm:h-24 sm:w-24 ${poseClass}`}
        style={{ willChange: "transform" }}
      >
        <EixySprite className="h-full w-full" />
      </div>
    </div>
  );
}
