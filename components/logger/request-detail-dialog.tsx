"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Copy, Loader2, Play, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import { API_BASE_URL } from "@/lib/axios/client";
import {
  CLIENT_KEY,
  STATUS_TONE_STYLE,
  buildCurl,
  buildPlaybackEvents,
  buildPlaybackLines,
  buildTraceTree,
  directChildIndexes,
  distinctServicesCount,
  errorCodeOf,
  errorKindOf,
  errorNodeCount,
  formatDuration,
  formatBytes,
  httpStatusText,
  httpStatusTone,
  methodColorOf,
  nodeStatusTone,
  parentIndexOf,
  pipelineHops,
  playbackFrontier,
  prettyBody,
  serviceColorOf,
  serviceNameOf,
} from "./logger-utils";
import { LiveTracePanel } from "./live-trace-panel";
import { TracePipeline, type TracePipelineProgress } from "./trace-pipeline";
import { useTracePlayback } from "@/hooks/useTracePlayback.hook";
import type { LoggerDictionary } from "@/lib/i18n/logger.dictionary";
import type {
  ApiRequestLog,
  ApiTestScenario,
  LiveTraceState,
  LoggerTraceNode,
} from "@/types";

/** "Chạy realtime": kịch bản sẽ chạy cho request đang xem + trạng thái theo dõi live hiện tại. */
export type RequestDetailRealtime = {
  scenario: ApiTestScenario | null;
  live: LiveTraceState | null;
  isStarting: boolean;
  onRun: () => void;
  onStop?: () => void;
  /** Request đang xem sinh ra từ một lần "Chạy realtime" của trang này. */
  hasRun?: boolean;
};

function CodeBlock({ text, tone }: { text: string; tone?: "err" }) {
  return (
    <pre
      className={cn(
        "max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg p-3 font-mono text-xs leading-relaxed",
        tone === "err" ? "bg-[#0F1F1C] text-[#F4A593]" : "bg-[#0F1F1C] text-[#D5E6E2]",
      )}
    >
      {text}
    </pre>
  );
}

export function RequestDetailDialog({
  filteredRequests,
  selectedCorrelationId,
  onSelectCorrelationId,
  onClose,
  spanIdx,
  onSpanIdxChange,
  trace,
  isTraceLoading,
  realtime,
  variant = "full",
  copy,
}: {
  filteredRequests: ApiRequestLog[];
  selectedCorrelationId: string | null;
  onSelectCorrelationId: (correlationId: string) => void;
  onClose: () => void;
  spanIdx: number;
  onSpanIdxChange: (index: number) => void;
  trace: ApiRequestLog[] | undefined;
  isTraceLoading: boolean;
  realtime?: RequestDetailRealtime;
  /** `full` (trang logger): span đang chọn + tổng quan + waterfall. `services` (trang test-monitor):
   * mỗi service một khung Request/Response, LIVE TRACE hiện cả lần chạy gần nhất đã lưu. */
  variant?: "full" | "services";
  copy: LoggerDictionary;
}) {
  const isOpen = !!selectedCorrelationId;

  const positionIndex = useMemo(
    () => filteredRequests.findIndex((r) => r.correlationId === selectedCorrelationId),
    [filteredRequests, selectedCorrelationId],
  );
  const listRequest = positionIndex >= 0 ? filteredRequests[positionIndex] : null;

  const traceNodes = useMemo(() => buildTraceTree(trace ?? []), [trace]);

  // A "Chạy realtime" run is replayed step by step (`useTracePlayback`): hops are only logged once
  // they finish and a whole run takes a few ms, so nothing is drawn until the run is complete, then
  // the trace is walked through service by service at a readable pace.
  const liveView =
    realtime?.live && realtime.live.correlationId === selectedCorrelationId ? realtime.live : null;
  const liveNodes = useMemo(() => buildTraceTree(liveView?.rows ?? []), [liveView?.rows]);
  const liveDone = liveView?.phase === "done";

  // Last fully settled trace. A re-run starts with no hops at all, so without this the span detail /
  // waterfall would vanish and pop back in; instead the old trace stays (dimmed) and its services
  // give the pipeline its ghost path until the new run is ready to replay.
  const [settled, setSettled] = useState<LoggerTraceNode[]>([]);
  const expectedServices = useMemo(() => pipelineHops(settled).map((h) => h.service), [settled]);
  // The path to compare a run against is frozen when the run starts — `settled` moves on to the new
  // trace once it finishes, which would otherwise drop the "skipped" lines of a failed run.
  const [expectedSnap, setExpectedSnap] = useState<{ key: string; services: string[] }>({
    key: "",
    services: [],
  });
  if (liveView && expectedSnap.key !== liveView.correlationId) {
    setExpectedSnap({ key: liveView.correlationId, services: expectedServices });
  }
  const runExpected =
    liveView && expectedSnap.key === liveView.correlationId ? expectedSnap.services : expectedServices;
  const playbackEvents = useMemo(
    () => buildPlaybackEvents(liveNodes, runExpected),
    [liveNodes, runExpected],
  );
  // A run opened from a stored trace (not started on this page) has no replay: its LIVE TRACE lines
  // are built once from the persisted hops, stamped with each hop's own `createdAt`.
  const staticLines = useMemo(() => {
    const scenarioForRun = realtime?.scenario;
    if (
      variant !== "services" ||
      liveView ||
      !scenarioForRun ||
      !realtime?.hasRun ||
      !selectedCorrelationId ||
      traceNodes.length === 0
    )
      return [];
    const events = buildPlaybackEvents(traceNodes);
    const root = traceNodes.find((n) => n.serviceName === "gateway" && n.type === "HTTP");
    const lines = buildPlaybackLines({
      nodes: traceNodes,
      events,
      scenario: scenarioForRun,
      correlationId: selectedCorrelationId,
      actualStatus: root?.statusCode ?? null,
      copy: copy.detail.live,
    });
    const stamp = (i: number) => Date.parse(traceNodes[Math.max(0, i)]?.createdAt ?? "") || 0;
    let last = 0;
    return lines.map((line, i) => {
      const event = events[i - 1];
      if (i === 0) last = 0;
      else if (event && event.index >= 0) last = event.index;
      return { line, time: stamp(i === lines.length - 1 ? traceNodes.length - 1 : last) };
    });
  }, [variant, liveView, realtime?.scenario, realtime?.hasRun, selectedCorrelationId, traceNodes, copy.detail.live]);
  const playbackTotal = playbackEvents.length + 2; // "sent" line + one per event + result line
  const playback = useTracePlayback({
    total: playbackTotal,
    active: liveDone,
    resetKey: liveView?.correlationId ?? "",
  });
  const runInFlight = !!liveView && (!liveDone || playback.playing);
  const persistedNodes = traceNodes.length > 0 ? traceNodes : liveNodes;
  const liveNodesOnly = runInFlight ? (liveDone ? liveNodes : []) : persistedNodes;

  if (liveNodesOnly.length > 0 && !runInFlight && settled !== liveNodesOnly) setSettled(liveNodesOnly);
  const stale = runInFlight && liveNodesOnly.length === 0 && settled.length > 0;
  const nodes = stale ? settled : liveNodesOnly;
  const gatewayRoot = stale ? undefined : nodes.find((n) => n.serviceName === "gateway" && n.type === "HTTP");
  const rootNode = stale ? undefined : nodes[0];

  // Until the gateway's own row arrives, the first live row is an RPC hop — not the request.
  const livePlaceholder = useMemo<ApiRequestLog | null>(() => {
    const scenario = liveView?.scenario;
    if (!liveView || !scenario) return null;
    const body = scenario.requestTemplate.body;
    return {
      id: `live-${liveView.correlationId}`,
      serviceName: "gateway",
      type: "HTTP",
      method: scenario.method,
      path: scenario.path,
      statusCode: null,
      durationMs: 0,
      correlationId: liveView.correlationId,
      traceId: "",
      parentTraceId: null,
      userId: null,
      ip: null,
      requestBody: body === undefined ? null : JSON.stringify(body),
      responseBody: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };
  }, [liveView]);
  const request = liveView && !gatewayRoot ? livePlaceholder : (rootNode ?? listRequest);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  // Service being tracked live (click a box in the pipeline); reset whenever another request opens.
  const [focus, setFocus] = useState<{ correlationId: string | null; service: string | null }>({
    correlationId: null,
    service: null,
  });
  const focusService = focus.correlationId === selectedCorrelationId ? focus.service : null;
  const setFocusService = (service: string | null) =>
    setFocus({ correlationId: selectedCorrelationId, service });

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  if (!isOpen || typeof document === "undefined" || !selectedCorrelationId || !request) return null;

  const nodesEndMs = nodes.reduce((max, n) => Math.max(max, n.startMs + n.durationMs), 0);
  const totalMs = Math.max(1, rootNode?.durationMs ?? request.durationMs, nodesEndMs);

  // Where the replayed request is right now (only while a run is being replayed).
  const applied = Math.max(0, Math.min(playbackEvents.length, playback.visible - 1));
  const replaying = !!liveView && runInFlight && !!liveDone;
  const frontier = playbackFrontier(nodes, playbackEvents, replaying ? applied : 0);
  const currentIdx = replaying ? (applied === 0 ? (nodes.length > 0 ? 0 : null) : frontier.current) : null;
  const shownIdx = replaying ? (currentIdx ?? 0) : spanIdx;
  const activeNode: LoggerTraceNode | undefined = nodes[shownIdx];
  const exitedIdx = new Set(
    playbackEvents.slice(0, applied).filter((e) => e.kind === "exit").map((e) => e.index),
  );

  const skippedServices = replaying
    ? frontier.skipped
    : liveView && !runInFlight
      ? playbackEvents.flatMap((e) => (e.kind === "skip" ? [e.service] : []))
      : [];

  let progress: TracePipelineProgress | undefined;
  if (liveView && runInFlight) {
    progress = replaying
      ? {
          entered: [...new Set([...frontier.entered].map((i) => nodes[i].serviceName))],
          current: currentIdx === null ? CLIENT_KEY : nodes[currentIdx].serviceName,
        }
      : { entered: [], current: runExpected[0] ?? null };
  }
  const errorNode = nodes.find((n) => n.errorMessage) ?? (request.errorMessage ? request : null);

  const goTo = (delta: 1 | -1) => {
    const total = filteredRequests.length;
    if (total === 0 || positionIndex < 0) return;
    const next = (positionIndex + delta + total) % total;
    onSelectCorrelationId(filteredRequests[next].correlationId);
    onSpanIdxChange(0);
  };

  const copyCurl = () => {
    void navigator.clipboard.writeText(buildCurl(request, API_BASE_URL)).then(() => {
      toast.success(copy.detail.actions.curlCopied);
    });
  };


  // Verdict of a run started from this page: root status vs the scenario's expected status. A
  // request merely opened from the list has no verdict — the picked scenario may be another case.
  const scenario = realtime?.scenario ?? null;
  const verdictScenario = liveView?.scenario ?? (realtime?.hasRun ? scenario : null);
  const actualStatus = gatewayRoot?.statusCode ?? liveView?.rootStatus ?? null;
  const verdict = verdictScenario
    ? runInFlight || (actualStatus === null && liveView?.phase !== "done")
      ? "pending"
      : actualStatus === verdictScenario.expectedStatus
        ? "pass"
        : "fail"
    : null;
  const verdictTone = verdict === "pass" ? "ok" : verdict === "fail" ? "err" : "warn";
  const methodStyle = methodColorOf(request.method);

  const liveCopy = copy.detail.live;
  const playbackLines =
    liveView && verdictScenario
      ? buildPlaybackLines({
          nodes: liveNodes,
          events: playbackEvents,
          scenario: verdictScenario,
          correlationId: liveView.correlationId,
          actualStatus,
          copy: liveCopy,
        })
      : [];
  const shownLines = liveView
    ? playbackLines.slice(0, playback.visible).map((line, i) => ({
        line,
        time: i === 0 ? (liveView.startedAt ?? 0) : (playback.times[i - 1] ?? liveView.startedAt ?? 0),
      }))
    : staticLines;
  const liveSubtitle = !liveView
    ? staticLines.length > 0
      ? liveCopy.status.last
      : liveCopy.idle
    : !runInFlight
      ? liveCopy.status.last
      : !replaying
        ? runExpected[0]
          ? liveCopy.status.toService(serviceNameOf(runExpected[0]))
          : liveCopy.status.sending
        : frontier.direction === "returning" && applied > 0
          ? liveCopy.status.returning
          : liveCopy.status.toService(serviceNameOf(nodes[currentIdx ?? 0]?.serviceName ?? "gateway"));

  const copyCorrelationId = () => {
    void navigator.clipboard.writeText(selectedCorrelationId).then(() => {
      setCopied(true);
      toast.success(copy.detail.traceIdCopied);
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={copy.detail.headerTitle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[3px]" aria-hidden="true" />

      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-[1040px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#E7EEEC] bg-[#F4F8F7] shadow-xl">
        {/* ── Top bar ── */}
        <header className="flex shrink-0 flex-wrap items-start gap-x-3 gap-y-2 border-b border-[#E7EEEC] bg-white px-5 py-4">
          <div className="min-w-0 flex-1 basis-72">
            <div className="flex items-center gap-2">
              <span
                className="shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-bold"
                style={{ background: methodStyle.bg, color: methodStyle.text }}
              >
                {request.method ?? request.type}
              </span>
              <h2 className="min-w-0 truncate font-mono text-base font-bold text-[#16302b]">{request.path}</h2>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#8AA09B]">
              {scenario && (
                <>
                  {scenario.category && (
                    <span
                      className="rounded px-1.5 py-px text-[10px] font-bold"
                      style={{
                        background: STATUS_TONE_STYLE[scenario.category === "valid" ? "ok" : "warn"].bg,
                        color: STATUS_TONE_STYLE[scenario.category === "valid" ? "ok" : "warn"].text,
                      }}
                    >
                      {scenario.category === "valid" ? "SUCCESS" : scenario.category.toUpperCase()}
                    </span>
                  )}
                  {scenario.name && <span className="font-semibold text-[#16302b]">{scenario.name}</span>}
                  <span>· {copy.detail.expected(scenario.expectedStatus)} ·</span>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={copyCorrelationId}
                className="h-auto! w-auto! max-w-56 gap-1 p-0! font-mono text-xs font-normal text-[#0E9F8E] hover:bg-transparent! hover:underline"
                title={copy.detail.copyTraceId}
              >
                <span className="truncate">
                  {copy.detail.traceIdLabel}: {selectedCorrelationId}
                </span>
                <Copy className="size-3 shrink-0" />
                {copied && <span className="text-[#0B7A6D]">✓</span>}
              </Button>
              <span>· {new Date(request.createdAt).toLocaleString()}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {verdict && verdictScenario && (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: STATUS_TONE_STYLE[verdictTone].bg, color: STATUS_TONE_STYLE[verdictTone].text }}
              >
                <span className="size-1.5 rounded-full bg-current" />
                <span>
                  {verdict === "pass"
                    ? copy.detail.verdict.pass
                    : verdict === "fail"
                      ? copy.detail.verdict.fail(verdictScenario.expectedStatus, actualStatus)
                      : copy.detail.verdict.pending}
                </span>
                {verdict === "pass" && (
                  <span className="font-mono">
                    · {actualStatus} {httpStatusText(actualStatus)} · {request.durationMs}ms
                  </span>
                )}
              </span>
            )}
            {realtime && (
              <Button
                type="button"
                size="sm"
                className="w-auto! gap-1.5"
                loading={realtime.isStarting}
                disabled={!realtime.scenario || runInFlight}
                title={realtime.scenario ? undefined : copy.detail.actions.runRealtimeNoScenario}
                onClick={realtime.onRun}
              >
                <Play className="size-3.5" />
                {runInFlight
                  ? copy.detail.verdict.pending
                  : variant === "full" && (liveView || realtime.hasRun)
                    ? copy.detail.actions.rerunRealtime
                    : copy.detail.actions.runRealtime}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" className="w-auto! gap-1.5" onClick={copyCurl}>
              <Copy className="size-3.5" />
              {copy.detail.actions.copyCurl}
            </Button>
            {(variant === "full" || positionIndex >= 0) && (
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title={copy.detail.prev}
                aria-label={copy.detail.prev}
                disabled={positionIndex < 0}
                onClick={() => goTo(-1)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title={copy.detail.next}
                aria-label={copy.detail.next}
                disabled={positionIndex < 0}
                onClick={() => goTo(1)}
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
            )}
            <Button type="button" size="icon-sm" title={copy.detail.close} aria-label={copy.detail.close} onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {positionIndex >= 0 && (
            <p className="-mb-2 text-[11px] text-[#8AA09B]">
              {copy.detail.headerPosition(positionIndex + 1, filteredRequests.length)} · {copy.detail.escHint}
            </p>
          )}

          {errorNode && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <div>
                <p className="text-xs font-semibold text-red-600">
                  {copy.detail.errorBox(serviceNameOf(errorNode.serviceName))}
                </p>
                <p className="text-xs text-red-500">{errorNode.errorMessage}</p>
              </div>
            </div>
          )}

          {/* ── Pipeline ── */}
          {(nodes.length > 0 || runInFlight) && (
            <section>
              <h3 className="mb-2 text-[11px] font-bold tracking-wide text-[#8AA09B] uppercase">
                {copy.detail.pipeline.title}
                <span className="ml-1 font-medium normal-case"> · {copy.detail.live.clickToTrack}</span>
              </h3>
              <TracePipeline
                nodes={stale ? [] : nodes}
                copy={copy}
                activeService={stale || replaying ? null : activeNode?.serviceName}
                expectedServices={runInFlight || skippedServices.length > 0 ? runExpected : undefined}
                skipped={skippedServices}
                progress={progress}
                focusService={focusService}
                onSelectService={(service) => {
                  setFocusService(service);
                  const first = service ? nodes.findIndex((n) => n.serviceName === service) : -1;
                  if (first >= 0) onSpanIdxChange(first);
                }}
              />
            </section>
          )}

          {realtime && (
            <LiveTracePanel
              live={liveView}
              running={runInFlight}
              subtitle={liveSubtitle}
              lines={shownLines}
              copy={copy}
              onStop={realtime.onStop}
              focusService={focusService}
              onClearFocus={() => setFocusService(null)}
            />
          )}

          <div className={cn("flex flex-col gap-4 transition-opacity duration-300", stale && "pointer-events-none opacity-50")}>
          {/* ── Per-service Request / Response ── */}
          {variant === "services" &&
            nodes.map((node, i) =>
              replaying && !frontier.entered.has(i) ? null : (
                <SpanDetail
                  key={node.id}
                  node={node}
                  spanIdx={i}
                  pending={replaying && !exitedIdx.has(i)}
                  nodes={nodes}
                  totalMs={totalMs}
                  onJump={onSpanIdxChange}
                  showProcessing={false}
                  copy={copy}
                />
              ),
            )}

          {/* ── Span detail ── */}
          {variant === "full" && activeNode && (
            <SpanDetail
              node={activeNode}
              spanIdx={shownIdx}
              pending={replaying && !exitedIdx.has(shownIdx)}
              nodes={nodes}
              totalMs={totalMs}
              onJump={onSpanIdxChange}
              copy={copy}
            />
          )}

          {/* ── Summary ── */}
          {variant === "full" && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              [copy.detail.summary.totalTime, `${request.durationMs}ms`, false],
              [copy.detail.summary.servicesPassedLabel, copy.detail.summary.servicesPassed(distinctServicesCount(nodes)), false],
              [
                copy.detail.summary.spanCountLabel,
                copy.detail.summary.spanCount(nodes.length, errorNodeCount(nodes)),
                false,
              ],
              [copy.detail.summary.clientIp, request.ip ?? "—", true],
            ].map(([label, value, mono]) => (
              <div key={String(label)} className="rounded-xl border border-[#E7EEEC] bg-white p-3">
                <p className="text-[11px] text-[#8AA09B]">{label}</p>
                <p className={cn("text-sm font-bold text-[#16302b]", mono && "font-mono")}>{value}</p>
              </div>
            ))}
          </div>
          )}

          {/* ── Waterfall ── */}
          {variant === "full" && (
          <div className="rounded-xl border border-[#E7EEEC] bg-white p-4">
            <h3 className="text-sm font-bold text-[#16302b]">{copy.detail.waterfall.title}</h3>

            {isTraceLoading && nodes.length === 0 ? (
              <p className="mt-3 text-xs text-[#8AA09B]">{copy.detail.loadingTrace}</p>
            ) : (
              <>
                <div className="mt-1 flex justify-between font-mono text-[10px] text-[#8AA09B]">
                  <span>{copy.detail.waterfall.timeStart}</span>
                  <span>{Math.round(totalMs / 2)}ms</span>
                  <span>{copy.detail.waterfall.timeEnd(totalMs)}</span>
                </div>
                <div className="relative mt-1 border-t border-[#EEF3F1]">
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="border-l border-[#F3F7F5] first:border-l-0" />
                    ))}
                  </div>

                  <div className="relative flex flex-col">
                    {nodes.map((node, i) => {
                      const active = i === shownIdx;
                      const tone = nodeStatusTone(node);
                      const barColor = tone === "ok" ? serviceColorOf(node.serviceName) : STATUS_TONE_STYLE[tone].text;
                      const left = (node.startMs / totalMs) * 100;
                      const width = Math.max(0.4, (node.durationMs / totalMs) * 100);
                      const operation = node.type === "HTTP" ? `${node.method} ${node.path}` : node.path;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => onSpanIdxChange(i)}
                          className={cn(
                            "flex items-center gap-2 rounded-md py-1.5 pr-2 text-left transition-colors",
                            active ? "bg-[#EAF6F2]" : "hover:bg-[#F8FAF9]",
                            focusService && node.serviceName !== focusService && "opacity-40",
                          )}
                          style={{ paddingLeft: `${node.depth * 14 + 4}px` }}
                        >
                          <span className="flex w-44 shrink-0 items-center gap-1.5 overflow-hidden">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ background: serviceColorOf(node.serviceName) }}
                            />
                            <span className="truncate text-xs font-semibold text-[#16302b]">
                              {serviceNameOf(node.serviceName)}
                            </span>
                          </span>
                          <span className="w-40 shrink-0 truncate font-mono text-[11px] text-[#8AA09B]">
                            {operation}
                          </span>
                          <span className="relative h-4 flex-1">
                            <span
                              className="absolute top-0 h-4 rounded-sm"
                              style={{ left: `${left}%`, width: `${width}%`, background: barColor }}
                            />
                          </span>
                          <span className="w-14 shrink-0 text-right font-mono text-[11px] text-[#8AA09B]">
                            {node.durationMs}ms
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SpanDetail({
  node,
  spanIdx,
  pending,
  nodes,
  totalMs,
  onJump,
  showProcessing = true,
  copy,
}: {
  node: LoggerTraceNode;
  spanIdx: number;
  /** Replay đang dừng ở hop này, chưa có kết quả trả về. */
  pending: boolean;
  nodes: LoggerTraceNode[];
  totalMs: number;
  onJump: (index: number) => void;
  /** Khối "Xử lý" (số liệu + hop con) — ẩn ở bản `services` của dialog. */
  showProcessing?: boolean;
  copy: LoggerDictionary;
}) {
  const parentIdx = parentIndexOf(nodes, spanIdx);
  const tone = nodeStatusTone(node);
  const isHttp = node.type === "HTTP";
  const operation = isHttp ? `${node.method} ${node.path}` : node.path;
  const methodStyle = methodColorOf(node.method);

  const callerLabel =
    parentIdx !== null ? serviceNameOf(nodes[parentIdx].serviceName) : copy.detail.span.callFlow.client;

  const reqSize = formatBytes(node.requestBody);
  const resSize = formatBytes(node.responseBody);
  const children = directChildIndexes(nodes, spanIdx);
  const failed = tone === "err";
  const statusTone = failed ? "err" : httpStatusTone(node.statusCode);
  const errorKind = errorKindOf(node);
  const serviceLabel = serviceNameOf(node.serviceName);
  const hint = errorKind
    ? errorKind === "timeout"
      ? copy.detail.span.hints.timeout(serviceLabel, node.path.split("/").pop() || node.path)
      : copy.detail.span.hints[errorKind](serviceLabel)
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#EEF3F1] px-4 py-3">
        <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: serviceColorOf(node.serviceName) }} />
        <span className="text-base font-bold text-[#16302b]">{serviceNameOf(node.serviceName)}</span>
        <span className="font-mono text-xs text-[#8AA09B]">
          · {copy.detail.span.calledFrom}{" "}
          <span className="font-sans font-bold text-[#16302b]">{callerLabel}</span> {copy.detail.span.via}{" "}
          {node.type}
        </span>
        <span
          className="ml-auto rounded-md px-2 py-0.5 text-xs font-semibold"
          style={{ background: STATUS_TONE_STYLE[tone].bg, color: STATUS_TONE_STYLE[tone].text }}
        >
          {tone.toUpperCase()}
        </span>
        <span
          className="font-mono text-sm font-bold"
          style={{ color: failed ? STATUS_TONE_STYLE.err.text : "#16302b" }}
        >
          {formatDuration(node.durationMs)}
        </span>
      </div>

      {failed && !pending && (
        <div className="flex items-start gap-2.5 border-b border-[#F6D9D2] bg-[#FEF1EE] px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#C2412B]" />
          <div className="min-w-0 text-xs leading-relaxed text-[#C2412B]">
            <p className="break-words">
              <span className="font-bold">{copy.detail.span.errorTitle}</span>{" "}
              <span className="font-mono font-semibold">{node.errorMessage ?? errorCodeOf(node) ?? node.statusCode}</span>
            </p>
            {hint && (
              <p className="mt-0.5 text-[#8A3A2B]">
                <span className="font-bold">{copy.detail.span.hintTitle}</span> {hint}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 md:divide-x md:divide-[#EEF3F1]">
        {/* Request */}
        <div className="flex min-w-0 flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#E3EDFF] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#2563EB] uppercase">
              {copy.detail.span.tabs.req}
            </span>
            <span className="text-[11px] text-[#8AA09B]">{reqSize}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#E7EEEC] bg-[#F8FAF9] px-2.5 py-2">
            {isHttp && (
              <span
                className="shrink-0 rounded px-1.5 py-px font-mono text-[11px] font-bold"
                style={{ background: methodStyle.bg, color: methodStyle.text }}
              >
                {node.method}
              </span>
            )}
            <span className="min-w-0 truncate font-mono text-xs text-[#16302b]" title={operation}>
              {isHttp ? `${API_BASE_URL.replace(/\/$/, "")}${node.path}` : node.path}
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-[#8AA09B]">{copy.detail.span.requestTab.body}</p>
            <CodeBlock text={node.requestBody ? prettyBody(node.requestBody) : copy.detail.span.noBody} />
          </div>
        </div>

        {/* Response */}
        <div className="flex min-w-0 flex-col gap-2.5 border-t border-[#EEF3F1] p-4 md:border-t-0">
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase"
              style={
                failed && !pending
                  ? { background: STATUS_TONE_STYLE.err.bg, color: STATUS_TONE_STYLE.err.text }
                  : { background: "#E4F6EF", color: "#0B7A6D" }
              }
            >
              {copy.detail.span.tabs.res}
            </span>
            {!pending && <span className="text-[11px] text-[#8AA09B]">{resSize}</span>}
          </div>
          {pending ? (
            <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#C9D6D2] text-xs text-[#8AA09B]">
              <Loader2 className="size-4 animate-spin text-[#0E9F8E]" />
              <span>{copy.detail.span.processingHint(serviceNameOf(node.serviceName))}</span>
            </div>
          ) : (
            <>
              <div
                className="flex items-center justify-between rounded-lg px-2.5 py-2 font-mono text-xs font-semibold"
                style={{ background: STATUS_TONE_STYLE[statusTone].bg, color: STATUS_TONE_STYLE[statusTone].text }}
              >
                <span>
                  {node.statusCode !== null
                    ? `${node.statusCode} ${httpStatusText(node.statusCode)}`
                    : (errorCodeOf(node) ?? "—")}
                </span>
                <span>{formatDuration(node.durationMs)}</span>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-[#8AA09B]">{copy.detail.span.responseTab.body}</p>
                <CodeBlock
                  text={node.responseBody ? prettyBody(node.responseBody) : copy.detail.span.noBody}
                  tone={tone === "err" ? "err" : undefined}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Processing */}
      {showProcessing && (
      <div className="flex flex-col gap-3 border-t border-[#EEF3F1] p-4">
        <h4 className="text-xs font-bold tracking-wide text-[#8AA09B] uppercase">{copy.detail.span.tabs.processing}</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            [copy.detail.span.processingTab.metrics.start, `${node.startMs}ms`],
            [copy.detail.span.processingTab.metrics.duration, formatDuration(node.durationMs)],
            [copy.detail.span.processingTab.metrics.percentOfTrace, `${((node.durationMs / totalMs) * 100).toFixed(1)}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-[#F8FAF9] p-2">
              <p className="text-[10px] text-[#8AA09B]">{label}</p>
              <p className="truncate font-mono text-xs font-semibold text-[#16302b]" title={value}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-[#8AA09B]">{copy.detail.span.processingTab.childrenTitle}</p>
          {children.length === 0 ? (
            <p className="text-xs text-muted-foreground">{copy.detail.span.processingTab.noChildren}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {children.map((ci) => (
                <button
                  key={nodes[ci].id}
                  type="button"
                  onClick={() => onJump(ci)}
                  className="flex items-center gap-2 rounded-lg border border-[#E7EEEC] bg-white p-2 text-left text-xs hover:bg-[#F8FAF9]"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: serviceColorOf(nodes[ci].serviceName) }}
                  />
                  <span className="font-semibold text-[#16302b]">{serviceNameOf(nodes[ci].serviceName)}</span>
                  <span className="truncate font-mono text-[#8AA09B]">
                    {nodes[ci].type === "HTTP" ? `${nodes[ci].method} ${nodes[ci].path}` : nodes[ci].path}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[#8AA09B]">{nodes[ci].durationMs}ms</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
