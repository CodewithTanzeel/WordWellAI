export function CheckInCount({ count }: { count: number }) {
  const message =
    count === 0
      ? "Welcome — this is your first check-in."
      : `You've checked in ${count} time${count === 1 ? "" : "s"}.`;

  return (
    <p
      className="font-pixel inline-block border-2 px-3 py-2 text-[9px] leading-relaxed text-[color:var(--paper)]"
      style={{ borderColor: "var(--accent-yellow)", borderRadius: 0 }}
      aria-live="polite"
    >
      {message}
    </p>
  );
}
