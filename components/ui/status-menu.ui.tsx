"use client";

import { useState } from "react";
import { MoreVertical, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import MenuPopover from "@/components/ui/menu-popover.ui";

export type StatusMenuOption<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
};

type StatusMenuProps<T extends string> = {
  current: T;
  options: StatusMenuOption<T>[];
  /** Gọi khi chọn một trạng thái khác trạng thái hiện tại. */
  onSelect: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  /** Icon nút mở menu; mặc định là ⋮. */
  triggerIcon?: LucideIcon;
  align?: "start" | "end";
};

/**
 * Menu đổi trạng thái dùng chung (icon trigger + danh sách trạng thái có icon).
 * Trạng thái hiện tại bị khoá. Dùng cho lớp, buổi học và các thực thể có status tương tự.
 */
export function StatusMenu<T extends string>({
  current,
  options,
  onSelect,
  ariaLabel,
  disabled,
  triggerIcon: TriggerIcon = MoreVertical,
  align = "end",
}: StatusMenuProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <MenuPopover
      align={align}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={ariaLabel}
          disabled={disabled}
        >
          <TriggerIcon className="size-4" />
        </Button>
      }
    >
      <div className="flex flex-col gap-0.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isCurrent = opt.value === current;
          return (
            <Button
              key={opt.value}
              type="button"
              variant="ghost"
              disabled={isCurrent || disabled}
              onClick={() => {
                setOpen(false);
                onSelect(opt.value);
              }}
              className="h-auto! w-full! justify-start! gap-2! px-2! py-1.5! text-sm! font-normal"
            >
              <Icon className="size-3.5" />
              {opt.label}
            </Button>
          );
        })}
      </div>
    </MenuPopover>
  );
}
