"use client";

import { useTradeStatusPresentation } from "@/hooks/useTradeStatusPresentation";

export function TradeStatusBadge({ status, className = "" }: { status: string | null | undefined; className?: string }) {
  const { label, className: toneClass } = useTradeStatusPresentation(status);
  return (
    <span
      data-testid="trade-status-badge"
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneClass} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
