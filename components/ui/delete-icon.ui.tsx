import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Icon xoá dùng chung toàn app: ô bo góc nền đỏ nhạt + thùng rác đỏ.
 * Đặt bên trong `Button`/trigger có sẵn (không tự xử lý click).
 */
export function DeleteIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 dark:bg-red-500/15",
        className,
      )}
    >
      <Trash2 className="size-3.5" />
    </span>
  );
}
