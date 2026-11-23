"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSettingsCopy } from "@/hooks/useSettingsCopy.hook";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { SwitchRow } from "@/components/ui/switch-row.ui";
import { TimePicker } from "@/components/ui/time-picker.ui";
import { getErrorMessage } from "@/lib/axios";
import {
  TUTOR_SETTINGS_QUERY_KEY,
  useTutorSettingsActions,
} from "@/lib/services/tutor-settings.service";
import type { TeachingSettings } from "@/types";

type SwitchKey =
  | "remindStudents"
  | "allowOnlineBooking"
  | "autoInvoiceMonthly"
  | "breakBetweenSessions";

/** Thứ tự công tắc khớp `copy.classes.switches`. */
const SWITCH_KEYS: SwitchKey[] = [
  "remindStudents",
  "allowOnlineBooking",
  "autoInvoiceMonthly",
  "breakBetweenSessions",
];

export function ClassesPanel() {
  const { classes: copy, common } = useSettingsCopy();
  const queryClient = useQueryClient();
  const { teaching, updateTeaching } = useTutorSettingsActions();

  /* Bản nháp cục bộ; chưa sửa thì hiển thị đúng dữ liệu từ server. */
  const [draft, setDraft] = useState<TeachingSettings | null>(null);
  const form = draft ?? teaching.data ?? null;

  const patch = (changes: Partial<TeachingSettings>) => {
    if (!form) return;
    setDraft({ ...form, ...changes });
  };

  const handleSave = () => {
    if (!form) return;
    if (form.workHoursEnd <= form.workHoursStart) {
      toast.error("Giờ kết thúc làm việc phải sau giờ bắt đầu");
      return;
    }
    updateTeaching.mutate(form, {
      onSuccess: () => {
        setDraft(null);
        queryClient.invalidateQueries({ queryKey: TUTOR_SETTINGS_QUERY_KEY });
        toast.success(common.saved);
      },
      onError: (err) => toast.error(getErrorMessage(err, "Lưu cài đặt thất bại")),
    });
  };

  const loading = teaching.isLoading;
  const saving = updateTeaching.isPending;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-2 gap-6 w-full">
        <div className="rounded-lg border border-border-light p-4 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-foreground">
            {copy.defaultsTitle}
          </p>
          {loading || !form ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : (
            <div className="grid grid-4 gap-4">
              <FormField label={copy.sessionDuration}>
                <Select
                  options={copy.durations}
                  value={String(form.sessionDurationMinutes)}
                  onValueChange={(v) => patch({ sessionDurationMinutes: Number(v) })}
                />
              </FormField>
              <FormField label={copy.defaultFee}>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.defaultFee.toLocaleString("vi-VN")}
                    onChange={(e) =>
                      patch({ defaultFee: Number(e.target.value.replace(/\D/g, "")) || 0 })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    đ
                  </span>
                </div>
              </FormField>
              <FormField label={copy.timezone}>
                <Select
                  options={copy.timezones}
                  value={form.timezone}
                  onValueChange={(v) => patch({ timezone: v })}
                />
              </FormField>
              <FormField label={copy.workHours}>
                <div className="flex items-center gap-2">
                  <TimePicker
                    value={form.workHoursStart}
                    onValueChange={(v) => v && patch({ workHoursStart: v })}
                  />
                  <span className="text-muted-foreground">–</span>
                  <TimePicker
                    value={form.workHoursEnd}
                    onValueChange={(v) => v && patch({ workHoursEnd: v })}
                  />
                </div>
              </FormField>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border-light divide-y divide-border-light px-4 shadow-sm">
          {!form
            ? null
            : copy.switches.map((sw, i) => {
                const key = SWITCH_KEYS[i];
                return (
                  <SwitchRow
                    key={key}
                    label={sw.label}
                    desc={sw.desc}
                    checked={form[key]}
                    onCheckedChange={(checked) => patch({ [key]: checked })}
                  />
                );
              })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} loading={saving} disabled={!form || saving}>
          {common.save}
        </Button>
      </div>
    </div>
  );
}
