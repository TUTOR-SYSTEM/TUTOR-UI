import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "@/zustand/auth.store";

describe("auth store clearAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: "a-1", user: null }, false);
    localStorage.setItem("accessToken", "a-1");
    localStorage.setItem("refreshToken", "r-1");
  });

  it("drops the in-memory session and the legacy localStorage token keys", () => {
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.sessionChecked).toBe(true);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("startSession resets the profile and requires a fresh session check", () => {
    useAuthStore.setState({ user: { id: "u1" } as never, sessionChecked: true }, false);
    useAuthStore.getState().startSession("a-2");
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("a-2");
    expect(state.user).toBeNull();
    expect(state.sessionChecked).toBe(false);
  });
});
