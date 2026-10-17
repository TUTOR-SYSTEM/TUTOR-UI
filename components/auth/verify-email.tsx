"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { useAuthActions } from "@/lib/services/auth.service";

type VerifyStatus = "verifying" | "success" | "error" | "missing";

export const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const { verifyEmail: t, shared } = useAuthCopy();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<VerifyStatus>(() =>
    token ? "verifying" : "missing",
  );

  const { verifyEmail: verifyMutation } = useAuthActions();
  const { mutate } = verifyMutation;

  // Guards against double-calls from React StrictMode's dev-only effect replay.
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) {
      return;
    }
    calledRef.current = true;

    mutate(
      { jti: token },
      {
        onSuccess: () => {
          setStatus("success");
        },
        onError: () => {
          setStatus("error");
        },
      },
    );
  }, [token, mutate]);

  if (status === "success") {
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
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary-hover"
        >
          {t.loginNow}
        </Link>
      </div>
    );
  }

  if (status === "error" || status === "missing") {
    return (
      <div className="flex flex-col items-center gap-7 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950">
          <XCircle className="size-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {status === "missing" ? t.heading : t.errorTitle}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {status === "missing" ? t.missingToken : t.errorSubtitle}
          </p>
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
    <div className="flex flex-col items-center gap-7 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Loader2 className="size-8 animate-spin" aria-hidden />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.verifyingTitle}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t.verifyingSubtitle}
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
