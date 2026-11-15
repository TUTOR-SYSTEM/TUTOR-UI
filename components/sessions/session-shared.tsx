"use client";

import { useState } from "react";
import { Download, FileText, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { cn } from "@/lib/utils";
import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { isImageFile } from "@/lib/file-utils";
import { ImagePreview } from "@/components/common/image-preview";
import type {
  ExerciseStatus,
  SessionFile,
  SessionStatus,
} from "@/types/session.types";
import { downloadStoredFile } from "@/lib/download-file";

/* ─── Session status ─── */
export const SESSION_STATUS_META: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: "Sắp diễn ra",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400",
  },
  ONGOING: {
    label: "Đang diễn ra",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Đã kết thúc",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Đã hủy",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400",
  },
  POSTPONED: {
    label: "Tạm hoãn",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  },
};

/* ─── Submission (exercise) status ─── */
export const EXERCISE_STATUS_META: Record<
  ExerciseStatus | "NOT_SUBMITTED",
  { label: string; className: string }
> = {
  NOT_SUBMITTED: {
    label: "Chưa nộp",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  },
  SUBMITTED: {
    label: "Đã nộp — chờ chấm",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400",
  },
  GRADED: {
    label: "Đã chấm điểm",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  RESUBMIT: {
    label: "Cần nộp lại",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400",
  },
};

export const StatusBadge = ({
  label,
  className,
}: {
  label: string;
  className: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      className,
    )}
  >
    {label}
  </span>
);

/* ─── Date/time formatters (vi-VN) ─── */
export const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};

export const fmtTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export const fmtDateTime = (iso?: string | null) => {
  const date = fmtDate(iso);
  const time = fmtTime(iso);
  return time ? `${date} · ${time}` : date;
};

/** Downloads via the backend proxy (auth-gated R2 objects can't be linked to directly). */
export const downloadFile = (key: string, name: string) => downloadStoredFile(key, name);

/* ─── Downloadable file row (read-only) ─── */
export const DownloadFileRow = ({ file }: { file: SessionFile }) => {
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
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5">
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
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="truncate text-sm font-medium hover:underline"
            >
              {file.name}
            </button>
          ) : (
            <p className="truncate text-sm font-medium">{file.name}</p>
          )}
        </div>
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
