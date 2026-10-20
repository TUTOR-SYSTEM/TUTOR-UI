"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ClipboardCheck,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  PenLine,
  SkipForward,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { cn } from "@/lib/utils";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { isImageFile } from "@/lib/file-utils";
import { useExerciseActions } from "@/lib/services/exercise.service";
import type {
  ExerciseDetail,
  ExerciseStatus,
  SessionFile,
  UploadResult,
} from "@/types/session.types";
import { downloadFile, fmtDateTime } from "@/components/sessions/session-shared";
import {
  AnnotationMarker,
  type Annotation,
  type MarkerType,
} from "./exercise-annotation-marker";
import { pickUploadFiles } from "@/lib/upload-policy";

/* ─── Types ─── */

type ClassStudentDto = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  userCode: string | null;
};

/* ─── Constants ─── */

const QUICK_SCORES = ["6.5", "7.5", "8.0", "9.0", "10"];
const CANNED_FEEDBACK = [
  "Trình bày tốt",
  "Chú ý dấu",
  "Xem lại câu 3",
  "Cần nắn chữ",
];

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

/** Compact dot-badge for the submission status, styled to match the grading mock. */
const GRADE_BADGE: Record<
  ExerciseStatus,
  { label: string; dot: string; className: string }
> = {
  SUBMITTED: {
    label: "Chờ chấm",
    dot: "bg-amber-500",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  },
  GRADED: {
    label: "Đã chấm",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  },
  RESUBMIT: {
    label: "Cần nộp lại",
    dot: "bg-rose-500",
    className:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  },
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

/* ─── Grade workspace ───
 * Remounted per exercise (see `key` at the call site), so every piece of
 * form/annotation state can be lazily derived from props with no sync effect.
 */

export const GradeWorkspace = ({
  exercise,
  student,
  studentIndex,
  isTutor,
  backHref,
  exercisesKey,
  nextUngraded,
  goTo,
}: {
  exercise: ExerciseDetail;
  student: ClassStudentDto;
  studentIndex: number;
  isTutor: boolean;
  backHref: string;
  exercisesKey: readonly unknown[];
  nextUngraded: ExerciseDetail | null;
  goTo: (id: string) => void;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [score, setScore] = useState(
    exercise.score !== null ? String(exercise.score) : "",
  );
  const [comment, setComment] = useState(exercise.comment ?? "");
  const [activePage, setActivePage] = useState(0);
  const [annotationMode, setAnnotationMode] = useState(true);
  const [activeMarkerType, setActiveMarkerType] = useState<MarkerType>("wrong");
  const [annotationsByPage, setAnnotationsByPage] = useState<
    Record<number, Annotation[]>
  >({});
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(
    null,
  );
  const [answerKeyFiles, setAnswerKeyFiles] = useState<SessionFile[]>([]);
  const [answerKeySizes, setAnswerKeySizes] = useState<Record<string, number>>(
    {},
  );
  const [uploadingAnswerKey, setUploadingAnswerKey] = useState(false);
  const answerKeyInputRef = useRef<HTMLInputElement>(null);

  const studentName = `${student.firstName} ${student.lastName}`.trim();
  const gradeBadge = GRADE_BADGE[exercise.status];
  const currentPageAnnotations = annotationsByPage[activePage] ?? [];
  const currentFile = exercise.exerciseUrls[activePage] ?? null;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTutor || !annotationMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(
      98,
      Math.max(2, ((e.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.min(
      98,
      Math.max(2, ((e.clientY - rect.top) / rect.height) * 100),
    );
    const list = annotationsByPage[activePage] ?? [];
    const newAnnotation: Annotation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      number: list.length + 1,
      type: activeMarkerType,
      x,
      y,
      note: "",
    };
    setAnnotationsByPage((prev) => ({
      ...prev,
      [activePage]: [...list, newAnnotation],
    }));
    setEditingAnnotationId(newAnnotation.id);
  };

  const updateAnnotationNote = (id: string, note: string) => {
    setAnnotationsByPage((prev) => ({
      ...prev,
      [activePage]: (prev[activePage] ?? []).map((a) =>
        a.id === id ? { ...a, note } : a,
      ),
    }));
  };
  const deleteAnnotation = (id: string) => {
    setAnnotationsByPage((prev) => ({
      ...prev,
      [activePage]: (prev[activePage] ?? []).filter((a) => a.id !== id),
    }));
    setEditingAnnotationId(null);
  };

  const onPickAnswerKey = async (files: FileList | null) => {
    const picked = pickUploadFiles(files);
    if (picked.length === 0 || !isTutor) return;
    setUploadingAnswerKey(true);
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
      setAnswerKeyFiles((prev) => [...prev, ...uploaded]);
      setAnswerKeySizes((prev) => ({ ...prev, ...sizes }));
    } catch (err) {
      toast.error(getErrorMessage(err, "Tải lời giải thất bại"));
    } finally {
      setUploadingAnswerKey(false);
      if (answerKeyInputRef.current) answerKeyInputRef.current.value = "";
    }
  };

  const gradeMutation = useExerciseActions().grade;

  const doSave = async (after: "list" | "next") => {
    const parsed = Number(score);
    if (
      score.trim() === "" ||
      Number.isNaN(parsed) ||
      parsed < 0 ||
      parsed > 10
    ) {
      toast.error("Điểm phải là số từ 0 đến 10");
      return;
    }
    await gradeMutation.mutateAsync(
      {
        id: exercise.id,
        score: parsed,
        comment: comment.trim() || undefined,
      },
      {
        onError: (err) =>
          toast.error(getErrorMessage(err, "Chấm điểm thất bại")),
      },
    );
    toast.success("Đã lưu điểm");
    queryClient.invalidateQueries({ queryKey: exercisesKey });
    if (after === "next") {
      if (nextUngraded) {
        goTo(nextUngraded.id);
      } else {
        toast.info("Đã chấm hết bài trong buổi học này");
        router.push(backHref);
      }
    } else {
      router.push(backHref);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Left: submission viewer */}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {student.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.avatar}
                alt=""
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  AVATAR_COLORS[studentIndex % AVATAR_COLORS.length] ??
                    AVATAR_COLORS[0],
                )}
              >
                {getInitials(studentName)}
              </div>
            )}
            <div>
              <p className="font-semibold">{studentName}</p>
              <p className="text-xs text-muted-foreground">
                Nộp {fmtDateTime(exercise.updatedAt)} ·{" "}
                {exercise.exerciseUrls.length} tệp bài làm
              </p>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              gradeBadge.className,
            )}
          >
            <span className={cn("size-1.5 rounded-full", gradeBadge.dot)} />
            {gradeBadge.label}
          </span>
        </div>

        {exercise.exerciseUrls.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Học sinh chưa nộp tệp nào.
          </p>
        ) : (
          <>
            {/* Page tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <div className="flex flex-wrap gap-1.5">
                {exercise.exerciseUrls.map((f, i) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActivePage(i)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      activePage === i
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {isImageFile(f.name) ? (
                      <ImageIcon className="size-3.5" />
                    ) : (
                      <FileText className="size-3.5" />
                    )}
                    Trang {i + 1}
                  </button>
                ))}
              </div>
              {currentFile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadFile(currentFile.key, currentFile.name)
                  }
                >
                  <Download className="size-3.5" /> Tải bài làm
                </Button>
              )}
            </div>

            {/* Annotation toolbar (tutor only) */}
            {isTutor && currentFile && isImageFile(currentFile.name) && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-muted-foreground">
                    Chú thích:
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnnotationMode((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors",
                      annotationMode
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <PenLine className="size-3.5" />
                    {annotationMode ? "Đang bật" : "Đang tắt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMarkerType("wrong")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 font-medium text-white transition-shadow",
                      activeMarkerType === "wrong"
                        ? "ring-2 ring-orange-300 ring-offset-1"
                        : "opacity-70 hover:opacity-100",
                    )}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-white/90" />
                    Sai
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMarkerType("correct")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-shadow",
                      activeMarkerType === "correct"
                        ? "ring-2 ring-primary/40 ring-offset-1"
                        : "opacity-70 hover:opacity-100",
                    )}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-white/90" />
                    Đúng
                  </button>
                </div>
                {annotationMode && (
                  <span className="text-muted-foreground">
                    Bấm lên bài để thêm ghi chú
                  </span>
                )}
              </div>
            )}

            {/* Submission surface */}
            {currentFile && isImageFile(currentFile.name) ? (
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg border bg-muted/20",
                  isTutor && annotationMode && "cursor-crosshair",
                )}
                onClick={handleImageClick}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentFile.url}
                  alt={currentFile.name}
                  className="w-full select-none"
                  draggable={false}
                />
                {currentPageAnnotations.map((a) => (
                  <AnnotationMarker
                    key={a.id}
                    annotation={a}
                    editable={isTutor}
                    isEditing={editingAnnotationId === a.id}
                    onStartEdit={() => setEditingAnnotationId(a.id)}
                    onChangeNote={(v) => updateAnnotationNote(a.id, v)}
                    onCommit={() => setEditingAnnotationId(null)}
                    onDelete={() => deleteAnnotation(a.id)}
                  />
                ))}
              </div>
            ) : currentFile ? (
              <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-4">
                <FileText className="size-6 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {currentFile.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadFile(currentFile.key, currentFile.name)
                  }
                >
                  <Download className="size-3.5" /> Tải xuống
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Right: grading panel */}
      {isTutor ? (
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div>
            <p className="mb-2 text-sm font-semibold">
              Điểm số{" "}
              <span className="font-normal text-muted-foreground">
                (thang 10)
              </span>
            </p>
            <div className="flex items-baseline gap-2 rounded-lg border border-input bg-surface-container-lowest px-3 py-2.5">
              <input
                type="number"
                min={0}
                max={10}
                step="0.1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="0.0"
                className="w-20 border-0 bg-transparent text-3xl font-bold outline-none"
              />
              <span className="text-sm text-muted-foreground">/ 10</span>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {QUICK_SCORES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setScore(v)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                    score === v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-surface-container-lowest text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold">Nhận xét</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Nhận xét cho học sinh..."
              className="w-full resize-none rounded-md border border-input bg-surface-container-lowest px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary dark:bg-input/30"
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CANNED_FEEDBACK.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() =>
                    setComment((c) => (c ? `${c} ${text}.` : `${text}.`))
                  }
                  className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary transition-colors hover:opacity-80"
                >
                  + {text}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold">Lời giải / đáp án</p>
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center transition-colors hover:border-primary/50",
                uploadingAnswerKey && "pointer-events-none opacity-60",
              )}
            >
              <input
                ref={answerKeyInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                disabled={uploadingAnswerKey || !isTutor}
                onChange={(e) => onPickAnswerKey(e.target.files)}
              />
              {uploadingAnswerKey ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Upload className="size-4.5" />
                </div>
              )}
              <p className="text-xs font-medium">
                Kéo thả hoặc bấm để tải lên đáp án
              </p>
              <p className="text-[11px] text-muted-foreground">
                PDF, JPG, PNG · tối đa 20MB
              </p>
            </label>
            {answerKeyFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {answerKeyFiles.map((f) => {
                  const isImage = isImageFile(f.name);
                  return (
                    <div
                      key={f.key}
                      className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-2.5 py-2"
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.url}
                          alt={f.name}
                          className="size-8 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400">
                          <FileText className="size-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatBytes(answerKeySizes[f.key])}
                          {formatBytes(answerKeySizes[f.key]) ? " · " : ""}
                          vừa tải lên
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Bỏ tệp"
                        onClick={() => {
                          setAnswerKeyFiles((prev) =>
                            prev.filter((x) => x.key !== f.key),
                          );
                          setAnswerKeySizes((prev) => {
                            const next = { ...prev };
                            delete next[f.key];
                            return next;
                          });
                        }}
                        className="text-muted-foreground hover:text-rose-500"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t pt-3">
            <Button
              className="w-full"
              loading={gradeMutation.isPending}
              onClick={() => doSave("list")}
            >
              <Check className="size-4" /> Lưu &amp; trả bài cho học sinh
            </Button>
            <Button
              variant="outline"
              className="w-full"
              loading={gradeMutation.isPending}
              onClick={() => doSave("next")}
            >
              <SkipForward className="size-4" /> Lưu &amp; chấm bài tiếp theo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          {exercise.status === "GRADED" ? (
            <>
              <div>
                <p className="mb-2 text-sm font-semibold">
                  Điểm số{" "}
                  <span className="font-normal text-muted-foreground">
                    (thang 10)
                  </span>
                </p>
                <div className="flex items-baseline gap-2 rounded-lg border border-input bg-surface-container-lowest px-3 py-2.5">
                  <span className="text-3xl font-bold tabular-nums">
                    {exercise.score ?? "—"}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 10</span>
                </div>
                {exercise.gradedAt && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClipboardCheck className="size-3.5" /> Gia sư đã chấm ·{" "}
                    {fmtDateTime(exercise.gradedAt)}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-sm font-semibold">Nhận xét</p>
                <div className="min-h-16 rounded-md border border-input bg-surface-container-lowest px-3 py-2.5 text-sm">
                  {exercise.comment?.trim() || "Không có nhận xét."}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-semibold">
                  Lời giải / đáp án
                </p>
                <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
                  Gia sư chưa đính kèm lời giải cho bài này.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bài làm đang chờ gia sư chấm điểm.
            </p>
          )}
          <Button variant="outline" className="w-full" asChild>
            <Link href={backHref}>
              <ChevronLeft className="size-4" /> Quay lại
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};
