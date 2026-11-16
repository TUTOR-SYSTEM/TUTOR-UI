"use client";

import { useState } from "react";
import { Check, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { Input } from "@/components/ui/input.ui";
import { getErrorMessage } from "@/lib/axios";
import { newPasswordError } from "@/lib/auth/password-policy";
import { useStudentActions } from "@/lib/services/student.service";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import type { Student } from "@/types";

export type SetStudentPasswordDialogProps = {
  open: boolean;
  student: Student | null;
  onClose: () => void;
};

/** Gia sư (chủ học sinh) hoặc admin đặt mật khẩu mới cho học sinh. */
export function SetStudentPasswordDialog({
  open,
  student,
  onClose,
}: SetStudentPasswordDialogProps) {
  const copy = useStudentsCopy();
  const common = useCommonCopy();
  const { setPassword: setStudentPassword } = useStudentActions();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const t = copy.setPasswordDialog;

  const handleClose = () => {
    setPassword("");
    setConfirm("");
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!student) return;
    const policyError = newPasswordError(password, {
      tooShort: copy.validation.passwordTooShort,
      tooLong: copy.validation.passwordTooLong,
      complexity: copy.validation.passwordComplexity,
    });
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }
    setError(null);
    setStudentPassword.mutate(
      { id: student.id, password },
      {
        onSuccess: () => {
          toast.success(t.toastSuccess);
          handleClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, t.toastError)),
      },
    );
  };

  return (
    <Dialog
      isOpen={open}
      icon={KeyRound}
      title={t.title}
      subtitle={`${t.subtitle}${student ? ` · ${student.name} (${student.studentId})` : ""}`}
      className="max-w-md"
      cancelText={common.actions.cancel}
      onCancel={handleClose}
      submitText={t.submitText}
      submitIcon={Check}
      onSubmit={handleSubmit}
      loading={setStudentPassword.isPending}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <FormField label={t.passwordLabel} htmlFor="set-student-password" error={error ?? undefined}>
          <Input
            id="set-student-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={copy.addDialog.passwordPlaceholder}
            invalid={!!error}
            autoFocus
          />
        </FormField>
        <FormField label={t.confirmLabel} htmlFor="set-student-password-confirm">
          <Input
            id="set-student-password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={copy.addDialog.passwordPlaceholder}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
