"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiRequestLog, ApiTestScenario, LiveTraceState } from "@/types";

/** Log rows are emitted fire-and-forget, so RPC hops can trail the gateway's root row by a few
 * ms — wait this long after the root arrives before the final `GET /logs/trace`. */
const SETTLE_MS = 500;
/** Nothing ever arrives if the socket is down or the run died — stop waiting after this. */
const GIVE_UP_MS = 20_000;

/**
 * Follows one "Chạy realtime" run: `start()` it with the correlationId the run endpoint returned,
 * pipe every `log:new` row into `feed()` (rows of other correlationIds are ignored), and read
 * `live` — the rows so far plus a `phase` that turns `done` once the trace can be fetched for real.
 */
export function useLiveTrace() {
  const [live, setLive] = useState<LiveTraceState | null>(null);
  const followingRef = useRef<string | null>(null);
  const rootSeenRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const finish = useCallback((correlationId: string) => {
    setLive((prev) =>
      prev && prev.correlationId === correlationId ? { ...prev, phase: "done" } : prev,
    );
  }, []);

  const start = useCallback(
    (correlationId: string, scenario: ApiTestScenario) => {
      clearTimers();
      followingRef.current = correlationId;
      rootSeenRef.current = false;
      setLive({
        correlationId,
        scenario,
        startedAt: Date.now(),
        rows: [],
        phase: "running",
        rootStatus: null,
      });
      timersRef.current.push(setTimeout(() => finish(correlationId), GIVE_UP_MS));
    },
    [clearTimers, finish],
  );

  const feed = useCallback(
    (row: ApiRequestLog) => {
      const correlationId = followingRef.current;
      if (!correlationId || row.correlationId !== correlationId) return;

      const isRoot = row.serviceName === "gateway" && row.type === "HTTP";
      setLive((prev) => {
        if (!prev || prev.correlationId !== correlationId) return prev;
        if (prev.rows.some((r) => r.id === row.id)) return prev;
        return {
          ...prev,
          rows: [...prev.rows, row],
          rootStatus: isRoot ? row.statusCode : prev.rootStatus,
          phase: isRoot && prev.phase === "running" ? "settling" : prev.phase,
        };
      });

      if (isRoot && !rootSeenRef.current) {
        rootSeenRef.current = true;
        timersRef.current.push(setTimeout(() => finish(correlationId), SETTLE_MS));
      }
    },
    [finish],
  );

  const stop = useCallback(() => {
    clearTimers();
    followingRef.current = null;
    setLive(null);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return { live, start, feed, stop };
}
