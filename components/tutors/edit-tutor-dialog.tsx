"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";

import { ChipGroup } from "@/components/ui/chip-group.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { Input } from "@/components/ui/input.ui";
import { showFormApiError } from "@/lib/axios/form-error";
import { SUBJECT_OPTIONS } from "@/lib/subjects";
import { useUpdateTutorById } from "@/hooks/useAdminUsers.hook";
import { useTutorsCopy } from "@/hooks/useTutorsCopy.hook";
import { buildTutorEditSchema } from "@/lib/validation/tutor-form.schema";
import type {
  ApiManagedUser,
  TutorEditFormValues,
  UpdateAdminUserPayload,
} from "@/types";

/** Fields rendered by this form; a 422 on any other field falls back to a toast. */
const FORM_FIELDS = [
  "lastName",
  "firstName",
  "email",
  "phone",
  "school",
  "subjects",
] as const;

const SUBJECT_CHIPS = SUBJECT_OPTIONS.map((subject) => ({
  label: subject,
  value: subject,
}));

function toFormValues(tutor: ApiManagedUser): TutorEditFormValues {
  return {
    firstName: tutor.firstName ?? "",
    lastName: tutor.lastName ?? "",
    email: tutor.email ?? "",
    phone: tutor.phone ?? "",
    school: tutor.school ?? "",
    subjects: tutor.subjects ?? [],
  };
}

/** Only the fields that actually changed — the BE validates by key presence. */
function buildPatch(
  tutor: ApiManagedUser,
  values: TutorEditFormValues,
): UpdateAdminUserPayload {
  const original = toFormValues(tutor);
  const patch: UpdateAdminUserPayload = {};
  if (values.firstName !== original.firstName)
    patch.firstName = values.firstName;
  if (values.lastName !== original.lastName) patch.lastName = values.lastName;
  if (values.email !== original.email) patch.email = values.email;
  if (values.phone !== original.phone) patch.phone = values.phone || null;
  if (values.school !== original.school) patch.school = values.school || null;
  if (values.subjects.join("|") !== original.subjects.join("|"))
    patch.subjects = values.subjects;
  return patch;
}

type Props = {
  tutor: ApiManagedUser | null;
  onClose: () => void;
  /** Called after a successful save — parent should refetch the list. */
  onSaved?: () => void;
};

export function EditTutorDialog({ tutor, onClose, onSaved }: Props) {
  if (!tutor) return null;
  return (
    <EditTutorForm
      key={tutor.id}
      tutor={tutor}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function EditTutorForm({
  tutor,
  onClose,
  onSaved,
}: {
  tutor: ApiManagedUser;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const copy = useTutorsCopy();
  const schema = useMemo(
    () => buildTutorEditSchema(copy.validation),
    [copy.validation],
  );

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TutorEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(tutor),
  });

  const updateTutor = useUpdateTutorById();
  const isPending = updateTutor.isPending;
  const f = copy.fields;

  const onSubmit = (values: TutorEditFormValues) => {
    const patch = buildPatch(tutor, values);
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    updateTutor.mutate(
      { id: tutor.id, ...patch },
      {
        onSuccess: () => {
          toast.success(copy.toast.updated);
          onSaved?.();
          onClose();
        },
        // 422 → underline đúng ô; còn lại (400 trùng, lỗi server...) → toast.
        onError: (error) =>
          showFormApiError(error, setError, FORM_FIELDS, copy.toast.updateFailed),
      },
    );
  };

  return (
    <Dialog
      isOpen
      icon={Pencil}
      title={copy.editDialog.title}
      subtitle={copy.editDialog.subtitle}
      className="max-w-2xl"
      cancelText={copy.editDialog.cancel}
      onCancel={onClose}
      submitText={copy.editDialog.submit}
      submitIcon={Save}
      onSubmit={handleSubmit(onSubmit)}
      loading={isPending}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <FormField
          label={f.lastName}
          htmlFor="tutor-edit-lastName"
          required
          error={errors.lastName?.message}
        >
          <Input
            id="tutor-edit-lastName"
            {...register("lastName")}
            invalid={!!errors.lastName}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label={f.firstName}
          htmlFor="tutor-edit-firstName"
          required
          error={errors.firstName?.message}
        >
          <Input
            id="tutor-edit-firstName"
            {...register("firstName")}
            invalid={!!errors.firstName}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label={f.email}
          htmlFor="tutor-edit-email"
          required
          error={errors.email?.message}
        >
          <Input
            id="tutor-edit-email"
            type="email"
            {...register("email")}
            invalid={!!errors.email}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label={f.phone}
          htmlFor="tutor-edit-phone"
          error={errors.phone?.message}
        >
          <Input
            id="tutor-edit-phone"
            type="tel"
            {...register("phone")}
            invalid={!!errors.phone}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label={f.school}
          htmlFor="tutor-edit-school"
          error={errors.school?.message}
          className="sm:col-span-2"
        >
          <Input
            id="tutor-edit-school"
            {...register("school")}
            invalid={!!errors.school}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label={f.subjects}
          error={errors.subjects?.message}
          className="sm:col-span-2"
        >
          <Controller
            name="subjects"
            control={control}
            render={({ field }) => (
              <ChipGroup
                aria-label={f.subjects}
                options={SUBJECT_CHIPS}
                selected={field.value}
                disabled={isPending}
                onToggle={(value) =>
                  field.onChange(
                    field.value.includes(value)
                      ? field.value.filter((s) => s !== value)
                      : [...field.value, value],
                  )
                }
              />
            )}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
