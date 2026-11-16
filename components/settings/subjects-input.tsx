"use client";

import { TagInput } from "@/components/ui/tag-input.ui";

/** Comma-separated subjects string shown as removable tags. Wire format stays a string. */
export function SubjectsInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const tags = value.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <TagInput
      value={tags}
      onChange={(next) => onChange(next.join(", "))}
      placeholder="Tên môn học"
      addLabel="+ Thêm môn"
      removeLabel="Xoá"
    />
  );
}
