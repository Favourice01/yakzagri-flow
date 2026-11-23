import React from "react";

export function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border-default bg-card p-5 flex flex-col gap-1">
      <p className="text-xs uppercase tracking-widest text-text-muted">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-gold" : "text-text-primary"}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}
