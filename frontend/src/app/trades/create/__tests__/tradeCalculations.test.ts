import {
  calculateTradeTotal,
  calculateUnitPrice,
  isPositiveQuantity,
  toSafeNumber,
} from "../TradeContext";

describe("trade cost calculation helpers", () => {
  it.each([
    ["0", "500"],
    ["", "500"],
    [null, "500"],
    [undefined, "500"],
    [NaN, "500"],
    ["abc", "500"],
    ["10", ""],
    ["10", NaN],
  ])("returns 0 (never NaN) for quantity=%p price=%p", (qty, price) => {
    const total = calculateTradeTotal(qty as never, price as never);
    expect(total).toBe(0);
    expect(Number.isNaN(total)).toBe(false);
  });

  it("multiplies valid quantity and price", () => {
    expect(calculateTradeTotal("10", "2.5")).toBe(25);
  });

  it("guards unit price against division by zero", () => {
    expect(calculateUnitPrice(100, "0")).toBe(0);
    expect(calculateUnitPrice(100, "")).toBe(0);
    expect(calculateUnitPrice(100, "4")).toBe(25);
  });

  it("only treats strictly positive quantities as valid", () => {
    expect(isPositiveQuantity("0")).toBe(false);
    expect(isPositiveQuantity("")).toBe(false);
    expect(isPositiveQuantity(null)).toBe(false);
    expect(isPositiveQuantity(NaN)).toBe(false);
    expect(isPositiveQuantity("-5")).toBe(false);
    expect(isPositiveQuantity("0.5")).toBe(true);
    expect(toSafeNumber(Infinity)).toBe(0);
  });
});
