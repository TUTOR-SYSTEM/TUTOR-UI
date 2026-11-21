"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { useAccountsCopy } from "@/hooks/useAccountsCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { type Account } from "./accounts.data";

type DeleteWalletDialogProps = {
  account: Account | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (account: Account) => void;
};

export const DeleteWalletDialog = ({
  account,
  isLoading = false,
  onClose,
  onConfirm,
}: DeleteWalletDialogProps) => {
  const copy = useAccountsCopy();
  const commonCopy = useCommonCopy();

  return (
    <ConfirmDialog
      open={Boolean(account)}
      onClose={onClose}
      onConfirm={() => account && onConfirm(account)}
      loading={isLoading}
      title={copy.deleteDialog.title}
      confirmLabel={isLoading ? copy.deleteDialog.deleting : commonCopy.actions.delete}
      cancelLabel={commonCopy.actions.cancel}
      description={
        <>
          <p>
            {copy.deleteDialog.confirmPrefix}{" "}
            <span className="font-medium text-foreground">{account?.name}</span>
            {copy.deleteDialog.confirmSuffix}
          </p>
          <p className="mt-1">{copy.deleteDialog.subtitle}</p>
        </>
      }
    />
  );
};
