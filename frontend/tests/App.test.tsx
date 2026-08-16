import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

function mockFetchOnce(payload: unknown, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => payload,
  }) as unknown as typeof fetch;
}

describe("App integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the normal result view for a non-crisis entry", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      status: "ok",
      label: "elevated_stress_signals",
      confidence: 0.6,
      disclaimer: "This is not a diagnosis.",
      crisis: false,
    });

    render(<App />);
    await user.type(screen.getByRole("textbox"), "a fairly normal day");
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText(/60%/)).toBeInTheDocument();
    expect(screen.queryByTestId("crisis-panel")).not.toBeInTheDocument();
  });

  it("shows the crisis view instead of a label for a high-risk entry", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      status: "ok",
      label: null,
      confidence: null,
      crisis: true,
      message: "It sounds like you might be going through something serious.",
      resources: [{ name: "988 Suicide & Crisis Lifeline (US)", contact: "call or text 988" }],
    });

    render(<App />);
    await user.type(screen.getByRole("textbox"), "I want to end it all");
    await user.click(screen.getByRole("button"));

    expect(await screen.findByTestId("crisis-panel")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("bumps the visible check-in count after a completed analysis", async () => {
    const user = userEvent.setup();
    global.fetch = vi
      .fn()
      // GET /api/checkins on mount
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 2 }) })
      // POST /api/analyze
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "ok",
          label: "calm",
          confidence: 0.5,
          disclaimer: "This is not a diagnosis.",
          crisis: false,
        }),
      })
      // GET /api/checkins refetched after submit
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 3 }) }) as unknown as typeof fetch;

    render(<App />);
    expect(await screen.findByText(/2/)).toBeInTheDocument();

    await user.type(screen.getByRole("textbox"), "a normal entry");
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText(/3/)).toBeInTheDocument();
  });

  it("writes sift-last-checkin on successful submit and preserves it on NEW CHECK-IN", async () => {
    const user = userEvent.setup();
    const setItem = vi.fn();
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = setItem;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        label: "calm",
        confidence: 0.5,
        disclaimer: "This is not a diagnosis.",
        crisis: false,
      }),
    }) as unknown as typeof fetch;

    render(<App />);
    await user.type(screen.getByRole("textbox"), "a normal entry");
    await user.click(screen.getByRole("button"));

    expect(setItem).toHaveBeenCalledWith("sift-last-checkin", expect.any(String));
    const lastValue = setItem.mock.calls.find(([k]) => k === "sift-last-checkin")?.[1];
    expect(lastValue).toBeTruthy();
    expect(() => new Date(lastValue as string).toISOString()).not.toThrow();

    await user.click(screen.getByRole("button", { name: /new check-in/i }));
    const preserved = setItem.mock.calls.filter(([k]) => k === "sift-last-checkin");
    expect(preserved.length).toBeGreaterThanOrEqual(1);

    Storage.prototype.setItem = originalSetItem;
  });
});
