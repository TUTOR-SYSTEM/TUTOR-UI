"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { useAuth } from "@/components/providers/auth.provider";
import {
  CHANGE_PASSWORD_DEFAULTS,
  PasswordInput,
  createChangePasswordSchema,
  type ChangePasswordValues,
} from "@/components/settings/security-panel";
import { useChangePasswordCopy } from "@/hooks/useChangePasswordCopy.hook";
import { useCurrentUserRoleOrNull } from "@/hooks/useCurrentUserRole";
import { getErrorMessage } from "@/lib/axios";
import { applyApiFieldErrors } from "@/lib/axios/form-error";
import { ROLE_HOME } from "@/lib/rbac/roles";
import { useUserActions } from "@/lib/services/user.service";
import { useAuthStore } from "@/zustand/auth.store";

/** Schema đổi mật khẩu bắt buộc: quy tắc như màn Cài đặt, thêm "mật khẩu mới ≠ mật khẩu cũ". */
export function createMustChangePasswordSchema(
  validation: Parameters<typeof createChangePasswordSchema>[0] & { sameAsCurrent: string },
) {
  return createChangePasswordSchema(validation).refine(
    (d) => d.newPassword !== d.currentPassword,
    { message: validation.sameAsCurrent, path: ["newPassword"] },
  );
}

/** Form đổi mật khẩu bắt buộc (lần đăng nhập đầu / sau khi admin đặt lại). */
export function ChangePasswordForm() {
  const copy = useChangePasswordCopy();
  const router = useRouter();
  const { user } = useAuth();
  const role = useCurrentUserRoleOrNull();
  const setUser = useAuthStore((s) => s.setUser);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Cùng quy tắc với gateway: 8–20 ký tự + đủ 4 nhóm; thêm kiểm tra mật khẩu mới ≠ mật khẩu cũ.
  const schema = useMemo(() => createMustChangePasswordSchema(copy.validation), [copy.validation]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: CHANGE_PASSWORD_DEFAULTS,
  });

  const { mutate, isPending } = useUserActions().changePassword;

  const onSubmit = (values: ChangePasswordValues) =>
    mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success(copy.success);
          if (user) setUser({ ...user, mustChangePassword: false });
          if (role) router.replace(ROLE_HOME[role]);
        },
        onError: (err) => {
          if (applyApiFieldErrors(err, setError, ["currentPassword", "newPassword"])) {
            return;
          }
          toast.error(getErrorMessage(err));
        },
      },
    );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <PasswordInput
          label={copy.currentPassword}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          registration={register("currentPassword")}
          error={errors.currentPassword?.message}
        />
        <PasswordInput
          label={copy.newPassword}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          registration={register("newPassword")}
          error={errors.newPassword?.message}
        />
        <PasswordInput
          label={copy.confirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        <p className="text-xs text-muted-foreground">{copy.passwordHint}</p>

        <Button type="submit" loading={isPending} disabled={isPending} className="w-full">
          {isPending ? copy.submitting : copy.submit}
        </Button>
      </form>
    </div>
  );
}
