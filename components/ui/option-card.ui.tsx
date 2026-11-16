"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type OptionCardProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Whether this card is the current choice (exposed as `aria-pressed`). */
  selected?: boolean;
};

/**
 * Clickable tile for picking one option from a set (theme, language, ...). It is not a `Button`:
 * these tiles carry their own layout (previews, flags, sub-labels) and `Button`'s base sizing would
 * break it. Only the interaction and a11y attributes are provided here.
 */
export function OptionCard({ selected, className, children, ...props }: OptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-selected={selected || undefined}
      className={cn("block w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40", className)}
      {...props}
    >
      {children}
    </button>
  );
}
