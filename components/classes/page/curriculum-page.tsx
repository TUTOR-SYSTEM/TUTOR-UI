"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Loader2, Plus } from "lucide-react";

import { toast } from "sonner";

import { useGet } from "@/lib/axios/query";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table.ui";
import { ChapterRow, type Chapter } from "../components/curriculum-chapter-row";
import { CreateClassChapterDialog } from "../dialog/create-class-chapter-dialog";

/* ─── Types ─────────────────────────────────────────────── */

/* ─── Main page ──────────────────────────────────────────── */

type CurriculumPageProps = { classId: string };

export const CurriculumPage = ({ classId }: CurriculumPageProps) => {
  const [showCreateChapter, setShowCreateChapter] = useState(false);

  // Chapters belong to the class's curriculum, so read it from the class first.
  const { data: classRaw, isLoading: classLoading } = useGet<unknown>(
    ["class-detail", classId],
    `/classes/${classId}`,
    { enabled: !!classId },
  );
  const curriculumId = useMemo(() => {
    if (!classRaw) return "";
    return unwrapApiData<{ curriculumId?: string | null }>(classRaw)?.curriculumId ?? "";
  }, [classRaw]);

  const chapterKey = useMemo(
    () => ["curriculum-chapters", curriculumId],
    [curriculumId],
  );

  const {
    data: chaptersRaw,
    isLoading: chaptersLoading,
    error,
    refetch: refetchChapters,
  } = useGet<unknown>(chapterKey, "/chapters", {
    params: { curriculumId, limit: 100 },
    enabled: !!curriculumId,
  });
  const isLoading = classLoading || chaptersLoading;

  const chapters = useMemo<Chapter[]>(() => {
    if (!chaptersRaw) return [];
    return unwrapApiData<{ chapters: Chapter[] }>(chaptersRaw)?.chapters ?? [];
  }, [chaptersRaw]);

  const handleDeleteChapter = useCallback(
    async (chapterId: string) => {
      try {
        await axiosInstance.delete(`/chapters/${chapterId}`);
        await refetchChapters();
        toast.success("Đã xóa chương");
      } catch (err) {
        toast.error(getErrorMessage(err, "Xóa chương thất bại"));
      }
    },
    [refetchChapters],
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/classes"
          className="transition-colors hover:text-foreground"
        >
          Quản lý lớp học
        </Link>
        <span>/</span>
        <Link
          href={`/classes/${classId}`}
          className="transition-colors hover:text-foreground"
        >
          Chi tiết lớp
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          Chương trình bài giảng
        </span>
      </nav>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Chương trình bài giảng
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400">
              <BookOpen className="size-3" />
              {chapters.length} chương ·{" "}
              {chapters.length === 0 ? "Chưa có bài" : ""}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý lộ trình bài giảng, tài liệu lý thuyết và bài tập.
          </p>
        </div>
        <Button
          size={"lg"}
          type="button"
          onClick={() => setShowCreateChapter(true)}
          className="flex h-auto! w-40! items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="size-4" />
          Tạo chương mới
        </Button>
      </div>

      {/* Curriculum table */}
      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(error, "Không thể tải chương trình")}
            </p>
            <Button
              type="button"
              variant="link"
              onClick={() => refetchChapters()}
              className="mt-3 h-auto! w-auto! p-0! text-sm! font-medium!"
            >
              Thử lại
            </Button>
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Chưa có chương nào
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nhấn &ldquo;Tạo chương mới&rdquo; để bắt đầu xây dựng lộ trình.
            </p>
          </div>
        ) : (
          <Table className="min-w-[560px] text-sm">
            <TableHeader className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <TableRow>
                <TableHead className="w-10 py-3 pl-4" />
                <TableHead className="px-4 py-3" colSpan={2}>
                  Tên bài / Chương
                </TableHead>
                <TableHead className="w-20 px-4 py-3 text-center">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters.map((chapter, idx) => (
                <ChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  index={idx}
                  onDeleteChapter={() => handleDeleteChapter(chapter.id)}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {/* Footer add chapter */}
        {!isLoading && !error && (
          <div className="border-t p-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateChapter(true)}
              className={cn(
                "flex h-auto! w-full! items-center justify-center gap-2 rounded-lg border-dashed py-3 text-sm font-medium text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
              )}
            >
              <Plus className="size-4" />
              Tạo chương mới
            </Button>
          </div>
        )}
      </div>

      {/* Create chapter dialog */}
      {showCreateChapter && (
        <CreateClassChapterDialog
          curriculumId={curriculumId}
          onClose={() => setShowCreateChapter(false)}
          onCreated={() => refetchChapters()}
        />
      )}
    </div>
  );
};
