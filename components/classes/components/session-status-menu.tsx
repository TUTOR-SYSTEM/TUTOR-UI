"use client";

import {
  CalendarClock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { StatusMenu } from "@/components/ui/status-menu.ui";
import type { SessionDto, SessionStatus } from "@/types";

const sessionStatusIcon: Record<SessionStatus, LucideIcon> = {
  SCHEDULED: CalendarClock,
  ONGOING: PlayCircle,
  POSTPONED: PauseCircle,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

/** Per-row "change status" icon menu (upcoming sessions table only). */
export const SessionStatusMenu = ({
  session,
  statusOptions,
  onChangeStatus,
  disabled,
  ariaLabel,
}: {
  session: SessionDto;
  statusOptions: { value: string; label: string }[];
  onChangeStatus: (id: string, status: SessionStatus) => void;
  disabled?: boolean;
  ariaLabel: string;
}) => (
  <StatusMenu<SessionStatus>
    current={session.status}
    options={statusOptions.map((opt) => ({
      value: opt.value as SessionStatus,
      label: opt.label,
      icon: sessionStatusIcon[opt.value as SessionStatus],
    }))}
    onSelect={(value) => onChangeStatus(session.id, value)}
    ariaLabel={ariaLabel}
    disabled={disabled}
    align="end"
  />
);
