import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => nav.pathname,
}));

import { RoleGuard } from "@/components/providers/role-guard";
import { RouteAccessGuard } from "@/components/providers/route-access-guard";
import { useAuthStore } from "@/zustand/auth.store";

const initial = useAuthStore.getState();
const jwt = (payload: Record<string, unknown>) => `h.${btoa(JSON.stringify(payload))}.s`;

function setRole(role: string) {
  useAuthStore.setState({ accessToken: jwt({ role }), user: { role } as never }, false);
}

describe("RoleGuard", () => {
  beforeEach(() => {
    router.replace.mockReset();
  });

  afterEach(() => {
    useAuthStore.setState(initial, true);
  });

  it("renders children when the current role is allowed", () => {
    setRole("TUTOR");
    render(
      <RoleGuard allow={["ADMIN", "TUTOR"]}>
        <p>secret tutor page</p>
      </RoleGuard>,
    );
    expect(screen.getByText("secret tutor page")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("hides children and redirects to the role home when not allowed", () => {
    setRole("STUDENT");
    render(
      <RoleGuard allow={["ADMIN"]}>
        <p>admin only</p>
      </RoleGuard>,
    );
    expect(screen.queryByText("admin only")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(router.replace).toHaveBeenCalledWith("/");
  });
});

describe("RouteAccessGuard", () => {
  beforeEach(() => {
    router.replace.mockReset();
  });

  afterEach(() => {
    useAuthStore.setState(initial, true);
  });

  it("applies the ROUTE_ACCESS rule for the current pathname", () => {
    setRole("PARENT");
    nav.pathname = "/users/42";
    render(
      <RouteAccessGuard>
        <p>user management</p>
      </RouteAccessGuard>,
    );
    expect(screen.queryByText("user management")).not.toBeInTheDocument();
    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("lets every logged-in role into routes that have no rule", () => {
    setRole("PARENT");
    nav.pathname = "/settings";
    render(
      <RouteAccessGuard>
        <p>settings page</p>
      </RouteAccessGuard>,
    );
    expect(screen.getByText("settings page")).toBeInTheDocument();
  });

  it("allows a role listed in a nested route's rule", () => {
    setRole("STUDENT");
    nav.pathname = "/sessions/abc/detail";
    render(
      <RouteAccessGuard>
        <p>session detail</p>
      </RouteAccessGuard>,
    );
    expect(screen.getByText("session detail")).toBeInTheDocument();
  });
});
