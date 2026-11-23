/** Hard minimum collateral enforced by the contract (cNGN). */
export const CONTRACT_MIN_RESERVE = Number(process.env.NEXT_PUBLIC_MIN_VAULT_RESERVE ?? 10);

export type WithdrawalCheck =
  | { level: "ok" }
  | { level: "invalid"; message: string }
  | { level: "warn"; deficit: number; message: string }
  | { level: "blocked"; deficit: number; message: string };

/**
 * @param balance   current collateral balance
 * @param committed collateral reserved by open trade offers
 * @param amount    requested withdrawal
 */
export function checkWithdrawal(
  balance: number,
  committed: number,
  amount: number,
  minReserve: number = CONTRACT_MIN_RESERVE,
): WithdrawalCheck {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { level: "invalid", message: "Enter an amount greater than zero." };
  }
  if (amount > balance) {
    return { level: "invalid", message: "Amount exceeds available balance." };
  }
  const remaining = balance - amount;
  if (committed > 0 && remaining < minReserve) {
    const deficit = minReserve - remaining;
    return {
      level: "blocked",
      deficit,
      message: `Withdrawal blocked: contract requires a minimum reserve of ${minReserve} cNGN. You are short by ${deficit.toFixed(2)} cNGN.`,
    };
  }
  if (remaining < committed) {
    const deficit = committed - remaining;
    return {
      level: "warn",
      deficit,
      message: `Remaining collateral won't cover open trade commitments. Deficit: ${deficit.toFixed(2)} cNGN required to maintain standing.`,
    };
  }
  return { level: "ok" };
}
