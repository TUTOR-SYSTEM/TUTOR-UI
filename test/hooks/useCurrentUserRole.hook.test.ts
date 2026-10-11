import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useAuthStore } from "@/zustand/auth.store";

const initial = useAuthStore.getState();

/** Builds an unsigned JWT-shaped token carrying the given payload. */
const jwt = (payload: Record<string, unknown>) =>
  `header.${btoa(JSON.stringify(payload))}.sig`;

describe("useCurrentUserRole", () => {
  beforeEach(() => {
    useAuthStore.setState({ ...initial, accessToken: null, user: null }, false);
  });

  afterEach(() => {
    useAuthStore.setState(initial, true);
  });

  it("defaults to TUTOR when there is no profile and no token", () => {
    const { result } = renderHook(() => useCurrentUserRole());
    expect(result.current).toBe("TUTOR");
  });

  it("reads the role from the JWT claim before the profile loads", () => {
    useAuthStore.setState({ accessToken: jwt({ role: "STUDENT" }) }, false);
    const { result } = renderHook(() => useCurrentUserRole());
    expect(result.current).toBe("STUDENT");
  });

  it("prefers the role from the loaded profile over the token claim", () => {
    useAuthStore.setState(
      {
        accessToken: jwt({ role: "STUDENT" }),
        user: { role: "ADMIN" } as never,
      },
      false,
    );
    const { result } = renderHook(() => useCurrentUserRole());
    expect(result.current).toBe("ADMIN");
  });

  it("normalises casing and ignores unknown roles", () => {
    useAuthStore.setState({ user: { role: "parent" } as never }, false);
    expect(renderHook(() => useCurrentUserRole()).result.current).toBe("PARENT");

    useAuthStore.setState({ user: { role: "root" } as never, accessToken: jwt({ role: "x" }) }, false);
    expect(renderHook(() => useCurrentUserRole()).result.current).toBe("TUTOR");
  });

  it("falls back to TUTOR when the token is malformed", () => {
    useAuthStore.setState({ accessToken: "not-a-jwt" }, false);
    expect(renderHook(() => useCurrentUserRole()).result.current).toBe("TUTOR");
  });
});
