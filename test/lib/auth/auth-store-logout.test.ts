import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "@/zustand/auth.store";

describe("auth store clearAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: "a-1", refreshToken: "r-1", user: null }, false);
    localStorage.setItem("accessToken", "a-1");
    localStorage.setItem("refreshToken", "r-1");
  });

  it("drops the in-memory session and the legacy localStorage token keys", () => {
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});
