import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Eixy } from "../components/Eixy";

describe("Eixy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when isVisible is false", () => {
    const { container } = render(<Eixy state="intro" isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("prioritizes isListening pose over isThinking", () => {
    const { container } = render(
      <Eixy state="positive" isVisible isListening isThinking />
    );
    const sprite = container.querySelector('[class*="origin-bottom"]');
    expect(sprite).toHaveClass("animate-eixy-walk");
    expect(sprite).not.toHaveClass("animate-eixy-think");
  });

  it("switches to waiting state after 20s of idle visibility and resets on isListening", async () => {
    const { container } = render(<Eixy state="intro" isVisible />);
    const sprite = container.querySelector('[class*="origin-bottom"]');

    await act(async () => {
      vi.advanceTimersByTime(20000);
    });

    expect(sprite).toHaveClass("animate-eixy-wait");
    expect(screen.getByText("Take your time.")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    const newContainer = render(<Eixy state="intro" isVisible isListening />).container;
    const newSprite = newContainer.querySelector('[class*="origin-bottom"]');
    expect(newSprite).not.toHaveClass("animate-eixy-wait");
  });

  it("suppresses bubble fade while isListening is true", async () => {
    render(<Eixy state="intro" isVisible isListening />);
    const bubble = screen.getByRole("status");
    expect(bubble).toHaveStyle({ opacity: "1" });

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(bubble).toHaveStyle({ opacity: "1" });
  });

  it("reflects active mode in aria-label", () => {
    const { rerender, container } = render(<Eixy state="intro" isVisible />);
    expect(container.firstChild).toHaveAttribute("aria-label", "Eixy, intro");

    rerender(<Eixy state="positive" isVisible isListening />);
    expect(container.firstChild).toHaveAttribute("aria-label", "Eixy, listening");

    rerender(<Eixy state="elevated" isVisible isThinking />);
    expect(container.firstChild).toHaveAttribute("aria-label", "Eixy, thinking");
  });

  it("displays typing quotes while listening", async () => {
    render(<Eixy state="intro" isVisible isListening />);
    expect(screen.getByText(/Reaching out like this takes real guts|Not everyone says the hard stuff out loud|Asking for help is the brave move|You didn't have to write this|Naming what's going on takes guts|Saying it instead of sitting on it/)).toBeInTheDocument();
  });
});
