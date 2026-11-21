"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { type Category } from "./categories.data";

type DeleteCategoryDialogProps = {
  category: Category | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (category: Category) => void;
};

export const DeleteCategoryDialog = ({
  category,
  isLoading = false,
  onClose,
  onConfirm,
}: DeleteCategoryDialogProps) => {
  return (
    <ConfirmDialog
      open={Boolean(category)}
      onClose={onClose}
      onConfirm={() => category && onConfirm(category)}
      loading={isLoading}
      title="Delete category"
      confirmLabel={isLoading ? "Deleting…" : "Delete"}
      cancelLabel="Cancel"
      description={
        <>
          <p>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{category?.name}</span>?
          </p>
          <p className="mt-1">
            This action cannot be undone. Transactions using this category will need to be reassigned.
          </p>
        </>
      }
    />
  );
};
