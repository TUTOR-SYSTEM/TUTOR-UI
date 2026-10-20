"use client";

import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";

import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";

/** Create-chapter dialog on the per-class curriculum page (`POST /chapters/:curriculumId`). */
export const CreateClassChapterDialog = ({
  curriculumId,
  onClose,
  onCreated,
}: {
  curriculumId: string;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !curriculumId) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(`/chapters/${curriculumId}`, {
        title: title.trim(),
      });
      toast.success("Đã tạo chương mới");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Tạo chương thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen
      icon={BookOpen}
      title="Tạo chương mới"
      cancelText="Huỷ"
      onCancel={onClose}
      submitText="Tạo chương"
      submitIcon={Plus}
      onSubmit={handleSubmit}
      loading={submitting}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Tên chương</label>
          <Input
            autoFocus
            type="text"
            placeholder="Ví dụ: Chương 1 — Đạo hàm..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={submitting}
          />
        </div>
      </div>
    </Dialog>
  );
};
