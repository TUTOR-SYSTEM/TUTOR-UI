"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Laptop,
  Loader2,
  MapPin,
  Pencil,
  Save,
  Search,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { SUBJECT_OPTIONS as SUBJECT_NAMES } from "@/lib/subjects";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { DatePicker } from "@/components/ui/date-picker.ui";
import { Label } from "@/components/ui/label.ui";
import { Select } from "@/components/ui/select.ui";
import { useGet, usePut } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import { useClassFormCopy } from "@/hooks/useClassFormCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useAllClassesCopy } from "@/hooks/useAllClassesCopy.hook";
import { useAdminTutors } from "@/hooks/useAdminUsers.hook";
import { useAuthStore } from "@/zustand/auth.store";
import { currentPersonName } from "@/lib/format/person-name";
import { FieldError } from "../components/field-error";
import type {
  ApiStudent,
  CurriculumFramework,
  StudentsApiPayload,
  ClassesProps,
  ClassFormat,
  FormState,
} from "@/types";
import { CURRICULUM_QUERY_KEY } from "@/lib/services/curriculum.service";
import { formatThousands, stripThousands } from "@/lib/format/money";
import {
  StudentSearchDropdown,
  studentDisplayName,
} from "@/components/classes/components/student-search-dropdown";
import { invalidateClassRelatedQueries } from "@/lib/services/class.service";

/* ─── Constants (match create-class-modal) ─── */

const BRAND = "#0E9F8E";

/* ─── Helpers ─── */

const toDateInput = (iso: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

/* ─── Props ─── */

function getInitialState(item: ClassesProps["classItem"]): FormState {
  const fmt = (
    item?.format === "OFFLINE" ? "OFFLINE" : "ONLINE"
  ) as ClassFormat;
  const loc = item?.location ?? "";
  return {
    name: item?.name ?? "",
    tutorId: item?.tutorId ?? "",
    subject: item?.subject ?? "",
    feePerSession: item?.feePerSession ?? 0,
    description: item?.description ?? "",
    status: item?.status ?? "OPEN",
    curriculumId: item?.curriculumId ?? "",
    format: fmt,
    onlineLocation: fmt === "ONLINE" ? loc : "",
    offlineLocation: fmt === "OFFLINE" ? loc : "",
    startDate: toDateInput(item?.startTime ?? ""),
    endDate: toDateInput(item?.endTime ?? ""),
  };
}

/* ─── Component ─── */

export function EditClassDialog({ classItem, onClose }: ClassesProps) {
  const copy = useClassFormCopy();
  const commonCopy = useCommonCopy();
  const role = useCurrentUserRole();
  const currentUserId = useCurrentUserId();
  const authUser = useAuthStore((s) => s.user);
  const allClassesCopy = useAllClassesCopy();
  const open = classItem !== null;

  // Gia sư quản lý: ADMIN xem được danh sách tutor; TUTOR chỉ thấy lớp của mình nên
  // khi thiếu tutorId thì chính là người đang đăng nhập.
  const managingTutorId =
    classItem?.tutorId ?? (role === "TUTOR" ? currentUserId : null);
  const { data: tutorsRaw } = useAdminTutors(
    { page: 1, limit: 100 },
    open && role === "ADMIN",
  );
  const managingTutorName = useMemo(() => {
    if (!managingTutorId) return "";
    if (managingTutorId === currentUserId && authUser) {
      return (
        currentPersonName(authUser.firstName, authUser.lastName) ||
        authUser.email ||
        ""
      );
    }
    const tutor = tutorsRaw?.tutors?.find((t) => t.id === managingTutorId);
    return tutor
      ? currentPersonName(tutor.firstName, tutor.lastName) || tutor.email || ""
      : "";
  }, [managingTutorId, currentUserId, authUser, tutorsRaw]);
  const tutorOptions = useMemo(
    () =>
      (tutorsRaw?.tutors ?? []).map((t) => ({
        label: currentPersonName(t.firstName, t.lastName) || t.email || "",
        value: t.id,
      })),
    [tutorsRaw],
  );
  const queryClient = useQueryClient();
  const prevClassItemRef = useRef(classItem);

  const STATUS_OPTIONS = [
    { label: copy.edit.statusOpen, value: "OPEN" },
    { label: copy.edit.statusClosed, value: "CLOSED" },
    { label: copy.edit.statusUpcoming, value: "UPCOMING" },
  ];

  const [form, setForm] = useState<FormState>(getInitialState(classItem));
  const [feeInput, setFeeInput] = useState(
    classItem ? formatThousands(String(classItem.feePerSession)) : "",
  );
  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  // Môn đã lưu của lớp (có thể là tên cũ) vẫn phải hiện đúng, nên thêm vào danh sách nếu lạ.
  const subjectOptions = useMemo(() => {
    const base = SUBJECT_NAMES.map((s) => ({ label: s, value: s }));
    const current = form.subject;
    return current &&
      !SUBJECT_NAMES.includes(current as (typeof SUBJECT_NAMES)[number])
      ? [{ label: current, value: current }, ...base]
      : base;
  }, [form.subject]);
  const [studentIdsOverride, setStudentIdsOverride] = useState<string[] | null>(
    null,
  );
  const [teachingType, setTeachingType] = useState<"1-1" | "group">(
    classItem?.maxStudents === 1 ? "1-1" : "group",
  );
  const [studentSearch, setStudentSearch] = useState("");

  /* sync when classItem changes */
  useEffect(() => {
    if (classItem && classItem !== prevClassItemRef.current) {
      const init = getInitialState(classItem);
      setForm(init);
      setFeeInput(formatThousands(String(classItem.feePerSession)));
      setCurriculumSearch("");
      setStudentSearch("");
      setStudentIdsOverride(null);
      setTeachingType(classItem.maxStudents === 1 ? "1-1" : "group");
      setErrors({});
    }
    prevClassItemRef.current = classItem;
  }, [classItem]);

  /* keyboard */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* curriculum fetch */
  const { data: frameworksRaw, isLoading: frameworksLoading } = useGet<unknown>(
    [...CURRICULUM_QUERY_KEY, "frameworks"],
    "/curriculum",
    { enabled: open },
  );

  const frameworks = useMemo<CurriculumFramework[]>(() => {
    if (!frameworksRaw) return [];
    const unwrapped = unwrapApiData<
      | CurriculumFramework[]
      | { data: CurriculumFramework[] }
      | { curriculums: CurriculumFramework[] }
    >(frameworksRaw);
    if (!unwrapped) return [];
    if (Array.isArray(unwrapped)) return unwrapped;
    if ("curriculums" in unwrapped && Array.isArray(unwrapped.curriculums))
      return unwrapped.curriculums;
    if ("data" in unwrapped && Array.isArray(unwrapped.data))
      return unwrapped.data;
    return [];
  }, [frameworksRaw]);

  const filteredFrameworks = useMemo(() => {
    const q = curriculumSearch.trim().toLowerCase();
    if (!q) return [];
    return frameworks.filter((fw) =>
      [fw.subject, fw.grade, fw.code, fw.courseTime]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [frameworks, curriculumSearch]);

  const selectedFramework = useMemo(
    () => frameworks.find((fw) => fw.id === form.curriculumId) ?? null,
    [frameworks, form.curriculumId],
  );

  /* students fetch — current class members (to pre-select) */
  const { data: currentStudentsData } = useGet<unknown, ApiStudent[]>(
    ["class-students-edit", classItem?.id ?? ""],
    `/classes/${classItem?.id}/students`,
    {
      enabled: open && !!classItem?.id,
      select: (raw) => unwrapApiData<ApiStudent[]>(raw),
    },
  );

  /* students fetch — all available students (for picker).
   * Gateway `GET /students` is ADMIN-only; other roles can only pick from the
   * current class members (no new students can be added). */
  const canListAllStudents = role === "ADMIN";
  const { data: studentsPayload, isLoading: studentsLoadingAll } = useGet<
    unknown,
    StudentsApiPayload
  >(["edit-class-students", studentSearch], "/students", {
    params: {
      limit: 100,
      ...(studentSearch.trim() ? { search: studentSearch.trim() } : {}),
    },
    enabled: open && canListAllStudents,
    select: (raw) => unwrapApiData<StudentsApiPayload>(raw),
  });
  const studentsLoading = canListAllStudents
    ? studentsLoadingAll
    : !currentStudentsData;

  const allStudents = useMemo(
    () =>
      canListAllStudents
        ? (studentsPayload?.students ?? [])
        : (currentStudentsData ?? []),
    [canListAllStudents, studentsPayload, currentStudentsData],
  );

  /* tên học sinh theo id (cho chip đã chọn) */
  const studentNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of [...(currentStudentsData ?? []), ...allStudents]) {
      map[s.id] = studentDisplayName(s, copy.common.studentFallbackName);
    }
    return map;
  }, [currentStudentsData, allStudents, copy.common.studentFallbackName]);

  /* derive selected IDs — use override when user has made changes, else fall back to fetched */
  const selectedStudentIds =
    studentIdsOverride ?? currentStudentsData?.map((s) => s.id) ?? [];
  const maxStudents = teachingType === "1-1" ? 1 : 10;

  const handleTeachingTypeChange = (value: "1-1" | "group") => {
    setTeachingType(value);
    if (value === "1-1") {
      const current =
        studentIdsOverride ?? currentStudentsData?.map((s) => s.id) ?? [];
      // Từ nhóm (2+ hs) sang 1 kèm 1: xóa hết lựa chọn cũ để chọn lại.
      setStudentIdsOverride(current.length > 1 ? [] : current);
    }
  };

  const toggleStudent = (id: string) => {
    setStudentIdsOverride((prev) => {
      const current = prev ?? currentStudentsData?.map((s) => s.id) ?? [];
      if (current.includes(id)) return current.filter((s) => s !== id);
      if (teachingType === "1-1") return [id];
      if (current.length >= maxStudents) return current;
      return [...current, id];
    });
  };

  /* submit */
  const { mutate, isPending: loading } = usePut<
    unknown,
    Record<string, unknown>
  >((payload) => `/classes/${payload.id}`, {
    onSuccess: () => {
      void invalidateClassRelatedQueries(queryClient);
      toast.success(copy.edit.toastSuccess);
      onClose();
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, copy.edit.toastErrorFallback)),
  });

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = copy.common.classNameError;
    if (!form.subject) e.subject = copy.common.subjectError;
    if (form.feePerSession <= 0) e.feePerSession = copy.common.feeRequiredError;
    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) < new Date(form.startDate)
    )
      e.endDate = copy.common.endDateBeforeStartError;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = () => {
    if (!classItem || !validate()) return;
    const location = (
      form.format === "ONLINE" ? form.onlineLocation : form.offlineLocation
    ).trim();
    // Roster chỉ gửi khi đã tải xong: nếu chưa có danh sách, gửi `studentIds: []` sẽ xoá hết học sinh.
    const rosterReady = studentIdsOverride !== null || currentStudentsData !== undefined;
    mutate({
      id: classItem.id,
      name: form.name.trim(),
      subject: form.subject,
      tuition: form.feePerSession,
      // `null` xoá giá trị cũ; `undefined` sẽ bị BE coi là giữ nguyên.
      description: form.description.trim() || null,
      status: form.status,
      format: form.format,
      location: location || null,
      maxStudents: teachingType === "1-1" ? 1 : 10,
      // Admin không quản lý chương trình học ở popup này — không gửi để giữ nguyên giá trị hiện có.
      ...(role === "ADMIN"
        ? form.tutorId && form.tutorId !== classItem.tutorId
          ? { tutorId: form.tutorId }
          : {}
        : { curriculumId: form.curriculumId || null }),
      startTime: form.startDate
        ? new Date(form.startDate).toISOString()
        : undefined,
      endTime: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      ...(rosterReady ? { studentIds: selectedStudentIds } : {}),
    });
  };

  if (!open) return null;

  return (
    <Dialog
      isOpen={open}
      icon={Pencil}
      title={copy.edit.title}
      subtitle={copy.edit.subtitle}
      className="w-175 max-w-[calc(100vw-2rem)]"
      cancelText={commonCopy.actions.cancel}
      onCancel={onClose}
      submitText={loading ? copy.edit.saving : copy.edit.saveChanges}
      submitIcon={Save}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="space-y-6">
        {/* Gia sư quản lý: ADMIN đổi được; TUTOR chỉ xem */}
        <div className="space-y-1.5">
          <Label>{allClassesCopy.addDialog.tutorLabel}</Label>
          {role === "ADMIN" ? (
            <Select
              options={tutorOptions}
              value={form.tutorId}
              onValueChange={(v) => update("tutorId", v)}
              placeholder={managingTutorName || allClassesCopy.unknownTutor}
            />
          ) : (
            <Input
              value={managingTutorName || allClassesCopy.unknownTutor}
              disabled
              readOnly
            />
          )}
        </div>

        {/* Name + Subject */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              {copy.common.classNameLabel}{" "}
              <span className="text-red-400">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => {
                update("name", e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder={copy.common.classNamePlaceholder}
              invalid={!!errors.name}
            />
            <FieldError msg={errors.name} />
          </div>

          <div className="space-y-1.5">
            <Label>
              {copy.common.subjectLabel} <span className="text-red-400">*</span>
            </Label>
            <Select
              value={form.subject}
              onValueChange={(v) => {
                update("subject", v);
                setErrors((p) => ({ ...p, subject: "" }));
              }}
              options={subjectOptions}
              placeholder={copy.common.subjectPlaceholder}
              invalid={!!errors.subject}
            />
            <FieldError msg={errors.subject} />
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>{copy.create.step2.formatLabel}</Label>
          <p className="text-xs text-[#9AAEA9] dark:text-muted-foreground">{copy.edit.formatHint}</p>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  value: "ONLINE" as ClassFormat,
                  title: copy.common.formatOnlineTitle,
                  desc: copy.common.formatOnlineDesc,
                  icon: Laptop,
                },
                {
                  value: "OFFLINE" as ClassFormat,
                  title: copy.common.formatOfflineTitle,
                  desc: copy.common.formatOfflineDesc,
                  icon: MapPin,
                },
              ] as const
            ).map((opt) => {
              const isOnline = opt.value === "ONLINE";
              const locationValue = isOnline
                ? form.onlineLocation
                : form.offlineLocation;
              const setLocationField = isOnline
                ? "onlineLocation"
                : "offlineLocation";
              const selected = form.format === opt.value;
              return (
                <div
                  key={opt.value}
                  className={cn(
                    "rounded-xl border-2 p-4 transition-all",
                    selected
                      ? "border-[#0E9F8E] bg-[#E4F6EF] dark:bg-primary-light"
                      : "border-[#E7EEEC] dark:border-border bg-white dark:bg-card hover:border-[#0E9F8E]/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => update("format", opt.value)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <opt.icon
                      className="size-5 shrink-0"
                      style={{ color: selected ? BRAND : "#9AAEA9" }}
                    />
                    <div>
                      <span
                        className="block text-sm font-semibold"
                        style={{ color: selected ? BRAND : "#16302b" }}
                      >
                        {opt.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#9AAEA9] dark:text-muted-foreground">
                        {opt.desc}
                      </span>
                    </div>
                  </button>

                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9AAEA9] dark:text-muted-foreground">
                      {isOnline
                        ? copy.common.onlineLocationLabel
                        : copy.common.offlineLocationLabel}
                    </p>
                    <Input
                      type="text"
                      value={locationValue}
                      onChange={(e) =>
                        update(
                          setLocationField as keyof FormState,
                          e.target.value as FormState[keyof FormState],
                        )
                      }
                      placeholder={
                        isOnline
                          ? copy.common.onlineLocationPlaceholder
                          : copy.common.offlineLocationPlaceholder
                      }
                      className="h-10"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curriculum (hidden for ADMIN) */}
        {role !== "ADMIN" && (
          <div className="space-y-2">
            <Label>{copy.common.curriculumLabel}</Label>
            <p className="text-xs text-[#9AAEA9] dark:text-muted-foreground">
              {copy.common.curriculumHint}
            </p>

            {selectedFramework ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#0E9F8E] bg-[#E4F6EF] dark:bg-primary-light px-4 py-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: BRAND }}
                >
                  <BookOpen className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#16302b] dark:text-foreground">
                    {selectedFramework.subject}
                    {selectedFramework.grade
                      ? copy.common.curriculumGradeSuffix(
                          selectedFramework.grade,
                        )
                      : ""}
                  </span>
                  <span className="block truncate text-xs text-[#9AAEA9] dark:text-muted-foreground">
                    {copy.common.curriculumCodeLine(
                      selectedFramework.code,
                      selectedFramework.courseTime,
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    update("curriculumId", "");
                    setCurriculumSearch("");
                  }}
                  aria-label={copy.common.curriculumDeselectAriaLabel}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#9AAEA9] dark:text-muted-foreground transition-colors hover:bg-white dark:hover:bg-card hover:text-red-500"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9AAEA9] dark:text-muted-foreground" />
                  <Input
                    value={curriculumSearch}
                    onChange={(e) => setCurriculumSearch(e.target.value)}
                    placeholder={copy.common.curriculumSearchPlaceholder}
                    className="pl-10"
                  />
                </div>

                {curriculumSearch.trim() && (
                  <div className="scrollbar-thin max-h-50 overflow-y-auto rounded-xl border border-[#E7EEEC] dark:border-border">
                    {frameworksLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-5 animate-spin text-[#9AAEA9] dark:text-muted-foreground" />
                      </div>
                    ) : filteredFrameworks.length === 0 ? (
                      <div className="py-6 text-center text-sm text-[#9AAEA9] dark:text-muted-foreground">
                        {copy.common.curriculumNoResults}
                      </div>
                    ) : (
                      <div className="divide-y divide-[#E7EEEC] dark:divide-border">
                        {filteredFrameworks.map((fw) => (
                          <button
                            key={fw.id}
                            type="button"
                            onClick={() => {
                              update("curriculumId", fw.id);
                              setCurriculumSearch("");
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F3F7F5] dark:hover:bg-muted"
                          >
                            <span
                              className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
                              style={{ background: "#9AAEA9" }}
                            >
                              <BookOpen className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-[#16302b] dark:text-foreground">
                                {fw.subject}
                                {fw.grade
                                  ? copy.common.curriculumGradeSuffix(fw.grade)
                                  : ""}
                              </span>
                              <span className="block truncate text-xs text-[#9AAEA9] dark:text-muted-foreground">
                                {copy.common.curriculumCodeLine(
                                  fw.code,
                                  fw.courseTime,
                                )}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Start + End date */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{copy.common.startDateLabel}</Label>
            <DatePicker
              value={form.startDate}
              onValueChange={(v) => {
                update("startDate", v);
                setErrors((p) => ({ ...p, startDate: "" }));
              }}
              invalid={!!errors.startDate}
            />
            <FieldError msg={errors.startDate} />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.common.endDateLabel}</Label>
            <DatePicker
              value={form.endDate}
              onValueChange={(v) => {
                update("endDate", v);
                setErrors((p) => ({ ...p, endDate: "" }));
              }}
              invalid={!!errors.endDate}
            />
            <FieldError msg={errors.endDate} />
          </div>
        </div>

        {/* Fee + Status */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              {copy.edit.feeLabel} <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={feeInput}
                inputMode="numeric"
                onChange={(e) => {
                  const raw = stripThousands(e.target.value);
                  setFeeInput(formatThousands(raw));
                  update("feePerSession", raw ? Number(raw) : 0);
                  setErrors((p) => ({ ...p, feePerSession: "" }));
                }}
                placeholder={copy.common.feePlaceholder}
                className="pr-8"
                invalid={!!errors.feePerSession}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9AAEA9] dark:text-muted-foreground">
                {copy.common.feeCurrencySuffix}
              </span>
            </div>
            <FieldError msg={errors.feePerSession} />
          </div>

          <div className="space-y-1.5">
            <Label>{copy.edit.statusLabel}</Label>
            <Select
              value={form.status}
              onValueChange={(v) => update("status", v)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>{copy.edit.descriptionLabel}</Label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder={copy.common.descriptionPlaceholder}
            className="w-full resize-none rounded-lg border border-[#E7EEEC] dark:border-border bg-white dark:bg-card px-3 py-2.5 text-sm text-[#16302b] dark:text-foreground outline-none placeholder:text-[#9AAEA9] focus:border-[#0E9F8E] focus:ring-2 focus:ring-[#0E9F8E]/30 transition-colors"
          />
        </div>

        {/* Students */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-4" style={{ color: BRAND }} />
              <Label>{copy.edit.studentsLabel}</Label>
            </div>
            <p className="mt-0.5 text-xs text-[#9AAEA9] dark:text-muted-foreground">
              {teachingType === "1-1"
                ? copy.common.studentsHintSingle
                : copy.common.studentsHintGroup(
                    maxStudents,
                    selectedStudentIds.length,
                  )}
            </p>
          </div>

          {/* Teaching type toggle */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  value: "1-1" as const,
                  title: copy.common.teachingType1on1Title,
                  desc: copy.common.teachingType1on1Desc,
                },
                {
                  value: "group" as const,
                  title: copy.common.teachingTypeGroupTitle,
                  desc: copy.common.teachingTypeGroupDesc,
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTeachingTypeChange(opt.value)}
                className={cn(
                  "flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all",
                  teachingType === opt.value
                    ? "border-[#0E9F8E] bg-[#E4F6EF] dark:bg-primary-light"
                    : "border-[#E7EEEC] dark:border-border bg-white dark:bg-card hover:border-[#0E9F8E]/40",
                )}
              >
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: teachingType === opt.value ? BRAND : "#16302b",
                  }}
                >
                  {opt.title}
                </span>
                <span className="mt-0.5 text-xs text-[#9AAEA9] dark:text-muted-foreground">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>

          <StudentSearchDropdown
            search={studentSearch}
            onSearchChange={setStudentSearch}
            students={allStudents}
            loading={studentsLoading}
            selectedIds={selectedStudentIds}
            names={studentNames}
            max={maxStudents}
            multi={teachingType === "group"}
            onToggle={(s) => toggleStudent(s.id)}
            onRemove={(id) => toggleStudent(id)}
            placeholder={copy.common.studentsSearchPlaceholder}
            noResultsText={copy.common.studentsNoResults}
            fallbackName={copy.common.studentFallbackName}
          />
        </div>
      </div>
    </Dialog>
  );
}
