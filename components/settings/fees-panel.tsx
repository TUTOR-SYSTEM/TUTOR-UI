"use client";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { useState } from "react";
import { QrCode, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field.ui";
import { SwitchRow } from "@/components/ui/switch-row.ui";
import { SaveButton } from "@/components/settings/settings-save-button";

export type BankInfoState = {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch: string;
};


export function FeesPanel() {
  const [bank, setBank] = useState<BankInfoState>({
    bankName: "Vietcombank",
    accountHolder: "NGUYEN MINH QUAN",
    accountNumber: "0123 4567 8904 821",
    branch: "CN Hà Đông",
  });

  const updateBank = (key: keyof BankInfoState, value: string) => {
    setBank((prev) => ({ ...prev, [key]: value }));
  };

  const maskedAccountNumber = bank.accountNumber
    .replace(/\s/g, "")
    .replace(/^\d+(\d{4})$/, "•••• •••• $1");

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(bank.accountNumber.replace(/\s/g, ""));
      toast.success("Đã sao chép số tài khoản");
    } catch {
      toast.error("Sao chép thất bại");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Bank account card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E9F8E] to-[#0B4A42] p-6 text-white shadow-sm">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Tài khoản nhận tiền
            </p>
            <p className="mt-1 text-lg font-semibold">{bank.bankName}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Mặc định
          </span>
        </div>
        <p className="relative mt-6 text-2xl font-semibold tracking-[0.2em]">
          {maskedAccountNumber}
        </p>
        <div className="relative mt-4 flex items-end justify-between">
          <p className="text-sm font-medium text-white/90">
            {bank.accountHolder}
          </p>
          <p className="text-xs text-white/70">{bank.branch}</p>
        </div>
      </div>

      {/* Bank info card */}
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-foreground">
          Thông tin ngân hàng
        </p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ngân hàng">
            <Input
              value={bank.bankName}
              onChange={(e) => updateBank("bankName", e.target.value)}
            />
          </FormField>
          <FormField label="Chủ tài khoản">
            <Input
              value={bank.accountHolder}
              onChange={(e) => updateBank("accountHolder", e.target.value)}
            />
          </FormField>
          <FormField label="Số tài khoản">
            <Input
              value={bank.accountNumber}
              onChange={(e) => updateBank("accountNumber", e.target.value)}
            />
          </FormField>
          <FormField label="Chi nhánh">
            <Input
              value={bank.branch}
              onChange={(e) => updateBank("branch", e.target.value)}
            />
          </FormField>
        </div>
      </div>

      {/* QR card */}
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            Mã QR nhận học phí
          </p>
          <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">
            Tự động tạo
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Mã được tạo từ thông tin ngân hàng ở trên. Phụ huynh quét để chuyển
          học phí trực tiếp vào tài khoản của bạn.
        </p>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="w-full max-w-[180px] shrink-0 rounded-xl border border-border-light p-3 text-center">
            <p className="mb-2 flex items-center justify-center gap-1 text-xs font-semibold text-foreground">
              <QrCode className="size-3.5 text-primary" />
              VietQR
            </p>
            <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
              <QrCode className="size-16 text-foreground" strokeWidth={1} />
            </div>
            <p className="mt-2 truncate text-xs font-medium text-foreground">
              {bank.accountHolder}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {bank.bankName} · {maskedAccountNumber.slice(-4)}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col divide-y divide-border-light">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">Ngân hàng</span>
                <span className="font-medium text-foreground">
                  {bank.bankName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">Số tài khoản</span>
                <span className="font-medium text-foreground">
                  {bank.accountNumber}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">Chủ tài khoản</span>
                <span className="font-medium text-foreground">
                  {bank.accountHolder}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="ghost"
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <Download className="size-3.5" />
                Tải mã QR
              </Button>
              <Button variant="ghost"
                type="button"
                onClick={handleCopyAccountNumber}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Copy className="size-3.5" />
                Sao chép số TK
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <SwitchRow
          defaultChecked
          label="Gửi nhắc thanh toán tự động"
          desc="Nhắn phụ huynh khi học phí đến hạn."
        />
      </div>
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <SwitchRow
          label="Gửi biên lai điện tử"
          desc="Tự động gửi biên lai sau mỗi lần nhận tiền."
        />
      </div>

      <SaveButton />
    </div>
  );
}
