import { checkWithdrawal, sliceYield } from "../collateral";

describe("checkWithdrawal", () => {
  it("warns with exact deficit below reserve", () => {
    const r = checkWithdrawal({ balance: 100, amount: 70, reserve: 50 });
    expect(r.ok && r.warning).toContain("20.00");
  });
  it("blocks above balance and below hard min", () => {
    expect(checkWithdrawal({ balance: 10, amount: 20, reserve: 0 }).ok).toBe(false);
    const r = checkWithdrawal({ balance: 100, amount: 95, reserve: 0, hardMin: 10 });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.deficit).toBe(5);
  });
  it("passes safely", () => {
    expect(checkWithdrawal({ balance: 100, amount: 10, reserve: 50 })).toEqual({ ok: true, deficit: 0 });
  });
});

it("sliceYield keeps last N", () => {
  const pts = Array.from({ length: 40 }, (_, i) => ({ date: String(i), apy: i }));
  expect(sliceYield(pts, 7)).toHaveLength(7);
});
