import * as React from "react";
import { cn } from "@/lib/utils";

const inputInvalidChrome =
  "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/35 focus-visible:aria-invalid:border-destructive focus-visible:aria-invalid:ring-2 focus-visible:aria-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/40 dark:focus-visible:aria-invalid:border-destructive dark:focus-visible:aria-invalid:ring-destructive/45";

export type InputProps = React.ComponentProps<"input"> & {
  outlinedSlot?: boolean;
  invalid?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    type = "text",
    outlinedSlot = false,
    invalid,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const mergedAriaInvalid: React.AriaAttributes["aria-invalid"] =
    ariaInvalid !== undefined ? ariaInvalid : invalid;

  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      aria-invalid={mergedAriaInvalid}
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-solid border-input bg-surface-container-lowest px-3 py-2.5 text-base transition-[color,background-color,border-color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
        !outlinedSlot && inputInvalidChrome,
        className,
      )}
      {...props}
    />
  );
});

export { Input };
