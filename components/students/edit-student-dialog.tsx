"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Save } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { cn } from "@/lib/utils";
import { usePut } from "@/lib/axios/query";
import { handleFormApiError } from "@/lib/axios/form-error";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useClassActions } from "@/lib/services/class.service";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import type { StudentsDictionary } from "@/lib/i18n/students.dictionary";
import type { Student, UpdateStudentPayload } from "@/types";

type ClassOption = { id: string; name: string; code: string };

/* ─── props ─── */
type Props = {
  student: Student | null;
  onClose: () => void;
  onSaved: () => void;
};

const VN_PHONE_REGEX = /^(0|\+84)\d{9,10}$/;

/* ─── Zod v4 schema ─── */
/* Parent-info fields are intentionally unvalidated (no required/format/length checks) — editing a
 * student must not be blocked by incomplete or free-form parent data. */
function buildSchema(t: StudentsDictionary["editDialog"]) {
  return z.object({
    studentName: z
      .string({ message: t.errStudentNameType })
      .min(1, t.errStudentNameRequired)
      .max(255, t.errNameMax255),
    classId: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    birthday: z.string().optional(),
    studentPhone: z
      .union([
        z.literal(""),
        z.string().regex(VN_PHONE_REGEX, t.errInvalidPhone),
      ])
      .optional(),
    school: z.string().max(255, t.errMax255).optional(),
    address: z.string().max(500, t.errMax255).optional(),
    district: z.string().max(30, t.errMax255).optional(),
    province: z.string().max(30, t.errMax255).optional(),
    parentName: z.string().optional(),
    parentRelationship: z.string().optional(),
    parentPhone: z.string().optional(),
    parentEmail: z.string().optional(),
    parentAddress: z.string().optional(),
    parentDistrict: z.string().optional(),
    parentProvince: z.string().optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function getDefaultValues(student: Student): FormValues {
  return {
    studentName: student.name,
    classId: student.classId ?? "",
    gender:
      student.gender === "FEMALE" || student.gender === "OTHER"
        ? student.gender
        : "MALE",
    birthday: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
    studentPhone: student.phone ?? "",
    school: student.school ?? "",
    address: student.address ?? "",
    district: student.district ?? "",
    province: student.province ?? "",
    parentName: student.parentName ?? "",
    parentRelationship: student.parentRelationship ?? "",
    parentPhone: student.parentPhone ?? "",
    parentEmail: student.parentEmail ?? "",
    parentAddress: student.parentAddress ?? "",
    parentDistrict: student.parentDistrict ?? "",
    parentProvince: student.parentProvince ?? "",
  };
}

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

/* ─── component ─── */
export function EditStudentDialog({ student, onClose, onSaved }: Props) {
  const copy = useStudentsCopy();
  const common = useCommonCopy();
  const open = student !== null;
  const isTutor = useCurrentUserRole() === "TUTOR";

  const relationshipOptions = useMemo(
    () => [
      { label: copy.editDialog.relationshipFather, value: "FATHER" },
      { label: copy.editDialog.relationshipMother, value: "MOTHER" },
      { label: copy.editDialog.relationshipGuardian, value: "GUARDIAN" },
    ],
    [copy],
  );

  const schema = useMemo(() => buildSchema(copy.editDialog), [copy]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: student ? getDefaultValues(student) : undefined,
  });

  /* re-fill form whenever a different student is opened */
  useEffect(() => {
    if (student) reset(getDefaultValues(student));
  }, [student, reset]);

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

  /* mutation */
  const updateStudent = usePut<unknown, UpdateStudentPayload>(
    (payload) => `/students/${payload.id}`,
  );

  const onSubmit = (values: FormValues) => {
    if (!student) return;

    const payload: UpdateStudentPayload = {
      id: student.id,
      studentName: values.studentName.trim(),
      studentPhone: values.studentPhone?.trim() || undefined,
      gender: values.gender,
      birthday: values.birthday
        ? new Date(values.birthday).toISOString()
        : undefined,
      school: values.school?.trim() || undefined,
      address: values.address?.trim() || undefined,
      district: values.district?.trim() || undefined,
      province: values.province?.trim() || undefined,
      // Always send classId — it directly reflects the picker's current state, and "" is a
      // meaningful value (explicitly un-enroll), not "leave unchanged" like the fields above.
      classId: values.classId ?? "",
      parentName: values.parentName?.trim() || undefined,
      parentPhone: values.parentPhone?.trim() || undefined,
      parentEmail: values.parentEmail?.trim() || undefined,
      parentRelationship: values.parentRelationship || undefined,
      parentAddress: values.parentAddress?.trim() || undefined,
      parentDistrict: values.parentDistrict?.trim() || undefined,
      parentProvince: values.parentProvince?.trim() || undefined,
    };

    updateStudent.mutate(payload, {
      onSuccess: (raw) => {
        unwrapApiData(raw);
        toast.success(copy.editDialog.toastSuccess);
        onSaved();
        onClose();
      },
      onError: (error) => {
        handleFormApiError<FormValues>(
          error,
          setError,
          copy.editDialog.toastErrorFallback,
        );
      },
    });
  };

  const isPending = updateStudent.isPending;
  const handleClose = () => {
    if (!isPending) onClose();
  };

  return (
    <Dialog
      isOpen={open}
      icon={Pencil}
      title={copy.editDialog.title}
      subtitle={copy.editDialog.subtitle}
      className="max-w-2xl"
      cancelText={common.actions.cancel}
      onCancel={handleClose}
      submitText={copy.editDialog.submitText}
      submitIcon={Save}
      onSubmit={handleSubmit(onSubmit)}
      loading={isPending}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        {/* ── Student info ── */}
        <div className="flex flex-col gap-4">
          <SectionTitle>{copy.editDialog.sectionStudentInfo}</SectionTitle>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Họ và tên */}
            <Field
              label={copy.editDialog.fullNameLabel}
              required
              error={errors.studentName?.message}
            >
              <Input
                {...register("studentName")}
                placeholder={copy.editDialog.fullNamePlaceholder}
                autoFocus
                invalid={!!errors.studentName}
                disabled={isPending}
              />
            </Field>

            {/* Lớp học */}
            <Field
              label={copy.editDialog.classNameLabel}
              error={errors.classId?.message}
            >
              <Controller
                name="classId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={classOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={copy.editDialog.classNamePlaceholder}
                    disabled={isPending}
                    invalid={!!errors.classId}
                  />
                )}
              />
            </Field>

            {/* Giới tính */}
            <Field label={copy.editDialog.genderLabel}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { value: "MALE", label: copy.editDialog.genderMale },
                        {
                          value: "FEMALE",
                          label: copy.editDialog.genderFemale,
                        },
                        { value: "OTHER", label: copy.editDialog.genderOther },
                      ] as const
                    ).map((opt) => {
                      const selected = field.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isPending}
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            "h-11 rounded-md border text-sm font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-input bg-surface-container-lowest text-foreground hover:border-primary/40",
                            isPending && "pointer-events-none opacity-50",
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

            {/* Ngày sinh */}
            <Field
              label={copy.editDialog.birthdayLabel}
              error={errors.birthday?.message}
            >
              <Input
                {...register("birthday")}
                type="date"
                invalid={!!errors.birthday}
                disabled={isPending}
              />
            </Field>

            {/* SĐT học sinh */}
            <Field
              label={copy.editDialog.studentPhoneLabel}
              error={errors.studentPhone?.message}
            >
              <Input
                {...register("studentPhone")}
                type="tel"
                placeholder={copy.editDialog.studentPhonePlaceholder}
                invalid={!!errors.studentPhone}
                disabled={isPending}
              />
            </Field>

            {/* Trường */}
            <Field
              label={copy.editDialog.schoolLabel}
              error={errors.school?.message}
            >
              <Input
                {...register("school")}
                placeholder={copy.editDialog.schoolPlaceholder}
                invalid={!!errors.school}
                disabled={isPending}
              />
            </Field>

            {/* Địa chỉ */}
            <Field
              label={copy.editDialog.addressLabel}
              error={errors.address?.message}
            >
              <Input
                {...register("address")}
                placeholder={copy.editDialog.addressPlaceholder}
                invalid={!!errors.address}
                disabled={isPending || isTutor}
              />
              {isTutor && (
                <p className="text-xs text-muted-foreground">
                  {copy.editDialog.tutorLockedNote}
                </p>
              )}
            </Field>

            {/* Quận/Huyện */}
            <Field
              label={copy.editDialog.districtLabel}
              error={errors.district?.message}
            >
              <Input
                {...register("district")}
                placeholder={copy.editDialog.districtPlaceholder}
                invalid={!!errors.district}
                disabled={isPending || isTutor}
              />
            </Field>

            {/* Tỉnh/Thành phố */}
            <Field
              label={copy.editDialog.provinceLabel}
              error={errors.province?.message}
            >
              <Input
                {...register("province")}
                placeholder={copy.editDialog.provincePlaceholder}
                invalid={!!errors.province}
                disabled={isPending || isTutor}
              />
            </Field>
          </div>
        </div>

        {/* ── Parent info ── */}
        <div className="flex flex-col gap-4">
          <SectionTitle>{copy.editDialog.sectionParentInfo}</SectionTitle>
          {isTutor && (
            <p className="-mt-2 text-xs text-muted-foreground">
              {copy.editDialog.tutorLockedNote}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Họ và tên phụ huynh */}
            <Field
              label={copy.editDialog.parentNameLabel}
              error={errors.parentName?.message}
            >
              <Input
                {...register("parentName")}
                placeholder={copy.editDialog.parentNamePlaceholder}
                invalid={!!errors.parentName}
                disabled={isPending || isTutor}
              />
            </Field>

            {/* Quan hệ */}
            <Field
              label={copy.editDialog.relationshipLabel}
              error={errors.parentRelationship?.message}
            >
              <Controller
                name="parentRelationship"
                control={control}
                render={({ field }) => (
                  <Select
                    options={relationshipOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={copy.editDialog.relationshipPlaceholder}
                    disabled={isPending || isTutor}
                    invalid={!!errors.parentRelationship}
                  />
                )}
              />
            </Field>

            {/* SĐT phụ huynh */}
            <Field
              label={copy.editDialog.parentPhoneLabel}
              error={errors.parentPhone?.message}
            >
              <Input
                {...register("parentPhone")}
                type="tel"
                placeholder={copy.editDialog.parentPhonePlaceholder}
                invalid={!!errors.parentPhone}
                disabled={isPending || isTutor}
              />
            </Field>

            {/* Email phụ huynh */}
            <Field
              label={copy.editDialog.parentEmailLabel}
              error={errors.parentEmail?.message}
            >
              <Input
                {...register("parentEmail")}
                type="email"
                placeholder={copy.editDialog.parentEmailPlaceholder}
                invalid={!!errors.parentEmail}
                disabled={isPending || isTutor}
              />
            </Field>

            {/* Địa chỉ phụ huynh */}
            <Field
              label={copy.editDialog.parentAddressLabel}
              error={errors.parentAddress?.message}
            >
              <Input
                {...register("parentAddress")}
                placeholder={copy.editDialog.parentAddressPlaceholder}
                invalid={!!errors.parentAddress}
                disabled={isPending || isTutor}
              />
            </Field>

            {/* Quận/Huyện phụ huynh */}
            <Field
              label={copy.editDialog.parentDistrictLabel}
              error={errors.parentDistrict?.message}
            >
              <Input
                {...register("parentDistrict")}
                placeholder={copy.editDialog.parentDistrictPlaceholder}
                invalid={!!errors.parentDistrict}
                disabled={isPending || isTutor}
              />
            </Field>

            {/* Tỉnh/Thành phố phụ huynh */}
            <Field
              label={copy.editDialog.parentProvinceLabel}
              error={errors.parentProvince?.message}
            >
              <Input
                {...register("parentProvince")}
                placeholder={copy.editDialog.parentProvincePlaceholder}
                invalid={!!errors.parentProvince}
                disabled={isPending || isTutor}
              />
            </Field>
          </div>
        </div>

        {/* Server error banner */}
        {errors.root?.serverError?.message && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
            {errors.root.serverError.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
