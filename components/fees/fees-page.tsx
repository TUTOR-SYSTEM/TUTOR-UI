"use client";

import { useMemo, useState } from "react";

import { useTuitionActions } from "@/lib/services/tuition.service";
import { useClassActions } from "@/lib/services/class.service";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import type { TuitionRecord } from "@/types";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { TuitionsBoard } from "./tuitions-board";
import { CreateTuitionDialog } from "./create-tuition-dialog";
import { TuitionDetailDialog } from "./tuition-detail-dialog";
import { FamilyFeesPage } from "./family-fees-page";

type ClassOption = { id: string; name: string; code: string; tuition: string };

const TUTOR_USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Tạo hóa đơn",
    body: (
      <>
        Nhấn{" "}
        <span className="font-semibold text-[#0E9F8E] dark:text-[#2DD4BF]">+ Tạo hóa đơn</span> ở
        góc trên, chọn lớp, học sinh và số tiền cần thu.
      </>
    ),
  },
  {
    n: 2,
    title: "Lọc theo trạng thái",
    body: (
      <>
        Dùng các thẻ <span className="font-semibold text-[#0E9F8E] dark:text-[#2DD4BF]">Đã đóng</span>,{" "}
        <span className="font-semibold text-[#F97316]">Chưa đóng</span>,{" "}
        <span className="font-semibold text-red-500">Quá hạn</span> hoặc chọn
        tháng để lọc danh sách.
      </>
    ),
  },
  {
    n: 3,
    title: "Đánh dấu đã đóng",
    body: "Nhấn biểu tượng mắt ở mục chưa đóng để mở chi tiết, cập nhật trạng thái và ngày đóng.",
  },
  {
    n: 4,
    title: "Theo dõi tổng quan",
    body: "4 thẻ phía trên tổng hợp số đã thu, chưa thu, quá hạn và tỷ lệ thu của tháng đang chọn.",
  },
];

const TUTOR_USAGE_GUIDE_WARNING = (
  <>
    <span className="font-semibold text-[#E85D24] dark:text-[#FF9A6C]">Lưu ý:</span> Trạng thái
    hóa đơn không tự động chuyển sang{" "}
    <span className="font-semibold text-red-500">Quá hạn</span> — hãy vào chi
    tiết hóa đơn để cập nhật thủ công khi học sinh quá hạn đóng.
  </>
);

/* ─── Tutor / admin management page ─── */
function TutorFeesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [detailTuition, setDetailTuition] = useState<TuitionRecord | null>(
    null,
  );

  const {
    data: tuitionsPayload,
    isLoading,
    isError,
    error,
  } = useTuitionActions({ list: { limit: 100 } }).list;

  const tuitions = useMemo<TuitionRecord[]>(() => {
    return tuitionsPayload?.tuitions ?? [];
  }, [tuitionsPayload]);

  const { data: classesRaw } = useClassActions({
    list: { limit: 100 },
  }).list;

  const classes = useMemo<ClassOption[]>(() => {
    if (!classesRaw) return [];
    return (classesRaw?.classes ?? []) as ClassOption[];
  }, [classesRaw]);

  return (
    <div className="flex flex-col gap-5">
      <TuitionsBoard
        tuitions={tuitions}
        isLoading={isLoading}
        isError={isError}
        error={error}
        canCreate
        onCreateClick={() => setShowCreate(true)}
        onRowClick={setDetailTuition}
      />

      <UsageGuides
        steps={TUTOR_USAGE_GUIDE_STEPS}
        warning={TUTOR_USAGE_GUIDE_WARNING}
      />

      {/* ── Dialogs ── */}
      {showCreate && (
        <CreateTuitionDialog
          classes={classes}
          onClose={() => setShowCreate(false)}
        />
      )}
      {detailTuition && (
        <TuitionDetailDialog
          key={detailTuition.id}
          tuition={detailTuition}
          onClose={() => setDetailTuition(null)}
        />
      )}
    </div>
  );
}

/* ─── Role-aware entry ───────────────────────────────────────
 * PARENT / STUDENT → own tuition history + QR payment (read-only board)
 * TUTOR / ADMIN    → tuition collection dashboard (same board, editable)
 * ---------------------------------------------------------- */
export function FeesPage() {
  const role = useCurrentUserRole();

  if (role === "PARENT" || role === "STUDENT") {
    return <FamilyFeesPage />;
  }
  return <TutorFeesPage />;
}
