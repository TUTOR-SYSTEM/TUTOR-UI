import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MustChangePasswordGuard } from "@/components/providers/must-change-password-guard";
import { useAuthStore } from "@/zustand/auth.store";

const replace = vi.fn();
let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));

function setUser(mustChangePassword: boolean | undefined) {
  useAuthStore.setState(
    {
      accessToken: "not-a-jwt",
      sessionChecked: true,
      user: { id: "u1", role: "STUDENT", mustChangePassword } as never,
    },
    false,
  );
}

const renderGuard = () =>
  render(
    <MustChangePasswordGuard>
      <div>app-content</div>
    </MustChangePasswordGuard>,
  );

describe("MustChangePasswordGuard", () => {
  beforeEach(() => {
    replace.mockReset();
    pathname = "/";
  });

  it("redirects to /change-password and hides the app while a change is required", () => {
    setUser(true);
    renderGuard();
    expect(replace).toHaveBeenCalledWith("/change-password");
    expect(screen.queryByText("app-content")).toBeNull();
  });

  it("renders the change-password page itself when a change is required", () => {
    pathname = "/change-password";
    setUser(true);
    renderGuard();
    expect(screen.getByText("app-content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders normally when no change is required", () => {
    setUser(false);
    renderGuard();
    expect(screen.getByText("app-content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("leaves /change-password to the role home once the password no longer needs a change", () => {
    pathname = "/change-password";
    setUser(false);
    renderGuard();
    expect(replace).toHaveBeenCalledWith("/");
  });
});
