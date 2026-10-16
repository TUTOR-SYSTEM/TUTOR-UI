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

const saveTokens = vi.hoisted(() => vi.fn());
vi.mock("@/lib/axios", () => ({ setAuthTokens: saveTokens }));

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

function chooseRole(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    mutation.login.mutate.mockReset();
    mutation.login.isPending = false;
    router.replace.mockReset();
    saveTokens.mockReset();
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

    it("renders the remember-me checkbox unchecked", () => {
      render(<LoginForm />);
      const checkbox = screen.getByRole("checkbox", { name: t.rememberMe });
      expect(checkbox).not.toBeChecked();
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
      submit();
      expect(mutation.login.mutate.mock.calls[0][0]).toEqual({
        userCode: "STU001",
        password: "",
        role: "STUDENT",
      });
    });

    it("sends userCode with role PARENT for a parent code without @", () => {
      const { container } = render(<LoginForm />);
      chooseRole(t.roleParent);
      fireEvent.change(container.querySelector("#identifier")!, {
        target: { value: "PAR009" },
      });
      submit();
      expect(mutation.login.mutate.mock.calls[0][0]).toEqual({
        userCode: "PAR009",
        password: "",
        role: "PARENT",
      });
    });

    it("trims whitespace-only identifier to an empty userCode", () => {
      const { container } = render(<LoginForm />);
      chooseRole(t.roleStudent);
      fireEvent.change(container.querySelector("#identifier")!, {
        target: { value: "    " },
      });
      submit();
      expect(mutation.login.mutate.mock.calls[0][0]).toMatchObject({
        userCode: "",
        role: "STUDENT",
      });
    });

    it("does not call mutate twice on a single click", () => {
      render(<LoginForm />);
      submit();
      expect(mutation.login.mutate).toHaveBeenCalledTimes(1);
    });
  });

  describe("login success", () => {
    it("stores tokens in the auth store and in storage, then redirects home", () => {
      render(<LoginForm />);
      submit();
      act(() =>
        lastMutateOptions().onSuccess({
          data: { accessToken: "acc-1", refreshToken: "ref-1" },
        }),
      );

      expect(useAuthStore.getState().accessToken).toBe("acc-1");
      expect(useAuthStore.getState().refreshToken).toBe("ref-1");
      expect(saveTokens).toHaveBeenCalledWith("acc-1", "ref-1");
      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("accepts the snake_case access_token and refresh_token fields", () => {
      render(<LoginForm />);
      submit();
      act(() =>
        lastMutateOptions().onSuccess({
          access_token: "acc-snake",
          refresh_token: "ref-snake",
        }),
      );
      expect(saveTokens).toHaveBeenCalledWith("acc-snake", "ref-snake");
      expect(useAuthStore.getState().accessToken).toBe("acc-snake");
    });

    it("accepts the generic token field when no accessToken is present", () => {
      render(<LoginForm />);
      submit();
      act(() => lastMutateOptions().onSuccess({ token: "generic-token" }));
      expect(saveTokens).toHaveBeenCalledWith("generic-token", null);
    });

    it("stores null refresh token when the response omits it", () => {
      render(<LoginForm />);
      submit();
      act(() => lastMutateOptions().onSuccess({ accessToken: "only-access" }));
      expect(saveTokens).toHaveBeenCalledWith("only-access", null);
      expect(useAuthStore.getState().refreshToken).toBeNull();
    });

    it("keeps an explicit null refresh token as null in the store", () => {
      render(<LoginForm />);
      submit();
      act(() => lastMutateOptions().onSuccess({ accessToken: "a", refreshToken: null }));
      expect(saveTokens).toHaveBeenCalledWith("a", null);
      expect(useAuthStore.getState().refreshToken).toBeNull();
    });

    it("unwraps the { data } envelope before reading tokens", () => {
      render(<LoginForm />);
      submit();
      act(() => lastMutateOptions().onSuccess({ data: { accessToken: "wrapped" } }));
      expect(saveTokens).toHaveBeenCalledWith("wrapped", null);
    });

    it("shows an error and stays on the login page when no token is returned", () => {
      render(<LoginForm />);
      submit();
      act(() => lastMutateOptions().onSuccess({ data: {} }));
      expect(saveTokens).not.toHaveBeenCalled();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("clears a stale refresh token when the response carries none", () => {
      useAuthStore.setState({ refreshToken: "old-account-refresh" }, false);
      render(<LoginForm />);
      submit();
      act(() => lastMutateOptions().onSuccess({ data: { accessToken: "new-access" } }));
      expect(useAuthStore.getState().refreshToken).toBeNull();
      expect(saveTokens).toHaveBeenCalledWith("new-access", null);
    });
  });

  describe("login error", () => {
    it("maps 422 field errors onto the matching input", async () => {
      render(<LoginForm />);
      submit();
      const error = new ApiError("Validation failed", 422, {
        errors: [{ field: "password", message: "Mật khẩu quá ngắn" }],
      } as never);
      act(() => lastMutateOptions().onError(error));
      expect(await screen.findByText("Mật khẩu quá ngắn")).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("shows a root server error when a 422 has no mappable field", async () => {
      render(<LoginForm />);
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
      render(<LoginForm />);
      submit();
      act(() => lastMutateOptions().onError(new ApiError("Unauthorized", 401)));
      expect(router.replace).not.toHaveBeenCalled();
      expect(saveTokens).not.toHaveBeenCalled();
    });
  });

  describe("auth redirect", () => {
    it("redirects to home when the user is already authenticated", () => {
      useAuthStore.setState({ accessToken: "t", sessionChecked: true }, false);
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
