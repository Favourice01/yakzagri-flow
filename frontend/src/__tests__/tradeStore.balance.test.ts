import { useTradeStore, addAmounts } from "@/stores/tradeStore";
import { tradesApi } from "@/lib/api/trades";
import type { TradeResponse } from "@/lib/api/types";

jest.mock("@/lib/api/trades", () => ({
  tradesApi: { list: jest.fn(), get: jest.fn() },
}));

const mockGet = tradesApi.get as jest.Mock;

const trade = (amount: string): TradeResponse =>
  ({
    tradeId: "t1",
    buyerAddress: "GBUYER",
    sellerAddress: "GSELLER",
    amountCngn: amount,
    buyerLossBps: 0,
    sellerLossBps: 0,
    status: "FUNDED",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }) as unknown as TradeResponse;

beforeEach(() => {
  useTradeStore.setState({ trades: [trade("100")], balanceSync: {} });
  mockGet.mockReset();
});

describe("tradeStore balance rehydration", () => {
  it("adds decimal amounts precisely", () => {
    expect(addAmounts("0.1", "0.2")).toBe("0.3");
    expect(addAmounts("100", "25.5")).toBe("125.5");
    expect(addAmounts("abc", "1")).toBeNull();
  });

  it("applies optimistic balance then replaces it with the confirmed server balance", async () => {
    let resolveGet!: (t: TradeResponse) => void;
    mockGet.mockReturnValue(new Promise((r) => (resolveGet = r)));

    const pending = useTradeStore.getState().applyDepositConfirmation("t1", "50", "tok");
    expect(useTradeStore.getState().trades[0].amountCngn).toBe("150");
    expect(useTradeStore.getState().balanceSync.t1).toBe("optimistic");

    resolveGet(trade("149.75"));
    await pending;
    expect(mockGet).toHaveBeenCalledWith("tok", "t1");
    expect(useTradeStore.getState().trades[0].amountCngn).toBe("149.75");
    expect(useTradeStore.getState().balanceSync.t1).toBe("confirmed");
  });

  it("rolls back the optimistic balance if revalidation fails", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    await expect(useTradeStore.getState().applyDepositConfirmation("t1", "50", "tok")).rejects.toThrow("network");
    expect(useTradeStore.getState().trades[0].amountCngn).toBe("100");
    expect(useTradeStore.getState().balanceSync.t1).toBeUndefined();
  });
});
