import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { JournalForm } from "../components/JournalForm";

function Wrapper(props: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");
    return (
    <JournalForm
      value={value}
      onChange={setValue}
      onSubmit={props.onSubmit}
    />
  );
}

describe("JournalForm", () => {
  it("renders a textarea and a submit button", () => {
    render(<JournalForm value="" onChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit|analyze|check in/i })).toBeInTheDocument();
  });

  it("disables the submit button when the textarea is empty", () => {
    render(<JournalForm value="" onChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("enables the submit button once text is entered", async () => {
    const user = userEvent.setup();
    render(<Wrapper onSubmit={vi.fn()} />);
    await user.type(screen.getByRole("textbox"), "a normal day");
    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("calls onSubmit with the entered text when submitted", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<Wrapper onSubmit={handleSubmit} />);
    await user.type(screen.getByRole("textbox"), "today was a good day");
    await user.click(screen.getByRole("button"));
    expect(handleSubmit).toHaveBeenCalledWith("today was a good day");
  });

  it("shows a validation message and blocks submit past 2000 characters", async () => {
    const handleSubmit = vi.fn();
    const longText = "a".repeat(2001);
    render(<Wrapper onSubmit={handleSubmit} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: longText } });
    expect(screen.getByText(/too long|2000/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows a loading state while isSubmitting is true", () => {
    render(<JournalForm value="" onChange={vi.fn()} onSubmit={vi.fn()} isSubmitting />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText(/analyzing|loading|thinking/i)).toBeInTheDocument();
  });
});
