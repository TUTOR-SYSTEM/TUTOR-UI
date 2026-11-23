"use client";

import { Button } from "@/components/ui/button.ui";

type ClassLocationHintProps = {
  /** Địa điểm/link mặc định của lớp (rỗng khi lớp chưa có). */
  classLocation: string | null | undefined;
  /** Giá trị đang nhập cho buổi học. */
  value: string;
  onUseClassLocation: () => void;
};

const isLink = (v: string) => /^https?:\/\//i.test(v.trim());

/**
 * Hiển thị địa điểm/link mặc định của lớp dưới ô "Địa điểm / Link học" của buổi học,
 * kèm nút đặt lại khi buổi đã đổi khác mặc định. Buổi có thể đổi địa điểm riêng.
 */
export function ClassLocationHint({
  classLocation,
  value,
  onUseClassLocation,
}: ClassLocationHintProps) {
  const base = classLocation?.trim();
  if (!base) return null;
  const changed = value.trim() !== base;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span>Theo lớp:</span>
      {isLink(base) ? (
        <a
          href={base}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate font-medium text-primary underline-offset-2 hover:underline"
        >
          {base}
        </a>
      ) : (
        <span className="font-medium text-foreground">{base}</span>
      )}
      {changed && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onUseClassLocation}
          className="h-auto px-1 py-0.5 text-xs"
        >
          Dùng địa điểm của lớp
        </Button>
      )}
    </div>
  );
}
