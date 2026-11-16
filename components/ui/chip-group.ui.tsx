"use client";

import { Button } from "@/components/ui/button.ui";
import { cn } from "@/lib/utils";

export type ChipOption = { label: string; value: string };

export type ChipGroupProps = {
  options: readonly ChipOption[];
  /** Values currently selected. The group does not decide single vs multi selection. */
  selected: readonly string[];
  /** Called with the clicked option's value; the parent updates its own state. */
  onToggle: (value: string) => void;
  /** `pill` for tag-like chips (multi-select); `block` for full-width segments (single select). */
  variant?: "pill" | "block";
  disabled?: boolean;
  /** Wrapper classes, e.g. `grid grid-cols-3 gap-2` for segmented controls. */
  className?: string;
  "aria-label"?: string;
};

/**
 * Group of toggle buttons (`aria-pressed`). Built on the `Button` primitive so it follows the
 * theme. Use it instead of hand-rolled `<button>` rows for gender, subjects, status filters, ...
 */
export function ChipGroup({
  options,
  selected,
  onToggle,
  variant = "pill",
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: ChipGroupProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="chip-group"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onToggle(option.value)}
            className={cn(
              variant === "pill"
                ? "h-auto! w-auto! rounded-full px-3 py-1.5 text-sm font-medium"
                : "h-11! w-full! rounded-md text-sm font-medium",
              "transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary hover:bg-primary/10"
                : "border-input bg-surface-container-lowest text-foreground hover:border-primary/40",
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
