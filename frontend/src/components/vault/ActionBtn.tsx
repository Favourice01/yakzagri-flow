import React from "react";

export function ActionBtn({
  label,
  variant = "ghost",
  onClick,
  disabled,
}: {
  label: string;
  variant?: "gold" | "danger" | "ghost";
  onClick: () => void;
  disabled?: boolean;
}) {
  const base =
    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    gold: "bg-gold text-text-inverse hover:bg-gold-hover",
    danger: "border border-status-danger/40 text-status-danger hover:bg-status-danger/10",
    ghost:
      "border border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover",
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {label}
    </button>
  );
}
