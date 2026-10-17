"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Loader2,
  Lock,
  MessageSquareText,
  Send,
  Upload,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { useSessionActions } from "@/lib/services/session.service";
import { useExerciseActions } from "@/lib/services/exercise.service";
import { useGet } from "@/lib/axios/query";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { cn } from "@/lib/utils";
import { ImagePreview } from "@/components/common/image-preview";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { StagedFileRow } from "../components/staged-file-row";
import {
  DownloadFileRow,
  EXERCISE_STATUS_META,
  SESSION_STATUS_META,
  StatusBadge,
  fmtDate,
  fmtDateTime,
  fmtTime,
} from "@/components/sessions/session-shared";
import type {
  ClassStudentDto,
  ExerciseDetail,
  SessionFile,
  UploadResult,
} from "@/types";
import { canUploadFiles, pickUploadFiles } from "@/lib/upload-policy";

type SessionDetailWatchPageProps = { classId: string; sessionId: string };

/* ─── Section card shell (intentionally duplicated per file — see ui-components.md) ─── */
const SectionCard = ({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border border-border/60 bg-card">
    <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-emerald-600" />
        {title}
      </h2>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

/** Read-only session view for STUDENT/PARENT — students submit/resubmit their exercise here,
 * parents view their child's submission read-only. Tutor management lives in `TutorSessionDetailPage`
 * (`session-detail-page.tsx`). */
export const SessionDetailWatchPage = ({
  classId,
  sessionId,
}: SessionDetailWatchPageProps) => {
  const queryClient = useQueryClient();
  const role = useCurrentUserRole();
  const isParent = role === "PARENT";
  const isStudent = role === "STUDENT";
  const viewerId = useCurrentUserId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [staged, setStaged] = useState<SessionFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    key: string;
  } | null>(null);

  /* ── Session detail ── */
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useSessionActions({
    detailId: sessionId,
    detailOptions: { enabled: !!sessionId },
  }).detail;

  /* ── Class roster — only needed to resolve which child a parent is viewing ── */
  const { data: studentsRaw } = useGet(
    ["session-watch-students", classId],
    `/classes/${classId}/students`,
    { enabled: !!classId && isParent },
  );
  const students = useMemo(
    () =>
      studentsRaw ? (unwrapApiData<ClassStudentDto[]>(studentsRaw) ?? []) : [],
    [studentsRaw],
  );

  // whose submission to load: student → self, parent → their child in this class
  const submissionStudentId = useMemo(() => {
    if (isStudent) return viewerId;
    if (isParent)
      return students.find((s) => s.parent?.id === viewerId)?.id ?? null;
    return null;
  }, [isStudent, isParent, viewerId, students]);

  /* ── Submission for this session (own for student, child's for parent) ── */
  const { data: exercisesRaw, isLoading: exerciseLoading } =
    useExerciseActions({
      list: { sessionId, studentId: submissionStudentId ?? undefined, limit: 1 },
      listOptions: { enabled: !!sessionId && !!submissionStudentId },
    }).list;

  const submission = useMemo<ExerciseDetail | null>(() => {
    if (!exercisesRaw) return null;
    return exercisesRaw[0] ?? null;
  }, [exercisesRaw]);

  const tutorId = session?.tutorId ?? session?.class.tutorId ?? null;

  /* ── Upload picked files to storage (staged, not yet submitted) ── */
  const onPickFiles = useCallback(async (files: FileList | null) => {
    const picked = pickUploadFiles(files);
    if (picked.length === 0) return;
    setUploading(true);
    try {
      const uploaded: SessionFile[] = [];
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await axiosInstance.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const result = unwrapApiData<UploadResult>(res.data);
        uploaded.push({ name: file.name, url: result.url, key: result.key });
      }
      setStaged((prev) => [...prev, ...uploaded]);
      toast.success(`Đã tải lên ${uploaded.length} tệp`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Tải tệp thất bại"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const removeStaged = (key: string) =>
    setStaged((prev) => prev.filter((f) => f.key !== key));

  /* ── Submit (create or re-submit) ── */
  const handleSubmit = useCallback(async () => {
    if (staged.length === 0) {
      toast.error("Vui lòng tải lên ít nhất một tệp bài làm");
      return;
    }
    if (!viewerId || !tutorId) {
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
          studentId: viewerId,
          sessionId,
          lessonId: session?.lessonId ?? undefined,
          exerciseUrls: staged,
        });
      }
      toast.success("Đã nộp bài thành công");
      setStaged([]);
      setResubmitOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
    } catch (err) {
      toast.error(getErrorMessage(err, "Nộp bài thất bại"));
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staged, viewerId, tutorId, submission, sessionId, session?.lessonId]);

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
  // students & parents only see the assigned exercises after the tutor marks the session
  // COMPLETED (mirrors backend) — a SCHEDULED/ONGOING session keeps them hidden.
  const exercisesLocked = session.status !== "COMPLETED";
  const canSubmit = isStudent && session.status !== "CANCELLED";
  const showUploadForm = !submission || resubmitOpen;

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href={`/classes/${classId}`}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {session.class.code}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">
          Buổi {session.sessionNumber}
        </span>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-6 text-white sm:p-8">
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

        <h1 className="mt-3 text-2xl font-bold text-white">
          {session.title || `Buổi học ${session.sessionNumber}`}
        </h1>
        {session.description && (
          <p className="mt-1.5 max-w-2xl text-sm text-white/80">
            {session.description}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <BookOpen className="size-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
              Lớp học
            </p>
            <p className="text-sm font-semibold">
              {session.class.name}{" "}
              <span className="font-mono font-normal text-white/70">
                ({session.class.code})
              </span>
            </p>
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
            <p className="text-[11px] text-white/70">Giờ học</p>
            <p className="mt-1 text-sm font-semibold">
              {fmtTime(session.startAt)
                ? `${fmtTime(session.startAt)} – ${fmtTime(session.endAt)}`
                : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[11px] text-white/70">Địa điểm</p>
            <p className="mt-1 truncate text-sm font-semibold">
              {session.location || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[11px] text-white/70">Bài giảng</p>
            <p className="mt-1 truncate text-sm font-semibold">
              {session.lesson?.title || "Chưa gắn bài giảng"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        {/* Materials */}
        <SectionCard title="Tài liệu bài giảng" icon={FileText}>
          {session.theoryUrls.length === 0 &&
          session.exerciseUrls.length === 0 &&
          !exercisesLocked ? (
            <p className="text-sm text-muted-foreground">
              Chưa có tài liệu cho buổi học này.
            </p>
          ) : (
            <div className="space-y-4">
              {session.theoryUrls.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lý thuyết
                  </p>
                  <div className="space-y-2">
                    {session.theoryUrls.map((f) => (
                      <DownloadFileRow key={f.key} file={f} />
                    ))}
                  </div>
                </div>
              )}
              {exercisesLocked ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Đề bài / bài tập
                  </p>
                  <p className="flex items-center gap-1.5 rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                    <Lock className="size-4 shrink-0" />
                    Bài tập sẽ hiển thị sau khi buổi học kết thúc.
                  </p>
                </div>
              ) : (
                session.exerciseUrls.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Đề bài / bài tập
                    </p>
                    <div className="space-y-2">
                      {session.exerciseUrls.map((f) => (
                        <DownloadFileRow key={f.key} file={f} />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </SectionCard>

        {/* Grade result (once graded) */}
        {submission?.status === "GRADED" && (
          <SectionCard title="Kết quả chấm bài" icon={ClipboardCheck}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <span className="text-3xl font-bold tabular-nums leading-none">
                  {submission.score ?? "—"}
                </span>
                <span className="mt-0.5 text-[10px] uppercase">/ 10 điểm</span>
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
          </SectionCard>
        )}

        {/* Submission — student submits, parent views read-only */}
        <SectionCard
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
              {canSubmit && showUploadForm && submission?.status !== "GRADED" && (
                <div className="space-y-3">
                  {submission && (
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Nộp lại — tải tệp mới
                    </p>
                  )}
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10",
                      uploading && "pointer-events-none opacity-60",
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      disabled={uploading || !canUploadFiles(role)}
                      onChange={(e) => onPickFiles(e.target.files)}
                    />
                    {uploading ? (
                      <Loader2 className="size-6 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="size-6 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {uploading ? "Đang tải lên…" : "Chọn tệp bài làm để tải lên"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Có thể chọn nhiều tệp (ảnh, PDF, tài liệu…)
                    </span>
                  </label>

                  {/* Staged files */}
                  {staged.length > 0 && (
                    <div className="space-y-2">
                      {staged.map((f) => (
                        <StagedFileRow
                          key={f.key}
                          file={f}
                          onRemove={() => removeStaged(f.key)}
                          onPreview={() => setPreviewFile(f)}
                        />
                      ))}
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
                      loading={submitting}
                      disabled={staged.length === 0 || uploading}
                    >
                      <Send className="size-4" />
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

              {isStudent && !submission && !canSubmit && (
                <p className="text-sm text-muted-foreground">
                  Buổi học đã hủy — không thể nộp bài.
                </p>
              )}

              {isParent && !submission && (
                <p className="text-sm text-muted-foreground">
                  {submissionStudentId
                    ? "Học sinh chưa nộp bài cho buổi học này."
                    : "Không tìm thấy học sinh tương ứng trong lớp này."}
                </p>
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
