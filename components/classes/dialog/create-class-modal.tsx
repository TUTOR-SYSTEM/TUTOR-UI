"use client";

import { SUBJECT_OPTIONS as SUBJECT_NAMES } from "@/lib/subjects";
import { useEffect, useMemo, useState, startTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  ChevronRight,
  Laptop,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { DatePicker } from "@/components/ui/date-picker.ui";
import { Label } from "@/components/ui/label.ui";
import { Select } from "@/components/ui/select.ui";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useClassActions, invalidateClassRelatedQueries } from "@/lib/services/class.service";
import { useCurriculumActions } from "@/lib/services/curriculum.service";
import { useScheduleActions } from "@/lib/services/schedule.service";
import { useClassFormCopy } from "@/hooks/useClassFormCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { CreateClassStepper } from "../components/create-class-stepper";
import { FieldError } from "../components/field-error";
import type { CurriculumFramework } from "@/types";

/* ─── Types ─── */

type Step = 1 | 2 | 3;

type ScheduleFormat = "ONLINE" | "OFFLINE";

type ScheduleSlot = {
  /** A slot can repeat on more than one weekday at the same time (e.g. Mon & Thu 19:30) — one row expands into one backend schedule per selected day. */
  days: string[];
  startTime: string;
  duration: string;
  format: ScheduleFormat;
  location: string;
};

/* ─── Constants ─── */

const BRAND = "#0E9F8E";
const BRAND_LIGHT = "#E4F6EF";

const GRADES = [
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9",
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
];
const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DURATIONS = ["30 phút", "45 phút", "60 phút", "90 phút", "120 phút"];

const SUBJECT_CHOICES = SUBJECT_NAMES.map((s) => ({ label: s, value: s }));
const GRADE_OPTIONS = GRADES.map((g) => ({ label: g, value: g }));
const DURATION_OPTIONS = DURATIONS.map((d) => ({ label: d, value: d }));

/** UI weekday short codes → backend `dayOfWeek` enum. */
const DAY_TO_BACKEND: Record<string, string> = {
  T2: "MONDAY",
  T3: "TUESDAY",
  T4: "WEDNESDAY",
  T5: "THURSDAY",
  T6: "FRIDAY",
  T7: "SATURDAY",
  CN: "SUNDAY",
};

/* ─── Helpers ─── */

const currency = (v: number) =>
  v.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

const parseDurationMinutes = (duration: string) => parseInt(duration, 10) || 0;

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const total = ((h * 60 + m + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

/* ─── Modal ─── */

type CreateClassModalProps = { open: boolean; onClose: () => void };

export const CreateClassModal = ({ open, onClose }: CreateClassModalProps) => {
  const copy = useClassFormCopy();
  const commonCopy = useCommonCopy();
  const [step, setStep] = useState<Step>(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  /* form state */
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [teachingType, setTeachingType] = useState<"1-1" | "group">("1-1");
  const [description, setDescription] = useState("");
  const [classFormat, setClassFormat] = useState<ScheduleFormat>("ONLINE");
  const [onlineLocation, setOnlineLocation] = useState("");
  const [offlineLocation, setOfflineLocation] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([
    {
      days: [],
      startTime: "08:00",
      duration: "90 phút",
      format: "ONLINE",
      location: "",
    },
  ]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [feePerSession, setFeePerSession] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "session" | "week" | "month"
  >("session");

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const PAYMENT_OPTIONS = [
    { value: "session" as const, label: copy.create.step3.paymentSession },
    { value: "week" as const, label: copy.create.step3.paymentWeek },
    { value: "month" as const, label: copy.create.step3.paymentMonth },
  ];

  /* derived */
  const queryClient = useQueryClient();
  const { create, generateCode } = useClassActions({
    generateCodeOptions: { enabled: open, staleTime: 0 },
  });
  const { createBulk } = useScheduleActions();
  const tutorId = useCurrentUserId();

  const { data: generatedCode } = generateCode;
  const classCode = generatedCode || "---";

  const frameworksResult = useCurriculumActions({
    list: { limit: 100 },
    listOptions: { enabled: open },
  }).list;
  const frameworksData = frameworksResult.data;
  const frameworksLoading = frameworksResult.isLoading;
  const frameworks = useMemo<CurriculumFramework[]>(
    () => frameworksData ?? [],
    [frameworksData],
  );

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
    () => frameworks.find((fw) => fw.id === curriculumId) ?? null,
    [frameworks, curriculumId],
  );

  const selectedDays = schedules.flatMap((s) => s.days);
  // TODO: wire up real session-count/tuition calculation.
  const totalSessions = 0;
  const totalTuition = 0;

  const handleTeachingTypeChange = (value: "1-1" | "group") => {
    setTeachingType(value);
  };

  /* reset */
  useEffect(() => {
    if (!open) return;
    startTransition(() => {
      setStep(1);
      setShowSuccess(false);
      setClassName("");
      setSubject("");
      setGrade("");
      setTeachingType("1-1");
      setDescription("");
      setClassFormat("ONLINE");
      setOnlineLocation("");
      setOfflineLocation("");
      setCurriculumId("");
      setCurriculumSearch("");
      setSchedules([
        {
          days: [],
          startTime: "08:00",
          duration: "90 phút",
          format: "ONLINE" as ScheduleFormat,
          location: "",
        },
      ]);
      setStartDate("");
      setEndDate("");
      setFeePerSession(0);
      setPaymentMethod("session");
      setErrors({});
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, isSubmitting]);

  /* validation */
  const validate1 = () => {
    const e: typeof errors = {};
    if (!className.trim()) e.className = copy.common.classNameError;
    if (!subject) e.subject = copy.common.subjectError;
    if (!grade) e.grade = copy.create.step1.gradeError;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => {
    if (step === 1 && validate1()) setStep(2);
    else if (step === 2) {
      const defaultLocation =
        classFormat === "ONLINE" ? onlineLocation : offlineLocation;
      setSchedules((prev) =>
        prev.map((s) => ({
          ...s,
          format: classFormat,
          location: defaultLocation,
        })),
      );
      setStep(3);
    }
  };
  const handlePrev = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const validate3 = () => {
    const e: typeof errors = {};
    if (!schedules.some((s) => s.days.length > 0))
      e.schedule = copy.create.step3.scheduleRequiredError;
    if (!startDate) e.startDate = copy.create.step3.startDateRequiredError;
    if (!endDate) e.endDate = copy.create.step3.endDateRequiredError;
    if (
      startDate &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    )
      e.endDate = copy.common.endDateBeforeStartError;
    if (feePerSession <= 0) e.fee = copy.common.feeRequiredError;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleFinish = async () => {
    if (!validate3()) {
      toast.error(copy.create.toast.missingFields);
      return;
    }
    if (!tutorId || !generatedCode) {
      toast.error(copy.create.toast.createErrorFallback);
      return;
    }
    setIsSubmitting(true);
    try {
      const location = (
        classFormat === "ONLINE" ? onlineLocation : offlineLocation
      ).trim();
      const createdRaw = await create.mutateAsync({
        code: generatedCode,
        tutorId,
        name: className.trim(),
        subject,
        description: description.trim() || undefined,
        tuition: feePerSession,
        maxStudents: teachingType === "1-1" ? 1 : 10,
        format: classFormat,
        location: location || undefined,
        curriculumId: curriculumId || undefined,
        startTime: startDate ? new Date(startDate).toISOString() : undefined,
        endTime: endDate ? new Date(endDate).toISOString() : undefined,
      });
      const created = unwrapApiData<{ id: string }>(createdRaw);
      if (!created?.id) {
        toast.error(copy.create.toast.classIdMissing);
        return;
      }

      const scheduleItems = schedules.flatMap((slot) =>
        slot.days.map((day) => ({
          dayOfWeek: DAY_TO_BACKEND[day] ?? day,
          startTime: slot.startTime,
          endTime: addMinutes(slot.startTime, parseDurationMinutes(slot.duration)),
          format: slot.format,
          location: slot.location || undefined,
        })),
      );
      if (scheduleItems.length) {
        await createBulk.mutateAsync({
          classId: created.id,
          schedules: scheduleItems,
        });
      }

      void invalidateClassRelatedQueries(queryClient);
      toast.success(copy.create.toast.createSuccess);
      setShowSuccess(true);
    } catch (err) {
      toast.error(getErrorMessage(err, copy.create.toast.createErrorFallback));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* schedule handlers */
  const addSchedule = () =>
    setSchedules((p) => [
      ...p,
      {
        days: [],
        startTime: "08:00",
        duration: "90 phút",
        format: classFormat,
        location: (classFormat === "ONLINE"
          ? onlineLocation
          : offlineLocation
        ).trim(),
      },
    ]);
  const removeSchedule = (i: number) =>
    setSchedules((p) => p.filter((_, idx) => idx !== i));
  const updateSchedule = (
    i: number,
    f: Exclude<keyof ScheduleSlot, "days">,
    v: string,
  ) =>
    setSchedules((p) => p.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)));
  const toggleScheduleDay = (i: number, day: string) =>
    setSchedules((p) =>
      p.map((s, idx) =>
        idx === i
          ? {
              ...s,
              days: s.days.includes(day)
                ? s.days.filter((d) => d !== day)
                : [...s.days, day],
            }
          : s,
      ),
    );

  if (!open) return null;

  return (
    <Dialog
      isOpen={open}
      icon={Plus}
      title={copy.create.title}
      subtitle={copy.create.subtitle}
      className="w-225 max-w-[calc(100vw-2rem)]"
      cancelText={
        showSuccess ? copy.create.success.viewDetail : commonCopy.actions.cancel
      }
      onCancel={showSuccess ? onClose : handleClose}
      submitText={
        showSuccess
          ? copy.create.success.createFirstSession
          : step < 3
            ? copy.create.footer.next
            : isSubmitting
              ? copy.create.footer.finishing
              : copy.create.footer.finish
      }
      submitIcon={showSuccess ? undefined : step < 3 ? ChevronRight : Check}
      onSubmit={showSuccess ? onClose : step < 3 ? handleNext : handleFinish}
      loading={!showSuccess && isSubmitting}
    >
      {showSuccess ? (
        /* ── Success ── */
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="size-8 text-primary" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-foreground">
            {copy.create.success.title}
          </h3>
          <p className="text-foreground">
            {copy.create.success.messagePrefix}{" "}
            <span className="font-semibold">{className}</span>{" "}
            {copy.create.success.messageSuffix}
          </p>
        </div>
      ) : (
        <>
          {/* Stepper */}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isSubmitting}
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="size-4 rotate-180" />
                {commonCopy.actions.back}
              </button>
            )}
            <div className="flex-1 overflow-x-auto">
              <CreateClassStepper current={step} />
            </div>
          </div>

          {/* ── Step 1: Info ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Class name */}
                <div className="space-y-1.5">
                  <Label>
                    {copy.common.classNameLabel}{" "}
                    <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      setErrors((p) => ({ ...p, className: "" }));
                    }}
                    placeholder={copy.common.classNamePlaceholder}
                    invalid={!!errors.className}
                  />
                  <FieldError msg={errors.className} />
                </div>

                {/* Class code */}
                <div className="space-y-1.5">
                  <Label>{copy.create.step1.classCodeLabel}</Label>
                  <div className="relative">
                    <Input
                      value={classCode}
                      readOnly
                      className="cursor-default bg-[#F3F7F5] text-[#9AAEA9]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-[#E7EEEC] px-1.5 py-0.5 text-[10px] font-medium text-[#9AAEA9]">
                      {copy.create.step1.classCodeAuto}
                    </span>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label>
                    {copy.common.subjectLabel}{" "}
                    <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={subject}
                    onValueChange={(v) => {
                      setSubject(v);
                      setErrors((p) => ({ ...p, subject: "" }));
                    }}
                    options={SUBJECT_CHOICES}
                    placeholder={copy.common.subjectPlaceholder}
                    invalid={!!errors.subject}
                  />
                  <FieldError msg={errors.subject} />
                </div>

                {/* Grade */}
                <div className="space-y-1.5">
                  <Label>
                    {copy.create.step1.gradeLabel}{" "}
                    <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={grade}
                    onValueChange={(v) => {
                      setGrade(v);
                      setErrors((p) => ({ ...p, grade: "" }));
                    }}
                    options={GRADE_OPTIONS}
                    placeholder={copy.create.step1.gradePlaceholder}
                    invalid={!!errors.grade}
                  />
                  <FieldError msg={errors.grade} />
                </div>
              </div>

              {/* Teaching type */}
              <div className="space-y-2">
                <Label>{copy.create.step1.teachingTypeLabel}</Label>
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
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>{copy.create.step1.descriptionLabel}</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={copy.common.descriptionPlaceholder}
                  className="w-full resize-none rounded-lg border border-[#E7EEEC] bg-white px-3 py-2.5 text-sm text-[#16302b] outline-none placeholder:text-[#9AAEA9] focus:border-[#0E9F8E] focus:ring-2 focus:ring-[#0E9F8E]/30 transition-colors"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Format & Curriculum ── */}
          {step === 2 && (
            <div className="space-y-7">
              {/* Teaching format */}
              <div className="space-y-2">
                <Label>
                  {copy.create.step2.formatLabel}{" "}
                  <span className="text-red-400">*</span>
                </Label>
                <p className="text-xs text-[#9AAEA9]">
                  {copy.create.step2.formatHint}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: "ONLINE" as ScheduleFormat,
                        title: copy.common.formatOnlineTitle,
                        desc: copy.common.formatOnlineDesc,
                        icon: Laptop,
                      },
                      {
                        value: "OFFLINE" as ScheduleFormat,
                        title: copy.common.formatOfflineTitle,
                        desc: copy.common.formatOfflineDesc,
                        icon: MapPin,
                      },
                    ] as const
                  ).map((opt) => {
                    const isOnline = opt.value === "ONLINE";
                    const locationValue = isOnline
                      ? onlineLocation
                      : offlineLocation;
                    const setLocationValue = isOnline
                      ? setOnlineLocation
                      : setOfflineLocation;
                    const selected = classFormat === opt.value;
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
                          onClick={() => setClassFormat(opt.value)}
                          className="flex w-full items-start gap-3 text-left"
                        >
                          <opt.icon
                            className="size-5 shrink-0"
                            style={{
                              color: selected ? BRAND : "#9AAEA9",
                            }}
                          />
                          <div>
                            <span
                              className="block text-sm font-semibold"
                              style={{
                                color: selected ? BRAND : "#16302b",
                              }}
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
                            onChange={(e) => setLocationValue(e.target.value)}
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

              {/* Curriculum import */}
              <div className="space-y-2">
                <Label>{copy.common.curriculumLabel}</Label>
                <p className="text-xs text-[#9AAEA9]">
                  {copy.common.curriculumHint}
                </p>

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
                          ? copy.common.curriculumGradeSuffix(
                              selectedFramework.grade,
                            )
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
                        setCurriculumId("");
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
                      <div className="scrollbar-thin max-h-70 overflow-y-auto rounded-xl border border-[#E7EEEC]">
                        {frameworksLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="size-5 animate-spin text-[#9AAEA9]" />
                          </div>
                        ) : filteredFrameworks.length === 0 ? (
                          <div className="py-8 text-center text-sm text-[#9AAEA9]">
                            {copy.common.curriculumNoResults}
                          </div>
                        ) : (
                          <div className="divide-y divide-[#E7EEEC]">
                            {filteredFrameworks.map((fw) => (
                              <button
                                key={fw.id}
                                type="button"
                                onClick={() => setCurriculumId(fw.id)}
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
                                      ? copy.common.curriculumGradeSuffix(
                                          fw.grade,
                                        )
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
            </div>
          )}

          {/* ── Step 3: Schedule & Tuition ── */}
          {step === 3 && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              {/* Left: form */}
              <div className="space-y-7 lg:col-span-3">
                {/* Schedule slots */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                        {copy.create.step3.scheduleSectionLabel}
                      </p>
                      <p className="text-xs text-[#9AAEA9]">
                        {copy.create.step3.scheduleCountSuffix(
                          selectedDays.length,
                        )}
                      </p>
                    </div>
                  </div>
                  <FieldError msg={errors.schedule} />

                  <div className="space-y-3">
                    {schedules.map((slot, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#E7EEEC] bg-[#F3F7F5]/50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-[#9AAEA9]">
                            {copy.create.step3.scheduleSlotLabel(idx + 1)}
                          </span>
                          {schedules.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSchedule(idx)}
                              className="flex size-6 items-center justify-center rounded text-[#9AAEA9] hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Day buttons */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {DAYS.map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleScheduleDay(idx, day)}
                              className="flex h-8 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors"
                              style={
                                slot.days.includes(day)
                                  ? { background: BRAND, color: "#fff" }
                                  : {
                                      background: "#E7EEEC",
                                      color: "#16302b",
                                    }
                              }
                            >
                              {day}
                            </button>
                          ))}
                        </div>

                        {/* Time + Duration */}
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9AAEA9]">
                              {copy.create.step3.startTimeLabel}
                            </p>
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                updateSchedule(idx, "startTime", e.target.value)
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9AAEA9]">
                              {copy.create.step3.durationLabel}
                            </p>
                            <Select
                              value={slot.duration}
                              onValueChange={(v) =>
                                updateSchedule(idx, "duration", v)
                              }
                              options={DURATION_OPTIONS}
                              className="[&>button]:h-9"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addSchedule}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#E7EEEC] bg-white py-3 text-sm font-medium text-[#9AAEA9] hover:border-[#0E9F8E]/50 hover:text-[#0E9F8E] hover:bg-[#E4F6EF] transition-colors"
                  >
                    <Plus className="size-4" />
                    {copy.create.step3.addSlotButton}
                  </button>
                </div>

                {/* Course duration */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                    {copy.create.step3.courseDurationSectionLabel}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{copy.common.startDateLabel}</Label>
                      <DatePicker
                        value={startDate}
                        onValueChange={(v) => {
                          setStartDate(v);
                          setErrors((p) => ({ ...p, startDate: "" }));
                        }}
                        invalid={!!errors.startDate}
                      />
                      <FieldError msg={errors.startDate} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{copy.common.endDateLabel}</Label>
                      <DatePicker
                        value={endDate}
                        onValueChange={(v) => {
                          setEndDate(v);
                          setErrors((p) => ({ ...p, endDate: "" }));
                        }}
                        invalid={!!errors.endDate}
                      />
                      <FieldError msg={errors.endDate} />
                    </div>
                  </div>

                  {totalSessions > 0 && (
                    <div
                      className="flex items-center gap-2 rounded-xl border px-4 py-3"
                      style={{
                        background: BRAND_LIGHT,
                        borderColor: "#B2E8DF",
                      }}
                    >
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                        style={{ background: BRAND }}
                      >
                        ∑
                      </span>
                      <span className="text-sm text-[#16302b]">
                        {copy.create.step3.totalSessionsPrefix}:{" "}
                        <strong style={{ color: BRAND }}>
                          {totalSessions} {copy.common.sessionsUnit}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Tuition */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                    {copy.create.step3.tuitionSectionLabel}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{copy.create.step3.feePerSessionLabel}</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={
                            feePerSession > 0
                              ? feePerSession.toLocaleString("vi-VN")
                              : ""
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            setFeePerSession(raw ? Number(raw) : 0);
                            setErrors((p) => ({ ...p, fee: "" }));
                          }}
                          placeholder={copy.common.feePlaceholder}
                          className="pr-8"
                          invalid={!!errors.fee}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9AAEA9]">
                          {copy.common.feeCurrencySuffix}
                        </span>
                      </div>
                      <FieldError msg={errors.fee} />
                    </div>

                    <div className="space-y-1.5">
                      <Label>{copy.create.step3.paymentMethodLabel}</Label>
                      <div className="flex gap-1.5 pt-0.5">
                        {PAYMENT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPaymentMethod(opt.value)}
                            className="flex-1 h-11 rounded-lg text-xs font-medium transition-colors"
                            style={
                              paymentMethod === opt.value
                                ? { background: BRAND, color: "#fff" }
                                : {
                                    background: "#F3F7F5",
                                    color: "#16302b",
                                  }
                            }
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: summary */}
              <div className="lg:col-span-2">
                <div className="space-y-4 lg:sticky lg:top-4">
                  {/* Info summary */}
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      background: BRAND_LIGHT,
                      borderColor: "#B2E8DF",
                    }}
                  >
                    <p className="mb-1 font-semibold text-[#16302b]">
                      {className ||
                        copy.create.step3.summaryClassNamePlaceholder}
                    </p>
                    {(subject || teachingType) && (
                      <p className="mb-4 text-xs text-[#16302b]">
                        {[
                          subject,
                          teachingType === "1-1"
                            ? copy.common.teachingType1on1Title
                            : copy.common.teachingTypeGroupTitle,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}

                    {selectedDays.length > 0 && (
                      <div className="mb-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9AAEA9]">
                          {copy.create.step3.summaryScheduleLabel}
                        </p>
                        {schedules
                          .filter((s) => s.days.length)
                          .map((s, i) => (
                            <p key={i} className="text-xs text-[#16302b]">
                              {s.days
                                .map((d) => copy.common.weekdayNames[d] ?? d)
                                .join(", ")}{" "}
                              · {s.startTime}
                            </p>
                          ))}
                      </div>
                    )}

                    <div className="space-y-1 text-xs text-[#16302b]">
                      {totalSessions > 0 && (
                        <p>
                          {copy.create.step3.summarySessionsPrefix}:{" "}
                          <strong style={{ color: BRAND }}>
                            {totalSessions}
                          </strong>
                        </p>
                      )}
                      {startDate && endDate && (
                        <p>
                          {copy.create.step3.summaryDurationPrefix}: {startDate}{" "}
                          → {endDate}
                        </p>
                      )}
                      {paymentMethod && (
                        <p>
                          {copy.create.step3.summaryPaymentPrefix}{" "}
                          {PAYMENT_OPTIONS.find(
                            (o) => o.value === paymentMethod,
                          )?.label.toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total cost */}
                  {feePerSession > 0 && totalSessions > 0 && (
                    <div
                      className="rounded-2xl p-5 text-white"
                      style={{ background: BRAND }}
                    >
                      <p className="text-sm text-white/80">
                        {currency(feePerSession)} × {totalSessions}{" "}
                        {copy.common.sessionsUnit}
                      </p>
                      <p className="mt-3 text-xs text-white/60 uppercase tracking-wide">
                        {copy.create.step3.totalCostSubLabel}
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {currency(totalTuition)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Dialog>
  );
};
