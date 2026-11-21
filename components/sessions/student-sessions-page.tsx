"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  PlayCircle,
} from "lucide-react";

import { useSessionActions } from "@/lib/services/session.service";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import { useStudentSessionsCopy } from "@/hooks/useStudentSessionsCopy.hook";
import {
  fmtDateTime,
  SESSION_STATUS_META,
  StatusBadge,
} from "./session-shared";
import type {
  SessionStatus,
  StudentSessionListItem,
} from "@/types/session.types";
import { DataTable, type DataTableColumn } from "../ui";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";

type FilterKey = "ALL" | SessionStatus;

const USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Lọc theo trạng thái",
    body: (
      <>
        Dùng các nút{" "}
        <span className="font-semibold text-[#16302b]">
          Tất cả / Sắp diễn ra / Đang diễn ra / Đã kết thúc
        </span>{" "}
        để lọc danh sách buổi học.
      </>
    ),
  },
  {
    n: 2,
    title: "Xem chi tiết",
    body: (
      <>
        Nhấn icon mũi tên ở cuối dòng để mở chi tiết buổi học, tài liệu và bài
        tập.
      </>
    ),
  },
  {
    n: 3,
    title: "Thống kê nhanh",
    body: (
      <>
        4 thẻ ở đầu trang tổng hợp số buổi học theo từng trạng thái, tính trên
        tất cả lớp bạn tham gia.
      </>
    ),
  },
  {
    n: 4,
    title: "Thời gian & địa điểm",
    body: (
      <>
        Cột{" "}
        <span className="font-semibold text-[#16302b]">
          Thời gian / Địa điểm
        </span>{" "}
        hiển thị lịch học cụ thể của từng buổi.
      </>
    ),
  },
];

const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: React.ElementType;
  tone: string;
}) => (
  <div className="rounded-xl border border-border/60 bg-card p-5">
    <div className="flex items-start justify-between">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-lg",
          tone,
        )}
      >
        <Icon className="size-4" />
      </span>
    </div>
    <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
  </div>
);

export const StudentSessionsPage = () => {
  const copy = useStudentSessionsCopy();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const FILTERS = useMemo<{ key: FilterKey; label: string }[]>(
    () => [
      { key: "ALL", label: copy.filters.all },
      { key: "SCHEDULED", label: copy.filters.scheduled },
      { key: "ONGOING", label: copy.filters.ongoing },
      { key: "COMPLETED", label: copy.filters.completed },
    ],
    [copy],
  );

  const {
    data: students,
    isLoading,
    error,
  } = useSessionActions({ list: { page: 1, limit: 10 } }).list;

  const sessions = useMemo<StudentSessionListItem[]>(() => {
    return students?.sessions ?? [];
  }, [students]);

  const counts = useMemo(() => {
    const c = {
      total: sessions.length,
      SCHEDULED: 0,
      ONGOING: 0,
      COMPLETED: 0,
    };
    for (const s of sessions) {
      if (s.status === "SCHEDULED") c.SCHEDULED += 1;
      else if (s.status === "ONGOING") c.ONGOING += 1;
      else if (s.status === "COMPLETED") c.COMPLETED += 1;
    }
    return c;
  }, [sessions]);

  const visible = useMemo(
    () =>
      filter === "ALL" ? sessions : sessions.filter((s) => s.status === filter),
    [sessions, filter],
  );

  const columns = useMemo<DataTableColumn<StudentSessionListItem>[]>(
    () => [
      {
        key: "session",
        header: copy.table.session,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5",
        render: (s) => (
          <div>
            <p className="font-medium text-foreground">
              {s.title || copy.table.sessionNumberPrefix(s.sessionNumber)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {s.class.name} · {s.class.code}
            </p>
          </div>
        ),
      },
      {
        key: "time",
        header: copy.table.time,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5 text-foreground",
        render: (s) => fmtDateTime(s.startAt),
      },
      {
        key: "location",
        header: copy.table.location,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5 text-foreground",
        render: (s) => s.location || copy.table.locationFallback,
      },
      {
        key: "status",
        align: "center" as const,
        header: copy.table.status,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5",
        render: (s) => {
          const meta = SESSION_STATUS_META[s.status];
          return <StatusBadge label={meta.label} className={meta.className} />;
        },
      },
      {
        key: "actions",
        align: "center" as const,
        header: copy.table.actions,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5",
        render: (s) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={copy.table.viewDetail}
            onClick={() => router.push(`/sessions/${s.id}`)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </Button>
        ),
      },
    ],
    [copy, router],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-linear-to-br from-emerald-50/60 to-transparent p-6 dark:from-emerald-950/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="size-4" />
          <span>{copy.header.eyebrow}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {copy.header.title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          {copy.header.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={copy.stats.total.label}
          value={counts.total}
          hint={copy.stats.total.hint}
          icon={CalendarClock}
          tone="bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
        />
        <StatCard
          label={copy.stats.scheduled.label}
          value={counts.SCHEDULED}
          hint={copy.stats.scheduled.hint}
          icon={Clock}
          tone="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
        />
        <StatCard
          label={copy.stats.ongoing.label}
          value={counts.ONGOING}
          hint={copy.stats.ongoing.hint}
          icon={PlayCircle}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
        />
        <StatCard
          label={copy.stats.completed.label}
          value={counts.COMPLETED}
          hint={copy.stats.completed.hint}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
        />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Button
              key={f.key}
              type="button"
              variant={active ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
              className={cn(
                "h-8! w-auto! rounded-full! px-3.5! py-1.5! text-sm! font-medium!",
                active
                  ? "border-emerald-600! bg-emerald-600! text-white! hover:bg-emerald-600!"
                  : "border-border/60! bg-card! text-muted-foreground! hover:text-foreground!",
              )}
            >
              {f.label}
            </Button>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card">
        <DataTable
          data={visible}
          columns={columns}
          rowKey={(s) => s.id}
          isLoading={isLoading}
          isError={!!error}
          errorMessage={getErrorMessage(error, copy.list.loadErrorFallback)}
          emptyMessage={
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <ClipboardList className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">{copy.list.emptyTitle}</p>
              <p className="text-xs text-muted-foreground">
                {copy.list.emptyHint}
              </p>
            </div>
          }
          headerRowClassName="border-b border-border/60 bg-muted/40"
          rowClassName="border-b border-border/60 last:border-0 hover:bg-muted/30"
        />
      </div>

      <UsageGuides steps={USAGE_GUIDE_STEPS} />
    </div>
  );
};
