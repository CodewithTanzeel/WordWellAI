export function CheckInCount({ count }: { count: number }) {
  const message =
    count === 0
      ? "1st check-in"
      : `${count} check-in${count === 1 ? "" : "s"}`;

  return (
    <span
      className="font-pixel inline-block border-2 px-2 py-0.5 text-[12px] leading-relaxed text-[color:var(--paper)]"
      style={{ borderColor: "var(--accent-yellow)", borderRadius: 0 }}
      aria-live="polite"
    >
      {message}
    </span>
  );
}
