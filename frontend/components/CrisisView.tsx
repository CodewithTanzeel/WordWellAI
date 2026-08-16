import { useEffect, useRef } from "react";

type Resource = { name: string; contact: string };

function contactHref(contact: string): string {
  const lower = contact.toLowerCase();
  const phoneMatch = contact.match(/[\d+()-]{7,}/);
  if (lower.includes("text") && phoneMatch) {
    const number = phoneMatch[0].replace(/[^+\d]/g, "");
    return `sms:${number}`;
  }
  if (lower.includes("call") && phoneMatch) {
    const number = phoneMatch[0].replace(/[^+\d]/g, "");
    return `tel:${number}`;
  }
  if (phoneMatch) {
    const number = phoneMatch[0].replace(/[^+\d]/g, "");
    return `tel:${number}`;
  }
  if (contact.startsWith("http")) return contact;
  return "#";
}

function contactLabel(contact: string): string {
  const lower = contact.toLowerCase();
  const phoneMatch = contact.match(/[\d+()-]{7,}/);
  if (!phoneMatch) return contact;
  const number = phoneMatch[0];
  if (lower.includes("text")) return `Text ${number}`;
  return `Call ${number}`;
}

type CrisisResult = {
  crisis: true;
  message: string;
  resources: Resource[];
};

export function CrisisView({ result }: { result: CrisisResult }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus();
  }, []);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      data-testid="crisis-panel"
      role="alert"
      className="w-full max-w-xl rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--accent-crisis-soft)",
        borderColor: "var(--accent-crisis-border)",
        animation: "fadeInSlow 0.25s ease-in-out",
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
            <a
              href={contactHref(resource.contact)}
              className="text-[color:var(--accent-crisis)] underline underline-offset-2 hover:brightness-110 transition-all duration-150"
            >
              {contactLabel(resource.contact)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
