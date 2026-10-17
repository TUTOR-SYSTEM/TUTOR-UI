import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authDictionary } from "@/lib/i18n/auth.dictionary";
import { DEFAULT_LANGUAGE } from "@/types";

const t = authDictionary[DEFAULT_LANGUAGE].verifyEmail;
const shared = authDictionary[DEFAULT_LANGUAGE].shared;

const search = vi.hoisted(() => ({ token: null as string | null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(search.token === null ? "" : `token=${search.token}`),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/verify-email",
}));

vi.mock("@/hooks/useLocale.hook", () => ({
  useLocale: () => ({ language: "vi", setLocale: vi.fn() }),
}));

const mutation = vi.hoisted(() => ({
  verifyEmail: { mutate: vi.fn(), isPending: false },
}));
vi.mock("@/lib/services/auth.service", () => ({
  useAuthActions: () => mutation,
}));

import { VerifyEmail } from "@/components/auth/verify-email";

type MutateOptions = {
  onSuccess: () => void;
  onError: () => void;
};

/** Returns the callbacks passed to the most recent `verifyEmail.mutate` call. */
function lastMutateOptions(): MutateOptions {
  const calls = mutation.verifyEmail.mutate.mock.calls;
  return calls[calls.length - 1][1] as MutateOptions;
}

describe("VerifyEmail", () => {
  beforeEach(() => {
    mutation.verifyEmail.mutate.mockReset();
    search.token = null;
  });

  describe("without a token", () => {
    it("shows the missing-token state and does not call the API", () => {
      render(<VerifyEmail />);
      expect(screen.getByRole("heading", { name: t.heading })).toBeInTheDocument();
      expect(screen.getByText(t.missingToken)).toBeInTheDocument();
      expect(mutation.verifyEmail.mutate).not.toHaveBeenCalled();
    });

    it("treats an empty token as missing and does not call the API", () => {
      search.token = "";
      render(<VerifyEmail />);
      expect(screen.getByText(t.missingToken)).toBeInTheDocument();
      expect(mutation.verifyEmail.mutate).not.toHaveBeenCalled();
    });

    it("links back to login from the missing-token state", () => {
      render(<VerifyEmail />);
      expect(screen.getByRole("link", { name: shared.backToLogin })).toHaveAttribute("href", "/login");
    });
  });

  describe("with a token", () => {
    beforeEach(() => {
      search.token = "jti-abc";
    });

    it("shows the verifying state while the request is in flight", () => {
      render(<VerifyEmail />);
      expect(screen.getByRole("heading", { name: t.verifyingTitle })).toBeInTheDocument();
      expect(screen.getByText(t.verifyingSubtitle)).toBeInTheDocument();
    });

    it("calls verifyEmail exactly once with the token as jti", () => {
      render(<VerifyEmail />);
      expect(mutation.verifyEmail.mutate).toHaveBeenCalledTimes(1);
      expect(mutation.verifyEmail.mutate.mock.calls[0][0]).toEqual({ jti: "jti-abc" });
    });

    it("calls verifyEmail only once under React StrictMode", () => {
      render(
        <StrictMode>
          <VerifyEmail />
        </StrictMode>,
      );
      expect(mutation.verifyEmail.mutate).toHaveBeenCalledTimes(1);
      expect(mutation.verifyEmail.mutate.mock.calls[0][0]).toEqual({ jti: "jti-abc" });
    });

    it("shows the success state with a link to login on success", () => {
      render(<VerifyEmail />);
      act(() => {
        lastMutateOptions().onSuccess();
      });
      expect(screen.getByRole("heading", { name: t.successTitle })).toBeInTheDocument();
      expect(screen.getByText(t.successSubtitle)).toBeInTheDocument();
      const link = screen.getByRole("link", { name: t.loginNow });
      expect(link).toHaveAttribute("href", "/login");
    });

    it("shows the error state with a back-to-login link on failure", () => {
      render(<VerifyEmail />);
      act(() => {
        lastMutateOptions().onError();
      });
      expect(screen.getByRole("heading", { name: t.errorTitle })).toBeInTheDocument();
      expect(screen.getByText(t.errorSubtitle)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: t.loginNow })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: shared.backToLogin })).toHaveAttribute("href", "/login");
    });

    it("does not show the missing-token or verifying copy after success", () => {
      render(<VerifyEmail />);
      act(() => {
        lastMutateOptions().onSuccess();
      });
      expect(screen.queryByText(t.verifyingTitle)).not.toBeInTheDocument();
      expect(screen.queryByText(t.missingToken)).not.toBeInTheDocument();
    });
  });
});
