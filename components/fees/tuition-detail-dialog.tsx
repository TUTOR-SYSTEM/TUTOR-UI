"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QrCode, Save } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { usePut } from "@/lib/axios/query";
import { getErrorMessage } from "@/lib/axios";
import { BANK_INFO } from "@/lib/bank-info";
import type {
  TuitionRecord,
  TuitionStatus,
  UpdateTuitionPayload,
} from "@/types";

const fmtPeriod = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : `T${d.getMonth() + 1}/${d.getFullYear()}`;
};

const STATUS_OPTIONS: { value: TuitionStatus; label: string }[] = [
  { value: "UNPAID", label: "Chưa đóng" },
  { value: "PAID", label: "Đã đóng" },
  { value: "OVERDUE", label: "Quá hạn" },
];

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

/**
 * Remounted per tuition record (see `key` at the call site), so lazily
 * deriving initial state from props is enough — no sync effect needed.
 */
type Props = {
  tuition: TuitionRecord;
  onClose: () => void;
};

export const TuitionDetailDialog = ({ tuition, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(String(Number(tuition.amount) || 0));
  const [dueDate, setDueDate] = useState(toDateInput(tuition.dueDate));
  const [paidDate, setPaidDate] = useState(toDateInput(tuition.paidDate));
  const [status, setStatus] = useState<TuitionStatus>(tuition.status);
  const [note, setNote] = useState(tuition.note ?? "");
  const [showQr, setShowQr] = useState(false);

  const updateTuition = usePut<TuitionRecord, UpdateTuitionPayload>(
    `/tuitions/${tuition.id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tuitions"] });
        toast.success("Đã cập nhật hóa đơn");
        onClose();
      },
      onError: (err) => toast.error(getErrorMessage(err, "Cập nhật thất bại")),
    },
  );

  const handleStatusChange = (value: string) => {
    const next = value as TuitionStatus;
    setStatus(next);
    if (next === "PAID" && !paidDate) {
      setPaidDate(new Date().toISOString().slice(0, 10));
    }
  };

  const submit = () => {
    const amountNum = Number(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }
    updateTuition.mutate({
      amount: amountNum,
      // Ô ngày bị xóa thì gửi `null` để BE xóa ngày (undefined sẽ bị bỏ qua).
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      paidDate: paidDate ? new Date(paidDate).toISOString() : null,
      status,
      note: note.trim() || undefined,
    });
  };

  const studentName =
    `${tuition.student.firstName} ${tuition.student.lastName}`.trim();

  const qrAmount = Number(amount) || 0;
  const qrNote =
    `${tuition.student.userCode || studentName} HP ${tuition.class.code} ${fmtPeriod(tuition.dueDate)}`.trim();
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.vietqrBankId}-${BANK_INFO.accountNo}-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(qrNote)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

  return (
    <Dialog
      isOpen
      icon={Save}
      title="Chi tiết hóa đơn học phí"
      subtitle={`${studentName} · ${tuition.class.name} (${tuition.class.code})`}
      cancelText="Đóng"
      onCancel={onClose}
      submitText="Lưu thay đổi"
      submitIcon={Save}
      onSubmit={submit}
      loading={updateTuition.isPending}
      className="max-w-lg"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Số tiền (VNĐ)</label>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Hạn đóng</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ngày đóng</label>
          <Input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Trạng thái</label>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onValueChange={handleStatusChange}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Ghi chú</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ghi chú cho hóa đơn..."
          className="w-full resize-none rounded-md border border-input bg-surface-container-lowest px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary dark:bg-input/30"
        />
      </div>

      {status !== "PAID" && (
        <div className="rounded-md border border-input bg-surface-container-lowest p-3">
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            className="flex w-full items-center gap-2 text-sm font-medium"
          >
            <QrCode className="size-4 text-muted-foreground" />
            {showQr ? "Ẩn mã QR chuyển khoản" : "Xem mã QR chuyển khoản"}
          </button>

          {showQr && (
            <div className="mt-3 flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="Mã QR chuyển khoản"
                className="size-44 rounded-md border border-input bg-white p-1"
              />
              <div className="w-full space-y-1 text-sm">
                <div className="flex justify-between border-b border-border/60 py-1.5">
                  <span className="text-muted-foreground">Ngân hàng</span>
                  <span className="font-medium">{BANK_INFO.displayName}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 py-1.5">
                  <span className="text-muted-foreground">Số tài khoản</span>
                  <span className="font-medium">{BANK_INFO.accountNo}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 py-1.5">
                  <span className="text-muted-foreground">Chủ tài khoản</span>
                  <span className="font-medium">{BANK_INFO.accountName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Nội dung CK</span>
                  <span className="font-medium">{qrNote}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
};
