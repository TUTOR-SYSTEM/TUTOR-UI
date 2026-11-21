"use client";

import { useSettingsCopy } from "@/hooks/useSettingsCopy.hook";
import { TagInput } from "@/components/ui/tag-input.ui";

/** Comma-separated subjects string shown as removable tags. Wire format stays a string. */
export function SubjectsInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { profile: copy } = useSettingsCopy();
  const tags = value.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <TagInput
      value={tags}
      onChange={(next) => onChange(next.join(", "))}
      placeholder={copy.subjectPlaceholder}
      addLabel={copy.subjectAdd}
      removeLabel={copy.subjectRemove}
    />
  );
}
