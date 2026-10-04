"use client";

import { useMemo } from "react";

import {
  FLOW_ACCENT_COLORS,
  FLOW_BG_CARD,
  FLOW_BORDER,
  FLOW_BORDER_SOFT,
  FLOW_GROUP_ACCENT,
  FLOW_NODE_BY_ID,
  FLOW_REQUEST_SERVICE_GROUP,
  FLOW_REQUESTS,
  FLOW_TEXT_MUTED,
  FLOW_TEXT_SECONDARY,
} from "@/components/flow-request/flow-request.data";
import type { FlowRequestDictionary } from "@/lib/i18n/flow-request.dictionary";
import type { FlowId } from "@/types";

const MAX_VISIBLE = 8;

const STORE_LABEL: Record<string, string> = {
  postgres: "PG",
  redis: "Redis",
  "cloudflare-r2": "R2",
};

type TopicRow = {
  topic: string;
  store: string | undefined;
  emits: readonly string[];
};

export type ServiceTopicsProps = {
  copy: FlowRequestDictionary;
  serviceNodeId: string;
  dimmed: boolean;
  onSelectFlow: (groupId: FlowId) => void;
};

export function ServiceTopics({
  copy,
  serviceNodeId,
  dimmed,
  onSelectFlow,
}: ServiceTopicsProps) {
  const topics = useMemo(() => {
    const seen = new Set<string>();
    const rows: TopicRow[] = [];
    for (const req of FLOW_REQUESTS) {
      if (req.serviceNodeId !== serviceNodeId || !req.topic || seen.has(req.topic)) continue;
      seen.add(req.topic);
      rows.push({ topic: req.topic, store: req.storeNodeId, emits: req.emits ?? [] });
    }
    return rows;
  }, [serviceNodeId]);

  const group = FLOW_REQUEST_SERVICE_GROUP[serviceNodeId];
  if (!group || group === "shared") return null;

  const groupAccent = FLOW_ACCENT_COLORS[FLOW_GROUP_ACCENT[group]];
  const list = topics.slice(0, MAX_VISIBLE);
  const extra = topics.length - list.length;

  return (
    <div
      className="rounded-[10px] border p-2.5"
      style={{
        background: FLOW_BG_CARD,
        borderColor: FLOW_BORDER,
        opacity: dimmed ? 0.5 : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-mono text-[10px] font-bold tracking-wider"
          style={{ color: FLOW_TEXT_SECONDARY }}
        >
          {copy.serviceTopics.title}
        </span>
        <span className="font-mono text-[10px]" style={{ color: FLOW_TEXT_MUTED }}>
          {topics.length}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-snug" style={{ color: FLOW_TEXT_MUTED }}>
        {copy.serviceTopics.hint}
      </p>
      <div className="mt-2 space-y-0.5">
        {list.map((row) => {
          const storeNode = row.store ? FLOW_NODE_BY_ID.get(row.store) : undefined;
          const storeAccent = storeNode ? FLOW_ACCENT_COLORS[storeNode.accent] : null;
          return (
            <button
              key={row.topic}
              type="button"
              onClick={() => onSelectFlow(group)}
              className="w-full rounded-md px-1 py-1 text-left transition-colors hover:bg-[rgba(38,51,77,0.6)]"
            >
              <code
                className="block truncate font-mono text-[9.5px]"
                style={{ color: dimmed ? FLOW_TEXT_SECONDARY : groupAccent.bright }}
              >
                {row.topic}
              </code>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {row.store && storeAccent ? (
                  <span
                    className="rounded-full px-1.5 py-px font-mono text-[8.5px] font-semibold"
                    style={{
                      color: storeAccent.bright,
                      backgroundColor: storeAccent.soft,
                      border: `1px solid ${storeAccent.core}66`,
                    }}
                  >
                    {copy.serviceTopics.store} {STORE_LABEL[row.store] ?? row.store}
                  </span>
                ) : (
                  <span
                    className="rounded-full px-1.5 py-px font-mono text-[8.5px] italic"
                    style={{ color: FLOW_TEXT_MUTED, border: `1px dashed ${FLOW_BORDER_SOFT}` }}
                  >
                    {copy.serviceTopics.inMemory}
                  </span>
                )}
                {row.emits.map((emit) => (
                  <span
                    key={emit}
                    className="max-w-[150px] truncate rounded-full border border-dashed px-1.5 py-px font-mono text-[8.5px]"
                    style={{ color: FLOW_TEXT_MUTED, borderColor: FLOW_BORDER_SOFT }}
                  >
                    {copy.serviceTopics.emits} {emit}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
        {extra > 0 ? (
          <div className="px-1 pt-1 font-mono text-[9px]" style={{ color: FLOW_TEXT_MUTED }}>
            {copy.serviceTopics.more.replace("{n}", String(extra))}
          </div>
        ) : null}
      </div>
    </div>
  );
}