"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { useLocale } from "@/hooks/useLocale.hook";
import { useTutorsCopy } from "@/hooks/useTutorsCopy.hook";
import { formatPersonName } from "@/lib/format/person-name";
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
  const copy = useTutorsCopy();
  const { language } = useLocale();
  const name = tutor
    ? formatPersonName(tutor.firstName, tutor.lastName, language) ||
      copy.unnamed
    : "";

  return (
    <ConfirmDialog
      open={tutor !== null}
      loading={loading}
      onClose={onClose}
      onConfirm={() => {
        if (tutor) onConfirm(tutor.id);
      }}
      title={copy.deleteDialog.title}
      confirmLabel={copy.deleteDialog.confirm}
      cancelLabel={copy.deleteDialog.cancel}
      description={copy.deleteDialog.description(name)}
    />
  );
}
