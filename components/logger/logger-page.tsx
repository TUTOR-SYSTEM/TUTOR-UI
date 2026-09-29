"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import UsageGuides from "@/components/ui/usage-guide.ui";
import { useLoggerCopy } from "@/hooks/useLoggerCopy.hook";
import { useLiveTrace } from "@/hooks/useLiveTrace.hook";
import { useLogSocket } from "@/hooks/useLogSocket.hook";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { LOGS_QUERY_KEY, useLogActions } from "@/lib/services/log.service";
import {
  TEST_SCENARIOS_QUERY_KEY,
  TEST_SCENARIOS_STATS_QUERY_KEY,
  useTestScenarioActions,
} from "@/lib/services/test-scenario.service";
import { EndpointStatsList } from "./endpoint-stats-list";
import { LoggerRequestList } from "./logger-request-list";
import { RequestDetailDialog } from "./request-detail-dialog";
import { matchesFilter, pickScenarioFor } from "./logger-utils";
import type {
  ApiRequestLog,
  ApiResponse,
  ApiTestScenario,
  LoggerRequestFilter,
  RequestLogsApiPayload,
  RunRealtimeResult,
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

  const liveTrace = useLiveTrace();
  const live = liveTrace.live;
  // While a realtime run is still streaming, the persisted trace isn't complete — hold the
  // `GET /logs/trace/:id` back and fetch it exactly once, after the run settles.
  const traceHeldForLive =
    !!live && live.correlationId === selCorrelationId && live.phase !== "done";

  const { list, trace, stats } = useLogActions({
    list: listParams,
    traceCorrelationId: selCorrelationId ?? undefined,
    traceOptions: { enabled: !!selCorrelationId && !traceHeldForLive },
    stats: true,
  });

  const { list: scenarios, runRealtime } = useTestScenarioActions({ list: true });

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

  const onLogEvent = useCallback(
    (row: ApiRequestLog) => {
      liveTrace.feed(row);
      onNewLog(row);
    },
    [liveTrace, onNewLog],
  );

  useLogSocket({ onNewLog: onLogEvent });

  // The run is recorded in `test_runs` in the background — refresh case badges once it settles.
  const livePhase = live?.phase;
  useEffect(() => {
    if (livePhase !== "done") return;
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_STATS_QUERY_KEY });
  }, [livePhase, queryClient]);

  const selectedRequest = requests.find((r) => r.correlationId === selCorrelationId);
  // Scenario behind each run started from this page. Kept after the live view is stopped/settled
  // so the just-run request (not in the list yet) can still be re-run instead of going disabled.
  const [runScenarios, setRunScenarios] = useState<Record<string, ApiTestScenario>>({});
  const ranScenario = selCorrelationId ? runScenarios[selCorrelationId] : undefined;
  const realtimeScenario =
    (live?.correlationId === selCorrelationId ? live.scenario : null) ??
    ranScenario ??
    (selectedRequest ? pickScenarioFor(scenarios.data ?? [], selectedRequest) : null);

  const runRealtimeScenario = () => {
    if (!realtimeScenario) return;
    runRealtime.mutate(realtimeScenario.id, {
      onSuccess: (raw) => {
        const { correlationId } = unwrapApiData<RunRealtimeResult>(raw);
        // Start following before switching the dialog so no early hop is missed.
        liveTrace.start(correlationId, realtimeScenario);
        setRunScenarios((prev) => ({ ...prev, [correlationId]: realtimeScenario }));
        setSelCorrelationId(correlationId);
        setSpanIdx(0);
      },
      onError: (err) =>
        toast.error(getErrorMessage(err, copy.detail.actions.runRealtimeError)),
    });
  };

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

      <EndpointStatsList
        stats={stats.data ?? []}
        isLoading={stats.isLoading}
        isError={stats.isError}
        copy={copy}
      />

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
        trace={trace.data}
        isTraceLoading={trace.isLoading}
        realtime={{
          scenario: realtimeScenario,
          live,
          isStarting: runRealtime.isPending,
          onRun: runRealtimeScenario,
          onStop: liveTrace.stop,
          hasRun: !!ranScenario,
        }}
        copy={copy}
      />

      <UsageGuides steps={copy.usageGuide.steps} warning={copy.usageGuide.warning} />
    </div>
  );
}
