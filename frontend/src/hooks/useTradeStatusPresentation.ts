import { useMemo } from "react";
import { TONE_CLASSES, type StatusTone } from "@/components/ui/StatusBadge";

export const TRADE_STATUSES = [
  "INITIATED",
  "FUNDED",
  "DISPATCHED",
  "DELIVERED",
  "DISPUTED",
  "SETTLED",
] as const;

export type TradeEscrowStatus = (typeof TRADE_STATUSES)[number];

export interface TradeStatusPresentation {
  /** Normalized, upper-cased status key. */
  status: string;
  tone: StatusTone;
  label: string;
  /** Icon name from the shared Icon set. */
  icon: string;
  className: string;
}

const PRESENTATION: Record<TradeEscrowStatus, { tone: StatusTone; label: string; icon: string }> = {
  INITIATED: { tone: "warning", label: "Initiated", icon: "clock" },
  FUNDED: { tone: "success", label: "Funded", icon: "lock" },
  DISPATCHED: { tone: "info", label: "Dispatched", icon: "truck" },
  DELIVERED: { tone: "success", label: "Delivered", icon: "check" },
  DISPUTED: { tone: "danger", label: "Disputed", icon: "alert" },
  SETTLED: { tone: "info", label: "Settled", icon: "check-circle" },
};

// Legacy / API aliases mapped onto the canonical escrow states.
const ALIASES: Record<string, TradeEscrowStatus> = {
  CREATED: "INITIATED",
  PENDING: "INITIATED",
  PENDING_SIGNATURE: "INITIATED",
  IN_TRANSIT: "DISPATCHED",
  CONFIRMED: "DELIVERED",
  COMPLETED: "SETTLED",
  RELEASED: "SETTLED",
  RESOLVED: "SETTLED",
};

export function getTradeStatusPresentation(raw: string | null | undefined): TradeStatusPresentation {
  const status = (raw ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const key = (ALIASES[status] ?? status) as TradeEscrowStatus;
  const entry = PRESENTATION[key] ?? {
    tone: "neutral" as StatusTone,
    label: status ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ") : "Unknown",
    icon: "info",
  };
  return { status, ...entry, className: TONE_CLASSES[entry.tone] };
}

export function useTradeStatusPresentation(raw: string | null | undefined): TradeStatusPresentation {
  return useMemo(() => getTradeStatusPresentation(raw), [raw]);
}
