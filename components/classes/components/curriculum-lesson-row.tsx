"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { TableRow, TableCell } from "@/components/ui/table.ui";
import { FileChip, type LessonFile } from "./curriculum-file-chip";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { canUploadFiles } from "@/lib/upload-policy";

export type Lesson = {
  id: string;
  curriculumId: string;
  title: string;
  description: string | null;
  theoryUrls: LessonFile[];
  exerciseUrls: LessonFile[];
  order: number;
  createdAt: string;
  updatedAt: string;
};

/** One lesson row (+ theory/exercise upload rows) inside a chapter, on the class curriculum page. */
export const LessonRow = ({
  lesson,
  index,
  onDelete,
  onRefetch,
}: {
  lesson: Lesson;
  index: number;
  onDelete: () => void;
  onRefetch: () => void;
}) => {
  const theoryRef = useRef<HTMLInputElement>(null);
  const exerciseRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"theory" | "exercise" | null>(
    null,
  );
  const [removing, setRemoving] = useState<string | null>(null);
  const role = useCurrentUserRole();

  const uploadFile = useCallback(
    async (type: "theory" | "exercise", file: File) => {
      setUploading(type);
      try {
        const form = new FormData();
        form.append("file", file);
        await axiosInstance.post(
          `/curriculum/lessons/${lesson.id}/${type === "theory" ? "theory" : "exercises"}`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        onRefetch();
        toast.success("Đã tải tệp lên");
      } catch (err) {
        toast.error(getErrorMessage(err, "Tải tệp thất bại"));
      } finally {
        setUploading(null);
      }
    },
    [lesson.id, onRefetch],
  );

  const removeFile = useCallback(
    async (type: "theory" | "exercise", url: string) => {
      setRemoving(url);
      try {
        await axiosInstance.delete(
          `/lesson/${lesson.id}/${type === "theory" ? "add-theory" : "exercises"}`,
          { data: { url } },
        );
        onRefetch();
        toast.success("Đã xóa tệp");
      } catch (err) {
        toast.error(getErrorMessage(err, "Xóa tệp thất bại"));
      } finally {
        setRemoving(null);
      }
    },
    [lesson.id, onRefetch],
  );

  return (
    <>
      <TableRow className="hover:bg-muted/20">
        <TableCell className="py-4 pl-10 align-top text-sm text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </TableCell>
        <TableCell className="px-4 py-4 align-top" colSpan={2}>
          <p className="font-medium leading-5">{lesson.title}</p>
          {lesson.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {lesson.description}
            </p>
          )}
        </TableCell>
        <TableCell className="px-4 py-4 text-center align-top">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Xóa bài"
            className="rounded-md! border! border-rose-200! bg-rose-50! text-rose-500! hover:bg-rose-100! dark:border-rose-800/50! dark:bg-rose-950/30! dark:text-rose-400!"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TableCell>
      </TableRow>

      {/* Theory files */}
      <TableRow className="bg-muted/5">
        <TableCell />
        <TableCell colSpan={3} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Bài giảng
            </span>
            {lesson.theoryUrls.map((f) => (
              <FileChip
                key={f.url}
                file={f}
                removing={removing === f.url}
                onRemove={() => removeFile("theory", f.url)}
              />
            ))}
            <Input
              ref={theoryRef}
              type="file"
              className="hidden"
              disabled={!canUploadFiles(role)}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile("theory", f);
                if (theoryRef.current) theoryRef.current.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => theoryRef.current?.click()}
              disabled={uploading === "theory"}
              className="h-auto! w-auto! gap-1! rounded-lg! px-2.5! py-1! text-xs! font-medium!"
            >
              {uploading === "theory" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Upload className="size-3" />
              )}
              Tải lên
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Exercise files */}
      <TableRow className="bg-muted/5">
        <TableCell />
        <TableCell colSpan={3} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Bài tập
            </span>
            {lesson.exerciseUrls.map((f) => (
              <FileChip
                key={f.url}
                file={f}
                removing={removing === f.url}
                onRemove={() => removeFile("exercise", f.url)}
              />
            ))}
            <Input
              ref={exerciseRef}
              type="file"
              className="hidden"
              disabled={!canUploadFiles(role)}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile("exercise", f);
                if (exerciseRef.current) exerciseRef.current.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => exerciseRef.current?.click()}
              disabled={uploading === "exercise"}
              className="h-auto! w-auto! gap-1! rounded-lg! px-2.5! py-1! text-xs! font-medium!"
            >
              {uploading === "exercise" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Upload className="size-3" />
              )}
              Tải lên
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
};
