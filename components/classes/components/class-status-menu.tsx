"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, PlayCircle, type LucideIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { StatusMenu } from "@/components/ui/status-menu.ui";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import type { ClassStatus } from "@/types";

const classStatusIcon: Record<ClassStatus, LucideIcon> = {
  OPEN: PlayCircle,
  UPCOMING: CalendarClock,
  CLOSED: CheckCircle2,
};

const ALL_CLASS_STATUSES: ClassStatus[] = ["OPEN", "UPCOMING", "CLOSED"];

/**
 * Menu đổi trạng thái lớp. Chuyển sang "Đã đóng" phải xác nhận trước (ConfirmDialog);
 * ẩn menu ở page cha khi lớp đã đóng.
 */
export const ClassStatusMenu = ({
  status,
  statusLabel,
  onChangeStatus,
  disabled,
  ariaLabel,
  triggerIcon,
}: {
  status: ClassStatus;
  statusLabel: Record<ClassStatus, string>;
  onChangeStatus: (status: ClassStatus) => void;
  disabled?: boolean;
  ariaLabel: string;
  /** Icon nút mở menu; mặc định là ⋮. */
  triggerIcon?: LucideIcon;
}) => {
  const common = useCommonCopy();
  const [pendingStatus, setPendingStatus] = useState<ClassStatus | null>(null);

  const options = ALL_CLASS_STATUSES.map((value) => ({
    value,
    label: statusLabel[value],
    icon: classStatusIcon[value],
  }));

  const handleSelect = (next: ClassStatus) => {
    if (next === "CLOSED") setPendingStatus(next);
    else onChangeStatus(next);
  };

  return (
    <>
      <StatusMenu
        current={status}
        options={options}
        onSelect={handleSelect}
        ariaLabel={ariaLabel}
        disabled={disabled}
        triggerIcon={triggerIcon}
        align="start"
      />
      <ConfirmDialog
        open={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) onChangeStatus(pendingStatus);
          setPendingStatus(null);
        }}
        variant="default"
        loading={disabled}
        title={common.statusConfirm.closeClassTitle}
        description={common.statusConfirm.closeClassDescription}
        confirmLabel={common.statusConfirm.confirm}
      />
    </>
  );
};
