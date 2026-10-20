"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
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
import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { Select } from "@/components/ui/select.ui";
import { useGet, usePut } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import { useClassFormCopy } from "@/hooks/useClassFormCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
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

/* ─── Constants (match create-class-modal) ─── */

const BRAND = "#0E9F8E";

const SUBJECTS = ["Toán", "Văn", "Anh", "Lý", "Hóa", "Sinh"];
const SUBJECT_OPTIONS = SUBJECTS.map((s) => ({ label: s, value: s }));

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
  const open = classItem !== null;
  const queryClient = useQueryClient();
  const prevClassItemRef = useRef(classItem);

  const STATUS_OPTIONS = [
    { label: copy.edit.statusOpen, value: "OPEN" },
    { label: copy.edit.statusClosed, value: "CLOSED" },
    { label: copy.edit.statusUpcoming, value: "UPCOMING" },
  ];

  const [form, setForm] = useState<FormState>(getInitialState(classItem));
  const [feeInput, setFeeInput] = useState(
    classItem ? String(classItem.feePerSession) : "0",
  );
  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [studentIdsOverride, setStudentIdsOverride] = useState<string[] | null>(
    null,
  );
  const [teachingType, setTeachingType] = useState<"1-1" | "group">("group");
  const [studentSearch, setStudentSearch] = useState("");

  /* sync when classItem changes */
  useEffect(() => {
    if (classItem && classItem !== prevClassItemRef.current) {
      const init = getInitialState(classItem);
      setForm(init);
      setFeeInput(String(classItem.feePerSession));
      setCurriculumSearch("");
      setStudentSearch("");
      setStudentIdsOverride(null);
      setTeachingType("group");
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

  /* derive selected IDs — use override when user has made changes, else fall back to fetched */
  const selectedStudentIds =
    studentIdsOverride ?? currentStudentsData?.map((s) => s.id) ?? [];
  const maxStudents = teachingType === "1-1" ? 1 : 10;

  const handleTeachingTypeChange = (value: "1-1" | "group") => {
    setTeachingType(value);
    if (value === "1-1") {
      const current =
        studentIdsOverride ?? currentStudentsData?.map((s) => s.id) ?? [];
      setStudentIdsOverride(current.slice(0, 1));
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
      queryClient.invalidateQueries({ queryKey: ["classes", "list"] });
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
      new Date(form.endDate) <= new Date(form.startDate)
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
    mutate({
      id: classItem.id,
      name: form.name.trim(),
      subject: form.subject,
      tuition: form.feePerSession,
      description: form.description.trim() || undefined,
      status: form.status,
      format: form.format,
      location: location || undefined,
      curriculumId: form.curriculumId || undefined,
      startTime: form.startDate
        ? new Date(form.startDate).toISOString()
        : undefined,
      endTime: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      studentIds: selectedStudentIds,
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
              options={SUBJECT_OPTIONS}
              placeholder={copy.common.subjectPlaceholder}
              invalid={!!errors.subject}
            />
            <FieldError msg={errors.subject} />
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>{copy.create.step2.formatLabel}</Label>
          <p className="text-xs text-[#9AAEA9]">{copy.edit.formatHint}</p>
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
                      ? "border-[#0E9F8E] bg-[#E4F6EF]"
                      : "border-[#E7EEEC] bg-white hover:border-[#0E9F8E]/40",
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
                      <span className="mt-0.5 block text-xs text-[#9AAEA9]">
                        {opt.desc}
                      </span>
                    </div>
                  </button>

                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9AAEA9]">
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
                      className="h-9"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curriculum */}
        <div className="space-y-2">
          <Label>{copy.common.curriculumLabel}</Label>
          <p className="text-xs text-[#9AAEA9]">{copy.common.curriculumHint}</p>

          {selectedFramework ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#0E9F8E] bg-[#E4F6EF] px-4 py-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
                style={{ background: BRAND }}
              >
                <BookOpen className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#16302b]">
                  {selectedFramework.subject}
                  {selectedFramework.grade
                    ? copy.common.curriculumGradeSuffix(selectedFramework.grade)
                    : ""}
                </span>
                <span className="block truncate text-xs text-[#9AAEA9]">
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
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#9AAEA9] transition-colors hover:bg-white hover:text-red-500"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9AAEA9]" />
                <Input
                  value={curriculumSearch}
                  onChange={(e) => setCurriculumSearch(e.target.value)}
                  placeholder={copy.common.curriculumSearchPlaceholder}
                  className="pl-10"
                />
              </div>

              {curriculumSearch.trim() && (
                <div className="scrollbar-thin max-h-50 overflow-y-auto rounded-xl border border-[#E7EEEC]">
                  {frameworksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-[#9AAEA9]" />
                    </div>
                  ) : filteredFrameworks.length === 0 ? (
                    <div className="py-6 text-center text-sm text-[#9AAEA9]">
                      {copy.common.curriculumNoResults}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E7EEEC]">
                      {filteredFrameworks.map((fw) => (
                        <button
                          key={fw.id}
                          type="button"
                          onClick={() => {
                            update("curriculumId", fw.id);
                            setCurriculumSearch("");
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F3F7F5]"
                        >
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
                            style={{ background: "#9AAEA9" }}
                          >
                            <BookOpen className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-[#16302b]">
                              {fw.subject}
                              {fw.grade
                                ? copy.common.curriculumGradeSuffix(fw.grade)
                                : ""}
                            </span>
                            <span className="block truncate text-xs text-[#9AAEA9]">
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

        {/* Start + End date */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{copy.common.startDateLabel}</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => {
                update("startDate", e.target.value);
                setErrors((p) => ({ ...p, startDate: "" }));
              }}
              invalid={!!errors.startDate}
            />
            <FieldError msg={errors.startDate} />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.common.endDateLabel}</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => {
                update("endDate", e.target.value);
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
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setFeeInput(raw);
                  update("feePerSession", raw ? Number(raw) : 0);
                  setErrors((p) => ({ ...p, feePerSession: "" }));
                }}
                placeholder={copy.common.feePlaceholder}
                className="pr-8"
                invalid={!!errors.feePerSession}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9AAEA9]">
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
            className="w-full resize-none rounded-lg border border-[#E7EEEC] bg-white px-3 py-2.5 text-sm text-[#16302b] outline-none placeholder:text-[#9AAEA9] focus:border-[#0E9F8E] focus:ring-2 focus:ring-[#0E9F8E]/30 transition-colors"
          />
        </div>

        {/* Students */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-4" style={{ color: BRAND }} />
              <Label>{copy.edit.studentsLabel}</Label>
            </div>
            <p className="mt-0.5 text-xs text-[#9AAEA9]">
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
                    ? "border-[#0E9F8E] bg-[#E4F6EF]"
                    : "border-[#E7EEEC] bg-white hover:border-[#0E9F8E]/40",
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
                <span className="mt-0.5 text-xs text-[#9AAEA9]">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9AAEA9]" />
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder={copy.common.studentsSearchPlaceholder}
              className="pl-10"
            />
          </div>

          <div className="scrollbar-thin max-h-70 overflow-y-auto rounded-xl border border-[#E7EEEC]">
            {studentsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-[#9AAEA9]" />
              </div>
            ) : allStudents.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#9AAEA9]">
                {copy.common.studentsNoResults}
              </div>
            ) : (
              <div className="divide-y divide-[#E7EEEC]">
                {allStudents.map((s: ApiStudent) => {
                  const selected = selectedStudentIds.includes(s.id);
                  const fullName =
                    [s.lastName, s.firstName].filter(Boolean).join(" ") ||
                    s.username ||
                    copy.common.studentFallbackName;
                  const disabled =
                    !selected && selectedStudentIds.length >= maxStudents;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStudent(s.id)}
                      disabled={disabled}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                        selected ? "bg-[#E4F6EF]" : "hover:bg-[#F3F7F5]",
                        disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ background: selected ? BRAND : "#9AAEA9" }}
                      >
                        {fullName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[#16302b]">
                          {fullName}
                        </span>
                        {s.phone && (
                          <span className="block truncate text-xs text-[#9AAEA9]">
                            {s.phone}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center border-2 transition-colors",
                          teachingType === "group"
                            ? "rounded-md"
                            : "rounded-full",
                          selected
                            ? "border-[#0E9F8E] bg-[#0E9F8E]"
                            : "border-[#E7EEEC] bg-white",
                        )}
                      >
                        {selected && <Check className="size-3 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
