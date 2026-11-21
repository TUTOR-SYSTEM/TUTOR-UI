"use client";

import { useSettingsCopy } from "@/hooks/useSettingsCopy.hook";
import { useState } from "react";

import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { SwitchRow } from "@/components/ui/switch-row.ui";
import { SaveButton } from "@/components/settings/settings-save-button";

export function ClassesPanel() {
  const { classes: copy } = useSettingsCopy();
  const [sessionDuration, setSessionDuration] = useState("90");
  const [timezone, setTimezone] = useState("hanoi");
  return (
    <div className="grid grid-cols-2 gap-6 w-full">
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-foreground">
          {copy.defaultsTitle}
        </p>
        <div className="grid grid-4 gap-4">
          <FormField label={copy.sessionDuration}>
            <Select
              options={copy.durations}
              value={sessionDuration}
              onValueChange={setSessionDuration}
            />
          </FormField>
          <FormField label={copy.defaultFee}>
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
          <FormField label={copy.timezone}>
            <Select
              options={copy.timezones}
              value={timezone}
              onValueChange={setTimezone}
            />
          </FormField>
          <FormField label={copy.workHours}>
            <Input
              type="text"
              defaultValue="08:00 – 21:00"
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </FormField>
        </div>
      </div>

      <div className="rounded-lg border border-border-light divide-y divide-border-light px-4 shadow-sm">
        {copy.switches.map((sw, i) => (
          <SwitchRow
            key={i}
            defaultChecked={i < 2}
            label={sw.label}
            desc={sw.desc}
          />
        ))}
        <SaveButton />
      </div>
    </div>
  );
}
