"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { SwitchRow } from "@/components/ui/switch-row.ui";
import { SaveButton } from "@/components/settings/settings-save-button";

const SESSION_DURATIONS = [
  { label: "60 phút", value: "60 phút" },
  { label: "90 phút", value: "90 phút" },
  { label: "120 phút", value: "120 phút" },
];

const TIMEZONES = [
  { label: "(GMT+7) Hà Nội", value: "(GMT+7) Hà Nội" },
  { label: "(GMT+7) TP. Hồ Chí Minh", value: "(GMT+7) TP. Hồ Chí Minh" },
  { label: "(GMT+7) Đà Nẵng", value: "(GMT+7) Đà Nẵng" },
];

export function ClassesPanel() {
  const [sessionDuration, setSessionDuration] = useState("90 phút");
  const [timezone, setTimezone] = useState("(GMT+7) Hà Nội");
  return (
    <div className="grid grid-cols-2 gap-6 w-full">
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-foreground">
          Mặc định buổi học
        </p>
        <div className="grid grid-4 gap-4">
          <FormField label="Thời lượng buổi học">
            <Select
              options={SESSION_DURATIONS}
              value={sessionDuration}
              onValueChange={setSessionDuration}
            />
          </FormField>
          <FormField label="Học phí mặc định / buổi">
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                defaultValue="250.000"
                className="h-10 w-full rounded-lg border border-border bg-card px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                đ
              </span>
            </div>
          </FormField>
          <FormField label="Múi giờ">
            <Select
              options={TIMEZONES}
              value={timezone}
              onValueChange={setTimezone}
            />
          </FormField>
          <FormField label="Giờ làm việc">
            <Input
              type="text"
              defaultValue="08:00 – 21:00"
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </FormField>
        </div>
      </div>

      <div className="rounded-lg border border-border-light divide-y divide-border-light px-4 shadow-sm">
        <SwitchRow
          defaultChecked
          label="Tự động nhắc học sinh"
          desc="Gửi SMS nhắc học sinh trước buổi học 1 giờ."
        />
        <SwitchRow
          defaultChecked
          label="Cho phép đặt lịch online"
          desc="Học sinh có thể tự đăng ký vào khung giờ trống."
        />
        <SwitchRow
          label="Tự động tạo hoá đơn cuối tháng"
          desc="Tổng hợp học phí theo số buổi đã dạy."
        />
        <SwitchRow
          label="Thời gian nghỉ giữa buổi"
          desc="Tự chừa 15 phút giữa hai buổi liên tiếp."
        />
        <SaveButton />
      </div>
    </div>
  );
}
