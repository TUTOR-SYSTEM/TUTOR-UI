"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.ComponentProps<"textarea"> & {
  invalid?: boolean;
};

/** Multi-line text field with the same border/focus chrome as `Input`. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full resize-none rounded-lg border border-input bg-surface-container-lowest px-3 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-destructive",
        className,
      )}
      {...props}
    />
  );
});

export { Textarea };
