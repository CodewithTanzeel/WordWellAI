import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CrisisView } from "../components/CrisisView";

const crisisResult = {
  status: "ok" as const,
  label: null,
  confidence: null,
  crisis: true as const,
  message: "It sounds like you might be going through something serious.",
  resources: [
    { name: "988 Suicide & Crisis Lifeline (US)", contact: "call or text 988" },
    { name: "Crisis Text Line", contact: "text HOME to 741741" },
  ],
};

describe("CrisisView", () => {
  it("renders the supportive message", () => {
    render(<CrisisView result={crisisResult} />);
    expect(screen.getByText(/going through something serious/i)).toBeInTheDocument();
  });

  it("renders every resource with its contact method", () => {
    render(<CrisisView result={crisisResult} />);
    expect(screen.getByText(/988 suicide & crisis lifeline/i)).toBeInTheDocument();
    expect(screen.getByText(/call or text 988/i)).toBeInTheDocument();
    expect(screen.getByText(/crisis text line/i)).toBeInTheDocument();
  });

  it("does not render a label or confidence score", () => {
    render(<CrisisView result={crisisResult} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
  });

  it("uses a distinct, non-default visual treatment from the normal result", () => {
    // Structural check that this isn't ResultView with different text:
    // it must carry its own identifiable container so it can be styled
    // differently (calmer colors, no confidence chrome, etc).
    render(<CrisisView result={crisisResult} />);
    expect(screen.getByTestId("crisis-panel")).toBeInTheDocument();
  });

  it("has an accessible alert role so assistive tech announces it immediately", () => {
    render(<CrisisView result={crisisResult} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
