"use client";

import { HoverCard } from "@/components/ui/hover-card.ui";
import { Button } from "@/components/ui/button.ui";
import { useClassesCopy } from "@/hooks/useClassesCopy.hook";
import { currentPersonName } from "@/lib/format/person-name";

type MiniClassStudent = {
  id: string;
  code?: string | null;
  userCode?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

const STUDENT_BADGE_COLORS = [
  { bg: "#E4F6EF", text: "#0B7A6D" },
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#EDE9FE", text: "#6D28D9" },
  { bg: "#FFEDD5", text: "#C2410C" },
  { bg: "#FCE7F3", text: "#BE185D" },
  { bg: "#F3F4F6", text: "#374151" },
];

const MAX_STUDENT_BADGES = 3;

function studentLabel(s: MiniClassStudent, fallback: string) {
  return (
    currentPersonName(s.firstName, s.lastName) ||
    s.code ||
    s.userCode ||
    s.username ||
    fallback
  );
}

function StudentChip({
  student,
  index,
  fallback,
}: {
  student: MiniClassStudent;
  index: number;
  fallback: string;
}) {
  const c = STUDENT_BADGE_COLORS[index % STUDENT_BADGE_COLORS.length];
  return (
    <span
      className="inline-flex max-w-[140px] shrink-0 items-center truncate rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
      title={studentLabel(student, fallback)}
    >
      {studentLabel(student, fallback)}
    </span>
  );
}

/**
 * Học sinh của lớp trên một dòng: tối đa 3 chip nằm ngang. Nếu còn thừa, hiện
 * `+N học sinh`; hover (hoặc focus) vào đó mở popover liệt kê toàn bộ học sinh.
 */
export function ClassStudentBadges({
  students = [],
}: {
  students?: MiniClassStudent[];
}) {
  const { list } = useClassesCopy();
  const fallback = list.table.studentFallbackAbbr;

  if (students.length === 0) {
    return (
      <span className="text-xs text-[#9AAEA9] dark:text-muted-foreground">{list.table.noStudents}</span>
    );
  }

  const visible = students.slice(0, MAX_STUDENT_BADGES);
  const overflow = students.length - MAX_STUDENT_BADGES;

  return (
    <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
      {visible.map((s, i) => (
        <StudentChip key={s.id} student={s} index={i} fallback={fallback} />
      ))}
      {overflow > 0 && (
        <HoverCard
          side="bottom"
          align="start"
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-auto! shrink-0 px-1.5! py-0.5! text-xs font-medium text-[#0E9F8E] dark:text-[#2DD4BF]"
            >
              {list.table.studentOverflow(overflow)}
            </Button>
          }
        >
          <div className="flex flex-col items-start gap-1">
            {students.map((s, i) => (
              <StudentChip key={s.id} student={s} index={i} fallback={fallback} />
            ))}
          </div>
        </HoverCard>
      )}
    </div>
  );
}
