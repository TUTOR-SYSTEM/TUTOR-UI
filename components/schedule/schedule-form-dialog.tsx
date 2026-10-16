"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Check, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Select, type SelectOption } from "@/components/ui/select.ui";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";
import {
  useSessionActions,
  apiGetNextSessionNumber,
  SESSIONS_QUERY_KEY,
} from "@/lib/services/session.service";
import { useClassActions } from "@/lib/services/class.service";
import { useScheduleCopy } from "@/hooks/useScheduleCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { useQueryClient } from "@tanstack/react-query";
import type { StudentSessionListItem, CreateSessionPayload } from "@/types";

/* ─── Form values ─── */
type SessionFormValues = {
  classId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
};

const DEFAULT_VALUES: SessionFormValues = {
  classId: "",
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  description: "",
};

/* ─── Field wrapper ─── */
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

/* ─── Props ─── */
type ScheduleFormDialogProps = {
  open: boolean;
  onClose: () => void;
  session: StudentSessionListItem | null;
};

/* ─── Component ─── */
export function ScheduleFormDialog({ open, onClose, session }: ScheduleFormDialogProps) {
  const copy = useScheduleCopy();
  const common = useCommonCopy();
  const queryClient = useQueryClient();
  const isEditing = !!session;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionFormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  /* reset form on open/close or when session changes */
  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
      return;
    }
    if (session) {
      const startDate = new Date(session.startAt);
      const endDate = new Date(session.endAt);
      // Local calendar date, matching the local hh:mm below (toISOString would be UTC).
      const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
      const startTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
      const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;
      reset({
        classId: session.classId ?? "",
        title: session.title ?? "",
        date: dateStr,
        startTime,
        endTime,
        location: session.location ?? "",
        description: session.description ?? "",
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, session, reset]);

  /* class list */
  const { data: classesRaw } = useClassActions({
    list: { limit: 100 },
    listOptions: { enabled: open },
  }).list;

  const classOptions = useMemo(() => {
    const classes = (classesRaw?.classes ?? []) as { id: string; name: string; code: string }[];
    return classes.map((c) => ({
      label: `${c.name} (${c.code})`,
      value: c.id,
    }));
  }, [classesRaw]);

  /* mutations */
  const { create, update } = useSessionActions();

  const onSubmit = async (values: SessionFormValues) => {
    // Local date + time → ISO instants, as the gateway expects `startAt` / `endAt`.
    const startAt = new Date(`${values.date}T${values.startTime}:00`).toISOString();
    const endAt = new Date(`${values.date}T${values.endTime}:00`).toISOString();

    const fields = {
      title: values.title.trim() || undefined,
      description: values.description.trim() || undefined,
      location: values.location.trim() || undefined,
      startAt,
      endAt,
    };

    if (isEditing && session) {
      update.mutate(
        { id: session.id, ...fields },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
            toast.success(copy.form.toastEditSuccess);
            onClose();
          },
          onError: (err) => {
            toast.error(getErrorMessage(err, copy.form.toastEditError));
          },
        },
      );
    } else {
      let sessionNumber: number;
      try {
        sessionNumber = await apiGetNextSessionNumber(values.classId);
      } catch (err) {
        toast.error(getErrorMessage(err, copy.form.toastCreateError));
        return;
      }
      const payload: CreateSessionPayload = {
        classId: values.classId,
        sessionNumber,
        ...fields,
      };
      create.mutate(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
          toast.success(copy.form.toastCreateSuccess);
          onClose();
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, copy.form.toastCreateError));
        },
      });
    }
  };

  const isLoading = create.isPending || update.isPending;

  return (
    <Dialog
      isOpen={open}
      icon={CalendarDays}
      title={isEditing ? copy.form.editTitle : copy.form.createTitle}
      subtitle={isEditing ? copy.form.editSubtitle : copy.form.createSubtitle}
      className="max-w-lg"
      cancelText={common.actions.cancel}
      onCancel={onClose}
      submitText={isEditing ? copy.form.submitEdit : copy.form.submitCreate}
      submitIcon={Check}
      onSubmit={handleSubmit(onSubmit)}
      loading={isLoading}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Class */}
        <Field label={copy.form.classLabel} required error={errors.classId?.message}>
          <Controller
            name="classId"
            control={control}
            rules={{ required: copy.form.errClassRequired }}
            render={({ field }) => (
              <Select
                options={classOptions}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={copy.form.classPlaceholder}
                invalid={!!errors.classId}
              />
            )}
          />
        </Field>

        {/* Title */}
        <Field label="Tiêu đề buổi học">
          <Input
            {...register("title")}
            placeholder="VD: Buổi 3 – Ôn tập chương 1"
          />
        </Field>

        {/* Date */}
        <Field label="Ngày học" required error={errors.date?.message}>
          <Input
            type="date"
            {...register("date", { required: "Vui lòng chọn ngày học" })}
            invalid={!!errors.date}
          />
        </Field>

        {/* Time range */}
        <div className="grid grid-cols-2 gap-4">
          <Field label={copy.form.startTimeLabel} required error={errors.startTime?.message}>
            <Input
              type="time"
              {...register("startTime", { required: copy.form.errStartTimeRequired })}
              invalid={!!errors.startTime}
            />
          </Field>
          <Field label={copy.form.endTimeLabel} required error={errors.endTime?.message}>
            <Input
              type="time"
              {...register("endTime", {
                required: copy.form.errEndTimeRequired,
                validate: (val) => {
                  const startTime = (document.querySelector('[name="startTime"]') as HTMLInputElement)?.value;
                  if (startTime && val && val <= startTime) {
                    return copy.form.errEndTimeAfterStart;
                  }
                  return true;
                },
              })}
              invalid={!!errors.endTime}
            />
          </Field>
        </div>

        {/* Location */}
        <Field label={copy.form.locationLabel}>
          <Input
            {...register("location")}
            placeholder={copy.form.locationPlaceholder}
          />
        </Field>

        {/* Description */}
        <Field label="Mô tả">
          <Input
            {...register("description")}
            placeholder="Mô tả ngắn về buổi học..."
          />
        </Field>
      </form>
    </Dialog>
  );
}
