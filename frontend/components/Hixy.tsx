import { useEffect, useState } from "react";

type HixyState = "intro" | "positive" | "elevated";

const DIALOGUE: Record<HixyState, string> = {
  intro: "Hi, I'm Hixy! This box doesn't judge. Say the messy stuff, the small stuff, whatever's actually true today.",
  positive:
    "Good to hear. Thanks for putting it into words — noticing this stuff matters more than people think.",
  elevated:
    "That sounds like a lot to carry. I'm glad you said it out loud instead of sitting on it. I'll be here whenever you want to check in again.",
};

type Props = {
  state: HixyState;
  isVisible?: boolean;
};

export function Hixy({ state, isVisible = false }: Props) {
  const [showBubble, setShowBubble] = useState(isVisible);

  useEffect(() => {
    if (!isVisible) {
      setShowBubble(false);
      return;
    }

    setShowBubble(true);
    // Fade out after 8 seconds, but allow user to interact to reset
    const fadeTimer = setTimeout(() => {
      setShowBubble(false);
    }, 8000);

    return () => clearTimeout(fadeTimer);
  }, [isVisible, state]);

  return (
    <div
      className="flex items-end gap-4"
      onMouseEnter={() => isVisible && setShowBubble(true)}
      onFocus={() => isVisible && setShowBubble(true)}
    >
      {/* Hixy sprite */}
      <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
        <img
          src="/hixy.svg"
          alt="Hixy, a pixel-art companion"
          className="w-full h-full pixelated"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* Speech bubble */}
      {showBubble && (
        <div
          className="pixel-border max-w-sm p-4 animate-fade-in"
          style={{
            backgroundColor: "var(--panel-sky)",
            animation: "fadeInFast 0.3s ease-in-out",
          }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-sm leading-relaxed text-[color:var(--ink)]">
            {DIALOGUE[state]}
          </p>
        </div>
      )}
    </div>
  );
}
