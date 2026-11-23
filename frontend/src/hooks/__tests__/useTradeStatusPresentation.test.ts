import { renderHook } from "@testing-library/react";
import {
  TRADE_STATUSES,
  getTradeStatusPresentation,
  useTradeStatusPresentation,
} from "../useTradeStatusPresentation";

describe("useTradeStatusPresentation", () => {
  it.each(TRADE_STATUSES)("maps %s to a label, icon and tone class", (status) => {
    const p = getTradeStatusPresentation(status);
    expect(p.label.toUpperCase()).toBe(status);
    expect(p.icon).toBeTruthy();
    expect(p.className).toContain("border");
    expect(p.tone).not.toBe("neutral");
  });

  it("uses distinct tones for disputed vs funded", () => {
    expect(getTradeStatusPresentation("DISPUTED").tone).toBe("danger");
    expect(getTradeStatusPresentation("FUNDED").tone).toBe("success");
  });

  it("is case-insensitive and resolves aliases", () => {
    expect(getTradeStatusPresentation("settled").label).toBe("Settled");
    expect(getTradeStatusPresentation("in-transit").label).toBe("Dispatched");
    expect(getTradeStatusPresentation("pending").label).toBe("Initiated");
  });

  it("falls back to neutral for unknown or empty statuses", () => {
    expect(getTradeStatusPresentation("weird").tone).toBe("neutral");
    expect(getTradeStatusPresentation(null).label).toBe("Unknown");
  });

  it("works as a hook", () => {
    const { result } = renderHook(() => useTradeStatusPresentation("DELIVERED"));
    expect(result.current.label).toBe("Delivered");
  });
});
