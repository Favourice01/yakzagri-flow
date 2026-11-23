export interface TransitProgress {
  /** 0–100 */
  percent: number;
  remainingMs: number;
  imminent: boolean;
  label: string;
}

const IMMINENT_PERCENT = 95;

function formatRemaining(ms: number): string {
  const totalMin = Math.max(1, Math.ceil(ms / 60_000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export function computeTransitProgress(
  dispatchedAt: string | number | Date,
  estimatedHours: number,
  now: number = Date.now(),
): TransitProgress | null {
  const start = new Date(dispatchedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(estimatedHours) || estimatedHours <= 0) return null;
  const total = estimatedHours * 3_600_000;
  const elapsed = Math.min(Math.max(now - start, 0), total);
  const percent = Math.round((elapsed / total) * 1000) / 10;
  const remainingMs = total - elapsed;
  const imminent = percent >= IMMINENT_PERCENT;
  return {
    percent,
    remainingMs,
    imminent,
    label: imminent ? "Arrival imminent" : formatRemaining(remainingMs),
  };
}
