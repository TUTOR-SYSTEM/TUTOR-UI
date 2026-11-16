"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { cn } from "@/lib/utils";
import { useClassesCopy } from "@/hooks/useClassesCopy.hook";
import type { ClassesDictionary } from "@/lib/i18n/classes.dictionary";
import type { SessionDto, SessionStatus } from "@/types";
import { SessionStatusMenu } from "./session-status-menu";

/* Session status → table badge (Buổi học sắp tới / đã qua) */
export const sessionBadgeConfig: Record<SessionStatus, { className: string }> =
  {
    SCHEDULED: {
      className:
        "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    },
    ONGOING: {
      className: "bg-primary/10 text-primary",
    },
    POSTPONED: {
      className:
        "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    },
    COMPLETED: { className: "bg-muted text-muted-foreground" },
    CANCELLED: {
      className:
        "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    },
  };

export const sessionStatusCopyKey: Record<
  SessionStatus,
  keyof ClassesDictionary["detail"]["sessionStatus"]
> = {
  SCHEDULED: "scheduled",
  ONGOING: "ongoing",
  POSTPONED: "postponed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const fmtSessionDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};

const fmtSessionTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const fmtSessionRange = (start?: string, end?: string) => {
  const s = fmtSessionTime(start);
  const e = fmtSessionTime(end);
  if (s && e) return `${s} – ${e}`;
  return s || "—";
};

const SESSION_HEADER_CLASS =
  "py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";

/** Session table (Buổi học sắp tới / đã qua) on the tutor's class detail page. */
export const SessionTable = ({
  title,
  sessions,
  lessonChapterById,
  classId,
  selectedIds,
  onToggle,
  onToggleAll,
  actions,
  loading,
  emptyText,
  statusOptions,
  onChangeStatus,
  statusChangeDisabled,
}: {
  title: string;
  sessions: SessionDto[];
  lessonChapterById: Record<string, string>;
  classId: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  actions?: React.ReactNode;
  loading: boolean;
  emptyText: string;
  statusOptions?: { value: string; label: string }[];
  onChangeStatus?: (id: string, status: SessionStatus) => void;
  statusChangeDisabled?: boolean;
}) => {
  const { detail } = useClassesCopy();
  const allChecked =
    sessions.length > 0 && sessions.every((s) => selectedIds.has(s.id));

  const selectColumn: DataTableColumn<SessionDto> = {
    key: "select",
    header: (
      <Checkbox
        aria-label={detail.sessions.selectAllAria}
        checked={allChecked}
        onCheckedChange={(checked) => onToggleAll(checked === true)}
      />
    ),
    headerClassName: cn(SESSION_HEADER_CLASS, "w-12 px-4"),
    cellClassName: "px-4",
    render: (session, idx) => (
      <Checkbox
        aria-label={detail.sessions.selectRowAria(idx + 1)}
        checked={selectedIds.has(session.id)}
        onCheckedChange={() => onToggle(session.id)}
      />
    ),
  };

  const baseColumns: DataTableColumn<SessionDto>[] = [
    {
      key: "stt",
      header: detail.sessions.columns.stt,
      headerClassName: cn(SESSION_HEADER_CLASS, "w-14 px-2"),
      cellClassName: "px-2 text-muted-foreground",
      render: (session, idx) =>
        String(session.sessionNumber ?? idx + 1).padStart(2, "0"),
    },
    {
      key: "date",
      header: detail.sessions.columns.date,
      headerClassName: cn(SESSION_HEADER_CLASS, "px-3"),
      cellClassName: "px-3 font-medium",
      render: (session) => fmtSessionDate(session.startAt),
    },
    {
      key: "time",
      header: detail.sessions.columns.time,
      headerClassName: cn(SESSION_HEADER_CLASS, "px-3"),
      cellClassName: "px-3 text-muted-foreground",
      render: (session) => fmtSessionRange(session.startAt, session.endAt),
    },
    {
      key: "lesson",
      header: detail.sessions.columns.lessonContent,
      headerClassName: cn(SESSION_HEADER_CLASS, "px-3"),
      cellClassName: "px-3",
      render: (session) => {
        const chapter = session.lessonId
          ? lessonChapterById[session.lessonId]
          : undefined;
        return (
          <>
            <p className="font-semibold leading-tight">
              {session.title || detail.sessions.defaultLessonTitle}
            </p>
            <p className="mt-0.5 text-xs italic text-muted-foreground">
              {chapter ?? "_ _ _ _"}
            </p>
          </>
        );
      },
    },
    {
      key: "status",
      header: detail.sessions.columns.status,
      headerClassName: cn(SESSION_HEADER_CLASS, "px-3"),
      cellClassName: "px-3",
      render: (session) => {
        const badge = sessionBadgeConfig[session.status];
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              badge.className,
            )}
          >
            {detail.sessionStatus[sessionStatusCopyKey[session.status]]}
          </span>
        );
      },
    },
  ];

  const actionsColumn: DataTableColumn<SessionDto> | null = onChangeStatus
    ? {
        key: "actions",
        header: detail.sessions.columns.actions,
        headerClassName: cn(SESSION_HEADER_CLASS, "w-44 px-3"),
        cellClassName: "px-3",
        render: (session) => (
          <SessionStatusMenu
            session={session}
            statusOptions={statusOptions ?? []}
            onChangeStatus={onChangeStatus}
            disabled={statusChangeDisabled}
            ariaLabel={detail.sessions.columns.actions}
          />
        ),
      }
    : null;

  const linkColumn: DataTableColumn<SessionDto> = {
    key: "link",
    header: "",
    headerClassName: "w-10 px-3",
    cellClassName: "px-3 text-right",
    render: (session) => (
      <Link
        href={`/classes/${classId}/sessions/${session.id}`}
        aria-label={detail.sessions.detailAria}
        className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="size-4" />
      </Link>
    ),
  };

  const columns: DataTableColumn<SessionDto>[] = [
    selectColumn,
    ...baseColumns,
    linkColumn,
  ];

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <ChevronDown className="size-4 text-muted-foreground" />
          {title}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      <DataTable
        data={sessions}
        columns={columns}
        rowKey={(session) => session.id}
        isLoading={loading}
        emptyMessage={emptyText}
        rowClassName="h-16"
        className="min-w-180"
      />
    </div>
  );
};
