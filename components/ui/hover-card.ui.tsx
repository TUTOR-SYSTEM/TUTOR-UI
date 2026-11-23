"use client";

import type { ReactNode } from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

type HoverCardProps = {
  /** Phần tử neo — một node duy nhất (vd `<div>`), nhận hover/focus để mở popover. */
  trigger: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  openDelay?: number;
  contentClassName?: string;
};

/**
 * Popover mở khi hover (hoặc focus) vào trigger, render qua portal nên không bị
 * cha có `overflow-hidden`/`overflow-x-auto` (vd bảng) cắt.
 */
export function HoverCard({
  trigger,
  children,
  side = "bottom",
  align = "start",
  openDelay = 150,
  contentClassName,
}: HoverCardProps) {
  return (
    <HoverCardPrimitive.Root openDelay={openDelay} closeDelay={100}>
      <HoverCardPrimitive.Trigger asChild>{trigger}</HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-50 max-h-72 w-max max-w-xs overflow-y-auto rounded-lg border border-border bg-card p-3 text-sm text-card-foreground shadow-md",
            contentClassName,
          )}
        >
          {children}
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
