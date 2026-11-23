"use client";

import React, { useState } from "react";
import { sliceYield, type YieldPoint, type YieldRange } from "./collateral";

const RANGES: YieldRange[] = [7, 30, 90];
const W = 600;
const H = 200;
const PAD = 32;

export function YieldChart({ data }: { data: YieldPoint[] }) {
  const [range, setRange] = useState<YieldRange>(30);
  const points = sliceYield(data, range);

  return (
    <div className="rounded-2xl border border-border-default bg-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">Vault Yield (APY)</h2>
        <div className="flex gap-1 rounded-lg border border-border-default p-1 bg-bg-elevated">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                range === r ? "bg-gold text-text-inverse" : "text-text-secondary"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      {points.length < 2 ? (
        <p className="py-10 text-center text-sm text-text-secondary" data-testid="yield-empty">
          Not enough historical data yet.
        </p>
      ) : (
        <Chart points={points} />
      )}
    </div>
  );
}

function Chart({ points }: { points: YieldPoint[] }) {
  const ys = points.map((p) => p.apy);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (points.length - 1);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - 2 * PAD);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.apy)}`).join(" ");
  const last = points.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Yield trend">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" />
      <text x={PAD} y={14} fontSize="11" fill="currentColor" className="text-text-muted">
        {max.toFixed(2)}%
      </text>
      <text x={PAD} y={H - 4} fontSize="11" fill="currentColor" className="text-text-muted">
        {points[0].date}
      </text>
      <text x={W - PAD} y={H - 4} fontSize="11" textAnchor="end" fill="currentColor" className="text-text-muted">
        {points[last].date}
      </text>
      <circle cx={x(last)} cy={y(points[last].apy)} r="4" className="fill-gold" />
      <text x={x(last)} y={y(points[last].apy) - 8} fontSize="11" textAnchor="end" fill="currentColor" className="text-text-primary">
        {points[last].apy.toFixed(2)}%
      </text>
    </svg>
  );
}
