import { render, screen } from "@testing-library/react";
import { computeReleased } from "../StreamTicker";
import { StreamActions, isStreamFinalized } from "../StreamActions";
import { StreamMilestones, buildDefaultMilestones } from "../StreamMilestones";

describe("computeReleased", () => {
  it("clamps before start and after end", () => {
    expect(computeReleased(100, 10, 20, 0)).toBe(0);
    expect(computeReleased(100, 10, 20, 15)).toBe(50);
    expect(computeReleased(100, 10, 20, 99)).toBe(100);
  });
});

describe("StreamActions", () => {
  it.each(["ACTIVE", "SUSPENDED"])("shows cancel for %s", (status) => {
    render(<StreamActions status={status} cancelHref="/x" />);
    expect(screen.getByText("Cancel Stream")).toBeInTheDocument();
  });
  it.each(["COMPLETED", "CANCELLED", "TERMINATED"])("shows finalized for %s", (status) => {
    render(<StreamActions status={status} cancelHref="/x" />);
    expect(screen.queryByText("Cancel Stream")).toBeNull();
    expect(screen.getByText("Stream Finalized")).toBeInTheDocument();
    expect(isStreamFinalized(status)).toBe(true);
  });
});

describe("StreamMilestones", () => {
  it("renders stepper with release states", () => {
    render(<StreamMilestones milestones={buildDefaultMilestones(0, 300, 40, 1000)} />);
    expect(screen.getByRole("list", { name: /milestone/i })).toBeInTheDocument();
    expect(screen.getAllByText("Released")).toHaveLength(1);
    expect(screen.getAllByText("Unlocked")).toHaveLength(2);
  });
});
