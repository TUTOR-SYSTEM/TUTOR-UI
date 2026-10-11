import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useAuthStore } from "@/zustand/auth.store";

const initial = useAuthStore.getState();
const jwt = (payload: Record<string, unknown>) => `h.${btoa(JSON.stringify(payload))}.s`;

describe("useCurrentUserId", () => {
  beforeEach(() => {
    useAuthStore.setState({ ...initial, accessToken: null, user: null }, false);
  });

  afterEach(() => {
    useAuthStore.setState(initial, true);
  });

  it("returns null when not authenticated", () => {
    expect(renderHook(() => useCurrentUserId()).result.current).toBeNull();
  });

  it("returns null when the token has no role yet (profile not ready)", () => {
    useAuthStore.setState({ accessToken: jwt({ sub: "u1" }), user: null }, false);
    expect(renderHook(() => useCurrentUserId()).result.current).toBeNull();
  });

  it("returns the sub claim once a role is known", () => {
    useAuthStore.setState(
      { accessToken: jwt({ sub: "user-42", role: "TUTOR" }), user: { role: "TUTOR" } as never },
      false,
    );
    expect(renderHook(() => useCurrentUserId()).result.current).toBe("user-42");
  });

  it("returns null for a token without a sub claim or a malformed token", () => {
    useAuthStore.setState({ accessToken: jwt({ role: "TUTOR" }), user: { role: "TUTOR" } as never }, false);
    expect(renderHook(() => useCurrentUserId()).result.current).toBeNull();

    useAuthStore.setState({ accessToken: "garbage", user: { role: "TUTOR" } as never }, false);
    expect(renderHook(() => useCurrentUserId()).result.current).toBeNull();
  });
});
