export type MilestoneState = "released" | "unlocked" | "locked";

export interface StreamMilestone {
  id: string;
  title: string;
  criteria: string;
  /** Unix seconds. */
  disbursementDate: number;
  state: MilestoneState;
}

const STATE_LABEL: Record<MilestoneState, string> = {
  released: "Released",
  unlocked: "Unlocked",
  locked: "Locked",
};

/** Default agricultural tranches spread evenly across the stream. */
export function buildDefaultMilestones(
  startTime: number,
  endTime: number,
  claimedPercent: number,
  nowSec: number = Date.now() / 1000,
): StreamMilestone[] {
  const steps = [
    { id: "planting", title: "Planting", criteria: "Planting confirmed on site" },
    { id: "weeding", title: "Weeding", criteria: "Crop maintenance verified" },
    { id: "harvest", title: "Harvest", criteria: "Harvest delivered and weighed" },
  ];
  const span = endTime - startTime;
  return steps.map((s, i) => {
    const fraction = (i + 1) / steps.length;
    const date = startTime + span * fraction;
    const state: MilestoneState =
      claimedPercent >= fraction * 100 - 0.001
        ? "released"
        : nowSec >= date
          ? "unlocked"
          : "locked";
    return { ...s, disbursementDate: date, state };
  });
}

export function StreamMilestones({ milestones }: { milestones: StreamMilestone[] }) {
  return (
    <div className="rounded-2xl border border-border-default bg-card p-5">
      <p className="mb-4 text-xs uppercase tracking-[0.22em] text-text-secondary">
        Milestone Payouts
      </p>
      <ol aria-label="Milestone payout progress" className="grid gap-4 md:grid-cols-3">
        {milestones.map((m, i) => (
          <li
            key={m.id}
            aria-current={m.state === "unlocked" ? "step" : undefined}
            className="rounded-xl border border-border-default bg-bg-elevated p-4"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  m.state === "released"
                    ? "bg-status-success text-text-inverse"
                    : "border border-border-default text-text-muted"
                }`}
              >
                {m.state === "released" ? "✓" : i + 1}
              </span>
              <span className="text-sm font-semibold text-text-primary">
                <span className="sr-only">{`Step ${i + 1} of ${milestones.length}: `}</span>
                {m.title}
              </span>
            </div>
            <p className="mt-2 text-xs text-text-secondary">{m.criteria}</p>
            <p className="mt-1 text-xs text-text-muted">
              {new Date(m.disbursementDate * 1000).toLocaleDateString()}
            </p>
            <p className="mt-2 text-xs font-medium text-text-primary">
              <span className="sr-only">Status: </span>
              {STATE_LABEL[m.state]}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
