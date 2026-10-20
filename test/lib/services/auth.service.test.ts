import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/axios/query", () => ({
  usePost: vi.fn((url: unknown, options?: Record<string, unknown>) => ({ url, options })),
}));

import { usePost } from "@/lib/axios/query";
import { useAuthActions } from "@/lib/services/auth.service";

describe("auth.service", () => {
  it("exposes login, register, forgotPassword, resetPassword, verifyEmail and logout mutations", () => {
    const actions = useAuthActions();
    expect(Object.keys(actions).sort()).toEqual(["forgotPassword", "login", "logout", "register", "resetPassword", "verifyEmail"]);
  });

  it("registers against /auth/register, forgot against /auth/forgot-password, reset against /auth/reset-password", () => {
    useAuthActions();
    const urls = vi.mocked(usePost).mock.calls.map((c) => c[0]);
    expect(urls).toEqual(
      expect.arrayContaining([
        "/auth/register",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/verify-email",
      ]),
    );
  });

  it("routes an email login to /auth/login", () => {
    useAuthActions();
    const loginUrl = vi.mocked(usePost).mock.calls[0][0] as (p: object) => string;
    expect(loginUrl({ email: "a@b.c", password: "x" })).toBe("/auth/login");
  });

  it("routes a user-code login to /auth/login/user-code", () => {
    useAuthActions();
    const loginUrl = vi.mocked(usePost).mock.calls[0][0] as (p: object) => string;
    expect(loginUrl({ userCode: "STU1", password: "x", role: "STUDENT" })).toBe("/auth/login/user-code");
  });
});
