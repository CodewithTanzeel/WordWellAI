"use client";

import { useEffect, useState } from "react";
import { JournalForm } from "./components/JournalForm";
import { ResultView } from "./components/ResultView";
import { CrisisView } from "./components/CrisisView";
import { CheckInCount } from "./components/CheckInCount";
import { PixelSkyline } from "./components/PixelSkyline";
import { Hixy } from "./components/Hixy";

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
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
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

function getHixyState(
  result: AnalyzeResult | null
): "intro" | "positive" | "elevated" | null {
  if (!result || result.crisis) return null;
  const normalResult = result as NormalResult;
  // PENDING: Backend needs to add `severity: "low" | "elevated"` to /api/analyze response.
  // Until then, all non-crisis results default to "positive" state.
  return normalResult.severity === "elevated" ? "elevated" : "positive";
}

export function App() {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHixy, setShowHixy] = useState(true);

  useEffect(() => {
    fetchCheckinCount().then(setCount);
  }, []);

  async function handleSubmit(text: string) {
    setShowHixy(false);
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": getDeviceId(),
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (data.status === "error") {
        setError(data.message ?? "Something went wrong. Please try again.");
        setResult(null);
      } else {
        setResult(data as AnalyzeResult);
      }

      const nextCount = await fetchCheckinCount();
      setCount(nextCount);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--bg-game)" }} className="min-h-screen">
      {/* Nav bar: wordmark + one real, useful link straight to the
          crisis resources, instead of placeholder pages this app
          doesn't have. */}
      <nav
        className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--accent-pink)" }}
      >
        <span className="font-pixel text-[11px] text-white">SIFT</span>
        <a
          href="#crisis-resources"
          className="font-pixel text-[9px] text-white underline decoration-2 underline-offset-4"
        >
          CRISIS RESOURCES ↓
        </a>
      </nav>

      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-16">
        <header className="flex flex-col items-center gap-4 text-center">
          <Hixy state="intro" isVisible={showHixy} />
          <h1 className="font-pixel text-3xl text-[color:var(--paper)] sm:text-4xl">
            SIFT
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-[color:var(--muted)]">
            Write a few lines about how you&apos;re doing. This is a
            reflection tool, not a diagnosis.
          </p>
        </header>

        <JournalForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        {error && (
          <p
            role="alert"
            className="font-pixel text-[10px] leading-relaxed text-[color:var(--accent-crisis)]"
          >
            {error.toUpperCase()}
          </p>
        )}

        {result && !result.crisis && <ResultView result={result} />}
        {result && !result.crisis && (
          <Hixy state={getHixyState(result) || "positive"} isVisible={true} />
        )}
        {result && result.crisis && <CrisisView result={result} />}

        <CheckInCount count={count} />

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
    </div>
  );
}
