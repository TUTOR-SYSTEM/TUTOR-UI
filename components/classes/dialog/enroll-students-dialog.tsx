"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { getErrorMessage } from "@/lib/axios";
import { useClassActions } from "@/lib/services/class.service";
import { useStudentActions } from "@/lib/services/student.service";
import { currentPersonName } from "@/lib/format/person-name";

type Props = {
  open: boolean;
  classId: string;
  /** Ids of students already in the class; they are not offered again. */
  enrolledIds: readonly string[];
  onClose: () => void;
  onEnrolled: () => void;
};

/**
 * Pick students from the tutor's own list (the API already limits a tutor to their students)
 * and enroll them into this class.
 */
export function EnrollStudentsDialog({ open, classId, enrolledIds, onClose, onEnrolled }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const { list } = useStudentActions({
    list: { page: 1, limit: 100 },
    listOptions: { enabled: open },
    generateCodeOptions: { enabled: false },
  });
  const { enrollStudents } = useClassActions();

  const candidates = useMemo(
    () =>
      (list.data?.students ?? []).filter((s) => !enrolledIds.includes(s.id)),
    [list.data, enrolledIds],
  );

  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

  const handleClose = () => {
    setSelected([]);
    onClose();
  };

  const handleSubmit = () => {
    if (selected.length === 0) {
      toast.error("Chọn ít nhất một học sinh");
      return;
    }
    enrollStudents.mutate(
      { classId, studentIds: selected },
      {
        onSuccess: () => {
          toast.success("Đã thêm học sinh vào lớp");
          setSelected([]);
          onEnrolled();
          onClose();
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, "Thêm học sinh thất bại")),
      },
    );
  };

  return (
    <Dialog
      isOpen={open}
      icon={UserPlus}
      title="Thêm học sinh vào lớp"
      subtitle="Chọn học sinh của bạn để ghi danh vào lớp này."
      className="max-w-lg"
      cancelText="Huỷ"
      onCancel={handleClose}
      submitText={`Thêm (${selected.length})`}
      onSubmit={handleSubmit}
      loading={enrollStudents.isPending}
    >
      {list.isPending ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Đang tải...</p>
      ) : candidates.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Bạn chưa có học sinh nào chưa vào lớp này.
        </p>
      ) : (
        <ul className="flex max-h-80 flex-col divide-y overflow-y-auto">
          {candidates.map((student) => {
            const checked = selected.includes(student.id);
            const name =
              currentPersonName(student.firstName, student.lastName) ||
              student.username ||
              "";
            return (
              <li key={student.id} className="flex items-center gap-3 py-2.5">
                <Checkbox
                  id={`enroll-${student.id}`}
                  checked={checked}
                  onCheckedChange={(v) => toggle(student.id, v === true)}
                  aria-label={`Chọn ${name}`}
                />
                <label htmlFor={`enroll-${student.id}`} className="flex min-w-0 flex-1 cursor-pointer flex-col">
                  <span className="truncate text-sm font-medium">{name}</span>
                  {student.userCode && (
                    <span className="text-xs text-muted-foreground">{student.userCode}</span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
