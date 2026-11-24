import { Check} from "lucide-react";

import { cn } from "@/lib/utils";
import { DeleteIcon } from "@/components/ui/delete-icon.ui";

export type MarkerType = "wrong" | "correct";

/** UI-only markup — has no backing field on `ExerciseDetail`, so it resets on reload. */
export type Annotation = {
  id: string;
  number: number;
  type: MarkerType;
  x: number;
  y: number;
  note: string;
};

export const MARKER_STYLE: Record<MarkerType, { dot: string; tag: string }> = {
  wrong: { dot: "bg-orange-500", tag: "bg-orange-500 text-white" },
  correct: { dot: "bg-primary", tag: "bg-primary text-primary-foreground" },
};

/** One annotation pin on the exercise grading workspace's submission image. */
export const AnnotationMarker = ({
  annotation,
  editable,
  isEditing,
  onStartEdit,
  onChangeNote,
  onCommit,
  onDelete,
}: {
  annotation: Annotation;
  editable: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onChangeNote: (v: string) => void;
  onCommit: () => void;
  onDelete: () => void;
}) => {
  const style = MARKER_STYLE[annotation.type];
  return (
    <div
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
      style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ring-2 ring-white",
          style.dot,
        )}
      >
        {annotation.number}
      </span>
      {isEditing ? (
        <div className="flex items-center gap-1 rounded-full bg-white dark:bg-card p-1 shadow-lg ring-1 ring-border">
          <input
            autoFocus
            value={annotation.note}
            onChange={(e) => onChangeNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") onCommit();
            }}
            placeholder={
              annotation.type === "wrong" ? "Ghi lỗi sai…" : "Ghi chú…"
            }
            className="h-6 w-36 rounded-full border-0 bg-transparent px-2 text-xs text-foreground outline-none"
          />
          <button
            type="button"
            onClick={onCommit}
            className="shrink-0 rounded-full p-1 text-emerald-600 hover:bg-emerald-50"
          >
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-full p-1 text-rose-500 hover:bg-rose-50"
          >
            <DeleteIcon />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={editable ? onStartEdit : undefined}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap shadow-md",
            style.tag,
            editable && "cursor-pointer hover:opacity-90",
          )}
        >
          {annotation.type === "wrong"
            ? `Sai${annotation.note ? `: ${annotation.note}` : ""}`
            : annotation.note || "Đúng"}
        </button>
      )}
    </div>
  );
};
