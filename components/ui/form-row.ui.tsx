"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type FormRowProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

/** Label on the left, control on the right, with a bottom divider between rows. */
export function FormRow({ label, children, className }: FormRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border-light py-3 last:border-0",
        className,
      )}
    >
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
