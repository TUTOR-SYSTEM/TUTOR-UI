"use client";

import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Plus} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
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
    <div className="border-t border-border/60">
      <div className="grid grid-cols-[72px_1fr_180px_112px] items-center px-4 py-3.5">
        <span className="font-mono text-sm text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 pr-4">
          <p className="text-sm font-medium leading-snug">{lesson.title}</p>
          {lesson.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {lesson.description}
            </p>
          )}
        </div>

        <div>
          <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400">
            {lessonCode}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1.5">
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
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border/40 bg-muted/20 px-4 py-3">
          <MaterialGroup
            badgeLabel={t.file.theoryBadge}
            badgeClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            groupCode={`${lessonCode}`}
            files={lesson.theoryUrls}
            uploading={uploading === "theory"}
            removingUrl={removing}
            onUpload={(file) => uploadFile("theory", file)}
            onRemove={(url) => removeFile("theory", url)}
          />
          <MaterialGroup
            badgeLabel={t.file.exerciseBadge}
            badgeClass="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            groupCode={`${lessonCode}`}
            files={lesson.exerciseUrls}
            uploading={uploading === "exercise"}
            removingUrl={removing}
            onUpload={(file) => uploadFile("exercise", file)}
            onRemove={(url) => removeFile("exercise", url)}
          />
        </div>
      )}
    </div>
  );
}
