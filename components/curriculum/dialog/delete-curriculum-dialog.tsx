"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { useDelete } from "@/lib/axios/query";
import { getErrorMessage } from "@/lib/axios";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import { CURRICULUM_QUERY_KEY } from "@/lib/services/curriculum.service";

type Props = {
  framework: { id: string; subject: string } | null;
  onClose: () => void;
};

export function DeleteCurriculumDialog({ framework, onClose }: Props) {
  const copy = useCurriculumCopy();
  const t = copy.deleteDialog;
  const open = framework !== null;
  const queryClient = useQueryClient();

  const { mutate, isPending: loading } = useDelete<unknown, string>(
    (id) => `/curriculum/${id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: CURRICULUM_QUERY_KEY });
        toast.success(t.toastSuccess);
        onClose();
      },
      onError: (err) => toast.error(getErrorMessage(err, t.toastErrorFallback)),
    },
  );

  const handleConfirm = () => {
    if (!framework) return;
    mutate(framework.id);
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      loading={loading}
      confirmLabel={t.confirmLabel}
      description={
        <>
          <p>
            {t.descriptionPrefix}
            <span className="font-semibold text-foreground">
              {framework?.subject ?? t.descriptionFallbackSubject}
            </span>
            ?
          </p>
          <p className="mt-1">{t.descriptionWarning}</p>
        </>
      }
    />
  );
}
