"use client";

import { Switch } from "@/components/ui/switch.ui";

export type SwitchRowProps = {
  label: string;
  desc?: string;
  /** Initial value; the row keeps its own state (uncontrolled), as the settings toggles always did. */
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
};

/** Label + description on the left, `Switch` on the right. */
export function SwitchRow({ label, desc, defaultChecked, checked, onCheckedChange, disabled }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch
        aria-label={label}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
