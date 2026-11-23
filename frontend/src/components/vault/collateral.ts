export const HARD_MIN_COLLATERAL = 0;

export type WithdrawalCheck =
  | { ok: true; warning?: string; deficit: 0 }
  | { ok: false; error: string; deficit: number };

/** Validate a collateral withdrawal against the active escrow reserve. */
export function checkWithdrawal(params: {
  balance: number;
  amount: number;
  reserve: number;
  hardMin?: number;
}): WithdrawalCheck {
  const { balance, amount, reserve, hardMin = HARD_MIN_COLLATERAL } = params;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter an amount greater than zero", deficit: 0 };
  }
  if (amount > balance) {
    return { ok: false, error: "Amount exceeds your available balance", deficit: 0 };
  }
  const remaining = balance - amount;
  if (remaining < hardMin) {
    const deficit = hardMin - remaining;
    return {
      ok: false,
      error: `Withdrawal violates the contract minimum of ${hardMin}. Short by ${deficit.toFixed(2)}.`,
      deficit,
    };
  }
  if (remaining < reserve) {
    const deficit = reserve - remaining;
    return {
      ok: true,
      deficit: 0,
      warning: `Remaining collateral won't cover open trade commitments. Deficit: ${deficit.toFixed(2)}.`,
    };
  }
  return { ok: true, deficit: 0 };
}

export interface YieldPoint {
  date: string; // ISO date
  apy: number; // annualized %
}

export type YieldRange = 7 | 30 | 90;

export function sliceYield(points: YieldPoint[], range: YieldRange): YieldPoint[] {
  return points.slice(-range);
}
