"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import {
  AuthDivider,
  AuthOAuthRow,
  AuthSubmitButton,
  AuthTextField,
} from "./auth-ui";
import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { handleFormApiError } from "@/lib/axios/form-error";
import { startFacebookOAuth, startGoogleOAuth } from "@/lib/oauth";
import { useAuthActions } from "@/lib/services/auth.service";
import { newPasswordError } from "@/lib/auth/password-policy";

export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const router = useRouter();
  const { register: t, shared } = useAuthCopy();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { register: registerMutation } = useAuthActions();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    registerMutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email.trim(),
        password: values.password,
      },
      {
        onSuccess: () => {
          router.push("/login");
        },
        onError: (error) => {
          handleFormApiError<RegisterFormValues>(
            error,
            form.setError,
            t.errorFallback,
          );
        },
      },
    );
  }

  const rootError = form.formState.errors.root?.serverError?.message;

  return (
    <div className="flex flex-col gap-7">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.heading}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <AuthTextField
            id="firstName"
            label={t.firstNameLabel}
            autoComplete="given-name"
            placeholder={t.firstNamePlaceholder}
            icon={<User className="size-4" aria-hidden />}
            error={form.formState.errors.firstName?.message}
            {...form.register("firstName")}
          />

          <AuthTextField
            id="lastName"
            label={t.lastNameLabel}
            autoComplete="family-name"
            placeholder={t.lastNamePlaceholder}
            error={form.formState.errors.lastName?.message}
            {...form.register("lastName")}
          />
        </div>

        <AuthTextField
          id="email"
          type="email"
          label={t.emailLabel}
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          icon={<Mail className="size-4" aria-hidden />}
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />

        <AuthTextField
          id="password"
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
          id="confirmPassword"
          type={showConfirm ? "text" : "password"}
          label={t.confirmPasswordLabel}
          autoComplete="new-password"
          placeholder={t.confirmPasswordPlaceholder}
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
          pending={registerMutation.isPending}
          pendingLabel={t.pendingLabel}
        >
          {t.submit}
        </AuthSubmitButton>

        {rootError ? (
          <p className="text-center text-xs text-red-500">{rootError}</p>
        ) : null}
      </form>

      <AuthDivider />
      <AuthOAuthRow
        onGoogle={startGoogleOAuth}
        onFacebook={startFacebookOAuth}
      />

      <p className="text-center text-sm text-muted-foreground">
        {t.haveAccount}{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          {t.signIn}
        </Link>
      </p>
    </div>
  );
}
