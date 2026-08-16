"use client";

import { useEffect, useRef, useState } from "react";
import { JournalForm } from "./components/JournalForm";
import { ResultView } from "./components/ResultView";
import { CrisisView } from "./components/CrisisView";
import { CheckInCount } from "./components/CheckInCount";
import { PixelSkyline } from "./components/PixelSkyline";
import { Eixy } from "./components/Eixy";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type NormalResult = {
  status: "ok";
  label: string;
  confidence: number;
  disclaimer: string;
  crisis: false;
  severity?: "low" | "elevated";
};

type CrisisResult = {
  status: "ok";
  crisis: true;
  message: string;
  resources: { name: string; contact: string }[];
};

type AnalyzeResult = NormalResult | CrisisResult;

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "sift-device-id";
  let id: string | null = null;
  try {
    id = window.localStorage.getItem(key);
  } catch {
    // private browsing or quota exceeded — fall back to a transient id
  }
  if (!id) {
    try {
      id = crypto.randomUUID();
    } catch {
      id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    try {
      window.localStorage.setItem(key, id);
    } catch {
      // silent — persistence is optional
    }
  }
  return id;
}

async function fetchCheckinCount(): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/api/checkins`, {
      headers: { "X-Device-Id": getDeviceId() },
    });
    const data = await res.json();
    return typeof data?.count === "number" ? data.count : 0;
  } catch {
    return 0;
  }
}

function getEixyState(
  result: AnalyzeResult | null
): "intro" | "positive" | "elevated" | null {
  if (!result || result.crisis) return null;
  const normalResult = result as NormalResult;
  return normalResult.severity === "elevated" ? "elevated" : "positive";
}

export function App() {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEixy, setShowEixy] = useState(true);
  const [text, setText] = useState("");
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        setLastCheckIn(window.localStorage.getItem("sift-last-checkin"));
      } catch {
        // silent — persistence is optional
      }
    }
  }, []);

  useEffect(() => {
    fetchCheckinCount().then(setCount);
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  function handleNewCheckIn() {
    setResult(null);
    setError(null);
    setShowEixy(true);
    setText("");
    requestAnimationFrame(() => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      textareaRef.current?.focus();
    });
  }

  async function handleSubmit(submittedText: string) {
    setShowEixy(false);
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": getDeviceId(),
        },
        body: JSON.stringify({ text: submittedText }),
      });
      const data = await res.json();

      if (data.status === "error") {
        setError(data.message ?? "Something went wrong. Please try again.");
        setResult(null);
      } else {
        setResult(data as AnalyzeResult);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("sift-last-checkin", new Date().toISOString());
          } catch {
            // silent — persistence is optional
          }
        }
      }

      const nextCount = await fetchCheckinCount();
      setCount(nextCount);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowEixy(true);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--bg-game)" }} className="min-h-screen">
      {/* Nav bar: wordmark + one real, useful link straight to the
          crisis resources, instead of placeholder pages this app
          doesn't have. */}
      <nav
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4"
        style={{ backgroundColor: "var(--accent-pink)" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[12px] text-white">WORDWELL</span>
          <CheckInCount count={count} />
        </div>
        <a
          href="#crisis-resources"
          className="font-pixel inline-block py-3 px-2 text-[12px] text-white underline decoration-2 underline-offset-4 transition-all duration-150 hover:brightness-110 hover:text-[color:var(--accent-yellow)]"
        >
          <span className="sm:hidden">CRISIS ↓</span>
          <span className="hidden sm:inline">CRISIS RESOURCES ↓</span>
        </a>
      </nav>

      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-16">
        <header className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-pixel text-3xl text-[color:var(--paper)] sm:text-4xl">
            WORDWELL
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-[color:var(--muted)]">
            Write a few lines about how you&apos;re doing. This is a
            reflection tool, not a diagnosis.
          </p>
        </header>

        <JournalForm
          ref={textareaRef}
          value={text}
          onChange={setText}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          hasError={!!error}
          lastCheckIn={lastCheckIn ?? undefined}
        />

        {error && (
          <p
            ref={errorRef}
            role="alert"
            className="font-pixel text-[12px] leading-relaxed text-[color:var(--accent-crisis)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-crisis)]"
          >
            {error}
          </p>
        )}

        {result && !result.crisis && <ResultView result={result} />}
        {result && result.crisis && <CrisisView result={result} />}

        {result && (
          <button
            type="button"
            onClick={handleNewCheckIn}
            className="pixel-border-pink font-pixel px-6 py-3 text-[12px] text-white transition-all duration-150 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[color:var(--accent-pink-dark)] focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            style={{ backgroundColor: "var(--accent-pink)" }}
          >
            ▶ NEW CHECK-IN
          </button>
        )}

        <div className="mt-auto w-full pt-8">
          <PixelSkyline />
          <footer
            id="crisis-resources"
            className="pt-4 text-center text-xs leading-relaxed text-[color:var(--muted)]"
          >
            If you&apos;re in crisis right now: call or text 988 (US), or
            text HOME to 741741.
          </footer>
        </div>
      </main>

      {/* Fixed, floating in the bottom-right corner independent of scroll —
          not part of the CrisisView boundary: hidden there per the locked
          tonal-split decision (DESIGN_LOG.md). */}
      <Eixy
        state={result && !result.crisis ? getEixyState(result) ?? "positive" : "intro"}
        isVisible={showEixy && !(result && result.crisis)}
        isListening={!result && text.trim().length > 0}
        isThinking={isSubmitting}
      />
    </div>
  );
}
