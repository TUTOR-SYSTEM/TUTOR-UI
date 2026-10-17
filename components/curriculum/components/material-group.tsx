"use client";

import { useRef } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { FileRow } from "./file-row";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import type { CurriculumLessonFile } from "@/types";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { canUploadFiles } from "@/lib/upload-policy";

type MaterialGroupProps = {
  badgeLabel: string;
  badgeClass: string;
  groupCode: string;
  files: CurriculumLessonFile[];
  uploading: boolean;
  removingUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: (url: string) => void;
};

export function MaterialGroup({
  badgeLabel,
  badgeClass,
  groupCode,
  files,
  uploading,
  removingUrl,
  onUpload,
  onRemove,
}: MaterialGroupProps) {
  const { detail: t } = useCurriculumCopy();
  const role = useCurrentUserRole();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={!canUploadFiles(role)}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            loading={uploading}
            className="shrink-0 gap-1.5 h-10! px-5! w-max text-xs font-medium"
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {t.file.addButton}
          </Button>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>

      {files.length > 0 && (
        <div className="divide-y divide-border/40 border-t border-border/40">
          {files.map((f) => (
            <FileRow
              key={f.key}
              file={f}
              code={groupCode}
              removing={removingUrl === f.url}
              onRemove={() => onRemove(f.url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
