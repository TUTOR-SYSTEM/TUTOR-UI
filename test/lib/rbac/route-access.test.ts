import { describe, expect, it } from "vitest";

import { getRouteAccess, ROUTE_ACCESS } from "@/lib/rbac/route-access";

describe("getRouteAccess", () => {
  it("returns null for routes not declared in the table (open to every logged-in role)", () => {
    expect(getRouteAccess("/")).toBeNull();
    expect(getRouteAccess("/settings")).toBeNull();
    expect(getRouteAccess("/unknown/page")).toBeNull();
  });

  it("returns the allow-list for an exact prefix match", () => {
    expect(getRouteAccess("/tutors")).toEqual(["ADMIN"]);
    expect(getRouteAccess("/test-monitor")).toEqual(["ADMIN"]);
  });

  it("applies the prefix to nested child routes", () => {
    expect(getRouteAccess("/classes/123/curriculum")).toEqual([
      "TUTOR",
      "STUDENT",
      "PARENT",
    ]);
    expect(getRouteAccess("/students/abc")).toEqual(["ADMIN"]);
  });

  it("matches on segment boundaries, not raw string prefixes", () => {
    // "/classesX" must not inherit the "/classes" rule.
    expect(getRouteAccess("/classesX")).toBeNull();
    expect(getRouteAccess("/students-archive")).toBeNull();
  });

  it("every declared rule has a non-empty allow-list, except explicitly locked legacy pages", () => {
    for (const rule of ROUTE_ACCESS) {
      if (rule.allow.length === 0) {
        expect(["/accounts", "/transactions", "/budgets", "/categories", "/analytics", "/investments", "/practice-exams"]).toContain(rule.prefix);
        continue;
      }
      expect(rule.allow.length, rule.prefix).toBeGreaterThan(0);
    }
  });

  it("locks legacy finance pages for every role instead of leaving them open", () => {
    expect(getRouteAccess("/transactions/new")).toEqual([]);
    expect(getRouteAccess("/budgets")).toEqual([]);
  });
});

describe("getRouteAccess internal pages", () => {
  it("restricts internal/dev pages to ADMIN", () => {
    expect(getRouteAccess("/flow-request")).toEqual(["ADMIN"]);
    expect(getRouteAccess("/api-gaps")).toEqual(["ADMIN"]);
    expect(getRouteAccess("/reports")).toEqual(["ADMIN"]);
  });
});
