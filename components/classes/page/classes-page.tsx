"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { CreateClassModal } from "../dialog/create-class-modal";
import { EditClassDialog } from "../dialog/edit-class-dialog";
import { DeleteClassDialog } from "../dialog/delete-class-dialog";
import { ClassStudentBadges } from "../components/class-student-badges";
import { useClassesCopy } from "@/hooks/useClassesCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { Button } from "@/components/ui/button.ui";
import { Select } from "@/components/ui/select.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { cn } from "@/lib/utils";
import UsageGuides from "@/components/ui/usage-guide.ui";
import {
  useClassActions,
  CLASSES_QUERY_KEY,
} from "@/lib/services/class.service";
import type {
  ClassItem,
  ClassDisplayStatus,
  ClassStatusFilter,
  ApiClassRow,
  ApiClassSchedule,
} from "@/types";

const STATUS_STYLES: Record<
  ClassDisplayStatus,
  {
    badgeBg: string;
    badgeText: string;
    bar: string;
    rowBg?: string;
  }
> = {
  active: {
    badgeBg: "#E4F6EF",
    badgeText: "#0B7A6D",
    bar: "#0E9F8E",
  },
  paused: {
    badgeBg: "#FEE2E2",
    badgeText: "#DC2626",
    bar: "#EF4444",
    rowBg: "bg-orange-50/60",
  },
  upcoming: {
    badgeBg: "#F3F4F6",
    badgeText: "#4B5563",
    bar: "#9AAEA9",
  },
};

const ALL_SUBJECTS_VALUE = "__all_subjects__";

const SUBJECT_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  "Toán học": { bg: "#EDE9FE", text: "#6D28D9" },
  Toán: { bg: "#EDE9FE", text: "#6D28D9" },
  "Tiếng Anh": { bg: "#DBEAFE", text: "#1E40AF" },
  Anh: { bg: "#DBEAFE", text: "#1E40AF" },
  "Vật lý": { bg: "#E4F6EF", text: "#0B7A6D" },
  Lý: { bg: "#E4F6EF", text: "#0B7A6D" },
  "Hóa học": { bg: "#FFEDD5", text: "#C2410C" },
  Hóa: { bg: "#FFEDD5", text: "#C2410C" },
  "Ngữ Văn": { bg: "#FCE7F3", text: "#BE185D" },
  Văn: { bg: "#FCE7F3", text: "#BE185D" },
};
const FALLBACK_SUBJECT_COLORS = [
  { bg: "#F3F4F6", text: "#374151" },
  { bg: "#FEF3C7", text: "#92400E" },
];
function getSubjectColor(subject: string, idx: number) {
  return (
    SUBJECT_COLOR_MAP[subject] ??
    FALLBACK_SUBJECT_COLORS[idx % FALLBACK_SUBJECT_COLORS.length]
  );
}

const PER_PAGE = 5;
const feeFormat = (v: number) => v.toLocaleString("vi-VN") + "đ";

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

/**
 * Group a class's weekly schedule slots by distinct time range — days that share the
 * same start/end time are combined (e.g. "T2 & T5 · 19:30 – 21:30"), but days with a
 * different time get their own group instead of silently inheriting the first slot's
 * time (which previously mislabeled classes with different times per day).
 */
function groupWeeklySchedules(
  schedules: ApiClassSchedule[],
): { days: string; time: string }[] {
  if (!schedules.length) return [];
  const byTime = new Map<string, string[]>();
  for (const s of schedules) {
    const key = `${s.startTime ?? ""}|${s.endTime ?? ""}`;
    const days = byTime.get(key) ?? [];
    if (!days.includes(s.dayOfWeek)) days.push(s.dayOfWeek);
    byTime.set(key, days);
  }
  return Array.from(byTime.entries())
    .map(([key, days]) => {
      const sortedDays = days.sort(
        (a, b) => DOW_ORDER.indexOf(a) - DOW_ORDER.indexOf(b),
      );
      const [startTime, endTime] = key.split("|");
      return {
        days: sortedDays.map((d) => DOW_ABBR[d] ?? d).join(" & "),
        time:
          startTime && endTime ? `${startTime} – ${endTime}` : startTime || "",
        sortKey: DOW_ORDER.indexOf(sortedDays[0]),
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ days, time }) => ({ days, time }));
}

/* ─── Component ─── */

const STATUS_TO_API: Record<string, string> = {
  active: "OPEN",
  paused: "CLOSED",
  upcoming: "UPCOMING",
};

const API_TO_STATUS: Record<string, ClassDisplayStatus> = {
  OPEN: "active",
  CLOSED: "paused",
  UPCOMING: "upcoming",
};

/** Map a backend class row into the table's `ClassItem`. */
function mapApiToClassItem(c: ApiClassRow): ClassItem {
  const sessions = c.sessions ?? [];
  const students = c.students ?? [];
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    subject: c.subject,
    feePerSession: Number(c.tuition ?? 0) || 0,
    description: c.description ?? "",
    studentCount: students.length,
    students,
    sessionCount: sessions.length,
    nextSession: c.nextSession,
    scheduleGroups: groupWeeklySchedules(c.schedules ?? []),
    status: (c.status && API_TO_STATUS[c.status]) || "active",
    curriculumId: c.curriculumId ?? "",
    curriculumTitle: "",
    format: c.format ?? "",
    location: c.location ?? "",
    startTime: c.startTime ?? "",
    endTime: c.endTime ?? "",
  };
}

export const ClassesPage = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<{
    id: string;
    name: string;
    subject: string;
    feePerSession: number;
    description: string;
    status: string;
    curriculumId: string;
    curriculumTitle: string;
    format: string;
    location: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [deletingClass, setDeletingClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [subjectFilter, setSubjectFilter] = useState(ALL_SUBJECTS_VALUE);
  const [statusFilter, setStatusFilter] = useState<ClassStatusFilter>("all");
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const copy = useClassesCopy();
  const { actions } = useCommonCopy();
  const isTutor = useCurrentUserRole() === "TUTOR";

  /* ── fetch classes ── */
  const {
    data: apiPayload,
    isPending,
    isError,
  } = useClassActions({ list: {} }).list;

  const classes = useMemo<ClassItem[]>(
    () => (apiPayload?.classes ?? []).map(mapApiToClassItem),
    [apiPayload],
  );

  const invalidateClasses = () =>
    queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });

  const ALL_SUBJECTS = useMemo(
    () => [
      { value: ALL_SUBJECTS_VALUE, label: copy.list.filters.allSubjects },
      ...Array.from(new Set(classes.map((c) => c.subject))).map((s) => ({
        value: s,
        label: s,
      })),
    ],
    [classes, copy.list.filters.allSubjects],
  );

  const STATUS_FILTER_OPTIONS: { value: ClassStatusFilter; label: string }[] = [
    { value: "all", label: copy.list.filters.allStatuses },
    { value: "active", label: copy.list.status.active },
    { value: "paused", label: copy.list.status.paused },
    { value: "upcoming", label: copy.list.status.upcoming },
  ];

  const filtered = useMemo(() => {
    let list = classes;
    if (statusFilter !== "all")
      list = list.filter((c) => c.status === statusFilter);
    if (subjectFilter !== ALL_SUBJECTS_VALUE)
      list = list.filter((c) => c.subject === subjectFilter);
    return list;
  }, [classes, statusFilter, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const stats = useMemo(
    () => ({
      active: classes.filter((c) => c.status === "active").length,
      totalStudents: classes.reduce((sum, c) => sum + c.studentCount, 0),
      sessionsThisWeek: classes.reduce((sum, c) => sum + c.sessionCount, 0),
      pendingFee:
        classes
          .filter((c) => c.status === "active")
          .reduce((sum, c) => sum + c.feePerSession * c.studentCount, 0) /
        1_000_000,
    }),
    [classes],
  );

  const classColumns: DataTableColumn<ClassItem>[] = useMemo(
    () => [
      {
        key: "stt",
        header: copy.list.table.columns.stt,
        headerClassName: "w-14 pl-5 px-4",
        cellClassName: "relative py-3.5 pl-5 pr-2 font-medium text-[#9AAEA9]",
        render: (cls: ClassItem, idx: number) => (
          <>
            <span
              className="absolute inset-y-2 left-0 w-1 rounded-r-full"
              style={{ background: STATUS_STYLES[cls.status].bar }}
            />
            {String((safePage - 1) * PER_PAGE + idx + 1).padStart(2, "0")}
          </>
        ),
      },
      {
        key: "name",
        header: copy.list.table.columns.className,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5",
        render: (cls: ClassItem) => (
          <>
            <Link
              href={`/classes/${cls.id}`}
              className="font-semibold leading-5 text-[#16302b] transition-colors hover:text-[#0E9F8E]"
            >
              {cls.name}
            </Link>
            <p className="mt-0.5 text-xs text-[#9AAEA9]">
              {copy.list.table.classCodePrefix} {cls.code}
            </p>
          </>
        ),
      },
      {
        key: "subject",
        header: copy.list.table.columns.subject,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5",
        render: (cls: ClassItem, idx: number) => {
          const subjectColor = getSubjectColor(cls.subject, idx);
          return (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                background: subjectColor.bg,
                color: subjectColor.text,
              }}
            >
              {cls.subject}
            </span>
          );
        },
      },
      {
        key: "fee",
        header: copy.list.table.columns.fee,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5 tabular-nums",
        render: (cls: ClassItem) => (
          <>
            <span className="font-semibold text-[#16302b]">
              {feeFormat(cls.feePerSession)}
            </span>
            <span className="text-[#9AAEA9]">
              {copy.list.table.perSessionSuffix}
            </span>
          </>
        ),
      },
      {
        key: "students",
        header: copy.list.table.columns.students,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5",
        render: (cls: ClassItem) => (
          <ClassStudentBadges students={cls.students} />
        ),
      },
      {
        key: "schedule",
        header: copy.list.table.columns.schedule,
        headerClassName: "px-4",
        cellClassName: "px-4 py-3.5",
        render: (cls: ClassItem) => {
          if (cls.scheduleGroups.length > 0) {
            return (
              <div className="flex flex-col gap-1">
                {cls.scheduleGroups.map((g, i) => (
                  <span
                    key={i}
                    className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[#F3F7F5] py-1 pl-1.5 pr-2.5 text-xs"
                  >
                    <Clock className="size-3 shrink-0 text-[#0E9F8E]" />
                    <span className="font-semibold text-[#16302b]">
                      {g.days}
                    </span>
                    {g.time && (
                      <span className="text-[#9AAEA9]">· {g.time}</span>
                    )}
                  </span>
                ))}
              </div>
            );
          }
          if (cls.nextSession) {
            return (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[#F3F7F5] py-1 pl-1.5 pr-2.5 text-xs">
                <Clock className="size-3 shrink-0 text-[#0E9F8E]" />
                <span className="font-semibold text-[#16302b]">
                  {fmtSessionDate(cls.nextSession.startAt)}
                </span>
                <span className="text-[#9AAEA9]">
                  {fmtSessionRange(
                    cls.nextSession.startAt,
                    cls.nextSession.endAt,
                  )}
                </span>
              </span>
            );
          }
          return (
            <span className="text-sm text-[#9AAEA9]">
              {copy.list.table.noSchedule}
            </span>
          );
        },
      },
      ...(isTutor
        ? [
            {
              key: "actions",
              align: "center" as const,
              header: copy.list.table.columns.actions,
              headerClassName: "px-4",
              cellClassName: "px-4 py-3.5",
              render: (cls: ClassItem) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title={actions.edit}
                    onClick={() =>
                      setEditingClass({
                        id: cls.id,
                        name: cls.name,
                        subject: cls.subject,
                        feePerSession: cls.feePerSession,
                        description: cls.description,
                        status: STATUS_TO_API[cls.status] || "OPEN",
                        curriculumId: cls.curriculumId,
                        curriculumTitle: cls.curriculumTitle,
                        format: cls.format,
                        location: cls.location,
                        startTime: cls.startTime,
                        endTime: cls.endTime,
                      })
                    }
                    className="text-[#8AA09B] hover:bg-[#E4F6EF] hover:text-[#0E9F8E]"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title={actions.delete}
                    onClick={() =>
                      setDeletingClass({ id: cls.id, name: cls.name })
                    }
                    className="text-[#8AA09B] hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [safePage, copy, actions, isTutor],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#16302b]">
            {copy.list.pageTitle}
          </h1>
          <span className="rounded-full bg-[#E4F6EF] px-3 py-0.5 text-sm font-semibold text-[#0E9F8E]">
            {copy.list.classCount(classes.length)}
          </span>
        </div>
        {isTutor && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="lg"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="size-4" />
              {copy.list.addClass}
            </Button>
          </div>
        )}
      </div>

      {/* ── Main Table Card ── */}
      <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7EEEC] px-5 py-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Subject select */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                {copy.list.filters.subjectLabel}
              </span>
              <Select
                value={subjectFilter}
                onValueChange={(value) => {
                  setSubjectFilter(value);
                  setPage(1);
                }}
                options={ALL_SUBJECTS}
                className="h-9! w-44!"
              />
            </div>

            {/* Status select */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                {copy.list.filters.statusLabel}
              </span>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as ClassStatusFilter);
                  setPage(1);
                }}
                options={STATUS_FILTER_OPTIONS}
                className="h-9! w-44!"
              />
            </div>
          </div>

          <span className="text-sm text-[#9AAEA9]">
            {copy.list.showing.prefix}{" "}
            <strong className="font-semibold text-[#16302b]">
              {filtered.length}
            </strong>{" "}
            {copy.list.showing.suffix}
          </span>
        </div>

        {/* Table */}
        <DataTable
          data={paged}
          columns={classColumns}
          rowKey={(cls) => cls.id}
          isLoading={isPending}
          isError={isError}
          errorMessage={copy.list.table.loadError}
          emptyMessage={copy.list.table.empty}
          className="min-w-215"
          headerRowClassName="border-[#E7EEEC] bg-[#F3F7F5] hover:bg-[#F3F7F5]"
          rowClassName={(cls) =>
            cn(
              "border-[#EEF3F1] hover:bg-[#F1FBF9]",
              STATUS_STYLES[cls.status].rowBg,
            )
          }
        />

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF3F1] px-5 py-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-[#9AAEA9]">
            {(Object.keys(STATUS_STYLES) as ClassDisplayStatus[]).map((key) => (
              <span key={key} className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: STATUS_STYLES[key].bar }}
                />
                {copy.list.status[key]}
              </span>
            ))}
            <span className="text-[#9AAEA9]">
              {filtered.length === 0 ? "0" : (safePage - 1) * PER_PAGE + 1}–
              {Math.min(safePage * PER_PAGE, filtered.length)} /{" "}
              {filtered.length}
            </span>
          </div>

          {/* Pagination */}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <CreateClassModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          invalidateClasses();
        }}
      />

      <EditClassDialog
        classItem={editingClass}
        onClose={() => {
          setEditingClass(null);
          invalidateClasses();
        }}
      />

      <DeleteClassDialog
        classItem={deletingClass}
        onClose={() => {
          setDeletingClass(null);
          invalidateClasses();
        }}
      />

      <UsageGuides
        title={copy.usageGuide.title}
        steps={[
          {
            n: 1,
            title: copy.usageGuide.steps.addClass.title,
            body: copy.usageGuide.steps.addClass.body,
          },
          {
            n: 2,
            title: copy.usageGuide.steps.filter.title,
            body: copy.usageGuide.steps.filter.body,
          },
          {
            n: 3,
            title: copy.usageGuide.steps.viewDetail.title,
            body: copy.usageGuide.steps.viewDetail.body,
          },
          {
            n: 4,
            title: copy.usageGuide.steps.editDelete.title,
            body: copy.usageGuide.steps.editDelete.body,
          },
        ]}
        warning={copy.usageGuide.warning}
      />
    </div>
  );
};
