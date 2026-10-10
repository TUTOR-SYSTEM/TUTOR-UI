import { describe, expect, it } from "vitest";

import {
  buildCoverageRows,
  isApplicable,
  missingCategories,
  summarizeCoverage,
} from "@/components/test-monitor/test-monitor-coverage";
import { buildEndpointRows, createRouteMatcher } from "@/components/test-monitor/test-monitor-utils";
import type { ApiRoute, ApiTestScenario } from "@/types";

const route = (method: string, path: string, over: Partial<ApiRoute> = {}): ApiRoute => ({
  method,
  path,
  summary: null,
  tag: null,
  uuidParams: [],
  isPublic: false,
  roles: null,
  bodySchema: null,
  querySchema: null,
  multipart: false,
  oauth: false,
  ...over,
});

const scenario = (over: Partial<ApiTestScenario>): ApiTestScenario => ({
  id: "s",
  service: "tutor-service",
  method: "GET",
  path: "/classes",
  name: "n",
  description: null,
  requestTemplate: {},
  expectedStatus: 200,
  category: "valid",
  authProfile: "caller",
  createdAt: "",
  updatedAt: null,
  lastRun: null,
  flow: [],
  ...over,
});

const run = (passed: boolean) => ({ correlationId: "c", actualStatus: 200, passed, durationMs: 5, runAt: "" });

const routes = [
  route("GET", "/classes"),
  route("GET", "/classes/members"),
  route("GET", "/classes/:id", { uuidParams: ["id"] }),
  route("POST", "/auth/login", { isPublic: true, bodySchema: { type: "object" } }),
  route("GET", "/auth/google", { isPublic: true, oauth: true }),
  route("GET", "/test-scenarios"),
];

describe("createRouteMatcher", () => {
  const match = createRouteMatcher(routes);

  it("maps concrete, templated and query paths onto the declared route", () => {
    expect(match("GET", "/classes/3f6c2a9e-8b1d-4f7a-9c2e-1d5b7a3e9f01")).toBe("/classes/:id");
    expect(match("GET", "/classes/{{fixture.classId}}")).toBe("/classes/:id");
    expect(match("GET", "/classes?page=1")).toBe("/classes");
  });

  it("prefers static segments and respects the method", () => {
    expect(match("GET", "/classes/members")).toBe("/classes/members");
    expect(match("DELETE", "/classes/x")).toBeNull();
    expect(match("GET", "/classes/x/extra")).toBeNull();
  });
});

describe("buildEndpointRows with routes", () => {
  it("groups cases and traffic of concrete paths under their route", () => {
    const rows = buildEndpointRows(
      [
        scenario({ id: "a", path: "/classes/{{fixture.classId}}", lastRun: run(true) }),
        scenario({ id: "b", path: "/classes/{{unknownUuid}}", category: "not_found", expectedStatus: 404 }),
      ],
      [],
      [
        { method: "GET", path: "/classes/1", calls24h: 3, errorCount24h: 1, p95Ms: 80 },
        { method: "GET", path: "/classes/2", calls24h: 2, errorCount24h: 0, p95Ms: 120 },
      ],
      routes,
    );
    expect(rows.find((r) => r.path === "/classes/:id")).toMatchObject({
      casesTotal: 2,
      casesPassed: 1,
      calls24h: 5,
      errorCount24h: 1,
      p95Ms: 120,
    });
    expect(rows.some((r) => r.path.includes("{{"))).toBe(false);
  });
});

describe("coverage matrix", () => {
  it("knows which kinds of case apply to a route", () => {
    const detail = route("GET", "/classes/:id", { uuidParams: ["id"] });
    expect(isApplicable(detail, "not_found")).toBe(true);
    expect(isApplicable(detail, "validation")).toBe(true);
    expect(isApplicable(route("GET", "/classes"), "validation")).toBe(false);
    expect(isApplicable(route("POST", "/auth/login", { isPublic: true }), "auth")).toBe(false);
    expect(isApplicable(detail, "domain")).toBe(false);
  });

  it("builds cells from the cases matched to each route and skips oauth/self routes", () => {
    const rows = buildCoverageRows(routes, [
      scenario({ path: "/classes/{{fixture.classId}}", lastRun: run(true) }),
      scenario({ path: "/classes/{{unknownUuid}}", category: "auth", authProfile: "none", lastRun: run(false) }),
      scenario({ path: "/classes/{{unknownUuid}}", category: "not_found" }),
      scenario({ method: "POST", path: "/auth/login", category: "domain", lastRun: run(true) }),
    ]);

    expect(rows.map((r) => r.path)).toEqual(["/classes", "/classes/members", "/classes/:id", "/auth/login"]);
    const detail = rows.find((r) => r.path === "/classes/:id")!;
    expect(Object.fromEntries(Object.entries(detail.cells).map(([k, c]) => [k, c.status]))).toEqual({
      valid: "pass",
      auth: "fail",
      validation: "missing",
      not_found: "never",
      domain: "na",
    });
    expect(missingCategories(detail)).toEqual(["validation"]);
    // A hand-written domain case shows up even though domain is never "required".
    expect(rows.find((r) => r.path === "/auth/login")!.cells.domain.status).toBe("pass");
  });

  it("summarises covered and passing cells", () => {
    const rows = buildCoverageRows([route("GET", "/classes/:id", { uuidParams: ["id"] })], [
      scenario({ path: "/classes/x", lastRun: run(true) }),
    ]);
    expect(summarizeCoverage(rows)).toEqual({
      applicable: 4,
      covered: 1,
      passing: 1,
      routesComplete: 0,
      routesTotal: 1,
    });
  });
});
