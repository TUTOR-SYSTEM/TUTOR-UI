"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  BookText,
  CalendarCheck,
  ClipboardCheck,
  Search,
  ShieldOff,
} from "lucide-react";

import { useGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import type {
  AttendanceTrendPoint,
  ClassReportRow,
  ClassReportsApiPayload,
  LearningReportSummary,
} from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.ui";

const PAGE_SIZE = 8;

function rateBadgeClass(rate: number): string {
  if (rate >= 90) return "bg-[#E4F6EF] text-[#0B7A6D]";
  if (rate >= 70) return "bg-[#FEF3C7] text-[#B45309]";
  return "bg-[#FEE2E2] text-[#DC2626]";
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#EEF3F1]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: "#0E9F8E",
          }}
        />
      </div>
      <span className="text-xs font-medium text-[#16302b]">{value}%</span>
    </div>
  );
}

export function ReportsPage() {
  const role = useCurrentUserRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const isAdmin = role === "ADMIN";

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useGet<unknown, LearningReportSummary>(
    ["reports", "learning", "summary"],
    "/reports/learning/summary",
    {
      select: (raw) => unwrapApiData<LearningReportSummary>(raw),
      enabled: isAdmin,
    },
  );

  const { data: trend, isLoading: isTrendLoading } = useGet<
    unknown,
    AttendanceTrendPoint[]
  >(
    ["reports", "learning", "attendance-trend"],
    "/reports/learning/attendance-trend",
    {
      select: (raw) => unwrapApiData<AttendanceTrendPoint[]>(raw),
      enabled: isAdmin,
    },
  );

  const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();

  const {
    data: classPayload,
    isPending: isClassesPending,
    isError: isClassesError,
    error: classesError,
  } = useGet<unknown, ClassReportsApiPayload>(
    ["reports", "learning", "classes", page, search],
    "/reports/learning/classes",
    {
      params,
      select: (raw) => unwrapApiData<ClassReportsApiPayload>(raw),
      enabled: isAdmin,
    },
  );

  const classRows = useMemo(() => classPayload?.data ?? [], [classPayload]);
  const totalPages = classPayload?.pagination.totalPages ?? 1;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#E7EEEC] bg-white py-24 text-center shadow-sm">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#FFF0E6]">
          <ShieldOff className="size-6 text-[#E85D24]" />
        </span>
        <h2 className="text-lg font-bold text-[#16302b]">
          Không có quyền truy cập
        </h2>
        <p className="max-w-sm text-sm text-[#8AA09B]">
          Chỉ quản trị viên mới có thể xem báo cáo học tập.
        </p>
      </div>
    );
  }

  const statTiles = [
    {
      label: "Lớp đang hoạt động",
      value: summary ? String(summary.activeClasses) : "—",
      icon: BookText,
    },
    {
      label: "Tỉ lệ điểm danh TB",
      value: summary ? `${summary.avgAttendanceRate}%` : "—",
      icon: CalendarCheck,
    },
    {
      label: "Tiến độ giáo trình TB",
      value: summary ? `${summary.avgCurriculumProgress}%` : "—",
      icon: BookText,
    },
    {
      label: "Tỉ lệ nộp bài",
      value: summary ? `${summary.submissionRate}%` : "—",
      icon: ClipboardCheck,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#16302b]">Báo cáo học tập</h1>
        <p className="mt-1 text-sm text-[#8AA09B]">
          Tổng quan tiến độ, điểm danh và kết quả học tập theo từng lớp.
        </p>
      </div>

      {isSummaryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          Không tải được dữ liệu tổng quan báo cáo. Vui lòng thử lại.
        </div>
      )}

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isSummaryLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-26 animate-pulse rounded-xl border border-[#E7EEEC] bg-[#F3F7F5]"
              />
            ))
          : statTiles.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[#E7EEEC] bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-[#8AA09B]">{s.label}</span>
                  <s.icon className="size-4 text-[#9AAEA9]" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-[#16302b]">
                  {s.value}
                </p>
              </div>
            ))}
      </div>

      {/* ── Attendance trend chart ── */}
      <div className="rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EEF3F1] px-5 py-4">
          <div>
            <h3 className="font-semibold text-[#16302b]">
              Tỉ lệ điểm danh theo tháng
            </h3>
            <p className="mt-0.5 text-xs text-[#8AA09B]">
              6 tháng gần nhất, tính trên toàn bộ lớp đang hoạt động.
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-[#8AA09B]">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: "#0E9F8E" }}
            />
            Điểm danh
          </span>
        </div>
        <div className="px-5 py-5">
          {isTrendLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-[#F3F7F5]" />
          ) : !trend || trend.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#9AAEA9]">
              Chưa có dữ liệu điểm danh.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={trend}
                margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E7EEEC"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#9AAEA9" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9AAEA9" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E7EEEC",
                    background: "#fff",
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${Number(value)}%`, "Điểm danh"]}
                />
                <Bar
                  dataKey="rate"
                  fill="#0E9F8E"
                  fillOpacity={0.85}
                  radius={[3, 3, 0, 0]}
                  barSize={22}
                  name="rate"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Per-class table ── */}
      <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3F1] px-5 py-4">
          <h3 className="font-semibold text-[#16302b]">Theo lớp</h3>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#9AAEA9]" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên lớp..."
              className="h-9 w-56 rounded-lg border border-[#E7EEEC] bg-white pl-9 pr-3 text-sm text-[#16302b] placeholder:text-[#9AAEA9] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]/30 focus:border-[#0E9F8E] transition-colors"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow>
                {[
                  "Lớp",
                  "Gia sư",
                  "Sĩ số",
                  "Điểm danh",
                  "Tiến độ giáo trình",
                  "Bài tập",
                  "Điểm TB",
                ].map((col) => (
                  <TableHead
                    key={col}
                    className="px-4"
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classRows.map((row: ClassReportRow) => (
                <TableRow
                  key={row.classId}
                  className="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9] transition-colors"
                >
                  <TableCell className="px-4 py-3.5 font-semibold text-[#16302b]">
                    {row.className}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-[#16302b]">
                    {row.tutorName}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-[#16302b]">
                    {row.studentCount}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${rateBadgeClass(row.attendanceRate)}`}
                    >
                      {row.attendanceRate}%
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <ProgressBar value={row.curriculumProgress} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-[#16302b]">
                    {row.assignmentsSubmitted}/{row.assignmentsTotal}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {row.averageScore !== null ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#16302b]">
                        <Award className="size-3.5 text-[#FF7A45]" />
                        {row.averageScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-[#9AAEA9]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {!isClassesPending && classRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-[#9AAEA9]">
                    Không tìm thấy lớp phù hợp.
                  </TableCell>
                </TableRow>
              )}
              {isClassesPending && (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-[#9AAEA9]">
                    Đang tải…
                  </TableCell>
                </TableRow>
              )}
              {isClassesError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-red-500">
                    {getErrorMessage(
                      classesError,
                      "Không thể tải báo cáo theo lớp.",
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-1 border-t border-[#EEF3F1] px-4 py-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm text-[#16302b] hover:bg-[#F3F7F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className="size-8 rounded-lg text-sm font-medium transition-colors"
              style={
                p === page
                  ? { background: "#0E9F8E", color: "#fff" }
                  : { color: "#16302b" }
              }
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm text-[#16302b] hover:bg-[#F3F7F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
