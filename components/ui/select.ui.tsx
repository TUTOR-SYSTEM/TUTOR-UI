"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

export const Select = ({
  options,
  value,
  onValueChange,
  placeholder = "Select",
  disabled = false,
  invalid = false,
  className,
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  /* close on outside click */
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, []);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      data-testid="select"
      className={cn("relative inline-flex w-full", className)}
    >
      {/* ── Trigger — mirrors Input styling ── */}
      <button
        type="button"
        data-testid="select-button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md",
          "border border-solid border-input bg-surface-container-lowest",
          "px-3 text-sm outline-none",
          "transition-[border-color,box-shadow] duration-200",
          selectedOption ? "text-foreground" : "text-muted-foreground",
          "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary",
          open && "border-primary ring-1 ring-primary",
          invalid &&
            "border-destructive ring-2 ring-destructive/35 focus-visible:border-destructive focus-visible:ring-destructive/40",
          disabled &&
            "pointer-events-none cursor-not-allowed bg-muted/50 opacity-50",
        )}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "ml-2 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          data-testid="select-options"
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-[calc(5*2.25rem+0.5rem)] w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                data-testid="select-item"
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm",
                  "transition-colors hover:bg-muted",
                  isSelected && "bg-primary/10 font-medium text-primary",
                )}
              >
                <span className="inline-flex size-4 shrink-0 items-center justify-center">
                  {isSelected && <Check className="size-3.5" />}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
