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
};

export function Eixy({ state, isVisible = false }: Props) {
  const [showBubble, setShowBubble] = useState(isVisible);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowBubble(isVisible);
    if (!isVisible) return;

    timerRef.current = setTimeout(() => {
      setShowBubble(false);
    }, 8000);

    return () => clearTimeout(timerRef.current);
  }, [isVisible, state]);

  return (
    <div
      className="flex items-end gap-4"
      onMouseEnter={() => isVisible && setShowBubble(true)}
      onFocus={() => isVisible && setShowBubble(true)}
    >
      {/* Eixy sprite */}
      <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
        <img
          src="/eixy.svg"
          alt="Eixy, a pixel-art companion"
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
