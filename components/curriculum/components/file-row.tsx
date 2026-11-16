"use client";

import { useState } from "react";
import { CornerDownRight, Download, FileText, Image, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { ImagePreview } from "@/components/common/image-preview";
import { getErrorMessage } from "@/lib/axios";
import { fetchStoredFileBlob, saveBlob } from "@/lib/download-file";
import { isImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import type { CurriculumLessonFile } from "@/types";

const downloadFile = async (key: string, name: string) => {
  saveBlob(await fetchStoredFileBlob(key), name);
};

type FileRowProps = {
  file: CurriculumLessonFile;
  code: string;
  onRemove: () => void;
  removing: boolean;
};

export function FileRow({ file, code, onRemove, removing }: FileRowProps) {
  const { detail: t } = useCurriculumCopy();
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDownloading, setPreviewDownloading] = useState(false);

  const isImage = isImageFile(file.name);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(file.key, file.name);
    } catch (err) {
      toast.error(getErrorMessage(err, t.file.downloadErrorFallback));
    } finally {
      setDownloading(false);
    }
  };

  const handlePreviewDownload = async () => {
    setPreviewDownloading(true);
    try {
      await downloadFile(file.key, file.name);
    } catch (err) {
      toast.error(getErrorMessage(err, t.file.downloadErrorFallback));
    } finally {
      setPreviewDownloading(false);
    }
  };

  const handleNameClick = () => {
    if (isImage) {
      setPreviewOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 py-2.5 pl-8 pr-4">
        <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />
        {isImage ? (
          <Image className="size-4 shrink-0 text-emerald-500" />
        ) : (
          <FileText className="size-4 shrink-0 text-muted-foreground" />
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={isImage ? handleNameClick : undefined}
          className={cn(
            "min-w-0 flex-1 justify-start gap-1.5 truncate text-left text-sm",
            isImage ? "hover:underline" : "cursor-default hover:bg-transparent",
          )}
        >
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            {code}
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDownload}
          disabled={downloading}
          aria-label={t.file.downloadAriaLabel}
          className="shrink-0"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={removing}
          aria-label={t.file.removeAriaLabel}
          className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400"
        >
          {removing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      </div>

      {previewOpen && (
        <ImagePreview
          src={file.url}
          name={file.name}
          onClose={() => setPreviewOpen(false)}
          onDownload={handlePreviewDownload}
          downloading={previewDownloading}
        />
      )}
    </>
  );
}
