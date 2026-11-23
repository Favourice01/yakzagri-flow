"use client";

import React, { useEffect, useState } from "react";
import {
  SLIPPAGE_OPTIONS,
  fetchStrictReceiveQuote,
  getAssetInfo,
  type PathQuote,
  type SlippageTolerance,
} from "@/lib/stellar/assets";

export function PathPaymentPreview({
  sourceCode,
  destinationCode = "CNGN",
  destinationAmount,
}: {
  sourceCode: string;
  destinationCode?: string;
  destinationAmount: string;
}) {
  const [slippage, setSlippage] = useState<SlippageTolerance>(1);
  const [quote, setQuote] = useState<PathQuote | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "none" | "error">("idle");

  useEffect(() => {
    if (!destinationAmount || sourceCode.toUpperCase() === destinationCode.toUpperCase()) {
      setQuote(null);
      setState("idle");
      return;
    }
    const ctrl = new AbortController();
    setState("loading");
    const timer = setTimeout(() => {
      fetchStrictReceiveQuote({
        sourceAsset: getAssetInfo(sourceCode),
        destinationAsset: getAssetInfo(destinationCode),
        destinationAmount,
        slippagePct: slippage,
        signal: ctrl.signal,
      })
        .then((q) => {
          setQuote(q);
          setState(q ? "idle" : "none");
        })
        .catch((e) => {
          if (e?.name !== "AbortError") setState("error");
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [sourceCode, destinationCode, destinationAmount, slippage]);

  return (
    <div className="rounded-xl border border-border-default bg-card p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary">Slippage tolerance</span>
        <div className="flex gap-1" role="radiogroup" aria-label="Slippage tolerance">
          {SLIPPAGE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={slippage === s}
              onClick={() => setSlippage(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                slippage === s ? "bg-gold text-text-inverse" : "text-text-secondary border border-border-default"
              }`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>
      {state === "loading" && <p className="text-text-muted">Fetching quote…</p>}
      {state === "none" && <p className="text-status-warning">No conversion path found.</p>}
      {state === "error" && <p className="text-status-danger">Could not fetch quote from Horizon.</p>}
      {quote && (
        <dl className="grid grid-cols-2 gap-y-1">
          <dt className="text-text-muted">Estimated rate</dt>
          <dd className="text-right">1 {sourceCode} ≈ {quote.rate.toFixed(4)} {destinationCode}</dd>
          <dt className="text-text-muted">You send (max)</dt>
          <dd className="text-right">{quote.maxSourceAmount} {sourceCode}</dd>
          <dt className="text-text-muted">Minimum received</dt>
          <dd className="text-right">{quote.destinationAmount} {destinationCode}</dd>
          <dt className="text-text-muted">Path</dt>
          <dd className="text-right">
            {[sourceCode, ...quote.hops, destinationCode].join(" → ")}
          </dd>
        </dl>
      )}
    </div>
  );
}
