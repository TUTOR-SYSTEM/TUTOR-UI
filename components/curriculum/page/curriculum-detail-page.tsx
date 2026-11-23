"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Hash,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { useGet } from "@/lib/axios/query";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import { ChapterSection } from "../components/chapter-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import { CreateChapterDialog } from "../dialog/create-chapter-dialog";
import type { CurriculumDetail, CurriculumChapter } from "@/types";

/* ─── Main page ──────────────────────────────────────────── */

type Props = { frameworkId: string };

export const CurriculumDetailPage = ({ frameworkId }: Props) => {
  const copy = useCurriculumCopy();
  const t = copy.detail;
  const [showCreateChapter, setShowCreateChapter] = useState(false);

  const frameworkKey = useMemo(
    () => ["curriculum-framework", frameworkId],
    [frameworkId],
  );

  const {
    data: frameworkRaw,
    isLoading,
    error,
    refetch,
  } = useGet<unknown>(frameworkKey, `/curriculum/${frameworkId}`);

  const framework = useMemo<CurriculumDetail | null>(() => {
    if (!frameworkRaw) return null;
    const unwrapped = unwrapApiData<CurriculumDetail>(frameworkRaw);
    if (!unwrapped || !("subject" in unwrapped)) return null;
    return unwrapped as CurriculumDetail;
  }, [frameworkRaw]);

  const chapters = useMemo<CurriculumChapter[]>(
    () => framework?.chapters ?? [],
    [framework],
  );

  const handleDeleteChapter = useCallback(
    async (chapterId: string) => {
      try {
        await axiosInstance.delete(`/chapters/${chapterId}`);
        refetch();
        toast.success(t.deleteChapterToastSuccess);
      } catch (err) {
        toast.error(getErrorMessage(err, t.deleteChapterToastErrorFallback));
      }
    },
    [refetch, t],
  );

  const displayTitle = framework
    ? `${framework.subject}${framework.grade ? copy.table.gradePrefix(framework.grade) : ""}`
    : "";

  return (
    <div className="space-y-6 pb-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/curriculum"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t.breadcrumbBack}
        </Link>
        <span>/</span>
        {isLoading ? (
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        ) : (
          <span className="font-medium text-foreground">{displayTitle}</span>
        )}
      </nav>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-64 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-muted" />
            <div className="h-5 w-24 rounded-full bg-muted" />
          </div>
        </div>
      ) : framework ? (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Hash className="size-3" />
              {framework.code}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Calendar className="size-3" />
              {framework.courseTime}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              <BookOpen className="size-3" />
              {t.header.chapterCountSuffix(chapters.length)}
            </span>
          </div>
          {framework.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {framework.description}
            </p>
          )}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(error, t.error.loadFallback)}
          </p>
          <Button
            type="button"
            variant="link"
            onClick={() => refetch()}
            className="mt-3 text-sm font-medium text-emerald-600 hover:underline"
          >
            {t.error.retry}
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <colgroup>
              <col style={{ width: 72 }} />
              <col />
              <col style={{ width: 180 }} />
              <col style={{ width: 150 }} />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>{t.table.stt}</TableHead>
                <TableHead>{t.table.lessonName}</TableHead>
                <TableHead>{t.table.lessonCode}</TableHead>
                <TableHead className="text-right">{t.table.actions}</TableHead>
              </TableRow>
            </TableHeader>

            {chapters.length === 0 ? (
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <BookOpen className="size-10 text-muted-foreground/40" />
                      <p className="mt-3 text-sm font-medium text-muted-foreground">
                        {t.empty.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.empty.hint}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              chapters.map((chapter, idx) => (
                <ChapterSection
                  key={chapter.id}
                  chapter={chapter}
                  index={idx}
                  curriculumCode={framework?.code ?? ""}
                  onDelete={() => handleDeleteChapter(chapter.id)}
                  onRefetch={() => refetch()}
                />
              ))
            )}
          </Table>

          <div className="border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateChapter(true)}
              className="flex w-full items-center justify-center gap-2 rounded-b-2xl bg-emerald-50/60 py-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              <Plus className="size-4" />
              {t.header.createChapterButton}
            </Button>
          </div>
        </div>
      )}

      {showCreateChapter && (
        <CreateChapterDialog
          open={showCreateChapter}
          frameworkId={frameworkId}
          order={chapters.length + 1}
          onClose={() => setShowCreateChapter(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
};
