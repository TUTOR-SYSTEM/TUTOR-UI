"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ArrowRight, Copy, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import {
  STATUS_TONE_STYLE,
  buildTraceTree,
  directChildIndexes,
  distinctServicesCount,
  errorNodeCount,
  formatBytes,
  httpStatusText,
  httpStatusTone,
  nodeStatusTone,
  parentIndexOf,
  serviceColorOf,
  serviceNameOf,
} from "./logger-utils";
import type { LoggerDictionary } from "@/lib/i18n/logger.dictionary";
import type { ApiRequestLog, LoggerSpanTab, LoggerTraceNode } from "@/types";

function CodeBlock({ text, tone }: { text: string; tone?: "err" }) {
  return (
    <pre
      className={cn(
        "max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg p-2.5 font-mono text-xs",
        tone === "err" ? "bg-red-50 text-red-600" : "bg-[#F3F7F5] text-[#16302b]",
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
  spanTab,
  onSpanTabChange,
  trace,
  isTraceLoading,
  copy,
}: {
  filteredRequests: ApiRequestLog[];
  selectedCorrelationId: string | null;
  onSelectCorrelationId: (correlationId: string) => void;
  onClose: () => void;
  spanIdx: number;
  onSpanIdxChange: (index: number) => void;
  spanTab: LoggerSpanTab;
  onSpanTabChange: (tab: LoggerSpanTab) => void;
  trace: ApiRequestLog[] | undefined;
  isTraceLoading: boolean;
  copy: LoggerDictionary;
}) {
  const isOpen = !!selectedCorrelationId;

  const positionIndex = useMemo(
    () => filteredRequests.findIndex((r) => r.correlationId === selectedCorrelationId),
    [filteredRequests, selectedCorrelationId],
  );
  const listRequest = positionIndex >= 0 ? filteredRequests[positionIndex] : null;

  const nodes = useMemo(() => buildTraceTree(trace ?? []), [trace]);
  const rootNode = nodes[0];
  const request = rootNode ?? listRequest;

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

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  if (!isOpen || typeof document === "undefined" || !selectedCorrelationId || !request) return null;

  const totalMs = Math.max(1, rootNode?.durationMs ?? request.durationMs);
  const activeNode: LoggerTraceNode | undefined = nodes[spanIdx];
  const errorNode = nodes.find((n) => n.errorMessage) ?? (request.errorMessage ? request : null);

  const goTo = (delta: 1 | -1) => {
    const total = filteredRequests.length;
    if (total === 0 || positionIndex < 0) return;
    const next = (positionIndex + delta + total) % total;
    onSelectCorrelationId(filteredRequests[next].correlationId);
    onSpanIdxChange(0);
  };

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

      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-[980px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#E7EEEC] bg-[#F4F8F7] shadow-xl">
        {/* ── Top bar ── */}
        <header className="flex shrink-0 items-center gap-3 border-b border-[#E7EEEC] bg-white px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-[#16302b]">{copy.detail.headerTitle}</h2>
            <p className="truncate text-xs text-[#8AA09B]">
              {positionIndex >= 0
                ? `${copy.detail.headerPosition(positionIndex + 1, filteredRequests.length)} · `
                : ""}
              {copy.detail.escHint}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-auto! gap-1"
            disabled={positionIndex < 0}
            onClick={() => goTo(-1)}
          >
            <ArrowLeft className="size-3.5" />
            {copy.detail.prev}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-auto! gap-1"
            disabled={positionIndex < 0}
            onClick={() => goTo(1)}
          >
            {copy.detail.next}
            <ArrowRight className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" title={copy.detail.close} onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ── Summary ── */}
          <div className="rounded-xl border border-[#E7EEEC] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#F3F7F5] px-2 py-0.5 font-mono text-xs font-bold text-[#16302b]">
                {request.method ?? request.type}
              </span>
              <span className="min-w-0 truncate font-mono text-sm font-semibold text-[#16302b]">
                {request.path}
              </span>
              <span
                className="ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold"
                style={{
                  background: STATUS_TONE_STYLE[httpStatusTone(request.statusCode)].bg,
                  color: STATUS_TONE_STYLE[httpStatusTone(request.statusCode)].text,
                }}
              >
                {request.statusCode} {httpStatusText(request.statusCode)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8AA09B]">
              <span>{new Date(request.createdAt).toLocaleString()}</span>
              <button
                type="button"
                onClick={copyCorrelationId}
                className="flex items-center gap-1 font-mono text-[#0E9F8E] hover:underline"
                title={copy.detail.copyTraceId}
              >
                {copy.detail.traceIdLabel}: {selectedCorrelationId}
                <Copy className="size-3" />
                {copied && <span className="text-[#0B7A6D]">✓</span>}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-lg bg-[#F8FAF9] p-2.5">
                <p className="text-[11px] text-[#8AA09B]">{copy.detail.summary.totalTime}</p>
                <p className="text-sm font-bold text-[#16302b]">{request.durationMs}ms</p>
              </div>
              <div className="rounded-lg bg-[#F8FAF9] p-2.5">
                <p className="text-[11px] text-[#8AA09B]">{copy.detail.summary.servicesPassedLabel}</p>
                <p className="text-sm font-bold text-[#16302b]">
                  {copy.detail.summary.servicesPassed(distinctServicesCount(nodes))}
                </p>
              </div>
              <div className="rounded-lg bg-[#F8FAF9] p-2.5">
                <p className="text-[11px] text-[#8AA09B]">{copy.detail.summary.spanCountLabel}</p>
                <p className="text-sm font-bold text-[#16302b]">
                  {copy.detail.summary.spanCount(nodes.length, errorNodeCount(nodes))}
                </p>
              </div>
              <div className="rounded-lg bg-[#F8FAF9] p-2.5">
                <p className="text-[11px] text-[#8AA09B]">{copy.detail.summary.clientIp}</p>
                <p className="font-mono text-sm font-bold text-[#16302b]">{request.ip ?? "—"}</p>
              </div>
            </div>

            {errorNode && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-xs font-semibold text-red-600">
                    {copy.detail.errorBox(serviceNameOf(errorNode.serviceName))}
                  </p>
                  <p className="text-xs text-red-500">{errorNode.errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Waterfall ── */}
          <div className="mt-3 rounded-xl border border-[#E7EEEC] bg-white p-4">
            <h3 className="text-sm font-bold text-[#16302b]">{copy.detail.waterfall.title}</h3>

            {isTraceLoading ? (
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
                      const active = i === spanIdx;
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

          {/* ── Span detail ── */}
          {activeNode && (
            <SpanDetail
              node={activeNode}
              spanIdx={spanIdx}
              nodes={nodes}
              totalMs={totalMs}
              onJump={onSpanIdxChange}
              spanTab={spanTab}
              onSpanTabChange={onSpanTabChange}
              copy={copy}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SpanDetail({
  node,
  spanIdx,
  nodes,
  totalMs,
  onJump,
  spanTab,
  onSpanTabChange,
  copy,
}: {
  node: LoggerTraceNode;
  spanIdx: number;
  nodes: LoggerTraceNode[];
  totalMs: number;
  onJump: (index: number) => void;
  spanTab: LoggerSpanTab;
  onSpanTabChange: (tab: LoggerSpanTab) => void;
  copy: LoggerDictionary;
}) {
  const parentIdx = parentIndexOf(nodes, spanIdx);
  const tone = nodeStatusTone(node);
  const operation = node.type === "HTTP" ? `${node.method} ${node.path}` : node.path;

  const callerLabel =
    parentIdx !== null ? serviceNameOf(nodes[parentIdx].serviceName) : copy.detail.span.callFlow.client;

  const reqSize = formatBytes(node.requestBody);
  const resSize = formatBytes(node.responseBody);
  const children = directChildIndexes(nodes, spanIdx);

  return (
    <div className="mt-3 rounded-xl border border-[#E7EEEC] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: serviceColorOf(node.serviceName) }} />
        <span className="text-sm font-bold text-[#16302b]">{serviceNameOf(node.serviceName)}</span>
        <span className="font-mono text-xs text-[#8AA09B]">{operation}</span>
        <span
          className="ml-auto rounded-md px-2 py-0.5 text-xs font-semibold"
          style={{ background: STATUS_TONE_STYLE[tone].bg, color: STATUS_TONE_STYLE[tone].text }}
        >
          {tone.toUpperCase()}
        </span>
      </div>

      {/* Call flow */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#F8FAF9] p-3 text-xs">
        <span className="rounded-md bg-white px-2 py-1 font-semibold text-[#16302b] shadow-sm">
          {callerLabel}
        </span>
        <span className="flex flex-col items-center text-[10px] text-[#8AA09B]">
          <span>{reqSize} · {resSize}</span>
          <span>→</span>
        </span>
        <span
          className="rounded-md px-2 py-1 font-semibold text-white shadow-sm"
          style={{ background: serviceColorOf(node.serviceName) }}
        >
          {serviceNameOf(node.serviceName)}
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex items-center gap-1 border-b border-[#EEF3F1]">
        {(
          [
            ["req", copy.detail.span.tabs.req, reqSize],
            ["res", copy.detail.span.tabs.res, String(node.statusCode ?? "—")],
            ["processing", copy.detail.span.tabs.processing, String(children.length)],
          ] as [LoggerSpanTab, string, string][]
        ).map(([key, label, badge]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSpanTabChange(key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
              spanTab === key
                ? "border-[#0E9F8E] text-[#0E9F8E]"
                : "border-transparent text-[#8AA09B] hover:text-[#16302b]",
            )}
          >
            {label}
            <span className="rounded-full bg-[#F3F7F5] px-1.5 py-px text-[10px] font-bold text-[#5C726D]">
              {badge}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        {spanTab === "req" && (
          <div className="flex flex-col gap-2.5">
            <p className="font-mono text-xs font-semibold text-[#16302b]">{operation}</p>
            <div>
              <p className="mb-1 text-xs font-semibold text-[#8AA09B]">{copy.detail.span.requestTab.body}</p>
              <CodeBlock text={node.requestBody ?? copy.detail.span.noBody} />
            </div>
          </div>
        )}

        {spanTab === "res" && (
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-mono font-semibold text-[#16302b]">
                {node.statusCode ?? httpStatusText(node.statusCode)}
              </span>
              <span className="text-[#8AA09B]">
                {copy.detail.span.responseTab.responseTime}: {node.durationMs}ms
              </span>
              <span className="text-[#8AA09B]">{copy.detail.span.responseTab.size}: {resSize}</span>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-[#8AA09B]">{copy.detail.span.responseTab.body}</p>
              <CodeBlock text={node.responseBody ?? copy.detail.span.noBody} tone={tone === "err" ? "err" : undefined} />
            </div>
          </div>
        )}

        {spanTab === "processing" && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                [copy.detail.span.processingTab.metrics.start, `${node.startMs}ms`],
                [copy.detail.span.processingTab.metrics.duration, `${node.durationMs}ms`],
                [
                  copy.detail.span.processingTab.metrics.percentOfTrace,
                  `${((node.durationMs / totalMs) * 100).toFixed(1)}%`,
                ],
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
              <p className="mb-1 text-xs font-semibold text-[#8AA09B]">
                {copy.detail.span.processingTab.childrenTitle}
              </p>
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
    </div>
  );
}
