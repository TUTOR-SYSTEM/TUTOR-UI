import { describe, expect, it } from "vitest";

import { levenshtein, longestWord, matchParentName, normalizeText } from "@/lib/parent-match";

describe("normalizeText", () => {
  it("strips diacritics, maps đ and collapses spaces", () => {
    expect(normalizeText("  Nguyễn   Đức  Anh ")).toBe("nguyen duc anh");
  });
});

describe("levenshtein", () => {
  it("counts single-character edits", () => {
    expect(levenshtein("hung", "hung")).toBe(0);
    expect(levenshtein("hungg", "hung")).toBe(1);
    expect(levenshtein("", "abc")).toBe(3);
  });
});

describe("matchParentName", () => {
  it("reports exact and contains matches regardless of diacritics", () => {
    expect(matchParentName("Nguyễn Văn An", "nguyen van an")).toBe("exact");
    expect(matchParentName("Nguyễn Văn An", "van")).toBe("contains");
  });

  it("reports similar names for typos and word prefixes", () => {
    expect(matchParentName("Trần Văn Hùng", "Hungg")).toBe("similar");
    expect(matchParentName("Nguyễn Thị Lan", "thi lann")).toBe("similar");
  });

  it("returns null for unrelated names and empty queries", () => {
    expect(matchParentName("Lê Minh", "Trần")).toBeNull();
    expect(matchParentName("Lê Minh", "   ")).toBeNull();
  });
});

describe("longestWord", () => {
  it("returns the longest raw word of the query", () => {
    expect(longestWord("Nguyễn Văn Hùng")).toBe("Nguyễn");
    expect(longestWord("  ")).toBe("");
  });
});
