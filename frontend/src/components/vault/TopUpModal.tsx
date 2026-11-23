"use client";

import React, { useEffect, useRef, useState } from "react";
import { signTransaction } from "@stellar/freighter-api";
import { api, apiConfig } from "@/lib/api";
import { broadcastTransaction } from "@/lib/stellar/broadcast";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";

interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
  /** Collateral deficit used to prefill the amount. */
  deficit: number;
  tradeId: string;
  token: string | null;
  address: string | null;
  /** Called after a successful deposit so callers can refresh vault/trade balances. */
  onComplete?: () => void;
}

export function TopUpModal({ open, onClose, deficit, tradeId, token, address, onComplete }: TopUpModalProps) {
  const [amount, setAmount] = useState(String(deficit));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setAmount(String(deficit));
      setError(null);
    }
  }, [open, deficit]);

  const valid = Number.isFinite(parseFloat(amount)) && parseFloat(amount) > 0;

  async function submit() {
    if (!token || busy || !valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.trades.deposit(token, tradeId, {
        idempotencyKey: `topup:${tradeId}:${amount}`,
      });
      if (res.unsignedXdr) {
        const signed = await signTransaction(res.unsignedXdr, {
          networkPassphrase: apiConfig.getStellarNetworkPassphrase(),
          address: address ?? undefined,
        });
        if (signed.error) throw new Error(signed.error.message || "Transaction signing failed");
        const xdr = typeof signed === "string" ? signed : signed?.signedTxXdr;
        if (!xdr) throw new Error("No signed transaction returned from Freighter");
        await broadcastTransaction(xdr);
      }
      setAmount("");
      onComplete?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()}>
      <ModalContent mobileFullScreen={false} className="max-w-md" initialFocusRef={cancelRef}>
        <ModalHeader>
          <ModalTitle>Top up collateral</ModalTitle>
          <ModalDescription>Deposit additional collateral to cover your deficit.</ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-2">
          <label htmlFor="topup-amount" className="block text-xs text-text-secondary">Amount</label>
          <input
            id="topup-amount"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-bg-input text-text-primary text-sm px-3 py-2"
          />
          {error && <p role="alert" className="text-xs text-status-danger">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <button ref={cancelRef} type="button" onClick={onClose} disabled={busy}
            className="px-4 py-2 rounded-lg border border-border-default text-text-secondary text-sm disabled:opacity-40">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={busy || !valid}
            className="px-4 py-2 rounded-lg bg-gold text-text-inverse text-sm font-semibold disabled:opacity-40">
            {busy ? "Processing…" : "Top up"}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
