"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";

import { useSettingsCopy } from "@/hooks/useSettingsCopy.hook";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { SwitchRow } from "@/components/ui/switch-row.ui";
import { getErrorMessage } from "@/lib/axios";
import {
  TUTOR_SETTINGS_QUERY_KEY,
  useTutorSettingsActions,
} from "@/lib/services/tutor-settings.service";
import type { PaymentSettings } from "@/types";

const EMPTY: PaymentSettings = {
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  branch: "",
  autoPaymentReminder: true,
  electronicReceipt: false,
};

export function FeesPanel() {
  const { fees: copy, common } = useSettingsCopy();
  const queryClient = useQueryClient();
  const { payment, updatePayment } = useTutorSettingsActions();

  /* Bản nháp cục bộ; chưa sửa thì hiển thị đúng dữ liệu từ server. */
  const [draft, setDraft] = useState<PaymentSettings | null>(null);
  const form: PaymentSettings = draft ?? payment.data ?? EMPTY;
  const configured = !!(form.bankName && form.accountHolder && form.accountNumber);

  const patch = (changes: Partial<PaymentSettings>) =>
    setDraft({ ...form, ...changes });

  const maskedAccountNumber = form.accountNumber
    ? form.accountNumber.replace(/^\d+(\d{4})$/, "•••• •••• $1")
    : "";

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(form.accountNumber);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copyFailed);
    }
  };

  const handleSave = () => {
    if (!form.bankName.trim() || !form.accountHolder.trim() || !form.accountNumber.trim()) {
      toast.error(copy.required);
      return;
    }
    updatePayment.mutate(form, {
      onSuccess: () => {
        setDraft(null);
        queryClient.invalidateQueries({ queryKey: TUTOR_SETTINGS_QUERY_KEY });
        toast.success(common.saved);
      },
      onError: (err) => toast.error(getErrorMessage(err, "Lưu thanh toán thất bại")),
    });
  };

  if (payment.isLoading) {
    return <p className="text-sm text-muted-foreground">{copy.loading}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Bank account card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E9F8E] to-[#0B4A42] p-6 text-white shadow-sm">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              {copy.receivingAccount}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {form.bankName || copy.notConfigured}
            </p>
          </div>
          {configured && (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {copy.default}
            </span>
          )}
        </div>
        {configured && (
          <>
            <p className="relative mt-6 text-2xl font-semibold tracking-[0.2em]">
              {maskedAccountNumber}
            </p>
            <div className="relative mt-4 flex items-end justify-between">
              <p className="text-sm font-medium text-white/90">{form.accountHolder}</p>
              <p className="text-xs text-white/70">{form.branch}</p>
            </div>
          </>
        )}
      </div>

      {/* Bank info card */}
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-foreground">{copy.bankInfoTitle}</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={copy.bank}>
            <Input value={form.bankName} onChange={(e) => patch({ bankName: e.target.value })} />
          </FormField>
          <FormField label={copy.holder}>
            <Input
              value={form.accountHolder}
              onChange={(e) => patch({ accountHolder: e.target.value })}
            />
          </FormField>
          <FormField label={copy.accountNumber}>
            <Input
              inputMode="numeric"
              value={form.accountNumber}
              onChange={(e) => patch({ accountNumber: e.target.value })}
            />
          </FormField>
          <FormField label={copy.branch}>
            <Input value={form.branch} onChange={(e) => patch({ branch: e.target.value })} />
          </FormField>
        </div>
      </div>

      {/* QR card */}
      {configured && (
        <div className="rounded-lg border border-border-light p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{copy.qrTitle}</p>
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">
              {copy.qrAuto}
            </span>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">{copy.qrDesc}</p>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="w-full max-w-[180px] shrink-0 rounded-xl border border-border-light p-3 text-center">
              <p className="mb-2 flex items-center justify-center gap-1 text-xs font-semibold text-foreground">
                <QrCode className="size-3.5 text-primary" />
                VietQR
              </p>
              <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
                <QrCode className="size-16 text-foreground" strokeWidth={1} />
              </div>
              <p className="mt-2 truncate text-xs font-medium text-foreground">{form.accountHolder}</p>
              <p className="text-[11px] text-muted-foreground">
                {form.bankName} · {form.accountNumber.slice(-4)}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col divide-y divide-border-light">
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{copy.bank}</span>
                  <span className="font-medium text-foreground">{form.bankName}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{copy.accountNumber}</span>
                  <span className="font-medium text-foreground">{form.accountNumber}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{copy.holder}</span>
                  <span className="font-medium text-foreground">{form.accountHolder}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button type="button" size="sm" variant="default">
                  <Download className="size-3.5" />
                  {copy.downloadQr}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleCopyAccountNumber}>
                  <Copy className="size-3.5" />
                  {copy.copyAccount}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <SwitchRow
          label={copy.switches[0].label}
          desc={copy.switches[0].desc}
          checked={form.autoPaymentReminder}
          onCheckedChange={(checked) => patch({ autoPaymentReminder: checked })}
        />
      </div>
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <SwitchRow
          label={copy.switches[1].label}
          desc={copy.switches[1].desc}
          checked={form.electronicReceipt}
          onCheckedChange={(checked) => patch({ electronicReceipt: checked })}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} loading={updatePayment.isPending} disabled={updatePayment.isPending}>
          {common.save}
        </Button>
      </div>
    </div>
  );
}
