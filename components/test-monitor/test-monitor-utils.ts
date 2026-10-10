import { durationTone, formatDuration, serviceNameOf } from "@/components/logger/logger-utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type {
  ApiRoute,
  ApiTestScenario,
  EndpointStats,
  TestMonitorCaseResult,
  ScenarioStats,
  TestMonitorEndpointRow,
  TestMonitorResultFilter,
} from "@/types";

const endpointKey = (method: string, path: string) => `${method} ${path}`;

/** `/classes/{{fixture.classId}}?page=1` → `["classes", "{{fixture.classId}}"]`. */
const segmentsOf = (path: string) => path.split("?")[0].split("/").filter(Boolean);

/**
 * Ghép path cụ thể (của case hoặc của `request_logs`) về route khai báo của gateway:
 * `/classes/3f6c…` hay `/classes/{{fixture.classId}}` → `/classes/:id`. Route tĩnh thắng route có
 * param (`/classes/members` không bị hiểu là `/classes/:id`). Không khớp route nào → `null`.
 */
export function createRouteMatcher(routes: ApiRoute[]) {
  const compiled = routes
    .map((route) => ({ route, segments: segmentsOf(route.path) }))
    // Fewer params first, so the most specific route wins.
    .sort(
      (a, b) =>
        a.segments.filter((s) => s.startsWith(":")).length -
        b.segments.filter((s) => s.startsWith(":")).length,
    );

  return (method: string, path: string): string | null => {
    const segments = segmentsOf(path);
    const hit = compiled.find(
      ({ route, segments: pattern }) =>
        route.method === method &&
        pattern.length === segments.length &&
        pattern.every((p, i) => p.startsWith(":") || p === segments[i]),
    );
    return hit?.route.path ?? null;
  };
}

/** Ghép 4 nguồn theo endpoint: các route thật của gateway (`GET /test-scenarios/routes`), các case
 * (`GET /test-scenarios`), số case đạt (`/test-scenarios/stats`) và lưu lượng/P95 24h
 * (`GET /logs/stats`). Path cụ thể của case/log được gom về route khai báo (`/classes/:id`) khi
 * khớp; không khớp thì giữ nguyên path. Route chưa có kịch bản hoặc traffic vẫn hiện. */
export function buildEndpointRows(
  scenarios: ApiTestScenario[],
  scenarioStats: ScenarioStats[],
  logStats: EndpointStats[],
  routes: ApiRoute[] = [],
): TestMonitorEndpointRow[] {
  const rows = new Map<string, TestMonitorEndpointRow>();
  const match = createRouteMatcher(routes);
  const routePathOf = (method: string, path: string) => match(method, path) ?? path;

  const ensure = (method: string, path: string, service: string | null) => {
    const key = endpointKey(method, path);
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        method,
        path,
        service,
        flowServices: [],
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
    const row = ensure(scenario.method, routePathOf(scenario.method, scenario.path), scenario.service);
    row.cases.push(scenario);
    // Fallback so the header stays right even before `stats` arrives.
    row.casesTotal = row.cases.length;
    row.casesPassed = row.cases.filter((c) => c.lastRun?.passed).length;
  }
  // Routes after scenarios: `ensure` keeps the scenario's service when the row already exists.
  for (const route of routes) ensure(route.method, route.path, null);
  for (const row of rows.values()) row.flowServices = flowServicesOf(row.cases);
  // Several concrete paths can land on one route: sum their counts.
  const statsByRow = new Map<TestMonitorEndpointRow, { passed: number; total: number }>();
  for (const stat of scenarioStats) {
    const row = rows.get(endpointKey(stat.method, routePathOf(stat.method, stat.path)));
    if (!row) continue;
    const sum = statsByRow.get(row) ?? { passed: 0, total: 0 };
    statsByRow.set(row, { passed: sum.passed + stat.casesPassed, total: sum.total + stat.casesTotal });
  }
  for (const [row, sum] of statsByRow) {
    row.casesPassed = sum.passed;
    row.casesTotal = sum.total;
  }
  for (const stat of logStats) {
    const row = ensure(stat.method, routePathOf(stat.method, stat.path), null);
    row.calls24h += stat.calls24h;
    row.errorCount24h += stat.errorCount24h;
    // A route's P95 is at least its slowest concrete path's; exact merging needs the raw samples.
    row.p95Ms = Math.max(row.p95Ms, stat.p95Ms);
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

/** Tên service hiển thị trong cột "Luồng service"/chip lọc: như logger nhưng tutor-service gọi là
 * "Class/Tutor Service" (service quản lý lớp học + gia sư). */
export function flowServiceLabel(service: string): string {
  return service === "tutor-service" ? "Class/Tutor Service" : serviceNameOf(service);
}

/** Tên service duy nhất theo thứ tự xuất hiện trong `flow`. */
export function uniqueFlowServices(scenario: ApiTestScenario): string[] {
  return [...new Set((scenario.flow ?? []).map((hop) => hop.serviceName))];
}

/** Chuỗi service của 1 endpoint: lấy từ case ĐẦU TIÊN có flow (`[]` khi chưa case nào chạy). */
export function flowServicesOf(cases: ApiTestScenario[]): string[] {
  const first = cases.find((c) => (c.flow ?? []).length > 0);
  return first ? uniqueFlowServices(first) : [];
}

/** Mọi service gắn với endpoint: service phụ trách + các service trong flow. */
export function servicesOfRow(row: TestMonitorEndpointRow): string[] {
  return [...new Set([...(row.service ? [row.service] : []), ...row.flowServices])];
}

export function matchesService(row: TestMonitorEndpointRow, service: string | null): boolean {
  return service === null || servicesOfRow(row).includes(service);
}

/** Tóm tắt luồng của 1 case từ `flow` (lần chạy gần nhất): "Qua N service" hoặc "Dừng tại X ·
 * status" khi hop đầu tiên lỗi (status null/>=400), kèm ghi chú hop chậm nhất nếu vượt ngưỡng.
 * `null` khi chưa có flow. */
export function describeCaseFlow(
  scenario: ApiTestScenario,
  copy: TestMonitorDictionary["list"]["flow"],
): string | null {
  const flow = scenario.flow ?? [];
  if (flow.length === 0) return null;

  const failing = flow.find((hop) => hop.statusCode === null || hop.statusCode >= 400);
  const parts = [
    failing
      ? copy.stoppedAt(flowServiceLabel(failing.serviceName), failing.statusCode)
      : copy.passes(uniqueFlowServices(scenario).length),
  ];

  const slowest = flow.reduce((a, b) => (b.durationMs > a.durationMs ? b : a));
  if (durationTone(slowest.durationMs) !== null) {
    parts.push(copy.slowAt(flowServiceLabel(slowest.serviceName), formatDuration(slowest.durationMs)));
  }
  return parts.join(" · ");
}
