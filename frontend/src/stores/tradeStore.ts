import { create } from "zustand";
import { tradesApi } from "@/lib/api/trades";
import type { TradeResponse } from "@/lib/api/types";
import { getCorrelationId, shouldDedup, registerAction } from "@/lib/actionDedup";
import { getOrCreateIdempotencyKey, clearIdempotencyKey } from "@/lib/idempotency";

/** Stellar assets use 7 decimal places; add amounts as scaled integers to avoid float drift. */
const AMOUNT_SCALE = 7;

function toScaled(value: string | number): bigint | null {
  const str = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(str)) return null;
  const negative = str.startsWith("-");
  const [whole, frac = ""] = str.replace("-", "").split(".");
  const scaled = BigInt(whole + frac.slice(0, AMOUNT_SCALE).padEnd(AMOUNT_SCALE, "0"));
  return negative ? -scaled : scaled;
}

function fromScaled(value: bigint): string {
  const negative = value < BigInt(0);
  const abs = (negative ? -value : value).toString().padStart(AMOUNT_SCALE + 1, "0");
  const whole = abs.slice(0, -AMOUNT_SCALE);
  const frac = abs.slice(-AMOUNT_SCALE).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/** Adds two decimal amount strings precisely. Returns null if either is not numeric. */
export function addAmounts(a: string | number, b: string | number): string | null {
  const x = toScaled(a);
  const y = toScaled(b);
  if (x === null || y === null) return null;
  return fromScaled(x + y);
}

export type BalanceSyncState = "optimistic" | "confirmed";

interface Filters {
  status?: string;
}

interface TradeState {
  trades: TradeResponse[];
  total: number;
  page: number;
  filters: Filters;
  isLoading: boolean;
  error: string | null;
  // Optimistic helpers
  pendingActions: Record<string, { correlationId: string; idempotencyKey: string }>;
  fetchTrades: (token: string) => Promise<void>;
  setPage: (page: number, token: string) => Promise<void>;
  setFilter: (filters: Filters, token: string) => Promise<void>;
  addTrade: (trade: TradeResponse) => void;
  updateTrade: (tradeId: string, patch: Partial<TradeResponse>, serverFn?: () => Promise<void>) => Promise<void>;
  removeTrade: (tradeId: string, serverFn?: () => Promise<void>) => Promise<void>;
  /** Optimistic update with explicit correlation/idempotency — returns correlationId for toast contract */
  updateTradeOptimistic: (
    tradeId: string,
    patch: Partial<TradeResponse>,
    serverFn: () => Promise<void>,
    opts?: { correlationId?: string; idempotencyKey?: string },
  ) => Promise<{ correlationId: string; idempotencyKey: string }>;
  /** Per-trade balance sync state after a collateral deposit. */
  balanceSync: Record<string, BalanceSyncState>;
  /** Re-fetches a single trade from the API and replaces it in the store. */
  rehydrateTrade: (tradeId: string, token: string) => Promise<TradeResponse>;
  /**
   * Handles a deposit-confirmation event: optimistically adds the deposited
   * collateral to the trade balance, then revalidates against the API so the
   * confirmed server balance replaces the optimistic one (no page reload).
   * Rolls back the optimistic balance if revalidation fails.
   */
  applyDepositConfirmation: (tradeId: string, depositAmount: string | number, token: string) => Promise<TradeResponse>;
  /** Unified dedup wrapper for any trade mutation — prevents double-submit window */
  withDedup: <T>(actionKey: string, fn: (ids: { correlationId: string; idempotencyKey: string }) => Promise<T>) => Promise<T | null>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],
  total: 0,
  page: 1,
  filters: {},
  isLoading: false,
  error: null,
  pendingActions: {},
  balanceSync: {},

  fetchTrades: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const { page, filters } = get();
      const res = await tradesApi.list(token, { status: filters.status, page });
      set({ trades: res.items, total: res.pagination.total, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message ?? "Failed to load trades", isLoading: false });
    }
  },

  setPage: async (page, token) => {
    set({ page });
    await get().fetchTrades(token);
  },

  setFilter: async (filters, token) => {
    set({ filters, page: 1 });
    await get().fetchTrades(token);
  },

  addTrade: (trade) => {
    set((s) => ({ trades: [trade, ...s.trades], total: s.total + 1 }));
  },

  // --- Optimistic core with snapshot-based rollback ---
  updateTrade: async (tradeId, patch, serverFn) => {
    // De-duplication: prevent rapid double-submit for same trade+patch
    const actionKey = `update:${tradeId}:${JSON.stringify(patch)}`;
    const dedup = shouldDedup(actionKey);
    if (dedup.dedup) return;

    const correlationId = getCorrelationId();
    const idempotencyKey = getOrCreateIdempotencyKey(actionKey);
    registerAction(actionKey, correlationId, idempotencyKey);

    // Snapshot for rollback — deep clone relevant slice
    const prevTrades = get().trades;
    const prevTrade = prevTrades.find((t) => t.tradeId === tradeId);
    const snapshot = prevTrade ? { ...prevTrade } : null;

    // Apply optimistic patch
    set((s) => ({
      trades: s.trades.map((t) => (t.tradeId === tradeId ? { ...t, ...patch } : t)),
      pendingActions: { ...s.pendingActions, [actionKey]: { correlationId, idempotencyKey } },
    }));

    if (serverFn) {
      try {
        await serverFn();
        clearIdempotencyKey(actionKey);
        // Success — clear pending
        set((s) => {
          const next = { ...s.pendingActions };
          delete next[actionKey];
          return { pendingActions: next };
        });
      } catch (err) {
        // Failure-mid-flight: restore exact prior state (snapshot-based rollback)
        set((s) => {
          const restored = snapshot
            ? s.trades.map((t) => (t.tradeId === tradeId ? snapshot : t))
            : s.trades; // if trade didn't exist, keep as-is (or revert to prevTrades for full fidelity)
          // Full fidelity fallback: if we have prevTrades snapshot, use it for total correctness
          const nextPending = { ...s.pendingActions };
          delete nextPending[actionKey];
          // Determine if patch introduced new trade artifact; safest is to restore prevTrades if snapshot missing
          const finalTrades = snapshot ? restored : prevTrades;
          return { trades: finalTrades, pendingActions: nextPending };
        });
        throw err;
      }
    } else {
      clearIdempotencyKey(actionKey);
      // No serverFn — just clear pending after tick (optimistic local update)
      set((s) => {
        const next = { ...s.pendingActions };
        delete next[actionKey];
        return { pendingActions: next };
      });
    }
  },

  updateTradeOptimistic: async (tradeId, patch, serverFn, opts) => {
    const correlationId = opts?.correlationId ?? getCorrelationId();
    const actionKey = `update:${tradeId}:${JSON.stringify(patch)}`;
    const idempotencyKey = opts?.idempotencyKey ?? getOrCreateIdempotencyKey(actionKey);
    const dedup = shouldDedup(actionKey);
    if (dedup.dedup) {
      return { correlationId: dedup.entry!.correlationId, idempotencyKey: dedup.entry!.idempotencyKey };
    }
    registerAction(actionKey, correlationId, idempotencyKey);

    const prevTrades = get().trades;
    const prevTrade = prevTrades.find((t) => t.tradeId === tradeId);
    const snapshot = prevTrade ? { ...prevTrade } : null;

    set((s) => ({
      trades: s.trades.map((t) => (t.tradeId === tradeId ? { ...t, ...patch } : t)),
      pendingActions: { ...s.pendingActions, [actionKey]: { correlationId, idempotencyKey } },
    }));

    try {
      await serverFn();
      clearIdempotencyKey(actionKey);
      set((s) => {
        const next = { ...s.pendingActions };
        delete next[actionKey];
        return { pendingActions: next };
      });
    } catch (err) {
      set((s) => {
        const restored = snapshot ? s.trades.map((t) => (t.tradeId === tradeId ? snapshot : t)) : prevTrades;
        const next = { ...s.pendingActions };
        delete next[actionKey];
        return { trades: restored, pendingActions: next };
      });
      throw err;
    }
    return { correlationId, idempotencyKey };
  },

  removeTrade: async (tradeId, serverFn) => {
    const actionKey = `remove:${tradeId}`;
    const dedup = shouldDedup(actionKey);
    if (dedup.dedup) return;
    const correlationId = getCorrelationId();
    const idempotencyKey = getOrCreateIdempotencyKey(actionKey);
    registerAction(actionKey, correlationId, idempotencyKey);

    const prevTrades = get().trades;
    const prevTotal = get().total;
    set((s) => ({
      trades: s.trades.filter((t) => t.tradeId !== tradeId),
      total: s.total - 1,
      pendingActions: { ...s.pendingActions, [actionKey]: { correlationId, idempotencyKey } },
    }));
    if (serverFn) {
      try {
        await serverFn();
        clearIdempotencyKey(actionKey);
        set((s) => {
          const next = { ...s.pendingActions };
          delete next[actionKey];
          return { pendingActions: next };
        });
      } catch (err) {
        set({ trades: prevTrades, total: prevTotal, pendingActions: (() => { const n = { ...get().pendingActions }; delete n[actionKey]; return n; })() });
        throw err;
      }
    } else {
      clearIdempotencyKey(actionKey);
      set((s) => {
        const n = { ...s.pendingActions };
        delete n[actionKey];
        return { pendingActions: n };
      });
    }
  },

  rehydrateTrade: async (tradeId, token) => {
    const fresh = await tradesApi.get(token, tradeId);
    set((s) => {
      const exists = s.trades.some((t) => t.tradeId === tradeId);
      return {
        trades: exists
          ? s.trades.map((t) => (t.tradeId === tradeId ? { ...t, ...fresh } : t))
          : [fresh, ...s.trades],
      };
    });
    return fresh;
  },

  applyDepositConfirmation: async (tradeId, depositAmount, token) => {
    const snapshot = get().trades.find((t) => t.tradeId === tradeId);

    if (snapshot) {
      const optimistic = addAmounts(snapshot.amountCngn, depositAmount);
      if (optimistic !== null) {
        set((s) => ({
          trades: s.trades.map((t) =>
            t.tradeId === tradeId ? { ...t, amountCngn: optimistic as TradeResponse["amountCngn"] } : t,
          ),
          balanceSync: { ...s.balanceSync, [tradeId]: "optimistic" },
        }));
      }
    }

    try {
      const confirmed = await get().rehydrateTrade(tradeId, token);
      set((s) => ({ balanceSync: { ...s.balanceSync, [tradeId]: "confirmed" } }));
      return confirmed;
    } catch (err) {
      set((s) => {
        const nextSync = { ...s.balanceSync };
        delete nextSync[tradeId];
        return {
          trades: snapshot ? s.trades.map((t) => (t.tradeId === tradeId ? snapshot : t)) : s.trades,
          balanceSync: nextSync,
        };
      });
      throw err;
    }
  },

  withDedup: async (actionKey, fn) => {
    const dedup = shouldDedup(actionKey);
    if (dedup.dedup) return null;
    const correlationId = getCorrelationId();
    const idempotencyKey = getOrCreateIdempotencyKey(actionKey);
    registerAction(actionKey, correlationId, idempotencyKey);
    try {
      const result = await fn({ correlationId, idempotencyKey });
      clearIdempotencyKey(actionKey);
      return result;
    } catch (e) {
      throw e;
    }
  },
}));
