"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/i18n/format";
import { getNgnExchangeRate } from "@/lib/exchangeRate";

interface CollateralBreakdownProps {
  available: number;
  locked: number;
  yieldAccrued?: number;
  ngnRate?: number;
}

const SEGMENTS = [
  { key: "available", label: "Available", colorClass: "bg-emerald" },
  { key: "locked", label: "Escrow Locked", colorClass: "bg-gold" },
  { key: "yield", label: "Yield Accrued", colorClass: "bg-status-info" },
] as const;

export function CollateralBreakdown({
  available,
  locked,
  yieldAccrued = 0,
  ngnRate,
}: CollateralBreakdownProps) {
  const rate = ngnRate ?? getNgnExchangeRate();
  const [hovered, setHovered] = useState<string | null>(null);
  const values: Record<string, number> = { available, locked, yield: yieldAccrued };
  const total = available + locked + yieldAccrued;

  return (
    <div className="rounded-2xl border border-border-default bg-card p-4 md:p-5" data-testid="collateral-breakdown">
      <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">Collateral Breakdown</p>
      <p className="mt-1 text-lg font-bold text-text-primary">{formatNumber(total)} cNGN</p>

      <div
        className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-bg-elevated"
        role="img"
        aria-label="Collateral split between available, escrow locked and yield accrued"
      >
        {total > 0 &&
          SEGMENTS.map((seg) => {
            const value = values[seg.key];
            if (value <= 0) return null;
            return (
              <div
                key={seg.key}
                className={`${seg.colorClass} relative h-full transition-opacity ${hovered && hovered !== seg.key ? "opacity-50" : ""}`}
                style={{ width: `${(value / total) * 100}%` }}
                onMouseEnter={() => setHovered(seg.key)}
                onMouseLeave={() => setHovered(null)}
                title={`${seg.label}: ${formatNumber(value)} cNGN (₦${formatNumber(value * rate, { maximumFractionDigits: 2 })})`}
              />
            );
          })}
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SEGMENTS.map((seg) => {
          const value = values[seg.key];
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <li
              key={seg.key}
              tabIndex={0}
              onMouseEnter={() => setHovered(seg.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(seg.key)}
              onBlur={() => setHovered(null)}
              className={`rounded-lg border border-border-default p-3 text-xs ${hovered === seg.key ? "bg-bg-elevated" : ""}`}
            >
              <div className="flex items-center gap-1.5 text-text-secondary">
                <span className={`inline-block h-2 w-2 rounded-full ${seg.colorClass}`} />
                {seg.label} · {pct.toFixed(1)}%
              </div>
              <p className="mt-1 font-semibold text-text-primary">{formatNumber(value)} cNGN</p>
              <p className="text-text-muted">₦{formatNumber(value * rate, { maximumFractionDigits: 2 })}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
