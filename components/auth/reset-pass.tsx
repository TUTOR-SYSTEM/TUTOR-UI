"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

import { handleFormApiError } from "@/lib/axios/form-error";
import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { useAuthActions } from "@/lib/services/auth.service";
import { newPasswordError } from "@/lib/auth/password-policy";
import { AuthSubmitButton, AuthTextField } from "./auth-ui";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export const ResetPass = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword: t, shared } = useAuthCopy();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { resetPassword: resetMutation } = useAuthActions();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.clearErrors();

    const values = form.getValues();
    const passwordError = newPasswordError(values.password, {
      tooShort: shared.passwordTooShort,
      tooLong: shared.passwordTooLong,
    });
    if (passwordError) {
      form.setError("password", { message: passwordError });
      return;
    }
    if (values.password !== values.confirmPassword) {
      form.setError("confirmPassword", {
        message: t.passwordMismatch,
      });
      return;
    }

    resetMutation.mutate(
      {
        jti: token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      },
      {
        onSuccess: () => {
          setDone(true);
        },
        onError: (error) => {
          handleFormApiError<ResetPasswordFormValues>(
            error,
            form.setError,
            t.errorFallback,
          );
        },
      },
    );
  };

  const rootError =
    form.formState.errors.root?.message ??
    form.formState.errors.root?.serverError?.message;

  if (done) {
    return (
      <div className="flex flex-col items-center gap-7 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.successTitle}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t.successSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary-hover"
        >
          {t.loginNow}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.heading}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      {!token ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:bg-red-950">
          {t.missingToken}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <AuthTextField
          id="reset-password"
          type={showPassword ? "text" : "password"}
          label={t.passwordLabel}
          autoComplete="new-password"
          placeholder={t.passwordPlaceholder}
          icon={<Lock className="size-4" aria-hidden />}
          error={form.formState.errors.password?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? shared.hidePassword : shared.showPassword
              }
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          }
          {...form.register("password")}
        />

        <AuthTextField
          id="reset-confirm"
          type={showConfirm ? "text" : "password"}
          label={t.confirmLabel}
          autoComplete="new-password"
          placeholder={t.confirmPlaceholder}
          icon={<Lock className="size-4" aria-hidden />}
          error={form.formState.errors.confirmPassword?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={
                showConfirm ? shared.hidePassword : shared.showPassword
              }
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {showConfirm ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          }
          {...form.register("confirmPassword")}
        />

        <AuthSubmitButton
          pending={resetMutation.isPending}
          disabled={!token}
          pendingLabel={t.pendingLabel}
        >
          {t.submit}
        </AuthSubmitButton>

        {rootError ? (
          <p className="text-center text-xs text-red-500">{rootError}</p>
        ) : null}
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {shared.backToLogin}
      </Link>
    </div>
  );
};

export default ResetPass;
