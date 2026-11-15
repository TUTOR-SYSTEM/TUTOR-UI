"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";

import { handleFormApiError } from "@/lib/axios/form-error";
import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { useAuthActions } from "@/lib/services/auth.service";
import { AuthSubmitButton, AuthTextField } from "./auth-ui";

type ForgotPasswordFormValues = {
  email: string;
};

const ForgotPass = () => {
  const { forgotPassword: t, shared } = useAuthCopy();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
  });

  const { forgotPassword: forgotPasswordMutation } = useAuthActions();

  const mutateOptions = {
    onSuccess: () => {
      setSentTo(form.getValues("email").trim());
    },
    onError: (error: Error) => {
      handleFormApiError<ForgotPasswordFormValues>(
        error,
        form.setError,
        t.errorFallback,
      );
    },
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.clearErrors();
    const values = form.getValues();
    forgotPasswordMutation.mutate(
      { email: values.email.trim() },
      mutateOptions,
    );
  };

  const rootError = form.formState.errors.root?.serverError?.message;

  if (sentTo) {
    return (
      <div className="flex flex-col gap-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="size-8" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t.sentTitle}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t.sentSubtitle}
            </p>
          </div>
        </div>

        <p className="rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
          {t.sentMessagePrefix}{" "}
          <span className="font-semibold text-foreground">{sentTo}</span>.{" "}
          {t.sentMessageSuffix}
        </p>

        <Link
          href={`/reset-password?email=${encodeURIComponent(sentTo)}`}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary-hover"
        >
          {t.enterCode}
        </Link>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              forgotPasswordMutation.mutate({ email: sentTo }, mutateOptions);
            }}
            disabled={forgotPasswordMutation.isPending}
            className="text-center text-sm font-medium text-primary transition-colors hover:text-primary-hover disabled:opacity-60"
          >
            {t.resend}
          </button>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {shared.backToLogin}
        </Link>
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

      <form
        onSubmit={handleSubmit}
        noValidate
        data-testid="forgot-pass-form"
        className="flex flex-col gap-4"
      >
        <AuthTextField
          id="forgot-email"
          type="email"
          label={t.emailLabel}
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          icon={<Mail className="size-4" aria-hidden />}
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />

        <AuthSubmitButton
          pending={forgotPasswordMutation.isPending}
          pendingLabel={t.pendingLabel}
        >
          {t.submit}
        </AuthSubmitButton>

        {rootError ? (
          <p className="text-center text-xs text-red-500">{rootError}</p>
        ) : null}
      </form>

      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Link
          href="/login"
          className="flex items-center gap-1.5 transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {shared.backToLogin}
        </Link>
      </div>
    </div>
  );
};

export default ForgotPass;
