"use client";
import { createContext, useContext, useState, useEffect, useRef } from "react";

export type TradeData = {
  // Step 1
  commodity: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  currency: string;
  sellerAddress: string;
  deliveryWindow: string;
  // Step 2
  buyerRatio: number;
  sellerRatio: number;
  deliveryDays: string;
  notes: string;
};

type TradeContextType = {
  step: number;
  setStep: (s: number) => void;
  data: TradeData;
  update: (partial: Partial<TradeData>) => void;
  resetTradeWizard: () => void;
  hasDraft: boolean;
  resumeDraft: () => void;
  discardDraft: () => void;
};

const defaults: TradeData = {
  commodity: "",
  quantity: "",
  unit: "kg",
  pricePerUnit: "",
  currency: "NGN",
  sellerAddress: "",
  deliveryWindow: "",
  buyerRatio: 50,
  sellerRatio: 50,
  deliveryDays: "7",
  notes: "",
};

type NumericInput = string | number | null | undefined;

/** Parses a numeric form input; returns 0 for blank, null, undefined, NaN or non-finite values. */
export function toSafeNumber(value: NumericInput): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string" && value.trim() === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** True only when the quantity is a finite number strictly greater than 0. */
export function isPositiveQuantity(quantity: NumericInput): boolean {
  return toSafeNumber(quantity) > 0;
}

/** Total escrow value (quantity × price). Never returns NaN — invalid/blank inputs yield 0. */
export function calculateTradeTotal(quantity: NumericInput, pricePerUnit: NumericInput): number {
  const qty = toSafeNumber(quantity);
  const price = toSafeNumber(pricePerUnit);
  if (qty <= 0 || price <= 0) return 0;
  const total = qty * price;
  return Number.isFinite(total) ? total : 0;
}

/** Unit price derived from total / quantity, guarded against division by zero. */
export function calculateUnitPrice(total: NumericInput, quantity: NumericInput): number {
  const qty = toSafeNumber(quantity);
  if (qty <= 0) return 0;
  const unit = toSafeNumber(total) / qty;
  return Number.isFinite(unit) ? unit : 0;
}

const TradeContext = createContext<TradeContextType>({} as TradeContextType);

const STORAGE_KEY = "amana:draft-trade";
export const SESSION_KEY = "amana:draft-trade:session";

function readSession(): { data?: Partial<TradeData>; step?: number } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function TradeProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: Partial<TradeData>;
}) {
  const [step, setStep] = useState(1);
  const [resetVersion, setResetVersion] = useState(0);
  const persistedResetVersion = useRef(0);
  const [data, setData] = useState<TradeData>(() => {
    let base: TradeData = defaults;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          base = { ...defaults, ...parsed.data } as TradeData;
        }
      } catch {}
      const session = readSession();
      if (session?.data) base = { ...base, ...session.data } as TradeData;
    }
    // Deep-linked initial data takes precedence on first mount
    return initialData ? { ...base, ...initialData } : base;
  });

  // Persist draft locally — survives refresh/restart, replays via offline queue
  useEffect(() => {
    if (persistedResetVersion.current !== resetVersion) {
      persistedResetVersion.current = resetVersion;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step, savedAt: new Date().toISOString() }));
    } catch {}
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ data, step }));
    } catch {}
  }, [data, step, resetVersion]);

  // Rehydrate from sessionStorage when the tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const session = readSession();
      if (!session) return;
      if (session.data) setData((prev) => ({ ...prev, ...session.data }));
      if (session.step) setStep(session.step);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Clean up session state when leaving the wizard
  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {}
    };
  }, []);

  // Restore step on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.data && JSON.stringify(parsed.data) !== JSON.stringify(defaults)) {
        setDraft({ data: { ...defaults, ...parsed.data }, step: parsed.step || 1 });
      }
    } catch {}
    const session = readSession();
    if (session?.step) setStep(session.step);
  }, []);

  // Debounced auto-save: 2s after the last edit.
  useEffect(() => {
    if (!dirty.current) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step, savedAt: new Date().toISOString() }));
      } catch {}
    }, 2000);
    return () => clearTimeout(id);
  }, [data, step]);

  const update = (partial: Partial<TradeData>) => {
    dirty.current = true;
    setDraft(null);
    setData((prev) => ({ ...prev, ...partial }));
  };

  const resumeDraft = () => {
    if (!draft) return;
    setData(draft.data);
    setStep(draft.step);
    setDraft(null);
  };

  const discardDraft = () => {
    setDraft(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const resetTradeWizard = () => {
    dirty.current = false;
    setDraft(null);
    setData(defaults);
    setStep(1);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  return (
    <TradeContext.Provider value={{ step, setStep, data, update, resetTradeWizard, hasDraft: draft !== null, resumeDraft, discardDraft }}>
      {children}
    </TradeContext.Provider>
  );
}

export const useTrade = () => useContext(TradeContext);
