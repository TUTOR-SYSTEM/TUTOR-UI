"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button.ui";
import { useGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { cn } from "@/lib/utils";
import { useClassFormCopy } from "@/hooks/useClassFormCopy.hook";
import type { ApiResponse, ApiStudent, StudentsApiPayload } from "@/types";
import {
  StudentSearchDropdown,
  studentDisplayName,
} from "@/components/classes/components/student-search-dropdown";

export type TeachingType = "1-1" | "group";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  teachingType: TeachingType;
  onTeachingTypeChange: (type: TeachingType) => void;
  /** Only fetch while the host dialog is open. Gateway `GET /students` is ADMIN-only. */
  enabled: boolean;
};

export const MAX_GROUP_STUDENTS = 10;

/** Chọn loại lớp (1-1 / nhóm) + tìm học sinh qua dropdown. */
export function ClassStudentPicker({
  selectedIds,
  onChange,
  teachingType,
  onTeachingTypeChange,
  enabled,
}: Props) {
  const { common } = useClassFormCopy();
  const [search, setSearch] = useState("");
  // Tên học sinh đã chọn (cache theo id) để hiện chip kể cả khi kết quả tìm kiếm đã đổi.
  const [picked, setPicked] = useState<Record<string, string>>({});
  const max = teachingType === "1-1" ? 1 : MAX_GROUP_STUDENTS;

  const { data, isLoading } = useGet<
    ApiResponse<StudentsApiPayload>,
    StudentsApiPayload
  >(["class-student-picker", search], "/students", {
    params: { limit: 100, ...(search.trim() ? { search: search.trim() } : {}) },
    enabled,
    select: (raw) => unwrapApiData<StudentsApiPayload>(raw),
  });

  const toggle = (student: ApiStudent) => {
    const id = student.id;
    const name = studentDisplayName(student, common.studentFallbackName);
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
      return;
    }
    if (teachingType === "1-1") {
      setPicked({ [id]: name });
      onChange([id]);
      return;
    }
    if (selectedIds.length >= max) return;
    setPicked((p) => ({ ...p, [id]: name }));
    onChange([...selectedIds, id]);
  };

  const types = [
    {
      value: "1-1" as const,
      title: common.teachingType1on1Title,
      desc: common.teachingType1on1Desc,
    },
    {
      value: "group" as const,
      title: common.teachingTypeGroupTitle,
      desc: common.teachingTypeGroupDesc,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {teachingType === "1-1"
          ? common.studentsHintSingle
          : common.studentsHintGroup(max, selectedIds.length)}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {types.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant="ghost"
            onClick={() => {
              onTeachingTypeChange(opt.value);
              // Từ nhóm (2+ hs) sang 1 kèm 1: xóa hết lựa chọn cũ để chọn lại.
              if (opt.value === "1-1") {
                if (selectedIds.length > 1) setPicked({});
                onChange(selectedIds.length > 1 ? [] : selectedIds);
              }
            }}
            className={cn(
              "h-auto! w-full! flex-col items-start! justify-start! gap-0! rounded-xl! border-2! p-4! text-left font-normal",
              teachingType === opt.value
                ? "border-primary! bg-primary-light"
                : "border-border! bg-card hover:border-primary/40!",
            )}
          >
            <span
              className={cn(
                "text-sm font-semibold",
                teachingType === opt.value ? "text-primary" : "text-foreground",
              )}
            >
              {opt.title}
            </span>
            <span className="mt-0.5 text-xs whitespace-normal text-muted-foreground">
              {opt.desc}
            </span>
          </Button>
        ))}
      </div>

      <StudentSearchDropdown
        search={search}
        onSearchChange={setSearch}
        students={data?.students ?? []}
        loading={isLoading}
        selectedIds={selectedIds}
        names={picked}
        max={max}
        multi={teachingType === "group"}
        onToggle={toggle}
        onRemove={(id) => onChange(selectedIds.filter((s) => s !== id))}
        placeholder={common.studentsSearchPlaceholder}
        noResultsText={common.studentsNoResults}
        fallbackName={common.studentFallbackName}
      />
    </div>
  );
}
