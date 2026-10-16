"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  FileText,
  ListChecks,
  Loader2,
  Lock,
  MapPin,
  Plus,
  Search,
  Target,
  Users,
} from "lucide-react";

import { useSessionActions } from "@/lib/services/session.service";
import { useUserActions } from "@/lib/services/user.service";
import { useClassActions } from "@/lib/services/class.service";
import { useLessonActions } from "@/lib/services/lesson.service";
import { useAttendanceActions } from "@/lib/services/attendance.service";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { cn } from "@/lib/utils";
import { isImageFile } from "@/lib/file-utils";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { Button } from "@/components/ui/button.ui";
import { Select } from "@/components/ui/select.ui";
import { ImagePreview } from "@/components/common/image-preview";
import type {
  SessionFile,
  SessionStatus,
  StudentSessionDetail as SessionDetail,
} from "@/types/session.types";
import type { ApiStudent, StudentsApiPayload } from "@/types/student.types";
import {
  SESSION_STATUS_META,
  StatusBadge,
  DownloadFileRow,
  downloadFile,
  fmtDate,
} from "./session-shared";

type ViewRole = "TUTOR" | "STUDENT" | "PARENT";
type AttStatus = "Có mặt" | "Vắng" | "Trễ";

const fullName = (u?: {
  firstName?: string | null;
  lastName?: string | null;
}) => [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

const STATUS_OPTIONS = (
  Object.keys(SESSION_STATUS_META) as SessionStatus[]
).map((s) => ({ value: s, label: SESSION_STATUS_META[s].label }));

/** Attendance is only meaningful once the session is running or finished. */
const ATTENDANCE_STATUSES: SessionStatus[] = ["ONGOING", "COMPLETED"];

/** Fallbacks when real data is unavailable (no sample content in production screens). */
const NO_DATA_TUTOR_NAME = "—";
const NO_PRIVATE_NOTE = "Chưa có ghi chú riêng.";

/* ─── Building blocks ─────────────────────────────────────────────── */

const Panel = ({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn("rounded-2xl border border-border/60 bg-card", className)}
  >
    {title && (
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {Icon && <Icon className="size-4 text-emerald-600" />}
          {title}
        </h2>
        {action}
      </div>
    )}
    <div className="px-6 py-5">{children}</div>
  </section>
);

/** Small stat tile used in the STUDENT/PARENT header (Ngày/Giờ/Địa điểm/Sĩ số). */
const InfoTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
      <Icon className="size-4" />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] text-white/70">{label}</p>
      <p className="truncate text-sm font-semibold text-white">{value}</p>
    </div>
  </div>
);

/** Action always downloads via the authenticated proxy — `file.url` points at an
 * auth-gated R2 object that can't be linked to directly (see `downloadFile`). */
const MaterialRow = ({
  file,
  actionLabel,
}: {
  file: SessionFile;
  actionLabel: string;
}) => {
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isImage = isImageFile(file.name);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(file.key, file.name);
    } catch (err) {
      toast.error(getErrorMessage(err, "Tải tệp thất bại"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          {isImage ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="truncate text-sm font-semibold hover:underline"
            >
              {file.name}
            </button>
          ) : (
            <p className="truncate text-sm font-semibold">{file.name}</p>
          )}
          <p className="text-xs text-muted-foreground">Đăng cho buổi này</p>
        </div>
        <Button
          type="button"
          variant="link"
          size="sm"
          disabled={downloading}
          onClick={isImage ? () => setPreviewOpen(true) : handleDownload}
          className="h-auto! w-auto! shrink-0 gap-1 px-0! text-emerald-600"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {actionLabel}
        </Button>
      </div>

      {previewOpen && (
        <ImagePreview
          src={file.url}
          name={file.name}
          onClose={() => setPreviewOpen(false)}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </>
  );
};

type LessonOpt = {
  id: string;
  title: string;
  theoryUrls?: SessionFile[];
  exerciseUrls?: SessionFile[];
};

/**
 * Search box that lists theory/exercise files from the class's curriculum and
 * imports the picked one into the session (PATCH /sessions/:id) — replaces the
 * old "upload / assign" buttons.
 */
const CurriculumImportInput = ({
  sessionId,
  curriculumId,
  kind,
  existing,
  placeholder,
}: {
  sessionId: string;
  curriculumId?: string | null;
  kind: "theory" | "exercise";
  existing: SessionFile[];
  placeholder: string;
}) => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [importingKey, setImportingKey] = useState<string | null>(null);

  const { data: lessonsRaw } = useLessonActions({
    list: { curriculumId: curriculumId ?? "", limit: 100 },
    listOptions: { enabled: !!curriculumId },
  }).list;

  const items = useMemo(() => {
    const lessons = (lessonsRaw ?? []) as LessonOpt[];
    const list: { file: SessionFile; lessonTitle: string }[] = [];
    for (const l of lessons) {
      const files = kind === "theory" ? l.theoryUrls : l.exerciseUrls;
      for (const f of files ?? []) list.push({ file: f, lessonTitle: l.title });
    }
    return list;
  }, [lessonsRaw, kind]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter(
          (m) =>
            m.file.name.toLowerCase().includes(q) ||
            m.lessonTitle.toLowerCase().includes(q),
        )
      : items;
    return base.slice(0, 8);
  }, [items, query]);

  const importFile = async (m: { file: SessionFile; lessonTitle: string }) => {
    if (existing.some((f) => f.key === m.file.key)) {
      toast.info("Đã có trong buổi học");
      return;
    }
    setImportingKey(m.file.key);
    try {
      const field = kind === "theory" ? "theoryUrls" : "exerciseUrls";
      await axiosInstance.put(`/sessions/${sessionId}`, {
        [field]: [...existing, m.file],
      });
      toast.success(kind === "theory" ? "Đã thêm tài liệu" : "Đã giao bài tập");
      setQuery("");
      setOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["session-detail", sessionId],
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Nhập từ giáo trình thất bại"));
    } finally {
      setImportingKey(null);
    }
  };

  return (
    <div className="relative w-full sm:w-72">
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && (
        <div className="absolute right-0 z-20 mt-1 max-h-72 w-80 max-w-[85vw] overflow-y-auto rounded-lg border border-border/60 bg-popover shadow-lg">
          {!curriculumId ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              Lớp chưa gắn giáo trình.
            </p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              Không tìm thấy trong giáo trình.
            </p>
          ) : (
            matches.map((m) => (
              <button
                key={m.file.key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => importFile(m)}
                disabled={importingKey === m.file.key}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 disabled:opacity-60"
              >
                {importingKey === m.file.key ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-emerald-600" />
                ) : (
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {m.file.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {m.lessonTitle}
                  </span>
                </span>
                <Plus className="size-4 shrink-0 text-emerald-600" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main ────────────────────────────────────────────────────────── */

export const SessionDetailView = ({ sessionId }: { sessionId: string }) => {
  const role = useCurrentUserRole();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  // the view follows the signed-in user's role (admins see the tutor view)
  const view: ViewRole = role === "ADMIN" ? "TUTOR" : role;
  // attendance has no backend yet → local, unpersisted (keyed by studentId)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttStatus>>(
    {},
  );
  // editable session status, persisted via PATCH /sessions/:id
  const [statusDraft, setStatusDraft] = useState<SessionStatus | null>(null);
  const [statusSeedKey, setStatusSeedKey] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const {
    data: session,
    isLoading,
    error,
  } = useSessionActions({
    detailId: sessionId,
    detailOptions: { enabled: !!sessionId },
  }).detail;

  // seed the status draft when a new session loads (render-phase reset)
  if (session && statusSeedKey !== session.id) {
    setStatusSeedKey(session.id);
    setStatusDraft(session.status);
  }

  const handleUpdateStatus = async () => {
    if (!session || !statusDraft) return;
    setSavingStatus(true);
    try {
      await axiosInstance.put(`/sessions/${sessionId}`, {
        status: statusDraft,
      });
      toast.success("Đã cập nhật buổi học");
      queryClient.invalidateQueries({
        queryKey: ["session-detail", sessionId],
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Cập nhật buổi học thất bại"));
    } finally {
      setSavingStatus(false);
    }
  };

  const theory = session?.theoryUrls ?? [];
  const exercises = session?.exerciseUrls ?? [];

  const tutorId = session?.tutorId ?? session?.class.tutorId ?? null;
  const classId = session?.classId ?? null;

  /* ── Tutor name (GET /users/get-by-field) ── */
  const { data: tutorRaw } = useUserActions({
    byField: { field: "id", value: tutorId ?? "" },
    byFieldOptions: { enabled: !!tutorId },
    allGradesOptions: { enabled: false },
    userGradesOptions: { enabled: false },
  }).byField;
  const tutorName = useMemo(() => {
    if (!tutorRaw) return NO_DATA_TUTOR_NAME;
    return fullName(tutorRaw[0]) || NO_DATA_TUTOR_NAME;
  }, [tutorRaw]);

  /* ── Class roster for attendance (GET /students?classId=) ── */
  const needRoster =
    view === "TUTOR" || view === "PARENT" || view === "STUDENT";
  const { data: rosterRaw } = useClassActions({
    studentsClassId: classId ?? "",
    studentsOptions: { enabled: !!classId && needRoster },
  }).students;
  const roster = useMemo<{ id: string; name: string }[]>(() => {
    if (!rosterRaw) return [];
    const list = rosterRaw as ApiStudent[];
    return list.map((s: ApiStudent) => ({
      id: s.id,
      name: fullName(s) || s.username || "Học sinh",
    }));
  }, [rosterRaw]);

  const students = roster;
  const childId = searchParams.get("studentId");
  const child = students.find((s) => s.id === childId) ?? students[0];
  const attOf = (id: string): AttStatus => attendanceMap[id] ?? "Có mặt";
  const setAtt = (id: string, s: AttStatus) =>
    setAttendanceMap((prev) => ({ ...prev, [id]: s }));

  /* ── Real attendance for STUDENT/PARENT (GET /attendances/session/:id) ── */
  const currentUserId = useCurrentUserId();
  const { data: attendanceRaw } = useAttendanceActions({
    sessionId,
    listOptions: {
      enabled: !!sessionId && (view === "STUDENT" || view === "PARENT"),
    },
  }).list;
  const myAttendance = useMemo(() => {
    if (!attendanceRaw) return null;
    const targetId = view === "PARENT" ? child?.id : currentUserId;
    if (!targetId) return null;
    return attendanceRaw.find((r) => r.studentId === targetId) ?? null;
  }, [attendanceRaw, view, child, currentUserId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tải buổi học…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-10 text-center text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20">
          {getErrorMessage(error, "Không tìm thấy buổi học")}
        </div>
      </div>
    );
  }

  const meta = SESSION_STATUS_META[session.status];
  const canAttend = ATTENDANCE_STATUSES.includes(session.status);
  // once the session has ended, materials/exercises are locked — no more edits
  const isCompleted = session.status === "COMPLETED";
  const num = String(session.sessionNumber);
  const title = session.title || `Buổi ${num}`;
  const start = new Date(session.startAt);
  const end = new Date(session.endAt);
  const timeRange = `${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  const dateFull = start.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dateShort = start.toLocaleDateString("vi-VN");
  const durationMinutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000),
  );

  return (
    <div className="">
      {/* Breadcrumb */}
      {view === "TUTOR" ? (
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/classes" className="text-emerald-600 hover:underline">
            Quản lý lớp học
          </Link>
          <ChevronRight className="size-3.5" />
          <Link
            href={`/classes/${session.classId}`}
            className="text-emerald-600 hover:underline"
          >
            {session.class.name}
          </Link>
          <ChevronRight className="size-3.5" />
          <span>
            Buổi {num} · {dateShort}
          </span>
        </nav>
      ) : (
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/schedule" className="text-emerald-600 hover:underline">
            Lịch học
          </Link>
          <ChevronRight className="size-3.5" />
          <span>Chi tiết buổi học</span>
          <StatusBadge
            label="Chỉ xem"
            className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
          />
        </nav>
      )}

      {/* Header (TUTOR) */}
      {view === "TUTOR" && (
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <StatusBadge label={meta.label} className={meta.className} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {session.class.name} · {dateFull} · {timeRange} · Gia sư:{" "}
              {tutorName}
            </p>
          </div>

          {/* Status update (tutor / admin) — locked once the session has ended */}
          {session.status !== "COMPLETED" && (
            <div className="inline-flex shrink-0 items-center gap-2">
              <div className="w-40">
                <Select
                  options={STATUS_OPTIONS}
                  value={statusDraft ?? session.status}
                  onValueChange={(v) => setStatusDraft(v as SessionStatus)}
                />
              </div>
              <Button
                onClick={handleUpdateStatus}
                loading={savingStatus}
                disabled={!statusDraft || statusDraft === session.status}
              >
                Cập nhật
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Hero (STUDENT/PARENT) */}
      {view !== "TUTOR" && (
        <div className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
              {session.class.subject}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              {meta.label}
            </span>
            <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
              Buổi {String(session.sessionNumber).padStart(2, "0")}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-white/80">
            {session.class.name} · Gia sư: {tutorName}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoTile icon={Calendar} label="Ngày" value={dateShort} />
            <InfoTile icon={Clock} label="Giờ" value={timeRange} />
            <InfoTile
              icon={MapPin}
              label="Địa điểm"
              value={session.location || "—"}
            />
            <InfoTile
              icon={Users}
              label="Sĩ số"
              value={roster.length ? `${roster.length} học sinh` : "—"}
            />
          </div>
        </div>
      )}

      {/* ─── TUTOR ─────────────────────────────────────────────── */}
      {view === "TUTOR" && (
        <div className="mt-6 grid gap-5">
          <div className="grid gap-5 lg:grid-cols-5">
            {/* Attendance */}
            <Panel title="Điểm danh buổi học" className="lg:col-span-3">
              <div className="space-y-3">
                {students.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {initialsOf(st.name)}
                      </span>
                      <span className="text-sm font-medium">{st.name}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      {canAttend ? (
                        (["Có mặt", "Vắng", "Trễ"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setAtt(st.id, s)}
                            disabled={isCompleted}
                            className={cn(
                              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                              attOf(st.id) === s
                                ? "bg-emerald-600 text-white"
                                : "border border-border/60 bg-card text-muted-foreground hover:text-foreground",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                          >
                            {s}
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Điểm danh mở khi buổi học đang diễn ra hoặc đã kết
                          thúc
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Private note (tutor only) */}
            <section className="rounded-2xl border border-amber-200/70 bg-amber-50/60 px-6 py-5 lg:col-span-2 dark:border-amber-900/40 dark:bg-amber-950/20">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Lock className="size-4 text-amber-500" />
                Ghi chú riêng về buổi học
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {NO_PRIVATE_NOTE}
              </p>
              <p className="mt-4 text-sm font-semibold text-emerald-600">
                Chỉ gia sư nhìn thấy mục này
              </p>
            </section>
          </div>

          {/* Materials */}
          <Panel
            title="Nội dung bài giảng & tài liệu"
            action={
              !isCompleted && (
                <CurriculumImportInput
                  sessionId={sessionId}
                  curriculumId={session.class.curriculumId}
                  kind="theory"
                  existing={theory}
                  placeholder="Tìm & nhập tài liệu từ giáo trình…"
                />
              )
            }
          >
            {session.description && (
              <p className="mb-4 text-sm text-muted-foreground">
                {session.description}
              </p>
            )}
            <div className="space-y-2">
              {theory.length > 0 ? (
                theory.map((f) => (
                  <MaterialRow key={f.key} file={f} actionLabel="Xem" />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có tài liệu — tìm và nhập từ giáo trình ở trên.
                </p>
              )}
            </div>
          </Panel>

          {/* Assignments */}
          <Panel
            title="Bài tập giao trong buổi này"
            action={
              !isCompleted && (
                <CurriculumImportInput
                  sessionId={sessionId}
                  curriculumId={session.class.curriculumId}
                  kind="exercise"
                  existing={exercises}
                  placeholder="Tìm & giao bài tập từ giáo trình…"
                />
              )
            }
          >
            <div className="space-y-2">
              {exercises.length > 0 ? (
                exercises.map((f) => (
                  <MaterialRow key={f.key} file={f} actionLabel="Xem" />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa giao bài tập — tìm và nhập từ giáo trình ở trên.
                </p>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* ─── STUDENT / PARENT ──────────────────────────────────── */}
      {(view === "STUDENT" || view === "PARENT") && (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-5 lg:col-span-2">
            {(session.objectives ?? []).length > 0 && (
              <Panel title="Mục tiêu buổi học" icon={Target}>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {session.objectives.map((objective, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span>{objective}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            <Panel title="Nội dung buổi học" icon={ListChecks}>
              {(session.agenda ?? []).length > 0 ? (
                <div className="space-y-4">
                  {session.agenda.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex w-14 shrink-0 flex-col items-center">
                        <span className="text-xs font-semibold tabular-nums text-emerald-600">
                          {item.time}
                        </span>
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                        {i < session.agenda.length - 1 && (
                          <span className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pb-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : session.description ? (
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {session.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có nội dung được cập nhật cho buổi học này.
                </p>
              )}
            </Panel>

            <Panel title="Tài liệu buổi học" icon={FileText}>
              {theory.length > 0 ? (
                <div className="space-y-2">
                  {theory.map((f) => (
                    <DownloadFileRow key={f.key} file={f} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có tài liệu cho buổi học này.
                </p>
              )}
            </Panel>

            <Panel
              title="Bài tập về nhà"
              icon={ClipboardList}
              action={
                session.exerciseDueAt ? (
                  <StatusBadge
                    label={`Hạn nộp ${fmtDate(session.exerciseDueAt)}`}
                    className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400"
                  />
                ) : undefined
              }
            >
              {exercises.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {exercises.map((f) => (
                      <DownloadFileRow key={f.key} file={f} />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Nộp bài trực tiếp cho gia sư hoặc qua mục{" "}
                    <Link
                      href="/discussions"
                      className="text-emerald-600 hover:underline"
                    >
                      Tin nhắn
                    </Link>
                    .
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có bài tập được giao cho buổi học này.
                </p>
              )}
            </Panel>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Panel title="Gia sư phụ trách">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {initialsOf(tutorName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{tutorName}</p>
                  <p className="text-xs text-muted-foreground">
                    Gia sư môn {session.class.subject}
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="Thông tin buổi học">
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Ngày học</dt>
                  <dd className="font-medium">{dateFull}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Thời gian</dt>
                  <dd className="font-medium">{timeRange}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Thời lượng</dt>
                  <dd className="font-medium">{durationMinutes} phút</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Địa điểm</dt>
                  <dd className="font-medium">{session.location || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Hình thức</dt>
                  <dd className="font-medium">
                    {session.location ? "Trực tiếp" : "Trực tuyến"}
                  </dd>
                </div>
              </dl>
            </Panel>

            <Panel
              title={
                view === "PARENT"
                  ? `Điểm danh của ${child?.name ?? "học sinh"}`
                  : "Điểm danh của tôi"
              }
            >
              {!canAttend ? (
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                  <CheckCircle2 className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Chưa diễn ra</p>
                    <p className="text-xs text-muted-foreground">
                      Điểm danh sẽ được cập nhật sau buổi học
                    </p>
                  </div>
                </div>
              ) : myAttendance ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-white",
                    myAttendance.present ? "bg-emerald-600" : "bg-rose-600",
                  )}
                >
                  {myAttendance.present ? "Có mặt" : "Vắng mặt"}
                </span>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có dữ liệu điểm danh.
                </p>
              )}
            </Panel>

            <div className="rounded-2xl bg-emerald-900 px-6 py-6 text-white dark:bg-emerald-950">
              <h3 className="text-base font-semibold">
                Có câu hỏi về buổi học?
              </h3>
              <p className="mt-1 text-sm text-emerald-100">
                Nhắn trực tiếp cho gia sư
              </p>
              <Button
                asChild
                className="mt-4 w-full bg-white text-emerald-900 hover:bg-emerald-50"
              >
                <Link href="/discussions">Gửi tin nhắn cho {tutorName}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
