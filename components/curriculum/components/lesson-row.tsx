"use client";

import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { MaterialGroup } from "./material-group";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import type {
  ApiResponse,
  CurriculumLesson,
  CurriculumLessonFile,
  UploadResult,
} from "@/types";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { DeleteIcon } from "@/components/ui/delete-icon.ui";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table.ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { EditLessonDialog } from "@/components/curriculum/dialog/edit-lesson-dialog";

type LessonRowProps = {
  lesson: CurriculumLesson;
  index: number;
  lessonCode: string;
  onDelete: () => void;
  onRefetch: () => void;
};

export function LessonRow({
  lesson,
  index,
  lessonCode,
  onDelete,
  onRefetch,
}: LessonRowProps) {
  const { detail: t } = useCurriculumCopy();
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState<"theory" | "exercise" | null>(
    null,
  );
  const [removing, setRemoving] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [fileToRemove, setFileToRemove] = useState<{
    type: "theory" | "exercise";
    url: string;
    name: string;
  } | null>(null);

  const requestRemoveFile = (type: "theory" | "exercise", url: string) => {
    const files = type === "theory" ? lesson.theoryUrls : lesson.exerciseUrls;
    const name = files.find((f) => f.url === url)?.name ?? "";
    setFileToRemove({ type, url, name });
  };

  /* Files live on the lesson row: upload to /upload, then PUT the full list back
   * to /curriculum/lessons/:id (`theoryUrls` / `exerciseUrls`). */
  const uploadFile = useCallback(
    async (type: "theory" | "exercise", file: File) => {
      setUploading(type);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await axiosInstance.post<ApiResponse<UploadResult>>(
          "/upload",
          fd,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        const uploaded = unwrapApiData<UploadResult>(uploadRes.data);
        const key = type === "theory" ? "theoryUrls" : "exerciseUrls";
        const next: CurriculumLessonFile[] = [
          ...lesson[key],
          { name: file.name, url: uploaded.url, key: uploaded.key },
        ];
        await axiosInstance.put(`/curriculum/lessons/${lesson.id}`, { [key]: next });
        onRefetch();
        toast.success(t.lesson.uploadSuccess);
      } catch (err) {
        toast.error(getErrorMessage(err, t.lesson.uploadErrorFallback));
      } finally {
        setUploading(null);
      }
    },
    [lesson, onRefetch, t],
  );

  const removeFile = useCallback(
    async (type: "theory" | "exercise", url: string) => {
      setRemoving(url);
      try {
        const key = type === "theory" ? "theoryUrls" : "exerciseUrls";
        const next = lesson[key].filter((f) => f.url !== url);
        await axiosInstance.put(`/curriculum/lessons/${lesson.id}`, { [key]: next });
        onRefetch();
        toast.success(t.lesson.removeFileSuccess);
      } catch (err) {
        toast.error(getErrorMessage(err, t.file.removeErrorFallback));
      } finally {
        setRemoving(null);
      }
    },
    [lesson, onRefetch, t],
  );

  return (
    <>
      <TableRow className="border-t border-border/60">
        <TableCell className="px-4 py-3.5 font-mono text-sm text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </TableCell>

        <TableCell className="px-4 py-3.5">
          <div className="min-w-0 pr-4">
            <p className="text-sm font-medium leading-snug">{lesson.title}</p>
            {lesson.description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {lesson.description}
              </p>
            )}
          </div>
        </TableCell>

        <TableCell className="px-4 py-3.5">
          <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400">
            {lessonCode}
          </span>
        </TableCell>

        <TableCell className="px-4 py-3.5">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(true)}
              aria-label={t.lesson.editAriaLabel}
              className="rounded-lg border border-border bg-background text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-800/50 dark:hover:bg-emerald-950/30"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpanded((v) => !v)}
              aria-label={t.lesson.expandAriaLabel}
              className="rounded-lg border border-border bg-background text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-800/50 dark:hover:bg-emerald-950/30"
            >
              {expanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              aria-label={t.lesson.deleteAriaLabel}
              className="rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <DeleteIcon />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {editing && (
        <EditLessonDialog
          lesson={lesson}
          onClose={() => setEditing(false)}
          onSaved={onRefetch}
        />
      )}

      {expanded && (
        <TableRow className="border-t border-border/40 bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={4} className="px-4 py-3">
            <div className="space-y-3">
              <MaterialGroup
                badgeLabel={t.file.theoryBadge}
                badgeClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                groupCode={`${lessonCode}`}
                files={lesson.theoryUrls}
                uploading={uploading === "theory"}
                removingUrl={removing}
                onUpload={(file) => uploadFile("theory", file)}
                onRemove={(url) => requestRemoveFile("theory", url)}
              />
              <MaterialGroup
                badgeLabel={t.file.exerciseBadge}
                badgeClass="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                groupCode={`${lessonCode}`}
                files={lesson.exerciseUrls}
                uploading={uploading === "exercise"}
                removingUrl={removing}
                onUpload={(file) => uploadFile("exercise", file)}
                onRemove={(url) => requestRemoveFile("exercise", url)}
              />
            </div>
          </TableCell>
        </TableRow>
      )}

      <ConfirmDialog
        open={fileToRemove !== null}
        onClose={() => setFileToRemove(null)}
        onConfirm={() => {
          const target = fileToRemove;
          setFileToRemove(null);
          if (target) void removeFile(target.type, target.url);
        }}
        title={t.deleteFileConfirm.title}
        confirmLabel={t.deleteFileConfirm.confirmLabel}
        description={
          <>
            <p>
              {t.deleteFileConfirm.descriptionPrefix}{" "}
              <span className="font-semibold text-foreground">
                {fileToRemove?.name ?? ""}
              </span>
              ?
            </p>
            <p className="mt-1">{t.deleteFileConfirm.warning}</p>
          </>
        }
      />
    </>
  );
}
