import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePost } from "@/lib/axios/query";
import { useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  ApiTestRun,
  ApiTestScenario,
  RunRealtimeResult,
  ScenarioStats,
  TestScenarioMeta,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const TEST_SCENARIOS_QUERY_KEY = ["test-scenarios", "list"] as const;
export const TEST_SCENARIOS_STATS_QUERY_KEY = ["test-scenarios", "stats"] as const;
export const TEST_SCENARIOS_META_QUERY_KEY = ["test-scenarios", "meta"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Test scenarios (admin only): `list` for `GET /test-scenarios` (each case + its latest run),
 * `stats` for `GET /test-scenarios/stats` (cases passed/total per endpoint), `meta` for
 * `GET /test-scenarios/meta` (environment name) and `run` for
 * `POST /test-scenarios/:id/run` — the id is the mutation payload, and a settled run refreshes
 * both queries. `runRealtime` fires the same run without waiting (see below). */
export function useTestScenarioActions(args?: {
  list?: boolean;
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiTestScenario[]>, Error, ApiTestScenario[]>,
    "queryKey" | "queryFn"
  >;
  stats?: boolean;
  statsOptions?: Omit<
    UseQueryOptions<ApiResponse<ScenarioStats[]>, Error, ScenarioStats[]>,
    "queryKey" | "queryFn"
  >;
  /** `GET /test-scenarios/meta` (environment name) — runs unless `metaOptions.enabled` is false. */
  metaOptions?: Omit<
    UseQueryOptions<ApiResponse<TestScenarioMeta>, Error, TestScenarioMeta>,
    "queryKey" | "queryFn"
  >;
}) {
  const queryClient = useQueryClient();

  const list = useGet<ApiResponse<ApiTestScenario[]>, ApiTestScenario[]>(
    TEST_SCENARIOS_QUERY_KEY,
    "/test-scenarios",
    {
      enabled: !!args?.list,
      select: (raw) => unwrapApiData<ApiTestScenario[]>(raw),
      ...args?.listOptions,
    },
  );

  const stats = useGet<ApiResponse<ScenarioStats[]>, ScenarioStats[]>(
    TEST_SCENARIOS_STATS_QUERY_KEY,
    "/test-scenarios/stats",
    {
      enabled: !!args?.stats,
      select: (raw) => unwrapApiData<ScenarioStats[]>(raw),
      ...args?.statsOptions,
    },
  );

  const meta = useGet<ApiResponse<TestScenarioMeta>, TestScenarioMeta>(
    TEST_SCENARIOS_META_QUERY_KEY,
    "/test-scenarios/meta",
    {
      select: (raw) => unwrapApiData<TestScenarioMeta>(raw),
      retry: false,
      ...args?.metaOptions,
    },
  );

  const run = usePost<ApiResponse<ApiTestRun>, string>((id) => `/test-scenarios/${id}/run`, {
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_STATS_QUERY_KEY });
    },
  });

  /** Same endpoint in `?async=true` mode: returns `{ correlationId }` at once so the dialog can
   * follow the trace live over the `/logs` socket instead of waiting for the full response. */
  const runRealtime = usePost<ApiResponse<RunRealtimeResult>, string>(
    (id) => `/test-scenarios/${id}/run?async=true`,
  );

  return { list, stats, meta, run, runRealtime };
}
