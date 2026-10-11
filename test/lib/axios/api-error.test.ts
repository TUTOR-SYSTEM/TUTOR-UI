import { describe, expect, it } from "vitest";

import { ApiError } from "@/types";
import { getErrorMessage, getValidationMessages } from "@/lib/axios/api-error";

describe("getErrorMessage", () => {
  it("returns the ApiError message", () => {
    expect(getErrorMessage(new ApiError("boom", 500))).toBe("boom");
  });

  it("falls back when an ApiError has an empty message", () => {
    expect(getErrorMessage(new ApiError("", 500), "fallback")).toBe("fallback");
  });

  it("returns the message of a plain Error", () => {
    expect(getErrorMessage(new Error("plain"))).toBe("plain");
  });

  it("uses the default fallback for unknown values", () => {
    expect(getErrorMessage("string error")).toBe("Unexpected error");
    expect(getErrorMessage(undefined, "custom")).toBe("custom");
  });
});

describe("getValidationMessages", () => {
  it("returns [] for non-422 errors", () => {
    expect(getValidationMessages(new ApiError("x", 400, { errors: [{ field: "a", message: "m" }] }))).toEqual([]);
    expect(getValidationMessages(new Error("x"))).toEqual([]);
  });

  it("prefers Nest/Zod `errors` entries", () => {
    const err = new ApiError("Validation", 422, {
      errors: [
        { field: "email", message: "Email sai" },
        { field: "name", message: "Tên trống" },
      ],
      issues: [{ path: "x", message: "ignored" }],
    });
    expect(getValidationMessages(err)).toEqual(["Email sai", "Tên trống"]);
  });

  it("falls back to `issues` when `errors` is absent", () => {
    const err = new ApiError("Validation", 422, {
      issues: [{ path: "password", message: "Quá ngắn" }],
    });
    expect(getValidationMessages(err)).toEqual(["Quá ngắn"]);
  });

  it("reads a string or array `message` as a last resort", () => {
    expect(getValidationMessages(new ApiError("v", 422, { message: "one" }))).toEqual(["one"]);
    expect(
      getValidationMessages(new ApiError("v", 422, { message: ["a", 1 as unknown as string, "b"] })),
    ).toEqual(["a", "b"]);
  });

  it("returns [] when a 422 carries no usable detail", () => {
    expect(getValidationMessages(new ApiError("v", 422, {}))).toEqual([]);
  });
});
