"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Save } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { usePut } from "@/lib/axios/query";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { ROLE_OPTIONS } from "./role-options";
import type {
  ApiManagedUser,
  ManagedUserRole,
  UpdateManagedUserPayload,
} from "@/types";

export type ManagedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: ManagedUserRole;
  isActive: boolean;
  createdAt: string;
};

type Props = {
  user: ManagedUser | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  role: ManagedUserRole;
};

function getDefaultValues(user: ManagedUser): FormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
  };
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function EditUserDialog({ user, onClose, onSaved }: Props) {
  const open = user !== null;
  const [prevUserId, setPrevUserId] = useState<string | null>(user?.id ?? null);
  const [values, setValues] = useState<FormValues>(
    user
      ? getDefaultValues(user)
      : { firstName: "", lastName: "", phone: "", role: "TUTOR" },
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  /* re-fill form whenever a different user is opened (render-time sync, no effect) */
  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setValues(getDefaultValues(user));
  }

  // The id goes in the URL only: gateway `PUT /users/:id` (`updateUserSchema`, strict) rejects
  // unknown keys, so the body is exactly the editable fields. The URL is re-resolved from the
  // current `user` on each render, and the dialog only submits while a user is open.
  const userId = user?.id ?? "";
  const updateUser = usePut<ApiManagedUser, UpdateManagedUserPayload>(
    () => `/users/${userId}`,
  );

  const handleClose = () => {
    if (updateUser.isPending) return;
    onClose();
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.firstName.trim()) next.firstName = "Vui lòng nhập họ";
    else if (values.firstName.trim().length < 2)
      next.firstName = "Họ phải có ít nhất 2 ký tự";
    if (!values.lastName.trim()) next.lastName = "Vui lòng nhập tên";
    else if (values.lastName.trim().length < 2)
      next.lastName = "Tên phải có ít nhất 2 ký tự";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!user || !validate()) return;

    updateUser.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim() || undefined,
        role: values.role,
      },
      {
        onSuccess: (raw) => {
          unwrapApiData(raw);
          toast.success("Cập nhật người dùng thành công!");
          onSaved();
          onClose();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Cập nhật thất bại"));
        },
      },
    );
  };

  const isPending = updateUser.isPending;

  return (
    <Dialog
      isOpen={open}
      icon={Pencil}
      title="Chỉnh sửa người dùng"
      subtitle="Cập nhật thông tin và vai trò tài khoản."
      className="max-w-lg"
      cancelText="Hủy"
      onCancel={handleClose}
      submitText="Lưu thay đổi"
      submitIcon={Save}
      onSubmit={handleSubmit}
      loading={isPending}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Họ" required error={errors.firstName}>
            <Input
              value={values.firstName}
              onChange={(e) =>
                setValues((v) => ({ ...v, firstName: e.target.value }))
              }
              autoFocus
              invalid={!!errors.firstName}
              disabled={isPending}
            />
          </Field>

          <Field label="Tên" required error={errors.lastName}>
            <Input
              value={values.lastName}
              onChange={(e) =>
                setValues((v) => ({ ...v, lastName: e.target.value }))
              }
              invalid={!!errors.lastName}
              disabled={isPending}
            />
          </Field>
        </div>

        <Field label="Email">
          <Input value={user?.email ?? ""} disabled readOnly />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số điện thoại" error={errors.phone}>
            <Input
              value={values.phone}
              onChange={(e) =>
                setValues((v) => ({ ...v, phone: e.target.value }))
              }
              type="tel"
              disabled={isPending}
            />
          </Field>

          <Field label="Vai trò" required>
            <Select
              options={ROLE_OPTIONS}
              value={values.role}
              onValueChange={(v) =>
                setValues((s) => ({ ...s, role: v as ManagedUserRole }))
              }
              disabled={isPending}
            />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
