"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Eye,
  Loader2,
  Plus,
  Search,
} from "lucide-react";

import { getErrorMessage } from "@/lib/axios";
import type { TuitionRecord, TuitionStatus } from "@/types";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Select, type SelectOption } from "@/components/ui/select.ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table.ui";
import { Pagination } from "@/components/ui/pagination.ui";

/* ─── Types ─── */
type FeeStatus = "paid" | "unpaid" | "overdue";

const STATUS_TO_DISPLAY: Record<TuitionStatus, FeeStatus> = {
  PAID: "paid",
  UNPAID: "unpaid",
  OVERDUE: "overdue",
};

type StatusFilter = "all" | FeeStatus;

const STATUS_TABS: {
  value: StatusFilter;
  label: string;
  activeStyle?: string;
}[] = [
  { value: "all", label: "Tất cả" },
  {
    value: "paid",
    label: "Đã đóng",
    activeStyle: "border-[#0E9F8E] text-[#0E9F8E]",
  },
  {
    value: "unpaid",
    label: "Chưa đóng",
    activeStyle: "border-[#F97316] text-[#F97316]",
  },
  {
    value: "overdue",
    label: "Quá hạn",
    activeStyle: "border-red-500 text-red-500",
  },
];

const STATUS_BADGE: Record<
  FeeStatus,
  { label: string; bg: string; text: string }
> = {
  paid: { label: "Đã đóng", bg: "#E4F6EF", text: "#0B7A6D" },
  unpaid: { label: "Chưa đóng", bg: "#FFF0E6", text: "#E85D24" },
  overdue: { label: "Quá hạn", bg: "#FEE2E2", text: "#DC2626" },
};

const AVATAR_COLORS = [
  "#0E9F8E",
  "#F97316",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#059669",
  "#D97706",
  "#6366F1",
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
/** Current year and the 3 years before it (was a hard-coded 2024–2027 range). */
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];
const PAGE_SIZE = 5;

const moneyFmt = (v: number) => v.toLocaleString("vi-VN") + " đ";
const millionsFmt = (v: number) => {
  const m = v / 1_000_000;
  return Number.isInteger(m)
    ? `${m},0tr`
    : `${m.toFixed(1).replace(".", ",")}tr`;
};

function initials(firstName: string, lastName: string) {
  return ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase() || "?";
}

function fmtDueDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
}

function fmtPeriod(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
}

const MONTH_OPTIONS: SelectOption[] = [
  { label: "Tất cả", value: "0" },
  ...MONTHS.map((m) => ({ label: `Tháng ${m}`, value: String(m) })),
];

const YEAR_OPTIONS: SelectOption[] = YEARS.map((y) => ({
  label: String(y),
  value: String(y),
}));

/**
 * Shared học phí board — stat cards + status filter + table + pagination.
 * Used identically by the tutor management page and the parent/student
 * read-only view so both roles see the same UI; only the create button and
 * the row-click action (edit vs pay) differ per caller.
 */
export type TuitionsBoardProps = {
  tuitions: TuitionRecord[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRowClick: (tuition: TuitionRecord) => void;
  canCreate?: boolean;
  onCreateClick?: () => void;
};

export const TuitionsBoard = ({
  tuitions,
  isLoading,
  isError,
  error,
  onRowClick,
  canCreate = false,
  onCreateClick,
}: TuitionsBoardProps) => {
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  /* Records without a due date aren't tied to any period, so they always show. */
  const periodTuitions = useMemo(
    () =>
      tuitions.filter((t) => {
        if (month === 0) return true;
        if (!t.dueDate) return true;
        const d = new Date(t.dueDate);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      }),
    [tuitions, month, year],
  );

  const filtered = useMemo(() => {
    let list = periodTuitions;
    if (statusFilter !== "all") {
      list = list.filter((t) => STATUS_TO_DISPLAY[t.status] === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => {
        const name =
          `${t.student.firstName} ${t.student.lastName}`.toLowerCase();
        return name.includes(q) || t.class.code.toLowerCase().includes(q);
      });
    }
    return list;
  }, [periodTuitions, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const stats = useMemo(() => {
    const paid = periodTuitions.filter((t) => t.status === "PAID");
    const unpaid = periodTuitions.filter((t) => t.status === "UNPAID");
    const overdue = periodTuitions.filter((t) => t.status === "OVERDUE");
    const total = periodTuitions.reduce((s, t) => s + Number(t.amount), 0);
    const collected = paid.reduce((s, t) => s + Number(t.amount), 0);
    return {
      collectedAmount: collected,
      collectedCount: paid.length,
      totalCount: periodTuitions.length,
      unpaidAmount: unpaid.reduce((s, t) => s + Number(t.amount), 0),
      unpaidCount: unpaid.length,
      overdueAmount: overdue.reduce((s, t) => s + Number(t.amount), 0),
      overdueCount: overdue.length,
      rate: total > 0 ? Math.round((collected / total) * 100) : 0,
    };
  }, [periodTuitions]);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#16302b]">Học phí</h1>

          {/* Month selector */}
          <Select
            value={String(month)}
            onValueChange={(v) => {
              setMonth(Number(v));
              setPage(1);
            }}
            options={MONTH_OPTIONS}
            className="w-32"
          />

          {/* Year selector */}
          <Select
            value={String(year)}
            onValueChange={(v) => {
              setYear(Number(v));
              setPage(1);
            }}
            options={YEAR_OPTIONS}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#9AAEA9]" />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm học sinh, lớp..."
              className="h-9 w-56 pl-9 text-sm"
            />
          </div>
          {canCreate && (
            <Button
              type="button"
              onClick={onCreateClick}
              className="gap-1.5 text-sm font-semibold"
            >
              <Plus className="size-4" />
              Tạo hóa đơn
            </Button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Đã thu */}
        <div className="rounded-xl border border-[#0E9F8E]/20 bg-[#E4F6EF] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#0E9F8E]">
              <Check className="size-4 text-white" />
            </span>
            <p className="text-sm font-medium text-[#0B7A6D]">Đã thu</p>
          </div>
          <p className="text-3xl font-bold text-[#0E9F8E]">
            {millionsFmt(stats.collectedAmount)}
          </p>
          <p className="mt-1 text-sm text-[#0B7A6D]">
            {stats.collectedCount}/{stats.totalCount} học sinh
          </p>
        </div>

        {/* Chưa thu */}
        <div className="rounded-xl border border-[#E7EEEC] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#FFF0E6]">
              <Clock className="size-4 text-[#F97316]" />
            </span>
            <p className="text-sm font-medium text-[#16302b]">Chưa thu</p>
          </div>
          <p className="text-3xl font-bold text-[#F97316]">
            {millionsFmt(stats.unpaidAmount)}
          </p>
          <p className="mt-1 text-sm text-[#9AAEA9]">
            {stats.unpaidCount} học sinh
          </p>
        </div>

        {/* Quá hạn */}
        <div className="rounded-xl border border-[#E7EEEC] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="size-4 text-red-500" />
            </span>
            <p className="text-sm font-medium text-[#16302b]">Quá hạn</p>
          </div>
          <p className="text-3xl font-bold text-red-500">
            {millionsFmt(stats.overdueAmount)}
          </p>
          <p className="mt-1 text-sm text-[#9AAEA9]">
            {stats.overdueCount} học sinh
          </p>
        </div>

        {/* Tỷ lệ thu */}
        <div className="rounded-xl border border-[#E7EEEC] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-blue-50">
              <Calendar className="size-4 text-blue-500" />
            </span>
            <p className="text-sm font-medium text-[#16302b]">Tỷ lệ thu</p>
          </div>
          <p className="text-3xl font-bold text-[#16302b]">
            {stats.rate}
            <span className="text-xl font-semibold">%</span>
          </p>
          <p className="mt-1 text-sm text-blue-500">Mục tiêu 90%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#E7EEEC]">
            <div
              className="h-1.5 rounded-full bg-blue-400 transition-all"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EEEC] px-5 py-3">
          <div className="flex items-center gap-1.5">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.value;
              if (tab.value === "all") {
                return (
                  <Button
                    key="all"
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setPage(1);
                    }}
                    className={
                      isActive
                        ? "bg-[#0E9F8E]! text-white! hover:bg-[#0E9F8E]!"
                        : "border-[#E7EEEC] text-[#16302b] hover:border-[#0E9F8E]/40 hover:text-[#0E9F8E]"
                    }
                  >
                    Tất cả
                  </Button>
                );
              }
              return (
                <Button
                  key={tab.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setPage(1);
                  }}
                  className={
                    isActive
                      ? tab.activeStyle
                      : "border-[#E7EEEC] text-[#16302b] hover:border-[#0E9F8E]/40 hover:text-[#0E9F8E]"
                  }
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>

          <span className="flex items-center gap-1.5 rounded-lg border border-[#E7EEEC] px-3 py-1.5 text-sm text-[#16302b]">
            <Calendar className="size-3.5 text-[#9AAEA9]" />
            Tháng {month} · {year}
          </span>
        </div>

        {/* Table */}
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow className="border-b border-[#E7EEEC] bg-[#F3F7F5] hover:bg-[#F3F7F5]">
              {[
                "STT",
                "HỌC SINH",
                "LỚP",
                "KỲ HỌC PHÍ",
                "SỐ TIỀN",
                "HẠN ĐÓNG",
                "TRẠNG THÁI",
                "THAO TÁC",
              ].map((col, i) => (
                <TableHead
                  key={col}
                  className={`text-xs font-semibold uppercase tracking-wide text-[#9AAEA9] ${
                    i === 0 ? "w-14 pl-5" : ""
                  } ${i === 7 ? "text-right" : ""}`}
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-[#9AAEA9]" />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-14 text-center text-red-500"
                >
                  {getErrorMessage(error, "Không thể tải danh sách học phí.")}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paged.map((fee, i) => {
                  const displayStatus = STATUS_TO_DISPLAY[fee.status];
                  const badge = STATUS_BADGE[displayStatus];
                  const name =
                    `${fee.student.firstName} ${fee.student.lastName}`.trim();
                  const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <TableRow
                      key={fee.id}
                      className="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9] transition-colors"
                    >
                      {/* STT */}
                      <TableCell className="py-3.5 pl-5 pr-2 text-[#9AAEA9] font-medium">
                        {String(
                          (safePage - 1) * PAGE_SIZE + i + 1,
                        ).padStart(2, "0")}
                      </TableCell>

                      {/* Student */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {initials(
                              fee.student.firstName,
                              fee.student.lastName,
                            )}
                          </span>
                          <div>
                            <p className="font-semibold text-[#16302b] leading-tight">
                              {name}
                            </p>
                            <p className="text-xs text-[#9AAEA9] mt-0.5">
                              {fee.student.userCode || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Class */}
                      <TableCell className="py-3.5">
                        <span className="rounded-md border border-[#0E9F8E]/25 bg-[#E4F6EF] px-2.5 py-0.5 text-xs font-semibold text-[#0B7A6D]">
                          {fee.class.code}
                        </span>
                      </TableCell>

                      {/* Period */}
                      <TableCell className="py-3.5 text-[#16302b]">
                        {fmtPeriod(fee.dueDate)}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-3.5 tabular-nums">
                        <span className="font-semibold text-[#16302b]">
                          {moneyFmt(Number(fee.amount))}
                        </span>
                      </TableCell>

                      {/* Due date */}
                      <TableCell className="py-3.5 text-[#16302b]">
                        {fmtDueDate(fee.dueDate)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                          }}
                        >
                          {badge.label}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Xem chi tiết"
                          onClick={() => onRowClick(fee)}
                          className="text-[#8AA09B] hover:bg-[#E4F6EF] hover:text-[#0E9F8E]"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {paged.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-14 text-center text-[#9AAEA9]"
                    >
                      Không có hóa đơn nào phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t border-[#EEF3F1] px-4 py-3">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};
