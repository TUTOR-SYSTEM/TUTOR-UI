"use client";

import { useState } from "react";
import { Download, FileText, Image, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { isImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { ImagePreview } from "@/components/common/image-preview";
import type { SessionFile } from "@/types";
import { downloadStoredFile } from "@/lib/download-file";

/** Downloads via the backend proxy (auth-gated R2 objects can't be linked to directly). */
const downloadFile = (key: string, name: string) => downloadStoredFile(key, name);

/** One theory/exercise material row on the tutor's session detail page. */
export const SessionMaterialFileRow = ({
  file,
  onDelete,
  deleting,
  disableDelete,
  canDelete = true,
}: {
  file: SessionFile;
  onDelete: () => void;
  deleting: boolean;
  disableDelete?: boolean;
  /** Tutor-only — students/parents can only download, not remove materials */
  canDelete?: boolean;
}) => {
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDownloading, setPreviewDownloading] = useState(false);

  const isImage = isImageFile(file.name);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(file.key, file.name);
    } catch (err) {
      toast.error(getErrorMessage(err, "Tải tệp thất bại"));
    } finally {
      setDownloading(false);
    }
  };

  const handlePreviewDownload = async () => {
    setPreviewDownloading(true);
    try {
      await downloadFile(file.key, file.name);
    } catch (err) {
      toast.error(getErrorMessage(err, "Tải tệp thất bại"));
    } finally {
      setPreviewDownloading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 py-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            isImage
              ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400",
          )}
        >
          {isImage ? (
            <Image className="size-4" />
          ) : (
            <FileText className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {isImage ? (
            <Button
              type="button"
              variant="link"
              onClick={() => setPreviewOpen(true)}
              className="h-auto! w-full! justify-start! p-0! text-sm! font-medium! text-foreground!"
            >
              <span className="min-w-0 truncate">{file.name}</span>
            </Button>
          ) : (
            <p className="truncate text-sm font-medium">{file.name}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">{file.key}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Tải xuống"
            disabled={downloading}
            onClick={handleDownload}
            className="text-muted-foreground hover:text-foreground"
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
          </Button>
          {canDelete && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Xóa"
              disabled={deleting || disableDelete}
              onClick={onDelete}
              className="text-muted-foreground hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </Button>
          )}
        </div>
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
};
