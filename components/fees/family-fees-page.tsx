"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";

import { useTuitionActions } from "@/lib/services/tuition.service";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import type { TuitionRecord } from "@/types";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { TuitionsBoard } from "./tuitions-board";
import { TuitionPayDialog } from "./tuition-pay-dialog";

const FAMILY_USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Xem theo tháng",
    body: "Chọn tháng và năm ở góc trên để xem hóa đơn học phí của kỳ đó.",
  },
  {
    n: 2,
    title: "Nhận biết trạng thái",
    body: (
      <>
        Thẻ <span className="font-semibold text-[#0E9F8E]">Đã đóng</span>,{" "}
        <span className="font-semibold text-[#F97316]">Chưa đóng</span>,{" "}
        <span className="font-semibold text-red-500">Quá hạn</span> trên mỗi
        dòng cho biết tình trạng thanh toán.
      </>
    ),
  },
  {
    n: 3,
    title: "Thanh toán qua QR",
    body: (
      <>
        Nhấn biểu tượng mắt trên hóa đơn{" "}
        <span className="font-semibold text-[#F97316]">chưa đóng</span> để mở
        mã QR chuyển khoản.
      </>
    ),
  },
];

/**
 * PARENT / STUDENT học phí view — same board UI as the tutor page
 * (`TutorFeesPage`), scoped to the viewer's own tuition records:
 *   • STUDENT → their own user id is the `studentId` on `/tuitions`.
 *   • PARENT  → no direct API link to "my children" exists yet, so we read
 *     `/students` (every student row carries `parentId`, see
 *     `users.parent_id` on the backend) and keep the ones pointing back at
 *     this parent's user id.
 * Read-only: no create button, row click opens the QR pay/detail dialog
 * instead of the tutor's editable one.
 */
export function FamilyFeesPage() {
  const role = useCurrentUserRole();
  const isParent = role === "PARENT";
  const viewerId = useCurrentUserId();

  // Gateway `GET /students` is ADMIN-only and PARENT has no "my children"
  // endpoint, so PARENT cannot resolve child ids yet: no list request is made.
  const studentsLoading = false;

  const childIds = useMemo(() => {
    if (!isParent) return viewerId ? [viewerId] : [];
    return [];
  }, [isParent, viewerId]);

  const {
    data: tuitionsPayload,
    isLoading: tuitionsLoading,
    isError,
    error,
  } = useTuitionActions({ list: { limit: 100 } }).list;

  const tuitions = useMemo<TuitionRecord[]>(() => {
    const all = tuitionsPayload?.tuitions ?? [];
    return all.filter((t) => childIds.includes(t.studentId));
  }, [tuitionsPayload, childIds]);

  const [payTuition, setPayTuition] = useState<TuitionRecord | null>(null);

  const isLoading =
    tuitionsLoading || (isParent && (studentsLoading || !viewerId));

  if (isParent && !studentsLoading && childIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#E7EEEC] bg-white py-16 text-center">
        <Info className="size-8 text-[#C5D5D1]" />
        <p className="text-sm text-[#9AAEA9]">
          Chức năng xem học phí của học sinh liên kết hiện chưa khả dụng.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TuitionsBoard
        tuitions={tuitions}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRowClick={setPayTuition}
      />

      <UsageGuides steps={FAMILY_USAGE_GUIDE_STEPS} />

      {payTuition && (
        <TuitionPayDialog
          key={payTuition.id}
          tuition={payTuition}
          onClose={() => setPayTuition(null)}
        />
      )}
    </div>
  );
}
