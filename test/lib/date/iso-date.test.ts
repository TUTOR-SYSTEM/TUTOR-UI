import { describe, expect, it } from "vitest";

import { buildMonthGrid, parseIsoDate, toIsoDate } from "@/lib/date/iso-date";

describe("iso-date helpers", () => {
  it("parses yyyy-mm-dd as a local date and rejects bad input", () => {
    const d = parseIsoDate("2026-11-01");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(10);
    expect(d?.getDate()).toBe(1);
    expect(parseIsoDate("")).toBeNull();
    expect(parseIsoDate("01/11/2026")).toBeNull();
  });

  it("round-trips through toIsoDate", () => {
    expect(toIsoDate(parseIsoDate("2027-01-31") as Date)).toBe("2027-01-31");
  });

  it("builds a Monday-first 7-column grid", () => {
    // 01/11/2026 là Chủ nhật → 6 ô trống trước ngày 1 (T2..T7).
    const rows = buildMonthGrid(2026, 10);
    expect(rows.every((r) => r.length === 7)).toBe(true);
    expect(rows[0].slice(0, 6).every((c) => c === null)).toBe(true);
    expect(rows[0][6]?.getDate()).toBe(1);
    const days = rows.flat().filter(Boolean);
    expect(days).toHaveLength(30);
  });
});
