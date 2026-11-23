import React from "react";

export function FeeSummary({
  amount,
  feeRate = 0.005,
  asset = "cNGN",
}: {
  amount: number;
  feeRate?: number;
  asset?: string;
}) {
  const fee = amount * feeRate;
  return (
    <dl className="rounded-2xl border border-border-default bg-card p-5 grid grid-cols-2 gap-y-1 text-sm">
      <dt className="text-text-muted">Amount</dt>
      <dd className="text-right">{amount.toFixed(2)} {asset}</dd>
      <dt className="text-text-muted">Fee ({(feeRate * 100).toFixed(2)}%)</dt>
      <dd className="text-right">{fee.toFixed(2)} {asset}</dd>
      <dt className="text-text-muted">Net</dt>
      <dd className="text-right font-semibold">{(amount - fee).toFixed(2)} {asset}</dd>
    </dl>
  );
}
