"use client";

import { forwardRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Lock,
  Quote,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { FacebookBrandIcon, GoogleBrandIcon } from "./oauth-brand-icons";
import { LanguageToggle } from "./language-toggle";

function AuthHeroPanel() {
  const { hero } = useAuthCopy();

  return (
    <div
      className="relative hidden w-[44%] flex-col overflow-hidden p-10 text-white lg:flex xl:w-[42%]"
      style={{
        background:
          "linear-gradient(160deg, rgb(15, 61, 55) 0%, rgb(14, 159, 142) 130%)",
      }}
    >
      {/* Decorative background circles */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full border border-white/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-32 size-64 rounded-full border border-white/5"
        aria-hidden
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-white dark:bg-card font-black text-lg text-[#0d3d2f]">
          G
        </div>
        <div>
          <div className="text-base font-bold leading-none">{hero.brand}</div>
          <div className="mt-0.5 text-xs text-white/60">{hero.tagline}</div>
        </div>
      </div>

      {/* Center badge */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-52 rounded-full border border-white/10" />
          <div className="absolute size-36 rounded-full border border-white/15" />
          <div className="flex size-20 items-center justify-center rounded-2xl bg-amber-400 shadow-2xl">
            <GraduationCap className="size-10 text-white" aria-hidden />
          </div>
        </div>
      </div>

      {/* Hero text + stats + testimonial */}
      <div className="relative z-10">
        <h1 className="text-3xl text-white  font-extrabold leading-tight">
          {hero.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          {hero.description}
        </p>

        <div className="mt-6 flex gap-8 border-t border-white/15 pt-5">
          <div>
            <div className="text-xl font-bold">2.400+</div>
            <div className="text-xs text-white/55">{hero.statsTutors}</div>
          </div>
          <div>
            <div className="text-xl font-bold">18.000+</div>
            <div className="text-xs text-white/55">{hero.statsSessions}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xl font-bold">
              4.9
              <Star
                className="size-4 fill-amber-400 text-amber-400"
                aria-hidden
              />
            </div>
            <div className="text-xs text-white/55">{hero.statsRating}</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/10 p-4">
          <Quote className="mb-2 size-4 text-white/35" aria-hidden />
          <p className="text-sm italic text-white/85">{hero.quote}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white">
              L
            </div>
            <div>
              <div className="text-sm font-semibold">{hero.quoteName}</div>
              <div className="text-xs text-white/55">{hero.quoteRole}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type AuthScreenProps = {
  children: ReactNode;
  topRight?: ReactNode;
};

export function AuthScreen({ children, topRight }: AuthScreenProps) {
  const { shared } = useAuthCopy();

  return (
    <div className="flex min-h-screen">
      <AuthHeroPanel />

      {/* Right form panel */}
      <div className="flex flex-1 flex-col bg-surface-container-low dark:bg-background">
        {/* Top bar */}
        <div className="flex min-h-[64px] items-center justify-between px-8 py-4">
          <LanguageToggle />
          <div>{topRight}</div>
        </div>

        {/* Centered form area */}
        <div className="flex flex-1 items-center justify-center px-6 pb-8 pt-2">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 text-center text-xs text-muted-foreground">
          {shared.footer}
        </div>
      </div>
    </div>
  );
}

/* ─── Legacy card shell (kept for OTP / OAuth callback pages) ─────────────── */

type AuthCardShellProps = {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  showBadge?: boolean;
  centered?: boolean;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  className?: string;
};

export function AuthCardShell({
  icon,
  title,
  subtitle,
  badge,
  showBadge = true,
  centered = false,
  backHref,
  backLabel,
  children,
  className,
}: AuthCardShellProps) {
  const { shared } = useAuthCopy();
  const resolvedBackLabel = backLabel ?? shared.back;

  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-106 overflow-hidden rounded-3xl border border-border bg-card shadow-lg",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-linear-to-br from-primary to-primary-hover px-7 pb-6 text-white",
          backHref ? "pt-5" : "pt-7",
        )}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full border border-white/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-2 top-6 size-28 rounded-full border border-white/10"
          aria-hidden
        />

        {backHref ? (
          <Link
            href={backHref}
            aria-label={resolvedBackLabel}
            className="relative z-10 -ml-1 mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {resolvedBackLabel}
          </Link>
        ) : null}

        <div
          className={cn(
            "relative",
            centered
              ? "flex flex-col items-center text-center"
              : "flex items-center gap-3",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur",
              centered ? "mb-3 size-14" : "size-11",
            )}
          >
            {icon}
          </div>

          <div>
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            {subtitle ? (
              <p
                className={cn(
                  "text-sm text-white/80",
                  centered ? "mt-1 max-w-[20rem]" : "",
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {showBadge ? (
          <div
            className={cn(
              "relative mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15",
              centered ? "mx-auto" : "",
            )}
          >
            {badge}
          </div>
        ) : null}
      </div>

      <div className="p-4">{children}</div>
    </div>
  );
}

/* ─── Shared form primitives ──────────────────────────────────────────────── */

type AuthTextFieldProps = ComponentProps<"input"> & {
  label: ReactNode;
  icon?: ReactNode;
  error?: string;
  endAdornment?: ReactNode;
  labelEnd?: ReactNode;
};

export const AuthTextField = forwardRef<HTMLInputElement, AuthTextFieldProps>(
  (
    { label, icon, error, endAdornment, labelEnd, className, id, ...props },
    ref,
  ) => {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-semibold text-foreground">
            {label}
          </label>
          {labelEnd}
        </div>

        <div className="relative">
          {icon ? (
            <span
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            >
              {icon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={id}
            className={cn(
              "h-12 w-full rounded-xl border bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-card",
              icon ? "pl-11" : "",
              endAdornment ? "pr-11" : "",
              error ? "border-red-400" : "border-input",
              className,
            )}
            {...props}
          />

          {endAdornment ? (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {endAdornment}
            </div>
          ) : null}
        </div>

        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  },
);

AuthTextField.displayName = "AuthTextField";

type AuthSubmitButtonProps = ComponentProps<"button"> & {
  pending?: boolean;
  pendingLabel?: string;
  withArrow?: boolean;
};

export function AuthSubmitButton({
  pending,
  pendingLabel,
  withArrow = true,
  children,
  className,
  disabled,
  ...props
}: AuthSubmitButtonProps) {
  const { shared } = useAuthCopy();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {pending ? (
        (pendingLabel ?? shared.processing)
      ) : (
        <>
          {children}
          {withArrow ? <ArrowRight className="size-4" aria-hidden /> : null}
        </>
      )}
    </button>
  );
}

export function AuthEncryptedNote({ children }: { children?: ReactNode }) {
  const { shared } = useAuthCopy();

  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="size-3.5" aria-hidden />
      {children ?? shared.encryptedNote}
    </p>
  );
}

export function AuthDivider({ children }: { children?: ReactNode }) {
  const { shared } = useAuthCopy();

  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-muted-foreground">
        {children ?? shared.continueWith}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function AuthOAuthRow({ onGoogle, onFacebook }: { onGoogle?: () => void; onFacebook?: () => void }) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onGoogle}
        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-input bg-white text-sm font-medium text-foreground transition hover:bg-muted dark:bg-card"
      >
        <GoogleBrandIcon className="size-5" />
        Google
      </button>

      <button
        type="button"
        onClick={onFacebook}
        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-input bg-white text-sm font-medium text-foreground transition hover:bg-muted dark:bg-card"
      >
        <FacebookBrandIcon className="size-5" />
        Facebook
      </button>
    </div>
  );
}
