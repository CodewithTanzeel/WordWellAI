import { useEffect, useRef } from "react";

type Result = {
  status: "ok";
  label: string;
  confidence: number;
  disclaimer: string;
  crisis: false;
};

function formatLabel(label: string): string {
  return label.replace(/_/g, " ").toUpperCase();
}

export function ResultView({ result }: { result: Result }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus();
  }, []);

  const percent = Math.round(result.confidence * 100);
  const segments = 10;
  const filledSegments = Math.round((percent / 100) * segments);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      data-testid="result-panel"
      className="pixel-border w-full max-w-xl p-6 animate-fade-in"
      style={{
        backgroundColor: "var(--paper)",
        animation: "fadeInFast 0.3s ease-in-out",
      }}
    >
      <p className="font-pixel text-[12px] tracking-wide text-[color:var(--muted)]">
        WHAT WE NOTICED
      </p>

      <h2 className="font-pixel mt-3 text-sm leading-relaxed text-[color:var(--ink)]">
        {formatLabel(result.label)}
      </h2>

      <div className="mt-4 flex items-center gap-2">
        <div
          className="flex h-4 flex-1 gap-[2px] border-2 p-[2px]"
          style={{ borderColor: "var(--ink)", borderRadius: 0 }}
          role="img"
          aria-label={`confidence ${percent}%`}
        >
          {Array.from({ length: segments }).map((_, i) => (
            <span
              key={i}
              className="flex-1"
              style={{
                backgroundColor: i < filledSegments ? "var(--accent-green)" : "transparent",
              }}
            />
          ))}
        </div>
        <span className="font-pixel text-[12px] text-[color:var(--accent-green-dark)]">
          {percent}%
        </span>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[color:var(--muted)]">
        {result.disclaimer}
      </p>
    </div>
  );
}
