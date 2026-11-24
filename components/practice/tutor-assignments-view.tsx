"use client";

/**
 * Tutor view — "Bài tập đã giao".
 * Per-class assignment tracker: submission progress + grading state,
 * grouped by session. Static mock data (see practice-shared).
 */

import { useMemo } from "react";
import {
  ChevronRight,
  ClipboardCheck,
  FileText,
  Hourglass,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  MOCK_CLASS,
  MOCK_TUTOR_ASSIGNMENTS,
  PortalFooter,
  StatTile,
  type TutorAssignment,
} from "./practice-shared";

const TutorCard = ({ a }: { a: TutorAssignment }) => {
  const pct = Math.round((a.submitted / a.total) * 100);
  const done = a.state === "done";

  return (
    <div className="rounded-xl border border-[#E7EEEC] dark:border-border bg-white dark:bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F0FE] dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#A5B4FC]">
          <ClipboardCheck className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#16302b] dark:text-foreground">{a.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#9AAEA9] dark:text-muted-foreground">
            <span>Hạn: {a.dueLabel}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold",
                a.dueBadge.tone === "soon"
                  ? "bg-[#FFF0E6] dark:bg-[#E85D24]/15 text-[#E85D24] dark:text-[#FF9A6C]"
                  : "bg-[#F3F7F5] dark:bg-muted text-[#9AAEA9] dark:text-muted-foreground",
              )}
            >
              {a.dueBadge.text}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#5c726d] dark:text-muted-foreground">Đã nộp</span>
          <span className="font-bold text-[#16302b] dark:text-foreground">
            {a.submitted}/{a.total}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF3F1] dark:bg-muted">
          <div
            className="h-full rounded-full bg-[#0E9F8E] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-[#EEF3F1] dark:border-border-light pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5c726d] dark:text-muted-foreground">
          <span
            className={cn(
              "size-1.5 rounded-full",
              done ? "bg-[#0E9F8E]" : "bg-[#F59E0B]",
            )}
          />
          {done ? "Đã chấm xong" : "Đang thu bài"}
        </span>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-semibold text-[#0E9F8E] dark:text-[#2DD4BF] transition-colors hover:text-[#0B7A6D] hover:dark:text-[#5EEAD4]"
        >
          {done ? "Xem lại" : "Xem & chấm"}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

export const TutorAssignmentsView = () => {
  const groups = useMemo(() => {
    const map = new Map<number, TutorAssignment[]>();
    for (const a of MOCK_TUTOR_ASSIGNMENTS) {
      const list = map.get(a.sessionNumber) ?? [];
      list.push(a);
      map.set(a.sessionNumber, list);
    }
    return [...map.entries()].sort((x, y) => y[0] - x[0]);
  }, []);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#16302b] dark:text-foreground">Bài tập đã giao</h1>
        <p className="mt-1 text-sm text-[#9AAEA9] dark:text-muted-foreground">
          {MOCK_CLASS.name} · {MOCK_CLASS.studentCount} học sinh · Theo dõi tiến
          độ nộp và chấm bài sau mỗi buổi học.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Bài đã giao" value={8} icon={FileText} />
        <StatTile
          label="Chờ chấm"
          value={3}
          icon={Hourglass}
          iconClass="bg-[#FFF0E6] dark:bg-[#E85D24]/15 text-[#F59E0B]"
        />
        <StatTile
          label="Đã chấm"
          value={3}
          icon={ClipboardCheck}
          iconClass="bg-[#E4F6EF] dark:bg-primary-light text-[#0E9F8E] dark:text-[#2DD4BF]"
        />
        <StatTile
          label="Điểm TB lớp"
          value={MOCK_CLASS.avgScore.toFixed(1)}
          icon={Star}
          iconClass="bg-[#F1F0FE] dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#A5B4FC]"
        />
      </div>

      {/* Grouped assignments */}
      {groups.map(([sessionNumber, list]) => (
        <div key={sessionNumber} className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md bg-[#E4F6EF] dark:bg-primary-light px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#0B7A6D] dark:text-[#5EEAD4]">
              Buổi {sessionNumber}
            </span>
            <span className="text-xs text-[#9AAEA9] dark:text-muted-foreground">
              {list[0].sessionDate}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((a) => (
              <TutorCard key={a.id} a={a} />
            ))}
          </div>
        </div>
      ))}

      <PortalFooter />
    </div>
  );
};
