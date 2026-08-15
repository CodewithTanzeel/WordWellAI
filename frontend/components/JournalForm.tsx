"use client";

import { useState } from "react";

const MAX_LENGTH = 2000;

type Props = {
  onSubmit: (text: string) => void;
  isSubmitting?: boolean;
};

export function JournalForm({ onSubmit, isSubmitting = false }: Props) {
  const [text, setText] = useState("");

  const isTooLong = text.length > MAX_LENGTH;
  const isEmpty = text.trim().length === 0;
  const canSubmit = !isEmpty && !isTooLong && !isSubmitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(text);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="pixel-border w-full max-w-xl p-5"
      style={{ backgroundColor: "var(--panel-sky)" }}
    >
      <label
        htmlFor="journal-entry"
        className="font-pixel mb-3 block text-[11px] leading-relaxed text-[color:var(--ink)]"
      >
        WHAT&apos;S ON YOUR MIND?
      </label>

      <textarea
        id="journal-entry"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
        rows={6}
        placeholder="Write freely — there's no wrong way to say it."
        className="w-full resize-none border-2 bg-white p-4 text-base leading-relaxed text-[color:var(--ink)] outline-none transition-colors placeholder:text-[color:var(--muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-pink)] disabled:opacity-60"
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
            ? `That's too long by ${text.length - MAX_LENGTH} characters — the limit is 2000.`
            : `${text.length} / ${MAX_LENGTH}`}
        </span>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="pixel-border-pink font-pixel mt-4 w-full px-6 py-3 text-[11px] text-white transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        style={{ backgroundColor: "var(--accent-pink)" }}
      >
        {isSubmitting ? "▶ THINKING…" : "▶ CHECK IN"}
      </button>
    </form>
  );
}
