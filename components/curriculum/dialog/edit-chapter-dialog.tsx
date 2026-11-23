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
  ChapterItem,
  CurriculumChapter,
  UpdateChapterPayload,
} from "@/types";

type Props = {
  chapter: CurriculumChapter;
  onClose: () => void;
  onSaved: () => void;
};

/** Sửa tên/mô tả chương (PUT /chapters/:id). Mount khi đang sửa, state khởi tạo từ `chapter`. */
export function EditChapterDialog({ chapter, onClose, onSaved }: Props) {
  const { detail: t } = useCurriculumCopy();
  const [title, setTitle] = useState(chapter.title);
  const [desc, setDesc] = useState(chapter.description ?? "");
  const [nameError, setNameError] = useState<string | undefined>();

  // id nằm trong URL, không gửi trong body (BE .strict()).
  const save = useMutation({
    mutationFn: (body: UpdateChapterPayload) =>
      apiPut<ApiResponse<ChapterItem>, UpdateChapterPayload>(
        `/chapters/${chapter.id}`,
        body,
      ),
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      setNameError(t.createChapterModal.nameRequired);
      return;
    }
    save.mutate(
      { title: title.trim(), description: desc.trim() },
      {
        onSuccess: () => {
          toast.success(t.editChapterModal.toastSuccess);
          onSaved();
          onClose();
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, t.editChapterModal.toastErrorFallback)),
      },
    );
  };

  return (
    <Dialog
      isOpen
      icon={Pencil}
      title={t.editChapterModal.title}
      cancelText={t.createChapterModal.cancelButton}
      onCancel={onClose}
      submitText={t.editChapterModal.submitButton}
      onSubmit={handleSubmit}
      loading={save.isPending}
    >
      <div className="flex flex-col gap-4">
        <FormField label={t.createChapterModal.nameLabel} required error={nameError}>
          <Input
            autoFocus
            type="text"
            placeholder={t.createChapterModal.namePlaceholder}
            value={title}
            invalid={!!nameError}
            onChange={(e) => {
              setTitle(e.target.value);
              if (nameError) setNameError(undefined);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={save.isPending}
          />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <Label className="font-medium">
            {t.createChapterModal.descriptionLabel}{" "}
            <span className="font-normal text-muted-foreground">
              {t.createChapterModal.descriptionOptionalHint}
            </span>
          </Label>
          <textarea
            rows={2}
            placeholder={t.createChapterModal.descriptionPlaceholder}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={save.isPending}
            className="w-full resize-none rounded-md border border-input bg-surface-container-lowest px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>
    </Dialog>
  );
}
