import { durationTone } from "@/components/logger/logger-utils";
import type {
  ApiTestScenario,
  EndpointStats,
  ScenarioStats,
  TestMonitorEndpointRow,
  TestMonitorResultFilter,
} from "@/types";

const endpointKey = (method: string, path: string) => `${method} ${path}`;

/** Ghép 3 nguồn theo `(method, path)`: các case (`GET /test-scenarios`), số case đạt
 * (`/test-scenarios/stats`) và lưu lượng/P95 24h (`GET /logs/stats`). Endpoint chỉ có traffic thật
 * mà chưa có kịch bản vẫn hiện (0 case). Endpoint không có traffic thì `calls24h`/`p95Ms` = 0. */
export function buildEndpointRows(
  scenarios: ApiTestScenario[],
  scenarioStats: ScenarioStats[],
  logStats: EndpointStats[],
): TestMonitorEndpointRow[] {
  const rows = new Map<string, TestMonitorEndpointRow>();

  const ensure = (method: string, path: string, service: string | null) => {
    const key = endpointKey(method, path);
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        method,
        path,
        service,
        cases: [],
        casesPassed: 0,
        casesTotal: 0,
        calls24h: 0,
        errorCount24h: 0,
        p95Ms: 0,
      };
      rows.set(key, row);
    }
    return row;
  };

  for (const scenario of scenarios) {
    const row = ensure(scenario.method, scenario.path, scenario.service);
    row.cases.push(scenario);
    // Fallback so the header stays right even before `stats` arrives.
    row.casesTotal = row.cases.length;
    row.casesPassed = row.cases.filter((c) => c.lastRun?.passed).length;
  }
  for (const stat of scenarioStats) {
    const row = rows.get(endpointKey(stat.method, stat.path));
    if (row) {
      row.casesPassed = stat.casesPassed;
      row.casesTotal = stat.casesTotal;
    }
  }
  for (const stat of logStats) {
    const row = ensure(stat.method, stat.path, null);
    row.calls24h = stat.calls24h;
    row.errorCount24h = stat.errorCount24h;
    row.p95Ms = stat.p95Ms;
  }

  return [...rows.values()].sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
  );
}

/** Kết quả của 1 endpoint — cùng ngưỡng "chậm" với `categoryOf` của trang logger
 * (`durationTone`), cộng thêm tín hiệu riêng của test: có case lần chạy gần nhất không đạt. */
export function resultOf(row: TestMonitorEndpointRow): Exclude<TestMonitorResultFilter, "all"> {
  if (row.cases.some((c) => c.lastRun && !c.lastRun.passed)) return "err";
  if (durationTone(row.p95Ms) !== null) return "slow";
  return "ok";
}

export function matchesResult(row: TestMonitorEndpointRow, filter: TestMonitorResultFilter): boolean {
  return filter === "all" || resultOf(row) === filter;
}
