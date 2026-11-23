"use client";

import React, { useState } from "react";
import { PathPaymentPreview } from "./PathPaymentPreview";

const SOURCE_ASSETS = ["CNGN", "XLM", "USDC"] as const;

export function DepositCard({ onDeposit }: { onDeposit?: (amount: string, asset: string) => void }) {
  const [asset, setAsset] = useState<string>("CNGN");
  const [amount, setAmount] = useState("");
  const needsConversion = asset !== "CNGN";

  return (
    <div className="rounded-2xl border border-border-default bg-card p-5 space-y-3">
      <h3 className="text-base font-semibold text-text-primary">Deposit collateral</h3>
      <div className="flex gap-2">
        <select
          aria-label="Deposit asset"
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
          className="rounded-lg border border-border-default bg-bg-input text-text-primary text-sm px-3 py-2"
        >
          {SOURCE_ASSETS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          aria-label="Deposit amount (cNGN to receive)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-lg border border-border-default bg-bg-input text-text-primary text-sm px-3 py-2"
        />
      </div>
      {needsConversion && amount && <PathPaymentPreview sourceCode={asset} destinationAmount={amount} />}
      <button
        type="button"
        disabled={!amount || parseFloat(amount) <= 0}
        onClick={() => onDeposit?.(amount, asset)}
        className="px-4 py-2 rounded-lg bg-gold text-text-inverse text-sm font-semibold hover:bg-gold-hover disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Deposit
      </button>
    </div>
  );
}
