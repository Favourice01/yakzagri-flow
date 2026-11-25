import { describe, it, expect, vi } from "vitest";
vi.mock("../client", () => ({ request: vi.fn(), createQueryString: vi.fn() }));
import { applySortChange } from "../adminStreams";
import { filterStreams } from "../adminStreamFilters";

describe("applySortChange", () => {
  it("resets page to 1 when sort column or direction changes", () => {
    const state = { page: 4, sortBy: "createdAt", sortDir: "asc" as const };
    expect(applySortChange(state, { sortDir: "desc" }).page).toBe(1);
    expect(applySortChange(state, { sortBy: "status" }).page).toBe(1);
  });
  it("keeps page when sort is unchanged", () => {
    const state = { page: 4, sortBy: "createdAt", sortDir: "asc" as const };
    expect(applySortChange(state, { sortDir: "asc" }).page).toBe(4);
  });
});

describe("filterStreams", () => {
  const mk = (id: string, status: string, createdAt: string, v: string) =>
    ({ streamId: id, status, createdAt, totalVested: v }) as never;
  it("filters by status and date and sums volume", () => {
    const r = filterStreams(
      [mk("a", "ACTIVE", "2026-01-05T00:00:00Z", "10"), mk("b", "COMPLETED", "2026-02-01T00:00:00Z", "5")],
      { startDate: "2026-01-01", endDate: "2026-01-31", statuses: ["ACTIVE"] },
    );
    expect(r.count).toBe(1);
    expect(r.totalVolume).toBe("10");
  });
});
