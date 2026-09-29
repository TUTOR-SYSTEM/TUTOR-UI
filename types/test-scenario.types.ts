export type TestScenarioCategory = "valid" | "auth" | "validation" | "not_found" | "domain";

export type TestScenarioRequestTemplate = {
  headers?: Record<string, string>;
  body?: unknown;
};

/** Lần chạy mới nhất của 1 kịch bản, đi kèm trong `GET /test-scenarios`. */
export type TestScenarioLastRun = {
  correlationId: string;
  actualStatus: number | null;
  passed: boolean;
  durationMs: number;
  runAt: string;
};

export type ApiTestScenario = {
  id: string;
  service: string;
  method: string;
  path: string;
  name: string;
  description: string | null;
  requestTemplate: TestScenarioRequestTemplate;
  expectedStatus: number;
  category: TestScenarioCategory;
  createdAt: string;
  updatedAt: string | null;
  lastRun: TestScenarioLastRun | null;
};

/** 1 hàng `test_runs` — kết quả `POST /test-scenarios/:id/run`. */
export type ApiTestRun = {
  id: string;
  scenarioId: string;
  correlationId: string;
  actualStatus: number | null;
  expectedStatus: number;
  passed: boolean;
  durationMs: number;
  errorMessage: string | null;
  triggeredBy: string | null;
  createdAt: string;
};

/** 1 hàng `GET /test-scenarios/stats` — gộp theo `(method, path)`. */
export type ScenarioStats = {
  method: string;
  path: string;
  casesPassed: number;
  casesTotal: number;
};

export type TestMonitorResultFilter = "all" | "err" | "slow" | "ok";

/** 1 hàng cha của bảng test-monitor: 1 endpoint + các case con + số liệu 24h từ `request_logs`. */
export type TestMonitorEndpointRow = {
  key: string;
  method: string;
  path: string;
  /** `null` khi endpoint chỉ có traffic thật, chưa có kịch bản nào. */
  service: string | null;
  cases: ApiTestScenario[];
  casesPassed: number;
  casesTotal: number;
  calls24h: number;
  errorCount24h: number;
  p95Ms: number;
};

/** Kết quả `POST /test-scenarios/:id/run?async=true` — trả ngay, không đợi trace hoàn tất. */
export type RunRealtimeResult = { correlationId: string; scenarioId: string };
