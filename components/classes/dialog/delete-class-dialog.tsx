"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { getErrorMessage } from "@/lib/axios";
import { useClassesCopy } from "@/hooks/useClassesCopy.hook";
import { useClassActions, invalidateClassRelatedQueries } from "@/lib/services/class.service";

type Props = {
  classItem: { id: string; name: string } | null;
  onClose: () => void;
};

export function DeleteClassDialog({ classItem, onClose }: Props) {
  const queryClient = useQueryClient();
  const { deleteDialog } = useClassesCopy();

  const { mutate, isPending: loading } = useClassActions().delete;

  const handleConfirm = () => {
    if (!classItem) return;
    mutate(classItem.id, {
      onSuccess: () => {
        void invalidateClassRelatedQueries(queryClient);
        toast.success(deleteDialog.success);
        onClose();
      },
      onError: (err) => toast.error(getErrorMessage(err, deleteDialog.error)),
    });
  };

  return (
    <ConfirmDialog
      open={classItem !== null}
      onClose={onClose}
      onConfirm={handleConfirm}
      loading={loading}
      description={
        <>
          <p>
            {deleteDialog.confirmPrefix}{" "}
            <span className="font-semibold text-foreground">
              {classItem?.name ?? "—"}
            </span>
            {deleteDialog.confirmSuffix}
          </p>
          <p className="mt-1">{deleteDialog.warning}</p>
        </>
      }
    />
  );
}
