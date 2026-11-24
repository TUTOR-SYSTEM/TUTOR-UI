"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import type { ManagedUser } from "./edit-user-dialog";
import { currentPersonName } from "@/lib/format/person-name";

type Props = {
  user: ManagedUser | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
};

export function DeleteUserDialog({ user, onClose, onConfirm }: Props) {
  const handleConfirm = () => {
    if (!user) return;
    onConfirm(user.id);
  };

  return (
    <ConfirmDialog
      open={user !== null}
      onClose={onClose}
      onConfirm={handleConfirm}
      description={
        <>
          Bạn có chắc muốn xóa tài khoản{" "}
          <span className="font-semibold text-foreground">
            {user ? currentPersonName(user.firstName, user.lastName) : ""}
          </span>
          ? Người dùng sẽ mất quyền truy cập hệ thống ngay lập tức. Hành động
          này không thể hoàn tác.
        </>
      }
    />
  );
}
