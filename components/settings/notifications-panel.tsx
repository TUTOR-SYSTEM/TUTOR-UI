"use client";

import { useSettingsCopy } from "@/hooks/useSettingsCopy.hook";
import { SwitchRow } from "@/components/ui/switch-row.ui";
import { SectionHeading } from "@/components/ui/section-heading.ui";
import { Separator } from "@/components/ui/separator.ui";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import type { NotificationType } from "@/types";
import { SaveButton } from "@/components/settings/settings-save-button";

const TYPE_ORDER: NotificationType[] = ["SYSTEM", "TUITION", "STUDENT", "TUTOR"];

export function NotificationsPanel() {
  const role = useCurrentUserRole();
  const { notifications: copy } = useSettingsCopy();
  const schedule = copy.schedule[role];
  return (
    <div className="flex flex-col gap-2">
      <SectionHeading>{copy.channelsTitle}</SectionHeading>
      <div className="rounded-lg border border-border-light divide-y divide-border-light px-4">
        {copy.channels.map((c, i) => (
          <SwitchRow key={i} defaultChecked={i < 2} label={c.label} desc={c.desc} />
        ))}
      </div>

      <Separator className="my-6" />
      <SectionHeading>{copy.typesTitle}</SectionHeading>
      <div className="rounded-lg border border-border-light divide-y divide-border-light px-4">
        {TYPE_ORDER.filter((t) => copy.types[role][t]).map((t) => (
          <SwitchRow
            key={`${role}-${t}`}
            defaultChecked
            label={copy.typeLabels[t]}
            desc={copy.types[role][t]}
          />
        ))}
      </div>

      {schedule && (
        <>
          <Separator className="my-6" />
          <SectionHeading>{copy.scheduleTitle}</SectionHeading>
          <div className="rounded-lg border border-border-light divide-y divide-border-light px-4">
            {schedule.map((c, i) => (
              <SwitchRow
                key={`${role}-${i}`}
                defaultChecked={i !== 1}
                label={c.label}
                desc={c.desc}
              />
            ))}
          </div>
        </>
      )}

      <SaveButton />
    </div>
  );
}
