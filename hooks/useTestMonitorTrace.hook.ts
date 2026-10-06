"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { MOCK_TRACES } from "@/components/test-monitor/test-monitor-mock-data";
import { useLiveTrace } from "@/hooks/useLiveTrace.hook";
import { useLogSocket } from "@/hooks/useLogSocket.hook";
import { useLoggerCopy } from "@/hooks/useLoggerCopy.hook";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useLogActions } from "@/lib/services/log.service";
import {
  TEST_SCENARIOS_QUERY_KEY,
  TEST_SCENARIOS_STATS_QUERY_KEY,
  useTestScenarioActions,
} from "@/lib/services/test-scenario.service";
import type { ApiTestScenario, RunRealtimeResult, TestMonitorTraceSelection } from "@/types";

/** Dialog trace của trang test-monitor: mở lần chạy gần nhất của 1 case (`open`), hoặc "Chạy
 * realtime" lại (`POST /test-scenarios/:id/run?async=true`) rồi theo dõi qua socket `/logs`.
 * `mock` (chế độ demo): trace đọc từ `MOCK_TRACES`, "Chạy realtime" phát lại trace đã lưu qua
 * `liveTrace.feed` — không gọi API, không mở socket. */
export function useTestMonitorTrace(mock = false) {
  const copy = useLoggerCopy();
  const queryClient = useQueryClient();
  const liveTrace = useLiveTrace();
  const live = liveTrace.live;

  const [selected, setSelected] = useState<TestMonitorTraceSelection | null>(null);
  const [spanIdx, setSpanIdx] = useState(0);

  // While a realtime run still streams, the persisted trace is incomplete — fetch it once, after
  // the run settles.
  const traceHeld = !!live && live.correlationId === selected?.correlationId && live.phase !== "done";
  const { trace } = useLogActions({
    traceCorrelationId: selected?.correlationId,
    traceOptions: { enabled: !!selected && !traceHeld && !mock },
  });
  const { runRealtime } = useTestScenarioActions({ metaOptions: { enabled: false } });

  useLogSocket({ enabled: !!selected && !mock, onNewLog: liveTrace.feed });

  const replayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearReplay = useCallback(() => {
    replayTimersRef.current.forEach(clearTimeout);
    replayTimersRef.current = [];
  }, []);
  useEffect(() => clearReplay, [clearReplay]);

  // The run is recorded in `test_runs` in the background — refresh case rows once it settles.
  const livePhase = live?.phase;
  useEffect(() => {
    if (livePhase !== "done" || mock) return;
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_STATS_QUERY_KEY });
  }, [livePhase, mock, queryClient]);

  const open = useCallback((scenario: ApiTestScenario) => {
    if (!scenario.lastRun) return;
    setSelected({ correlationId: scenario.lastRun.correlationId, scenario });
    setSpanIdx(0);
  }, []);

  const close = useCallback(() => {
    clearReplay();
    liveTrace.stop();
    setSelected(null);
  }, [liveTrace, clearReplay]);

  const runRealtimeAgain = () => {
    if (!selected) return;
    const { scenario } = selected;
    if (mock) {
      // Children finish (and log) before the gateway root, like the real stream.
      const rows = [...(MOCK_TRACES[selected.correlationId] ?? [])].sort(
        (a, b) => Number(a.parentTraceId === null) - Number(b.parentTraceId === null),
      );
      clearReplay();
      liveTrace.start(selected.correlationId, scenario);
      rows.forEach((row, i) => {
        replayTimersRef.current.push(setTimeout(() => liveTrace.feed(row), 150 * (i + 1)));
      });
      setSpanIdx(0);
      return;
    }
    runRealtime.mutate(scenario.id, {
      onSuccess: (raw) => {
        const { correlationId } = unwrapApiData<RunRealtimeResult>(raw);
        // Start following before switching the dialog so no early hop is missed.
        liveTrace.start(correlationId, scenario);
        setSelected({ correlationId, scenario });
        setSpanIdx(0);
      },
      onError: (err) => toast.error(getErrorMessage(err, copy.detail.actions.runRealtimeError)),
    });
  };

  return {
    loggerCopy: copy,
    selected,
    spanIdx,
    setSpanIdx,
    trace: mock ? (traceHeld ? undefined : MOCK_TRACES[selected?.correlationId ?? ""]) : trace.data,
    isTraceLoading: mock ? false : trace.isLoading,
    open,
    close,
    realtime: {
      scenario: selected?.scenario ?? null,
      live,
      isStarting: runRealtime.isPending,
      onRun: runRealtimeAgain,
      onStop: liveTrace.stop,
      hasRun: !!selected,
    },
  };
}
