"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { Input } from "@/components/ui/input.ui";
import { getErrorMessage } from "@/lib/axios";
import { useSetTutorPassword } from "@/hooks/useAdminUsers.hook";
import { useLocale } from "@/hooks/useLocale.hook";
import { useTutorsCopy } from "@/hooks/useTutorsCopy.hook";
import { formatPersonName } from "@/lib/format/person-name";
import { buildTutorPasswordSchema } from "@/lib/validation/tutor-form.schema";
import type { ApiManagedUser, TutorPasswordFormValues } from "@/types";

type Props = {
  tutor: ApiManagedUser | null;
  onClose: () => void;
};

/** Admin đặt mật khẩu mới cho gia sư. Form nằm trong component con để reset khi đổi gia sư. */
export function SetTutorPasswordDialog({ tutor, onClose }: Props) {
  if (!tutor) return null;
  return <SetTutorPasswordForm key={tutor.id} tutor={tutor} onClose={onClose} />;
}

function SetTutorPasswordForm({
  tutor,
  onClose,
}: {
  tutor: ApiManagedUser;
  onClose: () => void;
}) {
  const copy = useTutorsCopy();
  const { language } = useLocale();
  const t = copy.passwordDialog;
  const schema = useMemo(
    () => buildTutorPasswordSchema(copy.validation, t.mismatch),
    [copy.validation, t.mismatch],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TutorPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const setPassword = useSetTutorPassword();
  const name =
    formatPersonName(tutor.firstName, tutor.lastName, language) || copy.unnamed;

  const onSubmit = ({ password }: TutorPasswordFormValues) => {
    setPassword.mutate(
      { id: tutor.id, password },
      {
        onSuccess: () => {
          toast.success(t.toastSuccess);
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, t.toastError)),
      },
    );
  };

  return (
    <Dialog
      isOpen
      icon={KeyRound}
      title={t.title}
      subtitle={`${t.subtitle} · ${name}`}
      className="max-w-md"
      cancelText={t.cancel}
      onCancel={onClose}
      submitText={t.submit}
      submitIcon={Check}
      onSubmit={handleSubmit(onSubmit)}
      loading={setPassword.isPending}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)();
        }}
      >
        <FormField
          label={t.passwordLabel}
          htmlFor="tutor-set-password"
          required
          error={errors.password?.message}
        >
          <Input
            id="tutor-set-password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            placeholder={copy.fields.passwordPlaceholder}
            invalid={!!errors.password}
            autoFocus
          />
        </FormField>
        <FormField
          label={t.confirmLabel}
          htmlFor="tutor-set-password-confirm"
          required
          error={errors.confirm?.message}
        >
          <Input
            id="tutor-set-password-confirm"
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
            placeholder={copy.fields.passwordPlaceholder}
            invalid={!!errors.confirm}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
