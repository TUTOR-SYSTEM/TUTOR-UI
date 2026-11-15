"use client";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/axios";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUserActions } from "@/lib/services/user.service";
import { SectionHeading } from "@/components/ui/section-heading.ui";
import { Separator } from "@/components/ui/separator.ui";
import { SocialAccounts } from "@/components/settings/social-accounts";

/* ─── Change-password schema ─── */
// Mirrors gateway `changePasswordSchema`: the current password only needs to be non-empty
// (old passwords may predate the rules); the new one must match the full policy.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(8, "Tối thiểu 8 ký tự")
      .max(20, "Tối đa 20 ký tự")
      .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Phải có ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
      .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });


export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;


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
    resolver: zodResolver(changePasswordSchema),
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
          toast.success("Cập nhật mật khẩu thành công");
          reset();
        },
        onError: (err) => {
          const msg = getErrorMessage(err);
          const isCurrentPasswordError =
            msg.toLowerCase().includes("current") ||
            msg.toLowerCase().includes("hiện tại") ||
            msg.toLowerCase().includes("sai") ||
            msg.toLowerCase().includes("incorrect");
          if (isCurrentPasswordError) {
            setError("currentPassword", { message: msg });
          } else {
            toast.error(msg);
          }
        },
      },
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <SectionHeading>Đổi mật khẩu</SectionHeading>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <PasswordInput
              label="Mật khẩu hiện tại"
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              registration={register("currentPassword")}
              error={errors.currentPassword?.message}
            />
            <PasswordInput
              label="Mật khẩu mới"
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              registration={register("newPassword")}
              error={errors.newPassword?.message}
            />
            <PasswordInput
              label="Xác nhận mật khẩu mới"
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              registration={register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
            <p className="text-xs text-muted-foreground">
              Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số.
            </p>

            <div className="flex justify-end pt-2">
              <Button variant="ghost"
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-60"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </Button>
            </div>
          </form>
        </div>

        <div className="hidden self-stretch border-l border-border-light lg:block" />

        <div className="min-w-0 flex-1">
          <SectionHeading>Liên kết tài khoản mạng xã hội</SectionHeading>
          <SocialAccounts />
        </div>
      </div>

      <Separator className="my-6" />
      <SectionHeading>Phiên đăng nhập</SectionHeading>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            device: "Chrome · Windows 11",
            location: "TP. Hồ Chí Minh",
            time: "Đang hoạt động",
            current: true,
          },
          {
            device: "Safari · iPhone 14",
            location: "TP. Hồ Chí Minh",
            time: "2 giờ trước",
            current: false,
          },
          {
            device: "Firefox · MacOS",
            location: "Hà Nội",
            time: "Hôm qua",
            current: false,
          },
        ].map((s) => (
          <div
            key={s.device}
            className="flex items-center justify-between rounded-lg border border-border-light px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {s.device}
                {s.current && (
                  <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Hiện tại
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
                Đăng xuất
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="ghost"
        type="button"
        className="w-full rounded-lg border border-[#ef4444]/30 py-2 text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/5 transition-colors"
      >
        Đăng xuất khỏi tất cả thiết bị
      </Button>
    </div>
  );
}
