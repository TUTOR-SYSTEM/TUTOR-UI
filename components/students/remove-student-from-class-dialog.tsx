"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { Label } from "@/components/ui/label.ui";
import { Select } from "@/components/ui/select.ui";
import {
  CLASSES_QUERY_KEY,
  useClassActions,
} from "@/lib/services/class.service";
import { STUDENTS_QUERY_KEY } from "@/lib/services/student.service";
import { getErrorMessage } from "@/lib/axios";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import type { Student } from "@/types";

/* ─── props ─── */
type Props = {
  student: Student | null;
  onClose: () => void;
};

/* ─── component ─── */
// TUTOR gỡ học sinh khỏi một lớp (DELETE /classes/:id/students/:studentId).
// Học sinh có nhiều lớp thì chọn lớp trước khi xác nhận.
export function RemoveStudentFromClassDialog({ student, onClose }: Props) {
  const copy = useStudentsCopy();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useClassActions().removeStudent;
  const [selectedClassId, setSelectedClassId] = useState("");

  const classes = student?.classes ?? [];
  const classId = selectedClassId || classes[0]?.id || "";
  const selectedClass = classes.find((c) => c.id === classId);

  const handleClose = () => {
    setSelectedClassId("");
    onClose();
  };

  const handleConfirm = () => {
    if (!student || !classId) return;
    mutate(
      { classId, studentId: student.id },
      {
        onSuccess: () => {
          toast.success(copy.removeFromClassDialog.toastSuccess);
          void queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
          void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
          handleClose();
        },
        onError: (err) =>
          toast.error(
            getErrorMessage(err, copy.removeFromClassDialog.toastError),
          ),
      },
    );
  };

  return (
    <ConfirmDialog
      open={student !== null}
      onClose={handleClose}
      onConfirm={handleConfirm}
      loading={isPending}
      title={copy.removeFromClassDialog.title}
      description={
        student && (
          <>
            <p>
              {copy.removeFromClassDialog.descriptionPrefix}{" "}
              <span className="font-semibold text-foreground">
                {student.name}
              </span>{" "}
              {copy.removeFromClassDialog.descriptionSuffix}{" "}
              <span className="font-semibold text-foreground">
                {selectedClass?.code ?? "—"}
              </span>
              ?
            </p>
            {classes.length > 1 && (
              <div className="mt-3 flex flex-col gap-1.5">
                <Label>{copy.removeFromClassDialog.classLabel}</Label>
                <Select
                  options={classes.map((c) => ({
                    label: `${c.name} (${c.code})`,
                    value: c.id,
                  }))}
                  value={classId}
                  onValueChange={setSelectedClassId}
                />
              </div>
            )}
            <p className="mt-2">{copy.removeFromClassDialog.warningText}</p>
          </>
        )
      }
    />
  );
}
