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
};

const JournalForm = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, onSubmit, isSubmitting = false, hasError = false }: Props, ref) => {
    const isTooLong = value.length > MAX_LENGTH;
    const isEmpty = value.trim().length === 0;
    const canSubmit = !isEmpty && !isTooLong && !isSubmitting;

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!canSubmit) return;
      onSubmit(value);
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

        <textarea
          ref={ref}
          id="journal-entry"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isSubmitting}
          rows={4}
          placeholder="Write freely — there's no wrong way to say it."
          className="w-full resize-none border-2 bg-white p-4 text-base leading-relaxed text-[color:var(--ink)] outline-none transition-colors placeholder:text-[color:var(--muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-pink)] disabled:opacity-60 sm:min-h-40"
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
