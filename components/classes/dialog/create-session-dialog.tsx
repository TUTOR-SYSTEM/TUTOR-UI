"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Save } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { DatePicker } from "@/components/ui/date-picker.ui";
import { TimePicker } from "@/components/ui/time-picker.ui";
import { Label } from "@/components/ui/label.ui";
import { Select } from "@/components/ui/select.ui";
import { useGet, usePost } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import type { ApiResponse, CurriculumLesson } from "@/types";
import { getErrorMessage } from "@/lib/axios";
import { FieldError } from "../components/field-error";
import { ClassLocationHint } from "../components/class-location-hint";

/* ─── Helpers ─── */

const todayInput = () => new Date().toISOString().slice(0, 10);

/* ─── Props ─── */

type LessonOption = { id: string; title: string };

type CreateSessionDialogProps = {
  open: boolean;
  onClose: () => void;
  classId: string;
  lessons: LessonOption[];
  nextSessionNumber: number;
  /** Địa điểm/link mặc định của lớp, điền sẵn vào buổi học. */
  classLocation?: string | null;
};

type FormState = {
  title: string;
  lessonId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  note: string;
};

const getInitialState = (classLocation?: string | null): FormState => ({
  title: "",
  lessonId: "",
  date: todayInput(),
  startTime: "18:00",
  endTime: "20:00",
  location: classLocation?.trim() ?? "",
  note: "",
});

/* ─── Component ─── */

export function CreateSessionDialog({
  open,
  onClose,
  classId,
  lessons,
  nextSessionNumber,
  classLocation,
}: CreateSessionDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(getInitialState(classLocation));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const prevOpenRef = useRef(open);

  /* Bài giảng đã chọn: lấy toàn bộ tài liệu bài giảng + bài tập để tự thêm vào buổi học. */
  const lessonQuery = useGet<ApiResponse<CurriculumLesson>, CurriculumLesson>(
    ["curriculum-lesson", form.lessonId],
    `/curriculum/lessons/${form.lessonId}`,
    {
      enabled: open && !!form.lessonId,
      select: (raw) => unwrapApiData<CurriculumLesson>(raw),
    },
  );
  const lessonTheory = form.lessonId ? (lessonQuery.data?.theoryUrls ?? []) : [];
  const lessonExercise = form.lessonId ? (lessonQuery.data?.exerciseUrls ?? []) : [];

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* reset when opened */
  useEffect(() => {
    if (open && open !== prevOpenRef.current) {
      setForm(getInitialState(classLocation));
      setErrors({});
    }
    prevOpenRef.current = open;
     
  }, [open]);

  const { mutate, isPending: loading } = usePost<
    unknown,
    Record<string, unknown>
  >("/sessions", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-sessions", classId] });
      toast.success("Tạo buổi học thành công!");
      onClose();
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, "Tạo buổi học thất bại")),
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.date) e.date = "Chọn ngày học";
    if (!form.startTime) e.startTime = "Chọn giờ bắt đầu";
    if (!form.endTime) e.endTime = "Chọn giờ kết thúc";
    if (
      form.date &&
      form.startTime &&
      form.endTime &&
      new Date(`${form.date}T${form.endTime}`) <=
        new Date(`${form.date}T${form.startTime}`)
    ) {
      e.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
    }
    if (!form.title.trim() && !form.lessonId) {
      e.title = "Nhập tiêu đề buổi học hoặc chọn bài giảng";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (form.lessonId && lessonQuery.isLoading) {
      toast.error("Đang tải tài liệu bài giảng, vui lòng thử lại");
      return;
    }
    mutate({
      classId,
      lessonId: form.lessonId || undefined,
      title:
        form.title.trim() ||
        lessons.find((l) => l.id === form.lessonId)?.title ||
        undefined,
      sessionNumber: nextSessionNumber,
      startAt: new Date(`${form.date}T${form.startTime}`).toISOString(),
      endAt: new Date(`${form.date}T${form.endTime}`).toISOString(),
      location: form.location.trim() || undefined,
      note: form.note.trim() || undefined,
      theoryUrls: lessonTheory,
      exerciseUrls: lessonExercise,
    });
  };

  const lessonOptions = [
    { value: "", label: "Không gắn bài giảng" },
    ...lessons.map((lesson) => ({ value: lesson.id, label: lesson.title })),
  ];

  return (
    <Dialog
      isOpen={open}
      icon={CalendarPlus}
      title="Tạo buổi học mới"
      subtitle="Thêm một buổi học mới cho lớp"
      cancelText="Hủy"
      onCancel={onClose}
      submitText={loading ? "Đang tạo..." : "Tạo buổi học"}
      submitIcon={loading ? undefined : Save}
      onSubmit={handleSubmit}
      loading={loading}
    >
      {/* Title */}
      <div className="space-y-1.5">
        <Label>Tiêu đề buổi học</Label>
        <Input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="VD: Buổi 3 — Phương trình bậc hai"
          invalid={!!errors.title}
        />
        <FieldError msg={errors.title} />
      </div>

      {/* Lesson */}
      <div className="space-y-1.5">
        <Label>Bài giảng</Label>
        <Select
          value={form.lessonId}
          onValueChange={(v) => update("lessonId", v)}
          options={lessonOptions}
        />
        {form.lessonId && (
          <p className="text-xs text-muted-foreground">
            {lessonQuery.isLoading
              ? "Đang tải tài liệu bài giảng..."
              : `Sẽ tự thêm ${lessonTheory.length} tài liệu bài giảng và ${lessonExercise.length} bài tập.`}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label>
          Ngày học <span className="text-red-400">*</span>
        </Label>
        <DatePicker
          value={form.date}
          onValueChange={(v) => {
            update("date", v);
            setErrors((p) => ({ ...p, date: "" }));
          }}
          invalid={!!errors.date}
        />
        <FieldError msg={errors.date} />
      </div>

      {/* Time range */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            Giờ bắt đầu <span className="text-red-400">*</span>
          </Label>
          <TimePicker
            value={form.startTime}
            onValueChange={(v) => {
              update("startTime", v);
              setErrors((p) => ({ ...p, startTime: "", endTime: "" }));
            }}
            invalid={!!errors.startTime}
          />
          <FieldError msg={errors.startTime} />
        </div>
        <div className="space-y-1.5">
          <Label>
            Giờ kết thúc <span className="text-red-400">*</span>
          </Label>
          <TimePicker
            value={form.endTime}
            onValueChange={(v) => {
              update("endTime", v);
              setErrors((p) => ({ ...p, endTime: "" }));
            }}
            invalid={!!errors.endTime}
          />
          <FieldError msg={errors.endTime} />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label>Địa điểm / Link học</Label>
        <Input
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="Link Zoom/Meet hoặc địa chỉ lớp học..."
        />
        <ClassLocationHint
          classLocation={classLocation}
          value={form.location}
          onUseClassLocation={() =>
            update("location", classLocation?.trim() ?? "")
          }
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label>Ghi chú</Label>
        <textarea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          rows={3}
          placeholder="Ghi chú cho buổi học..."
          className="w-full resize-none rounded-lg border border-[#E7EEEC] bg-white px-3 py-2.5 text-sm text-[#16302b] outline-none placeholder:text-[#9AAEA9] focus:border-[#0E9F8E] focus:ring-2 focus:ring-[#0E9F8E]/30 transition-colors"
        />
      </div>
    </Dialog>
  );
}
