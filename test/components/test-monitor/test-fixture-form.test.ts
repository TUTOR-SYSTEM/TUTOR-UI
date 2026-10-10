import { describe, expect, it } from "vitest";

import { emptyFixtureForm, fixtureToForm, parseFixtureForm } from "@/components/test-monitor/test-fixture-form";
import type { ApiTestFixture } from "@/types";

const resolverFixture: ApiTestFixture = {
  id: "f1",
  key: "classId",
  description: "Lớp đầu tiên",
  value: "c-1",
  resolver: { method: "GET", path: "/classes?limit=1", authProfile: "admin", extract: "data.classes.0.id" },
  resolvedAt: null,
  createdAt: "",
  updatedAt: null,
};

describe("test-fixture-form", () => {
  it("round-trips a resolver fixture and clears the fixed value", () => {
    expect(parseFixtureForm(fixtureToForm(resolverFixture))).toEqual({
      ok: true,
      payload: {
        key: "classId",
        description: "Lớp đầu tiên",
        value: null,
        resolver: { method: "GET", path: "/classes?limit=1", authProfile: "admin", extract: "data.classes.0.id" },
      },
    });
  });

  it("switching to a fixed value drops the resolver", () => {
    const form = { ...fixtureToForm(resolverFixture), mode: "value" as const, value: " ABC123 " };
    expect(parseFixtureForm(form)).toEqual({
      ok: true,
      payload: { key: "classId", description: "Lớp đầu tiên", value: "ABC123", resolver: null },
    });
  });

  it("validates key, path and the source the mode needs", () => {
    expect(parseFixtureForm({ ...emptyFixtureForm(), key: "1bad", path: "//x", extract: " " })).toEqual({
      ok: false,
      errors: { key: "key", path: "path", extract: "required" },
    });
    expect(parseFixtureForm({ ...emptyFixtureForm(), key: "ok", mode: "value" })).toEqual({
      ok: false,
      errors: { value: "required" },
    });
  });
});
