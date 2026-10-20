"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Users,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth.provider";
import { useAuthCopy } from "@/hooks/useAuthCopy.hook";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { handleFormApiError } from "@/lib/axios/form-error";
import { useAuthActions } from "@/lib/services/auth.service";
import { loginPasswordError } from "@/lib/auth/password-policy";
import { startFacebookOAuth, startGoogleOAuth } from "@/lib/oauth";
import {
  AuthTextField,
  AuthSubmitButton,
  AuthDivider,
  AuthOAuthRow,
} from "./auth-ui";
import { LoginFormValues, LoginResponse, Role } from "@/types/auth.types";

function pickAccessToken(data: LoginResponse): string | undefined {
  return data.accessToken ?? data.access_token ?? data.token;
}

export const LoginForm = ({ className, ...props }: ComponentProps<"div">) => {
  const router = useRouter();
  const { isAuthenticated, startSession } = useAuth();
  const { login: t, shared } = useAuthCopy();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("admin");

  const roles: {
    key: Role;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "admin", label: t.roleAdmin, icon: GraduationCap },
    { key: "student", label: t.roleStudent, icon: User },
    { key: "parent", label: t.roleParent, icon: Users },
  ];

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      identifier: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const { login: loginMutation } = useAuthActions();

  const handleLoginSuccess = (raw: unknown) => {
    const payload = unwrapApiData<LoginResponse>(raw);
    const token = pickAccessToken(payload);
    if (!token) {
      // Without an access token the session can't be established; don't pretend it worked.
      toast.error(t.errorFallback);
      return;
    }
    // Refresh token nằm trong cookie httpOnly do gateway set; FE chỉ giữ access token.
    startSession(token);
    router.replace("/");
  };

  const handleLoginError = (error: Error) => {
    handleFormApiError<LoginFormValues>(error, form.setError, t.errorFallback);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.clearErrors();
    const values = form.getValues();
    const password = values.password;

    const passwordError = loginPasswordError(password, {
      required: shared.requiredField,
      tooLong: shared.passwordTooLong,
    });
    if (passwordError) {
      form.setError("password", { message: passwordError });
      return;
    }

    const mutateOptions = {
      onSuccess: handleLoginSuccess,
      onError: handleLoginError,
    };

    if (role === "admin") {
      const email = values.email?.trim() ?? "";
      if (!email) {
        form.setError("email", { message: shared.requiredField });
        return;
      }
      loginMutation.mutate({ email, password }, mutateOptions);
      return;
    }

    // Học sinh / Phụ huynh: chấp nhận cả mã người dùng lẫn email (nếu có).
    const identifier = values.identifier?.trim() ?? "";
    if (!identifier) {
      form.setError("identifier", { message: shared.requiredField });
      return;
    }
    if (identifier.includes("@")) {
      loginMutation.mutate({ email: identifier, password }, mutateOptions);
    } else {
      loginMutation.mutate(
        {
          userCode: identifier,
          password,
          role: role === "student" ? "STUDENT" : "PARENT",
        },
        mutateOptions,
      );
    }
  };

  const activeRole = roles.find((r) => r.key === role)!;

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.heading}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      {/* Role tabs */}
      <div className="flex rounded-2xl bg-muted p-1">
        {roles.map((r) => {
          const Icon = r.icon;
          const active = role === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition",
                active
                  ? "bg-white text-primary shadow-sm dark:bg-card"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {role === "admin" ? (
          <AuthTextField
            id="email"
            label={t.emailLabel}
            type="email"
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            icon={<Mail className="size-4" />}
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
        ) : (
          <AuthTextField
            id="identifier"
            label={t.identifierLabel}
            type="text"
            autoComplete="username"
            placeholder={t.identifierPlaceholder}
            icon={<activeRole.icon className="size-4" />}
            error={
              form.formState.errors.identifier?.message ??
              form.formState.errors.email?.message
            }
            {...form.register("identifier")}
          />
        )}

        <AuthTextField
          id="password"
          label={t.passwordLabel}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder={t.passwordPlaceholder}
          icon={<Lock className="size-4" />}
          labelEnd={
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary transition hover:text-primary-hover"
            >
              {t.forgotPassword}
            </Link>
          }
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? shared.hidePassword : shared.showPassword
              }
              className="text-muted-foreground transition hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          }
          error={form.formState.errors.password?.message}
          data-testid="login-password-input"
          {...form.register("password")}
        />

        <AuthSubmitButton pending={loginMutation.isPending}>
          {t.submit}
        </AuthSubmitButton>

        {form.formState.errors.root?.serverError?.message ? (
          <p className="text-center text-xs text-red-500">
            {form.formState.errors.root.serverError.message}
          </p>
        ) : null}
      </form>

      <AuthDivider />
      <AuthOAuthRow
        onGoogle={startGoogleOAuth}
        onFacebook={startFacebookOAuth}
      />
    </div>
  );
};

export default LoginForm;
