"use client";

import React, { useState } from "react";
import { checkWithdrawal } from "./collateral";

interface Props {
  balance: number;
  reserve: number;
  /** Performs the withdrawal; resolves with a confirmation message on success. */
  onWithdraw?: (amount: number) => Promise<string>;
}

export function WithdrawCollateralCard({ balance, reserve, onWithdraw }: Props) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsed = parseFloat(amount);
  const check = amount ? checkWithdrawal({ balance, amount: parsed, reserve }) : null;

  async function submit() {
    if (!check?.ok || !onWithdraw || busy) return;
    setBusy(true);
    setError(null);
    try {
      const msg = await onWithdraw(parsed);
      setAmount("");
      setError(null);
      setSuccess(msg);
    } catch (err) {
      setSuccess(null);
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border-default bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-text-primary">Withdraw collateral</h2>
      <input
        aria-label="Withdrawal amount"
        type="number"
        min="0"
        value={amount}
        onChange={(e) => { setAmount(e.target.value); setSuccess(null); }}
        className="w-full rounded-lg border border-border-default bg-bg-input text-text-primary text-sm px-3 py-2"
      />
      {check && !check.ok && <p role="alert" className="text-xs text-status-danger">{check.error}</p>}
      {check?.ok && check.warning && <p role="status" className="text-xs text-status-warning">{check.warning}</p>}
      {error && <p role="alert" className="text-xs text-status-danger">{error}</p>}
      {success && <p role="status" className="text-xs text-status-success">{success}</p>}
      <button type="button" onClick={submit} disabled={busy || !check?.ok || !onWithdraw}
        className="px-4 py-2 rounded-lg bg-gold text-text-inverse text-sm font-semibold disabled:opacity-40">
        {busy ? "Processing…" : "Withdraw"}
      </button>
    </div>
  );
}
