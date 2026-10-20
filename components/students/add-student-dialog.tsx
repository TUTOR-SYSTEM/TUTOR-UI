"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { cn } from "@/lib/utils";
import { useGet, usePost } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import { useClassActions } from "@/lib/services/class.service";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import { ParentPicker } from "@/components/students/parent-picker";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
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
};

/* ─── Field wrappers ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
      {children}
    </p>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── component ─── */
export function AddStudentDialog({ open, onClose, onAdd }: StudentProps) {
  const copy = useStudentsCopy();
  const common = useCommonCopy();
  const { register, control, handleSubmit, reset, setValue } =
    useForm<FormValuesStudent>({
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
        };
    const payload: CreateStudentPayload = {
      studentName: values.studentName.trim(),
      userCode: values.userCode?.trim() || undefined,
      classCode: values.classCode?.trim() || undefined,
      gender: values.gender,
      studentPhone: values.studentPhone?.trim() || undefined,
      school: values.school?.trim() || undefined,
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
      onError: (error) => {
        toast.error(getErrorMessage(error, copy.addDialog.toastError));
      },
    });
  };

  return (
    <Dialog
      isOpen={open}
      icon={UserPlus}
      title={copy.addDialog.title}
      subtitle={copy.addDialog.subtitle}
      className="max-w-2xl"
      cancelText={common.actions.cancel}
      onCancel={handleClose}
      submitText={copy.addDialog.submitText}
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
          <SectionTitle>{copy.addDialog.sectionStudentInfo}</SectionTitle>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Họ và tên */}
            <Field label={copy.addDialog.fullNameLabel} required>
              <Input
                {...register("studentName")}
                placeholder={copy.addDialog.fullNamePlaceholder}
                autoFocus
              />
            </Field>

            {/* Mã học sinh */}
            <Field label={copy.addDialog.studentCodeLabel}>
              <Input
                {...register("userCode")}
                readOnly
                disabled
                placeholder={
                  isGeneratingCode
                    ? copy.addDialog.studentCodeGenerating
                    : copy.addDialog.studentCodePlaceholder
                }
              />
            </Field>

            {/* Giới tính */}
            <Field label={copy.addDialog.genderLabel}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { value: "MALE", label: copy.addDialog.genderMale },
                        {
                          value: "FEMALE",
                          label: copy.addDialog.genderFemale,
                        },
                        { value: "OTHER", label: copy.addDialog.genderOther },
                      ] as const
                    ).map((opt) => {
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

            {/* Lớp học */}
            <Field label={copy.addDialog.classLabel}>
              <Controller
                name="classCode"
                control={control}
                render={({ field }) => (
                  <Select
                    options={classOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={copy.addDialog.classPlaceholder}
                  />
                )}
              />
            </Field>

            {/* SĐT học sinh */}
            <Field label={copy.addDialog.studentPhoneLabel}>
              <Input
                {...register("studentPhone")}
                type="tel"
                placeholder={copy.addDialog.studentPhonePlaceholder}
              />
            </Field>

            {/* Trường */}
            <Field label={copy.addDialog.schoolLabel}>
              <Input
                {...register("school")}
                placeholder={copy.addDialog.schoolPlaceholder}
              />
            </Field>
          </div>
        </div>

        {/* ── Parent info ── */}
        <div className="flex flex-col gap-4">
          <SectionTitle>{copy.addDialog.sectionParentInfo}</SectionTitle>

          {/* Họ và tên phụ huynh — gõ để tìm phụ huynh có sẵn */}
          <Controller
            name="parentName"
            control={control}
            render={({ field }) => (
              <ParentPicker
                label={copy.addDialog.parentNameLabel}
                placeholder={copy.addDialog.parentNamePlaceholder}
                required
                value={field.value ?? ""}
                onValueChange={field.onChange}
                linked={linkedParent}
                onLink={linkParent}
                onUnlink={unlinkParent}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Quan hệ */}
            <Field label={copy.addDialog.relationshipLabel}>
              <Controller
                name="parentRelationship"
                control={control}
                render={({ field }) => (
                  <Select
                    options={RELATIONSHIP_OPTIONS}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={copy.addDialog.relationshipPlaceholder}
                    disabled={!!linkedParent}
                  />
                )}
              />
            </Field>

            {/* SĐT phụ huynh */}
            <Field label={copy.addDialog.parentPhoneLabel}>
              <Input
                {...register("parentPhone")}
                type="tel"
                placeholder={copy.addDialog.parentPhonePlaceholder}
                disabled={!!linkedParent}
              />
            </Field>

            {/* Email phụ huynh */}
            <Field label={copy.addDialog.parentEmailLabel}>
              <Input
                {...register("parentEmail")}
                type="email"
                placeholder={copy.addDialog.parentEmailPlaceholder}
                disabled={!!linkedParent}
              />
            </Field>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
