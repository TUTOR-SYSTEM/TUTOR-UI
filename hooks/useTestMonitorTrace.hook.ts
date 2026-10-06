"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
 * realtime" lại (`POST /test-scenarios/:id/run?async=true`) rồi theo dõi qua socket `/logs`. */
export function useTestMonitorTrace() {
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
    traceOptions: { enabled: !!selected && !traceHeld },
  });
  const { runRealtime } = useTestScenarioActions();

  useLogSocket({ enabled: !!selected, onNewLog: liveTrace.feed });

  // The run is recorded in `test_runs` in the background — refresh case rows once it settles.
  const livePhase = live?.phase;
  useEffect(() => {
    if (livePhase !== "done") return;
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEST_SCENARIOS_STATS_QUERY_KEY });
  }, [livePhase, queryClient]);

  const open = useCallback((scenario: ApiTestScenario) => {
    if (!scenario.lastRun) return;
    setSelected({ correlationId: scenario.lastRun.correlationId, scenario });
    setSpanIdx(0);
  }, []);

  const close = useCallback(() => {
    liveTrace.stop();
    setSelected(null);
  }, [liveTrace]);

  const runRealtimeAgain = () => {
    if (!selected) return;
    const { scenario } = selected;
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
    trace: trace.data,
    isTraceLoading: trace.isLoading,
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
