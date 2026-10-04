"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { FlowChain } from "@/components/flow-request/request-list";
import {
  FLOW_ACCENT_COLORS,
  FLOW_BORDER_SOFT,
  FLOW_GROUP_ACCENT,
  FLOW_NODE_BY_ID,
  FLOW_REQUEST_SERVICE_GROUP,
  FLOW_TEXT_MUTED,
  FLOW_TEXT_PRIMARY,
  FLOW_TEXT_SECONDARY,
} from "@/components/flow-request/flow-request.data";
import type { FlowRequestDictionary } from "@/lib/i18n/flow-request.dictionary";
import type { ArchitectureFlow, DiagramRequest, FlowAccent, FlowNode } from "@/types";
import { cn } from "@/lib/utils";

export type FlowSummaryProps = {
  copy: FlowRequestDictionary;
  flow: ArchitectureFlow;
  selectedNode: FlowNode | null;
  selectedReq: DiagramRequest | null;
  onBackToFlow: () => void;
};

export function FlowSummary({
  copy,
  flow,
  selectedNode,
  selectedReq,
  onBackToFlow,
}: FlowSummaryProps) {
  const accentKey = selectedNode
    ? selectedNode.accent
    : selectedReq
      ? selectedReqAccent(selectedReq)
      : flow.accent;
  const accent = FLOW_ACCENT_COLORS[accentKey];

  const summaryCopy = selectedReq
    ? undefined
    : copy.summary[`${flow.id}Description`];
  const titleCopy = selectedNode
    ? copy.nodes[selectedNode.copyKey as keyof typeof copy.nodes].name
    : selectedReq
      ? `${selectedReq.method} ${selectedReq.endpoint}`
      : copy.filters[flow.id];

  const detailActive = selectedNode !== null || selectedReq !== null;

  return (
    <div
      className="rounded-[10px] border p-3.5"
      style={{
        background: "rgba(9, 16, 30, 0.94)",
        borderColor: "#293650",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider"
          style={{ background: "#1D4ED8", color: "#E8F4FF" }}
        >
          {copy.summary.heading}
        </span>
        <span
          className="max-w-[70%] truncate rounded-full px-2 py-px font-mono text-[10px] font-semibold"
          style={{
            color: accent.bright,
            backgroundColor: accent.soft,
            border: `1px solid ${accent.core}66`,
          }}
        >
          {titleCopy}
        </span>
        {detailActive ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onBackToFlow}
            className={cn(
              "ml-auto h-auto! w-auto! rounded-md! px-2.5! py-1! text-[10px]! font-semibold!",
            )}
          >
            {copy.summary.backToFlow}
          </Button>
        ) : null}
      </div>

      {selectedNode ? (
        <NodeDetail node={selectedNode} copy={copy} />
      ) : selectedReq ? (
        <RequestDetail req={selectedReq} copy={copy} />
      ) : (
        <FlowView
          flow={flow}
          description={summaryCopy ?? ""}
          copy={copy}
          accentColor={accent.core}
        />
      )}
    </div>
  );
}

function RequestDetail({
  req,
  copy,
}: {
  req: DiagramRequest;
  copy: FlowRequestDictionary;
}) {
  return (
    <div className="mt-2.5 space-y-2.5">
      <div>
        <span
          className="text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: FLOW_TEXT_MUTED }}
        >
          {copy.summary.stepTitle}
        </span>
        <div className="mt-1.5">
          <FlowChain copy={copy} req={req} />
        </div>
      </div>
    </div>
  );
}

function getNodeCopy(
  nodeId: string,
  copy: FlowRequestDictionary,
): { name: string } {
  const node = FLOW_NODE_BY_ID.get(nodeId);
  return copy.nodes[(node?.copyKey ?? "kafka") as keyof typeof copy.nodes];
}

function selectedReqAccent(req: DiagramRequest): FlowAccent {
  const group = FLOW_REQUEST_SERVICE_GROUP[req.serviceNodeId];
  return group ? FLOW_GROUP_ACCENT[group] : "cyan";
}

function FlowView({
  flow,
  description,
  copy,
  accentColor,
}: {
  flow: ArchitectureFlow;
  description: string;
  copy: FlowRequestDictionary;
  accentColor: string;
}) {
  return (
    <div className="mt-2.5 space-y-2.5">
        <p className="text-[12px] leading-relaxed" style={{ color: FLOW_TEXT_MUTED }}>
          {description}
        </p>
        {flow.id === "all" ? (
          <p className="text-[11px]" style={{ color: FLOW_TEXT_MUTED }}>
            {copy.summary.hint}
          </p>
        ) : (
          <div>
            <span
              className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: FLOW_TEXT_MUTED }}
            >
              {copy.summary.stepTitle}
            </span>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {flow.steps.map((nodeId, index) => {
                const node = getNodeCopy(nodeId, copy);
                return (
                  <span key={nodeId} className="flex items-center gap-1.5">
                    <span
                      className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold"
                      style={{
                        color: FLOW_TEXT_SECONDARY,
                        borderColor: `${accentColor}55`,
                        backgroundColor: `${accentColor}14`,
                      }}
                    >
                      {node.name}
                    </span>
                    {index < flow.steps.length - 1 ? (
                      <ArrowRight
                        className="size-3"
                        style={{ color: FLOW_TEXT_SECONDARY }}
                      />
                    ) : null}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
  );
}

function NodeDetail({
  node,
  copy,
}: {
  node: FlowNode;
  copy: FlowRequestDictionary;
}) {
  const nodeCopy = copy.nodes[node.copyKey as keyof typeof copy.nodes];
  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[13px] font-semibold" style={{ color: FLOW_TEXT_PRIMARY }}>
          {nodeCopy.name}
        </span>
        <span className="text-[11px]" style={{ color: FLOW_TEXT_MUTED }}>
          {nodeCopy.kind}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: FLOW_TEXT_MUTED }}>
        {nodeCopy.description}
      </p>
      <dl className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {Object.entries(node.metadata).map(([key, value]) => (
          <div
            key={key}
            className="flex items-baseline justify-between gap-3 border-b pb-1"
            style={{ borderColor: FLOW_BORDER_SOFT }}
          >
            <dt className="shrink-0 font-mono text-[10px]" style={{ color: FLOW_TEXT_MUTED }}>
              {copy.metadata[key as keyof typeof copy.metadata] ?? key}
            </dt>
            <dd className="truncate font-mono text-[10px] text-right" style={{ color: FLOW_TEXT_SECONDARY }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}