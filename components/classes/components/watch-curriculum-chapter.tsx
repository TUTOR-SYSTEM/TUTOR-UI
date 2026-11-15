import { FileText, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { axiosInstance } from "@/lib/axios";
import type { SessionFile } from "@/types";
import { downloadStoredFile } from "@/lib/download-file";

export type WatchMaterialLesson = {
  id: string;
  title: string;
  order: number | null;
  chapterId: string | null;
  chapterTitle: string | null;
  theoryUrls: SessionFile[] | null;
  exerciseUrls: SessionFile[] | null;
};

const fileExt = (name: string) => (name.split(".").pop() ?? "").toUpperCase();

const FILE_ICON: Record<string, { icon: LucideIcon; className: string }> = {
  PDF: {
    icon: FileText,
    className: "bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400",
  },
  DOC: {
    icon: FileText,
    className: "bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400",
  },
  DOCX: {
    icon: FileText,
    className: "bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400",
  },
  MP4: {
    icon: Video,
    className:
      "bg-violet-50 text-violet-500 dark:bg-violet-950/30 dark:text-violet-400",
  },
  MOV: {
    icon: Video,
    className:
      "bg-violet-50 text-violet-500 dark:bg-violet-950/30 dark:text-violet-400",
  },
};
const DEFAULT_FILE_ICON = {
  icon: FileText,
  className: "bg-muted text-muted-foreground",
};

/** Downloads via the backend proxy (auth-gated R2 objects can't be linked to directly). */
const downloadFile = (key: string, name: string) => downloadStoredFile(key, name);

/** One curriculum chapter (title + its lessons/files) on the class watch page's "Chương trình học" card. */
export const WatchCurriculumChapter = ({
  chapter,
}: {
  chapter: { title: string; lessons: WatchMaterialLesson[] };
}) => (
  <div className="px-5 py-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {chapter.title}
    </p>
    <div className="mt-2.5 space-y-2">
      {chapter.lessons.map((lesson) => {
        const files = [
          ...(lesson.theoryUrls ?? []),
          ...(lesson.exerciseUrls ?? []),
        ];
        return (
          <div
            key={lesson.id}
            className="rounded-lg border bg-muted/20 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{lesson.title}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {files.length} tệp
              </span>
            </div>
            {files.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {files.map((f) => {
                  const meta = FILE_ICON[fileExt(f.name)] ?? DEFAULT_FILE_ICON;
                  const Icon = meta.icon;
                  return (
                    <Button
                      key={f.key}
                      type="button"
                      variant="outline"
                      aria-label={`Tải xuống ${f.name}`}
                      onClick={() => downloadFile(f.key, f.name)}
                      className="h-auto! w-max! max-w-full gap-1.5 rounded-md px-2 py-1 text-xs font-normal text-muted-foreground hover:text-foreground"
                    >
                      <Icon className="size-3" />
                      <span className="max-w-32 truncate">{f.name}</span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
