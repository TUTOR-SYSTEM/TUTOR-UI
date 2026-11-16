"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { ChipGroup } from "@/components/ui/chip-group.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { useGet, usePost } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { showFormApiError } from "@/lib/axios/form-error";
import { useClassActions } from "@/lib/services/class.service";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useAdminTutors } from "@/hooks/useAdminUsers.hook";
import { currentPersonName } from "@/lib/format/person-name";
import { ParentPicker } from "@/components/students/parent-picker";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { buildStudentCreateSchema } from "@/lib/validation/student-form.schema";
import {
  CreateStudentPayload,
  FormValuesStudent,
  GENDER_ENUM,
  ParentOption,
  StudentProps,
  RELATIONSHIP_OPTIONS,
} from "@/types";

type ClassOption = { id: string; name: string; code: string };

const DEFAULT_VALUES: FormValuesStudent = {
  tutorId: "",
  studentName: "",
  userCode: "",
  classCode: "",
  gender: GENDER_ENUM.MALE,
  studentPhone: "",
  school: "",
  parentName: "",
  parentRelationship: "",
  parentPhone: "",
  parentEmail: "",
  password: "",
  parentPassword: "",
};

/** Fields rendered by this form; a 422 on any other field falls back to a toast. */
const FORM_FIELDS = [
  "tutorId",
  "studentName",
  "userCode",
  "classCode",
  "gender",
  "studentPhone",
  "school",
  "password",
  "parentName",
  "parentRelationship",
  "parentPhone",
  "parentEmail",
  "parentPassword",
] as const;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
      {children}
    </p>
  );
}

/* ─── component ─── */
export function AddStudentDialog({ open, onClose, onAdd }: StudentProps) {
  const copy = useStudentsCopy();
  const common = useCommonCopy();
  const isAdmin = useCurrentUserRole() === "ADMIN";
  const schema = useMemo(
    () => buildStudentCreateSchema(copy.validation, { requireTutor: isAdmin }),
    [copy.validation, isAdmin],
  );
  /* admin picks which tutor manages the new student */
  const { data: tutorsRaw } = useAdminTutors({ page: 1, limit: 100 }, open && isAdmin);
  const tutorOptions = useMemo(
    () =>
      (tutorsRaw?.tutors ?? []).map((t) => ({
        label: currentPersonName(t.firstName, t.lastName) || t.email || "",
        value: t.id,
      })),
    [tutorsRaw],
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValuesStudent>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });
  /* existing parent picked from search; null = create a new parent from the fields below */
  const [linkedParent, setLinkedParent] = useState<ParentOption | null>(null);

  /* picked an existing parent: show their data in the parent fields, locked (sent as parentId only) */
  const linkParent = (parent: ParentOption) => {
    setLinkedParent(parent);
    setValue("parentRelationship", "");
    setValue("parentPhone", parent.phone ?? "");
    setValue("parentEmail", parent.email ?? "");
    setValue("parentPassword", "");
  };

  /* name typed away from the picked parent: unlock the fields for a new parent */
  const unlinkParent = () => {
    setLinkedParent(null);
    setValue("parentRelationship", "");
    setValue("parentPhone", "");
    setValue("parentEmail", "");
  };

  /* reset form on close */
  useEffect(() => {
    if (!open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  const handleClose = () => {
    setLinkedParent(null);
    onClose();
  };

  /* generate a fresh student code every time the dialog opens */
  const { data: studentCodeRaw, isFetching: isGeneratingCode } = useGet(
    ["student-code"],
    "/students/get-student-code",
    { enabled: open, staleTime: 0 },
  );

  useEffect(() => {
    if (!open || studentCodeRaw === undefined) return;
    const code = unwrapApiData<string>(studentCodeRaw);
    if (code) setValue("userCode", code);
  }, [open, studentCodeRaw, setValue]);

  /* classes for the class picker */
  const { data: classesRaw } = useClassActions({
    list: { limit: 100 },
    listOptions: { enabled: open },
  }).list;

  const classOptions = useMemo(() => {
    const classes = (classesRaw?.classes ?? []) as ClassOption[];
    return [
      { label: copy.editDialog.classNoneOption, value: "" },
      ...classes.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    ];
  }, [classesRaw, copy]);

  const createStudent = usePost<unknown, CreateStudentPayload>("/students");

  const onSubmit = (values: FormValuesStudent) => {
    const parentPayload: Partial<CreateStudentPayload> = linkedParent
      ? { parentId: linkedParent.id }
      : {
          parentName: values.parentName?.trim() || undefined,
          parentRelationship: values.parentRelationship || undefined,
          parentPhone: values.parentPhone?.trim() || undefined,
          parentEmail: values.parentEmail?.trim() || undefined,
          parentPassword: values.parentPassword || undefined,
        };
    const payload: CreateStudentPayload = {
      tutorId: isAdmin ? values.tutorId : undefined,
      studentName: values.studentName.trim(),
      userCode: values.userCode?.trim() || undefined,
      classCode: values.classCode?.trim() || undefined,
      gender: values.gender,
      studentPhone: values.studentPhone?.trim() || undefined,
      school: values.school?.trim() || undefined,
      password: values.password || undefined,
      ...parentPayload,
    };

    createStudent.mutate(payload, {
      onSuccess: (raw) => {
        unwrapApiData(raw);
        toast.success(copy.addDialog.toastSuccess);
        onAdd({
          name: values.studentName.trim(),
          userCode: values.userCode?.trim() ?? "",
          classCode: values.classCode?.trim() ?? "",
          studentPhone: values.studentPhone?.trim() ?? "",
          school: values.school?.trim() ?? "",
          parentName: linkedParent ? linkedParent.name : values.parentName.trim(),
          parentEmail: linkedParent ? (linkedParent.email ?? "") : values.parentEmail.trim(),
          parentRelationship: linkedParent ? "" : values.parentRelationship.trim(),
          parentPhone: linkedParent
            ? (linkedParent.phone ?? "")
            : (values.parentPhone?.trim() ?? ""),
        });
        handleClose();
      },
      // 422 → underline đúng ô; còn lại (trùng mã HS, lỗi server...) → toast với nội dung BE.
      onError: (error) =>
        showFormApiError(error, setError, FORM_FIELDS, copy.addDialog.toastError),
    });
  };

  const a = copy.addDialog;

  return (
    <Dialog
      isOpen={open}
      icon={UserPlus}
      title={a.title}
      subtitle={a.subtitle}
      className="max-w-2xl"
      cancelText={common.actions.cancel}
      onCancel={handleClose}
      submitText={a.submitText}
      submitIcon={Check}
      onSubmit={handleSubmit(onSubmit)}
      loading={createStudent.isPending}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        {/* ── Student info ── */}
        <div className="flex flex-col gap-4">
          <SectionTitle>{a.sectionStudentInfo}</SectionTitle>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isAdmin && (
              <FormField label="Gia sư quản lý" required error={errors.tutorId?.message}>
                <Controller
                  name="tutorId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={tutorOptions}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn gia sư..."
                      invalid={!!errors.tutorId}
                    />
                  )}
                />
              </FormField>
            )}
            <FormField
              label={a.fullNameLabel}
              htmlFor="student-create-name"
              required
              error={errors.studentName?.message}
            >
              <Input
                id="student-create-name"
                {...register("studentName")}
                placeholder={a.fullNamePlaceholder}
                invalid={!!errors.studentName}
                autoFocus
              />
            </FormField>

            <FormField
              label={a.studentCodeLabel}
              htmlFor="student-create-code"
              error={errors.userCode?.message}
            >
              <Input
                id="student-create-code"
                {...register("userCode")}
                readOnly
                disabled
                invalid={!!errors.userCode}
                placeholder={
                  isGeneratingCode ? a.studentCodeGenerating : a.studentCodePlaceholder
                }
              />
            </FormField>

            <FormField label={a.genderLabel} error={errors.gender?.message}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <ChipGroup
                    variant="block"
                    aria-label={a.genderLabel}
                    className="grid grid-cols-3 gap-3"
                    options={[
                      { value: GENDER_ENUM.MALE, label: a.genderMale },
                      { value: GENDER_ENUM.FEMALE, label: a.genderFemale },
                      { value: GENDER_ENUM.OTHER, label: a.genderOther },
                    ]}
                    selected={[field.value]}
                    onToggle={(value) => field.onChange(value as GENDER_ENUM)}
                  />
                )}
              />
            </FormField>

            <FormField label={a.classLabel} error={errors.classCode?.message}>
              <Controller
                name="classCode"
                control={control}
                render={({ field }) => (
                  <Select
                    options={classOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={a.classPlaceholder}
                    invalid={!!errors.classCode}
                  />
                )}
              />
            </FormField>

            <FormField
              label={a.studentPhoneLabel}
              htmlFor="student-create-phone"
              error={errors.studentPhone?.message}
            >
              <Input
                id="student-create-phone"
                {...register("studentPhone")}
                type="tel"
                placeholder={a.studentPhonePlaceholder}
                invalid={!!errors.studentPhone}
              />
            </FormField>

            <FormField
              label={a.schoolLabel}
              htmlFor="student-create-school"
              error={errors.school?.message}
            >
              <Input
                id="student-create-school"
                {...register("school")}
                placeholder={a.schoolPlaceholder}
                invalid={!!errors.school}
              />
            </FormField>

            <FormField
              label={a.studentPasswordLabel}
              htmlFor="student-create-password"
              hint={a.studentPasswordHint}
              error={errors.password?.message}
            >
              <Input
                id="student-create-password"
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder={a.passwordPlaceholder}
                invalid={!!errors.password}
              />
            </FormField>
          </div>
        </div>

        {/* ── Parent info ── */}
        <div className="flex flex-col gap-4">
          <SectionTitle>{a.sectionParentInfo}</SectionTitle>

          {/* Họ và tên phụ huynh — gõ để tìm phụ huynh có sẵn */}
          <Controller
            name="parentName"
            control={control}
            render={({ field }) => (
              <ParentPicker
                label={a.parentNameLabel}
                placeholder={a.parentNamePlaceholder}
                required
                value={field.value ?? ""}
                onValueChange={field.onChange}
                linked={linkedParent}
                onLink={linkParent}
                onUnlink={unlinkParent}
                error={errors.parentName?.message}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={a.relationshipLabel} error={errors.parentRelationship?.message}>
              <Controller
                name="parentRelationship"
                control={control}
                render={({ field }) => (
                  <Select
                    options={RELATIONSHIP_OPTIONS}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={a.relationshipPlaceholder}
                    disabled={!!linkedParent}
                  />
                )}
              />
            </FormField>

            <FormField
              label={a.parentPhoneLabel}
              htmlFor="student-create-parent-phone"
              error={errors.parentPhone?.message}
            >
              <Input
                id="student-create-parent-phone"
                {...register("parentPhone")}
                type="tel"
                placeholder={a.parentPhonePlaceholder}
                disabled={!!linkedParent}
                invalid={!!errors.parentPhone}
              />
            </FormField>

            <FormField
              label={a.parentEmailLabel}
              htmlFor="student-create-parent-email"
              error={errors.parentEmail?.message}
            >
              <Input
                id="student-create-parent-email"
                {...register("parentEmail")}
                type="email"
                placeholder={a.parentEmailPlaceholder}
                disabled={!!linkedParent}
                invalid={!!errors.parentEmail}
              />
            </FormField>

            <FormField
              label={a.parentPasswordLabel}
              htmlFor="student-create-parent-password"
              error={errors.parentPassword?.message}
            >
              <Input
                id="student-create-parent-password"
                {...register("parentPassword")}
                type="password"
                autoComplete="new-password"
                placeholder={a.passwordPlaceholder}
                disabled={!!linkedParent}
                invalid={!!errors.parentPassword}
              />
            </FormField>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
