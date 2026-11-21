"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type MenuPopoverProps = {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  /** Neo dọc theo trigger — "bottom" (mặc định, mở xuống) hay "top" (mở lên,
   * neo đáy content vào sát mép trên trigger). Dùng "top" khi trigger nằm sát
   * đáy viewport/container cuộn (vd user menu ở chân sidebar) để nội dung
   * không bị tràn xuống dưới màn hình. */
  side?: "top" | "bottom";
  contentClassName?: string;
  /** Trigger chiếm đủ chiều ngang container (vd ô chọn ngày khớp width với Input). */
  fullWidth?: boolean;
  /** Chế độ controlled: đóng menu sau khi chọn (gọi `onOpenChange(false)`). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

type Position = { top?: number; bottom?: number; left?: number; right?: number };

/**
 * Panel đơn giản: mở theo click trigger (bubble), đóng khi click ra ngoài hoặc Escape.
 * Nội dung render qua portal (`document.body`, `position: fixed`) để không bị
 * cha `overflow`/`z-index` (vd bảng cuộn ngang) che hoặc cắt mất.
 */
const MenuPopover = ({
  trigger,
  children,
  align = "end",
  side = "bottom",
  contentClassName,
  fullWidth = false,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: MenuPopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (controlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [controlled, onOpenChange],
  );

  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  const close = useCallback(() => setOpen(false), [setOpen]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vertical =
      side === "top"
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 };
    const horizontal =
      align === "end"
        ? { right: window.innerWidth - rect.right }
        : { left: rect.left };
    setPosition({ ...vertical, ...horizontal });
  }, [align, side]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    /* Đóng khi cuộn (kể cả cuộn ngang bảng chứa trigger) thay vì reposition theo dõi realtime. */
    const onScroll = () => close();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, close]);

  return (
    <div
      ref={triggerRef}
      data-testid="menu-popover"
      className={cn("relative inline-flex", fullWidth && "flex w-full")}
    >
      <div onClick={() => setOpen(!open)} className={cn(fullWidth && "w-full")}>
        {trigger}
      </div>
      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={contentRef}
              role="menu"
              style={{
                top: position.top,
                bottom: position.bottom,
                left: position.left,
                right: position.right,
              }}
              className={cn(
                "fixed z-50 min-w-[200px] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md",
                contentClassName,
              )}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default MenuPopover;
