"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { handleFormApiError } from "@/lib/axios/form-error";
import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { useAuthActions } from "@/lib/services/auth.service";
import { newPasswordError } from "@/lib/auth/password-policy";
import {
  OTP_LENGTH,
  OTP_RESEND_COOLDOWN_SECONDS,
  isCompleteOtp,
} from "@/lib/auth/otp";
import { AuthSubmitButton, AuthTextField } from "./auth-ui";

type ResetPasswordFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ResetPass = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword: t, shared } = useAuthCopy();
  // The forgot-password page passes the address along, so the user only enters the code.
  const initialEmail = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [otpError, setOtpError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: { email: initialEmail, password: "", confirmPassword: "" },
  });

  const { resetPassword: resetMutation, forgotPassword: forgotMutation } =
    useAuthActions();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const code = digits.join("");

  const focusBox = (index: number) => {
    inputRefs.current[Math.min(Math.max(index, 0), OTP_LENGTH - 1)]?.focus();
  };

  const setDigitAt = (index: number, value: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  /** Writes a run of digits starting at `start` (used for pasting a whole code). */
  const fillFrom = (start: number, raw: string) => {
    const chars = raw.replace(/\D/g, "").split("");
    if (chars.length === 0) return;
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((char, offset) => {
        if (start + offset < OTP_LENGTH) next[start + offset] = char;
      });
      return next;
    });
    setOtpError(null);
    focusBox(Math.min(start + chars.length, OTP_LENGTH - 1));
  };

  const handleBoxChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    setOtpError(null);
    if (typed.length === 0) {
      setDigitAt(index, "");
      return;
    }
    if (typed.length === 1 || digits[index] !== "") {
      // Typing over a filled box: the newest digit is the last one.
      setDigitAt(index, typed.slice(-1));
      focusBox(index + 1);
      return;
    }
    fillFrom(index, typed);
  };

  const handleBoxKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      event.preventDefault();
      setDigitAt(index - 1, "");
      focusBox(index - 1);
    }
    if (event.key === "ArrowLeft") focusBox(index - 1);
    if (event.key === "ArrowRight") focusBox(index + 1);
  };

  const handleBoxPaste = (
    index: number,
    event: ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    fillFrom(index, event.clipboardData.getData("text"));
  };

  const clearCode = () => {
    setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
    focusBox(0);
  };

  const handleResend = () => {
    const email = form.getValues("email").trim();
    if (!EMAIL_PATTERN.test(email)) {
      form.setError("email", { message: shared.requiredField });
      return;
    }
    setNotice(null);
    forgotMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
          clearCode();
          setNotice(t.codeResent);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.clearErrors();
    setNotice(null);

    const values = form.getValues();
    const email = values.email.trim();
    let valid = true;

    if (!EMAIL_PATTERN.test(email)) {
      form.setError("email", { message: shared.requiredField });
      valid = false;
    }
    if (!isCompleteOtp(code)) {
      setOtpError(t.otpIncomplete);
      valid = false;
    }
    const passwordError = newPasswordError(values.password, {
      tooShort: shared.passwordTooShort,
      tooLong: shared.passwordTooLong,
      complexity: shared.passwordComplexity,
    });
    if (passwordError) {
      form.setError("password", { message: passwordError });
      valid = false;
    }
    if (values.password !== values.confirmPassword) {
      form.setError("confirmPassword", { message: t.passwordMismatch });
      valid = false;
    }
    if (!valid) return;

    resetMutation.mutate(
      {
        email,
        otp: code,
        password: values.password,
        confirmPassword: values.confirmPassword,
      },
      {
        onSuccess: () => {
          setDone(true);
        },
        onError: (error) => {
          // A wrong or expired code cannot be retried with the same digits: clear them.
          clearCode();
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

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <AuthTextField
          id="reset-email"
          type="email"
          label={t.emailLabel}
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          icon={<Mail className="size-4" aria-hidden />}
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />

        {/* One-time code: a box per digit, paste-friendly, one-time-code autofill on iOS/Android */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {t.otpLabel}
          </span>
          <div
            className="flex items-center justify-between gap-2"
            data-testid="otp-boxes"
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                id={`reset-otp-${index}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`${t.otpAriaLabel} ${index + 1}`}
                value={digit}
                onChange={(event) => handleBoxChange(index, event.target.value)}
                onKeyDown={(event) => handleBoxKeyDown(index, event)}
                onPaste={(event) => handleBoxPaste(index, event)}
                onFocus={(event) => event.target.select()}
                className={cn(
                  "h-14 w-full min-w-0 rounded-xl border bg-card text-center text-2xl font-bold text-foreground outline-none transition",
                  "focus:border-primary focus:ring-2 focus:ring-primary/30",
                  digit ? "border-primary/60" : "border-input",
                  otpError && "border-red-400",
                )}
              />
            ))}
          </div>
          {otpError ? (
            <p className="text-xs text-red-500">{otpError}</p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden />
              {t.otpHint}
            </p>
          )}
        </div>

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
          pendingLabel={t.pendingLabel}
        >
          {t.submit}
        </AuthSubmitButton>

        {notice ? (
          <p className="rounded-xl bg-primary/10 px-4 py-2.5 text-center text-xs font-medium text-primary">
            {notice}
          </p>
        ) : null}

        {rootError ? (
          <p className="text-center text-xs text-red-500">{rootError}</p>
        ) : null}
      </form>

      <div className="flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || forgotMutation.isPending}
          className="font-medium text-primary transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          {cooldown > 0
            ? t.resendIn.replace("{s}", String(cooldown))
            : t.resendCode}
        </button>
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {shared.backToLogin}
        </Link>
      </div>
    </div>
  );
};

export default ResetPass;
