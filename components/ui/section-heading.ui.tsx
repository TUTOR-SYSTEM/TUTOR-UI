import * as React from "react";

import { cn } from "@/lib/utils";

/** Uppercase small heading that groups a block of form fields. */
export function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground", className)}>
      {children}
    </h3>
  );
}
