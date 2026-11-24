"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { ChipGroup } from "@/components/ui/chip-group.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { Input } from "@/components/ui/input.ui";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { showFormApiError } from "@/lib/axios/form-error";
import { useCreateTutor } from "@/hooks/useAdminUsers.hook";
import { useTutorsCopy } from "@/hooks/useTutorsCopy.hook";
import { SUBJECT_OPTIONS } from "@/lib/subjects";
import { buildTutorCreateSchema } from "@/lib/validation/tutor-form.schema";
import type { CreateAdminUserPayload, TutorCreateFormValues } from "@/types";

const DEFAULT_VALUES: TutorCreateFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  subjects: [],
  school: "",
  gender: "MALE",
};

/** Fields rendered by this form; a 422 on any other field falls back to a toast. */
const FORM_FIELDS = [
  "lastName",
  "firstName",
  "email",
  "password",
  "phone",
  "gender",
  "subjects",
  "school",
] as const;

const SUBJECT_CHIPS = SUBJECT_OPTIONS.map((subject) => ({
  label: subject,
  value: subject,
}));

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after a tutor is created successfully — parent should refetch the list. */
  onCreated?: () => void;
};

export function AddTutorDialog({ open, onClose, onCreated }: Props) {
  const copy = useTutorsCopy();
  const schema = useMemo(
    () => buildTutorCreateSchema(copy.validation),
    [copy.validation],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TutorCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  const createTutor = useCreateTutor();

  const onSubmit = (values: TutorCreateFormValues) => {
    const payload: CreateAdminUserPayload = {
      email: values.email.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      password: values.password || undefined,
      phone: values.phone.trim() || undefined,
      subjects: values.subjects.length ? values.subjects : undefined,
      school: values.school.trim() || undefined,
      gender: values.gender,
    };

    createTutor.mutate(payload, {
      onSuccess: (raw) => {
        unwrapApiData(raw);
        toast.success(copy.toast.created);
        onCreated?.();
        onClose();
      },
      // 422 → underline đúng ô; còn lại (400 trùng, lỗi server...) → toast.
      onError: (error) =>
        showFormApiError(error, setError, FORM_FIELDS, copy.toast.createFailed),
    });
  };

  const f = copy.fields;

  return (
    <Dialog
      isOpen={open}
      icon={UserPlus}
      title={copy.addDialog.title}
      subtitle={copy.addDialog.subtitle}
      className="max-w-2xl"
      cancelText={copy.addDialog.cancel}
      onCancel={onClose}
      submitText={copy.addDialog.submit}
      submitIcon={Check}
      onSubmit={handleSubmit(onSubmit)}
      loading={createTutor.isPending}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <FormField
          label={f.lastName}
          htmlFor="tutor-create-lastName"
          required
          error={errors.lastName?.message}
        >
          <Input
            id="tutor-create-lastName"
            {...register("lastName")}
            placeholder={f.lastNamePlaceholder}
            invalid={!!errors.lastName}
            autoFocus
          />
        </FormField>

        <FormField
          label={f.firstName}
          htmlFor="tutor-create-firstName"
          required
          error={errors.firstName?.message}
        >
          <Input
            id="tutor-create-firstName"
            {...register("firstName")}
            placeholder={f.firstNamePlaceholder}
            invalid={!!errors.firstName}
          />
        </FormField>

        <FormField
          label={f.email}
          htmlFor="tutor-create-email"
          required
          error={errors.email?.message}
        >
          <Input
            id="tutor-create-email"
            type="email"
            autoComplete="off"
            {...register("email")}
            placeholder={f.emailPlaceholder}
            invalid={!!errors.email}
          />
        </FormField>

        <FormField
          label={f.password}
          htmlFor="tutor-create-password"
          hint={f.passwordHint}
          error={errors.password?.message}
        >
          <Input
            id="tutor-create-password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            placeholder={f.passwordPlaceholder}
            invalid={!!errors.password}
          />
        </FormField>

        <FormField
          label={f.phone}
          htmlFor="tutor-create-phone"
          error={errors.phone?.message}
        >
          <Input
            id="tutor-create-phone"
            type="tel"
            {...register("phone")}
            placeholder={f.phonePlaceholder}
            invalid={!!errors.phone}
          />
        </FormField>

        <FormField label={f.gender} error={errors.gender?.message}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <ChipGroup
                variant="block"
                aria-label={f.gender}
                className="grid grid-cols-3 gap-2"
                options={f.genderOptions}
                selected={[field.value]}
                onToggle={(value) =>
                  field.onChange(value as TutorCreateFormValues["gender"])
                }
              />
            )}
          />
        </FormField>

        <FormField
          label={f.subjects}
          hint={f.subjectsHint}
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

        <FormField
          label={f.school}
          htmlFor="tutor-create-school"
          error={errors.school?.message}
          className="sm:col-span-2"
        >
          <Input
            id="tutor-create-school"
            {...register("school")}
            placeholder={f.schoolPlaceholder}
            invalid={!!errors.school}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
