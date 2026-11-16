"use client";

import { currentPersonName } from "@/lib/format/person-name";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";
import { useSessionActions } from "@/lib/services/session.service";
import { useGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { CreateSessionDialog } from "../dialog/create-session-dialog";
import { ClassDetailWatchPage } from "./class-detail-watch-page";
import {
  SessionTable,
  sessionStatusCopyKey,
} from "../components/session-table";
import { ClassStatusMenu } from "../components/class-status-menu";
import { EnrollStudentsDialog } from "../dialog/enroll-students-dialog";
import { AddStudentDialog } from "@/components/students/add-student-dialog";
import { UserPlus } from "lucide-react";
import type { CurriculumDetail } from "@/types";
import { useClassActions } from "@/lib/services/class.service";
import { useClassesCopy } from "@/hooks/useClassesCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import type { ClassesDictionary } from "@/lib/i18n/classes.dictionary";
import Image from "next/image";
import type {
  ClassDetailDto,
  ClassStatus,
  ClassStudentDto,
  DisplayStatus,
  LessonDto,
  SessionDto,
  SessionStatus,
} from "@/types";

const UPCOMING_STATUSES: SessionStatus[] = [
  "SCHEDULED",
  "ONGOING",
  "POSTPONED",
];

const ALL_SESSION_STATUSES: SessionStatus[] = [
  "SCHEDULED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
  "POSTPONED",
];

const statusMap: Record<ClassStatus, DisplayStatus> = {
  OPEN: "active",
  UPCOMING: "upcoming",
  CLOSED: "completed",
};

const classStatusConfig: Record<DisplayStatus, { className: string }> = {
  active: {
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  upcoming: {
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  completed: {
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
};

const classStatusCopyKey: Record<
  DisplayStatus,
  keyof ClassesDictionary["detail"]["classStatus"]
> = {
  active: "active",
  upcoming: "upcoming",
  completed: "completed",
};

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

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

type ClassDetailPageProps = {
  classId: string;
};

/** Tutor's management view — students/parents get `ClassDetailWatchPage` instead. */
const TutorClassDetailPage = ({ classId }: ClassDetailPageProps) => {
  const queryClient = useQueryClient();
  const { detail } = useClassesCopy();
  const { actions } = useCommonCopy();
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedUpcoming, setSelectedUpcoming] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPast, setSelectedPast] = useState<Set<string>>(new Set());
  const [sessionBusy, setSessionBusy] = useState(false);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);

  const { mutate: updateSessionStatus } = useSessionActions().update;
  const { mutate: updateClass, isPending: classStatusUpdating } =
    useClassActions().update;

  const {
    data: classRaw,
    isLoading,
    error,
  } = useGet(["class-detail", classId], `/classes/${classId}`, {
    enabled: !!classId,
  });

  const {
    data: studentsRaw,
    isLoading: studentsLoading,
    refetch: refetchStudents,
  } = useGet(
    ["class-students", classId],
    `/classes/${classId}/students`,
    { enabled: !!classId },
  );

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);


  const cls = useMemo(() => {
    if (!classRaw) return null;
    const d = unwrapApiData<ClassDetailDto>(classRaw);
    return {
      id: d.id,
      name: d.name,
      code: d.code,
      subject: d.subject,
      status: statusMap[d.status] ?? "active",
      rawStatus: d.status,
      description: d.description ?? "",
      totalSessions: d.sessionCount,
      totalStudents: d.studentCount,
      curriculumId: d.curriculumId,
    };
  }, [classRaw]);

  // Chương của từng bài giảng trong chương trình đang gắn với lớp (để hiển thị dưới mỗi buổi).
  const { data: curriculumRaw } = useGet<unknown>(
    ["class-curriculum", cls?.curriculumId],
    `/curriculum/${cls?.curriculumId ?? ""}`,
    { enabled: !!cls?.curriculumId },
  );

  const { data: lessonsRaw, error: lessonsError } = useGet(
    ["class-lessons", cls?.curriculumId],
    "/curriculum/lessons",
    {
      params: { curriculumId: cls?.curriculumId, limit: 100 },
      enabled: !!cls?.curriculumId,
    },
  );

  /* Lesson lookup can fail if the class's linked curriculum was removed/became
   * inaccessible on the backend — surface it instead of silently showing an
   * empty lesson list, since that otherwise looks identical to "no lessons yet". */
  useEffect(() => {
    if (lessonsError) {
      toast.error(
        getErrorMessage(
          lessonsError,
          "Không thể tải chương trình bài giảng của lớp — liên kết chương trình có thể đã bị lỗi",
        ),
      );
    }
  }, [lessonsError]);

  const { data: sessionsRaw, isLoading: sessionsLoading } = useGet(
    ["class-sessions", classId],
    "/sessions",
    { params: { classId, limit: 100 }, enabled: !!classId },
  );

  const students = useMemo(() => {
    if (!studentsRaw) return [];
    return unwrapApiData<ClassStudentDto[]>(studentsRaw) ?? [];
  }, [studentsRaw]);

  const lessons = useMemo(() => {
    if (!lessonsRaw) return [];
    const d = unwrapApiData<
      { lessons: LessonDto[] } | { data: LessonDto[] } | LessonDto[]
    >(lessonsRaw);
    if (!d) return [];
    const list = Array.isArray(d)
      ? d
      : "lessons" in d
        ? (d.lessons ?? [])
        : (d.data ?? []);
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [lessonsRaw]);

  const sessions = useMemo(() => {
    if (!sessionsRaw) return [];
    const d = unwrapApiData<
      { sessions: SessionDto[] } | { data: SessionDto[] } | SessionDto[]
    >(sessionsRaw);
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if ("sessions" in d) return d.sessions ?? [];
    return d.data ?? [];
  }, [sessionsRaw]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = currentPersonName(s.firstName, s.lastName).toLowerCase();
      const parentName = s.parent
        ? currentPersonName(s.parent.firstName, s.parent.lastName).toLowerCase()
        : "";
      return (
        name.includes(q) ||
        (s.userCode ?? "").toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q) ||
        parentName.includes(q) ||
        (s.parent?.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [students, studentSearch]);

  const lessonChapterById = useMemo(() => {
    const map: Record<string, string> = {};
    const framework = curriculumRaw
      ? unwrapApiData<CurriculumDetail>(curriculumRaw)
      : null;
    for (const chapter of framework?.chapters ?? []) {
      for (const lesson of chapter.lessons ?? []) map[lesson.id] = chapter.title;
    }
    return map;
  }, [curriculumRaw]);

  const studentColumns: DataTableColumn<ClassStudentDto>[] = useMemo(
    () => [
      {
        key: "stt",
        header: detail.students.columns.stt,
        headerClassName:
          "w-16 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        cellClassName: "px-5 text-muted-foreground",
        render: (student, idx) => String(idx + 1).padStart(2, "0"),
      },
      {
        key: "student",
        header: detail.students.columns.student,
        headerClassName:
          "px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        cellClassName: "px-3",
        render: (student: ClassStudentDto, idx: number) => {
          const name = currentPersonName(student.firstName, student.lastName);
          const initials = getInitials(name);
          const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          return (
            <div className="flex items-center gap-3">
              {student.avatar ? (
                <Image
                  width={40}
                  height={40}
                  src={student.avatar}
                  alt=""
                  className="size-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    colorClass,
                  )}
                >
                  {initials}
                </div>
              )}
              <span className="font-medium">{name}</span>
            </div>
          );
        },
      },
      {
        key: "code",
        header: detail.students.columns.studentCode,
        headerClassName:
          "px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        cellClassName: "px-3 text-muted-foreground",
        render: (student) => student.userCode || "—",
      },
      {
        key: "phone",
        header: detail.students.columns.studentPhone,
        headerClassName:
          "px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        cellClassName: "px-3 text-muted-foreground",
        render: (student) => student.phone || "—",
      },
      {
        key: "parent",
        header: detail.students.columns.parent,
        headerClassName:
          "px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        cellClassName: "px-3 text-muted-foreground",
        render: (student) =>
          student.parent
            ? currentPersonName(student.parent.firstName, student.parent.lastName)
            : "—",
      },
      {
        key: "parentPhone",
        header: detail.students.columns.parentPhone,
        headerClassName:
          "px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        cellClassName: "px-3 text-muted-foreground",
        render: (student) => student.parent?.phone || "—",
      },
      {
        key: "add",
        header: "",
        headerClassName: "w-12 px-3",
        cellClassName: "px-3 text-center",
        render: () => (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={actions.add}
          >
            <Plus className="size-3.5" />
          </Button>
        ),
      },
    ],
    [detail, actions],
  );

  const statusSelectOptions = useMemo(
    () =>
      ALL_SESSION_STATUSES.map((s) => ({
        value: s,
        label: detail.sessionStatus[sessionStatusCopyKey[s]],
      })),
    [detail],
  );

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => UPCOMING_STATUSES.includes(s.status))
        .sort(
          (a, b) =>
            new Date(a.startAt ?? 0).getTime() -
            new Date(b.startAt ?? 0).getTime(),
        ),
    [sessions],
  );

  const pastSessions = useMemo(
    () =>
      sessions
        .filter((s) => !UPCOMING_STATUSES.includes(s.status))
        .sort(
          (a, b) =>
            new Date(b.startAt ?? 0).getTime() -
            new Date(a.startAt ?? 0).getTime(),
        ),
    [sessions],
  );

  const refetchSessions = () =>
    queryClient.invalidateQueries({ queryKey: ["class-sessions", classId] });

  const classStatusLabel = useMemo(
    () =>
      (Object.keys(statusMap) as ClassStatus[]).reduce(
        (acc, s) => {
          acc[s] = detail.classStatus[classStatusCopyKey[statusMap[s]]];
          return acc;
        },
        {} as Record<ClassStatus, string>,
      ),
    [detail],
  );

  const handleChangeClassStatus = (status: ClassStatus) => {
    updateClass(
      { id: classId, status },
      {
        onSuccess: () => {
          toast.success(detail.changeClassStatus.success);
          queryClient.invalidateQueries({
            queryKey: ["class-detail", classId],
          });
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, detail.changeClassStatus.error)),
      },
    );
  };

  const toggleIn = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const changeStatusSelected = async (
    ids: string[],
    status: SessionStatus | "",
    clear: () => void,
  ) => {
    if (!ids.length) {
      toast.error(detail.sessions.noSelection);
      return;
    }
    if (!status) return;
    setSessionBusy(true);
    try {
      await Promise.all(
        ids.map(
          (id) =>
            new Promise<void>((resolve, reject) => {
              updateSessionStatus(
                { id, status },
                { onSuccess: () => resolve(), onError: reject },
              );
            }),
        ),
      );
      toast.success(detail.sessions.changeStatusSuccess);
      clear();
      refetchSessions();
    } catch (err) {
      toast.error(getErrorMessage(err, detail.sessions.changeStatusError));
    } finally {
      setSessionBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <XCircle className="size-10 text-red-500" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {getErrorMessage(error) || detail.loadError}
        </p>
        <Link
          href="/classes"
          className="mt-4 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          {detail.backToList}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/classes"
          className="transition-colors hover:text-foreground"
        >
          {detail.breadcrumb}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{cls.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold">{cls.name}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                classStatusConfig[cls.status].className,
              )}
            >
              {detail.classStatus[classStatusCopyKey[cls.status]]}
            </span>
            {cls.rawStatus !== "CLOSED" && (
              <ClassStatusMenu
                status={cls.rawStatus}
                statusLabel={classStatusLabel}
                onChangeStatus={handleChangeClassStatus}
                disabled={classStatusUpdating}
                ariaLabel={detail.changeClassStatus.ariaLabel}
              />
            )}
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {cls.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="default"
            size="md"
            onClick={() => setCreateSessionOpen(true)}
          >
            <Plus className="size-3.5" />
            {detail.newSession}
          </Button>
        </div>
      </div>

      {/* Student list */}
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold">
            <ChevronDown className="size-4 text-muted-foreground" />
            {detail.students.heading}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={detail.students.searchPlaceholder}
                className="h-9 w-full pl-8 text-sm sm:w-52"
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              className="px-5 w-max"
              onClick={() => setCreateStudentOpen(true)}
            >
              <Plus className="size-3.5" />
              Tạo học sinh mới
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-5 w-max"
              onClick={() => setEnrollOpen(true)}
            >
              <UserPlus className="size-3.5" />
              Thêm học sinh
            </Button>
            <Button variant="outline" size="lg" className="px-5 w-max">
              <Download className="size-3.5" />
              {detail.students.export}
            </Button>
          </div>
        </div>

        <DataTable
          data={filteredStudents}
          columns={studentColumns}
          rowKey={(student) => student.id}
          isLoading={studentsLoading}
          emptyMessage={
            students.length === 0
              ? detail.students.empty
              : detail.students.noMatch
          }
          rowClassName="h-16"
          className="min-w-180"
        />
        {!studentsLoading && students.length > 0 && (
          <div className="border-t px-5 py-4">
            <Button
              asChild
              variant="link"
              className="h-auto w-auto px-0 text-sm font-medium"
            >
              <Link href={`/classes/${cls.id}/students`}>
                {detail.students.viewAll(students.length)}
              </Link>
            </Button>
          </div>
        )}
      </div>

      <SessionTable
        title={detail.sessions.upcomingTitle}
        sessions={upcomingSessions}
        lessonChapterById={lessonChapterById}
        classId={cls.id}
        selectedIds={selectedUpcoming}
        onToggle={(id) => toggleIn(setSelectedUpcoming, id)}
        onToggleAll={(checked) =>
          setSelectedUpcoming(
            checked ? new Set(upcomingSessions.map((s) => s.id)) : new Set(),
          )
        }
        loading={sessionsLoading}
        emptyText={detail.sessions.upcomingEmpty}
        statusOptions={statusSelectOptions}
        onChangeStatus={(id, status) =>
          changeStatusSelected([id], status, () => {})
        }
        statusChangeDisabled={sessionBusy}
      />

      {/* Past sessions */}
      <SessionTable
        title={detail.sessions.pastTitle}
        sessions={pastSessions}
        lessonChapterById={lessonChapterById}
        classId={cls.id}
        selectedIds={selectedPast}
        onToggle={(id) => toggleIn(setSelectedPast, id)}
        onToggleAll={(checked) =>
          setSelectedPast(
            checked ? new Set(pastSessions.map((s) => s.id)) : new Set(),
          )
        }
        loading={sessionsLoading}
        emptyText={detail.sessions.pastEmpty}
      />

      <AddStudentDialog

        open={createStudentOpen}

        onClose={() => setCreateStudentOpen(false)}

        onAdd={() => void queryClient.invalidateQueries({ queryKey: ["students"] })}

      />

      <EnrollStudentsDialog

        open={enrollOpen}

        classId={classId}

        enrolledIds={students.map((s) => s.id)}

        onClose={() => setEnrollOpen(false)}

        onEnrolled={() => void refetchStudents()}

      />

      <CreateSessionDialog
        open={createSessionOpen}
        onClose={() => setCreateSessionOpen(false)}
        classId={cls.id}
        lessons={lessons.map((l) => ({ id: l.id, title: l.title }))}
        nextSessionNumber={sessions.length + 1}
      />
    </div>
  );
};

/** Role dispatcher — tutors manage the class here; students/parents get the read-only watch view. */
export const ClassDetailPage = ({ classId }: ClassDetailPageProps) => {
  const isTutor = useCurrentUserRole() === "TUTOR";
  if (!isTutor) return <ClassDetailWatchPage classId={classId} />;
  return <TutorClassDetailPage classId={classId} />;
};
