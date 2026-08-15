type Resource = { name: string; contact: string };

type CrisisResult = {
  crisis: true;
  message: string;
  resources: Resource[];
};

// Deliberately outside the pixel/game theme: calm palette, serif type,
// no game chrome. This screen should read as a break in tone on purpose.
export function CrisisView({ result }: { result: CrisisResult }) {
  return (
    <div
      data-testid="crisis-panel"
      role="alert"
      className="w-full max-w-xl rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--accent-crisis-soft)",
        borderColor: "var(--accent-crisis-border)",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1 h-2.5 w-2.5 flex-none rounded-full"
          style={{ backgroundColor: "var(--accent-crisis)" }}
        />
        <p className="font-serif text-lg leading-relaxed text-[color:var(--calm-ink)]">
          {result.message}
        </p>
      </div>

      <p className="mt-4 text-sm text-[color:var(--calm-muted)]">
        You don&apos;t have to go through this alone. These are free and
        available right now:
      </p>

      <ul className="mt-3 space-y-2">
        {result.resources.map((resource) => (
          <li
            key={resource.name}
            className="rounded-xl bg-[color:var(--calm-surface)] px-4 py-3 text-sm"
          >
            <span className="block font-medium text-[color:var(--calm-ink)]">
              {resource.name}
            </span>
            <span className="text-[color:var(--calm-muted)]">{resource.contact}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
