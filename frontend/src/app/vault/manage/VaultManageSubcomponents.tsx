"use client";

// Re-export shim: components now live in @/components/vault (one per file).
import { formatDateTime } from "@/lib/i18n/format";
import { getStatusBadgeClasses, getStatusDotClasses } from "@/components/ui/StatusBadge";

export { StatCard } from "@/components/vault/StatCard";
export { ActionBtn } from "@/components/vault/ActionBtn";
export { ConfirmModal, validateDisputeForm, type ActionModal } from "@/components/vault/ConfirmModal";

export function statusStyle(status: string) {
  return {
    pill: getStatusBadgeClasses(status),
    dot: getStatusDotClasses(status),
  };
}

export function fmt(date: string) {
  return formatDateTime(date);
}

export function shortAddr(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
