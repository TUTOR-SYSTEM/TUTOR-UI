"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { usePost } from "@/lib/axios/query";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { ROLE_OPTIONS } from "./role-options";
import type {
  ApiManagedUser,
  CreateManagedUserPayload,
  ManagedUserRole,
} from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: ManagedUserRole;
};

const EMPTY_FORM: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "TUTOR",
};

/* Gateway `createUserSchema`: names min 2, password 8–20 characters. */
const NAME_MIN_LENGTH = 2;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;

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

export function CreateUserDialog({ open, onClose, onCreated }: Props) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  const createUser = usePost<ApiManagedUser, CreateManagedUserPayload>(
    "/users",
  );

  const handleClose = () => {
    if (createUser.isPending) return;
    setValues(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.firstName.trim()) next.firstName = "Vui lòng nhập họ";
    else if (values.firstName.trim().length < NAME_MIN_LENGTH)
      next.firstName = `Họ phải có ít nhất ${NAME_MIN_LENGTH} ký tự`;
    if (!values.lastName.trim()) next.lastName = "Vui lòng nhập tên";
    else if (values.lastName.trim().length < NAME_MIN_LENGTH)
      next.lastName = `Tên phải có ít nhất ${NAME_MIN_LENGTH} ký tự`;
    if (!values.email.trim()) next.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "Email không hợp lệ";
    if (!values.password) next.password = "Vui lòng nhập mật khẩu";
    else if (values.password.length < PASSWORD_MIN_LENGTH)
      next.password = `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`;
    else if (values.password.length > PASSWORD_MAX_LENGTH)
      next.password = `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload: CreateManagedUserPayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
      role: values.role,
      password: values.password,
    };

    createUser.mutate(payload, {
      onSuccess: (raw) => {
        unwrapApiData(raw);
        toast.success("Tạo người dùng thành công!");
        setValues(EMPTY_FORM);
        setErrors({});
        onCreated();
        onClose();
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Tạo người dùng thất bại"));
      },
    });
  };

  const isPending = createUser.isPending;

  return (
    <Dialog
      isOpen={open}
      icon={UserPlus}
      title="Thêm người dùng"
      subtitle="Tạo tài khoản mới và phân quyền truy cập."
      className="max-w-lg"
      cancelText="Hủy"
      onCancel={handleClose}
      submitText="Tạo người dùng"
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
              placeholder="VD: Nguyễn Văn"
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
              placeholder="VD: An"
              invalid={!!errors.lastName}
              disabled={isPending}
            />
          </Field>
        </div>

        <Field label="Mật khẩu" required error={errors.password}>
          <Input
            value={values.password}
            onChange={(e) =>
              setValues((v) => ({ ...v, password: e.target.value }))
            }
            type="password"
            autoComplete="new-password"
            placeholder={`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} ký tự`}
            invalid={!!errors.password}
            disabled={isPending}
          />
        </Field>

        <Field label="Email" required error={errors.email}>
          <Input
            value={values.email}
            onChange={(e) =>
              setValues((v) => ({ ...v, email: e.target.value }))
            }
            type="email"
            placeholder="VD: user@example.com"
            invalid={!!errors.email}
            disabled={isPending}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số điện thoại" error={errors.phone}>
            <Input
              value={values.phone}
              onChange={(e) =>
                setValues((v) => ({ ...v, phone: e.target.value }))
              }
              type="tel"
              placeholder="VD: 0901 234 567"
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
