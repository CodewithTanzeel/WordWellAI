import { useEffect, useRef, useState } from "react";

type EixyState = "intro" | "positive" | "elevated";

const DIALOGUE: Record<EixyState, string> = {
  intro: "Hi, I'm Eixy! This box doesn't judge. Say the messy stuff, the small stuff, whatever's actually true today.",
  positive:
    "Good to hear. Thanks for putting it into words — noticing this stuff matters more than people think.",
  elevated:
    "That sounds like a lot to carry. I'm glad you said it out loud instead of sitting on it. I'll be here whenever you want to check in again.",
};

type Props = {
  state: EixyState;
  isVisible?: boolean;
  isListening?: boolean;
};

export function Eixy({ state, isVisible = false, isListening = false }: Props) {
  const [showBubble, setShowBubble] = useState(isVisible);
  const [revealedWords, setRevealedWords] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const introTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setShowBubble(isVisible);
    if (!isVisible) return;

    timerRef.current = setTimeout(() => {
      setShowBubble(false);
    }, 8000);

    return () => clearTimeout(timerRef.current);
  }, [isVisible, state]);

  useEffect(() => {
    if (!isVisible || state !== "intro") {
      setRevealedWords(0);
      return;
    }

    const words = DIALOGUE.intro.split(" ");
    let i = 0;

    introTimerRef.current = setTimeout(() => {
      const interval = setInterval(() => {
        i += 1;
        setRevealedWords(i);
        if (i >= words.length) {
          clearInterval(interval);
        }
      }, 80);
    }, 400);

    return () => {
      clearTimeout(introTimerRef.current);
      setRevealedWords(0);
    };
  }, [isVisible, state]);

  const words = DIALOGUE[state].split(" ");
  const visibleWords = state === "intro" && isVisible ? revealedWords : words.length;
  const displayWords = words.slice(0, visibleWords);

  const spriteClassName =
    state === "intro" && isListening
      ? "animate-eixy-walk"
      : state === "positive"
        ? "animate-eixy-bounce-fast"
        : state === "elevated"
          ? "animate-eixy-bounce-slow"
          : "animate-eixy-float";

  return (
    <div
      className="fixed bottom-6 right-4 z-40 flex items-end gap-3 sm:bottom-8 sm:right-8"
      onMouseEnter={() => isVisible && setShowBubble(true)}
      onFocus={() => isVisible && setShowBubble(true)}
    >
      {/* Eixy sprite */}
      <div
        key={`${state}-${isListening}`}
        className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 ${spriteClassName}`}
        aria-label="Eixy, your companion"
        role="img"
      >
        <img
          src="/eixy.svg"
          alt=""
          className="w-full h-full pixelated"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* Speech bubble */}
      {showBubble && (
        <div
          className="pixel-border max-w-[12rem] sm:max-w-sm p-4"
          style={{
            backgroundColor: "var(--panel-sky)",
            animation: "fadeInFast 0.3s ease-in-out",
          }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-sm leading-relaxed text-[color:var(--ink)]">
            {displayWords.map((word, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  opacity: state === "intro" && isVisible ? 1 : 1,
                  animation:
                    state === "intro" && isVisible
                      ? "eixyWordReveal 0.25s ease-out forwards"
                      : "none",
                  animationDelay: state === "intro" && isVisible ? `${i * 80}ms` : "0ms",
                }}
              >
                {word}{" "}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
