"use client";

import { useSettingsCopy } from "@/hooks/useSettingsCopy.hook";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/axios";
import { applyApiFieldErrors } from "@/lib/axios/form-error";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUserActions } from "@/lib/services/user.service";
import { SectionHeading } from "@/components/ui/section-heading.ui";
import { Separator } from "@/components/ui/separator.ui";
import { SocialAccounts } from "@/components/settings/social-accounts";
import type { SettingsDictionary } from "@/lib/i18n/settings.dictionary";

/* ─── Change-password schema ─── */
// Mirrors gateway `changePasswordSchema`: the current password only needs to be non-empty
// (old passwords may predate the rules); the new one must match the full policy.
// Built from a copy so validation messages follow the active language.
export function createChangePasswordSchema(v: SettingsDictionary["security"]["validation"]) {
  return z
    .object({
      currentPassword: z.string().min(1, v.currentRequired),
      newPassword: z
        .string()
        .min(8, v.min)
        .max(20, v.max)
        .regex(/[A-Z]/, v.upper)
        .regex(/[a-z]/, v.lower)
        .regex(/[0-9]/, v.digit)
        .regex(/[^A-Za-z0-9]/, v.special),
      confirmPassword: z.string().min(1, v.confirmRequired),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: v.mismatch,
      path: ["confirmPassword"],
    });
}


export type ChangePasswordValues = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>;


export const CHANGE_PASSWORD_DEFAULTS: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};


export function PasswordInput({
  label,
  show,
  onToggle,
  registration,
  error,
}: {
  label: string;
  show: boolean;
  onToggle: () => void;
  registration?: ReturnType<UseFormRegister<ChangePasswordValues>>;
  error?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          {...registration}
          type={show ? "text" : "password"}
          className={`h-10 w-full rounded-lg border bg-card px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 transition-colors ${
            error
              ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20"
              : "border-border focus:border-primary focus:ring-primary/20"
          }`}
        />
        <Button variant="ghost"
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}


export function SecurityPanel() {
  const { security: copy } = useSettingsCopy();
  const schema = useMemo(
    () => createChangePasswordSchema(copy.validation),
    [copy.validation],
  );
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: CHANGE_PASSWORD_DEFAULTS,
  });

  const { mutate, isPending } = useUserActions().changePassword;

  const onSubmit = (values: ChangePasswordValues) =>
    mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success(copy.updateSuccess);
          reset();
        },
        onError: (err) => {
          // 422 → gạch chân đúng ô theo errors[]; mọi mã khác (400, 401, 5xx...) → toast.
          if (
            applyApiFieldErrors(err, setError, [
              "currentPassword",
              "newPassword",
            ])
          ) {
            return;
          }
          toast.error(getErrorMessage(err));
        },
      },
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <SectionHeading>{copy.changePasswordTitle}</SectionHeading>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
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
            <p className="text-xs text-muted-foreground">
              {copy.passwordHint}
            </p>

            <div className="flex justify-end pt-2">
              <Button variant="ghost"
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-60"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? copy.updatingPassword : copy.updatePassword}
              </Button>
            </div>
          </form>
        </div>

        <div className="hidden self-stretch border-l border-border-light lg:block" />

        <div className="min-w-0 flex-1">
          <SectionHeading>{copy.socialTitle}</SectionHeading>
          <SocialAccounts />
        </div>
      </div>

      <Separator className="my-6" />
      <SectionHeading>{copy.sessionsTitle}</SectionHeading>

      <div className="grid grid-cols-2 gap-3">
        {copy.sessions.map((s) => (
          <div
            key={s.device}
            className="flex items-center justify-between rounded-lg border border-border-light px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {s.device}
                {s.current && (
                  <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {copy.currentBadge}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {s.location} · {s.time}
              </p>
            </div>
            {!s.current && (
              <Button variant="ghost"
                type="button"
                className="text-xs font-medium text-[#ef4444] hover:underline"
              >
                {copy.signOut}
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="ghost"
        type="button"
        className="w-full rounded-lg border border-[#ef4444]/30 py-2 text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/5 transition-colors"
      >
        {copy.signOutAll}
      </Button>
    </div>
  );
}
