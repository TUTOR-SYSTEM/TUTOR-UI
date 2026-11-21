"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { getErrorMessage } from "@/lib/axios";
import { useSessionActions, SESSIONS_QUERY_KEY } from "@/lib/services/session.service";
import { useScheduleCopy } from "@/hooks/useScheduleCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { useQueryClient } from "@tanstack/react-query";
import type { StudentSessionListItem } from "@/types";

type DeleteScheduleDialogProps = {
  session: StudentSessionListItem | null;
  onClose: () => void;
};

export function DeleteScheduleDialog({ session, onClose }: DeleteScheduleDialogProps) {
  const copy = useScheduleCopy();
  const common = useCommonCopy();
  const queryClient = useQueryClient();
  const { delete: del } = useSessionActions();

  const isOpen = !!session;

  const handleConfirm = () => {
    if (!session) return;

    del.mutate(session.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        toast.success(copy.deleteDialog.toastSuccess);
        onClose();
      },
      onError: (err) => {
        toast.error(getErrorMessage(err, copy.deleteDialog.toastError));
      },
    });
  };

  const dateStr = session ? new Date(session.startAt).toLocaleDateString("vi-VN") : "";
  const timeStr = session ? `${session.startAt ? new Date(session.startAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}` : "";

  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      loading={del.isPending}
      title={copy.deleteDialog.title}
      confirmLabel={common.actions.delete}
      cancelLabel={common.actions.cancel}
      description={
        <>
          {session && (
            <p className="font-semibold text-foreground">
              {session.class?.name ?? ""} — {dateStr} {timeStr}
            </p>
          )}
          <p>{copy.deleteDialog.description}</p>
          <p className="mt-1 text-destructive">{copy.deleteDialog.warning}</p>
        </>
      }
    />
  );
}
