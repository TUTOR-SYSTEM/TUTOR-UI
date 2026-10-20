"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Plus, Save } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { useGet, usePost, usePut } from "@/lib/axios/query";
import { handleFormApiError } from "@/lib/axios/form-error";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { cn } from "@/lib/utils";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import type { CurriculumDictionary } from "@/lib/i18n/curriculum.dictionary";
import type { CurriculumFramework } from "@/types";
import { CURRICULUM_QUERY_KEY } from "@/lib/services/curriculum.service";

/* ─── props ─── */
type Props = {
  open: boolean;
  initial?: CurriculumFramework | null;
  onClose: () => void;
};

/* ─── API payload ─── */
type CurriculumPayload = {
  subject: string;
  code: string;
  grade: string;
  courseTime: string;
  description?: string;
};

/* ─── schema ─── */
function buildSchema(t: CurriculumDictionary["formDialog"]) {
  return z.object({
    subject: z.string().min(1, t.errSubjectRequired).max(255, t.errMax255),
    code: z.string().min(1, t.errCodeRequired).max(50, t.errMax50),
    grade: z.string().min(1, t.errGradeRequired).max(50, t.errMax50),
    courseTime: z.string().min(1, t.errCourseTimeRequired),
    description: z.string().max(2000, t.errMax2000).optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
  ];
}

const formatYear = (y: string) => y.replace("-", " – ");

function getDefaultValues(
  initial: CurriculumFramework | null | undefined,
  yearOptions: string[],
): FormValues {
  return {
    subject: initial?.subject ?? "",
    code: initial?.code ?? "",
    grade: initial?.grade ?? "",
    courseTime: initial?.courseTime ?? yearOptions[1],
    description: initial?.description ?? "",
  };
}

/* ─── FormField wrapper ─── */
function FormField({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
        {hint && (
          <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground/70">
            — {hint}
          </span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ─── Section label with trailing rule ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/**
 * Create/edit dialog for curriculum frameworks. Pass `initial` to edit an
 * existing framework, or omit it to create a new one. Invalidates the
 * curriculum query on success, so callers don't need to refetch
 * manually.
 */
export function CurriculumFormDialog({ open, initial, onClose }: Props) {
  const copy = useCurriculumCopy();
  const t = copy.formDialog;
  const isEdit = !!initial;
  const yearOptions = buildYearOptions();
  const queryClient = useQueryClient();
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(initial, yearOptions),
  });

  useEffect(() => {
    if (open) reset(getDefaultValues(initial, yearOptions));
    // yearOptions is stable per render-day; only re-run when the dialog opens
    // or the record being edited changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, reset]);

  /* auto-generated subject code — only fetched when creating (edit reuses initial.code) */
  const { data: generatedCode, isLoading: codeLoading } = useGet<
    unknown,
    string | undefined
  >(["curriculum-generate-code"], "/curriculum/generate-code", {
    enabled: open && !isEdit,
    staleTime: 0,
    select: (raw) => unwrapApiData<string>(raw),
  });

  useEffect(() => {
    if (open && !isEdit && generatedCode) {
      setValue("code", generatedCode, { shouldValidate: true });
    }
  }, [open, isEdit, generatedCode, setValue]);

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: CURRICULUM_QUERY_KEY });

  const createMutation = usePost<CurriculumFramework, CurriculumPayload>(
    "/curriculum",
    {
      onSuccess: () => {
        toast.success(t.toastCreateSuccess);
        invalidateList();
        onClose();
      },
      onError: (error) =>
        handleFormApiError<FormValues>(
          error,
          setError,
          t.toastCreateErrorFallback,
        ),
    },
  );

  const updateMutation = usePut<CurriculumFramework, CurriculumPayload>(
    `/curriculum/${initial?.id ?? ""}`,
    {
      onSuccess: () => {
        toast.success(t.toastUpdateSuccess);
        invalidateList();
        onClose();
      },
      onError: (error) =>
        handleFormApiError<FormValues>(error, setError, t.toastUpdateErrorFallback),
    },
  );

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (!isEdit && codeLoading);

  const submit = handleSubmit((values) => {
    if (isPending) return;
    const payload: CurriculumPayload = {
      subject: values.subject.trim(),
      code: values.code.trim().toUpperCase(),
      grade: values.grade.trim(),
      courseTime: values.courseTime,
      description: values.description?.trim() || undefined,
    };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  });

  const subjectVal = watch("subject");
  const courseTimeVal = watch("courseTime");

  return (
    <Dialog
      isOpen={open}
      icon={BookOpen}
      title={isEdit ? t.editTitle : t.createTitle}
      subtitle={t.subtitle}
      cancelText={t.cancel}
      onCancel={onClose}
      submitText={isEdit ? t.saveChanges : t.create}
      submitIcon={isEdit ? Save : Plus}
      onSubmit={submit}
      loading={isPending}
    >
      {/* Live preview */}
      <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-800/30 dark:bg-emerald-950/20">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <BookOpen className="size-4" />
          </div>
          <div className="h-[42px]">
            <p className="text-base font-semibold">
              {subjectVal?.trim() || t.previewFallbackSubject}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.previewYearPrefix}
              {formatYear(courseTimeVal || yearOptions[1])}
            </p>
          </div>
        </div>
        <span className="rounded border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
          {t.previewLabel}
        </span>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div className="space-y-3">
          <SectionLabel>{t.sectionClassification}</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={t.subjectLabel}
              required
              error={errors.subject?.message}
            >
              <Input
                {...register("subject")}
                autoFocus
                placeholder={t.subjectPlaceholder}
                invalid={!!errors.subject}
                disabled={isPending}
              />
            </FormField>
            <FormField label={t.gradeLabel} required error={errors.grade?.message}>
              <Input
                {...register("grade")}
                placeholder={t.gradePlaceholder}
                invalid={!!errors.grade}
                disabled={isPending}
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel>{t.sectionIdentityYear}</SectionLabel>

          <FormField
            label={t.codeLabel}
            hint={t.codeHint}
            required
            error={errors.code?.message}
          >
            <Input
              {...register("code")}
              disabled
              placeholder={
                !isEdit && codeLoading
                  ? t.codeGeneratingPlaceholder
                  : t.codePlaceholder
              }
              invalid={!!errors.code}
            />
          </FormField>

          <FormField
            label={t.yearLabel}
            required
            error={errors.courseTime?.message}
          >
            <div className="grid grid-cols-3 gap-2">
              {yearOptions.map((y) => (
                <Button
                  key={y}
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    setValue("courseTime", y, { shouldValidate: true })
                  }
                  className={cn(
                    "h-auto! w-auto! rounded-xl py-2.5 text-sm font-medium",
                    courseTimeVal === y
                      ? "border-emerald-500! bg-emerald-50! font-semibold text-emerald-700 hover:bg-emerald-50! dark:bg-emerald-950/40! dark:text-emerald-400"
                      : "hover:border-emerald-200 hover:bg-emerald-50/50 dark:hover:border-emerald-800/50",
                  )}
                >
                  {formatYear(y)}
                </Button>
              ))}
            </div>
          </FormField>
        </div>

        <div className="space-y-3">
          <SectionLabel>{t.sectionDescription}</SectionLabel>
          <textarea
            {...register("description")}
            rows={3}
            placeholder={t.descriptionPlaceholder}
            disabled={isPending}
            className="w-full resize-none rounded-md border border-input bg-surface-container-lowest px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary dark:bg-input/30"
          />
          {errors.description?.message && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        {errors.root?.serverError?.message && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
            {errors.root.serverError.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
