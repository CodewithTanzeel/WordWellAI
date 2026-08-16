"use client";

import { forwardRef } from "react";

const MAX_LENGTH = 2000;

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
  isSubmitting?: boolean;
  /** True when the last submit attempt failed — swaps the button label to an explicit retry affordance. */
  hasError?: boolean;
  lastCheckIn?: string;
};

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

const JournalForm = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, onSubmit, isSubmitting = false, hasError = false, lastCheckIn }: Props, ref) => {
    const isTooLong = value.length > MAX_LENGTH;
    const isEmpty = value.trim().length === 0;
    const canSubmit = !isEmpty && !isTooLong && !isSubmitting;

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!canSubmit) return;
      onSubmit(value);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSubmit) {
        e.preventDefault();
        onSubmit(value);
      }
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="pixel-border w-full max-w-xl p-5"
        style={{ backgroundColor: "var(--panel-sky)" }}
      >
        <label
          htmlFor="journal-entry"
          className="font-pixel mb-3 block text-[12px] leading-relaxed text-[color:var(--ink)]"
        >
          WHAT&apos;S ON YOUR MIND?
        </label>

        {lastCheckIn && (
          <p className="font-pixel mb-2 text-[11px] text-[color:var(--muted)]">
            Last check-in: {formatRelativeTime(lastCheckIn)}
          </p>
        )}

        <textarea
          ref={ref}
          id="journal-entry"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          rows={Math.min(8, Math.max(4, Math.ceil(value.length / 80)))}
          placeholder="Write freely — there's no wrong way to say it."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full resize-none border-2 bg-white p-4 text-base leading-relaxed text-[color:var(--ink)] outline-none transition-colors placeholder:text-[color:var(--muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-pink)] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            borderRadius: 0,
            borderColor: isTooLong ? "var(--accent-crisis)" : "var(--ink)",
          }}
        />

        <div className="mt-2 flex items-center justify-between text-xs">
          <span
            aria-live="polite"
            className={isTooLong ? "font-medium text-[color:var(--accent-crisis)]" : "text-[color:var(--ink)]/70"}
          >
            {isTooLong
              ? `That's too long by ${value.length - MAX_LENGTH} characters — the limit is 2000.`
              : `${value.length} / ${MAX_LENGTH}`}
          </span>
          {!isTooLong && value.length >= 1800 && (
            <span className="text-[color:var(--accent-yellow)]">
              Getting close to the limit — you have 2000 characters.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="pixel-border-pink font-pixel mt-4 flex w-full items-center justify-center gap-2 px-6 py-3 text-[12px] text-white transition-all duration-150 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[color:var(--accent-pink-dark)] focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          style={{ backgroundColor: "var(--accent-pink)" }}
        >
          {isSubmitting && (
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 animate-spin-pulse bg-white"
              style={{ borderRadius: 0 }}
            />
          )}
          {isSubmitting ? "▶ THINKING…" : hasError ? "▶ TRY AGAIN" : "▶ CHECK IN"}
        </button>
      </form>
    );
  }
);

JournalForm.displayName = "JournalForm";

export { JournalForm };
