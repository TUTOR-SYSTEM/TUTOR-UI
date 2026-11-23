"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import MenuPopover from "@/components/ui/menu-popover.ui";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { cn } from "@/lib/utils";

type TimePickerProps = {
  /** Giá trị dạng `HH:mm` (24h), hoặc chuỗi rỗng khi chưa chọn. */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Bước phút trong danh sách chọn (mặc định 5). */
  minuteStep?: number;
  id?: string;
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

function parseTime(value: string): { hour: number | null; minute: number | null } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return { hour: null, minute: null };
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * Chọn giờ bằng popover hai cột giờ/phút (thay cho `<input type="time">` gốc).
 * Nội dung render qua portal, giá trị luôn theo định dạng 24h `HH:mm`.
 */
export function TimePicker({
  value,
  onValueChange,
  placeholder,
  invalid = false,
  disabled = false,
  minuteStep = 5,
  id,
  className,
}: TimePickerProps) {
  const common = useCommonCopy();
  const [open, setOpen] = useState(false);
  const { hour, minute } = parseTime(value);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep);

  // Chọn một phần khi chưa có giá trị: phần còn lại mặc định 00.
  const setHour = (h: number) => onValueChange(`${pad(h)}:${pad(minute ?? 0)}`);
  const setMinute = (m: number) => onValueChange(`${pad(hour ?? 0)}:${pad(m)}`);

  const optionClass = (selected: boolean) =>
    cn(
      "h-10 w-full shrink-0 rounded-md text-sm transition-colors",
      "hover:bg-accent hover:text-accent-foreground",
      selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
    );

  return (
    <MenuPopover
      align="start"
      open={open}
      onOpenChange={setOpen}
      fullWidth
      contentClassName="w-56 p-2"
      trigger={
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            // Khớp Input/DatePicker: cùng viền, nền, padding và chữ.
            "h-10! w-full! justify-between! rounded-md! border-input! bg-surface-container-lowest! px-3! text-sm! font-normal shadow-none!",
            "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary",
            invalid &&
              "border-destructive! ring-2 ring-destructive/35 focus-visible:border-destructive focus-visible:ring-destructive/40",
            value ? "text-foreground" : "text-muted-foreground",
            className,
          )}
        >
          <span>{value || placeholder || common.timePicker.placeholder}</span>
          <Clock className="size-4 text-muted-foreground" />
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="scrollbar-thin flex max-h-72 flex-col gap-0.5 overflow-y-auto pr-1">
          {hours.map((h) => {
            const selected = hour === h;
            return (
              <button
                key={h}
                type="button"
                aria-pressed={selected}
                ref={selected ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                onClick={() => setHour(h)}
                className={optionClass(selected)}
              >
                {pad(h)}
              </button>
            );
          })}
        </div>
        <div className="scrollbar-thin flex max-h-72 flex-col gap-0.5 overflow-y-auto pr-1">
          {minutes.map((m) => {
            const selected = minute === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={selected}
                ref={selected ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                onClick={() => setMinute(m)}
                className={optionClass(selected)}
              >
                {pad(m)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onValueChange("");
            setOpen(false);
          }}
          disabled={!value}
        >
          {common.timePicker.clear}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {common.timePicker.done}
        </Button>
      </div>
    </MenuPopover>
  );
}
