import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The wrappers are mocked so we assert exactly how the hook configures them (URL, enabled, select,
// invalidation) without any network.
vi.mock("@/lib/axios/query", () => ({
  useGet: vi.fn((queryKey: unknown, url: string, options: Record<string, unknown>) => ({
    queryKey,
    url,
    options,
  })),
  usePost: vi.fn((url: unknown, options?: Record<string, unknown>) => ({ url, options })),
  usePatch: vi.fn((url: unknown, options?: Record<string, unknown>) => ({ url, options })),
  useDelete: vi.fn((url: unknown, options?: Record<string, unknown>) => ({ url, options })),
}));

import {
  TEST_FIXTURES_QUERY_KEY,
  TEST_SCENARIOS_QUERY_KEY,
  TEST_SCENARIOS_RUNS_QUERY_KEY,
  TEST_SCENARIOS_STATS_QUERY_KEY,
  useTestScenarioActions,
} from "@/lib/services/test-scenario.service";

type Captured = {
  queryKey?: unknown;
  url: string | ((payload: never) => string);
  options: Record<string, unknown> & {
    enabled?: boolean;
    select?: (raw: unknown) => unknown;
    onSettled?: () => void;
    onSuccess?: () => void;
  };
};

function setup(args?: Parameters<typeof useTestScenarioActions>[0]) {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useTestScenarioActions(args), { wrapper });
  const actions = result.current as unknown as Record<
    | "list"
    | "stats"
    | "meta"
    | "runs"
    | "fixtures"
    | "authProfiles"
    | "run"
    | "runRealtime"
    | "create"
    | "update"
    | "delete"
    | "generate"
    | "bulkCreate"
    | "createFixture"
    | "updateFixture"
    | "deleteFixture"
    | "resolveFixture",
    Captured
  >;
  return { actions, invalidate };
}

describe("useTestScenarioActions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("targets the right endpoints and query keys", () => {
    const { actions } = setup({ list: true, stats: true });

    expect(actions.list.url).toBe("/test-scenarios");
    expect(actions.list.queryKey).toEqual(TEST_SCENARIOS_QUERY_KEY);
    expect(actions.stats.url).toBe("/test-scenarios/stats");
    expect(actions.stats.queryKey).toEqual(TEST_SCENARIOS_STATS_QUERY_KEY);
  });

  it("fetches /test-scenarios/meta unconditionally, with an escape hatch", () => {
    const { actions } = setup();
    expect(actions.meta.url).toBe("/test-scenarios/meta");
    expect(actions.meta.options.enabled).toBeUndefined();
    expect(actions.meta.options.select?.({ statusCode: 200, data: { environment: "staging" } })).toEqual({
      environment: "staging",
    });
    expect(setup({ metaOptions: { enabled: false } }).actions.meta.options.enabled).toBe(false);
  });

  it("only enables the queries the caller asked for", () => {
    expect(setup({ list: true }).actions.list.options.enabled).toBe(true);
    expect(setup({ list: true }).actions.stats.options.enabled).toBe(false);
    expect(setup().actions.list.options.enabled).toBe(false);
  });

  it("lets the caller override options (escape hatch)", () => {
    const { actions } = setup({ list: true, listOptions: { enabled: false } });
    expect(actions.list.options.enabled).toBe(false);
  });

  it("unwraps the { data } envelope", () => {
    const { actions } = setup({ list: true, stats: true });
    const rows = [{ id: "s1" }];
    expect(actions.list.options.select?.({ statusCode: 200, data: rows })).toEqual(rows);
    expect(actions.stats.options.select?.({ statusCode: 200, data: [] })).toEqual([]);
  });

  it("builds the run URLs from the scenario id — plain vs `?async=true`", () => {
    const { actions } = setup();
    const runUrl = actions.run.url as (id: string) => string;
    const realtimeUrl = actions.runRealtime.url as (id: string) => string;

    expect(runUrl("abc")).toBe("/test-scenarios/abc/run");
    expect(realtimeUrl("abc")).toBe("/test-scenarios/abc/run?async=true");
  });

  it("refreshes the list and stats once a blocking run settles", () => {
    const { actions, invalidate } = setup();
    actions.run.options.onSettled?.();

    expect(invalidate).toHaveBeenCalledWith({ queryKey: TEST_SCENARIOS_QUERY_KEY });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: TEST_SCENARIOS_STATS_QUERY_KEY });
  });

  it("fetches one case's run history only when an id is given", () => {
    expect(setup().actions.runs.options.enabled).toBe(false);
    const { actions } = setup({ runsScenarioId: "abc" });
    expect(actions.runs.url).toBe("/test-scenarios/abc/runs");
    expect(actions.runs.queryKey).toEqual([...TEST_SCENARIOS_RUNS_QUERY_KEY, "abc"]);
    expect(actions.runs.options.enabled).toBe(true);
  });

  it("creates, patches and deletes cases at the right URLs and refreshes list, stats and history", () => {
    const { actions, invalidate } = setup();
    expect(actions.create.url).toBe("/test-scenarios");
    expect((actions.update.url as (p: { id: string }) => string)({ id: "abc" })).toBe("/test-scenarios/abc");
    expect((actions.delete.url as (id: string) => string)("abc")).toBe("/test-scenarios/abc");

    for (const mutation of [actions.create, actions.update, actions.delete]) {
      invalidate.mockClear();
      mutation.options.onSuccess?.();
      expect(invalidate).toHaveBeenCalledWith({ queryKey: TEST_SCENARIOS_QUERY_KEY });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: TEST_SCENARIOS_STATS_QUERY_KEY });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: TEST_SCENARIOS_RUNS_QUERY_KEY });
    }
  });

  it("targets the fixture and auth-profile endpoints and refreshes fixtures after writes", () => {
    const { actions, invalidate } = setup({ fixtures: true, authProfiles: true });
    expect(actions.fixtures.url).toBe("/test-scenarios/fixtures");
    expect(actions.fixtures.options.enabled).toBe(true);
    expect(actions.authProfiles.url).toBe("/test-scenarios/auth-profiles");
    expect(setup().actions.authProfiles.options.enabled).toBe(false);

    expect(actions.createFixture.url).toBe("/test-scenarios/fixtures");
    expect((actions.updateFixture.url as (p: { id: string }) => string)({ id: "f1" })).toBe("/test-scenarios/fixtures/f1");
    expect((actions.deleteFixture.url as (id: string) => string)("f1")).toBe("/test-scenarios/fixtures/f1");
    expect((actions.resolveFixture.url as (id: string) => string)("f1")).toBe("/test-scenarios/fixtures/f1/resolve");

    actions.createFixture.options.onSuccess?.();
    actions.resolveFixture.options.onSettled?.();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: TEST_FIXTURES_QUERY_KEY });
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it("previews generated cases without refreshing, and refreshes after a bulk save", () => {
    const { actions, invalidate } = setup();
    expect(actions.generate.url).toBe("/test-scenarios/generate");
    expect(actions.generate.options).toBeUndefined();
    expect(actions.bulkCreate.url).toBe("/test-scenarios/bulk");
    actions.bulkCreate.options.onSuccess?.();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: TEST_SCENARIOS_QUERY_KEY });
  });

  it("does not invalidate on realtime start — the run isn't recorded yet (the page does it when live tracing is done)", () => {
    const { actions } = setup();
    expect(actions.runRealtime.options?.onSettled).toBeUndefined();
  });
});
