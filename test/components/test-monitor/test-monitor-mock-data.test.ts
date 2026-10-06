import { describe, expect, it } from "vitest";

import {
  MOCK_LOG_STATS,
  MOCK_META,
  MOCK_SCENARIOS,
  MOCK_SCENARIO_STATS,
  MOCK_TRACES,
  mockRunScenario,
} from "@/components/test-monitor/test-monitor-mock-data";
import { buildEndpointRows, resultOf } from "@/components/test-monitor/test-monitor-utils";

describe("test-monitor mock data", () => {
  it("has a stored trace for every case that has a lastRun", () => {
    for (const s of MOCK_SCENARIOS) {
      if (!s.lastRun) continue;
      const trace = MOCK_TRACES[s.lastRun.correlationId];
      expect(trace, s.name).toBeDefined();
      expect(trace.every((r) => r.correlationId === s.lastRun?.correlationId)).toBe(true);
      expect(trace.filter((r) => r.parentTraceId === null)).toHaveLength(1);
      const ids = new Set(trace.map((r) => r.traceId));
      expect(trace.every((r) => r.parentTraceId === null || ids.has(r.parentTraceId))).toBe(true);
    }
  });

  it("gives every ran case a flow consistent with its trace, and none otherwise", () => {
    for (const s of MOCK_SCENARIOS) {
      if (!s.lastRun) {
        expect(s.flow).toEqual([]);
        continue;
      }
      expect(s.flow.length, s.name).toBe(MOCK_TRACES[s.lastRun.correlationId].length);
      expect(s.flow[s.flow.length - 1].serviceName).toBe("gateway");
    }
  });

  it("stores headers on the gateway hop only and a host on every hop; meta is staging", () => {
    const trace = MOCK_TRACES[MOCK_SCENARIOS[0].lastRun!.correlationId];
    for (const r of trace) {
      expect(r.host).toBeTruthy();
      if (r.serviceName === "gateway") {
        expect(JSON.parse(r.requestHeaders as string)).toHaveProperty("x-correlation-id");
        expect(JSON.parse(r.responseHeaders as string)).toBeTypeOf("object");
      } else {
        expect(r.requestHeaders).toBeNull();
        expect(r.responseHeaders).toBeNull();
      }
    }
    expect(MOCK_META.environment).toBe("staging");
  });

  it("keeps endpoint stats consistent with the scenarios", () => {
    const rows = buildEndpointRows(MOCK_SCENARIOS, MOCK_SCENARIO_STATS, MOCK_LOG_STATS);
    expect(rows.length).toBeGreaterThanOrEqual(10);
    for (const row of rows) {
      expect(row.casesTotal).toBe(row.cases.length);
      expect(row.casesPassed).toBe(row.cases.filter((c) => c.lastRun?.passed).length);
      expect(row.calls24h).toBeGreaterThan(0);
    }
    const results = rows.map(resultOf);
    expect(results).toContain("err");
    expect(results).toContain("slow");
    expect(results).toContain("ok");
  });

  it("includes the failing PATCH /users/profile case", () => {
    const failed = MOCK_SCENARIOS.find((s) => s.lastRun && !s.lastRun.passed);
    expect(failed?.path).toBe("/users/profile");
    expect(failed?.expectedStatus).toBe(400);
    expect(failed?.lastRun?.actualStatus).toBe(500);
  });

  it("mockRunScenario resolves with a run and registers a trace", async () => {
    const never = MOCK_SCENARIOS.find((s) => !s.lastRun)!;
    const run = await mockRunScenario(never.id);
    expect(run.scenarioId).toBe(never.id);
    expect(run.passed).toBe(run.actualStatus === run.expectedStatus);
    expect(MOCK_TRACES[run.correlationId]?.length).toBeGreaterThan(0);
  });

  it("rejects an unknown scenario id", async () => {
    await expect(mockRunScenario("nope")).rejects.toThrow();
  });
});
