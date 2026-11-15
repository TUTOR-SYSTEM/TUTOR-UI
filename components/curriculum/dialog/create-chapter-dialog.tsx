"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";

type Props = {
  open: boolean;
  frameworkId: string;
  order: number;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateChapterDialog({
  open,
  frameworkId,
  order,
  onClose,
  onCreated,
}: Props) {
  const { detail: t } = useCurriculumCopy();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!title.trim()) {
      setNameError(t.createChapterModal.nameRequired);
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post(`/chapters/${frameworkId}`, {
        title: title.trim(),
        description: desc.trim() || undefined,
        order,
      });
      toast.success(t.createChapterModal.toastSuccess);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(
        getErrorMessage(err, t.createChapterModal.toastErrorFallback),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={open}
      icon={FolderPlus}
      title={t.createChapterModal.title}
      cancelText={t.createChapterModal.cancelButton}
      onCancel={onClose}
      submitText={t.createChapterModal.submitButton}
      onSubmit={handleSubmit}
      loading={submitting}
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
            disabled={submitting}
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
            disabled={submitting}
            className="w-full resize-none rounded-md border border-input bg-surface-container-lowest px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>
    </Dialog>
  );
}
