"use client";

import { useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { isImageFile } from "@/lib/file-utils";
import { ImagePreview } from "@/components/common/image-preview";
import { downloadStoredFile } from "@/lib/download-file";

export type MaterialFile = { name: string; url: string; key: string };

/** Downloads via the backend proxy (auth-gated R2 objects can't be linked to directly). */
const downloadFile = (key: string, name: string) => downloadStoredFile(key, name);

/** Read-only file row for the class materials (theory/exercise) page. */
export const MaterialFileRow = ({ file }: { file: MaterialFile }) => {
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
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

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:bg-muted/40">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          {isImage ? (
            <ImageIcon className="size-4 text-emerald-500" />
          ) : (
            <FileText className="size-4 text-muted-foreground" />
          )}
        </span>
        <button
          type="button"
          onClick={() => (isImage ? setPreviewOpen(true) : handleDownload())}
          className="flex-1 truncate text-left text-sm font-medium hover:underline"
          title={file.name}
        >
          {file.name}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          aria-label="Tải xuống"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
        </button>
      </div>

      {previewOpen && (
        <ImagePreview
          src={file.url}
          name={file.name}
          onClose={() => setPreviewOpen(false)}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </>
  );
};
