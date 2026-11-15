"use client";

import { currentPersonName } from "@/lib/format/person-name";
import { useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useGet } from "@/lib/axios/query";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useUserActions } from "@/lib/services/user.service";
import { useTuitionActions } from "@/lib/services/tuition.service";
import { useNotificationActions } from "@/lib/services/notification.service";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { cn } from "@/lib/utils";
import { InfoRow } from "../components/watch-info-row";
import {
  WatchCurriculumChapter,
  type WatchMaterialLesson,
} from "../components/watch-curriculum-chapter";
import type {
  ApiNotification,
  ClassDetailDto,
  ClassStudentDto,
  NotificationType,
  SessionFile,
  SessionStatus,
  TuitionRecord,
} from "@/types";

/* ─── `/classes/:id/watches` response — purpose-built for this page ─── */

/** `class` on `/watches` omits the count fields the tutor `/classes/:id` endpoint returns — derive counts from `students`/`schedules` instead. */
type ClassWatchDto = Omit<
  ClassDetailDto,
  "studentCount" | "sessionCount" | "upcomingSessionCount"
>;

type RecentSessionDto = {
  id: string;
  lessonId: string | null;
  title: string | null;
  description: string | null;
  sessionNumber: number;
  theoryUrls: SessionFile[];
  exerciseUrls: SessionFile[];
  startAt: string;
  endAt: string;
  location: string | null;
  status: SessionStatus;
};

type WatchScheduleSlot = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  format?: string | null;
  location?: string | null;
};

type ClassWatchResponse = {
  class: ClassWatchDto;
  recentSession: RecentSessionDto | null;
  schedules: WatchScheduleSlot[];
  students: ClassStudentDto[];
};

/* ─── Small display helpers (kept local — this page mixes several resources) ─── */

const fullName = (u?: {
  firstName?: string | null;
  lastName?: string | null;
}) => currentPersonName(u?.firstName, u?.lastName).trim();

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-slate-100 text-slate-700",
];

const fmtTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const fmtSessionRange = (start?: string, end?: string) => {
  const s = fmtTime(start);
  const e = fmtTime(end);
  return s && e ? `${s} – ${e}` : s || "—";
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};

const money = (v: number) => v.toLocaleString("vi-VN") + "đ";

const WEEKDAY_LABEL = [
  "CHỦ NHẬT",
  "THỨ 2",
  "THỨ 3",
  "THỨ 4",
  "THỨ 5",
  "THỨ 6",
  "THỨ 7",
];

const sessionDateParts = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    weekday: WEEKDAY_LABEL[d.getDay()],
    day: d.getDate(),
    month: `Th${d.getMonth() + 1}`,
  };
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
};

const DOW_ABBR: Record<string, string> = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
};
const DOW_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const FORMAT_LABEL: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
};

const CLASS_STATUS_LABEL: Record<string, string> = {
  OPEN: "Đang học",
  UPCOMING: "Sắp khai giảng",
  CLOSED: "Đã kết thúc",
};

const SESSION_STATUS_META: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: "Sắp diễn ra",
    className:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  ONGOING: {
    label: "Đang diễn ra",
    className: "bg-primary/10 text-primary",
  },
  POSTPONED: {
    label: "Tạm hoãn",
    className:
      "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
  COMPLETED: { label: "Đã kết thúc", className: "bg-muted text-muted-foreground" },
  CANCELLED: {
    label: "Đã hủy",
    className:
      "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  },
};

const TUITION_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  PAID: {
    label: "Đã đóng",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  UNPAID: {
    label: "Chưa đóng",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  OVERDUE: {
    label: "Quá hạn",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

const NOTIF_DOT: Record<NotificationType, string> = {
  SYSTEM: "#2563EB",
  TUITION: "#F97316",
  STUDENT: "#0E9F8E",
  TUTOR: "#7C3AED",
};

type MaterialsResponse = { lessons: WatchMaterialLesson[] };

const NO_CHAPTER_KEY = "__no_chapter__";

/* ─── Section card shell (intentionally duplicated per file — see ui-components.md) ─── */
const SectionCard = ({
  icon: Icon,
  title,
  headerRight,
  children,
}: {
  icon: LucideIcon;
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border bg-card">
    <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      {headerRight}
    </div>
    {children}
  </div>
);

type ClassDetailWatchPageProps = { classId: string };

export const ClassDetailWatchPage = ({
  classId,
}: ClassDetailWatchPageProps) => {
  const role = useCurrentUserRole();
  const viewerId = useCurrentUserId();

  const {
    data: watchRaw,
    isLoading: classLoading,
    error: classError,
  } = useGet(["class-watch", classId], `/classes/${classId}/watches`, {
    enabled: !!classId,
  });

  const watch = useMemo(
    () => (watchRaw ? unwrapApiData<ClassWatchResponse>(watchRaw) : null),
    [watchRaw],
  );
  const cls = watch?.class ?? null;
  const recentSession = watch?.recentSession ?? null;
  const schedules = useMemo(() => watch?.schedules ?? [], [watch]);
  const students = useMemo(() => watch?.students ?? [], [watch]);

  const { data: tutorRaw } = useUserActions({
    byField: { field: "id", value: cls?.tutorId ?? "" },
    byFieldOptions: { enabled: !!cls?.tutorId },
    allGradesOptions: { enabled: false },
    userGradesOptions: { enabled: false },
  }).byField;
  const tutor = useMemo(() => {
    if (!tutorRaw) return null;
    return tutorRaw[0] ?? null;
  }, [tutorRaw]);

  const { data: materialsRaw } = useGet(
    ["class-materials", classId],
    `/classes/${classId}/materials`,
    { enabled: !!classId },
  );
  const materials = useMemo(
    () =>
      materialsRaw
        ? (unwrapApiData<MaterialsResponse>(materialsRaw) ?? null)
        : null,
    [materialsRaw],
  );
  const curriculumChapters = useMemo(() => {
    const lessons = materials?.lessons ?? [];
    const byChapter = new Map<
      string,
      { title: string; lessons: WatchMaterialLesson[] }
    >();
    for (const l of lessons) {
      const key = l.chapterId ?? NO_CHAPTER_KEY;
      if (!byChapter.has(key)) {
        byChapter.set(key, {
          title: l.chapterTitle ?? "Chưa phân chương",
          lessons: [],
        });
      }
      byChapter.get(key)!.lessons.push(l);
    }
    const chapters = Array.from(byChapter.values());
    for (const c of chapters)
      c.lessons.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    chapters.sort(
      (a, b) =>
        Math.min(...a.lessons.map((l) => l.order ?? 0)) -
        Math.min(...b.lessons.map((l) => l.order ?? 0)),
    );
    return chapters;
  }, [materials]);

  const totalLessons = materials?.lessons?.length ?? 0;

  const myStudentId = useMemo(() => {
    if (role === "STUDENT") return viewerId;
    if (role === "PARENT")
      return students.find((s) => s.parent?.id === viewerId)?.id ?? null;
    return null;
  }, [role, viewerId, students]);

  const { data: tuitionsRaw } = useTuitionActions({
    list: { classId, studentId: myStudentId ?? undefined, limit: 12 },
    listOptions: { enabled: !!classId && !!myStudentId },
  }).list;
  const currentTuition = useMemo<TuitionRecord | null>(() => {
    const list = tuitionsRaw?.tuitions ?? [];
    if (!list.length) return null;
    return [...list].sort(
      (a, b) =>
        new Date(b.dueDate ?? b.createdAt).getTime() -
        new Date(a.dueDate ?? a.createdAt).getTime(),
    )[0];
  }, [tuitionsRaw]);

  const { data: notificationsRaw } = useNotificationActions({
    list: { limit: 5 },
  }).list;
  const notifications = useMemo<ApiNotification[]>(
    () => notificationsRaw?.data ?? [],
    [notificationsRaw],
  );

  const scheduleLabel = useMemo(() => {
    if (!schedules.length) return "Chưa có lịch";
    const days = Array.from(new Set(schedules.map((s) => s.dayOfWeek))).sort(
      (a, b) => DOW_ORDER.indexOf(a) - DOW_ORDER.indexOf(b),
    );
    const dayPart = days.map((d) => DOW_ABBR[d] ?? d).join(" & ");
    return schedules[0]?.startTime
      ? `${dayPart} · ${schedules[0].startTime}`
      : dayPart;
  }, [schedules]);

  const sessionsPerWeek = useMemo(
    () => new Set(schedules.map((s) => s.dayOfWeek)).size,
    [schedules],
  );

  const durationMinutes = useMemo(() => {
    const slot = schedules[0];
    if (!slot?.startTime || !slot?.endTime) return null;
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  }, [schedules]);

  const recentSessionBadge = useMemo(() => {
    if (!recentSession) return null;
    if (/kiểm tra|thi\b/i.test(recentSession.title ?? ""))
      return {
        label: "Kiểm tra",
        className:
          "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
      };
    return SESSION_STATUS_META[recentSession.status];
  }, [recentSession]);

  const feePerSession = Number(cls?.tuition ?? 0) || 0;
  const feeBreakdownCount =
    currentTuition && feePerSession
      ? Math.round(Number(currentTuition.amount) / feePerSession)
      : null;
  const tuitionMonthLabel = currentTuition
    ? (() => {
        const d = new Date(
          currentTuition.dueDate ?? currentTuition.createdAt,
        );
        return Number.isNaN(d.getTime())
          ? "—"
          : `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      })()
    : "—";

  if (classLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (classError || !cls) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <XCircle className="size-10 text-red-500" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {getErrorMessage(classError) || "Không thể tải thông tin lớp học"}
        </p>
        <Link
          href="/classes"
          className="mt-4 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          Quay lại danh sách lớp
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
            {cls.subject}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            {CLASS_STATUS_LABEL[cls.status] ?? cls.status}
          </span>
          <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
            Mã lớp: {cls.code}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold">{cls.name}</h1>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-base font-bold">
            {tutor ? getInitials(fullName(tutor)) : "?"}
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
              Gia sư phụ trách
            </p>
            <p className="text-sm font-semibold">
              {tutor ? fullName(tutor) || "—" : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[11px] text-white/70">Lịch học</p>
            <p className="mt-1 text-sm font-semibold">{scheduleLabel}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[11px] text-white/70">Học phí / buổi</p>
            <p className="mt-1 text-sm font-semibold">
              {money(feePerSession)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[11px] text-white/70">Sĩ số lớp</p>
            <p className="mt-1 text-sm font-semibold">
              {students.length} học sinh
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[11px] text-white/70">Hình thức</p>
            <p className="mt-1 text-sm font-semibold">
              {cls.format ? (FORMAT_LABEL[cls.format] ?? cls.format) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            icon={Calendar}
            title="Buổi học gần đây"
            headerRight={
              <span className="text-xs text-muted-foreground">
                {scheduleLabel}
              </span>
            }
          >
            {!recentSession ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Chưa có buổi học nào
              </p>
            ) : (
              <Link
                href={`/classes/${classId}/sessions/${recentSession.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-muted px-2 py-1.5 text-center">
                  {(() => {
                    const parts = sessionDateParts(recentSession.startAt);
                    return (
                      <>
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {parts?.weekday ?? "—"}
                        </span>
                        <span className="text-lg font-bold leading-tight">
                          {parts?.day ?? "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {parts?.month ?? ""}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">
                    {recentSession.title ||
                      `Buổi ${recentSession.sessionNumber}`}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {fmtSessionRange(
                        recentSession.startAt,
                        recentSession.endAt,
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {recentSession.location ||
                        cls.location ||
                        (cls.format === "ONLINE" ? "Trực tuyến" : "—")}
                    </span>
                  </p>
                </div>
                {recentSessionBadge && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      recentSessionBadge.className,
                    )}
                  >
                    {recentSessionBadge.label}
                  </span>
                )}
              </Link>
            )}
          </SectionCard>

          <SectionCard
            icon={BookOpen}
            title="Chương trình học"
            headerRight={
              <span className="text-xs text-muted-foreground">
                {totalLessons} bài học
              </span>
            }
          >
            {curriculumChapters.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Lớp chưa gắn chương trình học
              </p>
            ) : (
              <div className="divide-y">
                {curriculumChapters.map((chapter, ci) => (
                  <WatchCurriculumChapter
                    key={`${chapter.title}-${ci}`}
                    chapter={chapter}
                  />
                ))}
              </div>
            )}
            {curriculumChapters.length > 0 && (
              <div className="border-t px-5 py-3">
                <Link
                  href={`/classes/${classId}/curriculum`}
                  className="text-sm font-medium text-primary hover:opacity-75"
                >
                  Xem chi tiết chương trình học
                </Link>
              </div>
            )}
          </SectionCard>

          <SectionCard icon={Users} title="Thông báo từ gia sư">
            {notifications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Chưa có thông báo
              </p>
            ) : (
              <div className="divide-y px-5">
                {notifications.map((n) => (
                  <div key={n.id} className="flex gap-3 py-3.5">
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: NOTIF_DOT[n.type] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-semibold">
                          {n.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                      </p>
                      {(n.content || n.subContent) && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {n.content || n.subContent}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <SectionCard icon={BookOpen} title="Thông tin lớp học">
            <div className="divide-y">
              <InfoRow icon={BookOpen} label="Môn học" value={cls.subject} />
              <InfoRow
                icon={Calendar}
                label="Khai giảng"
                value={fmtDate(cls.startTime)}
              />
              <InfoRow
                icon={Calendar}
                label="Số buổi/tuần"
                value={sessionsPerWeek > 0 ? `${sessionsPerWeek} buổi` : "—"}
              />
              <InfoRow
                icon={Clock}
                label="Thời lượng"
                value={durationMinutes ? `${durationMinutes} phút/buổi` : "—"}
              />
              <InfoRow
                icon={Users}
                label="Sĩ số"
                value={`${students.length} học sinh`}
              />
              <InfoRow
                icon={MapPin}
                label="Hình thức"
                value={
                  cls.format ? (FORMAT_LABEL[cls.format] ?? cls.format) : "—"
                }
              />
              {cls.location && (
                <InfoRow
                  icon={MapPin}
                  label="Địa điểm"
                  value={
                    cls.location.startsWith("http") ? (
                      <a
                        href={cls.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Vào lớp học
                      </a>
                    ) : (
                      cls.location
                    )
                  }
                />
              )}
            </div>
          </SectionCard>

          <SectionCard icon={Wallet} title="Học phí tháng này">
            <div className="p-5">
              {!myStudentId ? (
                <p className="text-sm text-muted-foreground">
                  Không tìm thấy thông tin học phí.
                </p>
              ) : !currentTuition ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có hóa đơn học phí cho lớp này.
                </p>
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {tuitionMonthLabel}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        TUITION_STATUS_META[currentTuition.status]
                          ?.className,
                      )}
                    >
                      {TUITION_STATUS_META[currentTuition.status]?.label ??
                        currentTuition.status}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {money(Number(currentTuition.amount))}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {feeBreakdownCount
                      ? `${feeBreakdownCount} buổi × ${money(feePerSession)}`
                      : null}
                    {currentTuition.paidDate
                      ? ` · Đã thanh toán ngày ${fmtDate(currentTuition.paidDate)}`
                      : currentTuition.dueDate
                        ? ` · Hạn đóng ${fmtDate(currentTuition.dueDate)}`
                        : null}
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Chi tiết thanh toán do gia sư cập nhật. Xem đầy đủ tại mục{" "}
                <Link href="/fees" className="font-medium text-primary">
                  Học phí
                </Link>
                .
              </p>
            </div>
          </SectionCard>

          <SectionCard
            icon={Users}
            title="Bạn cùng lớp"
            headerRight={
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {students.length}
              </span>
            }
          >
            {students.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Lớp chưa có học sinh
              </p>
            ) : (
              <div className="divide-y">
                {students.map((s, idx) => {
                  const name = currentPersonName(s.firstName, s.lastName).trim();
                  const isMe = s.id === myStudentId;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          AVATAR_COLORS[idx % AVATAR_COLORS.length],
                        )}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.userCode || "—"}
                        </p>
                      </div>
                      {isMe && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Bạn
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
