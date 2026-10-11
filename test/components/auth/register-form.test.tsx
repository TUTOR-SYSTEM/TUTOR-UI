import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authDictionary } from "@/lib/i18n/auth.dictionary";
import { ApiError, DEFAULT_LANGUAGE } from "@/types";

const t = authDictionary[DEFAULT_LANGUAGE].register;
const shared = authDictionary[DEFAULT_LANGUAGE].shared;

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/register",
}));

const mutation = vi.hoisted(() => ({
  register: { mutate: vi.fn(), isPending: false },
}));
vi.mock("@/lib/services/auth.service", () => ({
  useAuthActions: () => mutation,
}));

const oauth = vi.hoisted(() => ({
  startGoogleOAuth: vi.fn(),
  startFacebookOAuth: vi.fn(),
}));
vi.mock("@/lib/oauth", () => oauth);

import { RegisterForm } from "@/components/auth/register-form";

type MutateOptions = {
  onSuccess: () => void;
  onError: (error: Error) => void;
};

function lastMutateOptions(): MutateOptions {
  const calls = mutation.register.mutate.mock.calls;
  return calls[calls.length - 1][1] as MutateOptions;
}

function fill(container: HTMLElement, values: Record<string, string>) {
  for (const [id, value] of Object.entries(values)) {
    fireEvent.change(container.querySelector(`#${id}`)!, { target: { value } });
  }
}

const validValues = {
  firstName: "An",
  lastName: "Nguyen",
  email: "  an@example.com  ",
  password: "Passw0rd!",
  confirmPassword: "Passw0rd!",
};

function submit() {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(t.submit) }));
}

describe("RegisterForm", () => {
  beforeEach(() => {
    mutation.register.mutate.mockReset();
    mutation.register.isPending = false;
    router.push.mockReset();
    router.replace.mockReset();
  });

  describe("rendering", () => {
    it("renders the heading, subtitle and every input field", () => {
      const { container } = render(<RegisterForm />);
      expect(screen.getByRole("heading", { name: t.heading })).toBeInTheDocument();
      expect(screen.getByText(t.subtitle)).toBeInTheDocument();
      for (const id of ["firstName", "lastName", "email", "password", "confirmPassword"]) {
        expect(container.querySelector(`#${id}`)).not.toBeNull();
      }
    });

    it("uses the expected autocomplete hints for each field", () => {
      const { container } = render(<RegisterForm />);
      expect((container.querySelector("#firstName") as HTMLInputElement).autocomplete).toBe("given-name");
      expect((container.querySelector("#lastName") as HTMLInputElement).autocomplete).toBe("family-name");
      expect((container.querySelector("#email") as HTMLInputElement).type).toBe("email");
      expect((container.querySelector("#password") as HTMLInputElement).autocomplete).toBe("new-password");
      expect((container.querySelector("#confirmPassword") as HTMLInputElement).autocomplete).toBe("new-password");
    });

    it("renders masked password inputs by default", () => {
      const { container } = render(<RegisterForm />);
      expect((container.querySelector("#password") as HTMLInputElement).type).toBe("password");
      expect((container.querySelector("#confirmPassword") as HTMLInputElement).type).toBe("password");
    });

    it("links back to the login page", () => {
      render(<RegisterForm />);
      expect(screen.getByRole("link", { name: t.signIn })).toHaveAttribute("href", "/login");
    });

    it("renders no root error message initially", () => {
      render(<RegisterForm />);
      expect(screen.queryByText(/Validation failed/)).not.toBeInTheDocument();
    });
  });

  describe("password visibility", () => {
    it("toggles the password field independently of the confirm field", () => {
      const { container } = render(<RegisterForm />);
      const password = container.querySelector("#password") as HTMLInputElement;
      const confirm = container.querySelector("#confirmPassword") as HTMLInputElement;

      const [showPassword, showConfirm] = screen.getAllByRole("button", { name: shared.showPassword });
      fireEvent.click(showPassword);
      expect(password.type).toBe("text");
      expect(confirm.type).toBe("password");

      fireEvent.click(showConfirm);
      expect(confirm.type).toBe("text");

      fireEvent.click(screen.getAllByRole("button", { name: shared.hidePassword })[0]);
      expect(password.type).toBe("password");
      expect(confirm.type).toBe("text");
    });
  });

  describe("client-side validation", () => {
    it("blocks submit and flags confirmPassword when passwords differ", () => {
      const { container } = render(<RegisterForm />);
      fill(container, { ...validValues, confirmPassword: "different" });
      submit();
      expect(mutation.register.mutate).not.toHaveBeenCalled();
      expect(screen.getByText(t.passwordMismatch)).toBeInTheDocument();
    });

    it("clears the mismatch error after a later successful submit", () => {
      const { container } = render(<RegisterForm />);
      fill(container, { ...validValues, confirmPassword: "different" });
      submit();
      expect(screen.getByText(t.passwordMismatch)).toBeInTheDocument();

      fill(container, { confirmPassword: validValues.password });
      submit();
      expect(screen.queryByText(t.passwordMismatch)).not.toBeInTheDocument();
      expect(mutation.register.mutate).toHaveBeenCalledTimes(1);
    });

    it("treats an empty confirm field against a filled password as a mismatch", () => {
      const { container } = render(<RegisterForm />);
      fill(container, { ...validValues, confirmPassword: "" });
      submit();
      expect(mutation.register.mutate).not.toHaveBeenCalled();
      expect(screen.getByText(t.passwordMismatch)).toBeInTheDocument();
    });

    it("compares passwords case-sensitively", () => {
      const { container } = render(<RegisterForm />);
      fill(container, { ...validValues, confirmPassword: "passw0rd!" });
      submit();
      expect(mutation.register.mutate).not.toHaveBeenCalled();
    });
  });

  describe("submit payload", () => {
    it("sends trimmed email and the full name and password fields", () => {
      const { container } = render(<RegisterForm />);
      fill(container, validValues);
      submit();
      expect(mutation.register.mutate).toHaveBeenCalledTimes(1);
      expect(mutation.register.mutate.mock.calls[0][0]).toEqual({
        firstName: "An",
        lastName: "Nguyen",
        email: "an@example.com",
        password: "Passw0rd!",
        confirmPassword: "Passw0rd!",
      });
    });

    it("sends empty name fields as empty strings without blocking", () => {
      const { container } = render(<RegisterForm />);
      fill(container, { ...validValues, firstName: "", lastName: "" });
      submit();
      expect(mutation.register.mutate.mock.calls[0][0]).toMatchObject({
        firstName: "",
        lastName: "",
      });
    });

    it("forwards the first name without trimming it", () => {
      const { container } = render(<RegisterForm />);
      fill(container, { ...validValues, firstName: "  An  " });
      submit();
      expect(mutation.register.mutate.mock.calls[0][0].firstName).toBe("  An  ");
    });
  });

  describe("success", () => {
    it("navigates to /login after a successful registration", () => {
      const { container } = render(<RegisterForm />);
      fill(container, validValues);
      submit();
      act(() => lastMutateOptions().onSuccess());
      expect(router.push).toHaveBeenCalledWith("/login");
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe("error", () => {
    it("maps 422 field errors onto the matching input", async () => {
      const { container } = render(<RegisterForm />);
      fill(container, validValues);
      submit();
      const error = new ApiError("Validation failed", 422, {
        errors: [{ field: "email", message: "Email đã tồn tại" }],
      } as never);
      act(() => lastMutateOptions().onError(error));
      expect(await screen.findByText("Email đã tồn tại")).toBeInTheDocument();
      expect(router.push).not.toHaveBeenCalled();
    });

    it("maps issues[] entries from the validation pipe onto matching fields", async () => {
      const { container } = render(<RegisterForm />);
      fill(container, validValues);
      submit();
      const error = new ApiError("Validation failed", 422, {
        issues: [{ path: "password", message: "Mật khẩu quá yếu" }],
      } as never);
      act(() => lastMutateOptions().onError(error));
      expect(await screen.findByText("Mật khẩu quá yếu")).toBeInTheDocument();
      expect(container.querySelector("#password")).not.toBeNull();
    });

    it("shows a root server error when a 422 has no mappable field", async () => {
      const { container } = render(<RegisterForm />);
      fill(container, validValues);
      submit();
      const error = new ApiError("Validation failed", 422, { errors: [], issues: [] } as never);
      act(() => lastMutateOptions().onError(error));
      expect(await screen.findByText(/Validation failed/)).toBeInTheDocument();
    });

    it("does not navigate on a non-422 error", () => {
      const { container } = render(<RegisterForm />);
      fill(container, validValues);
      submit();
      act(() => lastMutateOptions().onError(new ApiError("Conflict", 409)));
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe("pending state", () => {
    it("shows the pending label and disables submit while the request runs", () => {
      mutation.register.isPending = true;
      render(<RegisterForm />);
      const button = screen.getByRole("button", { name: t.pendingLabel });
      expect(button).toBeDisabled();
    });

    it("keeps the submit label and enables the button when idle", () => {
      render(<RegisterForm />);
      expect(screen.getByRole("button", { name: new RegExp(t.submit) })).toBeEnabled();
    });
  });

  describe("OAuth", () => {
    it("starts Google OAuth from the Google button", () => {
      render(<RegisterForm />);
      fireEvent.click(screen.getByRole("button", { name: /Google/ }));
      expect(oauth.startGoogleOAuth).toHaveBeenCalledTimes(1);
    });

    it("starts Facebook OAuth from the Facebook button", () => {
      render(<RegisterForm />);
      fireEvent.click(screen.getByRole("button", { name: /Facebook/ }));
      expect(oauth.startFacebookOAuth).toHaveBeenCalledTimes(1);
    });
  });
});
