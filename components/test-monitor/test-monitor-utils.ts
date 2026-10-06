import { durationTone } from "@/components/logger/logger-utils";
import type {
  ApiTestScenario,
  EndpointStats,
  TestMonitorCaseResult,
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

/** Kết quả của 1 case con theo lần chạy gần nhất: lỗi nếu không đạt, chậm nếu đạt nhưng vượt
 * ngưỡng thời lượng (cùng ngưỡng với `resultOf`), `never` nếu chưa chạy. */
export function caseResultOf(scenario: ApiTestScenario): TestMonitorCaseResult {
  const last = scenario.lastRun;
  if (!last) return "never";
  if (!last.passed) return "err";
  return durationTone(last.durationMs) !== null ? "slow" : "ok";
}

/** Lọc theo ô tìm kiếm: khớp path, method hoặc tên case (không phân biệt hoa thường). */
export function matchesSearch(row: TestMonitorEndpointRow, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    row.path.toLowerCase().includes(q) ||
    row.method.toLowerCase().includes(q) ||
    row.cases.some((c) => c.name.toLowerCase().includes(q))
  );
}

/** Mốc `lastRun.runAt` mới nhất của mọi case; `null` khi chưa case nào chạy. */
export function latestRunAt(scenarios: ApiTestScenario[]): string | null {
  let best: string | null = null;
  for (const s of scenarios) {
    const at = s.lastRun?.runAt;
    if (at && (best === null || Date.parse(at) > Date.parse(best))) best = at;
  }
  return best;
}

/** `runAt` → `{ isToday, date: "DD/MM/YYYY", time: "HH:mm" }` giờ local; `now` tiêm vào để test. */
export function describeRunAt(
  iso: string,
  now: Date = new Date(),
): { isToday: boolean; date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    isToday: d.toDateString() === now.toDateString(),
    date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Số lượt gọi gọn cho cột Gọi/24h: `640`, `4.8K`, `1.2M`. */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
