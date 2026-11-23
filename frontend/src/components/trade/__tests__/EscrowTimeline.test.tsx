import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EscrowTimeline, type EscrowTimelineEvent } from "../EscrowTimeline";

const events: EscrowTimelineEvent[] = Array.from({ length: 6 }, (_, i) => ({
  id: `e${i}`,
  title: `Milestone ${i}`,
  timestamp: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
}));

describe("EscrowTimeline", () => {
  it("shows the 3 most recent milestones and collapses older ones", () => {
    render(<EscrowTimeline events={events} />);
    expect(screen.getByText("Milestone 5")).toBeVisible();
    expect(screen.getByText("Milestone 3")).toBeVisible();
    expect(screen.getByText("Milestone 2")).not.toBeVisible();
    expect(screen.getByRole("button", { name: /show full history/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles with Enter and Space", async () => {
    const user = userEvent.setup();
    render(<EscrowTimeline events={events} />);
    const toggle = screen.getByRole("button", { name: /show full history/i });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Milestone 0")).toBeVisible();
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("omits the accordion when there are 3 or fewer events", () => {
    render(<EscrowTimeline events={events.slice(0, 3)} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
