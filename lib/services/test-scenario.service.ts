import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useDelete, useGet, usePatch, usePost } from "@/lib/axios/query";
import { useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiAuthProfileStatus,
  ApiResponse,
  ApiRoute,
  ApiTestFixture,
  ApiTestRun,
  ApiTestScenario,
  BulkCreateScenariosResult,
  CreateTestFixturePayload,
  CreateTestScenarioPayload,
  GenerateScenariosPayload,
  GenerateScenariosResult,
  RunRealtimeResult,
  ScenarioStats,
  TestScenarioMeta,
  UpdateTestFixturePayload,
  UpdateTestScenarioPayload,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const TEST_SCENARIOS_QUERY_KEY = ["test-scenarios", "list"] as const;
export const TEST_SCENARIOS_STATS_QUERY_KEY = ["test-scenarios", "stats"] as const;
export const TEST_SCENARIOS_META_QUERY_KEY = ["test-scenarios", "meta"] as const;
export const TEST_SCENARIOS_ROUTES_QUERY_KEY = ["test-scenarios", "routes"] as const;
export const TEST_SCENARIOS_RUNS_QUERY_KEY = ["test-scenarios", "runs"] as const;
export const TEST_FIXTURES_QUERY_KEY = ["test-scenarios", "fixtures"] as const;
export const TEST_AUTH_PROFILES_QUERY_KEY = ["test-scenarios", "auth-profiles"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Test scenarios (admin only): `list` for `GET /test-scenarios` (each case + its latest run),
 * `stats` for `GET /test-scenarios/stats` (cases passed/total per endpoint), `meta` for
 * `GET /test-scenarios/meta` (environment name) and `run` for
 * `POST /test-scenarios/:id/run` — the id is the mutation payload, and a settled run refreshes
 * both queries. `runRealtime` fires the same run without waiting (see below). `runs` is one case's
 * history (`GET /test-scenarios/:id/runs`); `create`/`update`/`delete` manage the cases.
 * `fixtures`/`authProfiles` + `*Fixture` mutations back the "Fixtures & test accounts" dialog. */
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
  /** `GET /test-scenarios/routes` (every HTTP route the gateway exposes). */
  routes?: boolean;
  routesOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiRoute[]>, Error, ApiRoute[]>,
    "queryKey" | "queryFn"
  >;
  /** `GET /test-scenarios/:id/runs` (run history of 1 case, newest first). */
  runsScenarioId?: string;
  runsOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiTestRun[]>, Error, ApiTestRun[]>,
    "queryKey" | "queryFn"
  >;
  /** `GET /test-scenarios/fixtures` (values for `{{fixture.<key>}}`). */
  fixtures?: boolean;
  fixturesOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiTestFixture[]>, Error, ApiTestFixture[]>,
    "queryKey" | "queryFn"
  >;
  /** `GET /test-scenarios/auth-profiles` (which per-role test accounts are configured). */
  authProfiles?: boolean;
  authProfilesOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiAuthProfileStatus[]>, Error, ApiAuthProfileStatus[]>,
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

  const routes = useGet<ApiResponse<ApiRoute[]>, ApiRoute[]>(
    TEST_SCENARIOS_ROUTES_QUERY_KEY,
    "/test-scenarios/routes",
    {
      enabled: !!args?.routes,
      select: (raw) => unwrapApiData<ApiRoute[]>(raw),
      ...args?.routesOptions,
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

  const runs = useGet<ApiResponse<ApiTestRun[]>, ApiTestRun[]>(
    [...TEST_SCENARIOS_RUNS_QUERY_KEY, args?.runsScenarioId],
    `/test-scenarios/${args?.runsScenarioId ?? ""}/runs`,
    {
      enabled: !!args?.runsScenarioId,
      select: (raw) => unwrapApiData<ApiTestRun[]>(raw),
      ...args?.runsOptions,
    },
  );

  const fixtures = useGet<ApiResponse<ApiTestFixture[]>, ApiTestFixture[]>(
    TEST_FIXTURES_QUERY_KEY,
    "/test-scenarios/fixtures",
    {
      enabled: !!args?.fixtures,
      select: (raw) => unwrapApiData<ApiTestFixture[]>(raw),
      ...args?.fixturesOptions,
    },
  );

  const authProfiles = useGet<ApiResponse<ApiAuthProfileStatus[]>, ApiAuthProfileStatus[]>(
    TEST_AUTH_PROFILES_QUERY_KEY,
    "/test-scenarios/auth-profiles",
    {
      enabled: !!args?.authProfiles,
      select: (raw) => unwrapApiData<ApiAuthProfileStatus[]>(raw),
      ...args?.authProfilesOptions,
    },
  );

  const refreshFixtures = () =>
    void queryClient.invalidateQueries({ queryKey: TEST_FIXTURES_QUERY_KEY });

  const createFixture = usePost<ApiResponse<ApiTestFixture>, CreateTestFixturePayload>(
    "/test-scenarios/fixtures",
    { onSuccess: refreshFixtures },
  );
  const updateFixture = usePatch<ApiResponse<ApiTestFixture>, UpdateTestFixturePayload>(
    ({ id }) => `/test-scenarios/fixtures/${id}`,
    { onSuccess: refreshFixtures },
  );
  const deleteFixture = useDelete<ApiResponse<ApiTestFixture>, string>(
    (id) => `/test-scenarios/fixtures/${id}`,
    { onSuccess: refreshFixtures },
  );
  /** Payload is the fixture id: refetches a resolver fixture through the gateway (a fixed one comes back as is). */
  const resolveFixture = usePost<ApiResponse<ApiTestFixture>, string>(
    (id) => `/test-scenarios/fixtures/${id}/resolve`,
    { onSettled: refreshFixtures },
  );

  // Every write changes the case list and the per-endpoint stats, and a run also adds history.
  const refreshScenarios = () => {
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_STATS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_RUNS_QUERY_KEY });
  };

  const run = usePost<ApiResponse<ApiTestRun>, string>((id) => `/test-scenarios/${id}/run`, {
    onSettled: refreshScenarios,
  });

  const create = usePost<ApiResponse<ApiTestScenario>, CreateTestScenarioPayload>(
    "/test-scenarios",
    { onSuccess: refreshScenarios },
  );
  const update = usePatch<ApiResponse<ApiTestScenario>, UpdateTestScenarioPayload>(
    ({ id }) => `/test-scenarios/${id}`,
    { onSuccess: refreshScenarios },
  );
  /** Proposals only — nothing is saved until `bulkCreate`. */
  const generate = usePost<ApiResponse<GenerateScenariosResult>, GenerateScenariosPayload>(
    "/test-scenarios/generate",
  );
  const bulkCreate = usePost<
    ApiResponse<BulkCreateScenariosResult>,
    { scenarios: CreateTestScenarioPayload[] }
  >("/test-scenarios/bulk", { onSuccess: refreshScenarios });
  const del = useDelete<ApiResponse<ApiTestScenario>, string>(
    (id) => `/test-scenarios/${id}`,
    { onSuccess: refreshScenarios },
  );

  /** Same endpoint in `?async=true` mode: returns `{ correlationId }` at once so the dialog can
   * follow the trace live over the `/logs` socket instead of waiting for the full response. */
  const runRealtime = usePost<ApiResponse<RunRealtimeResult>, string>(
    (id) => `/test-scenarios/${id}/run?async=true`,
  );

  return {
    list,
    stats,
    routes,
    meta,
    runs,
    fixtures,
    authProfiles,
    run,
    runRealtime,
    create,
    update,
    delete: del,
    generate,
    bulkCreate,
    createFixture,
    updateFixture,
    deleteFixture,
    resolveFixture,
  };
}
