"use client";

import { useEffect, useState } from "react";
import { computeTransitProgress } from "@/lib/trades/transitProgress";

interface Props {
  dispatchedAt: string;
  estimatedHours: number;
}

export function TransitProgressBar({ dispatchedAt, estimatedHours }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const progress = computeTransitProgress(dispatchedAt, estimatedHours, now);
  if (!progress) return null;

  return (
    <div data-testid="transit-progress" className="rounded-lg border border-border-default bg-bg-card p-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="uppercase tracking-wide text-text-muted">Transit progress</span>
        <span className="font-medium text-text-primary">{progress.percent.toFixed(0)}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress.percent)}
        aria-label="Estimated transit progress"
        className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-700 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-text-secondary">{progress.label}</p>
    </div>
  );
}
