"use client";

import * as React from "react";

import { Label } from "@/components/ui/label.ui";
import { cn } from "@/lib/utils";

export type FormFieldProps = {
  /** Visible label text. Rendered through the `Label` primitive. */
  label: string;
  /** Id of the control this label belongs to (wires `htmlFor`). */
  htmlFor?: string;
  required?: boolean;
  /** Helper text shown under the control when there is no error. */
  hint?: string;
  /** Error message (e.g. from React Hook Form). Replaces the hint when set. */
  error?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Label + control + hint/error block for forms. Use it around any `Input`, `Select`,
 * `ChipGroup`, ... so every field renders label, required marker and error the same way.
 */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div data-slot="form-field" className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
