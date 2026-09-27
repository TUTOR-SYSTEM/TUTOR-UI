"use client";

import { Fragment, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";

import { LOGS_QUERY_KEY, useLogActions } from "@/lib/services/log.service";
import { useLoggerCopy } from "@/hooks/useLoggerCopy.hook";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Checkbox } from "@/components/ui/checkbox.ui";
import { Label } from "@/components/ui/label.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import UsageGuides from "@/components/ui/usage-guide.ui";
import { LogTraceDialog } from "./log-trace-dialog";
import {
  METHODS_WITH_BODY,
  SLOW_DURATION_THRESHOLD_MS,
  findRedactedKeys,
  getStatusColor,
  isErrorLog,
  sendReplay,
} from "./logger-data";
import type { ApiError, ApiRequestLog } from "@/types";

/** Trang list chỉ theo dõi request HTTP đi vào qua gateway (điểm vào của mọi
 * luồng) — hop RPC nội bộ giữa các service chỉ xem qua dialog trace (mở bằng
 * nút "Gửi lại & theo dõi"), không liệt kê ở đây để tránh nhiễu. */
const LIST_SERVICE_NAME = "gateway";
const LIST_TYPE = "HTTP";

/** Đợi 1 nhịp trước khi mở trace của lần gửi mới — log ghi async qua RMQ nên
 * cần thời gian ngắn để các hop kịp lưu vào DB trước khi trace fetch. */
const TRACE_OPEN_DELAY_MS = 600;

const DEFAULT_PAGE_SIZE = 20;
const TABLE_COLUMN_COUNT = 6;

type DurationSort = "none" | "asc" | "desc";

/** 1 dòng đại diện cho 1 endpoint (method + path không kèm query string) —
 * `count` là số lần endpoint đó xuất hiện trong dữ liệu TRANG hiện tại. */
type GroupedLogRow = { row: ApiRequestLog; count: number };

/** 1 "case" quan sát được cho 1 endpoint — gộp theo kết quả thật (errorMessage
 * hoặc thành công), giữ bản ghi gần nhất làm ví dụ để gửi lại khi Kiểm tra. */
type SubCase = { key: string; label: string; isError: boolean; exampleRow: ApiRequestLog };

type SubCaseCheckState = {
  checking: boolean;
  result: { pass: boolean; message: string } | null;
};

function endpointKeyOf(row: ApiRequestLog): string {
  return `${row.method ?? ""} ${row.path.split("?")[0]}`;
}

export function LoggerPage() {
  const copy = useLoggerCopy();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [errorOnly, setErrorOnly] = useState(false);
  const [durationSort, setDurationSort] = useState<DurationSort>("none");
  const [traceCorrelationId, setTraceCorrelationId] = useState<string | null>(
    null,
  );
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [subCaseChecks, setSubCaseChecks] = useState<
    Record<string, SubCaseCheckState>
  >({});

  const { list } = useLogActions({
    list: {
      page,
      limit: pageSize,
      serviceName: LIST_SERVICE_NAME,
      type: LIST_TYPE,
      search: search.trim() || undefined,
    },
  });

  const apiPayload = list.data;
  const pagination = apiPayload?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalLogs = pagination?.total ?? 0;

  // NOTE: BE `/logs` không hỗ trợ group-by/lọc lỗi/sort theo duration — cả gộp
  // endpoint, "chỉ hiện lỗi" và sắp xếp cột Thời lượng dưới đây chỉ áp dụng
  // trên dữ liệu của TRANG hiện tại (client-side), không phải toàn bộ dataset.
  const rows = useMemo<GroupedLogRow[]>(() => {
    const raw = apiPayload?.data ?? [];

    // Gộp theo endpoint (method + path không kèm query string) TRƯỚC — dựa
    // theo thứ tự gốc BE trả về (desc createdAt) nên bản ghi giữ lại luôn là
    // lần gọi GẦN NHẤT của endpoint đó, không phải lần gọi bất kỳ.
    const grouped = new Map<string, GroupedLogRow>();
    for (const row of raw) {
      const key = endpointKeyOf(row);
      const existing = grouped.get(key);
      if (existing) existing.count += 1;
      else grouped.set(key, { row, count: 1 });
    }
    let data = Array.from(grouped.values());

    if (errorOnly) data = data.filter((g) => isErrorLog(g.row));
    if (durationSort !== "none") {
      data = [...data].sort((a, b) =>
        durationSort === "asc"
          ? a.row.durationMs - b.row.durationMs
          : b.row.durationMs - a.row.durationMs,
      );
    }
    return data;
  }, [apiPayload, errorOnly, durationSort]);

  // Case pass/failed quan sát được cho endpoint ĐANG mở rộng — gộp theo kết
  // quả thật (errorMessage hoặc thành công) trên dữ liệu TRANG hiện tại, ví dụ
  // /auth/login có thể ra "Thành công", "VALIDATION_FAILED"... tuỳ những gì đã
  // thực sự xảy ra trong log, không bịa thêm case chưa từng xảy ra.
  const subCases = useMemo<SubCase[]>(() => {
    if (!expandedKey) return [];
    const raw = apiPayload?.data ?? [];
    const seen = new Map<string, SubCase>();
    for (const row of raw) {
      if (endpointKeyOf(row) !== expandedKey) continue;
      const rowIsError = isErrorLog(row);
      const caseKey = rowIsError
        ? (row.errorMessage ?? `HTTP_${row.statusCode ?? "ERR"}`)
        : "SUCCESS";
      if (!seen.has(caseKey)) {
        seen.set(caseKey, {
          key: caseKey,
          label: rowIsError ? caseKey : copy.table.subCaseSuccessLabel,
          isError: rowIsError,
          exampleRow: row,
        });
      }
    }
    return Array.from(seen.values());
  }, [expandedKey, apiPayload, copy.table.subCaseSuccessLabel]);

  const toggleExpand = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
    setSubCaseChecks({});
  };

  const cycleDurationSort = () => {
    setDurationSort((prev) =>
      prev === "none" ? "desc" : prev === "desc" ? "asc" : "none",
    );
  };

  const DurationSortIcon =
    durationSort === "asc"
      ? ArrowUp
      : durationSort === "desc"
        ? ArrowDown
        : ArrowUpDown;

  // Chuyển dialog trace (đang mở hoặc sắp mở) sang theo dõi correlationId MỚI —
  // dùng cho nút "Gửi lại" trên bảng, để thấy đủ hop xuyên service của lần gửi
  // vừa rồi thay vì kẹt lại trace cũ.
  const trackNewCorrelationId = (correlationId: string) => {
    setTimeout(
      () => setTraceCorrelationId(correlationId),
      TRACE_OPEN_DELAY_MS,
    );
    void queryClient.invalidateQueries({ queryKey: LOGS_QUERY_KEY });
  };

  // Gửi lại đúng request đã log (method/path/body ghi nhận lúc đó) rồi mở trace
  // của lần gửi MỚI (correlationId mới, lấy từ chính response/error trả về) —
  // không phải trace của dòng lịch sử đã bấm.
  const handleSend = async (row: ApiRequestLog) => {
    const method = row.method ?? "GET";

    // Body có field nhạy cảm bị BE ghi đè "[REDACTED]" trước khi lưu log —
    // gửi thẳng sẽ luôn fail (422 validate) vì đó không phải giá trị thật, và
    // giá trị gốc không cách nào khôi phục được. Nút nhanh này không có chỗ để
    // nhập lại, nên mở trace của chính dòng đó (panel gửi-lại trong dialog có
    // ô nhập riêng) thay vì gửi mù.
    if (METHODS_WITH_BODY.has(method) && findRedactedKeys(row.requestBody ?? "").length > 0) {
      toast.error(copy.table.hasRedactedToast);
      setTraceCorrelationId(row.correlationId);
      return;
    }

    let body: unknown;
    if (METHODS_WITH_BODY.has(method) && row.requestBody) {
      try {
        body = JSON.parse(row.requestBody);
      } catch {
        toast.error(copy.replay.invalidJson);
        return;
      }
    }

    if (method !== "GET" && !window.confirm(copy.replay.confirmSend(method, row.path))) {
      return;
    }

    setSendingId(row.id);
    try {
      const response = await sendReplay(method, row.path, body);
      if (response.correlationId) {
        trackNewCorrelationId(response.correlationId);
      } else {
        toast.success(copy.replay.resultSuccess(response.statusCode));
      }
    } catch (err) {
      const apiError = err as ApiError;
      const newCorrelationId = apiError.data?.correlationId;
      if (newCorrelationId) {
        trackNewCorrelationId(newCorrelationId);
      } else {
        toast.error(getErrorMessage(apiError, copy.replay.sendFailed));
      }
    } finally {
      setSendingId(null);
    }
  };

  // Gửi thật lại đúng body ví dụ của 1 case để xác nhận sống Pass/Failed —
  // KHÔNG mở/chuyển dialog trace (khác `handleSend`), chỉ cập nhật badge ngay
  // tại chỗ trong danh sách case đang mở rộng.
  const handleCheckSubCase = async (subCase: SubCase) => {
    const method = subCase.exampleRow.method ?? "GET";

    if (
      METHODS_WITH_BODY.has(method) &&
      findRedactedKeys(subCase.exampleRow.requestBody ?? "").length > 0
    ) {
      toast.error(copy.table.hasRedactedToast);
      setTraceCorrelationId(subCase.exampleRow.correlationId);
      return;
    }

    let body: unknown;
    if (METHODS_WITH_BODY.has(method) && subCase.exampleRow.requestBody) {
      try {
        body = JSON.parse(subCase.exampleRow.requestBody);
      } catch {
        toast.error(copy.replay.invalidJson);
        return;
      }
    }

    if (
      method !== "GET" &&
      !window.confirm(copy.replay.confirmSend(method, subCase.exampleRow.path))
    ) {
      return;
    }

    setSubCaseChecks((prev) => ({
      ...prev,
      [subCase.key]: { checking: true, result: prev[subCase.key]?.result ?? null },
    }));
    try {
      const response = await sendReplay(method, subCase.exampleRow.path, body);
      setSubCaseChecks((prev) => ({
        ...prev,
        [subCase.key]: {
          checking: false,
          result: { pass: true, message: copy.replay.resultSuccess(response.statusCode) },
        },
      }));
    } catch (err) {
      const apiError = err as ApiError;
      setSubCaseChecks((prev) => ({
        ...prev,
        [subCase.key]: {
          checking: false,
          result: {
            pass: false,
            message: getErrorMessage(apiError, copy.replay.resultError(apiError.statusCode)),
          },
        },
      }));
    } finally {
      void queryClient.invalidateQueries({ queryKey: LOGS_QUERY_KEY });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#16302b]">
              {copy.page.title}
            </h1>
            <p className="mt-0.5 text-sm text-[#8AA09B]">{copy.page.subtitle}</p>
          </div>
          <span className="rounded-full bg-[#E4F6EF] px-3 py-0.5 text-sm font-semibold text-[#0E9F8E]">
            {copy.page.totalSuffix(totalLogs)}
          </span>
        </div>
      </div>

      {/* ── Filter toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#9AAEA9]" />
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={copy.filters.searchPlaceholder}
            className="h-9! w-64 rounded-lg border-[#E7EEEC] bg-white pl-9 pr-3 text-sm text-[#16302b] placeholder:text-[#9AAEA9] focus-visible:border-[#0E9F8E] focus-visible:ring-2 focus-visible:ring-[#0E9F8E]/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="logger-error-only"
            checked={errorOnly}
            onCheckedChange={(checked) => setErrorOnly(checked === true)}
          />
          <Label htmlFor="logger-error-only" className="cursor-pointer text-[#16302b]">
            {copy.filters.errorOnlyLabel}
          </Label>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
        <div className="overflow-hidden rounded-t-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#E7EEEC] bg-[#F3F7F5]">
                <TableHead className="w-10 px-2 py-3" />
                <TableHead className="w-14 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                  {copy.table.index}
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                  {copy.table.request}
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                  {copy.table.status}
                </TableHead>
                <TableHead className="h-auto px-4 py-3 text-left">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cycleDurationSort}
                    title={copy.table.durationSortHint}
                    className="h-auto! w-auto! gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#9AAEA9] hover:bg-transparent hover:text-[#16302b]"
                  >
                    {copy.table.duration}
                    <DurationSortIcon className="size-3.5" />
                  </Button>
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                  {copy.table.replayColumn}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isPending && (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COLUMN_COUNT}
                    className="py-14 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}

              {!list.isPending && list.isError && (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COLUMN_COUNT}
                    className="py-14 text-center text-red-500"
                  >
                    {getErrorMessage(list.error, copy.table.error)}
                  </TableCell>
                </TableRow>
              )}

              {!list.isPending && !list.isError && rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COLUMN_COUNT}
                    className="py-14 text-center text-muted-foreground"
                  >
                    {copy.table.empty}
                  </TableCell>
                </TableRow>
              )}

              {!list.isPending &&
                !list.isError &&
                rows.map((g, i) => {
                  const groupKey = endpointKeyOf(g.row);
                  const expanded = expandedKey === groupKey;
                  const statusColor = getStatusColor(g.row.statusCode);

                  return (
                    <Fragment key={g.row.id}>
                      <TableRow className="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9]">
                        <TableCell className="px-2 py-3.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            title={copy.table.expandHint}
                            onClick={() => toggleExpand(groupKey)}
                          >
                            {expanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium text-[#9AAEA9]">
                          {String((page - 1) * pageSize + i + 1).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex max-w-xs items-center gap-1.5">
                            <p className="truncate font-medium text-[#16302b]">
                              {g.row.method ? `${g.row.method} ` : ""}
                              {g.row.path}
                            </p>
                            {g.count > 1 && (
                              <span
                                className="shrink-0 rounded-md bg-[#F3F7F5] px-1.5 py-0.5 text-[10px] font-semibold text-[#5C726D]"
                                title={copy.table.occurrenceHint(g.count)}
                              >
                                ×{g.count}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="w-max rounded-md px-2 py-0.5 text-xs font-semibold"
                              style={{ background: statusColor.bg, color: statusColor.text }}
                            >
                              {g.row.statusCode ?? "—"}
                            </span>
                            {g.row.errorMessage && (
                              <span className="max-w-[220px] truncate text-xs text-red-500">
                                {g.row.errorMessage}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium">
                          <span
                            className={cn(
                              g.row.durationMs >= SLOW_DURATION_THRESHOLD_MS
                                ? "text-red-500"
                                : "text-[#16302b]",
                            )}
                          >
                            {g.row.durationMs} ms
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title={copy.replay.sectionTitle}
                            onClick={() => handleSend(g.row)}
                            loading={sendingId === g.row.id}
                            className="h-auto! w-auto! gap-1.5 rounded-md px-2 py-1 text-xs text-[#0E9F8E] hover:bg-[#E4F6EF]"
                          >
                            <Send className="size-3.5" />
                            {copy.replay.sendButton(g.row.method ?? "GET")}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {expanded && (
                        <TableRow className="border-b border-[#EEF3F1] bg-[#FAFCFB] last:border-0">
                          <TableCell colSpan={TABLE_COLUMN_COUNT} className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                                {copy.table.subCaseSectionTitle(subCases.length)}
                              </p>

                              {subCases.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  {copy.table.subCaseNone}
                                </p>
                              ) : (
                                subCases.map((subCase) => {
                                  const checkState = subCaseChecks[subCase.key];
                                  const passNow = checkState?.result
                                    ? checkState.result.pass
                                    : !subCase.isError;
                                  return (
                                    <div
                                      key={subCase.key}
                                      className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E7EEEC] bg-white p-2"
                                    >
                                      <span
                                        className={cn(
                                          "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                                          passNow
                                            ? "bg-[#E4F6EF] text-[#0B7A6D]"
                                            : "bg-[#FEE2E2] text-[#DC2626]",
                                        )}
                                      >
                                        {passNow ? copy.badge.pass : copy.badge.failed}
                                      </span>
                                      <span
                                        className="min-w-0 flex-1 truncate text-xs font-medium text-[#16302b]"
                                        title={subCase.label}
                                      >
                                        {subCase.label}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="xs"
                                        onClick={() => handleCheckSubCase(subCase)}
                                        loading={checkState?.checking}
                                        className="w-auto! shrink-0 gap-1"
                                      >
                                        <RefreshCw className="size-3" />
                                        {copy.table.subCaseCheckButton}
                                      </Button>
                                      {checkState?.result && (
                                        <span className="w-full text-[11px] text-muted-foreground">
                                          {checkState.result.message}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-[#EEF3F1] px-4 py-3">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      <LogTraceDialog
        correlationId={traceCorrelationId}
        onClose={() => setTraceCorrelationId(null)}
        onReplaySent={trackNewCorrelationId}
      />

      <UsageGuides
        steps={copy.usageGuide.steps}
        warning={copy.usageGuide.warning}
      />
    </div>
  );
}
