import { getShelfLifeWarning } from "../shelfLife";

const now = Date.parse("2026-01-01T00:00:00Z");
const inDays = (d: number) => new Date(now + d * 86_400_000).toISOString();

describe("getShelfLifeWarning", () => {
  it("warns when leafy greens exceed 4 days", () => {
    expect(getShelfLifeWarning("Leafy Greens", inDays(5), now)?.limitDays).toBe(4);
  });
  it("does not warn within limit, for non-perishables, or empty deadline", () => {
    expect(getShelfLifeWarning("Leafy Greens", inDays(3), now)).toBeNull();
    expect(getShelfLifeWarning("Maize", inDays(30), now)).toBeNull();
    expect(getShelfLifeWarning("Tomato", "", now)).toBeNull();
  });
});
