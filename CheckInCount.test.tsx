import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckInCount } from "../components/CheckInCount";

describe("CheckInCount", () => {
  it("renders the current count in plain language", () => {
    render(<CheckInCount count={3} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/check-in|checked in/i)).toBeInTheDocument();
  });

  it("welcomes a first-time user without punitive or countdown framing at zero", () => {
    render(<CheckInCount count={0} />);
    // must not read like "day 0" or "streak broken"
    expect(screen.queryByText(/day 0|streak/i)).not.toBeInTheDocument();
  });

  it("never renders streak, badge, points, or score language at any count", () => {
    for (const count of [0, 1, 5, 30]) {
      const { unmount } = render(<CheckInCount count={count} />);
      const text = document.body.textContent?.toLowerCase() ?? "";
      for (const forbidden of ["streak", "badge", "points", "level up", "score", "reward"]) {
        expect(text).not.toContain(forbidden);
      }
      unmount();
    }
  });

  it("does not render a progress bar, meter, or numeric goal to hit", () => {
    render(<CheckInCount count={2} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/\/\s*\d+|goal/i)).not.toBeInTheDocument();
  });
});
