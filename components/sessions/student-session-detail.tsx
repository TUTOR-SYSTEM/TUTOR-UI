"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  MapPin,
  MessageSquareText,
  Paperclip,
  Send,
  Settings2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { useSessionActions } from "@/lib/services/session.service";
import { useExerciseActions } from "@/lib/services/exercise.service";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { cn } from "@/lib/utils";
import { isImageFile } from "@/lib/file-utils";
import { ImagePreview } from "@/components/common/image-preview";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
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
} from "./session-shared";
import { canUploadFiles, pickUploadFiles } from "@/lib/upload-policy";

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

export const StudentSessionDetail = ({ sessionId }: { sessionId: string }) => {
  const queryClient = useQueryClient();
  const role = useCurrentUserRole();
  const isTutor = role === "TUTOR";
  const isParent = role === "PARENT";
  const isStudent = role === "STUDENT";
  const searchParams = useSearchParams();
  const viewerId = useCurrentUserId();
  // whose submission to load: student → self, parent → ?studentId (the child), tutor → none
  const childId = searchParams.get("studentId");
  const submissionStudentId = isStudent ? viewerId : isParent ? childId : null;
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

  /* ── Submission for this session (own for student, child's for parent) ── */
  const { data: exercisesRaw, isLoading: exerciseLoading } =
    useExerciseActions({
      list: { sessionId, studentId: submissionStudentId ?? undefined, limit: 1 },
      listOptions: { enabled: !!sessionId && !!submissionStudentId && !isTutor },
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
      await queryClient.invalidateQueries({
        queryKey: ["student-exercise", sessionId, submissionStudentId],
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Nộp bài thất bại"));
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staged, viewerId, tutorId, submission, sessionId, session?.lessonId]);

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
            <Link href="/sessions">
              <ArrowLeft className="size-4" /> Về danh sách
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const meta = SESSION_STATUS_META[session.status];
  // students & parents only see the assigned exercises after the tutor marks the session
  // COMPLETED (mirrors backend) — a SCHEDULED/ONGOING session keeps them hidden.
  const exercisesLocked = !isTutor && session.status !== "COMPLETED";
  const canSubmit = isStudent && session.status !== "CANCELLED";
  const showUploadForm = !submission || resubmitOpen;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Buổi học
        </Link>
      </div>

      {/* Header */}
      <div className="mt-3 rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-50/60 to-transparent p-6 dark:from-emerald-950/20">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={meta.label} className={meta.className} />
          <span className="text-xs text-muted-foreground">
            Buổi {String(session.sessionNumber).padStart(2, "0")}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {session.title || `Buổi học ${session.sessionNumber}`}
        </h1>
        {session.description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {session.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-4" />
            {session.class.name}
            <span className="font-mono">({session.class.code})</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-4" />
            {fmtDate(session.startAt)}
            {fmtTime(session.startAt)
              ? ` · ${fmtTime(session.startAt)}–${fmtTime(session.endAt)}`
              : ""}
          </span>
          {session.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {session.location}
            </span>
          )}
          {session.lesson && (
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="size-4" />
              {session.lesson.title}
            </span>
          )}
        </div>

        {isTutor && (
          <div className="mt-5">
            <Button asChild size="sm">
              <Link href={`/classes/${session.classId}/sessions/${sessionId}`}>
                <Settings2 className="size-4" /> Quản lý buổi học
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5">
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

        {/* Grade result (once graded) — hidden for the managing tutor */}
        {!isTutor && submission?.status === "GRADED" && (
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

        {/* Submission — student submits, parent views read-only, tutor hidden */}
        {!isTutor && (
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
                {canSubmit &&
                  showUploadForm &&
                  submission?.status !== "GRADED" && (
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
                          {uploading
                            ? "Đang tải lên…"
                            : "Chọn tệp bài làm để tải lên"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Có thể chọn nhiều tệp (ảnh, PDF, tài liệu…)
                        </span>
                      </label>

                      {/* Staged files */}
                      {staged.length > 0 && (
                        <div className="space-y-2">
                          {staged.map((f) => {
                            const isImage = isImageFile(f.name);
                            return (
                              <div
                                key={f.key}
                                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5"
                              >
                                {isImage ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFile(f)}
                                    className="size-10 shrink-0 overflow-hidden rounded-md border"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={f.url}
                                      alt={f.name}
                                      className="size-full object-cover"
                                    />
                                  </button>
                                ) : (
                                  <Paperclip className="size-4 shrink-0 text-emerald-600" />
                                )}
                                {isImage ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFile(f)}
                                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                                  >
                                    {f.name}
                                  </button>
                                ) : (
                                  <span className="min-w-0 flex-1 truncate text-sm">
                                    {f.name}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  aria-label="Bỏ tệp"
                                  onClick={() => removeStaged(f.key)}
                                  className="text-muted-foreground hover:text-rose-500"
                                >
                                  <X className="size-4" />
                                </button>
                              </div>
                            );
                          })}
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
                    {childId
                      ? "Học sinh chưa nộp bài cho buổi học này."
                      : "Chưa chọn học sinh để xem bài làm."}
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
};
