"use client";

import { Download, QrCode, Wallet } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { BANK_INFO } from "@/lib/bank-info";
import type { TuitionRecord } from "@/types";
import { currentPersonName } from "@/lib/format/person-name";

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};

const fmtPeriod = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
};

const money = (v: number) => v.toLocaleString("vi-VN") + " đ";

const STATUS_META: Record<
  TuitionRecord["status"],
  { label: string; bg: string; text: string }
> = {
  PAID: { label: "Đã đóng", bg: "#E4F6EF", text: "#0B7A6D" },
  UNPAID: { label: "Chưa đóng", bg: "#FFF0E6", text: "#E85D24" },
  OVERDUE: { label: "Quá hạn", bg: "#FEE2E2", text: "#DC2626" },
};

const Row = ({
  label,
  value,
  valueClass = "text-foreground",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex items-center justify-between border-b border-border/60 py-2.5 text-sm last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-semibold ${valueClass}`}>{value}</span>
  </div>
);

/**
 * Read-only học phí detail for parent/student — same data as the tutor's
 * edit dialog but no editable fields, plus a real VietQR payment code
 * (mirrors `TuitionDetailDialog`'s QR, not the earlier decorative mock QR).
 */
export const TuitionPayDialog = ({
  tuition,
  onClose,
}: {
  tuition: TuitionRecord;
  onClose: () => void;
}) => {
  const unpaid = tuition.status !== "PAID";
  const studentName =
    currentPersonName(tuition.student.firstName, tuition.student.lastName);
  const amount = Number(tuition.amount) || 0;

  const qrNote =
    `${tuition.student.userCode || studentName} HP ${tuition.class.code} ${fmtPeriod(tuition.dueDate)}`.trim();
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.vietqrBankId}-${BANK_INFO.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(qrNote)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

  return (
    <Dialog
      isOpen
      icon={Wallet}
      title={unpaid ? "Thanh toán học phí" : "Chi tiết học phí"}
      subtitle={`${studentName} · ${tuition.class.name} (${tuition.class.code})`}
      cancelText="Đóng"
      onCancel={onClose}
      submitText={unpaid ? "Tải mã QR" : "Đóng"}
      submitIcon={unpaid ? Download : undefined}
      onSubmit={unpaid ? () => window.open(qrUrl, "_blank") : onClose}
      className="max-w-lg"
    >
      {/* Amount + status */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Số tiền</p>
          <p className="mt-1 text-3xl font-extrabold text-[#0E9F8E] dark:text-[#2DD4BF]">
            {money(amount)}
          </p>
        </div>
        <span
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: STATUS_META[tuition.status].bg,
            color: STATUS_META[tuition.status].text,
          }}
        >
          {STATUS_META[tuition.status].label}
        </span>
      </div>

      {/* QR card — only meaningful while there's still something to pay */}
      {unpaid && (
        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-5 text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[#0E9F8E] dark:text-[#2DD4BF]">
            <QrCode className="size-4" />
            Quét mã để chuyển khoản
          </p>
          <div className="mt-3 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Mã QR chuyển khoản"
              className="size-44 rounded-md border border-border/60 bg-white dark:bg-card p-1"
            />
          </div>
        </div>
      )}

      {/* Detail rows */}
      <div>
        <Row label="Kỳ học phí" value={fmtPeriod(tuition.dueDate)} />
        <Row
          label="Hạn đóng"
          value={fmtDate(tuition.dueDate)}
          valueClass={unpaid ? "text-[#E85D24] dark:text-[#FF9A6C]" : "text-foreground"}
        />
        {tuition.status === "PAID" && (
          <Row label="Ngày đóng" value={fmtDate(tuition.paidDate)} />
        )}
        {tuition.note && <Row label="Ghi chú" value={tuition.note} />}
      </div>

      {/* Bank details */}
      {unpaid && (
        <div className="rounded-xl border border-[#0E9F8E]/25 bg-[#E4F6EF]/50 dark:bg-primary-light/50 px-4 py-3">
          <Row label="Ngân hàng" value={BANK_INFO.displayName} />
          <Row label="Số tài khoản" value={BANK_INFO.accountNo} />
          <Row label="Chủ tài khoản" value={BANK_INFO.accountName} />
          <Row label="Nội dung CK" value={qrNote} />
        </div>
      )}
    </Dialog>
  );
};
