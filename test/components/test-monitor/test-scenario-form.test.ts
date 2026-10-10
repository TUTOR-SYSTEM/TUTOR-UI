import { describe, expect, it } from "vitest";

import {
  emptyScenarioForm,
  parseScenarioForm,
  scenarioToForm,
} from "@/components/test-monitor/test-scenario-form";
import type { ApiTestScenario } from "@/types";

const scenario: ApiTestScenario = {
  id: "s1",
  service: "user-service",
  method: "POST",
  path: "/auth/login",
  name: "Sai mật khẩu",
  description: null,
  requestTemplate: { body: { email: "a@b.c", password: "x" } },
  expectedStatus: 400,
  category: "domain",
  authProfile: "student",
  createdAt: "",
  updatedAt: null,
  lastRun: null,
  flow: [],
};

describe("test-scenario-form", () => {
  it("round-trips a scenario into a payload", () => {
    const parsed = parseScenarioForm(scenarioToForm(scenario));
    expect(parsed).toEqual({
      ok: true,
      payload: {
        service: "user-service",
        method: "POST",
        path: "/auth/login",
        name: "Sai mật khẩu",
        requestTemplate: { body: { email: "a@b.c", password: "x" } },
        expectedStatus: 400,
        category: "domain",
        authProfile: "student",
      },
    });
  });

  it("prefills an endpoint and falls back to GET for unknown methods", () => {
    const form = emptyScenarioForm({ method: "OPTIONS", path: "/classes", service: "tutor-service" });
    expect(form).toMatchObject({ method: "GET", path: "/classes", service: "tutor-service", expectedStatus: "200" });
    expect(JSON.parse(form.headers)).toEqual({ authorization: "Bearer {{accessToken}}" });
  });

  it("rejects what the gateway schema would reject", () => {
    const parsed = parseScenarioForm({
      ...emptyScenarioForm(),
      path: "//evil.com",
      name: " ",
      expectedStatus: "700",
      headers: '{"x": 1}',
      body: "{oops",
    });
    expect(parsed).toEqual({
      ok: false,
      errors: { path: "path", name: "required", expectedStatus: "status", headers: "headersObject", body: "json" },
    });
  });

  it("omits empty headers/body/description from the payload", () => {
    const parsed = parseScenarioForm({ ...emptyScenarioForm(), name: "Không token", headers: "", category: "auth", expectedStatus: "401" });
    expect(parsed.ok && parsed.payload).toEqual({
      service: "gateway",
      method: "GET",
      path: "/",
      name: "Không token",
      requestTemplate: {},
      expectedStatus: 401,
      category: "auth",
      authProfile: "caller",
    });
  });
});
