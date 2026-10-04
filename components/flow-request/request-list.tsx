"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import {
  FLOW_ACCENT_COLORS,
  FLOW_BG_CARD,
  FLOW_BG_PANEL,
  FLOW_BORDER,
  FLOW_BORDER_SOFT,
  FLOW_GROUP_ACCENT,
  FLOW_NODE_BY_ID,
  FLOW_REQUEST_SERVICE_GROUP,
  FLOW_REQUESTS,
  FLOW_TEXT_MUTED,
  FLOW_TEXT_PRIMARY,
  FLOW_TEXT_SECONDARY,
  FLOW_UNROUTED_REQUESTS,
} from "@/components/flow-request/flow-request.data";
import { useFlowRequestCopy } from "@/hooks/useFlowRequestCopy.hook";
import type { FlowRequestDictionary } from "@/lib/i18n/flow-request.dictionary";
import { cn } from "@/lib/utils";
import type { DiagramRequest, DiagramRequestMethod, FlowId } from "@/types";

const METHOD_COLOR: Record<DiagramRequestMethod, string> = {
  GET: "#67D8B0",
  POST: "#35B6FF",
  PUT: "#956BFF",
  PATCH: "#F4C95D",
  DELETE: "#FF5F61",
};

const ROW_COLUMNS =
  "grid grid-cols-[56px_1fr_1.9fr] items-center gap-3 px-4";

function nodeName(copy: FlowRequestDictionary, nodeId: string | undefined): string | null {
  if (!nodeId) return null;
  const node = FLOW_NODE_BY_ID.get(nodeId);
  return copy.nodes[(node?.copyKey ?? "kafka") as keyof typeof copy.nodes].name;
}

function groupAccent(req: DiagramRequest) {
  return FLOW_GROUP_ACCENT[FLOW_REQUEST_SERVICE_GROUP[req.serviceNodeId] ?? "shared"];
}

const ENTRY_NAMES: Record<string, string> = {
  "ui-web": "UI",
  "api-gateway": "GW",
};

/** Luồng request: UI → GW → [topic] (↷ emits) → service → datastore. */
export function FlowChain({
  copy,
  req,
}: {
  copy: FlowRequestDictionary;
  req: DiagramRequest;
}) {
  const accent = FLOW_ACCENT_COLORS[groupAccent(req)];
  const serviceName_ = nodeName(copy, req.serviceNodeId);
  const storeName = nodeName(copy, req.storeNodeId);

  const hops: Array<React.ReactNode> = [];
  (["ui-web", "api-gateway"] as const).forEach((entry, index) => {
    if (index > 0) {
      hops.push(
        <ChevronRight key={`arrow-${entry}`} className="size-3 shrink-0" aria-hidden />,
      );
    }
    hops.push(
      <span
        key={entry}
        className="font-mono text-[10.5px] font-medium"
        style={{ color: ENTRY_NAMES[entry] === "GW" ? FLOW_ACCENT_COLORS.cyan.bright : FLOW_TEXT_SECONDARY }}
      >
        {ENTRY_NAMES[entry]}
      </span>,
    );
  });

  if (req.topic) {
    hops.push(<ChevronRight key="arrow-topic" className="size-3 shrink-0" aria-hidden />);
    hops.push(
      <code
        key="topic"
        className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]"
        style={{
          color: accent.bright,
          borderColor: `${accent.core}40`,
          backgroundColor: `${accent.core}12`,
        }}
      >
        {req.topic}
      </code>,
    );
  }

  if (req.emits?.length) {
    req.emits.forEach((emit, index) => {
      hops.push(<span key={`emits-arrow-${index}`} className="shrink-0 text-[10px] opacity-70">↷</span>);
      hops.push(
        <code
          key={`emits-${index}`}
          className="shrink-0 rounded border border-dashed px-1.5 py-0.5 font-mono text-[10px]"
          style={{
            color: FLOW_TEXT_MUTED,
            borderColor: FLOW_BORDER,
            backgroundColor: "transparent",
          }}
        >
          {emit}
        </code>,
      );
    });
  }

  if (serviceName_) {
    hops.push(<ChevronRight key="arrow-service" className="size-3 shrink-0" aria-hidden />);
    hops.push(
      <span
        key="service"
        className="shrink-0 font-mono text-[10.5px] font-semibold"
        style={{ color: accent.bright }}
      >
        {serviceName_}
      </span>,
    );
  }

  if (storeName) {
    hops.push(<ChevronRight key="arrow-store" className="size-3 shrink-0" aria-hidden />);
    hops.push(
      <span
        key="store"
        className="shrink-0 font-mono text-[10.5px]"
        style={{ color: FLOW_TEXT_SECONDARY }}
      >
        {storeName}
      </span>,
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1" aria-label={req.topic || req.endpoint}>
      {hops}
    </div>
  );
}

function MethodBadge({ method }: { method: DiagramRequestMethod }) {
  const methodColor = METHOD_COLOR[method];
  return (
    <span
      className="inline-flex w-fit items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
      style={{ color: methodColor, backgroundColor: `${methodColor}18` }}
    >
      {method}
    </span>
  );
}

function TableHeader({ copy }: { copy: FlowRequestDictionary }) {
  return (
    <div className={cn(ROW_COLUMNS, "border-b py-2")} style={{ borderColor: FLOW_BORDER_SOFT }}>
      <span
        className="text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: FLOW_TEXT_MUTED }}
      >
        {copy.requests.colMethod}
      </span>
      <span
        className="text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: FLOW_TEXT_MUTED }}
      >
        {copy.requests.colEndpoint}
      </span>
      <span
        className="text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: FLOW_TEXT_MUTED }}
      >
        {copy.requests.colFlow}
      </span>
    </div>
  );
}

function Row({ copy, req }: { copy: FlowRequestDictionary; req: DiagramRequest }) {
  return (
    <div
      className={cn(ROW_COLUMNS, "border-b py-2")}
      style={{
        borderColor: FLOW_BORDER_SOFT,
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = FLOW_BG_CARD)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <MethodBadge method={req.method} />
      <code className="font-mono text-[11px]" style={{ color: FLOW_TEXT_PRIMARY }}>
        {req.endpoint}
      </code>
      <FlowChain copy={copy} req={req} />
    </div>
  );
}

export function RequestList() {
  const copy = useFlowRequestCopy();
  const [tab, setTab] = useState<FlowId>("all");

  const counts = useMemo(() => {
    const counts: Record<FlowId, number> = {
      all: FLOW_REQUESTS.length,
      user: 0,
      tutor: 0,
      third: 0,
    };
    for (const req of FLOW_REQUESTS) {
      const group = FLOW_REQUEST_SERVICE_GROUP[req.serviceNodeId];
      if (group && group !== "shared") counts[group] += 1;
    }
    return counts;
  }, []);

  const rows = useMemo(
    () =>
      FLOW_REQUESTS.filter((req) =>
        tab === "all" ? true : FLOW_REQUEST_SERVICE_GROUP[req.serviceNodeId] === tab,
      ),
    [tab],
  );

  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold" style={{ color: FLOW_TEXT_PRIMARY }}>
            {copy.requests.heading}
            <span className="ml-2 font-mono text-[11px]" style={{ color: FLOW_TEXT_MUTED }}>
              ({counts.all})
            </span>
          </h2>
          <p className="text-[12px]" style={{ color: FLOW_TEXT_MUTED }}>
            {copy.requests.hint}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "user", "tutor", "third"] as const).map((id) => {
            const active = tab === id;
            const accent =
              id === "all" ? FLOW_GROUP_ACCENT.shared : FLOW_GROUP_ACCENT[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                style={{
                  color: active ? FLOW_TEXT_PRIMARY : FLOW_TEXT_SECONDARY,
                  borderColor: active ? FLOW_ACCENT_COLORS[accent].core : FLOW_BORDER,
                  backgroundColor: active ? FLOW_ACCENT_COLORS[accent].soft : "transparent",
                }}
              >
                {copy.filters[id]}
                <span className="ml-1 font-mono opacity-80">{counts[id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[10px] border"
        style={{ background: FLOW_BG_PANEL, borderColor: FLOW_BORDER }}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <TableHeader copy={copy} />
            <div className="max-h-[460px] overflow-y-auto">
              {rows.length === 0 ? (
                <div
                  className="px-4 py-6 text-center text-[12px]"
                  style={{ color: FLOW_TEXT_MUTED }}
                >
                  {copy.requests.empty}
                </div>
              ) : (
                rows.map((req) => <Row key={req.id} copy={copy} req={req} />)
              )}
            </div>
          </div>
        </div>
      </div>

      {tab === "all" && FLOW_UNROUTED_REQUESTS.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <h3 className="text-[12px] font-semibold" style={{ color: FLOW_TEXT_SECONDARY }}>
            {copy.requests.unroutedHeading}
            <span className="ml-2 font-mono text-[11px]" style={{ color: FLOW_TEXT_MUTED }}>
              ({FLOW_UNROUTED_REQUESTS.length})
            </span>
          </h3>
          <p className="text-[11px]" style={{ color: FLOW_TEXT_MUTED }}>
            {copy.requests.unroutedHint}
          </p>
          <div
            className="overflow-hidden rounded-[10px] border"
            style={{ background: FLOW_BG_PANEL, borderColor: FLOW_BORDER }}
          >
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <TableHeader copy={copy} />
                {FLOW_UNROUTED_REQUESTS.map((req) => (
                  <Row key={req.id} copy={copy} req={req} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}