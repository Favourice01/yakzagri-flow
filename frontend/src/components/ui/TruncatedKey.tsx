"use client";

import { useState } from "react";

export function truncateKey(key: string, prefix = 4, suffix = 4): string {
  if (key.length <= prefix + suffix + 3) return key;
  return `${key.slice(0, prefix)}...${key.slice(-suffix)}`;
}

/** Truncated Stellar public key (GABC...WXYZ) with copy button and full-address tooltip. */
export function TruncatedKey({ value, className = "" }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 font-mono ${className}`}>
      <span title={value} aria-label={value} tabIndex={0}>
        {truncateKey(value)}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied public key" : "Copy public key"}
        title="Copy full public key"
        className="rounded p-0.5 text-text-muted hover:text-text-primary"
      >
        {copied ? "✓" : "⧉"}
      </button>
    </span>
  );
}
