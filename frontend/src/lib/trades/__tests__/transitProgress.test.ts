import { computeTransitProgress } from "../transitProgress";

const start = Date.parse("2026-01-01T00:00:00Z");
const H = 3_600_000;

describe("computeTransitProgress", () => {
  it("computes percent and remaining time", () => {
    const p = computeTransitProgress(new Date(start), 10, start + 5 * H)!;
    expect(p.percent).toBe(50);
    expect(p.label).toBe("5h 0m remaining");
    expect(p.imminent).toBe(false);
  });
  it("shows arrival imminent near 100% and clamps", () => {
    expect(computeTransitProgress(new Date(start), 10, start + 9.7 * H)!.label).toBe("Arrival imminent");
    expect(computeTransitProgress(new Date(start), 10, start + 50 * H)!.percent).toBe(100);
  });
  it("returns null for invalid input", () => {
    expect(computeTransitProgress("nope", 10)).toBeNull();
    expect(computeTransitProgress(new Date(start), 0)).toBeNull();
  });
});
