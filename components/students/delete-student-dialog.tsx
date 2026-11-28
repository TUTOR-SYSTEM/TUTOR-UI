"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";

/* ─── props ─── */
type Props = {
  student: { id: string; name: string } | null;
  /** Học sinh có phụ huynh liên kết — phụ huynh cũng sẽ bị xóa. */
  hasParent?: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
};

/* ─── component ─── */
export function DeleteStudentDialog({ student, hasParent = false, onClose, onConfirm }: Props) {
  const copy = useStudentsCopy();

  const handleConfirm = () => {
    if (!student) return;
    onConfirm(student.id);
  };

  return (
    <ConfirmDialog
      open={student !== null}
      onClose={onClose}
      onConfirm={handleConfirm}
      description={
        <>
          <p>
            {copy.deleteDialog.descriptionPrefix}{" "}
            <span className="font-semibold text-foreground">
              {student?.name ?? "—"}
            </span>
            ?
          </p>
          <p className="mt-1">{copy.deleteDialog.warningText}</p>
          {hasParent && (
            <p className="mt-1">{copy.deleteDialog.parentWarningText}</p>
          )}
        </>
      }
    />
  );
}
