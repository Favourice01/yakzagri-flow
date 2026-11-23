"use client";

import React, { useId, useMemo, useState } from "react";

export type EscrowTimelineStatus = "completed" | "active" | "pending";

export interface EscrowTimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  actor?: string;
  status?: EscrowTimelineStatus;
}

export interface EscrowTimelineProps {
  events: EscrowTimelineEvent[];
  /** Number of most recent milestones shown expanded. Defaults to 3. */
  recentCount?: number;
  className?: string;
}

function toTime(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

const DOT_CLASS: Record<EscrowTimelineStatus, string> = {
  completed: "bg-accent-emerald",
  active: "bg-gold",
  pending: "bg-border-default",
};

function EventRow({ event }: { event: EscrowTimelineEvent }) {
  const status = event.status ?? "completed";
  return (
    <li className="flex gap-3" data-testid="escrow-timeline-event">
      <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[status]}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{event.title}</p>
        <p className="text-xs text-text-muted">
          <time dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>
          {event.actor ? ` · ${event.actor}` : null}
        </p>
        {event.description && <p className="mt-1 text-xs text-text-secondary">{event.description}</p>}
      </div>
    </li>
  );
}

/**
 * Escrow history timeline. The most recent milestones stay visible; older ones
 * are grouped into a keyboard-accessible "Show full history" accordion so long
 * negotiation/dispatch/dispute histories don't push trade details off screen.
 */
export function EscrowTimeline({ events, recentCount = 3, className = "" }: EscrowTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const { recent, older } = useMemo(() => {
    const sorted = [...events].sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp));
    const n = Math.max(0, recentCount);
    return { recent: sorted.slice(0, n), older: sorted.slice(n) };
  }, [events, recentCount]);

  if (events.length === 0) {
    return <p className={`text-sm text-text-muted ${className}`}>No escrow activity yet.</p>;
  }

  return (
    <section aria-label="Escrow timeline" className={`space-y-3 ${className}`}>
      <ol className="space-y-3">
        {recent.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </ol>

      {older.length > 0 && (
        <div>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-gold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
          >
            {expanded ? "Hide full history" : `Show full history (${older.length} earlier)`}
          </button>
          <ol id={panelId} hidden={!expanded} className="mt-3 space-y-3">
            {older.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

export default EscrowTimeline;
