import type {
  ApiRoute,
  ApiTestScenario,
  CoverageCell,
  CoverageCellStatus,
  CoverageRow,
  CoverageSummary,
  TestScenarioCategory,
} from "@/types";
import { createRouteMatcher } from "./test-monitor-utils";
import { SCENARIO_CATEGORIES } from "./test-scenario-form";

const WRITE_METHODS = ["POST", "PUT", "PATCH"];

/** Route này có nên có case loại `category` không (giống luật của bộ sinh case ở third-service).
 * `domain` (nghiệp vụ) không suy ra được từ metadata — chỉ tính khi đã có case viết tay. */
export function isApplicable(route: ApiRoute, category: TestScenarioCategory): boolean {
  const uuidParams = route.uuidParams ?? [];
  switch (category) {
    case "valid":
      return !route.multipart;
    case "auth":
      return route.isPublic !== true;
    case "validation":
      return (
        uuidParams.length > 0 ||
        !!route.querySchema ||
        (WRITE_METHODS.includes(route.method) && !!route.bodySchema && !route.multipart)
      );
    case "not_found":
      return uuidParams.length > 0 && !route.multipart;
    case "domain":
      return false;
  }
}

function cellStatus(cases: ApiTestScenario[], applicable: boolean): CoverageCellStatus {
  if (cases.length === 0) return applicable ? "missing" : "na";
  if (cases.some((c) => c.lastRun && !c.lastRun.passed)) return "fail";
  if (cases.every((c) => c.lastRun?.passed)) return "pass";
  return "never";
}

/** Ma trận route × loại case cho tab "Độ phủ": mỗi ô gom các case của route đó (ghép path cụ thể
 * về route như bảng endpoint) và trạng thái theo lần chạy gần nhất. Bỏ route OAuth và route của
 * chính trang test. */
export function buildCoverageRows(routes: ApiRoute[], scenarios: ApiTestScenario[]): CoverageRow[] {
  const testable = routes.filter((r) => !r.oauth && !r.path.startsWith("/test-scenarios"));
  const match = createRouteMatcher(testable);
  const byRoute = new Map<string, ApiTestScenario[]>();
  for (const scenario of scenarios) {
    const routePath = match(scenario.method, scenario.path);
    if (!routePath) continue;
    const key = `${scenario.method} ${routePath}`;
    byRoute.set(key, [...(byRoute.get(key) ?? []), scenario]);
  }

  return testable.map((route) => {
    const key = `${route.method} ${route.path}`;
    const cases = byRoute.get(key) ?? [];
    const cells = Object.fromEntries(
      SCENARIO_CATEGORIES.map((category) => {
        const inCell = cases.filter((c) => c.category === category);
        const cell: CoverageCell = { status: cellStatus(inCell, isApplicable(route, category)), cases: inCell };
        return [category, cell];
      }),
    ) as Record<TestScenarioCategory, CoverageCell>;
    return { key, method: route.method, path: route.path, cells };
  });
}

export function summarizeCoverage(rows: CoverageRow[]): CoverageSummary {
  let applicable = 0;
  let covered = 0;
  let passing = 0;
  let routesComplete = 0;
  for (const row of rows) {
    const cells = Object.values(row.cells).filter((c) => c.status !== "na");
    applicable += cells.length;
    covered += cells.filter((c) => c.status !== "missing").length;
    passing += cells.filter((c) => c.status === "pass").length;
    if (cells.every((c) => c.status !== "missing")) routesComplete += 1;
  }
  return { applicable, covered, passing, routesComplete, routesTotal: rows.length };
}

/** Các loại case còn thiếu của 1 hàng — dùng để mở bộ sinh case đúng chỗ. */
export function missingCategories(row: CoverageRow): TestScenarioCategory[] {
  return SCENARIO_CATEGORIES.filter((c) => row.cells[c].status === "missing");
}
