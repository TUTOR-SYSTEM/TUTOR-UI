import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_STORE_KEY,
  clearLegacyAuthTokens,
  getAccessToken,
} from "@/lib/axios/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("reads the access token from the single persisted auth-store key", () => {
    localStorage.setItem(AUTH_STORE_KEY, JSON.stringify({ state: { accessToken: "access-1" }, version: 0 }));
    expect(getAccessToken()).toBe("access-1");
  });

  it("returns null when nothing is persisted or the payload is malformed", () => {
    expect(getAccessToken()).toBeNull();
    localStorage.setItem(AUTH_STORE_KEY, "{not json");
    expect(getAccessToken()).toBeNull();
  });

  it("clearLegacyAuthTokens removes the old separate access/refresh keys", () => {
    localStorage.setItem("accessToken", "a");
    localStorage.setItem("refreshToken", "r");
    clearLegacyAuthTokens();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("swallows storage errors and returns null on read", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(getAccessToken()).toBeNull();
    expect(() => clearLegacyAuthTokens()).not.toThrow();
  });
});
