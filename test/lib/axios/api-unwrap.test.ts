import { describe, expect, it } from "vitest";

import { unwrapApiData } from "@/lib/axios/api-unwrap";

describe("unwrapApiData", () => {
  it("strips the Nest ResponseInterceptor `{ data }` envelope", () => {
    expect(unwrapApiData({ data: { id: 1 } })).toEqual({ id: 1 });
  });

  it("returns the body unchanged when there is no envelope", () => {
    const body = { id: 1, name: "x" };
    expect(unwrapApiData(body)).toBe(body);
  });

  it("keeps the body when `data` is null or undefined", () => {
    expect(unwrapApiData({ data: null, ok: true })).toEqual({ data: null, ok: true });
    expect(unwrapApiData({ data: undefined })).toEqual({ data: undefined });
  });

  it("passes primitives and null through", () => {
    expect(unwrapApiData(null)).toBeNull();
    expect(unwrapApiData("text")).toBe("text");
    expect(unwrapApiData(0)).toBe(0);
  });
});
