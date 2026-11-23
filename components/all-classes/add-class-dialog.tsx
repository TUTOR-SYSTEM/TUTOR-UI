"use client";

import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Laptop, MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { Input } from "@/components/ui/input.ui";
import { DatePicker } from "@/components/ui/date-picker.ui";
import { Select } from "@/components/ui/select.ui";
import { Textarea } from "@/components/ui/textarea.ui";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { cn } from "@/lib/utils";
import {
  ClassStudentPicker,
  type TeachingType,
} from "@/components/classes/components/class-student-picker";
import { useClassFormCopy } from "@/hooks/useClassFormCopy.hook";
import { useClassActions, invalidateClassRelatedQueries } from "@/lib/services/class.service";
import { formatThousands, stripThousands } from "@/lib/format/money";
import { SUBJECT_OPTIONS } from "@/lib/subjects";
import { useAllClassesCopy } from "@/hooks/useAllClassesCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import type { AllClassesDictionary } from "@/lib/i18n/all-classes.dictionary";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  tutorOptions: { label: string; value: string }[];
};

function buildSchema(t: AllClassesDictionary["addDialog"], feeError: string) {
  return z
    .object({
      tutorId: z.string().min(1, t.errTutor),
      name: z.string().trim().min(1, t.errName).max(255),
      subject: z.string().min(1, t.errSubject),
      tuition: z
        .string()
        .min(1, feeError)
        .refine((v) => Number(v) > 0, feeError),
      status: z.enum(["OPEN", "UPCOMING", "CLOSED"]),
      format: z.enum(["ONLINE", "OFFLINE"]),
      onlineLocation: z.string().optional(),
      offlineLocation: z.string().optional(),
      startDate: z.string().min(1, t.errStart),
      endDate: z.string().min(1, t.errEnd),
      description: z.string().optional(),
    })
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
      path: ["endDate"],
      message: t.errEndBeforeStart,
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const EMPTY: FormValues = {
  tutorId: "",
  name: "",
  subject: "",
  tuition: "",
  status: "OPEN",
  format: "ONLINE",
  onlineLocation: "",
  offlineLocation: "",
  startDate: "",
  endDate: "",
  description: "",
};

const SUBJECT_CHOICES = SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }));

export function AddClassDialog({ open, onClose, onSaved, tutorOptions }: Props) {
  const copy = useAllClassesCopy();
  const t = copy.addDialog;
  const common = useCommonCopy();
  const formCopy = useClassFormCopy();
  const [teachingType, setTeachingType] = useState<TeachingType>("group");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const schema = useMemo(
    () => buildSchema(t, formCopy.common.feeRequiredError),
    [t, formCopy.common.feeRequiredError],
  );

  const { create, generateCode, enrollStudents } = useClassActions({
    generateCodeOptions: { enabled: false },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const format = useWatch({ control, name: "format" });

  const resetAll = () => {
    reset(EMPTY);
    setTeachingType("group");
    setStudentIds([]);
  };

  const handleClose = () => {
    if (create.isPending) return;
    resetAll();
    onClose();
  };

  const statusOptions = [
    { label: formCopy.edit.statusOpen, value: "OPEN" },
    { label: formCopy.edit.statusUpcoming, value: "UPCOMING" },
    { label: formCopy.edit.statusClosed, value: "CLOSED" },
  ];

  const onSubmit = async (values: FormValues) => {
    try {
      // Fresh code per class (the code is unique on the backend).
      const { data: code } = await generateCode.refetch();
      if (!code) throw new Error(t.toastError);
      const location = (
        values.format === "ONLINE" ? values.onlineLocation : values.offlineLocation
      )?.trim();
      const createdRaw = await create.mutateAsync({
        code,
        tutorId: values.tutorId,
        name: values.name.trim(),
        subject: values.subject,
        tuition: Number(values.tuition),
        description: values.description?.trim() || undefined,
        status: values.status,
        format: values.format,
        location: location || undefined,
        maxStudents: teachingType === "1-1" ? 1 : 10,
        startTime: new Date(values.startDate).toISOString(),
        endTime: new Date(values.endDate).toISOString(),
      });
      const created = unwrapApiData<{ id: string }>(createdRaw);
      if (studentIds.length && created?.id) {
        await enrollStudents.mutateAsync({
          classId: created.id,
          studentIds,
        });
      }
      toast.success(t.toastSuccess);
      void invalidateClassRelatedQueries(queryClient);
      resetAll();
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, t.toastError));
    }
  };

  const loading =
    create.isPending || generateCode.isFetching || enrollStudents.isPending;

  return (
    <Dialog
      isOpen={open}
      icon={Plus}
      title={t.title}
      subtitle={t.subtitle}
      className="w-175 max-w-[calc(100vw-2rem)]"
      cancelText={common.actions.cancel}
      onCancel={handleClose}
      submitText={t.submit}
      submitIcon={Plus}
      onSubmit={handleSubmit(onSubmit)}
      loading={loading}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6"
      >
        <FormField label={t.tutorLabel} required error={errors.tutorId?.message}>
          <Controller
            name="tutorId"
            control={control}
            render={({ field }) => (
              <Select
                options={tutorOptions}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t.tutorPlaceholder}
                disabled={loading}
                invalid={!!errors.tutorId}
              />
            )}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t.nameLabel} required error={errors.name?.message}>
            <Input
              {...register("name")}
              placeholder={t.namePlaceholder}
              invalid={!!errors.name}
              disabled={loading}
            />
          </FormField>

          <FormField label={t.subjectLabel} required error={errors.subject?.message}>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <Select
                  options={SUBJECT_CHOICES}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t.subjectPlaceholder}
                  disabled={loading}
                  invalid={!!errors.subject}
                />
              )}
            />
          </FormField>
        </div>

        <FormField label={formCopy.create.step2.formatLabel} hint={formCopy.edit.formatHint}>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: "ONLINE", title: formCopy.common.formatOnlineTitle, desc: formCopy.common.formatOnlineDesc, icon: Laptop, field: "onlineLocation", label: formCopy.common.onlineLocationLabel, placeholder: formCopy.common.onlineLocationPlaceholder },
                { value: "OFFLINE", title: formCopy.common.formatOfflineTitle, desc: formCopy.common.formatOfflineDesc, icon: MapPin, field: "offlineLocation", label: formCopy.common.offlineLocationLabel, placeholder: formCopy.common.offlineLocationPlaceholder },
              ] as const
            ).map((opt) => {
              const selected = format === opt.value;
              return (
                <div
                  key={opt.value}
                  className={cn(
                    "rounded-xl border-2 p-4 transition-all",
                    selected
                      ? "border-primary bg-primary-light"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => setValue("format", opt.value)}
                    className="h-auto! w-full! items-start! justify-start! gap-3! p-0! text-left font-normal hover:bg-transparent!"
                  >
                    <opt.icon
                      className={cn(
                        "size-5 shrink-0",
                        selected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span>
                      <span
                        className={cn(
                          "block text-sm font-semibold",
                          selected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {opt.title}
                      </span>
                      <span className="mt-0.5 block text-xs whitespace-normal text-muted-foreground">
                        {opt.desc}
                      </span>
                    </span>
                  </Button>
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {opt.label}
                    </p>
                    <Input
                      {...register(opt.field)}
                      placeholder={opt.placeholder}
                      disabled={loading}
                      className="h-10"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </FormField>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t.startLabel} required error={errors.startDate?.message}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  invalid={!!errors.startDate}
                  disabled={loading}
                />
              )}
            />
          </FormField>
          <FormField label={t.endLabel} required error={errors.endDate?.message}>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  invalid={!!errors.endDate}
                  disabled={loading}
                />
              )}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t.tuitionLabel} required error={errors.tuition?.message}>
            <Controller
              name="tuition"
              control={control}
              render={({ field }) => (
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={formatThousands(field.value ?? "")}
                  onChange={(e) => field.onChange(stripThousands(e.target.value))}
                  inputMode="numeric"
                  invalid={!!errors.tuition}
                  disabled={loading}
                />
              )}
            />
          </FormField>
          <FormField label={formCopy.edit.statusLabel}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  options={statusOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loading}
                />
              )}
            />
          </FormField>
        </div>

        <FormField label={t.descriptionLabel}>
          <Textarea
            {...register("description")}
            rows={3}
            placeholder={t.descriptionPlaceholder}
            disabled={loading}
          />
        </FormField>

        <FormField label={formCopy.edit.studentsLabel}>
          <ClassStudentPicker
            selectedIds={studentIds}
            onChange={setStudentIds}
            teachingType={teachingType}
            onTeachingTypeChange={setTeachingType}
            enabled={open}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
