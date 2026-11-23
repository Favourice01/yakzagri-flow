"use client";

import React, { useState } from "react";
import { checkWithdrawal } from "./withdrawalReserve";

export function WithdrawalCard({
  balance,
  committed,
  onWithdraw,
  busy = false,
}: {
  balance: number;
  committed: number;
  onWithdraw?: (amount: number) => void;
  busy?: boolean;
}) {
  const [value, setValue] = useState("");
  const check = value ? checkWithdrawal(balance, committed, parseFloat(value)) : null;
  const blocked = !check || check.level === "invalid" || check.level === "blocked";

  return (
    <div className="rounded-2xl border border-border-default bg-card p-5 space-y-3">
      <h3 className="text-base font-semibold text-text-primary">Withdraw collateral</h3>
      <p className="text-xs text-text-secondary">
        Available: {balance} cNGN · Committed to open trades: {committed} cNGN
      </p>
      <input
        type="number"
        min="0"
        inputMode="decimal"
        aria-label="Withdrawal amount"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border border-border-default bg-bg-input text-text-primary text-sm px-3 py-2"
      />
      {check && check.level !== "ok" && (
        <p
          role="alert"
          className={`text-xs ${check.level === "warn" ? "text-status-warning" : "text-status-danger"}`}
        >
          {check.message}
        </p>
      )}
      <button
        type="button"
        disabled={busy || blocked}
        onClick={() => onWithdraw?.(parseFloat(value))}
        className="px-4 py-2 rounded-lg bg-gold text-text-inverse text-sm font-semibold hover:bg-gold-hover disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Withdraw
      </button>
    </div>
  );
}
