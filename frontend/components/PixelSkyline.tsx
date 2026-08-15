// Decorative pixel skyline strip — pure CSS/SVG, no external asset needed.
// Heights are a fixed pattern (not random) so server and client render
// identically and there's no hydration mismatch.
const BUILDING_HEIGHTS = [14, 22, 10, 28, 16, 34, 12, 20, 26, 14, 30, 18, 22, 10, 24];
const PINK_INDICES = new Set([2, 6, 11]);

export function PixelSkyline() {
  return (
    <div
      aria-hidden="true"
      className="flex h-9 w-full items-end gap-[3px] overflow-hidden"
    >
      {BUILDING_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: `${h}px`,
            backgroundColor: PINK_INDICES.has(i) ? "var(--accent-pink)" : "var(--ink)",
          }}
        />
      ))}
    </div>
  );
}
