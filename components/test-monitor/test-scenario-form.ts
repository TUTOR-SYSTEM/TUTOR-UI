import type {
  ApiTestScenario,
  CreateTestScenarioPayload,
  ScenarioFormError,
  ScenarioFormField,
  TestAuthProfile,
  TestScenarioCategory,
  TestScenarioFormValues,
  TestScenarioMethod,
} from "@/types";

export const SCENARIO_METHODS: TestScenarioMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const SCENARIO_CATEGORIES: TestScenarioCategory[] = [
  "valid",
  "auth",
  "validation",
  "not_found",
  "domain",
];

export const AUTH_PROFILES: TestAuthProfile[] = ["caller", "admin", "tutor", "student", "parent", "none"];

/** Service phụ trách một case — cùng tên với `serviceName` trong `request_logs`. */
export const SCENARIO_SERVICES = ["gateway", "user-service", "tutor-service", "third-service"];

/** Status hay dùng nhất của từng loại case — điền sẵn khi đổi loại để đỡ gõ tay. */
export const DEFAULT_STATUS_BY_CATEGORY: Record<TestScenarioCategory, number> = {
  valid: 200,
  auth: 401,
  validation: 422,
  not_found: 404,
  domain: 400,
};

export const DEFAULT_AUTH_HEADERS = { authorization: "Bearer {{accessToken}}" };

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

const toMethod = (method: string | undefined): TestScenarioMethod =>
  (SCENARIO_METHODS as string[]).includes(method ?? "") ? (method as TestScenarioMethod) : "GET";

/** Form trống, có thể điền sẵn endpoint (nút "+" trên 1 hàng endpoint). */
export function emptyScenarioForm(
  prefill: { method?: string; path?: string; service?: string } = {},
): TestScenarioFormValues {
  return {
    service: prefill.service ?? "gateway",
    method: toMethod(prefill.method),
    path: prefill.path ?? "/",
    name: "",
    description: "",
    category: "valid",
    authProfile: "caller",
    expectedStatus: String(DEFAULT_STATUS_BY_CATEGORY.valid),
    headers: prettyJson(DEFAULT_AUTH_HEADERS),
    body: "",
  };
}

export function scenarioToForm(scenario: ApiTestScenario): TestScenarioFormValues {
  const { headers, body } = scenario.requestTemplate ?? {};
  return {
    service: scenario.service,
    method: toMethod(scenario.method),
    path: scenario.path,
    name: scenario.name,
    description: scenario.description ?? "",
    category: scenario.category,
    authProfile: scenario.authProfile ?? "caller",
    expectedStatus: String(scenario.expectedStatus),
    headers: headers && Object.keys(headers).length > 0 ? prettyJson(headers) : "",
    body: body === undefined ? "" : prettyJson(body),
  };
}

/** Kiểm tra form theo đúng ràng buộc `createTestScenarioSchema` ở gateway, rồi dựng payload. */
export function parseScenarioForm(
  values: TestScenarioFormValues,
):
  | { ok: true; payload: CreateTestScenarioPayload }
  | { ok: false; errors: Partial<Record<ScenarioFormField, ScenarioFormError>> } {
  const errors: Partial<Record<ScenarioFormField, ScenarioFormError>> = {};
  const path = values.path.trim();
  const name = values.name.trim();
  const service = values.service.trim();

  if (!service) errors.service = "required";
  if (!name) errors.name = "required";
  if (!path) errors.path = "required";
  else if (!path.startsWith("/") || path.startsWith("//")) errors.path = "path";

  const status = Number(values.expectedStatus);
  if (!Number.isInteger(status) || status < 100 || status > 599) errors.expectedStatus = "status";

  let headers: Record<string, string> | undefined;
  if (values.headers.trim()) {
    try {
      const parsed: unknown = JSON.parse(values.headers);
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        !Object.values(parsed).every((v) => typeof v === "string")
      ) {
        errors.headers = "headersObject";
      } else {
        headers = parsed as Record<string, string>;
      }
    } catch {
      errors.headers = "json";
    }
  }

  let body: unknown;
  let hasBody = false;
  if (values.body.trim()) {
    try {
      body = JSON.parse(values.body);
      hasBody = true;
    } catch {
      errors.body = "json";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const description = values.description.trim();
  return {
    ok: true,
    payload: {
      service,
      method: values.method,
      path,
      name,
      ...(description ? { description } : {}),
      requestTemplate: { ...(headers ? { headers } : {}), ...(hasBody ? { body } : {}) },
      expectedStatus: status,
      category: values.category,
      authProfile: values.authProfile,
    },
  };
}
