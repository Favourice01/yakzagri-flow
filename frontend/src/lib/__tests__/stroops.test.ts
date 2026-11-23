import { computeFee, fromStroops, toStroops } from "../stroops";

describe("stroops math", () => {
  it("round-trips decimals exactly", () => {
    expect(fromStroops(toStroops("0.1") + toStroops("0.2"))).toBe("0.3");
    expect(fromStroops(toStroops("123456789.1234567"))).toBe("123456789.1234567");
  });
  it("computes 1% fee exactly for edge amounts", () => {
    expect(computeFee(0)).toEqual({ fee: 0, net: 0 });
    expect(computeFee(0.5)).toEqual({ fee: 0.01, net: 0.49 });
    expect(computeFee(1.005)).toEqual({ fee: 0.01, net: 0.995 });
    expect(computeFee(100)).toEqual({ fee: 1, net: 99 });
    expect(computeFee(999999999.99)).toEqual({ fee: 10000000, net: 989999999.99 });
  });
  it("has no float artifacts", () => {
    const { fee, net } = computeFee(0.29);
    expect(String(fee)).not.toMatch(/\d{5,}/);
    expect(fee + net).toBeCloseTo(0.29, 10);
  });
});
