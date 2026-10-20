"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useGet } from "@/lib/axios/query";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { TableRow, TableCell } from "@/components/ui/table.ui";
import { LessonRow, type Lesson } from "./curriculum-lesson-row";

/** Row of `GET /chapters?curriculumId=` (gateway `chapter.getAll` → `{ chapters, pagination }`). */
export type Chapter = {
  id: string;
  curriculumId: string;
  title: string;
  description: string | null;
  order?: number;
};

/** One chapter row (expands to its lessons) on the class curriculum page. */
export const ChapterRow = ({
  chapter,
  index,
  onDeleteChapter,
}: {
  chapter: Chapter;
  index: number;
  onDeleteChapter: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDesc, setNewLessonDesc] = useState("");
  const [submittingLesson, setSubmittingLesson] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<string | null>(null);
  const [confirmDeleteChapterOpen, setConfirmDeleteChapterOpen] =
    useState(false);
  const [confirmDeleteLessonId, setConfirmDeleteLessonId] = useState<
    string | null
  >(null);

  // Lessons are scoped by both curriculum and chapter (gateway `GET /curriculum/lessons`).
  const curriculumId = chapter.curriculumId;
  const lessonKey = ["lessons", curriculumId, chapter.id];
  const {
    data: lessonsRaw,
    isLoading: lessonsLoading,
    refetch: refetchLessons,
  } = useGet<unknown>(lessonKey, "/curriculum/lessons", {
    params: { curriculumId, chapterId: chapter.id, limit: 100 },
    enabled: open && !!curriculumId,
  });

  const lessons = useMemo<Lesson[]>(() => {
    if (!lessonsRaw) return [];
    return unwrapApiData<{ lessons: Lesson[] }>(lessonsRaw)?.lessons ?? [];
  }, [lessonsRaw]);

  const handleCreateLesson = async () => {
    if (!newLessonTitle.trim()) return;
    setSubmittingLesson(true);
    try {
      await axiosInstance.post(
        "/curriculum/lessons",
        {
          title: newLessonTitle.trim(),
          description: newLessonDesc.trim() || undefined,
          order: lessons.length,
          theoryUrls: [],
          exerciseUrls: [],
        },
        { params: { curriculumId, chapterId: chapter.id } },
      );
      setNewLessonTitle("");
      setNewLessonDesc("");
      setAddingLesson(false);
      await refetchLessons();
      toast.success("Đã thêm bài học");
    } catch (err) {
      toast.error(getErrorMessage(err, "Thêm bài thất bại"));
    } finally {
      setSubmittingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    setDeletingLesson(lessonId);
    try {
      await axiosInstance.delete(`/curriculum/lessons/${lessonId}`);
      await refetchLessons();
      toast.success("Đã xóa bài học");
    } catch (err) {
      toast.error(getErrorMessage(err, "Xóa bài thất bại"));
    } finally {
      setDeletingLesson(null);
    }
  };

  return (
    <Fragment>
      {/* Chapter row */}
      <TableRow
        className="cursor-pointer bg-muted/20 hover:bg-muted/40"
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell className="py-3.5 pl-4 align-middle">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="px-4 py-3.5 align-middle" colSpan={2}>
          <span className="font-semibold">
            Chương {index + 1} · {chapter.title}
          </span>
          {open && !lessonsLoading && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {lessons.length} bài
            </span>
          )}
        </TableCell>
        <TableCell
          className="px-4 py-3.5 text-center align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmDeleteChapterOpen(true)}
            aria-label="Xóa chương"
            className="rounded-md! border! border-rose-200! bg-rose-50! text-rose-500! hover:bg-rose-100! dark:border-rose-800/50! dark:bg-rose-950/30! dark:text-rose-400!"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TableCell>
      </TableRow>

      {/* Lesson rows */}
      {open && lessonsLoading && (
        <TableRow>
          <TableCell colSpan={4} className="py-6 text-center">
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
          </TableCell>
        </TableRow>
      )}
      {open &&
        !lessonsLoading &&
        lessons.map((lesson, idx) => (
          <LessonRow
            key={lesson.id}
            lesson={
              deletingLesson === lesson.id
                ? { ...lesson, theoryUrls: [], exerciseUrls: [] }
                : lesson
            }
            index={idx}
            onDelete={() => setConfirmDeleteLessonId(lesson.id)}
            onRefetch={() => refetchLessons()}
          />
        ))}

      {/* Add lesson row */}
      {open && (
        <TableRow className="bg-background">
          <TableCell colSpan={4} className="py-2.5 pl-10">
            {addingLesson ? (
              <div className="flex flex-col gap-2 pr-4">
                <Input
                  autoFocus
                  type="text"
                  placeholder="Tên bài học..."
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateLesson()}
                  className="h-8! text-sm"
                />
                <Input
                  type="text"
                  placeholder="Mô tả (tuỳ chọn)..."
                  value={newLessonDesc}
                  onChange={(e) => setNewLessonDesc(e.target.value)}
                  className="h-8! text-sm"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleCreateLesson}
                    disabled={!newLessonTitle.trim() || submittingLesson}
                    className="h-auto! w-auto! gap-1.5! rounded-lg! bg-emerald-600! px-3! py-1.5! text-xs! font-semibold! text-white! hover:bg-emerald-700!"
                  >
                    {submittingLesson && (
                      <Loader2 className="size-3 animate-spin" />
                    )}
                    Thêm
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAddingLesson(false);
                      setNewLessonTitle("");
                      setNewLessonDesc("");
                    }}
                    className="h-auto! w-auto! bg-transparent! p-0! text-xs! text-muted-foreground hover:bg-transparent! hover:text-foreground"
                  >
                    Huỷ
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="link"
                onClick={() => setAddingLesson(true)}
                className="h-auto! w-auto! gap-1.5! p-0! text-sm! font-medium! text-emerald-600! hover:text-emerald-700! hover:no-underline!"
              >
                <Plus className="size-4" />
                Thêm bài vào Chương {index + 1}
              </Button>
            )}
          </TableCell>
        </TableRow>
      )}

      <ConfirmDialog
        open={confirmDeleteChapterOpen}
        onClose={() => setConfirmDeleteChapterOpen(false)}
        onConfirm={() => {
          setConfirmDeleteChapterOpen(false);
          onDeleteChapter();
        }}
        title="Xóa chương"
        confirmLabel="Xóa chương"
        description={
          <>
            <p>
              Xóa chương{" "}
              <span className="font-semibold text-foreground">
                {chapter.title}
              </span>
              ?
            </p>
            <p className="mt-1">
              Tất cả bài học trong chương này sẽ bị xóa và không thể hoàn tác.
            </p>
          </>
        }
      />

      <ConfirmDialog
        open={!!confirmDeleteLessonId}
        onClose={() => setConfirmDeleteLessonId(null)}
        onConfirm={() => {
          if (confirmDeleteLessonId) handleDeleteLesson(confirmDeleteLessonId);
          setConfirmDeleteLessonId(null);
        }}
        title="Xóa bài học"
        confirmLabel="Xóa bài"
        description="Xóa bài học này? Hành động này không thể hoàn tác."
      />
    </Fragment>
  );
};
