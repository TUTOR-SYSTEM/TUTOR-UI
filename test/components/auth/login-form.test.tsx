import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authDictionary } from "@/lib/i18n/auth.dictionary";
import { ApiError, DEFAULT_LANGUAGE } from "@/types";

const t = authDictionary[DEFAULT_LANGUAGE].login;
const shared = authDictionary[DEFAULT_LANGUAGE].shared;

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/login",
}));

const mutation = vi.hoisted(() => ({
  login: { mutate: vi.fn(), isPending: false },
}));
vi.mock("@/lib/services/auth.service", () => ({
  useAuthActions: () => mutation,
}));

const oauth = vi.hoisted(() => ({
  startGoogleOAuth: vi.fn(),
  startFacebookOAuth: vi.fn(),
}));
vi.mock("@/lib/oauth", () => oauth);

import { LoginForm } from "@/components/auth/login-form";
import { useAuthStore } from "@/zustand/auth.store";

const initialAuth = useAuthStore.getState();

type MutateOptions = {
  onSuccess: (raw: unknown) => void;
  onError: (error: Error) => void;
};

/** Returns the callbacks passed to the most recent `login.mutate` call. */
function lastMutateOptions(): MutateOptions {
  const calls = mutation.login.mutate.mock.calls;
  return calls[calls.length - 1][1] as MutateOptions;
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(t.submit) }));
}

function typePassword(container: HTMLElement, value = "pw") {
  fireEvent.change(container.querySelector("#password")!, { target: { value } });
}

function chooseRole(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    mutation.login.mutate.mockReset();
    mutation.login.isPending = false;
    router.replace.mockReset();
    oauth.startGoogleOAuth.mockReset();
    oauth.startFacebookOAuth.mockReset();
    useAuthStore.setState(initialAuth, true);
  });

  afterEach(() => {
    useAuthStore.setState(initialAuth, true);
  });

  describe("rendering", () => {
    it("shows the heading, subtitle and the three role tabs", () => {
      render(<LoginForm />);
      expect(screen.getByRole("heading", { name: t.heading })).toBeInTheDocument();
      expect(screen.getByText(t.subtitle)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: t.roleAdmin })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: t.roleStudent })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: t.roleParent })).toBeInTheDocument();
    });

    it("defaults to the admin role and renders the email field", () => {
      const { container } = render(<LoginForm />);
      expect(container.querySelector("#email")).not.toBeNull();
      expect(container.querySelector("#identifier")).toBeNull();
    });

    it("renders the password field as masked and the forgot-password link", () => {
      const { container } = render(<LoginForm />);
      const password = container.querySelector("#password") as HTMLInputElement;
      expect(password.type).toBe("password");
      expect(password.autocomplete).toBe("current-password");
      const forgot = screen.getByRole("link", { name: t.forgotPassword });
      expect(forgot).toHaveAttribute("href", "/forgot-password");
    });

    it("applies a custom className to the root element", () => {
      const { container } = render(<LoginForm className="extra-class" />);
      expect(container.firstChild).toHaveClass("extra-class");
    });
  });

  describe("role switching", () => {
    it("shows the identifier field instead of email for student and parent", () => {
      const { container } = render(<LoginForm />);

      chooseRole(t.roleStudent);
      expect(container.querySelector("#identifier")).not.toBeNull();
      expect(container.querySelector("#email")).toBeNull();

      chooseRole(t.roleParent);
      expect(container.querySelector("#identifier")).not.toBeNull();
      expect(container.querySelector("#email")).toBeNull();

      chooseRole(t.roleAdmin);
      expect(container.querySelector("#email")).not.toBeNull();
      expect(container.querySelector("#identifier")).toBeNull();
    });

    it("keeps typed password when the role changes", () => {
      const { container } = render(<LoginForm />);
      const password = container.querySelector("#password") as HTMLInputElement;
      fireEvent.change(password, { target: { value: "secret" } });
      chooseRole(t.roleStudent);
      expect(
        (container.querySelector("#password") as HTMLInputElement).value,
      ).toBe("secret");
    });
  });

  describe("submit payloads", () => {
    it("sends trimmed email and password for admin", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, {
        target: { value: "  tutor@example.com  " },
      });
      fireEvent.change(container.querySelector("#password")!, {
        target: { value: "pw-123" },
      });
      submit();
      expect(mutation.login.mutate).toHaveBeenCalledTimes(1);
      expect(mutation.login.mutate.mock.calls[0][0]).toEqual({
        email: "tutor@example.com",
        password: "pw-123",
      });
    });

    it("sends email (not userCode) when a student identifier contains @", () => {
      const { container } = render(<LoginForm />);
      chooseRole(t.roleStudent);
      fireEvent.change(container.querySelector("#identifier")!, {
        target: { value: " kid@example.com " },
      });
      fireEvent.change(container.querySelector("#password")!, {
        target: { value: "pw" },
      });
      submit();
      expect(mutation.login.mutate.mock.calls[0][0]).toEqual({
        email: "kid@example.com",
        password: "pw",
      });
    });

    it("sends userCode with role STUDENT for a student code without @", () => {
      const { container } = render(<LoginForm />);
      chooseRole(t.roleStudent);
      fireEvent.change(container.querySelector("#identifier")!, {
        target: { value: "STU001" },
      });
      fireEvent.change(container.querySelector("#password")!, { target: { value: "stu-pw" } });
      submit();
      expect(mutation.login.mutate.mock.calls[0][0]).toEqual({
        userCode: "STU001",
        password: "stu-pw",
        role: "STUDENT",
      });
    });

    it("sends userCode with role PARENT for a parent code without @", () => {
      const { container } = render(<LoginForm />);
      chooseRole(t.roleParent);
      fireEvent.change(container.querySelector("#identifier")!, {
        target: { value: "PAR009" },
      });
      typePassword(container, "par-pw");
      submit();
      expect(mutation.login.mutate.mock.calls[0][0]).toEqual({
        userCode: "PAR009",
        password: "par-pw",
        role: "PARENT",
      });
    });

    it("trims whitespace-only identifier to an empty userCode", () => {
      const { container } = render(<LoginForm />);
      chooseRole(t.roleStudent);
      fireEvent.change(container.querySelector("#identifier")!, {
        target: { value: "    " },
      });
      typePassword(container);
      submit();
      // Identifier rỗng sau khi trim bị chặn ở FE, không gửi request.
      expect(mutation.login.mutate).not.toHaveBeenCalled();
      expect(screen.getByText(shared.requiredField)).toBeInTheDocument();
    });

    it("blocks submit with an empty password and shows the required message", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      submit();
      expect(mutation.login.mutate).not.toHaveBeenCalled();
      expect(screen.getByText(shared.requiredField)).toBeInTheDocument();
    });

    it("does not block a short password (legacy accounts) but rejects one over 100 characters", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container, "123");
      submit();
      expect(mutation.login.mutate).toHaveBeenCalledTimes(1);
      mutation.login.mutate.mockReset();
      typePassword(container, "x".repeat(101));
      submit();
      expect(mutation.login.mutate).not.toHaveBeenCalled();
      expect(screen.getByText(shared.passwordTooLong)).toBeInTheDocument();
    });
  });

  describe("login success", () => {
    it("starts a session with the access token only, then redirects home", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      act(() => lastMutateOptions().onSuccess({ data: { accessToken: "acc-1" } }));

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe("acc-1");
      expect(state.sessionChecked).toBe(false);
      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("accepts the snake_case access_token field", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      act(() => lastMutateOptions().onSuccess({ access_token: "acc-snake" }));
      expect(useAuthStore.getState().accessToken).toBe("acc-snake");
    });

    it("accepts the generic token field when no accessToken is present", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      act(() => lastMutateOptions().onSuccess({ token: "generic-token" }));
      expect(useAuthStore.getState().accessToken).toBe("generic-token");
    });

    it("unwraps the { data } envelope before reading the token", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      act(() => lastMutateOptions().onSuccess({ data: { accessToken: "wrapped" } }));
      expect(useAuthStore.getState().accessToken).toBe("wrapped");
    });

    it("replaces a previous account's session when a new login succeeds", () => {
      useAuthStore.setState({ accessToken: "old", user: { id: "old-user" } as never, sessionChecked: true }, false);
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      act(() => lastMutateOptions().onSuccess({ accessToken: "new" }));
      expect(useAuthStore.getState().accessToken).toBe("new");
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("shows an error and stays on the login page when no token is returned", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      act(() => lastMutateOptions().onSuccess({ data: {} }));
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe("login error", () => {
    it("maps 422 field errors onto the matching input", async () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      const error = new ApiError("Validation failed", 422, {
        errors: [{ field: "password", message: "Mật khẩu quá ngắn" }],
      } as never);
      act(() => lastMutateOptions().onError(error));
      expect(await screen.findByText("Mật khẩu quá ngắn")).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("shows a root server error when a 422 has no mappable field", async () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      const error = new ApiError("Validation failed", 422, {
        issues: [],
        errors: [],
      } as never);
      act(() => lastMutateOptions().onError(error));
      await waitFor(() => {
        expect(screen.getByText(/Validation failed/)).toBeInTheDocument();
      });
    });

    it("does not navigate or store tokens on error", () => {
      const { container } = render(<LoginForm />);
      fireEvent.change(container.querySelector("#email")!, { target: { value: "a@b.co" } });
      typePassword(container);
      submit();
      act(() => lastMutateOptions().onError(new ApiError("Unauthorized", 401)));
      expect(router.replace).not.toHaveBeenCalled();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  describe("auth redirect", () => {
    it("redirects to home when the user is already authenticated", () => {
      useAuthStore.setState({ accessToken: "t", user: { id: "u" } as never, sessionChecked: true }, false);
      render(<LoginForm />);
      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("does not redirect when there is no session", () => {
      render(<LoginForm />);
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe("password visibility", () => {
    it("toggles the password input between masked and visible", () => {
      const { container } = render(<LoginForm />);
      const password = container.querySelector("#password") as HTMLInputElement;
      fireEvent.click(screen.getByRole("button", { name: shared.showPassword }));
      expect(password.type).toBe("text");
      fireEvent.click(screen.getByRole("button", { name: shared.hidePassword }));
      expect(password.type).toBe("password");
    });
  });

  describe("pending state", () => {
    it("disables the submit button and shows the processing label while pending", () => {
      mutation.login.isPending = true;
      render(<LoginForm />);
      const button = screen.getByRole("button", { name: shared.processing });
      expect(button).toBeDisabled();
    });

    it("enables the submit button when not pending", () => {
      render(<LoginForm />);
      expect(screen.getByRole("button", { name: new RegExp(t.submit) })).toBeEnabled();
    });
  });

  describe("OAuth", () => {
    it("starts the Google OAuth flow from the Google button", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /Google/ }));
      expect(oauth.startGoogleOAuth).toHaveBeenCalledTimes(1);
    });

    it("starts the Facebook OAuth flow from the Facebook button", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /Facebook/ }));
      expect(oauth.startFacebookOAuth).toHaveBeenCalledTimes(1);
    });
  });
});
