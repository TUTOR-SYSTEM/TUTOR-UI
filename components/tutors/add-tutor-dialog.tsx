"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { cn } from "@/lib/utils";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import { useCreateTutor } from "@/hooks/useAdminUsers.hook";
import { SUBJECT_OPTIONS } from "@/lib/subjects";
import type { AdminGender, CreateAdminUserPayload } from "@/types";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  subjects: string[];
  school: string;
  gender: AdminGender;
};

const DEFAULT_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  subjects: [],
  school: "",
  gender: "MALE",
};

const GENDER_OPTIONS = [
  { label: "Nam", value: "MALE" },
  { label: "Nữ", value: "FEMALE" },
  { label: "Khác", value: "OTHER" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after a tutor is created successfully — parent should refetch the list. */
  onCreated?: () => void;
};

function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function AddTutorDialog({ open, onClose, onCreated }: Props) {
  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  const createTutor = useCreateTutor();

  const onSubmit = (values: FormValues) => {
    const payload: CreateAdminUserPayload = {
      email: values.email.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      password: values.password,
      phone: values.phone.trim() || undefined,
      subjects: values.subjects.length ? values.subjects : undefined,
      school: values.school.trim() || undefined,
      gender: values.gender,
    };

    createTutor.mutate(payload, {
      onSuccess: (raw) => {
        unwrapApiData(raw);
        toast.success("Thêm gia sư thành công!");
        onCreated?.();
        onClose();
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Thêm gia sư thất bại"));
      },
    });
  };

  return (
    <Dialog
      isOpen={open}
      icon={UserPlus}
      title="Thêm gia sư mới"
      subtitle="Tạo tài khoản vai trò gia sư (TUTOR)."
      className="max-w-2xl"
      cancelText="Hủy"
      onCancel={onClose}
      submitText="Lưu gia sư"
      submitIcon={Check}
      onSubmit={handleSubmit(onSubmit)}
      loading={createTutor.isPending}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field label="Họ" required>
          <Input {...register("lastName")} placeholder="VD: Trần" autoFocus />
        </Field>

        <Field label="Tên" required>
          <Input {...register("firstName")} placeholder="VD: Văn Khoa" />
        </Field>

        <Field label="Email" required>
          <Input
            {...register("email")}
            type="email"
            placeholder="VD: giasu@example.com"
          />
        </Field>

        <Field
          label="Mật khẩu"
          required
          hint="8–20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
        >
          <Input
            {...register("password")}
            type="password"
            placeholder="••••••••"
          />
        </Field>

        <Field label="Số điện thoại">
          <Input
            {...register("phone")}
            type="tel"
            placeholder="VD: 0901 234 567"
          />
        </Field>

        <Field label="Giới tính">
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={cn(
                        "h-11 rounded-md border text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-surface-container-lowest text-foreground hover:border-primary/40",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>

        <Field
          label="Môn dạy"
          hint="Chọn một hoặc nhiều môn."
          className="sm:col-span-2"
        >
          <Controller
            name="subjects"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = field.value.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((s) => s !== subject)
                            : [...field.value, subject],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-surface-container-lowest text-foreground hover:border-primary/40",
                      )}
                    >
                      {subject}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>

        <Field label="Trường / Nơi công tác" className="sm:col-span-2">
          <Input {...register("school")} placeholder="VD: THPT Quang Trung" />
        </Field>
      </form>
    </Dialog>
  );
}
