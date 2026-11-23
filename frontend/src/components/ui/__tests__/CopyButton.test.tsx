import { render, screen, act, fireEvent } from "@testing-library/react";
import { CopyButton, copyToClipboard } from "../CopyButton";

describe("CopyButton", () => {
  const writeText = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.useFakeTimers();
    writeText.mockClear();
    Object.assign(navigator, { clipboard: { writeText } });
  });
  afterEach(() => jest.useRealTimers());

  it("copies the exact value and shows 'Copied!' for 2 seconds", async () => {
    render(<CopyButton value="GABC123HASH" label="Copy transaction hash" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy transaction hash" }));
    });
    expect(writeText).toHaveBeenCalledWith("GABC123HASH");
    expect(screen.getByText("Copied!")).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.queryByText("Copied!")).toBeNull();
  });

  it("is a focusable native button (Enter triggers click)", () => {
    render(<CopyButton value="x" label="Copy trade ID" />);
    const btn = screen.getByRole("button", { name: "Copy trade ID" });
    btn.focus();
    expect(btn).toHaveFocus();
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).toHaveAttribute("type", "button");
  });

  it("falls back to execCommand when Clipboard API is unavailable", async () => {
    Object.assign(navigator, { clipboard: undefined });
    const exec = jest.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { value: exec, configurable: true });
    await expect(copyToClipboard("fallback")).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
  });
});
