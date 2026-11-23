"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { useLocale } from "@/hooks/useLocale.hook";
import { useTutorsCopy } from "@/hooks/useTutorsCopy.hook";
import { formatPersonName } from "@/lib/format/person-name";
import type { ApiManagedUser } from "@/types";
import { Lock, Unlock } from "lucide-react";

type Props = {
  tutor: ApiManagedUser | null;
  loading?: boolean;
  onClose: () => void;
  /** Gọi với trạng thái đích: `isActive` mới của gia sư. */
  onConfirm: (id: string, isActive: boolean) => void;
};

export function ToggleTutorStatusDialog({
  tutor,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const copy = useTutorsCopy();
  const { language } = useLocale();
  const name = tutor
    ? formatPersonName(tutor.firstName, tutor.lastName, language) ||
      copy.unnamed
    : "";
  const isLocking = tutor?.isActive ?? true;
  const d = copy.statusDialog;

  return (
    <ConfirmDialog
      open={tutor !== null}
      loading={loading}
      onClose={onClose}
      onConfirm={() => {
        if (tutor) onConfirm(tutor.id, !tutor.isActive);
      }}
      title={isLocking ? d.lockTitle : d.unlockTitle}
      description={isLocking ? d.lockDescription(name) : d.unlockDescription(name)}
      confirmLabel={isLocking ? d.lockConfirm : d.unlockConfirm}
      cancelLabel={d.cancel}
      icon={isLocking ? Lock : Unlock}
      variant={isLocking ? "destructive" : "default"}
    />
  );
}
