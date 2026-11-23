"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import MenuPopover from "@/components/ui/menu-popover.ui";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { useLocale } from "@/hooks/useLocale.hook";
import { buildMonthGrid, parseIsoDate, toIsoDate } from "@/lib/date/iso-date";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  /** Giá trị dạng `yyyy-mm-dd`, hoặc chuỗi rỗng khi chưa chọn. */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Ngày nhỏ nhất / lớn nhất được chọn, dạng `yyyy-mm-dd`. */
  min?: string;
  max?: string;
  id?: string;
  className?: string;
};

/**
 * Chọn ngày bằng popover lịch (thay cho `<input type="date">` gốc).
 * Hiển thị theo locale (vi: dd/mm/yyyy, en: mm/dd/yyyy). Nội dung render qua portal.
 */
export function DatePicker({
  value,
  onValueChange,
  placeholder,
  invalid = false,
  disabled = false,
  min,
  max,
  id,
  className,
}: DatePickerProps) {
  const common = useCommonCopy();
  const { language } = useLocale();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const [open, setOpen] = useState(false);

  const selected = parseIsoDate(value);
  const minDate = min ? parseIsoDate(min) : null;
  const maxDate = max ? parseIsoDate(max) : null;

  const today = new Date();
  // Tháng đang xem; mỗi lần mở lại đồng bộ về tháng của giá trị đã chọn (hoặc tháng hiện tại).
  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const base = selected ?? today;
      setView({ year: base.getFullYear(), month: base.getMonth() });
    }
    setOpen(next);
  };

  const rows = useMemo(() => buildMonthGrid(view.year, view.month), [view]);

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(view.year, view.month, 1));

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      new Date(2024, 0, 1 + i), // 01/01/2024 là Thứ Hai
    ),
  );

  const displayValue = selected
    ? new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(selected)
    : "";

  const isDisabledDay = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const pick = (date: Date) => {
    onValueChange(toIsoDate(date));
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <MenuPopover
      align="start"
      open={open}
      onOpenChange={handleOpenChange}
      fullWidth
      contentClassName="w-72 p-3"
      trigger={
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            // Khớp Input, Select và Button (h-10): cùng viền, nền, padding và chữ.
            "h-10! w-full! justify-between! rounded-md! border-input! bg-surface-container-lowest! px-3! text-sm! font-normal shadow-none!",
            "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary",
            invalid &&
              "border-destructive! ring-2 ring-destructive/35 focus-visible:border-destructive focus-visible:ring-destructive/40",
            selected ? "text-foreground" : "text-muted-foreground",
            className,
          )}
        >
          <span>{displayValue || placeholder || common.datePicker.placeholder}</span>
          <CalendarDays className="size-4 text-muted-foreground" />
        </Button>
      }
    >
      <div className="flex items-center justify-between pb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={common.datePicker.prevMonth}
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold capitalize">{monthLabel}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={common.datePicker.nextMonth}
          onClick={() => shiftMonth(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 pb-1 text-center text-xs text-muted-foreground">
        {weekdays.map((w) => (
          <span key={w} className="py-1 capitalize">
            {w}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        {rows.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-0.5">
            {row.map((date, c) => {
              if (!date) return <span key={c} />;
              const isSelected =
                !!selected && toIsoDate(date) === toIsoDate(selected);
              const isToday = toIsoDate(date) === toIsoDate(today);
              const off = isDisabledDay(date);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={off}
                  onClick={() => pick(date)}
                  aria-pressed={isSelected}
                  className={cn(
                    "h-8 w-full rounded-md text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                    isToday && !isSelected && "font-semibold text-primary",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onValueChange("");
            setOpen(false);
          }}
          disabled={!selected}
        >
          {common.datePicker.clear}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDisabledDay(today)}
          onClick={() => pick(today)}
        >
          {common.datePicker.today}
        </Button>
      </div>
    </MenuPopover>
  );
}
