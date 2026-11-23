"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Download,
  GraduationCap,
  Loader2,
  Settings,
  Users,
  XCircle,
} from "lucide-react";

import { useUserActions } from "@/lib/services/user.service";
import { useGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { fmtDateTime } from "@/components/sessions/session-shared";
import {
  ParentPortalView,
  StudentAssignmentsView,
} from "@/components/practice";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.ui";

/* ─── Types ─────────────────────────────────────────────── */

type Grade = { id: string; name: string; level: number };

type Chapter = {
  id: string;
  gradeId: string | null;
  title: string;
  description: string | null;
};

type ApiClass = {
  id: string;
  name: string;
  code: string;
  subject: string;
  status: string;
  studentCount: number;
};

type ApiStudent = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatar: string | null;
};

type SessionLite = { id: string; sessionNumber?: number };

type ExerciseStatus = "ASSIGNED" | "SUBMITTED" | "GRADED" | "RESUBMIT";

type ExerciseLite = {
  id: string;
  sessionId: string | null;
  studentId: string;
  status: ExerciseStatus;
  score: number | null;
};

/** Row shape of `GET /exercises` once enriched with session/class/student relations. */
type ExerciseSummaryRow = {
  id: string;
  status: ExerciseStatus;
  score: number | null;
  updatedAt: string;
  session: {
    id: string;
    sessionNumber: number | null;
    classId: string | null;
  } | null;
  class: { id: string; name: string; code: string } | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    userCode: string | null;
    avatar: string | null;
  };
};

type ExerciseSummaryResponse = {
  data: ExerciseSummaryRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/* ─── Constants ─────────────────────────────────────────── */

const AVATAR_COLORS = [
  "from-[#12b3a0] to-[#0e9f8e]",
  "from-[#60a5fa] to-[#2563eb]",
  "from-[#a78bfa] to-[#7c3aed]",
  "from-[#f472b6] to-[#ec4899]",
  "from-[#ffb877] to-[#ff7a45]",
  "from-[#34d399] to-[#059669]",
];

function gradeColor(level: number): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  if (level <= 5)
    return {
      bg: "#FFF7ED",
      text: "#C2410C",
      border: "#FED7AA",
      dot: "#F97316",
    };
  if (level <= 9)
    return {
      bg: "#EFF6FF",
      text: "#1D4ED8",
      border: "#BFDBFE",
      dot: "#3B82F6",
    };
  return { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE", dot: "#7C3AED" };
}

/* ─── Helpers ───────────────────────────────────────────── */

function getInitials(first: string, last: string) {
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() || "?";
}

function avgOf(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return (
    Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  );
}

function classify(avg: number | null) {
  if (avg === null) return { label: "—", className: "text-[#9AAEA9]" };
  if (avg >= 8)
    return { label: "Giỏi", className: "bg-emerald-50 text-emerald-700" };
  if (avg >= 6.5)
    return { label: "Khá", className: "bg-blue-50 text-blue-700" };
  if (avg >= 5) return { label: "TB", className: "bg-amber-50 text-amber-700" };
  return { label: "Yếu", className: "bg-red-50 text-red-600" };
}

function scoreColor(n: number | null): string {
  if (n === null) return "";
  if (n >= 8) return "text-emerald-600 font-semibold";
  if (n >= 6.5) return "text-blue-600 font-semibold";
  if (n >= 5) return "text-amber-600 font-semibold";
  return "text-red-500 font-semibold";
}

/* ─── Grade scoring table ──────────────────────────────── */

const GradeTable = ({ classId }: { classId: string }) => {
  const {
    data: studentsRaw,
    isLoading: studentsLoading,
    error: studentsError,
  } = useGet(["class-students", classId], `/classes/${classId}/students`, {
    enabled: !!classId,
  });

  const students = useMemo<ApiStudent[]>(() => {
    if (!studentsRaw) return [];
    return unwrapApiData<ApiStudent[]>(studentsRaw) ?? [];
  }, [studentsRaw]);

  const { data: sessionsRaw } = useGet(
    ["class-sessions-lite", classId],
    "/sessions",
    { params: { classId, limit: 100 }, enabled: !!classId },
  );

  const sessions = useMemo<SessionLite[]>(() => {
    if (!sessionsRaw) return [];
    const d = unwrapApiData<{ data: SessionLite[] } | SessionLite[]>(
      sessionsRaw,
    );
    if (!d) return [];
    const list = Array.isArray(d) ? d : (d.data ?? []);
    return [...list].sort(
      (a, b) => (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0),
    );
  }, [sessionsRaw]);

  const { data: exercisesRaw, isLoading: exercisesLoading } = useGet(
    ["class-exercises", classId],
    "/exercises",
    { params: { classId, limit: 100 }, enabled: !!classId },
  );

  const exercises = useMemo<ExerciseLite[]>(() => {
    if (!exercisesRaw) return [];
    const d = unwrapApiData<{ data: ExerciseLite[] }>(exercisesRaw);
    return d?.data ?? [];
  }, [exercisesRaw]);

  /* Only show session columns that actually have a submission, to avoid a huge sparse grid. */
  const gradeSessions = useMemo(() => {
    const idsWithExercises = new Set(
      exercises.map((e) => e.sessionId).filter((v): v is string => !!v),
    );
    return sessions.filter((s) => idsWithExercises.has(s.id));
  }, [sessions, exercises]);

  /* studentId → sessionId → exercise */
  const scoreMap = useMemo(() => {
    const map: Record<string, Record<string, ExerciseLite>> = {};
    for (const ex of exercises) {
      if (!ex.sessionId) continue;
      if (!map[ex.studentId]) map[ex.studentId] = {};
      map[ex.studentId][ex.sessionId] = ex;
    }
    return map;
  }, [exercises]);

  const tableStats = useMemo(() => {
    const avgs = students
      .map((s) =>
        avgOf(
          gradeSessions
            .map((sess) => scoreMap[s.id]?.[sess.id]?.score)
            .filter((v): v is number => v !== null && v !== undefined),
        ),
      )
      .filter((v): v is number => v !== null);
    const passed = avgs.filter((v) => v >= 5).length;
    return { passed, total: avgs.length, avg: avgOf(avgs) };
  }, [students, gradeSessions, scoreMap]);

  const isLoading = studentsLoading || exercisesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-[#9AAEA9]" />
      </div>
    );
  }

  if (studentsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="size-7 text-red-400" />
        <p className="mt-2 text-sm text-[#9AAEA9]">
          {getErrorMessage(studentsError, "Không thể tải danh sách học sinh")}
        </p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="size-9 text-[#C5D5D1]" />
        <p className="mt-2 text-sm text-[#9AAEA9]">Lớp chưa có học sinh nào.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Tổng học sinh", value: students.length },
          { label: "Điểm TB lớp", value: tableStats.avg ?? "—" },
          {
            label: "Tỉ lệ đạt",
            value:
              tableStats.total > 0
                ? `${Math.round((tableStats.passed / tableStats.total) * 100)}%`
                : "—",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-[#E7EEEC] bg-[#F9FDFB] px-3 py-2.5"
          >
            <p className="text-xs text-[#9AAEA9]">{s.label}</p>
            <p className="mt-0.5 text-lg font-bold text-[#16302b]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white">
        {gradeSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardCheck className="size-9 text-[#C5D5D1]" />
            <p className="mt-2 text-sm text-[#9AAEA9]">
              Chưa có bài tập nào được chấm điểm trong lớp này.
            </p>
            <Link
              href={`/classes/${classId}`}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-[#0E9F8E] hover:underline"
            >
              Vào lớp học để chấm bài <ChevronRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                className="w-full text-sm"
                style={{ minWidth: `${440 + gradeSessions.length * 110}px` }}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-4">
                      STT
                    </TableHead>
                    <TableHead className="min-w-40 px-3">
                      Học sinh
                    </TableHead>
                    {gradeSessions.map((sess, i) => (
                      <TableHead
                        key={sess.id}
                        className="w-25 px-2"
                      >
                        Buổi {sess.sessionNumber ?? i + 1}
                      </TableHead>
                    ))}
                    <TableHead className="w-20 px-2">
                      Điểm TB
                    </TableHead>
                    <TableHead className="w-20 px-3">
                      Xếp loại
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, idx) => {
                    const name = `${s.firstName} ${s.lastName}`;
                    const initials = getInitials(s.firstName, s.lastName);
                    const colorClass =
                      AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    const scores = gradeSessions
                      .map((sess) => scoreMap[s.id]?.[sess.id]?.score)
                      .filter(
                        (v): v is number => v !== null && v !== undefined,
                      );
                    const avg = avgOf(scores);
                    const { label: rankLabel, className: rankClass } =
                      classify(avg);

                    return (
                      <TableRow
                        key={s.id}
                        className="border-b border-[#EEF3F1] last:border-0 transition-colors hover:bg-[#F9FDFB]"
                      >
                        <TableCell className="py-3 pl-4 text-xs font-medium text-[#9AAEA9]">
                          {String(idx + 1).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {s.avatar ? (
                              <Image
                                width={40}
                                height={40}
                                src={s.avatar}
                                alt={name}
                                className="size-7 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className={cn(
                                  "flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-white",
                                  colorClass,
                                )}
                              >
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-[#16302b]">
                                {name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        {gradeSessions.map((sess) => {
                          const ex = scoreMap[s.id]?.[sess.id];
                          return (
                            <TableCell key={sess.id} className="px-2 py-3">
                              {!ex ? (
                                <span className="text-xs text-[#C5D5D1]">
                                  —
                                </span>
                              ) : ex.status === "GRADED" ? (
                                <span
                                  className={cn(
                                    "text-xs",
                                    scoreColor(ex.score),
                                  )}
                                >
                                  {ex.score}
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                  Chờ chấm
                                </span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="px-2 py-3">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              scoreColor(avg) || "text-[#9AAEA9]",
                            )}
                          >
                            {avg ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          {avg !== null ? (
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                rankClass,
                              )}
                            >
                              {rankLabel}
                            </span>
                          ) : (
                            <span className="text-xs text-[#C5D5D1]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-[#EEF3F1] px-4 py-2.5">
              <p className="text-xs text-[#9AAEA9]">
                Chấm điểm bài tập trong trang chi tiết từng buổi học.
              </p>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-[#E7EEEC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#5c726d] transition-colors hover:bg-[#F3F7F5]"
              >
                <Download className="size-3" />
                Xuất Excel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Grade level card (with chapters from API) ─────────── */

const GradeCard = ({ grade }: { grade: Grade }) => {
  const colors = gradeColor(grade.level);
  const [expanded, setExpanded] = useState(false);

  const { data: chaptersRaw, isLoading } = useGet<unknown>(
    ["chapters-by-grade", grade.id],
    `/curriculum/by-grade/${grade.id}`,
    { enabled: expanded },
  );

  const chapters = useMemo<Chapter[]>(() => {
    if (!chaptersRaw) return [];
    const d = unwrapApiData<{ curriculums: Chapter[] }>(chaptersRaw);
    return d?.curriculums ?? [];
  }, [chaptersRaw]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7EEEC] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F9FDFB]"
      >
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold"
          style={{
            background: colors.bg,
            color: colors.text,
            border: `2px solid ${colors.border}`,
          }}
        >
          {grade.level}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#16302b]">{grade.name}</p>
          <p className="mt-0.5 text-xs text-[#9AAEA9]">
            Nhấn để xem chương trình
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#9AAEA9] transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-[#EEF3F1]">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-[#9AAEA9]" />
            </div>
          ) : chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <BookOpen className="size-7 text-[#C5D5D1]" />
              <p className="mt-2 text-xs text-[#9AAEA9]">
                Chưa có chương trình nào.
              </p>
              <Link
                href="/classes"
                className="mt-2 flex items-center gap-1 text-xs font-medium text-[#0E9F8E] hover:underline"
              >
                Vào lớp học để tạo <ChevronRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            chapters.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between border-b border-[#EEF3F1] px-5 py-3.5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: colors.dot }}
                  />
                  <div>
                    <p className="text-sm font-medium text-[#16302b]">
                      {ch.title}
                    </p>
                    {ch.description && (
                      <p className="text-xs text-[#9AAEA9]">{ch.description}</p>
                    )}
                  </div>
                </div>
                <Link
                  href="/classes"
                  className="flex items-center gap-1 text-xs font-medium text-[#0E9F8E] hover:underline"
                >
                  <BookOpen className="size-3.5" />
                  Xem lớp
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ─── All-classes exercise summary (chờ chấm / đã chấm) ─────────── */

type ExerciseFilter = "all" | ExerciseStatus;

/* ─── Constants moved below ─── */

const EXERCISE_TABS: { value: ExerciseFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "ASSIGNED", label: "Chưa nộp" },
  { value: "SUBMITTED", label: "Chờ chấm" },
  { value: "GRADED", label: "Đã chấm" },
  { value: "RESUBMIT", label: "Cần nộp lại" },
];

const EXERCISE_STATUS_BADGE: Record<
  ExerciseStatus,
  { label: string; className: string }
> = {
  ASSIGNED: { label: "Chưa nộp", className: "bg-slate-100 text-slate-600" },
  SUBMITTED: { label: "Chờ chấm", className: "bg-amber-50 text-amber-700" },
  GRADED: { label: "Đã chấm", className: "bg-emerald-50 text-emerald-700" },
  RESUBMIT: { label: "Cần nộp lại", className: "bg-rose-50 text-rose-700" },
};

const AllExercisesList = () => {
  const router = useRouter();
  const tutorId = useCurrentUserId();
  const [filter, setFilter] = useState<ExerciseFilter>("all");

  const {
    data: raw,
    isLoading,
    error,
  } = useGet(["tutor-exercises", tutorId], "/exercises", {
    params: { tutorId, limit: 100 },
    enabled: !!tutorId,
  });

  const exercises = useMemo<ExerciseSummaryRow[]>(() => {
    if (!raw) return [];
    return unwrapApiData<ExerciseSummaryResponse>(raw).data ?? [];
  }, [raw]);

  const counts = useMemo(
    () => ({
      all: exercises.length,
      ASSIGNED: exercises.filter((e) => e.status === "ASSIGNED").length,
      SUBMITTED: exercises.filter((e) => e.status === "SUBMITTED").length,
      GRADED: exercises.filter((e) => e.status === "GRADED").length,
      RESUBMIT: exercises.filter((e) => e.status === "RESUBMIT").length,
    }),
    [exercises],
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? exercises
        : exercises.filter((e) => e.status === filter),
    [exercises, filter],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EEEC] px-5 py-3.5">
        <h3 className="font-semibold text-[#16302b]">Bài tập tất cả lớp</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {EXERCISE_TABS.map((tab) => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-[#0E9F8E] text-white"
                    : "border border-[#E7EEEC] bg-white text-[#16302b] hover:border-[#0E9F8E]/40 hover:text-[#0E9F8E]",
                )}
              >
                {tab.label} ({counts[tab.value]})
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#9AAEA9]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <XCircle className="size-7 text-red-400" />
          <p className="mt-2 text-sm text-[#9AAEA9]">
            {getErrorMessage(error, "Không thể tải danh sách bài tập")}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardCheck className="size-9 text-[#C5D5D1]" />
          <p className="mt-2 text-sm text-[#9AAEA9]">
            Không có bài tập nào phù hợp.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[720px] text-sm">
            <TableHeader>
              <TableRow>
                {[
                  "Học sinh",
                  "Lớp",
                  "Buổi",
                  "Trạng thái",
                  "Điểm",
                  "Cập nhật",
                  "",
                ].map((h, i) => (
                  <TableHead
                    key={h}
                    className={i === 3 || i === 6 ? "px-4 text-center" : "px-4"}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ex) => {
                const name = `${ex.student.firstName} ${ex.student.lastName}`;
                const initials = getInitials(
                  ex.student.firstName,
                  ex.student.lastName,
                );
                const badge = EXERCISE_STATUS_BADGE[ex.status];
                const gradeHref =
                  ex.status !== "ASSIGNED" && ex.class && ex.session
                    ? `/classes/${ex.class.id}/sessions/${ex.session.id}/submissions/${ex.id}`
                    : null;
                return (
                  <TableRow
                    key={ex.id}
                    onClick={gradeHref ? () => router.push(gradeHref) : undefined}
                    className={cn(
                      "border-b border-[#EEF3F1] last:border-0 hover:bg-[#F9FDFB] transition-colors",
                      gradeHref && "cursor-pointer",
                    )}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ex.student.avatar ? (
                          <img
                            src={ex.student.avatar}
                            alt={name}
                            className="size-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#12b3a0] to-[#0e9f8e] text-[10px] font-bold text-white">
                            {initials}
                          </div>
                        )}
                        <span className="text-xs font-medium text-[#16302b]">
                          {name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-[#16302b]">
                      {ex.class ? `${ex.class.name} (${ex.class.code})` : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-[#16302b]">
                      {ex.session?.sessionNumber
                        ? `Buổi ${ex.session.sessionNumber}`
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs font-semibold text-[#16302b]">
                      {ex.score ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-[#9AAEA9]">
                      {fmtDateTime(ex.updatedAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      {gradeHref && (
                        <Link
                          href={gradeHref}
                          className="text-xs font-medium text-[#0E9F8E] hover:underline"
                        >
                          {ex.status === "GRADED" ? "Xem" : "Chấm điểm"} →
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

    </div>
  );
};

/* ─── Tutor / admin management page ─────────────────────── */

const GRADES_USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Bài tập cần chấm",
    body: (
      <>
        Lọc theo <span className="font-semibold text-amber-700">Chờ chấm</span>,{" "}
        <span className="font-semibold text-emerald-700">Đã chấm</span> hoặc{" "}
        <span className="font-semibold text-rose-700">Cần nộp lại</span>, rồi
        nhấn <span className="font-semibold text-[#0E9F8E]">Chấm điểm</span> để
        vào bài nộp.
      </>
    ),
  },
  {
    n: 2,
    title: "Khối lớp & chương trình",
    body: "Nhấn một thẻ khối lớp để mở/thu gọn danh sách chương trình học của khối đó.",
  },
  {
    n: 3,
    title: "Bảng điểm theo lớp",
    body: "Chọn tab lớp học để xem bảng điểm từng buổi; chấm điểm thực hiện ở trang chi tiết buổi học, không sửa trực tiếp trên bảng.",
  },
  {
    n: 4,
    title: "Xếp loại",
    body: (
      <>
        <span className="font-semibold text-emerald-700">Giỏi</span> ≥ 8.0,{" "}
        <span className="font-semibold text-blue-700">Khá</span> 6.5–7.9,{" "}
        <span className="font-semibold text-amber-700">TB</span> 5.0–6.4,{" "}
        <span className="font-semibold text-red-600">Yếu</span> dưới 5.0.
      </>
    ),
  },
];

const TutorGradesPage = () => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const { data: selectedGradesRaw, isLoading: gradesLoading } =
    useUserActions().userGrades;

  const { data: exercisesTotalRaw } = useGet<unknown>(
    ["exercises-total"],
    "/exercises",
    { params: { limit: 1 } },
  );

  const exercisesTotal = useMemo(() => {
    if (!exercisesTotalRaw) return 0;
    const d = unwrapApiData<{ pagination?: { total: number } }>(
      exercisesTotalRaw,
    );
    return d?.pagination?.total ?? 0;
  }, [exercisesTotalRaw]);

  const selectedGrades = useMemo<Grade[]>(() => {
    return (selectedGradesRaw ?? []).sort((a, b) => a.level - b.level);
  }, [selectedGradesRaw]);

  const { data: apiPayload, isLoading: classesLoading } = useGet<unknown>(
    ["grades", "classes-list"],
    "/classes",
    { params: { limit: 100 } },
  );

  const classes = useMemo<ApiClass[]>(() => {
    if (!apiPayload) return [];
    const unwrapped = unwrapApiData<{ data: unknown[] }>(apiPayload);
    return (unwrapped?.data ?? []) as ApiClass[];
  }, [apiPayload]);

  const activeClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? classes[0] ?? null,
    [classes, selectedClassId],
  );

  const hasGrades = selectedGrades.length > 0;

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-[#16302b]">
              Bài tập về nhà
            </h1>
            {hasGrades && (
              <span className="rounded-full bg-[#E4F6EF] px-3 py-0.5 text-sm font-semibold text-[#0E9F8E]">
                {selectedGrades.length} khối
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#9AAEA9]">
            Chọn khối lớp để xem chương trình và nhập điểm học sinh.
          </p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 rounded-lg border border-[#E7EEEC] bg-white px-3 py-2 text-sm font-medium text-[#5c726d] transition-colors hover:bg-[#F1FBF9]"
        >
          <Settings className="size-3.5" />
          Cài đặt khối lớp
        </Link>
      </div>

      {/* ── All-classes exercise summary (independent of khối lớp setup) ── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#EEF3F1]" />
        <span className="text-xs font-medium text-[#9AAEA9]">
          Bài tập cần chấm — tất cả lớp
        </span>
        <div className="h-px flex-1 bg-[#EEF3F1]" />
      </div>

      <AllExercisesList />

      {/* ── No grade selected ── */}
      {gradesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[#9AAEA9]" />
        </div>
      ) : !hasGrades ? null : (
        <>
          {/* ── Grade level cards ── */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
              Khối lớp đang dạy — xem chương trình theo khối
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedGrades.map((grade) => (
                <GradeCard key={grade.id} grade={grade} />
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#EEF3F1]" />
            <span className="text-xs font-medium text-[#9AAEA9]">
              Bảng điểm theo lớp
            </span>
            <div className="h-px flex-1 bg-[#EEF3F1]" />
          </div>

          {/* ── Stat bar ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                icon: <BookOpen className="size-5 text-[#0E9F8E]" />,
                bg: "#E4F6EF",
                label: "Tổng lớp học",
                value: classes.length,
                suffix: "lớp",
              },
              {
                icon: <GraduationCap className="size-5 text-[#0E9F8E]" />,
                bg: "#E4F6EF",
                label: "Khối lớp",
                value: selectedGrades.length,
                suffix: "khối",
              },
              {
                icon: <Users className="size-5 text-blue-500" />,
                bg: "#DBEAFE",
                label: "Tổng học sinh",
                value: classes.reduce((s, c) => s + (c.studentCount ?? 0), 0),
                suffix: "học sinh",
              },
              {
                icon: <Award className="size-5 text-violet-500" />,
                bg: "#EDE9FE",
                label: "Bài tập đã nộp",
                value: exercisesTotal,
                suffix: "bài",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-[#E7EEEC] bg-white p-4 shadow-sm"
              >
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: card.bg }}
                  >
                    {card.icon}
                  </span>
                  <p className="text-xs text-[#5c726d]">{card.label}</p>
                </div>
                <p className="text-xl font-bold text-[#16302b]">
                  {card.value}
                  <span className="ml-1 text-xs font-medium text-[#9AAEA9]">
                    {card.suffix}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* ── Class tabs + score table ── */}
          {classesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-[#9AAEA9]" />
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#E7EEEC] bg-white py-12 text-center">
              <BookOpen className="size-8 text-[#C5D5D1]" />
              <p className="mt-3 text-sm text-[#9AAEA9]">
                Chưa có lớp học nào.
              </p>
              <Link
                href="/classes"
                className="mt-3 flex items-center gap-1 text-sm font-medium text-[#0E9F8E] hover:underline"
              >
                Tạo lớp học <ChevronRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => {
                  const active = (selectedClassId ?? classes[0]?.id) === cls.id;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClassId(cls.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                        active
                          ? "border-[#0E9F8E] bg-[#0E9F8E] text-white shadow-sm"
                          : "border-[#E7EEEC] bg-white text-[#5c726d] hover:border-[#0E9F8E]/40 hover:bg-[#F1FBF9] hover:text-[#0E9F8E]",
                      )}
                    >
                      <BookOpen className="size-3.5 shrink-0" />
                      <span>{cls.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                          active
                            ? "bg-white/20 text-white"
                            : "bg-[#E4F6EF] text-[#0E9F8E]",
                        )}
                      >
                        {cls.studentCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeClass && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#16302b]">
                      {activeClass.name}
                    </h2>
                    <span className="rounded-full bg-[#E4F6EF] px-2.5 py-0.5 text-xs font-semibold text-[#0B7A6D]">
                      {activeClass.subject || activeClass.code}
                    </span>
                  </div>
                  <Link
                    href={`/classes/${activeClass.id}/curriculum`}
                    className="flex items-center gap-1 text-xs font-medium text-[#0E9F8E] transition-colors hover:text-[#0B7A6D]"
                  >
                    <BookOpen className="size-3.5" />
                    Xem chương trình
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              )}

              {activeClass && (
                <GradeTable key={activeClass.id} classId={activeClass.id} />
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#9AAEA9]">
            <span className="font-medium text-[#5c726d]">Xếp loại:</span>
            {[
              {
                label: "Giỏi",
                range: "≥ 8.0",
                cls: "bg-emerald-50 text-emerald-700",
              },
              {
                label: "Khá",
                range: "6.5–7.9",
                cls: "bg-blue-50 text-blue-700",
              },
              {
                label: "TB",
                range: "5.0–6.4",
                cls: "bg-amber-50 text-amber-700",
              },
              { label: "Yếu", range: "< 5.0", cls: "bg-red-50 text-red-600" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    item.cls,
                  )}
                >
                  {item.label}
                </span>
                {item.range}
              </span>
            ))}
          </div>
        </>
      )}

      <UsageGuides steps={GRADES_USAGE_GUIDE_STEPS} />
    </div>
  );
};

/* ─── Role-aware entry ──────────────────────────────────────
 * STUDENT → their own assignments ("Bài tập được giao")
 * PARENT  → child portal (homework + fees tabs + QR payment)
 * TUTOR / ADMIN → grade management dashboard
 * ---------------------------------------------------------- */

export const GradesPage = () => {
  const role = useCurrentUserRole();

  if (role === "STUDENT") return <StudentAssignmentsView />;
  if (role === "PARENT") return <ParentPortalView />;
  return <TutorGradesPage />;
};
