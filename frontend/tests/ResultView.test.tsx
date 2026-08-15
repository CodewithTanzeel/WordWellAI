import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultView } from "../components/ResultView";

const baseResult = {
  status: "ok" as const,
  label: "elevated_stress_signals",
  confidence: 0.78,
  disclaimer: "This is not a diagnosis. If you're struggling, please talk to a professional.",
  crisis: false as const,
};

describe("ResultView", () => {
  it("renders the label", () => {
    render(<ResultView result={baseResult} />);
    expect(screen.getByText(/elevated_stress_signals|elevated stress signals/i)).toBeInTheDocument();
  });

  it("renders confidence as a percentage", () => {
    render(<ResultView result={baseResult} />);
    expect(screen.getByText(/78%/)).toBeInTheDocument();
  });

  it("always renders the not-a-diagnosis disclaimer", () => {
    render(<ResultView result={baseResult} />);
    expect(screen.getByText(/not a diagnosis/i)).toBeInTheDocument();
  });

  it("does not render any crisis resources", () => {
    render(<ResultView result={baseResult} />);
    expect(screen.queryByText(/988|crisis text line|hotline/i)).not.toBeInTheDocument();
  });
});
