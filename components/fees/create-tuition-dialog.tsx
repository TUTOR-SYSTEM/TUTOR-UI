"use client";

import { currentPersonName } from "@/lib/format/person-name";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { DatePicker } from "@/components/ui/date-picker.ui";
import { Select } from "@/components/ui/select.ui";
import { useGet, usePost } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import type { CreateTuitionPayload, TuitionRecord } from "@/types";

type ClassOption = {
  id: string;
  name: string;
  code: string;
  tuition: string;
};

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
};

/**
 * Remounted each time it opens (see `key` at the call site), so plain
 * `useState("")` initializers are enough — no reset effect needed.
 */
type Props = {
  classes: ClassOption[];
  onClose: () => void;
};

export const CreateTuitionDialog = ({ classes, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const classOptions = useMemo(
    () => classes.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id })),
    [classes],
  );

  const { data: studentsRaw } = useGet(
    ["class-students", classId],
    `/classes/${classId}/students`,
    { enabled: !!classId },
  );

  const students = useMemo(
    () =>
      studentsRaw ? (unwrapApiData<StudentOption[]>(studentsRaw) ?? []) : [],
    [studentsRaw],
  );

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        label: currentPersonName(s.firstName, s.lastName),
        value: s.id,
      })),
    [students],
  );

  const handleClassChange = (value: string) => {
    setClassId(value);
    setStudentId("");
    const cls = classes.find((c) => c.id === value);
    if (cls) setAmount(String(Number(cls.tuition) || 0));
  };

  const createTuition = usePost<TuitionRecord, CreateTuitionPayload>(
    "/tuitions",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tuitions"] });
        toast.success("Đã tạo hóa đơn học phí");
        onClose();
      },
      onError: (err) =>
        toast.error(getErrorMessage(err, "Tạo hóa đơn thất bại")),
    },
  );

  const submit = () => {
    const newErrors: typeof errors = {};
    if (!classId) newErrors.classId = "Vui lòng chọn lớp";
    if (!studentId) newErrors.studentId = "Vui lòng chọn học sinh";
    const amountNum = Number(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0)
      newErrors.amount = "Số tiền phải lớn hơn 0";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    createTuition.mutate({
      classId,
      studentId,
      amount: amountNum,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog
      isOpen
      icon={Plus}
      title="Tạo hóa đơn học phí"
      subtitle="Chọn lớp, học sinh và số tiền cần thu."
      cancelText="Hủy"
      onCancel={onClose}
      submitText="Tạo hóa đơn"
      submitIcon={Plus}
      onSubmit={submit}
      loading={createTuition.isPending}
      className="max-w-lg"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Lớp học</label>
        <Select
          options={classOptions}
          value={classId}
          onValueChange={handleClassChange}
          placeholder="Chọn lớp..."
          invalid={!!errors.classId}
        />
        {errors.classId && (
          <p className="text-xs text-destructive">{errors.classId}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Học sinh</label>
        <Select
          options={studentOptions}
          value={studentId}
          onValueChange={setStudentId}
          placeholder={classId ? "Chọn học sinh..." : "Chọn lớp trước"}
          disabled={!classId}
          invalid={!!errors.studentId}
        />
        {errors.studentId && (
          <p className="text-xs text-destructive">{errors.studentId}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Số tiền (VNĐ)</label>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          placeholder="VD: 2000000"
          invalid={!!errors.amount}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Hạn đóng</label>
        <DatePicker value={dueDate} onValueChange={setDueDate} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Ghi chú (tuỳ chọn)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ghi chú cho hóa đơn..."
          className="w-full resize-none rounded-md border border-input bg-surface-container-lowest px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary dark:bg-input/30"
        />
      </div>
    </Dialog>
  );
};
