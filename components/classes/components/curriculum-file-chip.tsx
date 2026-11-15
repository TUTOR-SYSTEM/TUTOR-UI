"use client";

import { useState } from "react";
import { Download, FileText, Image, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { isImageFile } from "@/lib/file-utils";
import { Button } from "@/components/ui/button.ui";
import { ImagePreview } from "@/components/common/image-preview";
import { downloadStoredFile } from "@/lib/download-file";

export type LessonFile = { name: string; url: string; key: string };

/** Downloads via the backend proxy (auth-gated R2 objects can't be linked to directly). */
export const downloadFile = (key: string, name: string) => downloadStoredFile(key, name);

/** Downloadable file chip on the class curriculum page's lesson rows. */
export const FileChip = ({
  file,
  onRemove,
  removing,
}: {
  file: LessonFile;
  onRemove: () => void;
  removing: boolean;
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

  const handleClick = () => {
    if (isImage) {
      setPreviewOpen(true);
    } else {
      handleDownload();
    }
  };

  return (
    <>
      <span className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs">
        {isImage ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image className="size-3 text-emerald-500" />
        ) : (
          <FileText className="size-3 text-muted-foreground" />
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={handleClick}
          disabled={downloading}
          className="h-auto! w-auto! justify-start! gap-1! rounded-none! bg-transparent! p-0! text-xs! font-normal! text-foreground! hover:bg-transparent! hover:text-foreground! hover:underline!"
        >
          {file.name}
          {downloading ? (
            <Loader2 className="size-2.5 animate-spin" />
          ) : (
            <Download className="size-2.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onRemove}
          disabled={removing}
          aria-label="Xóa tệp"
          className="ml-0.5! size-4! rounded-none! bg-transparent! text-muted-foreground hover:bg-transparent! hover:text-red-500"
        >
          {removing ? (
            <Loader2 className="size-2.5 animate-spin" />
          ) : (
            <X className="size-2.5" />
          )}
        </Button>
      </span>

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
