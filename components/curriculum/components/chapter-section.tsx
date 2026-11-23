"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { LessonRow } from "./lesson-row";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import type { CurriculumChapter, CurriculumLesson } from "@/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import { DeleteIcon } from "@/components/ui/delete-icon.ui";
import { EditChapterDialog } from "@/components/curriculum/dialog/edit-chapter-dialog";
import {
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table.ui";

type ChapterSectionProps = {
  chapter: CurriculumChapter;
  index: number;
  curriculumCode: string;
  onDelete: () => void;
  onRefetch: () => void;
};

/** Một chương trong bảng chi tiết: dòng tiêu đề chương + các dòng bài học (cùng 1 tbody). */
export function ChapterSection({
  chapter,
  index,
  curriculumCode,
  onDelete,
  onRefetch,
}: ChapterSectionProps) {
  const { detail: t } = useCurriculumCopy();
  const [open, setOpen] = useState(true);
  const [addingLesson, setAddingLesson] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<CurriculumLesson | null>(null);
  const [confirmDeleteChapter, setConfirmDeleteChapter] = useState(false);

  const lessons = chapter.lessons ?? [];

  const handleAddLesson = async () => {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(
        `/curriculum/lessons?curriculumId=${chapter.curriculumId}&chapterId=${chapter.id}`,
        {
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          order: lessons.length + 1,
          theoryUrls: [],
          exerciseUrls: [],
        },
      );
      setNewTitle("");
      setNewDesc("");
      setAddingLesson(false);
      onRefetch();
      toast.success(t.chapter.addLessonSuccess);
    } catch (err) {
      toast.error(getErrorMessage(err, t.chapter.addLessonErrorFallback));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    setDeletingLesson(lessonId);
    try {
      await axiosInstance.delete(`/curriculum/lessons/${lessonId}`);
      onRefetch();
      toast.success(t.chapter.deleteLessonSuccess);
    } catch (err) {
      toast.error(getErrorMessage(err, t.chapter.deleteLessonErrorFallback));
    } finally {
      setDeletingLesson(null);
    }
  };

  const chapterLabel = t.chapter.label(index + 1, chapter.title);

  return (
    <>
      <TableBody>
        <TableRow className="border-t border-border/60 bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={3} className="px-4 py-3.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen((v) => !v)}
              className="justify-start gap-3 px-0 text-left"
            >
              {open ? (
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="text-sm font-bold">{chapterLabel}</span>
              <span className="text-xs text-muted-foreground">
                {t.chapter.lessonCountSuffix(lessons.length)}
              </span>
            </Button>
          </TableCell>
          <TableCell className="px-4 py-3.5">
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingChapter(true)}
                aria-label={t.chapter.editAriaLabel}
                className="rounded-lg border border-border bg-background text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-800/50 dark:hover:bg-emerald-950/30"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setConfirmDeleteChapter(true)}
                aria-label={t.chapter.deleteAriaLabel}
                className="rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400"
              >
                <DeleteIcon />
              </Button>
            </div>
          </TableCell>
        </TableRow>

        {open && (
          <>
            {lessons.map((lesson, lessonIdx) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={lessonIdx}
                lessonCode={`${curriculumCode}-${String(lesson.order).padStart(2, "0")}`}
                onDelete={() => setLessonToDelete(lesson)}
                onRefetch={onRefetch}
              />
            ))}

            {deletingLesson && (
              <TableRow>
                <TableCell colSpan={4} className="py-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            )}

            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="border-t border-border/40 px-4 py-3">
                {addingLesson ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      autoFocus
                      type="text"
                      placeholder={t.lesson.titlePlaceholder}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
                    />
                    <Input
                      type="text"
                      placeholder={t.lesson.descriptionPlaceholder}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddLesson}
                        disabled={!newTitle.trim() || submitting}
                        loading={submitting}
                        className="gap-1.5 bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        {t.lesson.addButton}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingLesson(false);
                          setNewTitle("");
                          setNewDesc("");
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {t.lesson.cancelButton}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddingLesson(true)}
                    className="px-0 text-xs font-semibold text-primary"
                  >
                    {t.chapter.addLessonButton}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          </>
        )}
      </TableBody>

      {editingChapter && (
        <EditChapterDialog
          chapter={chapter}
          onClose={() => setEditingChapter(false)}
          onSaved={onRefetch}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteChapter}
        onClose={() => setConfirmDeleteChapter(false)}
        onConfirm={() => {
          setConfirmDeleteChapter(false);
          onDelete();
        }}
        title={t.deleteChapterConfirm.title}
        confirmLabel={t.deleteChapterConfirm.confirmLabel}
        description={
          <>
            <p>
              {t.deleteChapterConfirm.descriptionPrefix}{" "}
              <span className="font-semibold text-foreground">
                {chapter.title}
              </span>
              ?
            </p>
            <p className="mt-1">{t.deleteChapterConfirm.warning}</p>
          </>
        }
      />

      <ConfirmDialog
        open={lessonToDelete !== null}
        onClose={() => setLessonToDelete(null)}
        onConfirm={() => {
          const lessonId = lessonToDelete?.id;
          setLessonToDelete(null);
          if (lessonId) handleDeleteLesson(lessonId);
        }}
        title={t.deleteLessonConfirm.title}
        confirmLabel={t.deleteLessonConfirm.confirmLabel}
        description={
          <>
            <p>
              {t.deleteLessonConfirm.descriptionPrefix}{" "}
              <span className="font-semibold text-foreground">
                {lessonToDelete?.title ?? ""}
              </span>
              ?
            </p>
            <p className="mt-1">{t.deleteLessonConfirm.warning}</p>
          </>
        }
      />
    </>
  );
}
