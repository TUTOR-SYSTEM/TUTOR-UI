"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { getErrorMessage } from "@/lib/axios";
import { apiPut } from "@/lib/axios/query";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import type {
  ApiResponse,
  CurriculumLesson,
  LessonItem,
  UpdateLessonPayload,
} from "@/types";

type Props = {
  lesson: CurriculumLesson;
  onClose: () => void;
  onSaved: () => void;
};

/** Sửa tên/mô tả bài học (PUT /curriculum/lessons/:id). Mount khi đang sửa. */
export function EditLessonDialog({ lesson, onClose, onSaved }: Props) {
  const { detail: t } = useCurriculumCopy();
  const [title, setTitle] = useState(lesson.title);
  const [desc, setDesc] = useState(lesson.description ?? "");
  const [titleError, setTitleError] = useState<string | undefined>();

  // id nằm trong URL, không gửi trong body (BE .strict()).
  const save = useMutation({
    mutationFn: (body: UpdateLessonPayload) =>
      apiPut<ApiResponse<LessonItem>, UpdateLessonPayload>(
        `/curriculum/lessons/${lesson.id}`,
        body,
      ),
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError(t.editLessonModal.titleRequired);
      return;
    }
    save.mutate(
      { title: title.trim(), description: desc.trim() },
      {
        onSuccess: () => {
          toast.success(t.editLessonModal.toastSuccess);
          onSaved();
          onClose();
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, t.editLessonModal.toastErrorFallback)),
      },
    );
  };

  return (
    <Dialog
      isOpen
      icon={Pencil}
      title={t.editLessonModal.title}
      cancelText={t.lesson.cancelButton}
      onCancel={onClose}
      submitText={t.editLessonModal.submitButton}
      onSubmit={handleSubmit}
      loading={save.isPending}
    >
      <div className="flex flex-col gap-4">
        <FormField label={t.editLessonModal.titleLabel} required error={titleError}>
          <Input
            autoFocus
            type="text"
            placeholder={t.lesson.titlePlaceholder}
            value={title}
            invalid={!!titleError}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(undefined);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={save.isPending}
          />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <Label className="font-medium">{t.editLessonModal.descriptionLabel}</Label>
          <Input
            type="text"
            placeholder={t.lesson.descriptionPlaceholder}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={save.isPending}
          />
        </div>
      </div>
    </Dialog>
  );
}
