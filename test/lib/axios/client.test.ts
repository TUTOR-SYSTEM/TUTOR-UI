import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import {
  normalizeResponseData,
  pickErrorMessage,
  requestUrlKey,
  shouldSkip401Refresh,
  toApiError,
} from "@/lib/axios/client";
import { ApiError } from "@/types";

const cfg = (over: Partial<InternalAxiosRequestConfig>) =>
  ({ headers: {}, ...over }) as InternalAxiosRequestConfig;

describe("normalizeResponseData", () => {
  it("returns undefined for empty or non-object bodies", () => {
    expect(normalizeResponseData(undefined)).toBeUndefined();
    expect(normalizeResponseData("html")).toBeUndefined();
  });

  it("passes object bodies through", () => {
    expect(normalizeResponseData({ message: "x" })).toEqual({ message: "x" });
  });
});

describe("pickErrorMessage", () => {
  it("prefers a string `message`", () => {
    expect(pickErrorMessage({ message: "Sai mật khẩu" }, "axios")).toBe("Sai mật khẩu");
  });

  it("joins an array `message`", () => {
    expect(pickErrorMessage({ message: ["a", "b"] })).toBe("a; b");
  });

  it("falls back to `error`, then to Nest `errors`", () => {
    expect(pickErrorMessage({ error: "Bad Request" })).toBe("Bad Request");
    expect(
      pickErrorMessage({ errors: [{ field: "x", message: "m1" }, { field: "y", message: "m2" }] }),
    ).toBe("m1; m2");
  });

  it("uses the axios message when the body has nothing usable", () => {
    expect(pickErrorMessage({}, "Network Error")).toBe("Network Error");
    expect(pickErrorMessage(undefined, "")).toBe("Unexpected network error");
  });
});

describe("toApiError", () => {
  it("wraps status, payload and message from an axios error", () => {
    const axiosErr = {
      message: "Request failed",
      response: { status: 409, data: { message: "Đã tồn tại" } },
    } as unknown as AxiosError;
    const err = toApiError(axiosErr);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe("Đã tồn tại");
    expect(err.data).toEqual({ message: "Đã tồn tại" });
  });

  it("handles a network failure with no response", () => {
    const err = toApiError({ message: "timeout of 30000ms exceeded" } as unknown as AxiosError);
    expect(err.statusCode).toBeUndefined();
    expect(err.message).toBe("timeout of 30000ms exceeded");
  });
});

describe("requestUrlKey", () => {
  it("joins base and path, trimming slashes and lowercasing", () => {
    expect(requestUrlKey(cfg({ baseURL: "http://api/", url: "/Auth/Login/" }))).toBe(
      "http://api/auth/login",
    );
  });
});

describe("shouldSkip401Refresh", () => {
  it("skips refresh for auth endpoints", () => {
    for (const url of ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"]) {
      expect(shouldSkip401Refresh(cfg({ baseURL: "http://api", url }))).toBe(true);
    }
  });

  it("honours the explicit skip401Refresh flag", () => {
    expect(
      shouldSkip401Refresh(cfg({ baseURL: "http://api", url: "/students", skip401Refresh: true } as never)),
    ).toBe(true);
  });

  it("refreshes for ordinary endpoints", () => {
    expect(shouldSkip401Refresh(cfg({ baseURL: "http://api", url: "/students" }))).toBe(false);
  });
});
