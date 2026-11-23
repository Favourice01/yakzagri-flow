import type { AdminStreamSummary } from "./types";

export type StreamFilterStatus = "ACTIVE" | "SUSPENDED" | "COMPLETED" | "TERMINATED";

/** UI labels: Active, Paused (suspended), Completed, Clawed Back (terminated). */
export const STREAM_FILTER_STATUSES: { value: StreamFilterStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "TERMINATED", label: "Clawed Back" },
];

export interface StreamFilters {
  startDate?: string;
  endDate?: string;
  statuses?: StreamFilterStatus[];
}

export function filterStreams(streams: AdminStreamSummary[], f: StreamFilters) {
  const start = f.startDate ? Date.parse(`${f.startDate}T00:00:00Z`) : null;
  const end = f.endDate ? Date.parse(`${f.endDate}T23:59:59.999Z`) : null;
  const items = streams.filter((s) => {
    if (f.statuses?.length && !f.statuses.includes(s.status as StreamFilterStatus)) return false;
    const created = Date.parse(s.createdAt);
    if (start !== null && created < start) return false;
    if (end !== null && created > end) return false;
    return true;
  });
  const totalVolume = items.reduce((sum, s) => sum + BigInt(s.totalVested || "0"), BigInt(0)).toString();
  return { items, count: items.length, totalVolume };
}
