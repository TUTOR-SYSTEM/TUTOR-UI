"use client";

/**
 * Student view — "Bài tập được giao".
 * Lists the assignments the student sees across their enrolled classes, driven by
 * the real API: sessions (`GET /sessions`) merged with the student's submissions
 * (`GET /exercises?studentId=me`). Each row links to the per-session submit page.
 */

import { useMemo } from "react";
import Link from "next/link";
import { ClipboardCheck, Eye, Loader2, Star, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { useSessionActions } from "@/lib/services/session.service";
import { useExerciseActions } from "@/lib/services/exercise.service";
import { getErrorMessage } from "@/lib/axios";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { fmtDate } from "@/components/sessions/session-shared";
import type {
  StudentSessionListItem,
  ExerciseDetail,
} from "@/types/session.types";
import {
  PRACTICE_STATUS,
  PortalFooter,
  type PracticeStatus,
} from "./practice-shared";

/* ─── Assignment row (derived from a session + optional submission) ─── */

type AssignmentRowData = {
  key: string;
  href: string;
  title: string;
  description: string;
  dueLabel: string;
  status: PracticeStatus;
  score: number | null;
};

const ASSIGNMENT_COLUMNS: DataTableColumn<AssignmentRowData>[] = [
  {
    key: "title",
    header: "Bài tập",
    render: (a) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F0FE] text-[#6366F1]">
          <ClipboardCheck className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#16302b]">{a.title}</p>
          <p className="truncate text-xs text-[#5c726d]">{a.description}</p>
        </div>
      </div>
    ),
  },
  {
    key: "session",
    header: "Buổi học",
    render: (a) => (
      <span className="text-xs font-medium text-[#16302b]">{a.dueLabel}</span>
    ),
  },
  {
    key: "status",
    header: "Trạng thái",
    align: "center",
    render: (a) => {
      const meta = PRACTICE_STATUS[a.status];
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            meta.badge,
          )}
        >
          <span className="size-1.5 rounded-full bg-current opacity-70" />
          {meta.label}
        </span>
      );
    },
  },
  {
    key: "score",
    header: "Điểm",
    align: "center",
    render: (a) =>
      a.status === "GRADED" && a.score !== null ? (
        <span className="inline-flex items-center gap-1 font-bold text-[#4f46e5]">
          <Star className="size-3.5 fill-current" />
          {a.score.toFixed(1)}
          <span className="text-xs font-normal text-[#9AAEA9]">/10</span>
        </span>
      ) : (
        <span className="text-[#9AAEA9]">—</span>
      ),
  },
  {
    key: "action",
    header: "Thao tác",
    align: "center",
    render: (a) => (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="text-[#0E9F8E]"
        aria-label="Xem bài tập đã giao"
        title="Xem bài tập đã giao"
      >
        <Link href={a.href}>
          <Eye className="size-4" />
          Xem bài tập
        </Link>
      </Button>
    ),
  },
];

/* ─── Main view ─── */

export const StudentAssignmentsView = () => {
  const studentId = useCurrentUserId();

  const {
    data: sessionsPayload,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useSessionActions({ list: { limit: 100 } }).list;

  const sessions = useMemo<StudentSessionListItem[]>(() => {
    return sessionsPayload?.sessions ?? [];
  }, [sessionsPayload]);

  const { data: exercisesRaw, isLoading: exercisesLoading } =
    useExerciseActions({
      list: { studentId: studentId ?? undefined, limit: 100 },
      listOptions: { enabled: !!studentId },
    }).list;

  const submissionBySession = useMemo(() => {
    const map: Record<string, ExerciseDetail> = {};
    if (!exercisesRaw) return map;
    for (const ex of exercisesRaw) {
      if (ex.sessionId) map[ex.sessionId] = ex;
    }
    return map;
  }, [exercisesRaw]);

  const assignments = useMemo<AssignmentRowData[]>(() => {
    const rows: (AssignmentRowData & { sessionNumber: number })[] = [];
    for (const s of sessions) {
      const submission = submissionBySession[s.id];
      // an assignment exists once homework is visible (session ended with exercise files)
      // or the student has already submitted something for this session.
      const hasAssigned =
        s.status === "COMPLETED" && (s.exerciseUrls?.length ?? 0) > 0;
      if (!submission && !hasAssigned) continue;

      const status: PracticeStatus =
        submission?.status === "GRADED"
          ? "GRADED"
          : submission && submission.status === "SUBMITTED"
            ? "SUBMITTED"
            : "NOT_SUBMITTED";

      rows.push({
        key: s.id,
        href: `/classes/${s.classId}/sessions/${s.id}/exercise`,
        title: s.title || `Buổi ${s.sessionNumber}`,
        description:
          s.description?.trim() ||
          `${s.class.name} · Bài tập buổi ${s.sessionNumber}`,
        dueLabel: `${fmtDate(s.startAt)} · Buổi ${s.sessionNumber}`,
        status,
        score: submission?.score ?? null,
        sessionNumber: s.sessionNumber,
      });
    }
    return rows.sort((a, b) => b.sessionNumber - a.sessionNumber);
  }, [sessions, submissionBySession]);

  const stats = useMemo(() => {
    const graded = assignments.filter((a) => a.status === "GRADED");
    const submitted = assignments.filter(
      (a) => a.status === "SUBMITTED",
    ).length;
    const pending = assignments.filter(
      (a) => a.status === "NOT_SUBMITTED",
    ).length;
    const scores = graded
      .map((a) => a.score)
      .filter((v): v is number => v !== null);
    const avg =
      scores.length > 0
        ? Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 10) /
          10
        : null;
    return {
      total: assignments.length,
      submitted,
      pending,
      graded: graded.length,
      avg,
    };
  }, [assignments]);

  const loading = sessionsLoading || exercisesLoading;

  return (
    <div className="flex w-full flex-col gap-4 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#16302b]">Bài tập được giao</h1>
        <p className="mt-1 text-sm text-[#9AAEA9]">
          Xem đề bài sau mỗi buổi học, nộp bài đúng hạn và nhận điểm cùng nhận
          xét của gia sư.
        </p>
      </div>

      {!loading && !sessionsError && assignments.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Tổng bài", value: stats.total },
            { label: "Chưa nộp", value: stats.pending },
            { label: "Chờ chấm", value: stats.submitted },
            { label: "Điểm TB", value: stats.avg ?? "—" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-[#E7EEEC] bg-[#F9FDFB] px-3 py-2.5"
            >
              <p className="text-xs text-[#9AAEA9]">{s.label}</p>
              <p className="mt-0.5 text-lg font-bold text-[#16302b]">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[#9AAEA9]" />
        </div>
      ) : sessionsError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <XCircle className="size-8 text-red-400" />
          <p className="mt-2 text-sm text-[#9AAEA9]">
            {getErrorMessage(sessionsError, "Không thể tải danh sách bài tập")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
          <DataTable
            data={assignments}
            columns={ASSIGNMENT_COLUMNS}
            rowKey={(a) => a.key}
            emptyMessage="Chưa có bài tập nào được giao."
            headerRowClassName="border-b border-[#E7EEEC] bg-[#F3F7F5]"
            rowClassName="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9]"
            pageSize={10}
          />
        </div>
      )}

      <PortalFooter />
    </div>
  );
};
