"use client";

import { useEffect, useRef, useState } from "react";

export interface StreamTickerProps {
  /** Total amount streamed over the whole stream (base units, number). */
  totalAmount: number;
  /** Unix seconds. */
  startTime: number;
  /** Unix seconds. */
  endTime: number;
  /** When true, the counter freezes at the value reached at `pausedAt`. */
  paused?: boolean;
  /** Unix seconds at which the stream was paused (defaults to now when paused). */
  pausedAt?: number;
  /** Format the amount for display. */
  format?: (value: number) => string;
  /** Minimum ms between React renders. */
  throttleMs?: number;
  /** Injectable clock (ms) for testing. */
  now?: () => number;
}

/** Released amount at `nowSec`, clamped to [0, totalAmount]. */
export function computeReleased(
  totalAmount: number,
  startTime: number,
  endTime: number,
  nowSec: number,
): number {
  const duration = endTime - startTime;
  if (duration <= 0 || totalAmount <= 0) return 0;
  const elapsed = Math.min(Math.max(nowSec - startTime, 0), duration);
  return (totalAmount * elapsed) / duration;
}

export function StreamTicker({
  totalAmount,
  startTime,
  endTime,
  paused = false,
  pausedAt,
  format = (v) => v.toFixed(4),
  throttleMs = 100,
  now = Date.now,
}: StreamTickerProps) {
  const compute = (nowMs: number) => {
    const effective = paused ? (pausedAt ?? nowMs / 1000) : nowMs / 1000;
    return computeReleased(totalAmount, startTime, endTime, effective);
  };

  const [value, setValue] = useState(() => compute(now()));
  const lastRender = useRef(0);

  useEffect(() => {
    const completed = now() / 1000 >= endTime;
    if (paused || completed) {
      setValue(compute(now()));
      return;
    }

    let raf = 0;
    const tick = (ts: number) => {
      if (ts - lastRender.current >= throttleMs) {
        lastRender.current = ts;
        const next = compute(now());
        setValue(next);
        if (now() / 1000 >= endTime) return; // reached completion bound
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount, startTime, endTime, paused, pausedAt, throttleMs]);

  const done = value >= totalAmount && totalAmount > 0;

  return (
    <div
      className="rounded-2xl border border-border-default bg-card p-5"
      data-testid="stream-ticker"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">Live Released</p>
      <p
        className="mt-2 font-mono text-2xl font-bold text-text-primary tabular-nums"
        role="timer"
        aria-live="off"
      >
        {format(value)}
      </p>
      <p className="mt-1 text-xs text-text-muted">
        {done ? "Stream complete" : paused ? "Stream paused" : "Streaming…"}
      </p>
    </div>
  );
}
