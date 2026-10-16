"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
  CalendarDays,
  BookOpen,
  CheckCircle2,
  XCircle,
  PauseCircle,
  AlertCircle,
} from "lucide-react";
import { HoverCard } from "radix-ui";

import { cn } from "@/lib/utils";
import { useSessionActions, SESSIONS_QUERY_KEY } from "@/lib/services/session.service";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { useScheduleCopy } from "@/hooks/useScheduleCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import UsageGuides, { type UsageGuideStep } from "@/components/ui/usage-guide.ui";
import { ScheduleFormDialog, DeleteScheduleDialog } from "@/components/schedule";
import type { StudentSessionListItem, SessionStatus, ViewMode } from "@/types";

/* ─── Constants ─── */
const SUBJECT_COLORS: { bg: string; text: string; ring: string }[] = [
  { bg: "#E4F6EF", text: "#0B7A6D", ring: "#0B7A6D33" },
  { bg: "#DBEAFE", text: "#1E40AF", ring: "#1E40AF33" },
  { bg: "#FFEDD5", text: "#C2410C", ring: "#C2410C33" },
  { bg: "#FFE4E6", text: "#BE123C", ring: "#BE123C33" },
  { bg: "#FEF3C7", text: "#92400E", ring: "#FEF3C733" },
  { bg: "#EDE9FE", text: "#6D28D9", ring: "#EDE9FE33" },
  { bg: "#F3F4F6", text: "#374151", ring: "#F3F4F633" },
];

const MAX_VISIBLE_MONTH = 5;

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 64;

/* ─── Status config ─── */
const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  SCHEDULED: { label: "Đã lên lịch", color: "#2563EB", bg: "#DBEAFE", icon: CalendarDays },
  ONGOING: { label: "Đang diễn ra", color: "#059669", bg: "#D1FAE5", icon: AlertCircle },
  COMPLETED: { label: "Hoàn thành", color: "#0B7A6D", bg: "#E4F6EF", icon: CheckCircle2 },
  CANCELLED: { label: "Đã hủy", color: "#DC2626", bg: "#FEE2E2", icon: XCircle },
  POSTPONED: { label: "Tạm hoãn", color: "#D97706", bg: "#FEF3C7", icon: PauseCircle },
};

/* ─── Helpers ─── */
function getSubjectStyle(index: number) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function calendarRows(year: number, month: number): (number | null)[][] {
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const flat: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (flat.length % 7 !== 0) flat.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) rows.push(flat.slice(i, i + 7));
  return rows;
}

function parseSessionDate(iso: string): { year: number; month: number; day: number; hours: number; minutes: number } {
  const d = new Date(iso);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
  };
}

function formatTimeFromISO(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTimeFromISO(startIso)} – ${formatTimeFromISO(endIso)}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPastOrToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() <= today.getTime();
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startMonth = weekStart.getMonth() + 1;
  const endMonth = weekEnd.getMonth() + 1;
  const year = weekStart.getFullYear();
  if (startMonth === endMonth) {
    return `Tuần ${weekStart.getDate()} – ${weekEnd.getDate()}, Tháng ${startMonth}, ${year}`;
  }
  return `Tuần ${weekStart.getDate()}/${startMonth} – ${weekEnd.getDate()}/${endMonth}, ${year}`;
}

function formatDayLabel(date: Date): string {
  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const month = date.getMonth() + 1;
  return `${dayNames[date.getDay()]}, Tháng ${month}, ${date.getDate()}`;
}

function uniqueClassKeys(sessions: StudentSessionListItem[]): string[] {
  const seen = new Set<string>();
  for (const s of sessions) {
    seen.add(s.class?.name ?? "Unknown");
  }
  return Array.from(seen);
}

/* ─── Calendar session wrapper ─── */
interface CalendarSessionItem {
  time: string;
  endTime: string;
  classCode: string;
  session: StudentSessionListItem;
}

function sessionsToDateMap(
  sessions: StudentSessionListItem[],
  year: number,
  month: number,
): Record<string, CalendarSessionItem[]> {
  const record: Record<string, CalendarSessionItem[]> = {};
  const daysInMonth = new Date(year, month, 0).getDate();

  for (const sess of sessions) {
    const start = parseSessionDate(sess.startAt);
    if (start.year !== year || start.month !== month) continue;
    if (start.day < 1 || start.day > daysInMonth) continue;

    const key = dateKey(year, month, start.day);
    if (!record[key]) record[key] = [];
    record[key].push({
      time: formatTimeFromISO(sess.startAt),
      endTime: formatTimeFromISO(sess.endAt),
      classCode: sess.class?.name ?? "Unknown",
      session: sess,
    });
  }

  for (const key of Object.keys(record)) {
    record[key].sort((a, b) => a.time.localeCompare(b.time));
  }
  return record;
}

/* ─── Session Popover ─── */
function SessionPopover({
  session,
  style,
  copy,
  children,
  onEdit,
  onDelete,
}: {
  session: CalendarSessionItem;
  style: { bg: string; text: string; ring: string };
  copy: ReturnType<typeof useScheduleCopy>;
  children: React.ReactNode;
  onEdit?: (session: StudentSessionListItem) => void;
  onDelete?: (session: StudentSessionListItem) => void;
}) {
  const s = session.session;
  const cls = s.class;
  const statusCfg = STATUS_CONFIG[s.status];
  const StatusIcon = statusCfg.icon;
  const startDate = new Date(s.startAt);
  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const dayLabel = dayNames[startDate.getDay()];

  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        {children}
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          align="start"
          sideOffset={12}
          className="z-50 w-84 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        >
          {/* Colored header */}
          <div
            className="px-5 pt-5 pb-4"
            style={{ background: `linear-gradient(135deg, ${style.bg}, transparent)` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: style.text }}
              >
                {cls?.name?.charAt(0) ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-foreground leading-tight">
                  {cls?.name ?? "Unknown"}
                </p>
                {cls?.code && (
                  <span
                    className="mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: style.bg, color: style.text }}
                  >
                    {cls.code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-0 divide-y divide-border">
            {/* Status */}
            <div className="flex items-center gap-3 px-5 py-3">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: statusCfg.bg }}
              >
                <StatusIcon className="size-4" style={{ color: statusCfg.color }} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Trạng thái
                </p>
                <p className="text-sm font-semibold" style={{ color: statusCfg.color }}>
                  {statusCfg.label}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 px-5 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Thời gian
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {dayLabel}, {formatTimeRange(s.startAt, s.endAt)}
                </p>
              </div>
            </div>

            {/* Session number */}
            {s.sessionNumber && (
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <span className="text-xs font-bold text-muted-foreground">#{s.sessionNumber}</span>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Buổi học
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {s.title || `Buổi ${s.sessionNumber}`}
                  </p>
                </div>
              </div>
            )}

            {/* Location */}
            {s.location && (
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <MapPin className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Địa điểm
                  </p>
                  <p className="text-sm font-semibold text-foreground">{s.location}</p>
                </div>
              </div>
            )}

            {/* Subject */}
            {cls?.subject && (
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <BookOpen className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Môn
                  </p>
                  <p className="text-sm font-semibold text-foreground">{cls.subject}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {s.description ? s.description.slice(0, 50) : `Buổi ${s.sessionNumber ?? ""}`}
            </p>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* ─── Main Component ────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function SchedulePage() {
  const copy = useScheduleCopy();
  const common = useCommonCopy();
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [search, setSearch] = useState("");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(now));
  const [selectedDay, setSelectedDay] = useState(now);

  /* ── Dialog state ── */
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudentSessionListItem | null>(null);
  const [deletingSession, setDeletingSession] = useState<StudentSessionListItem | null>(null);

  const timeGridRef = useRef<HTMLDivElement>(null);

  /* ── Fetch sessions ── */
  const { data: sessionsData, isLoading, isError } = useSessionActions({
    list: { limit: 100 },
  }).list;

  const allSessions = useMemo(() => sessionsData?.sessions ?? [], [sessionsData]);

  /* ── Month data ── */
  const sessionsByDate = useMemo(
    () => sessionsToDateMap(allSessions, viewYear, viewMonth),
    [allSessions, viewYear, viewMonth],
  );

  const legendItems = useMemo(
    () =>
      uniqueClassKeys(allSessions).map((key, i) => ({
        label: key,
        dot: SUBJECT_COLORS[i % SUBJECT_COLORS.length].text,
      })),
    [allSessions],
  );

  const rows = useMemo(() => calendarRows(viewYear, viewMonth), [viewYear, viewMonth]);

  /* ── Week data ── */
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const weekSessions = useMemo(() => {
    const map: Record<string, CalendarSessionItem[]> = {};
    for (const day of weekDays) {
      const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
      const daySessions = allSessions.filter((s) => {
        const start = parseSessionDate(s.startAt);
        return start.year === day.getFullYear() && start.month === day.getMonth() + 1 && start.day === day.getDate();
      });
      if (!search.trim()) {
        map[key] = daySessions.map((s) => ({
          time: formatTimeFromISO(s.startAt),
          endTime: formatTimeFromISO(s.endAt),
          classCode: s.class?.name ?? "Unknown",
          session: s,
        }));
      } else {
        const q = search.trim().toLowerCase();
        map[key] = daySessions
          .filter((s) => (s.class?.name ?? "").toLowerCase().includes(q))
          .map((s) => ({
            time: formatTimeFromISO(s.startAt),
            endTime: formatTimeFromISO(s.endAt),
            classCode: s.class?.name ?? "Unknown",
            session: s,
          }));
      }
      map[key]?.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [weekDays, allSessions, search]);

  /* ── Day data ── */
  const daySessions = useMemo(() => {
    const daySessionList = allSessions.filter((s) => {
      const start = parseSessionDate(s.startAt);
      return start.year === selectedDay.getFullYear() && start.month === selectedDay.getMonth() + 1 && start.day === selectedDay.getDate();
    });
    if (!search.trim()) {
      return daySessionList.map((s) => ({
        time: formatTimeFromISO(s.startAt),
        endTime: formatTimeFromISO(s.endAt),
        classCode: s.class?.name ?? "Unknown",
        session: s,
      }));
    }
    const q = search.trim().toLowerCase();
    return daySessionList
      .filter((s) => (s.class?.name ?? "").toLowerCase().includes(q))
      .map((s) => ({
        time: formatTimeFromISO(s.startAt),
        endTime: formatTimeFromISO(s.endAt),
        classCode: s.class?.name ?? "Unknown",
        session: s,
      }));
  }, [selectedDay, allSessions, search]);

  /* ── Navigation ── */
  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const goToday = () => {
    setViewYear(todayY);
    setViewMonth(todayM);
    setWeekStart(getWeekStart(now));
    setSelectedDay(now);
  };

  const prevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };
  const nextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const prevDay = () => {
    const prev = new Date(selectedDay);
    prev.setDate(prev.getDate() - 1);
    setSelectedDay(prev);
  };
  const nextDay = () => {
    const next = new Date(selectedDay);
    next.setDate(next.getDate() + 1);
    setSelectedDay(next);
  };

  /* ── CRUD handlers ── */
  const handleCreate = () => {
    setEditingSession(null);
    setFormOpen(true);
  };

  const handleEdit = (session: StudentSessionListItem) => {
    setEditingSession(session);
    setFormOpen(true);
  };

  const handleDelete = (session: StudentSessionListItem) => {
    setDeletingSession(session);
  };

  /* ── Month helpers ── */
  const isToday = useCallback(
    (day: number | null) =>
      day !== null && day === todayD && viewMonth === todayM && viewYear === todayY,
    [todayD, todayM, todayY, viewMonth, viewYear],
  );

  const getSessions = useCallback(
    (day: number | null): CalendarSessionItem[] => {
      if (!day) return [];
      const list = sessionsByDate[dateKey(viewYear, viewMonth, day)] ?? [];
      if (!search.trim()) return list;
      const q = search.trim().toLowerCase();
      return list.filter((s) => s.classCode.toLowerCase().includes(q));
    },
    [sessionsByDate, viewYear, viewMonth, search],
  );

  /* ── Scroll to current time ── */
  useEffect(() => {
    if (timeGridRef.current && (viewMode === "week" || viewMode === "day")) {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60) {
        const offset = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT - 80;
        timeGridRef.current.scrollTop = Math.max(0, offset);
      }
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Usage guide ── */
  const usageGuideSteps: UsageGuideStep[] = [
    { n: 1, title: copy.guide.step1Title, body: copy.guide.step1Body },
    { n: 2, title: copy.guide.step2Title, body: copy.guide.step2Body },
    { n: 3, title: copy.guide.step3Title, body: copy.guide.step3Body },
    { n: 4, title: copy.guide.step4Title, body: copy.guide.step4Body },
  ];

  const usageGuideWarning = (
    <>
      <span className="font-semibold text-[#E85D24]">{copy.guide.noteLabel}</span>{" "}
      {copy.guide.noteBody}
    </>
  );

  const viewLabels: Record<ViewMode, string> = {
    month: copy.calendar.viewMonth,
    week: copy.calendar.viewWeek,
    day: copy.calendar.viewDay,
  };

  const todayDate = new Date();

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            type="button"
            size="lg"
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" />
            {copy.addButton}
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-9 w-56 rounded-lg pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Calendar card ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon-sm" onClick={viewMode === "month" ? prevMonth : viewMode === "week" ? prevWeek : prevDay} className="size-8! rounded-lg">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[200px] text-center text-base font-bold text-foreground">
              {viewMode === "month" && `${copy.calendar.monthLabel} ${viewMonth}, ${viewYear}`}
              {viewMode === "week" && formatWeekRange(weekStart)}
              {viewMode === "day" && formatDayLabel(selectedDay)}
            </span>
            <Button type="button" variant="outline" size="icon-sm" onClick={viewMode === "month" ? nextMonth : viewMode === "week" ? nextWeek : nextDay} className="size-8! rounded-lg">
              <ChevronRight className="size-4" />
            </Button>
            <Button type="button" variant="default" size="sm" onClick={goToday} className="rounded-lg px-3.5 py-1.5 text-sm font-semibold">
              {copy.todayButton}
            </Button>
          </div>

          {/* Legend */}
          {legendItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {legendItems.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 text-sm text-foreground">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.dot }} />
                  {item.label}
                </span>
              ))}
            </div>
          )}

          {/* View switcher */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["month", "week", "day"] as ViewMode[]).map((mode, i) => {
              const active = viewMode === mode;
              return (
                <Button
                  key={mode}
                  type="button"
                  variant={active ? "default" : "ghost"}
                  onClick={() => setViewMode(mode)}
                  className={cn("rounded-none px-4 py-1.5 text-sm font-medium", i > 0 && "border-l border-border")}
                >
                  {viewLabels[mode]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center justify-center py-24 text-sm text-destructive">
            {common.table.loadError}
          </div>
        )}

        {/* ═══════ MONTH VIEW ═══════ */}
        {!isLoading && !isError && viewMode === "month" && (
          <>
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {copy.dayHeaders.map((day, i) => (
                <div
                  key={day}
                  className={cn("py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground", i < 6 && "border-r border-border")}
                >
                  {day}
                </div>
              ))}
            </div>

            {allSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-16 text-sm text-muted-foreground">
                <CalendarDays className="mb-2 size-10 opacity-40" />
                <p>{copy.emptyState}</p>
                <p className="text-xs">{copy.emptyHint}</p>
              </div>
            ) : (
              <div>
                {rows.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={cn("grid grid-cols-7", rowIdx < rows.length - 1 && "border-b border-border")}
                  >
                    {row.map((day, colIdx) => {
                      const daySessions = getSessions(day);
                      const visible = daySessions.slice(0, MAX_VISIBLE_MONTH);
                      const overflow = daySessions.length - MAX_VISIBLE_MONTH;
                      const today = isToday(day);
                      const isSunday = colIdx === 6;

                      return (
                        <div
                          key={colIdx}
                          className={cn("relative min-h-27.5 p-2", colIdx < 6 && "border-r border-border", !day && "bg-muted/10")}
                        >
                          {today && <div className="pointer-events-none absolute inset-0 ring-2 ring-primary ring-inset" />}
                          {day && (
                            <>
                              <div className="mb-1.5 flex items-center gap-1.5">
                                <span className={cn("text-sm font-semibold leading-none", today ? "text-primary" : isSunday ? "text-muted-foreground" : "text-foreground")}>
                                  {day}
                                </span>
                                {today && (
                                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
                                    {copy.calendar.todayBadge}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                {visible.map((s, i) => {
                                  const st = getSubjectStyle(i);
                                  return (
                                    <SessionPopover
                                      key={s.session.id}
                                      session={s}
                                      style={st}
                                      copy={copy}
                                      onEdit={handleEdit}
                                      onDelete={handleDelete}
                                    >
                                      <div
                                        className="cursor-pointer rounded-lg px-1.5 py-0.5 text-xs font-semibold leading-tight transition-all hover:scale-[1.02] hover:shadow-md"
                                        style={{ backgroundColor: st.bg, color: st.text }}
                                      >
                                        <span className="block truncate">{s.time} {s.classCode}</span>
                                      </div>
                                    </SessionPopover>
                                  );
                                })}
                                {overflow > 0 && (
                                  <span className="px-1.5 text-left text-xs font-medium text-primary">
                                    +{overflow} {copy.calendar.overflowSuffix}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════ WEEK VIEW ═══════ */}
        {!isLoading && !isError && viewMode === "week" && (
          <div className="overflow-hidden">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30">
              <div className="py-3" />
              {weekDays.map((day, i) => {
                const today = isSameDay(day, todayDate);
                return (
                  <div key={i} className={cn("py-3 text-center border-l border-border", today && "bg-primary/5")}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {copy.dayShortHeaders[i]}
                    </p>
                    <p className={cn("mt-0.5 text-lg font-bold", today ? "text-primary" : "text-foreground")}>
                      {day.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            <div ref={timeGridRef} className="max-h-[calc(100vh-320px)] overflow-y-auto">
              <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                {/* Time labels */}
                <div className="relative" style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}>
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-border/40" style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                      <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-muted-foreground/60">
                        {String(h).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIdx) => {
                  const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
                  const sessions = weekSessions[key] ?? [];
                  const today = isSameDay(day, todayDate);

                  return (
                    <div key={dayIdx} className={cn("relative border-l border-border", today && "bg-primary/[0.02]")} style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}>
                      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h, i) => (
                        <div key={h} className="absolute left-0 right-0 border-t border-border/40" style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }} />
                      ))}
                      {today && (() => {
                        const nowMin = todayDate.getHours() * 60 + todayDate.getMinutes();
                        if (nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60) {
                          const top = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                          return (
                            <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: `${top}px` }}>
                              <div className="size-2.5 rounded-full bg-primary shadow-sm" />
                              <div className="h-0.5 flex-1 bg-primary/60" />
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {sessions.map((s, i) => {
                        const style = getSubjectStyle(i);
                        const startMin = (() => { const [h, m] = s.time.split(":").map(Number); return h * 60 + m; })();
                        const endMin = (() => { const [h, m] = s.endTime.split(":").map(Number); return h * 60 + m; })();
                        const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                        const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
                        return (
                          <div
                            key={s.session.id}
                            className="absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-lg border-l-[3px] transition-shadow hover:shadow-md"
                            style={{ top: `${top}px`, height: `${height}px`, backgroundColor: style.bg, borderLeftColor: style.text }}
                          >
                            <SessionPopover session={s} style={style} copy={copy} onEdit={handleEdit} onDelete={handleDelete}>
                              <div className="flex h-full cursor-pointer flex-col justify-center px-2 py-1">
                                <span className="text-[11px] font-bold leading-tight" style={{ color: style.text }}>{s.time}</span>
                                <span className="truncate text-[10px] font-medium leading-tight opacity-80" style={{ color: style.text }}>{s.classCode}</span>
                              </div>
                            </SessionPopover>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ DAY VIEW ═══════ */}
        {!isLoading && !isError && viewMode === "day" && (
          <div className="overflow-hidden">
            <div className="flex items-center border-b border-border bg-muted/30 px-5 py-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">{formatDayLabel(selectedDay)}</p>
                  <p className="text-xs text-muted-foreground">
                    {daySessions.length > 0 ? `${daySessions.length} buổi học` : copy.calendar.noSessions}
                  </p>
                </div>
              </div>
            </div>

            <div ref={timeGridRef} className="max-h-[calc(100vh-320px)] overflow-y-auto">
              <div className="grid grid-cols-[60px_1fr]">
                <div className="relative" style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}>
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-border/40" style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                      <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-muted-foreground/60">
                        {String(h).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                <div className={cn("relative border-l border-border", isSameDay(selectedDay, todayDate) && "bg-primary/[0.02]")} style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}>
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-border/40" style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }} />
                  ))}
                  {isSameDay(selectedDay, todayDate) && (() => {
                    const nowMin = todayDate.getHours() * 60 + todayDate.getMinutes();
                    if (nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60) {
                      const top = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                      return (
                        <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: `${top}px` }}>
                          <div className="size-2.5 rounded-full bg-primary shadow-sm" />
                          <div className="h-0.5 flex-1 bg-primary/60" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {daySessions.map((s, i) => {
                    const style = getSubjectStyle(i);
                    const startMin = (() => { const [h, m] = s.time.split(":").map(Number); return h * 60 + m; })();
                    const endMin = (() => { const [h, m] = s.endTime.split(":").map(Number); return h * 60 + m; })();
                    const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
                    return (
                      <div
                        key={s.session.id}
                        className="absolute left-1 right-1 z-10 overflow-hidden rounded-xl border-l-[4px] transition-shadow hover:shadow-lg"
                        style={{ top: `${top}px`, height: `${height}px`, backgroundColor: style.bg, borderLeftColor: style.text }}
                      >
                        <SessionPopover session={s} style={style} copy={copy} onEdit={handleEdit} onDelete={handleDelete}>
                          <div className="flex h-full cursor-pointer items-center gap-3 px-3 py-2">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: style.text }}>
                              {s.session.class?.name?.charAt(0) ?? "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold" style={{ color: style.text }}>{s.classCode}</p>
                              <p className="text-xs opacity-70" style={{ color: style.text }}>
                                {s.time} – {s.endTime}
                              </p>
                            </div>
                          </div>
                        </SessionPopover>
                      </div>
                    );
                  })}
                  {daySessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <CalendarDays className="mb-2 size-8 opacity-30" />
                      <p className="text-sm">{copy.calendar.noSessions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Usage guide ── */}
      <UsageGuides title={copy.guide.title} steps={usageGuideSteps} warning={usageGuideWarning} />

      {/* ── Create / Edit dialog ── */}
      <ScheduleFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingSession(null); }}
        session={editingSession}
      />

      {/* ── Delete dialog ── */}
      <DeleteScheduleDialog
        session={deletingSession}
        onClose={() => setDeletingSession(null)}
      />
    </div>
  );
}
