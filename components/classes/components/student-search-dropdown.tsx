"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { cn } from "@/lib/utils";
import type { ApiStudent } from "@/types";

export function studentDisplayName(s: ApiStudent, fallback: string) {
  return (
    [s.lastName, s.firstName].filter(Boolean).join(" ") ||
    s.username ||
    fallback
  );
}

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  students: ApiStudent[];
  loading: boolean;
  selectedIds: string[];
  /** Tên học sinh theo id, dùng cho chip đã chọn. */
  names: Record<string, string>;
  max: number;
  /** Nhóm: checkbox vuông. 1 kèm 1: radio tròn. */
  multi: boolean;
  onToggle: (student: ApiStudent) => void;
  onRemove: (id: string) => void;
  placeholder: string;
  noResultsText: string;
  fallbackName: string;
};

/**
 * Ô tìm học sinh: focus/click mở dropdown danh sách (portal, không đẩy layout),
 * học sinh đã chọn hiện thành chip bên dưới để bỏ chọn nhanh.
 */
export function StudentSearchDropdown({
  search,
  onSearchChange,
  students,
  loading,
  selectedIds,
  names,
  max,
  multi,
  onToggle,
  onRemove,
  placeholder,
  noResultsText,
  fallbackName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Vị trí dropdown theo ô tìm kiếm; tự mở lên trên khi phía dưới không đủ chỗ.
   * Cập nhật khi cuộn (kể cả cuộn dialog) hoặc đổi kích thước. */
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const GAP = 4;
      const DROPDOWN_MAX = 280; // = max-h mặc định của dropdown
      const spaceBelow = window.innerHeight - rect.bottom - GAP;
      const spaceAbove = rect.top - GAP;
      const openUp = spaceBelow < DROPDOWN_MAX && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(120, Math.min(DROPDOWN_MAX, available));
      setPos(
        openUp
          ? {
              bottom: window.innerHeight - rect.top + GAP,
              left: rect.left,
              width: rect.width,
              maxHeight,
            }
          : {
              top: rect.bottom + GAP,
              left: rect.left,
              width: rect.width,
              maxHeight,
            },
      );
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  /* Đóng khi bấm ra ngoài hoặc Escape. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleToggle = (s: ApiStudent) => {
    onToggle(s);
    // 1 kèm 1: chọn xong thì đóng dropdown.
    if (!multi && !selectedIds.includes(s.id)) setOpen(false);
  };

  const dropdown =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
            className="fixed z-[60] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {noResultsText}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {students.map((s) => {
                  const selected = selectedIds.includes(s.id);
                  const name = studentDisplayName(s, fallbackName);
                  // 1 kèm 1: không disable, chọn học sinh khác sẽ thay thế lựa chọn hiện tại.
                  // Nhóm: đã đủ max thì khóa các học sinh chưa chọn.
                  const disabled =
                    multi && !selected && selectedIds.length >= max;
                  return (
                    <Button
                      key={s.id}
                      type="button"
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => handleToggle(s)}
                      className={cn(
                        "h-auto! w-full! justify-start! gap-3! rounded-none! px-4! py-3! text-left font-normal",
                        selected && "bg-primary-light",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                          selected ? "bg-primary" : "bg-muted-foreground",
                        )}
                      >
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {name}
                        </span>
                        {s.phone && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {s.phone}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center border-2 transition-colors",
                          multi ? "rounded-md" : "rounded-full",
                          selected
                            ? "border-primary bg-primary"
                            : "border-border bg-card",
                        )}
                      >
                        {selected && <Check className="size-3 text-white" />}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-3">
      <div ref={anchorRef} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-10"
          autoComplete="off"
        />
      </div>
      {dropdown}

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const label = names[id] ?? fallbackName;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-light py-1 pl-3 pr-1 text-xs font-medium text-primary"
              >
                {label}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={label}
                  onClick={() => onRemove(id)}
                >
                  <X className="size-3" />
                </Button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
