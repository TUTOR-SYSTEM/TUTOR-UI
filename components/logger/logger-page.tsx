"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import UsageGuides from "@/components/ui/usage-guide.ui";
import { useLoggerCopy } from "@/hooks/useLoggerCopy.hook";
import { useLogSocket } from "@/hooks/useLogSocket.hook";
import { LOGS_QUERY_KEY, useLogActions } from "@/lib/services/log.service";
import { LoggerRequestList } from "./logger-request-list";
import { RequestDetailDialog } from "./request-detail-dialog";
import { matchesFilter } from "./logger-utils";
import type {
  ApiRequestLog,
  ApiResponse,
  LoggerRequestFilter,
  LoggerSpanTab,
  RequestLogsApiPayload,
} from "@/types";

const PAGE_LIMIT = 20;

export function LoggerPage() {
  const copy = useLoggerCopy();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<LoggerRequestFilter>("all");
  const [search, setSearch] = useState("");
  const [selCorrelationId, setSelCorrelationId] = useState<string | null>(null);
  const [spanIdx, setSpanIdx] = useState(0);
  const [spanTab, setSpanTab] = useState<LoggerSpanTab>("req");

  // Only root HTTP hops (always logged at the gateway) count as "1 request" in this list — RPC
  // hops between services only ever show up inside their parent request's waterfall.
  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      serviceName: "gateway",
      type: "HTTP" as const,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const { list, trace } = useLogActions({
    list: listParams,
    traceCorrelationId: selCorrelationId ?? undefined,
  });

  const requests = list.data?.data ?? [];
  const pagination = list.data?.pagination;

  const onNewLog = useCallback(
    (row: ApiRequestLog) => {
      if (row.serviceName !== "gateway" || row.type !== "HTTP") return;
      // Only page 1 (the default, newest-first view) gets a new row spliced in live — a search
      // result or an older page just isn't the right place to inject a just-arrived request.
      if (page !== 1) return;
      queryClient.setQueryData<ApiResponse<RequestLogsApiPayload>>(
        [...LOGS_QUERY_KEY, listParams],
        (old) => {
          if (!old) return old;
          if (old.data.data.some((r) => r.id === row.id)) return old;
          return {
            ...old,
            data: {
              ...old.data,
              data: [row, ...old.data.data].slice(0, PAGE_LIMIT),
              pagination: { ...old.data.pagination, total: old.data.pagination.total + 1 },
            },
          };
        },
      );
    },
    [queryClient, listParams, page],
  );

  useLogSocket({ onNewLog });

  const selectRequest = (correlationId: string) => {
    setSelCorrelationId(correlationId);
    setSpanIdx(0);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-[#16302b]">{copy.page.title}</h1>
        <p className="mt-0.5 text-sm text-[#8AA09B]">{copy.page.subtitle}</p>
      </div>

      <LoggerRequestList
        requests={requests}
        total={pagination?.total ?? requests.length}
        page={pagination?.page ?? page}
        totalPages={pagination?.totalPages ?? 1}
        onPageChange={setPage}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        selectedCorrelationId={selCorrelationId}
        onSelectRequest={selectRequest}
        isLoading={list.isLoading}
        isError={list.isError}
        copy={copy}
      />

      <RequestDetailDialog
        filteredRequests={requests.filter((r) => matchesFilter(r, filter))}
        selectedCorrelationId={selCorrelationId}
        onSelectCorrelationId={setSelCorrelationId}
        onClose={() => setSelCorrelationId(null)}
        spanIdx={spanIdx}
        onSpanIdxChange={setSpanIdx}
        spanTab={spanTab}
        onSpanTabChange={setSpanTab}
        trace={trace.data}
        isTraceLoading={trace.isLoading}
        copy={copy}
      />

      <UsageGuides steps={copy.usageGuide.steps} warning={copy.usageGuide.warning} />
    </div>
  );
}
