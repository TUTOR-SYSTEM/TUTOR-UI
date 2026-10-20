"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import type { ApiManagedUser } from "@/types";

type Props = {
  tutor: ApiManagedUser | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
};

export function DeleteTutorDialog({
  tutor,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const name = tutor
    ? [tutor.firstName, tutor.lastName].filter(Boolean).join(" ")
    : "";

  return (
    <ConfirmDialog
      open={tutor !== null}
      loading={loading}
      onClose={onClose}
      onConfirm={() => {
        if (tutor) onConfirm(tutor.id);
      }}
      description={
        <>
          Bạn có chắc muốn xóa gia sư{" "}
          <span className="font-semibold text-foreground">{name}</span>? Tài
          khoản sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.
        </>
      }
    />
  );
}
