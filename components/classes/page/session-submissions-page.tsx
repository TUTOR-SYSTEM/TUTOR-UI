"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table.ui";
import { cn } from "@/lib/utils";
import { useGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import type {
  ExerciseDetail,
  ExercisesResponse,
  SessionStatus,
} from "@/types/session.types";
import {
  EXERCISE_STATUS_META,
  SESSION_STATUS_META,
  StatusBadge,
  fmtDate,
  fmtDateTime,
  fmtTime,
} from "@/components/sessions/session-shared";

/* ─── Types ─── */

type SessionSummary = {
  id: string;
  title: string | null;
  sessionNumber: number;
  startAt: string;
  endAt: string;
  status: SessionStatus;
  class: { id: string; name: string; code: string; subject: string };
};

type ClassStudentDto = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  userCode: string | null;
};

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

/* ─── Main page ─── */

type SessionSubmissionsPageProps = {
  classId: string;
  sessionId: string;
};

export const SessionSubmissionsPage = ({
  classId,
  sessionId,
}: SessionSubmissionsPageProps) => {
  const {
    data: sessionRaw,
    isLoading: sessionLoading,
    error: sessionError,
  } = useGet(["session-detail", sessionId], `/sessions/${sessionId}`, {
    enabled: !!sessionId,
  });

  const session = useMemo(
    () => (sessionRaw ? unwrapApiData<SessionSummary>(sessionRaw) : null),
    [sessionRaw],
  );

  const { data: studentsRaw, isLoading: studentsLoading } = useGet(
    ["class-students", classId],
    `/classes/${classId}/students`,
    { enabled: !!classId },
  );

  const students = useMemo(
    () =>
      studentsRaw ? (unwrapApiData<ClassStudentDto[]>(studentsRaw) ?? []) : [],
    [studentsRaw],
  );

  const exercisesKey = ["session-exercises", sessionId];
  const { data: exercisesRaw, isLoading: exercisesLoading } = useGet(
    exercisesKey,
    "/exercises",
    { params: { sessionId, limit: 100 }, enabled: !!sessionId },
  );

  const submissionByStudent = useMemo(() => {
    const map: Record<string, ExerciseDetail> = {};
    if (!exercisesRaw) return map;
    const list = unwrapApiData<ExercisesResponse>(exercisesRaw).data ?? [];
    for (const ex of list) {
      map[ex.studentId] = ex;
    }
    return map;
  }, [exercisesRaw]);

  const submittedCount = students.filter(
    (s) => submissionByStudent[s.id],
  ).length;
  const gradedCount = students.filter(
    (s) => submissionByStudent[s.id]?.status === "GRADED",
  ).length;

  const loading = sessionLoading || studentsLoading || exercisesLoading;

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <XCircle className="size-10 text-red-500" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {getErrorMessage(sessionError) || "Không thể tải thông tin buổi học"}
        </p>
        <Link
          href={`/classes/${classId}`}
          className="mt-4 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          Quay lại lớp học
        </Link>
      </div>
    );
  }

  const meta = SESSION_STATUS_META[session.status];

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/classes"
          className="transition-colors hover:text-foreground"
        >
          Quản lý lớp học
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/classes/${classId}`}
          className="transition-colors hover:text-foreground"
        >
          {session.class.code}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/classes/${classId}/sessions/${sessionId}`}
          className="transition-colors hover:text-foreground"
        >
          Buổi {session.sessionNumber}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Bài nộp</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold">
              {session.title || `Buổi ${session.sessionNumber}`}
            </h1>
            <StatusBadge label={meta.label} className={meta.className} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {session.class.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {fmtDate(session.startAt)} · {fmtTime(session.startAt)}–
              {fmtTime(session.endAt)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400">
            <Users className="size-3" />
            {submittedCount}/{students.length} đã nộp
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400">
            <ClipboardCheck className="size-3" />
            {gradedCount}/{students.length} đã chấm
          </span>
        </div>
      </div>

      {/* Submissions table */}
      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              Lớp chưa có học sinh
            </p>
          </div>
        ) : (
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5">Học sinh</TableHead>
                <TableHead className="w-28">Mã HS</TableHead>
                <TableHead className="w-40 text-center">Trạng thái</TableHead>
                <TableHead className="w-40">Ngày nộp</TableHead>
                <TableHead className="w-20">Điểm</TableHead>
                <TableHead className="w-36 text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, idx) => {
                const name =
                  `${student.firstName} ${student.lastName}`.trim();
                const submission = submissionByStudent[student.id] ?? null;
                const statusMeta = submission
                  ? EXERCISE_STATUS_META[submission.status]
                  : EXERCISE_STATUS_META.NOT_SUBMITTED;

                return (
                  <TableRow key={student.id} className="h-16 hover:bg-muted/20">
                    <TableCell className="px-5">
                      <div className="flex items-center gap-3">
                        {student.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={student.avatar}
                            alt=""
                            className="size-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                              AVATAR_COLORS[idx % AVATAR_COLORS.length],
                            )}
                          >
                            {getInitials(name)}
                          </div>
                        )}
                        <span className="font-medium">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {student.userCode || "—"}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <StatusBadge
                        label={statusMeta.label}
                        className={statusMeta.className}
                      />
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {submission ? fmtDateTime(submission.updatedAt) : "—"}
                    </TableCell>
                    <TableCell className="px-4 font-semibold">
                      {submission?.score ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <Button
                        variant={submission ? "outline" : "ghost"}
                        size="sm"
                        disabled={!submission}
                        asChild={!!submission}
                      >
                        {submission ? (
                          <Link
                            href={`/classes/${classId}/sessions/${sessionId}/submissions/${submission.id}`}
                          >
                            {submission.status === "GRADED"
                              ? "Sửa điểm"
                              : "Chấm điểm"}
                          </Link>
                        ) : (
                          "Chưa nộp"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
