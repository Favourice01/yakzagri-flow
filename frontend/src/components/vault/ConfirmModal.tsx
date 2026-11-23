"use client";

import React, { useRef } from "react";
import { t as translateCopy } from "@/lib/i18n";
import type { TradeResponse } from "@/lib/api";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";

export type ActionModal =
  | { type: "deposit"; trade: TradeResponse }
  | { type: "release"; trade: TradeResponse }
  | { type: "dispute"; trade: TradeResponse }
  | null;

export function validateDisputeForm(params: {
  reason: string;
  category: string;
}): { valid: boolean; error?: string } {
  const validCategories = ["non_delivery", "quality_issue", "payment_dispute", "other"];
  if (!validCategories.includes(params.category)) {
    return { valid: false, error: "Select a valid dispute category" };
  }
  const trimmed = params.reason.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: "Dispute reason must be at least 10 characters" };
  }
  if (trimmed.length > 500) {
    return { valid: false, error: "Dispute reason cannot exceed 500 characters" };
  }
  return { valid: true };
}

const CONFIRM_TITLES: Record<NonNullable<ActionModal>["type"], string> = {
  deposit: "Confirm Deposit",
  release: "Release Funds",
  dispute: "Initiate Dispute",
};

function confirmDescription(modal: NonNullable<ActionModal>): string {
  const shortId = modal.trade.tradeId.slice(0, 8);
  switch (modal.type) {
    case "deposit":
      return `Deposit ${modal.trade.amountCngn} cNGN into escrow for trade ${shortId}…`;
    case "release":
      return `Release ${modal.trade.amountCngn} cNGN to the seller for trade ${shortId}…`;
    case "dispute":
      return `Open a dispute for trade ${shortId}…`;
  }
}

export function ConfirmModal({
  modal,
  onClose,
  onConfirm,
  busy,
  disputeReason,
  setDisputeReason,
  disputeCategory,
  setDisputeCategory,
}: {
  modal: ActionModal;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
  disputeReason: string;
  setDisputeReason: (v: string) => void;
  disputeCategory: string;
  setDisputeCategory: (v: string) => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const disputeValidation =
    modal?.type === "dispute"
      ? validateDisputeForm({ reason: disputeReason, category: disputeCategory })
      : { valid: true };

  return (
    <Modal
      open={modal !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalContent
        role="alertdialog"
        aria-live="assertive"
        mobileFullScreen={false}
        className="max-w-md"
        initialFocusRef={cancelRef}
      >
        {modal !== null && (
          <>
            <ModalHeader>
              <ModalTitle>{CONFIRM_TITLES[modal.type]}</ModalTitle>
              <ModalDescription>{confirmDescription(modal)}</ModalDescription>
            </ModalHeader>

            {modal.type === "dispute" && (
              <ModalBody className="space-y-3">
                <div>
                  <label
                    className="block text-xs text-text-secondary mb-1"
                    htmlFor="dispute-category"
                  >
                    {translateCopy("ui.category_a3c686e")}
                  </label>
                  <select
                    id="dispute-category"
                    value={disputeCategory}
                    onChange={(e) => setDisputeCategory(e.target.value)}
                    className="w-full rounded-lg border border-border-default bg-bg-input text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-border-focus"
                  >
                    <option value="non_delivery">{translateCopy("ui.non_delivery_907cdab")}</option>
                    <option value="quality_issue">{translateCopy("ui.quality_issue_fb6b865")}</option>
                    <option value="payment_dispute">{translateCopy("ui.payment_dispute_e33ec03")}</option>
                    <option value="other">{translateCopy("ui.other_6e6a6f2")}</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs text-text-secondary mb-1"
                    htmlFor="dispute-reason"
                  >
                    {translateCopy("ui.reason_f219cc0")}
                  </label>
                  <textarea
                    id="dispute-reason"
                    rows={3}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder={translateCopy("ui.describe_the_issue_35fbb91")}
                    className="w-full rounded-lg border border-border-default bg-bg-input text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-border-focus resize-none"
                  />
                  {disputeReason.length > 0 && !disputeValidation.valid && (
                    <p className="mt-1 text-xs text-status-danger" role="alert">
                      {disputeValidation.error}
                    </p>
                  )}
                </div>
              </ModalBody>
            )}

            <ModalFooter>
              <button
                ref={cancelRef}
                type="button"
                onClick={onClose}
                disabled={busy}
                className="px-4 py-2 rounded-lg border border-border-default text-text-secondary text-sm hover:border-border-hover transition-colors disabled:opacity-40"
              >
                {translateCopy("common.cancel")}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy || (modal.type === "dispute" && !disputeValidation.valid)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  modal.type === "dispute"
                    ? "bg-status-danger text-white hover:bg-status-danger/80"
                    : "bg-gold text-text-inverse hover:bg-gold-hover"
                }`}
              >
                {busy ? "Processing…" : "Confirm"}
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
