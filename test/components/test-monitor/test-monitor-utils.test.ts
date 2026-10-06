import { describe, expect, it } from "vitest";

import {
  buildEndpointRows,
  caseResultOf,
  describeRunAt,
  formatCompact,
  latestRunAt,
  matchesResult,
  matchesSearch,
  resultOf,
} from "@/components/test-monitor/test-monitor-utils";
import type { ApiTestScenario } from "@/types";

const scenario = (over: Partial<ApiTestScenario>): ApiTestScenario => ({
  id: "s1",
  service: "user-service",
  method: "POST",
  path: "/auth/login",
  name: "ok",
  description: null,
  requestTemplate: {},
  expectedStatus: 200,
  category: "valid",
  createdAt: "2030-01-01T00:00:00Z",
  updatedAt: null,
  lastRun: null,
  ...over,
});

const passedRun = { correlationId: "c", actualStatus: 200, passed: true, durationMs: 10, runAt: "" };

describe("buildEndpointRows", () => {
  it("groups scenarios by method+path and takes case counts from scenario stats", () => {
    const rows = buildEndpointRows(
      [scenario({ id: "a", lastRun: passedRun }), scenario({ id: "b" })],
      [{ method: "POST", path: "/auth/login", casesPassed: 1, casesTotal: 2 }],
      [],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ service: "user-service", casesPassed: 1, casesTotal: 2 });
    expect(rows[0].cases).toHaveLength(2);
  });

  it("falls back to counting latest runs when stats have not loaded", () => {
    const [row] = buildEndpointRows([scenario({ lastRun: passedRun })], [], []);
    expect(row).toMatchObject({ casesPassed: 1, casesTotal: 1 });
  });

  it("merges 24h log stats and keeps traffic-only endpoints with no cases", () => {
    const rows = buildEndpointRows(
      [scenario({})],
      [],
      [
        { method: "POST", path: "/auth/login", calls24h: 7, errorCount24h: 1, p95Ms: 120 },
        { method: "GET", path: "/classes", calls24h: 3, errorCount24h: 0, p95Ms: 50 },
      ],
    );
    expect(rows.find((r) => r.path === "/auth/login")).toMatchObject({ calls24h: 7, p95Ms: 120 });
    expect(rows.find((r) => r.path === "/classes")).toMatchObject({
      service: null,
      casesTotal: 0,
      calls24h: 3,
    });
  });
});

describe("resultOf", () => {
  const base = buildEndpointRows([scenario({ lastRun: passedRun })], [], [])[0];

  it("is ok for a passing, fast endpoint", () => {
    expect(resultOf(base)).toBe("ok");
  });

  it("is err when a case's latest run failed, even if slow too", () => {
    const failing = { ...base, p95Ms: 5000, cases: [scenario({ lastRun: { ...passedRun, passed: false } })] };
    expect(resultOf(failing)).toBe("err");
  });

  it("is slow when p95 crosses the logger's slow threshold", () => {
    expect(resultOf({ ...base, p95Ms: 500 })).toBe("slow");
    expect(matchesResult({ ...base, p95Ms: 500 }, "all")).toBe(true);
  });
});

describe("caseResultOf / matchesSearch / latestRunAt / describeRunAt / formatCompact", () => {
  const run = (over: Partial<NonNullable<ApiTestScenario["lastRun"]>>) => ({
    correlationId: "c",
    actualStatus: 200,
    passed: true,
    durationMs: 10,
    runAt: "2030-01-01T10:00:00Z",
    ...over,
  });

  it("classifies a case by its latest run", () => {
    expect(caseResultOf(scenario({}))).toBe("never");
    expect(caseResultOf(scenario({ lastRun: run({}) }))).toBe("ok");
    expect(caseResultOf(scenario({ lastRun: run({ passed: false }) }))).toBe("err");
    expect(caseResultOf(scenario({ lastRun: run({ durationMs: 1500 }) }))).toBe("slow");
  });

  it("searches path, method and case name case-insensitively", () => {
    const [row] = buildEndpointRows([scenario({ name: "Sai mật khẩu" })], [], []);
    expect(matchesSearch(row, "")).toBe(true);
    expect(matchesSearch(row, "AUTH")).toBe(true);
    expect(matchesSearch(row, "post")).toBe(true);
    expect(matchesSearch(row, "mật khẩu")).toBe(true);
    expect(matchesSearch(row, "students")).toBe(false);
  });

  it("finds the newest run timestamp", () => {
    expect(latestRunAt([scenario({})])).toBeNull();
    expect(
      latestRunAt([
        scenario({ lastRun: run({ runAt: "2030-01-01T10:00:00Z" }) }),
        scenario({ id: "b", lastRun: run({ runAt: "2030-01-02T10:00:00Z" }) }),
      ]),
    ).toBe("2030-01-02T10:00:00Z");
  });

  it("flags today's runs", () => {
    const now = new Date(2030, 0, 2, 12, 0);
    expect(describeRunAt(new Date(2030, 0, 2, 8, 5).toISOString(), now)).toMatchObject({
      isToday: true,
      time: "08:05",
    });
    expect(describeRunAt(new Date(2030, 0, 1, 8, 5).toISOString(), now)).toMatchObject({
      isToday: false,
      date: "01/01/2030",
    });
  });

  it("formats compact counts", () => {
    expect(formatCompact(640)).toBe("640");
    expect(formatCompact(4800)).toBe("4.8K");
    expect(formatCompact(2_300_000)).toBe("2.3M");
  });
});
