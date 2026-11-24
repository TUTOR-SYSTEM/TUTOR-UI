"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

import { OtpInput } from "@/components/ui/otp-input.ui";
import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { useAuthActions } from "@/lib/services/auth.service";
import { getErrorMessage } from "@/lib/axios";
import { saveResetSession } from "@/lib/auth/reset-session";
import {
  OTP_LENGTH,
  OTP_RESEND_COOLDOWN_SECONDS,
  isCompleteOtp,
} from "@/lib/auth/otp";
import { AuthSubmitButton, AuthTextField } from "./auth-ui";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Bước 1 của đặt lại mật khẩu: nhập mã 6 số trong email, rồi chuyển sang /reset-password.
 * BE chưa có endpoint kiểm mã riêng — mã được BE xác thực khi gửi mật khẩu mới ở bước 2.
 */
export const VerifyOtp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp: t, shared } = useAuthCopy();
  const { forgotPassword } = useAuthActions();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const validEmail = () => {
    if (EMAIL_PATTERN.test(email.trim())) return true;
    setEmailError(shared.requiredField);
    return false;
  };

  const handleResend = () => {
    setNotice(null);
    setRootError(null);
    if (!validEmail()) return;
    forgotPassword.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
          setOtp("");
          setNotice(t.codeResent);
        },
        onError: (error) =>
          setRootError(getErrorMessage(error, t.errorFallback)),
      },
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError(null);
    setOtpError(null);
    setNotice(null);
    let valid = validEmail();
    if (!isCompleteOtp(otp)) {
      setOtpError(t.otpIncomplete);
      valid = false;
    }
    if (!valid) return;
    saveResetSession({ email: email.trim(), otp });
    router.push("/reset-password");
  };

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.heading}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <AuthTextField
          id="verify-email"
          type="email"
          label={t.emailLabel}
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          icon={<Mail className="size-4" aria-hidden />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError ?? undefined}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {t.otpLabel}
          </span>
          <OtpInput
            length={OTP_LENGTH}
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setOtpError(null);
            }}
            aria-label={t.otpLabel}
          />
          {otpError ? (
            <p className="text-xs text-red-500">{otpError}</p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden />
              {t.otpHint}
            </p>
          )}
        </div>

        <AuthSubmitButton pending={false} pendingLabel={t.submit}>
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
          disabled={cooldown > 0 || forgotPassword.isPending}
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

export default VerifyOtp;
