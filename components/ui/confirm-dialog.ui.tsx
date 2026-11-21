"use client";

import type { ReactNode } from "react";
import { TriangleAlert, type LucideIcon } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  /** Nội dung tự định nghĩa. Bỏ trống và truyền `entity` để dùng câu hỏi xóa chuẩn. */
  description?: ReactNode;
  /** Đối tượng bị xóa/đổi, vd `{ label: "lớp học", name: "Toán 10" }`. */
  entity?: { label: string; name: string };
  /** Dòng cảnh báo cuối (mặc định: "Hành động này không thể hoàn tác."). */
  warning?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: LucideIcon;
  variant?: "destructive" | "default";
  className?: string;
};

/**
 * Generic confirm/delete dialog shared across feature dialogs (students,
 * classes, curriculum, ...). Feature wrappers own the mutation and pass in
 * the entity-specific description/labels. Icon nằm trong thân dialog (không lặp ở header).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  description,
  entity,
  warning,
  confirmLabel,
  cancelLabel,
  icon: Icon = TriangleAlert,
  variant = "destructive",
  className,
}: ConfirmDialogProps) {
  const { confirmDialog } = useCommonCopy();

  const body =
    description ??
    (entity ? (
      <>
        <p>
          {confirmDialog.questionPrefix}{" "}
          {entity.label}{" "}
          <span className="font-semibold text-foreground">{entity.name}</span>
          {confirmDialog.questionSuffix}
        </p>
        <p className="mt-1">{warning ?? confirmDialog.irreversible}</p>
      </>
    ) : null);

  return (
    <Dialog
      isOpen={open}
      title={title ?? confirmDialog.deleteTitle}
      cancelText={cancelLabel ?? confirmDialog.cancel}
      onCancel={onClose}
      submitText={confirmLabel ?? confirmDialog.confirm}
      onSubmit={onConfirm}
      submitVariant={variant}
      loading={loading}
      className={cn("max-w-md", className)}
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-full",
            variant === "destructive" ? "bg-destructive/10" : "bg-primary/10",
          )}
        >
          <Icon
            className={cn(
              "size-6",
              variant === "destructive" ? "text-destructive" : "text-primary",
            )}
          />
        </span>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
    </Dialog>
  );
}
