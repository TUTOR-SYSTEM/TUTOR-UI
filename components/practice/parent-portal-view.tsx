"use client";

/**
 * Parent view — child's homework portal ("Bài làm của con").
 * Real data: the children linked to this PARENT (`GET /students/my-children`) and one child's
 * homework (`GET /exercises?studentId=`, BE scopes parent → child). Học phí lives at `/fees`.
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useParentPortalActions } from "@/lib/services/parent-portal.service";
import type { ParentExerciseRow } from "@/types";
import {
  PRACTICE_STATUS,
  PortalBanner,
  PortalFooter,
  StatTile,
  type Assignment,
} from "./practice-shared";

type AssignmentStatus = Assignment["status"];

/** Map một dòng bài tập của BE sang trạng thái hiển thị cho phụ huynh. */
function toAssignment(row: ParentExerciseRow): Assignment {
  const hasFiles = (row.exerciseUrls?.length ?? 0) > 0;
  const status: AssignmentStatus =
    row.status === "GRADED"
      ? "GRADED"
      : hasFiles
        ? "SUBMITTED"
        : "NOT_SUBMITTED";
  const sessionNumber = row.session?.sessionNumber ?? 0;
  return {
    id: row.id,
    title: `Bài tập buổi ${sessionNumber || "—"}`,
    sessionNumber,
    sessionDate: "",
    description: row.class?.name ?? "",
    dueLabel: "",
    status,
    score: row.score == null ? null : Number(row.score),
  };
}

/* ─── Homework row (read-only, parent perspective) ─────────── */

const WorkRow = ({ a }: { a: Assignment }) => {
  const meta = PRACTICE_STATUS[a.status];
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#E7EEEC] dark:border-border bg-white dark:bg-card shadow-sm">
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.bar)} />
      <div className="flex items-center gap-4 pl-5 pr-4 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F1F0FE] dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#A5B4FC]">
          <ClipboardCheck className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[#16302b] dark:text-foreground">{a.title}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                meta.badge,
              )}
            >
              <span className="size-1.5 rounded-full bg-current opacity-70" />
              {meta.label}
            </span>
          </div>
          {a.description && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9AAEA9] dark:text-muted-foreground">
              <Clock className="size-3.5" />
              Lớp: <span className="font-medium">{a.description}</span>
            </p>
          )}
        </div>

        {/* Right result */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="text-right">
            {a.status === "GRADED" ? (
              <>
                <p className="text-xl font-bold text-[#4f46e5] dark:text-[#A5B4FC]">
                  {a.score?.toFixed(1)}
                </p>
                <p className="text-[11px] text-[#9AAEA9] dark:text-muted-foreground">điểm</p>
              </>
            ) : a.status === "SUBMITTED" ? (
              <>
                <p className="text-lg font-bold tracking-widest text-[#C5D5D1] dark:text-muted-foreground">
                  •••
                </p>
                <p className="text-[11px] text-[#9AAEA9] dark:text-muted-foreground">chờ chấm</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-[#C5D5D1] dark:text-muted-foreground">—</p>
                <p className="text-[11px] text-[#E85D24] dark:text-[#FF9A6C]">chưa nộp</p>
              </>
            )}
          </div>
          <ChevronRight className="size-4 text-[#C5D5D1] dark:text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

/* ─── Main ─────────────────────────────────────────────────── */

export const ParentPortalView = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { children, exercises } = useParentPortalActions({
    childId: selectedId ?? undefined,
  });
  const childList = children.data ?? [];
  const activeChild =
    childList.find((c) => c.id === (selectedId ?? childList[0]?.id)) ?? null;

  const assignments = useMemo(
    () => (exercises.data ?? []).map(toAssignment),
    [exercises.data],
  );

  const stats = useMemo(() => {
    const submitted = assignments.filter((a) => a.status !== "NOT_SUBMITTED").length;
    const graded = assignments.filter((a) => a.status === "GRADED");
    const notSubmitted = assignments.filter((a) => a.status === "NOT_SUBMITTED").length;
    const avg =
      graded.length > 0
        ? graded.reduce((sum, a) => sum + (a.score ?? 0), 0) / graded.length
        : null;
    return {
      total: assignments.length,
      submitted,
      graded: graded.length,
      notSubmitted,
      avg,
    };
  }, [assignments]);

  const missing = assignments.find((a) => a.status === "NOT_SUBMITTED") ?? null;

  if (children.isLoading) {
    return <p className="py-10 text-center text-sm text-[#9AAEA9] dark:text-muted-foreground">Đang tải…</p>;
  }

  if (childList.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#D5E2DE] dark:border-border bg-white dark:bg-card px-6 py-12 text-center text-sm text-[#5c726d] dark:text-muted-foreground">
        Tài khoản này chưa được liên kết với học sinh nào.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {childList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {childList.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-semibold transition-colors",
                activeChild?.id === c.id
                  ? "border-[#0E9F8E] bg-[#E4F6EF] dark:bg-primary-light text-[#0B7A6D] dark:text-[#5EEAD4]"
                  : "border-[#E7EEEC] dark:border-border bg-white dark:bg-card text-[#5c726d] dark:text-muted-foreground hover:border-[#0E9F8E]/40",
              )}
            >
              {`${c.lastName} ${c.firstName}`.trim()}
            </button>
          ))}
        </div>
      )}

      {activeChild && (
        <PortalBanner
          initial={(activeChild.firstName || "?").charAt(0).toUpperCase()}
          title={`${activeChild.lastName} ${activeChild.firstName}`.trim()}
          subtitle={`Mã HS: ${activeChild.userCode ?? "—"}`}
          statLabel="Điểm TB môn"
          statValue={stats.avg == null ? "—" : stats.avg.toFixed(1)}
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Đã nộp"
          value={stats.submitted}
          suffix={`/ ${stats.total} bài`}
          icon={CheckCircle2}
        />
        <StatTile
          label="Đã có điểm"
          value={stats.graded}
          suffix="bài"
          icon={Star}
          iconClass="bg-[#F1F0FE] dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#A5B4FC]"
        />
        <StatTile
          label="Chưa nộp"
          value={stats.notSubmitted}
          suffix="bài"
          icon={AlertTriangle}
          iconClass="bg-[#FFF0E6] dark:bg-[#E85D24]/15 text-[#F59E0B]"
        />
      </div>

      {missing && (
        <div className="flex items-start gap-3 rounded-xl border border-[#FF7A45]/30 bg-[#FFF0E6] dark:bg-[#E85D24]/15 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#FF7A45]" />
          <p className="text-sm leading-relaxed text-[#16302b] dark:text-foreground">
            <span className="font-semibold text-[#E85D24] dark:text-[#FF9A6C]">Nhắc nhở:</span>{" "}
            Con còn{" "}
            <span className="font-semibold">{stats.notSubmitted} bài</span>{" "}
            chưa nộp — “{missing.title}”. Bạn có thể nhắc con hoàn thành đúng hạn.
          </p>
        </div>
      )}

      <h2 className="mt-1 font-bold text-[#16302b] dark:text-foreground">Bài tập gần đây</h2>
      <div className="flex flex-col gap-3">
        {assignments.length === 0 && !exercises.isLoading && (
          <p className="py-6 text-center text-sm text-[#9AAEA9] dark:text-muted-foreground">Chưa có bài tập nào.</p>
        )}
        {assignments.map((a) => (
          <WorkRow key={a.id} a={a} />
        ))}
      </div>

      <PortalFooter />
    </div>
  );
};
