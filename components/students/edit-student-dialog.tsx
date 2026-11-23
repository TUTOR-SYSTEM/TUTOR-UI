"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Save } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { DatePicker } from "@/components/ui/date-picker.ui";
import { Select } from "@/components/ui/select.ui";
import { cn } from "@/lib/utils";
import { usePut } from "@/lib/axios/query";
import { showFormApiError } from "@/lib/axios/form-error";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/axios/api-error";
import { CLASSES_QUERY_KEY, useClassActions } from "@/lib/services/class.service";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useAdminTutors } from "@/hooks/useAdminUsers.hook";
import { currentPersonName } from "@/lib/format/person-name";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import { ParentPicker } from "@/components/students/parent-picker";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import type { StudentsDictionary } from "@/lib/i18n/students.dictionary";
import type { ParentOption, Student, UpdateStudentPayload } from "@/types";

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
    lastName: z
      .string()
      .trim()
      .min(1, t.errLastNameRequired)
      .max(255, t.errNameMax255),
    firstName: z
      .string()
      .trim()
      .min(1, t.errFirstNameRequired)
      .max(255, t.errNameMax255),
    tutorId: z.string().optional(),
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
    parentLastName: z.string().optional(),
    parentFirstName: z.string().optional(),
    parentRelationship: z.string().optional(),
    parentPhone: z.string().optional(),
    parentEmail: z.string().optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

/** Fields this form renders; a 422 on any other field falls back to a toast. */
const STUDENT_FORM_FIELDS = [
  "lastName",
  "firstName",
  "tutorId",
  "classId",
  "gender",
  "birthday",
  "studentPhone",
  "school",
  "address",
  "district",
  "province",
  "parentLastName",
  "parentFirstName",
  "parentRelationship",
  "parentPhone",
  "parentEmail",
] as const;

function getDefaultValues(student: Student): FormValues {
  return {
    lastName: student.lastName,
    firstName: student.firstName,
    tutorId: student.tutorId ?? "",
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
    parentLastName: student.parentLastName,
    parentFirstName: student.parentFirstName,
    parentRelationship: student.parentRelationship ?? "",
    parentPhone: student.parentPhone ?? "",
    parentEmail: student.parentEmail ?? "",
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
  const role = useCurrentUserRole();
  const isTutor = role === "TUTOR";
  const isAdmin = role === "ADMIN";

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
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: student ? getDefaultValues(student) : undefined,
  });
  /* another existing parent picked for the student shown (null = keep the current parent);
   * ignored once a different student is opened */
  const [picked, setPicked] = useState<{
    studentId: string;
    parent: ParentOption;
  } | null>(null);
  const otherParent =
    student && picked?.studentId === student.id ? picked.parent : null;
  /* a different existing parent is picked — its details are shown locked and sent as parentId only */
  const relinksParent = otherParent !== null;

  /* restore the parent fields (except the name) from the student's saved data */
  const restoreParentFields = () => {
    if (!student) return;
    const saved = getDefaultValues(student);
    (
      [
        "parentRelationship",
        "parentPhone",
        "parentEmail",
      ] as const
    ).forEach((key) => setValue(key, saved[key]));
  };

  const pickParent = (parent: ParentOption) => {
    if (!student) return;
    if (parent.id === student.parentId) {
      setPicked(null);
      restoreParentFields();
      return;
    }
    setPicked({ studentId: student.id, parent });
    setValue("parentRelationship", "");
    setValue("parentPhone", parent.phone ?? "");
    setValue("parentEmail", parent.email ?? "");
  };

  /* name typed away from the picked parent: go back to the student's own parent */
  const unpickParent = () => {
    setPicked(null);
    restoreParentFields();
  };

  /* re-fill form whenever a different student is opened */
  useEffect(() => {
    if (student) {
      reset(getDefaultValues(student));
    }
  }, [student, reset]);

  /* admin picks the managing tutor; the class picker then lists that tutor's classes */
  const { data: tutorsRaw } = useAdminTutors(
    { page: 1, limit: 100 },
    open && isAdmin,
  );
  const tutorOptions = useMemo(
    () =>
      (tutorsRaw?.tutors ?? []).map((t) => ({
        label: currentPersonName(t.firstName, t.lastName) || t.email || "",
        value: t.id,
      })),
    [tutorsRaw],
  );
  const selectedTutorId = watch("tutorId") ?? "";

  /* classes for the class picker (admin: only the selected tutor's classes) */
  const queryClient = useQueryClient();
  const classActions = useClassActions({
    list: { limit: 100, ...(isAdmin ? { tutorId: selectedTutorId } : {}) },
    listOptions: { enabled: open && (!isAdmin || !!selectedTutorId) },
  });
  const { data: classesRaw, isPending: classesPending } = classActions.list;
  const { enrollStudents, removeStudent } = classActions;

  const managedClasses = useMemo(
    () => (classesRaw?.classes ?? []) as ClassOption[],
    [classesRaw],
  );

  const classOptions = useMemo(() => {
    const classes = managedClasses;
    return [
      { label: copy.editDialog.classNoneOption, value: "" },
      ...classes.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    ];
  }, [managedClasses, copy]);

  /* mutation */
  const updateStudent = usePut<unknown, UpdateStudentPayload>(
    (payload) => `/students/${payload.id}`,
  );

  const onSubmit = (values: FormValues) => {
    if (!student) return;

    const payload: UpdateStudentPayload = {
      id: student.id,
      lastName: values.lastName.trim(),
      firstName: values.firstName.trim(),
      tutorId:
        isAdmin && values.tutorId && values.tutorId !== student.tutorId
          ? values.tutorId
          : undefined,
      studentPhone: values.studentPhone?.trim() || undefined,
      gender: values.gender,
      birthday: values.birthday
        ? new Date(values.birthday).toISOString()
        : undefined,
      school: values.school?.trim() || undefined,
      address: values.address?.trim() || undefined,
      district: values.district?.trim() || undefined,
      province: values.province?.trim() || undefined,
      ...(otherParent
        ? { parentId: otherParent.id }
        : {
            parentLastName: values.parentLastName?.trim() || undefined,
            parentFirstName: values.parentFirstName?.trim() || undefined,
            parentPhone: values.parentPhone?.trim() || undefined,
            parentEmail: values.parentEmail?.trim() || undefined,
            parentRelationship: values.parentRelationship || undefined,
          }),
    };

    updateStudent.mutate(payload, {
      onSuccess: async (raw) => {
        unwrapApiData(raw);
        // `PUT /students/:id` does not touch class enrolment (it lives in tutor-service), so apply
        // the picker's change with the class endpoints: enrol into the new class first (a failure —
        // full class, another tutor's student — leaves the old enrolment intact), then drop the old.
        const oldClassId = student.classId ?? "";
        const newClassId = values.classId ?? "";
        if (newClassId !== oldClassId) {
          try {
            if (newClassId) {
              await enrollStudents.mutateAsync({ classId: newClassId, studentIds: [student.id] });
            }
            if (oldClassId) {
              await removeStudent.mutateAsync({ classId: oldClassId, studentId: student.id });
            }
            void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
          } catch (error) {
            // student details are saved; keep the dialog open so the class can be changed again
            toast.error(getErrorMessage(error, copy.editDialog.toastErrorFallback));
            onSaved();
            return;
          }
        }
        toast.success(copy.editDialog.toastSuccess);
        onSaved();
        onClose();
      },
      // 422 → underline đúng ô; còn lại (trùng mã, lỗi server...) → toast với nội dung BE.
      onError: (error) =>
        showFormApiError<FormValues>(
          error,
          setError,
          STUDENT_FORM_FIELDS,
          copy.editDialog.toastErrorFallback,
        ),
    });
  };

  const isPending =
    updateStudent.isPending || enrollStudents.isPending || removeStudent.isPending;
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
            {/* Họ */}
            <Field
              label={copy.editDialog.lastNameLabel}
              required
              error={errors.lastName?.message}
            >
              <Input
                {...register("lastName")}
                placeholder={copy.editDialog.lastNamePlaceholder}
                autoFocus
                invalid={!!errors.lastName}
                disabled={isPending}
              />
            </Field>

            {/* Tên */}
            <Field
              label={copy.editDialog.firstNameLabel}
              required
              error={errors.firstName?.message}
            >
              <Input
                {...register("firstName")}
                placeholder={copy.editDialog.firstNamePlaceholder}
                invalid={!!errors.firstName}
                disabled={isPending}
              />
            </Field>

            {/* Lớp học — gia sư tự chọn; admin chọn trong mục "lớp gia sư đang quản lý" bên dưới */}
            {!isAdmin && (
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
            )}

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
              <Controller
                name="birthday"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    invalid={!!errors.birthday}
                    disabled={isPending}
                  />
                )}
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

            {/* Gia sư quản lý — chỉ ADMIN */}
            {isAdmin && (
              <div className="sm:col-span-2">
                <Field
                  label={copy.editDialog.tutorLabel}
                  error={errors.tutorId?.message}
                >
                  <Controller
                    name="tutorId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={tutorOptions}
                        value={field.value ?? ""}
                        onValueChange={(v) => {
                          field.onChange(v);
                          // Lớp thuộc gia sư cũ không còn hợp lệ.
                          if (v !== field.value) setValue("classId", "");
                        }}
                        placeholder={copy.editDialog.tutorPlaceholder}
                        disabled={isPending}
                        invalid={!!errors.tutorId}
                      />
                    )}
                  />
                </Field>
              </div>
            )}

            {/* Lớp của gia sư đang quản lý — chỉ ADMIN: chưa chọn gia sư / chưa có lớp / chọn lớp */}
            {isAdmin && (
              <div className="sm:col-span-2">
                <Field
                  label={copy.editDialog.managedClassesLabel}
                  error={errors.classId?.message}
                >
                  {!selectedTutorId ? (
                    <p className="text-sm text-muted-foreground">
                      {copy.editDialog.managedClassesSelectTutor}
                    </p>
                  ) : classesPending ? (
                    <p className="text-sm text-muted-foreground">
                      {common.actions.loading}
                    </p>
                  ) : managedClasses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {copy.editDialog.managedClassesEmpty}
                    </p>
                  ) : (
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
                  )}
                </Field>
              </div>
            )}
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

          {/* Họ và tên phụ huynh — gõ để tìm phụ huynh có sẵn. Re-linking is an admin action like the
              other parent edits (BE PUT /students is ADMIN-only). */}
          <Controller
            name="parentLastName"
            control={control}
            render={({ field: last }) => (
              <Controller
                name="parentFirstName"
                control={control}
                render={({ field: first }) => (
                  <ParentPicker
                    label=""
                    placeholder=""
                    split={{
                      lastName: last.value ?? "",
                      firstName: first.value ?? "",
                      onLastNameChange: last.onChange,
                      onFirstNameChange: first.onChange,
                      lastLabel: copy.editDialog.parentLastNameLabel,
                      firstLabel: copy.editDialog.parentFirstNameLabel,
                      lastPlaceholder: copy.editDialog.parentLastNamePlaceholder,
                      firstPlaceholder: copy.editDialog.parentFirstNamePlaceholder,
                    }}
                    linked={otherParent}
                    onLink={pickParent}
                    onUnlink={unpickParent}
                    hideSuggestions
                    disabled={isPending || isTutor || relinksParent}
                  />
                )}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    disabled={isPending || isTutor || relinksParent}
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
                disabled={isPending || isTutor || relinksParent}
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
                disabled={isPending || isTutor || relinksParent}
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
