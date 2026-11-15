"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";

export type TagInputProps = {
  value: readonly string[];
  onChange: (next: string[]) => void;
  /** Placeholder for the inline input shown after clicking "add". */
  placeholder?: string;
  /** Label of the "add" button. */
  addLabel?: string;
  /** Prefix for the remove button's aria-label, e.g. "Xoá" → "Xoá Toán". */
  removeLabel?: string;
  disabled?: boolean;
};

/**
 * Removable tag chips plus an inline input to append a new tag. Duplicates and blanks are ignored.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  addLabel = "+ Thêm",
  removeLabel = "Xoá",
  disabled,
}: TagInputProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-accent-foreground"
        >
          {tag}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            aria-label={`${removeLabel} ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="size-4! text-accent-foreground/60 hover:text-accent-foreground"
          >
            <X className="size-3" />
          </Button>
        </span>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          className="h-7! w-32 rounded-full px-3 text-xs"
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setAdding(true)}
          className="h-auto! w-auto! rounded-full border-dashed px-3 py-1 text-xs font-medium text-primary"
        >
          {addLabel}
        </Button>
      )}
    </div>
  );
}
