import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/axios/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("stores the access token and, when given, the refresh token", () => {
    setAuthTokens("access-1", "refresh-1");
    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBe("refresh-1");
  });

  it("leaves the refresh token untouched when the argument is omitted", () => {
    setAuthTokens("access-1", "refresh-1");
    setAuthTokens("access-2");
    expect(getAccessToken()).toBe("access-2");
    expect(getRefreshToken()).toBe("refresh-1");
  });

  it("removes the refresh token when it is passed as null", () => {
    setAuthTokens("access-1", "refresh-1");
    setAuthTokens("access-2", null);
    expect(getRefreshToken()).toBeNull();
  });

  it("clearAuthTokens removes both tokens", () => {
    setAuthTokens("a", "r");
    clearAuthTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("swallows storage errors and returns null on read", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(getAccessToken()).toBeNull();
    expect(() => setAuthTokens("a", "r")).not.toThrow();
  });
});
