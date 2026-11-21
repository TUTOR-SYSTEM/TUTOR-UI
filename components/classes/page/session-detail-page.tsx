"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  GraduationCap,
  Import,
  Loader2,
  Plus,
  Save,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Checkbox } from "@/components/ui/checkbox.ui";
import { Select } from "@/components/ui/select.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { cn } from "@/lib/utils";
import { useGet } from "@/lib/axios/query";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { apiUploadFile } from "@/lib/services/student.service";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { SessionMaterialFileRow } from "../components/session-material-file-row";
import { useAttendanceActions } from "@/lib/services/attendance.service";
import { useSessionActions } from "@/lib/services/session.service";
import type {
  ApiResponse,
  AttendanceRecord,
  CurriculumDetail,
  CurriculumLesson,
} from "@/types";

/* ─── Types ─── */
type SessionStatus =
  | "SCHEDULED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "POSTPONED";

type SessionFile = { name: string; url: string; key: string };

type SessionDetailDto = {
  id: string;
  classId: string;
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
  note: string | null;
  class: {
    id: string;
    name: string;
    code: string;
    subject: string;
    curriculumId: string | null;
  };
  lesson: { id: string; title: string; chapterTitle: string | null } | null;
};

/** A single importable material (a theory or exercise file from the curriculum). */
type MaterialItem = {
  key: string;
  type: "theory" | "exercise";
  file: SessionFile;
  lessonTitle: string;
};

/** Status badge — tutor also has a "Xác nhận kết thúc buổi học" button to move to COMPLETED. */
const STATUS_BADGE: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: "Sắp diễn ra",
    className:
      "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  },
  ONGOING: { label: "Đang diễn ra", className: "bg-primary/10 text-primary" },
  COMPLETED: { label: "Kết thúc", className: "bg-muted text-muted-foreground" },
  CANCELLED: {
    label: "Đã hủy",
    className:
      "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  },
  POSTPONED: {
    label: "Tạm hoãn",
    className:
      "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
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

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};
const fmtTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

type SessionDetailPageProps = {
  classId: string;
  sessionId: string;
};

export const SessionDetailPage = ({
  classId,
  sessionId,
}: SessionDetailPageProps) => {
  const queryClient = useQueryClient();
  // students & parents only watch this page — editing/importing/attendance stays tutor-only
  const isTutor = useCurrentUserRole() === "TUTOR";

  const {
    data: sessionRaw,
    isLoading,
    error,
  } = useGet(["session-detail", sessionId], `/sessions/${sessionId}`, {
    enabled: !!sessionId,
  });

  const session = useMemo(
    () => (sessionRaw ? unwrapApiData<SessionDetailDto>(sessionRaw) : null),
    [sessionRaw],
  );

  const { list: attendanceQuery, upsert: upsertAttendance } =
    useAttendanceActions({ sessionId });
  const { mutate: updateSessionStatus, isPending: endingSession } =
    useSessionActions().update;
  const attendanceRecords = useMemo(
    () => attendanceQuery.data ?? [],
    [attendanceQuery.data],
  );

  const curriculumId = session?.class.curriculumId ?? undefined;

  const { data: curriculum } = useGet<
    ApiResponse<CurriculumDetail>,
    CurriculumDetail
  >(["session-curriculum", curriculumId], `/curriculum/${curriculumId}`, {
    enabled: !!curriculumId,
    select: (raw) => unwrapApiData<CurriculumDetail>(raw),
  });

  const chapters = useMemo(() => curriculum?.chapters ?? [], [curriculum]);

  /* Lessons are nested inside each chapter — no separate fetch needed. */
  const lessons = useMemo<CurriculumLesson[]>(
    () => chapters.flatMap((c) => c.lessons ?? []),
    [chapters],
  );

  /* editable form */
  const [form, setForm] = useState({
    title: "",
    description: "",
    note: "",
    lessonId: "" as string,
  });
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [formSessionKey, setFormSessionKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [importCode, setImportCode] = useState("");
  const [importing, setImporting] = useState(false);
  const [showList, setShowList] = useState(false);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  /* tutor uploads: which list is uploading right now + the hidden file inputs behind "Thêm ô nhập tệp" */
  const [uploadingType, setUploadingType] = useState<"theory" | "exercise" | null>(null);
  const theoryFileInputRef = useRef<HTMLInputElement>(null);
  const exerciseFileInputRef = useRef<HTMLInputElement>(null);

  /* attendance edit buffers — seeded from persisted records, saved via handleConfirmAttendance */
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [committed, setCommitted] = useState<Record<string, boolean>>({});
  const [attendanceSeedKey, setAttendanceSeedKey] = useState<string | null>(
    null,
  );
  const [savingAttendanceId, setSavingAttendanceId] = useState<string | null>(
    null,
  );
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

  const chapterOptions = useMemo(
    () => chapters.map((c) => ({ value: c.id, label: c.title })),
    [chapters],
  );
  const lessonOptions = useMemo(
    () =>
      lessons
        .filter((l) => !selectedChapterId || l.chapterId === selectedChapterId)
        .map((l) => ({ value: l.id, label: l.title })),
    [lessons, selectedChapterId],
  );

  /* Flatten all theory/exercise files across the curriculum for search. */
  const allMaterials = useMemo<MaterialItem[]>(() => {
    const items: MaterialItem[] = [];
    for (const l of lessons) {
      for (const f of l.theoryUrls ?? []) {
        items.push({
          key: f.key,
          type: "theory",
          file: f,
          lessonTitle: l.title,
        });
      }
      for (const f of l.exerciseUrls ?? []) {
        items.push({
          key: f.key,
          type: "exercise",
          file: f,
          lessonTitle: l.title,
        });
      }
    }
    return items;
  }, [lessons]);

  const materialMatches = useMemo<MaterialItem[]>(() => {
    const q = importCode.trim().toLowerCase();
    if (!q) return [];
    return allMaterials
      .filter(
        (m) =>
          m.file.name.toLowerCase().includes(q) ||
          m.key.toLowerCase().includes(q) ||
          m.lessonTitle.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [allMaterials, importCode]);

  /* Seed the editable form when a new session loads (React render-phase reset). */
  if (session && formSessionKey !== session.id) {
    setFormSessionKey(session.id);
    setForm({
      title: session.title ?? "",
      description: session.description ?? "",
      note: session.note ?? "",
      lessonId: session.lessonId ?? "",
    });
    setSelectedChapterId("");
  }

  /* Derive the chapter from the current lesson once lessons have loaded. */
  if (form.lessonId && !selectedChapterId && lessons.length > 0) {
    const matched = lessons.find((l) => l.id === form.lessonId);
    if (matched?.chapterId) setSelectedChapterId(matched.chapterId);
  }

  /* Seed the attendance edit buffers once the roster + records for this session load. */
  if (attendanceQuery.data && attendanceSeedKey !== sessionId) {
    setAttendanceSeedKey(sessionId);
    const nextPresent: Record<string, boolean> = {};
    const nextNotes: Record<string, string> = {};
    const nextCommitted: Record<string, boolean> = {};
    for (const record of attendanceQuery.data) {
      nextPresent[record.studentId] = record.present;
      nextNotes[record.studentId] = record.note ?? "";
      nextCommitted[record.studentId] = record.markedAt !== null;
    }
    setPresent(nextPresent);
    setNotes(nextNotes);
    setCommitted(nextCommitted);
  }

  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: ["session-detail", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["class-sessions", classId] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put(`/sessions/${sessionId}`, {
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        note: form.note.trim() || undefined,
        lessonId: form.lessonId || null,
      });
      toast.success("Đã cập nhật nội dung buổi học");
      invalidateSession();
    } catch (err) {
      toast.error(getErrorMessage(err, "Cập nhật buổi học thất bại"));
    } finally {
      setSaving(false);
    }
  };

  /** Tutor tải tệp lên học liệu (bài giảng) hoặc bài tập về nhà của buổi: upload rồi ghi lại danh sách. */
  const handleUploadFiles = async (type: "theory" | "exercise", files: FileList | null) => {
    if (!session || !files || files.length === 0) return;
    setUploadingType(type);
    try {
      const field = type === "theory" ? "theoryUrls" : "exerciseUrls";
      const uploaded: SessionFile[] = [];
      for (const file of Array.from(files)) {
        const result = await apiUploadFile(file);
        uploaded.push({ name: file.name, url: result.url, key: result.key });
      }
      const next = [...session[field], ...uploaded];
      await axiosInstance.put(`/sessions/${sessionId}`, { [field]: next });
      toast.success(`Đã tải lên ${uploaded.length} tệp`);
      invalidateSession();
    } catch (err) {
      toast.error(getErrorMessage(err, "Tải tệp lên thất bại"));
    } finally {
      setUploadingType(null);
    }
  };

  const handleDeleteFile = async (type: "theory" | "exercise", key: string) => {
    if (!session) return;
    setDeletingKey(key);
    try {
      const field = type === "theory" ? "theoryUrls" : "exerciseUrls";
      const next = session[field].filter((f) => f.key !== key);
      await axiosInstance.put(`/sessions/${sessionId}`, { [field]: next });
      toast.success("Đã xóa tệp");
      invalidateSession();
    } catch (err) {
      toast.error(getErrorMessage(err, "Xóa tệp thất bại"));
    } finally {
      setDeletingKey(null);
    }
  };

  /** Import materials from the linked curriculum lesson. Code hint: L→bài giảng, E→bài tập, else both. */
  const handleImport = async () => {
    if (!session) return;
    const lessonId = form.lessonId || session.lessonId;
    if (!lessonId) {
      toast.error("Buổi học chưa gắn bài giảng từ chương trình");
      return;
    }
    const code = importCode.trim().toUpperCase();
    const hasL = /L/.test(code);
    const hasE = /E/.test(code);
    const wantExercise = !(hasL && !hasE); // theory-only code excludes exercises
    const wantTheory = !(hasE && !hasL); // exercise-only code excludes theory

    setImporting(true);
    try {
      const res = await axiosInstance.get(`/curriculum/lessons/${lessonId}`);
      const lesson = unwrapApiData<{
        theoryUrls?: SessionFile[];
        exerciseUrls?: SessionFile[];
      }>(res.data);

      const mergeByKey = (a: SessionFile[], b: SessionFile[]) => {
        const seen = new Set(a.map((f) => f.key));
        return [...a, ...b.filter((f) => !seen.has(f.key))];
      };

      const payload: {
        theoryUrls?: SessionFile[];
        exerciseUrls?: SessionFile[];
      } = {};
      if (wantTheory && lesson?.theoryUrls?.length) {
        payload.theoryUrls = mergeByKey(session.theoryUrls, lesson.theoryUrls);
      }
      if (wantExercise && lesson?.exerciseUrls?.length) {
        payload.exerciseUrls = mergeByKey(
          session.exerciseUrls,
          lesson.exerciseUrls,
        );
      }

      if (Object.keys(payload).length === 0) {
        toast.info("Không có tài liệu phù hợp để nhập");
        return;
      }
      await axiosInstance.put(`/sessions/${sessionId}`, payload);
      toast.success("Đã nhập tài liệu từ chương trình bài giảng");
      setImportCode("");
      invalidateSession();
    } catch (err) {
      toast.error(getErrorMessage(err, "Nhập tài liệu thất bại"));
    } finally {
      setImporting(false);
    }
  };

  /** Add a single searched material (theory/exercise file) to the session. */
  const importSingleFile = async (item: MaterialItem) => {
    if (!session) return;
    const field = item.type === "theory" ? "theoryUrls" : "exerciseUrls";
    if (session[field].some((f) => f.key === item.key)) {
      toast.info("Tài liệu đã có trong buổi học");
      return;
    }
    setImportingKey(item.key);
    try {
      const next = [...session[field], item.file];
      await axiosInstance.put(`/sessions/${sessionId}`, { [field]: next });
      toast.success(
        item.type === "theory" ? "Đã thêm bài giảng" : "Đã thêm bài tập",
      );
      setImportCode("");
      setShowList(false);
      invalidateSession();
    } catch (err) {
      toast.error(getErrorMessage(err, "Nhập tài liệu thất bại"));
    } finally {
      setImportingKey(null);
    }
  };

  /** Persist one student's attendance (checkbox + note) for this session, or re-open it for editing. */
  const handleConfirmAttendance = (studentId: string) => {
    const isCommitted = committed[studentId] ?? false;
    if (isCommitted) {
      setCommitted((c) => ({ ...c, [studentId]: false }));
      return;
    }
    saveAttendance(studentId, present[studentId] ?? false);
  };

  /**
   * Persist one student's attendance right away (BE upsert). Used by the checkbox so a tick is
   * saved immediately instead of sitting in local state (that gap made the student see "Vắng mặt").
   * On failure the checkbox is reverted to the last saved value.
   */
  const saveAttendance = (studentId: string, isPresentNow: boolean) => {
    setPresent((p) => ({ ...p, [studentId]: isPresentNow }));
    setSavingAttendanceId(studentId);
    upsertAttendance.mutate(
      {
        sessionId,
        studentId,
        present: isPresentNow,
        note: isPresentNow ? null : (notes[studentId] ?? "").trim() || null,
      },
      {
        onSuccess: () => {
          setCommitted((c) => ({ ...c, [studentId]: true }));
          toast.success("Đã lưu điểm danh");
        },
        onError: (err) => {
          setPresent((p) => ({ ...p, [studentId]: !isPresentNow }));
          toast.error(getErrorMessage(err, "Điểm danh thất bại"));
        },
        onSettled: () => setSavingAttendanceId(null),
      },
    );
  };

  /** Mark this session as COMPLETED (tutor confirms the session has ended). */
  const handleConfirmEndSession = () => {
    updateSessionStatus(
      { id: sessionId, status: "COMPLETED" },
      {
        onSuccess: () => {
          toast.success("Đã kết thúc buổi học");
          setConfirmEndOpen(false);
          invalidateSession();
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, "Kết thúc buổi học thất bại")),
      },
    );
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <XCircle className="size-10 text-red-500" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {getErrorMessage(error) || "Không thể tải thông tin buổi học"}
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

  const isCompleted = session.status === "COMPLETED";

  const presentCount = attendanceRecords.filter(
    (s) => present[s.studentId] ?? s.present,
  ).length;

  const attendanceColumns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: "name",
      header: "Tên học sinh",
      cellClassName: "px-5",
      render: (student, idx) => {
        const name = `${student.firstName} ${student.lastName}`.trim();
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                AVATAR_COLORS[idx % AVATAR_COLORS.length],
              )}
            >
              {getInitials(name)}
            </div>
            <span className="font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      key: "code",
      header: "Mã HS",
      headerClassName: "w-28",
      cellClassName: "text-muted-foreground",
      render: (student) => student.userCode || "—",
    },
    {
      key: "present",
      header: "Có mặt",
      headerClassName: "w-24",
      render: (student) => {
        const isPresent = present[student.studentId] ?? student.present;
        if (!isTutor) {
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                isPresent
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isPresent ? "Có mặt" : "Chưa điểm danh"}
            </span>
          );
        }
        const name = `${student.firstName} ${student.lastName}`.trim();
        const isCommitted = committed[student.studentId] ?? false;
        return (
          <Checkbox
            aria-label={`Điểm danh ${name}`}
            checked={isPresent}
            disabled={isCommitted || savingAttendanceId === student.studentId}
            onCheckedChange={(checked) =>
              saveAttendance(student.studentId, checked === true)
            }
            className="mx-auto"
          />
        );
      },
    },
    ...(isTutor
      ? [
          {
            key: "note",
            header: "Ghi chú",
            cellClassName: "text-muted-foreground",
            render: (student) => {
              const isPresent = present[student.studentId] ?? student.present;
              const isCommitted = committed[student.studentId] ?? false;
              return isPresent ? (
                <span className="text-muted-foreground/40">——</span>
              ) : (
                <Input
                  value={notes[student.studentId] ?? ""}
                  onChange={(e) =>
                    setNotes((p) => ({
                      ...p,
                      [student.studentId]: e.target.value,
                    }))
                  }
                  placeholder="Ghi chú..."
                  disabled={isCompleted || isCommitted}
                  className="h-7 w-full max-w-xs rounded px-2 text-xs"
                />
              );
            },
          } satisfies DataTableColumn<AttendanceRecord>,
          {
            key: "commit",
            align: "center" as const,
            header: "Xác nhận",
            headerClassName: "w-20",
            render: (student) => {
              const name = `${student.firstName} ${student.lastName}`.trim();
              const isCommitted = committed[student.studentId] ?? false;
              const isSaving = savingAttendanceId === student.studentId;
              return (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={isSaving}
                  aria-label={
                    isCommitted
                      ? `Bỏ xác nhận điểm danh ${name}`
                      : `Xác nhận điểm danh ${name}`
                  }
                  onClick={() => handleConfirmAttendance(student.studentId)}
                  className={cn(
                    isCommitted &&
                      "text-emerald-600 hover:text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isCommitted ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
              );
            },
          } satisfies DataTableColumn<AttendanceRecord>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* Hero (student/parent) */}
      {!isTutor && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
              {session.class.subject}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              {STATUS_BADGE[session.status].label}
            </span>
            <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium">
              Buổi {String(session.sessionNumber).padStart(2, "0")}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold">
            {form.title || `Buổi ${session.sessionNumber}`}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-base font-bold">
              {session.class.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
                Lớp học
              </p>
              <p className="text-sm font-semibold">{session.class.name}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-[11px] text-white/70">Ngày học</p>
              <p className="mt-1 text-sm font-semibold">
                {fmtDate(session.startAt)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-[11px] text-white/70">Thời gian</p>
              <p className="mt-1 text-sm font-semibold">
                {fmtTime(session.startAt)} – {fmtTime(session.endAt)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-[11px] text-white/70">Địa điểm</p>
              <p className="mt-1 text-sm font-semibold">
                {session.location || "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-[11px] text-white/70">Trạng thái</p>
              <p className="mt-1 text-sm font-semibold">
                {STATUS_BADGE[session.status].label}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb + Header (tutor) */}
      {isTutor && (
        <>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href="/classes"
              className="transition-colors hover:text-foreground"
            >
              Quản lý lớp học
            </Link>
            <ChevronRight className="size-3.5" />
            <Link
              href={`/classes/${session.classId}`}
              className="transition-colors hover:text-foreground"
            >
              {session.class.code}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-foreground">
              Buổi {session.sessionNumber}
            </span>
          </nav>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <h3>{form.title}</h3>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400">
                  <Users className="size-3" />
                  {session.class.name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <BookOpen className="size-3" />
                  {session.class.subject}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {fmtDate(session.startAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {fmtTime(session.startAt)} – {fmtTime(session.endAt)}
                </span>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:shrink-0">
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  STATUS_BADGE[session.status].className,
                )}
              >
                {STATUS_BADGE[session.status].label}
              </span>
              {session.status !== "COMPLETED" &&
                session.status !== "CANCELLED" && (
                  <Button
                    size="lg"
                    className="shrink-0 px-6!"
                    onClick={() => setConfirmEndOpen(true)}
                  >
                    Kết thúc buổi học
                  </Button>
                )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
        onConfirm={handleConfirmEndSession}
        loading={endingSession}
        variant="default"
        icon={CheckCircle2}
        title="Xác nhận kết thúc buổi học"
        description="Sau khi kết thúc, buổi học sẽ chuyển sang trạng thái Kết thúc và không thể chỉnh sửa nội dung, học liệu hay điểm danh nữa. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Kết thúc buổi học"
      />

      {/* Lesson Content */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="size-4 text-primary" />
            Nội dung bài học
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Chương/Phần
              </label>
              <Select
                options={chapterOptions}
                value={selectedChapterId}
                onValueChange={(v) => {
                  setSelectedChapterId(v);
                  const stillValid = lessons.some(
                    (l) => l.id === form.lessonId && l.chapterId === v,
                  );
                  if (!stillValid) setForm((p) => ({ ...p, lessonId: "" }));
                }}
                placeholder={
                  curriculumId
                    ? "Chọn chương..."
                    : "Lớp chưa gắn chương trình học"
                }
                disabled={isCompleted || !isTutor}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Bài giảng (từ chương trình)
              </label>
              <Select
                options={lessonOptions}
                value={form.lessonId}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, lessonId: v }));
                  const l = lessons.find((x) => x.id === v);
                  if (l?.chapterId) setSelectedChapterId(l.chapterId);
                }}
                placeholder={
                  lessonOptions.length > 0
                    ? "Chọn bài giảng..."
                    : "Chưa có bài giảng"
                }
                disabled={isCompleted || !isTutor}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Mô tả tóm tắt
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
                placeholder="Nội dung buổi học..."
                disabled={isCompleted || !isTutor}
                className="w-full resize-none rounded-md border bg-surface-container-lowest px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {isTutor && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Ghi chú
                </label>
                <Input
                  value={form.note}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, note: e.target.value }))
                  }
                  placeholder="Ghi chú nội bộ..."
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>
        </div>
        {isTutor && (
          <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Lưu để cập nhật tiêu đề, bài giảng, mô tả và ghi chú của buổi học.
            </p>
            <Button
              size="md"
              onClick={handleSave}
              loading={saving}
              disabled={saving || isCompleted}
            >
              <Save className="size-3.5" />
              Lưu nội dung
            </Button>
          </div>
        )}
      </div>

      {/* Materials */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <GraduationCap className="size-4 text-primary" />
            Học liệu &amp; Bài tập
          </div>
        </div>
        <div className="space-y-4 p-5">
          {/* Import bar (tutor-only) */}
          {isTutor && (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Download className="size-3.5" />
                Nhập tự động từ chương trình bài giảng
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={importCode}
                    onChange={(e) => {
                      setImportCode(e.target.value);
                      setShowList(true);
                    }}
                    onFocus={() => setShowList(true)}
                    onBlur={() => setTimeout(() => setShowList(false), 150)}
                    placeholder="Nhập tên hoặc mã bài giảng / bài tập để tìm..."
                    disabled={isCompleted}
                    className="h-10 w-full text-sm"
                  />

                  {showList && importCode.trim() && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-card shadow-lg">
                      {materialMatches.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-muted-foreground">
                          Không tìm thấy tài liệu phù hợp
                        </p>
                      ) : (
                        <ul className="max-h-72 overflow-y-auto py-1">
                          {materialMatches.map((m) => {
                            const busy = importingKey === m.key;
                            return (
                              <li key={`${m.type}:${m.key}`}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  disabled={busy || isCompleted}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => importSingleFile(m)}
                                  className="h-auto! w-full! justify-start! gap-2.5! rounded-none! px-3! py-2! text-left! font-normal!"
                                >
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                      m.type === "theory"
                                        ? "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                                        : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
                                    )}
                                  >
                                    {m.type === "theory"
                                      ? "Bài giảng"
                                      : "Bài tập"}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                      {m.file.name}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                      {m.lessonTitle}
                                    </span>
                                  </span>
                                  {busy ? (
                                    <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                                  ) : (
                                    <Plus className="size-4 shrink-0 text-muted-foreground" />
                                  )}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  size="md"
                  onClick={handleImport}
                  loading={importing}
                  disabled={isCompleted || importing}
                >
                  <Import className="size-3.5" />
                  Nhập cả bài
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Gõ <span className="font-semibold text-primary">tên</span> hoặc{" "}
                <span className="font-semibold text-primary">mã</span> tài liệu
                để tìm và chọn từng tệp, hoặc nhấn{" "}
                <span className="font-semibold text-primary">Nhập cả bài</span>{" "}
                để lấy toàn bộ tài liệu của bài giảng đang chọn.
              </p>
            </div>
          )}

          {/* Two columns */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Bài giảng */}
            <div className="rounded-lg border bg-background">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                  Bài giảng
                </span>
                <p className="text-sm font-medium">Tài liệu bài giảng</p>
              </div>
              {session.theoryUrls.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Chưa có tài liệu bài giảng
                </p>
              ) : (
                <div className="divide-y px-4">
                  {session.theoryUrls.map((file) => (
                    <SessionMaterialFileRow
                      key={file.key}
                      file={file}
                      deleting={deletingKey === file.key}
                      disableDelete={isCompleted}
                      canDelete={isTutor}
                      onDelete={() => handleDeleteFile("theory", file.key)}
                    />
                  ))}
                </div>
              )}
              {isTutor && (
                <div className="border-t px-4 py-3">
                  <input
                    ref={theoryFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void handleUploadFiles("theory", e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => theoryFileInputRef.current?.click()}
                    disabled={isCompleted || uploadingType !== null}
                    loading={uploadingType === "theory"}
                    className="h-auto w-full gap-1.5 border-dashed py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <Plus className="size-3.5" />
                    Thêm ô nhập tệp
                  </Button>
                </div>
              )}
            </div>

            {/* Bài tập */}
            <div className="rounded-lg border bg-background">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  Bài tập
                </span>
                <p className="truncate text-sm font-medium">
                  {session.title || "Bài tập buổi học"}
                </p>
              </div>
              <div className="space-y-3 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Hạn nộp:{" "}
                    <span className="font-semibold text-rose-500">
                      {fmtDate(session.endAt)}, {fmtTime(session.endAt)}
                    </span>
                  </span>
                </div>

                {session.exerciseUrls.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    Chưa có tài liệu bài tập
                  </p>
                ) : (
                  <div className="divide-y border-t">
                    {session.exerciseUrls.map((file) => (
                      <SessionMaterialFileRow
                        key={file.key}
                        file={file}
                        deleting={deletingKey === file.key}
                        disableDelete={isCompleted}
                        canDelete={isTutor}
                        onDelete={() => handleDeleteFile("exercise", file.key)}
                      />
                    ))}
                  </div>
                )}

                {isTutor && (
                  <>
                    <input
                      ref={exerciseFileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void handleUploadFiles("exercise", e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => exerciseFileInputRef.current?.click()}
                      disabled={isCompleted || uploadingType !== null}
                      loading={uploadingType === "exercise"}
                      className="h-auto w-full gap-1.5 border-dashed py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      <Plus className="size-3.5" />
                      Thêm ô nhập tệp
                    </Button>
                  </>
                )}
              </div>

              {isTutor && (
                <div className="border-t px-4 py-3">
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto w-full gap-1.5 py-1 text-sm font-medium text-primary hover:bg-primary/5"
                  >
                    <Link
                      href={`/classes/${classId}/sessions/${sessionId}/submissions`}
                    >
                      <Eye className="size-3.5" />
                      Xem chi tiết bài nộp
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance (roster + records persisted via /attendances) */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <Users className="size-4 text-primary" />
            Điểm danh
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {presentCount}/{attendanceRecords.length} có mặt
          </span>
        </div>

        <DataTable
          data={attendanceRecords}
          columns={attendanceColumns}
          rowKey={(student) => student.studentId}
          isLoading={attendanceQuery.isLoading}
          isError={attendanceQuery.isError}
          errorMessage={getErrorMessage(attendanceQuery.error)}
          emptyMessage="Lớp chưa có học sinh"
        />
      </div>
    </div>
  );
};
