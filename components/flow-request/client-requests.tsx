"use client";

import { useMemo } from "react";

import {
  FLOW_ACCENT_COLORS,
  FLOW_BG_CARD,
  FLOW_BORDER,
  FLOW_GROUP_ACCENT,
  FLOW_REQUEST_SERVICE_GROUP,
  FLOW_REQUESTS,
  FLOW_TEXT_MUTED,
  FLOW_TEXT_SECONDARY,
} from "@/components/flow-request/flow-request.data";
import type { FlowRequestDictionary } from "@/lib/i18n/flow-request.dictionary";
import type { DiagramRequest, DiagramRequestMethod, FlowId } from "@/types";

const METHOD_COLOR: Record<DiagramRequestMethod, string> = {
  GET: "#67D8B0",
  POST: "#35B6FF",
  PUT: "#956BFF",
  PATCH: "#F4C95D",
  DELETE: "#FF5F61",
};

const PREVIEW_PER_GROUP = 3;
const MAX_VISIBLE = 9;

export type ClientRequestsProps = {
  copy: FlowRequestDictionary;
  flowId: FlowId;
  selectedReqId: string | null;
  onSelectFlow: (id: FlowId) => void;
  onSelectRequest: (id: string) => void;
};

export function ClientRequests({
  copy,
  flowId,
  selectedReqId,
  onSelectRequest,
}: ClientRequestsProps) {
  const groups = useMemo(() => {
    const map: Record<Exclude<FlowId, "all">, DiagramRequest[]> = {
      user: [],
      tutor: [],
      third: [],
    };
    for (const req of FLOW_REQUESTS) {
      const group = FLOW_REQUEST_SERVICE_GROUP[req.serviceNodeId];
      if (group && group !== "shared") map[group].push(req);
    }
    return map;
  }, []);

  const prepared = useMemo(() => {
    const ids = ["user", "tutor", "third"] as const;
    const active = flowId === "all" ? null : flowId;
    const list: DiagramRequest[] = [];
    if (active) list.push(...groups[active].slice(0, PREVIEW_PER_GROUP));
    for (const id of ids) {
      if (id === active) continue;
      list.push(...groups[id].slice(0, PREVIEW_PER_GROUP));
    }
    const relevantTotal = active
      ? groups[active].length
      : groups.user.length + groups.tutor.length + groups.third.length;
    return { list: list.slice(0, MAX_VISIBLE), relevantTotal };
  }, [flowId, groups]);

  const litCount = prepared.list.filter((req) => {
    const group = FLOW_REQUEST_SERVICE_GROUP[req.serviceNodeId];
    return flowId === "all" || group === flowId;
  }).length;
  const extra = prepared.relevantTotal - litCount;

  return (
    <div
      className="rounded-[10px] border p-2.5"
      style={{ background: FLOW_BG_CARD, borderColor: FLOW_BORDER }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-mono text-[10px] font-bold tracking-wider"
          style={{ color: FLOW_TEXT_SECONDARY }}
        >
          {copy.clientRequests.title}
        </span>
        <span className="font-mono text-[10px]" style={{ color: FLOW_TEXT_MUTED }}>
          {prepared.relevantTotal}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-snug" style={{ color: FLOW_TEXT_MUTED }}>
        {copy.clientRequests.hint}
      </p>
      <div className="mt-2 space-y-1">
        {prepared.list.map((req) => {
          const group = FLOW_REQUEST_SERVICE_GROUP[req.serviceNodeId];
          if (!group || group === "shared") return null;
          const lit = flowId === "all" || group === flowId;
          const selected = req.id === selectedReqId;
          const accent = flowId === "all" ? null : FLOW_ACCENT_COLORS[FLOW_GROUP_ACCENT[group]];
          return (
            <button
              key={req.id}
              type="button"
              onClick={() => onSelectRequest(req.id)}
              aria-pressed={selected}
              className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-[rgba(38,51,77,0.6)]"
              style={{
                opacity: lit ? 1 : 0.35,
                filter: lit ? undefined : "saturate(0.4)",
                backgroundColor: selected ? (accent ? accent.soft : "rgba(38,51,77,0.6)") : undefined,
                boxShadow: selected && accent ? `0 0 12px ${accent.glow}` : undefined,
              }}
            >
              <span
                className="w-10 shrink-0 font-mono text-[8.5px] font-bold"
                style={{ color: lit ? METHOD_COLOR[req.method] : FLOW_TEXT_MUTED }}
              >
                {req.method}
              </span>
              <code
                className="min-w-0 flex-1 truncate font-mono text-[9.5px]"
                style={{ color: lit && accent ? accent.bright : FLOW_TEXT_SECONDARY }}
              >
                {req.endpoint}
              </code>
            </button>
          );
        })}
        {extra > 0 ? (
          <div
            className="px-1 pt-0.5 font-mono text-[9px]"
            style={{ color: FLOW_TEXT_MUTED }}
          >
            {copy.clientRequests.more.replace("{n}", String(extra))}
          </div>
        ) : null}
      </div>
    </div>
  );
}