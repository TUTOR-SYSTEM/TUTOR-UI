"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  Lock,
  MapPin,
  MessageSquareText,
  Plus,
  Send,
  Target,
  Upload,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { useSessionActions } from "@/lib/services/session.service";
import { useExerciseActions } from "@/lib/services/exercise.service";
import { useUserActions } from "@/lib/services/user.service";
import { useClassActions } from "@/lib/services/class.service";
import { useAttendanceActions } from "@/lib/services/attendance.service";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { cn } from "@/lib/utils";
import { ImagePreview } from "@/components/common/image-preview";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { StagedFileTile } from "../components/staged-file-tile";
import type {
  ExerciseDetail,
  SessionFile,
  UploadResult,
} from "@/types/session.types";
import {
  DownloadFileRow,
  EXERCISE_STATUS_META,
  SESSION_STATUS_META,
  StatusBadge,
  fmtDate,
  fmtDateTime,
  fmtTime,
} from "@/components/sessions/session-shared";
import { canUploadFiles, pickUploadFiles } from "@/lib/upload-policy";

/* ─── Upload form helpers ─────────────────────────────────────────────────── */

const ACCEPTED_FORMAT_PILLS = [
  "Ảnh",
  "PDF",
  "Word",
  "Excel",
  "PowerPoint",
  "ZIP",
];

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

/* ─── Sub-components (intentionally duplicated per file — see ui-components.md) ─── */

const Panel = ({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border/60 bg-card">
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="size-4 text-emerald-600" />}
        {title}
      </h2>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

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

/* ─── Main component ─────────────────────────────────────────────────────── */

export const ExerciseSubmitPage = ({
  classId,
  sessionId,
}: {
  classId: string;
  sessionId: string;
}) => {
  const queryClient = useQueryClient();
  const studentId = useCurrentUserId();
  const role = useCurrentUserRole();
  const isTutor = role === "TUTOR";
  const isParent = role === "PARENT";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [staged, setStaged] = useState<SessionFile[]>([]);
  const [stagedSizes, setStagedSizes] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    key: string;
  } | null>(null);

  /* ── Session detail via the unified (tutor + student) endpoint ── */
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useSessionActions({
    detailId: sessionId,
    detailOptions: { enabled: !!sessionId },
  }).detail;

  /* ── My submission for this session ── */
  const { data: exercises, isLoading: exerciseLoading } = useExerciseActions({
    list: { sessionId, studentId: studentId ?? undefined, limit: 1 },
    listOptions: { enabled: !!sessionId && !!studentId },
  }).list;

  const submission = useMemo<ExerciseDetail | null>(
    () => exercises?.[0] ?? null,
    [exercises],
  );

  const tutorId = session?.tutorId ?? session?.class.tutorId ?? null;

  /* ── Tutor name (GET /users/get-by-field) ── */
  const { data: tutorRaw } = useUserActions({
    byField: { field: "id", value: tutorId ?? "" },
    byFieldOptions: { enabled: !!tutorId },
    allGradesOptions: { enabled: false },
    userGradesOptions: { enabled: false },
  }).byField;
  const tutorName = useMemo(
    () => (tutorRaw ? fullName(tutorRaw[0]) || "Gia sư" : "Gia sư"),
    [tutorRaw],
  );

  /* ── Class roster — used for "Sĩ số" in the hero ── */
  const { data: roster } = useClassActions({
    studentsClassId: classId,
    studentsOptions: { enabled: !!classId },
  }).students;

  /* ── My attendance for this session ── */
  const { data: attendanceRecords } = useAttendanceActions({
    sessionId,
    listOptions: { enabled: !!sessionId },
  }).list;
  const myAttendance = useMemo(
    () => attendanceRecords?.find((r) => r.studentId === studentId) ?? null,
    [attendanceRecords, studentId],
  );

  /* ── Upload picked files to /upload, then stage locally ── */
  const onPickFiles = useCallback(async (files: FileList | null) => {
    const picked = pickUploadFiles(files);
    if (picked.length === 0) return;
    setUploading(true);
    try {
      const uploaded: SessionFile[] = [];
      const sizes: Record<string, number> = {};
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await axiosInstance.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const result = unwrapApiData<UploadResult>(res.data);
        uploaded.push({ name: file.name, url: result.url, key: result.key });
        sizes[result.key] = result.size;
      }
      setStaged((prev) => [...prev, ...uploaded]);
      setStagedSizes((prev) => ({ ...prev, ...sizes }));
      toast.success(`Đã tải lên ${uploaded.length} tệp`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Tải tệp thất bại"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const removeStaged = (key: string) => {
    setStaged((prev) => prev.filter((f) => f.key !== key));
    setStagedSizes((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!uploading) setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!uploading) onPickFiles(e.dataTransfer.files);
  };

  /* ── Submit (create first submission or resubmit) ── */
  const handleSubmit = useCallback(async () => {
    if (staged.length === 0) {
      toast.error("Vui lòng tải lên ít nhất một tệp bài làm");
      return;
    }
    if (!studentId || !tutorId) {
      toast.error("Thiếu thông tin học sinh hoặc gia sư");
      return;
    }
    setSubmitting(true);
    try {
      if (submission) {
        await axiosInstance.patch(`/exercises/${submission.id}/submit`, {
          exerciseUrls: staged,
        });
      } else {
        await axiosInstance.post("/exercises", {
          tutorId,
          studentId,
          sessionId,
          lessonId: session?.lessonId ?? undefined,
          exerciseUrls: staged,
        });
      }
      toast.success("Đã nộp bài thành công!");
      setStaged([]);
      setResubmitOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
    } catch (err) {
      toast.error(getErrorMessage(err, "Nộp bài thất bại"));
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staged, studentId, tutorId, submission, sessionId, session?.lessonId]);

  /* ── Loading / error states ── */
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tải buổi học…
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-10 text-center text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20">
          {getErrorMessage(sessionError, "Không tìm thấy buổi học")}
        </div>
        <div className="mt-4 text-center">
          <Button asChild variant="outline" size="sm">
            <Link href={`/classes/${classId}`}>Về lớp học</Link>
          </Button>
        </div>
      </div>
    );
  }

  const meta = SESSION_STATUS_META[session.status];
  // students & parents only see the assigned exercises after the tutor marks the session
  // COMPLETED (mirrors backend) — a SCHEDULED/ONGOING session keeps them hidden.
  const exercisesLocked = !isTutor && session.status !== "COMPLETED";
  const canSubmit = !isTutor && !isParent && session.status !== "CANCELLED";
  const canAttend =
    session.status === "ONGOING" || session.status === "COMPLETED";
  const showUploadForm = !submission || resubmitOpen;

  return (
    <div className="">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/classes" className="hover:text-foreground">
          Lớp học
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/classes/${classId}`} className="hover:text-foreground">
          {session.class.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/classes/${classId}/sessions/${sessionId}`}
          className="hover:text-foreground"
        >
          Buổi {session.sessionNumber}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Nộp bài</span>
        {isParent && (
          <StatusBadge
            label="Chỉ xem"
            className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
          />
        )}
      </nav>

      {/* Hero */}
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

        <h1 className="mt-3 text-2xl font-bold">
          {session.title || `Buổi học ${session.sessionNumber}`}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-white/80">
          {session.class.name}{" "}
          <span className="font-mono text-white/60">
            ({session.class.code})
          </span>{" "}
          · Gia sư: {tutorName}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoTile
            icon={Calendar}
            label="Ngày"
            value={fmtDate(session.startAt)}
          />
          <InfoTile
            icon={Clock}
            label="Giờ"
            value={
              fmtTime(session.startAt)
                ? `${fmtTime(session.startAt)} – ${fmtTime(session.endAt)}`
                : "—"
            }
          />
          <InfoTile
            icon={MapPin}
            label="Địa điểm"
            value={session.location || "—"}
          />
          <InfoTile
            icon={Users}
            label="Sĩ số"
            value={roster?.length ? `${roster.length} học sinh` : "—"}
          />
        </div>
      </div>

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
            {session.theoryUrls.length > 0 ? (
              <div className="space-y-2">
                {session.theoryUrls.map((f) => (
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
            {exercisesLocked ? (
              <p className="flex items-center gap-1.5 rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                <Lock className="size-4 shrink-0" />
                Bài tập sẽ hiển thị sau khi buổi học kết thúc.
              </p>
            ) : session.exerciseUrls.length > 0 ? (
              <div className="space-y-2">
                {session.exerciseUrls.map((f) => (
                  <DownloadFileRow key={f.key} file={f} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có bài tập được giao cho buổi học này.
              </p>
            )}
          </Panel>

          {/* Grade result */}
          {submission?.status === "GRADED" && (
            <Panel title="Kết quả chấm bài" icon={ClipboardCheck}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <span className="text-3xl font-bold tabular-nums leading-none">
                    {submission.score ?? "—"}
                  </span>
                  <span className="mt-0.5 text-[10px] uppercase">
                    / 10 điểm
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" /> Gia sư đã chấm điểm
                    {submission.gradedAt && (
                      <span className="font-normal text-muted-foreground">
                        · {fmtDateTime(submission.gradedAt)}
                      </span>
                    )}
                  </p>
                  <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <MessageSquareText className="size-3.5" /> Nhận xét
                    </p>
                    <p className="mt-1 text-sm">
                      {submission.comment?.trim() || "Không có nhận xét."}
                    </p>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {/* Submission */}
          <Panel
            title={isParent ? "Bài làm của học sinh" : "Bài làm của tôi"}
            icon={Send}
            action={
              submission ? (
                <StatusBadge
                  label={EXERCISE_STATUS_META[submission.status].label}
                  className={EXERCISE_STATUS_META[submission.status].className}
                />
              ) : (
                <StatusBadge
                  label={EXERCISE_STATUS_META.NOT_SUBMITTED.label}
                  className={EXERCISE_STATUS_META.NOT_SUBMITTED.className}
                />
              )
            }
          >
            {exerciseLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Đang tải bài nộp…
              </div>
            ) : (
              <div className="space-y-4">
                {/* Already-submitted files */}
                {submission && submission.exerciseUrls.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Đã nộp · {fmtDateTime(submission.updatedAt)}
                    </p>
                    <div className="space-y-2">
                      {submission.exerciseUrls.map((f) => (
                        <DownloadFileRow key={f.key} file={f} />
                      ))}
                    </div>
                    {!resubmitOpen &&
                      submission.status !== "GRADED" &&
                      canSubmit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setResubmitOpen(true)}
                        >
                          <Upload className="size-4" /> Nộp lại bài
                        </Button>
                      )}
                    {submission.status === "GRADED" && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Bài đã được chấm điểm — không thể nộp lại.
                      </p>
                    )}
                  </div>
                )}

                {/* Upload form */}
                {canSubmit &&
                  showUploadForm &&
                  submission?.status !== "GRADED" && (
                    <div className="space-y-3">
                      {submission && (
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Nộp lại — tải tệp mới
                        </p>
                      )}

                      {/* Drop zone — full-size when empty, compact tile once files are staged */}
                      {staged.length === 0 ? (
                        <label
                          onDragOver={onDragOver}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop}
                          className={cn(
                            "flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
                            isDragging
                              ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/10"
                              : "border-border/70 bg-muted/20 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10",
                            uploading && "pointer-events-none opacity-60",
                          )}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                            className="hidden"
                            disabled={uploading || !canUploadFiles(role)}
                            onChange={(e) => onPickFiles(e.target.files)}
                          />
                          {uploading ? (
                            <Loader2 className="size-7 animate-spin text-emerald-600" />
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                              <Upload className="size-5" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {uploading
                                ? "Đang tải lên…"
                                : "Kéo thả tệp vào đây, hoặc bấm để chọn"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Hỗ trợ chọn nhiều tệp cùng lúc
                            </p>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                            {ACCEPTED_FORMAT_PILLS.map((label) => (
                              <span
                                key={label}
                                className="rounded-full border border-border/60 bg-surface-container-lowest px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </label>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Đã chọn {staged.length} tệp
                          </p>
                          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                            {staged.map((f) => (
                              <StagedFileTile
                                key={f.key}
                                file={f}
                                size={stagedSizes[f.key]}
                                onPreview={() => setPreviewFile(f)}
                                onRemove={() => removeStaged(f.key)}
                              />
                            ))}
                            <label
                              onDragOver={onDragOver}
                              onDragLeave={onDragLeave}
                              onDrop={onDrop}
                              className={cn(
                                "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center transition-colors",
                                isDragging
                                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/10"
                                  : "border-border/70 bg-muted/20 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10",
                                uploading && "pointer-events-none opacity-60",
                              )}
                            >
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => onPickFiles(e.target.files)}
                              />
                              {uploading ? (
                                <Loader2 className="size-5 animate-spin text-emerald-600" />
                              ) : (
                                <Plus className="size-5 text-muted-foreground" />
                              )}
                              <span className="text-[10px] font-medium text-muted-foreground">
                                Thêm tệp
                              </span>
                            </label>
                          </div>
                        </div>
                      )}

                      {previewFile && (
                        <ImagePreview
                          src={previewFile.url}
                          name={previewFile.name}
                          onClose={() => setPreviewFile(null)}
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSubmit}
                          disabled={
                            staged.length === 0 || uploading || submitting
                          }
                        >
                          {submitting ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Send className="size-4" />
                          )}
                          {submission ? "Nộp lại bài" : "Nộp bài"}
                        </Button>
                        {submission && resubmitOpen && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setResubmitOpen(false);
                              setStaged([]);
                            }}
                          >
                            Hủy
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                {!submission && !canSubmit && !isParent && (
                  <p className="text-sm text-muted-foreground">
                    Buổi học đã hủy — không thể nộp bài.
                  </p>
                )}

                {isParent && !submission && (
                  <p className="text-sm text-muted-foreground">
                    Học sinh chưa nộp bài cho buổi học này.
                  </p>
                )}
              </div>
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
                <dd className="font-medium">{fmtDate(session.startAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Thời gian</dt>
                <dd className="font-medium">
                  {fmtTime(session.startAt)
                    ? `${fmtTime(session.startAt)} – ${fmtTime(session.endAt)}`
                    : "—"}
                </dd>
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
            title={isParent ? "Điểm danh của học sinh" : "Điểm danh của tôi"}
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
            <h3 className="text-base font-semibold">Có câu hỏi về buổi học?</h3>
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
    </div>
  );
};
