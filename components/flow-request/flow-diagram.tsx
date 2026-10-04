"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  BellRing,
  Cloud,
  Database,
  GraduationCap,
  Key,
  Monitor,
  Network,
  Shield,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { cn } from "@/lib/utils";
import { ClientRequests } from "@/components/flow-request/client-requests";
import { ServiceTopics } from "@/components/flow-request/service-topics";
import {
  FLOW_ACCENT_COLORS,
  FLOW_BG_CARD,
  FLOW_BG_PANEL,
  FLOW_BG_ROOT,
  FLOW_BORDER,
  FLOW_BORDER_SOFT,
  FLOW_EDGES,
  FLOW_GROUP_ACCENT,
  FLOW_LAYER_ORDER,
  FLOW_NODE_BY_ID,
  FLOW_NEUTRAL,
  FLOW_REQUEST_SERVICE_GROUP,
  FLOW_TEXT_MUTED,
  FLOW_TEXT_PRIMARY,
  FLOW_TEXT_SECONDARY,
  FLOWS,
} from "@/components/flow-request/flow-request.data";
import type { FlowRequestDictionary } from "@/lib/i18n/flow-request.dictionary";
import type {
  FlowAccent,
  FlowEdge,
  FlowId,
  FlowLayerKey,
  FlowNode,
  FlowNodeStatus,
} from "@/types";

const NODE_ICONS: Record<string, LucideIcon> = {
  "ui-web": Monitor,
  "api-gateway": Shield,
  "gateway-oauth": Key,
  kafka: Network,
  "user-service": Users,
  "tutor-service": GraduationCap,
  "third-service": BellRing,
  postgres: Database,
  redis: Zap,
  "cloudflare-r2": Cloud,
};

const LAYER_HEADER_ACCENT: Record<FlowLayerKey, FlowAccent> = {
  client: "blue",
  gateway: "cyan",
  transport: "green",
  service: "purple",
  data: "red",
};

const STATUS_ACCENT: Record<FlowNodeStatus, FlowAccent> = {
  active: "green",
  healthy: "cyan",
  secondary: "gray",
};

type NodeCardProps = {
  node: FlowNode;
  copy: FlowRequestDictionary;
  active: boolean;
  focused: boolean;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

function NodeCard({
  node,
  copy,
  active,
  focused,
  selected,
  dimmed,
  onSelect,
  onHover,
}: NodeCardProps) {
  const [hovered, setHovered] = useState(false);
  const accent = FLOW_ACCENT_COLORS[node.accent];
  const Icon = NODE_ICONS[node.id] ?? Network;
  const nodeCopy = copy.nodes[node.copyKey as keyof typeof copy.nodes];

  const borderColor = selected || (active && focused) ? accent.core : FLOW_BORDER;
  const boxShadow = selected
    ? `0 0 0 1px ${accent.soft}, 0 0 24px ${accent.glow}`
    : active && focused
      ? `0 0 18px ${accent.glow}`
      : undefined;

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => {
        setHovered(true);
        onHover(node.id);
      }}
      onMouseLeave={() => {
        setHovered(false);
        onHover(null);
      }}
      aria-pressed={selected}
      style={{
        background: hovered && !dimmed ? "#1D263D" : FLOW_BG_CARD,
        borderColor,
        boxShadow,
        opacity: dimmed ? 0.42 : undefined,
        filter: dimmed ? "saturate(0.55)" : undefined,
      }}
      className="group/card w-full cursor-pointer rounded-[10px] border p-3 text-left transition-all"
    >
      <div className="flex items-start gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border"
          style={{
            backgroundColor: accent.soft,
            borderColor: `${accent.core}55`,
          }}
        >
          <Icon className="size-4" style={{ color: accent.bright }} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className="truncate text-[13px] font-semibold"
              style={{ color: FLOW_TEXT_PRIMARY }}
            >
              {nodeCopy.name}
            </span>
            <StatusBadge status={node.status} copy={copy} />
          </div>
        </div>
      </div>

      <div
        className="mt-2.5 space-y-1 border-t pt-2"
        style={{ borderColor: FLOW_BORDER_SOFT }}
      >
        {Object.entries(node.metadata).map(([key, value]) => (
          <div
            key={key}
            className="flex items-baseline justify-between gap-2 font-mono text-[10px]"
          >
            <span className="shrink-0" style={{ color: FLOW_TEXT_MUTED }}>
              {copy.metadata[key as keyof typeof copy.metadata] ?? key}
            </span>
            <span className="truncate text-right" style={{ color: FLOW_TEXT_SECONDARY }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}

function StatusBadge({
  status,
  copy,
}: {
  status: FlowNodeStatus;
  copy: FlowRequestDictionary;
}) {
  const accent = FLOW_ACCENT_COLORS[STATUS_ACCENT[status]];
  return (
    <span
      className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold tracking-wide"
      style={{
        color: accent.bright,
        backgroundColor: accent.soft,
        border: `1px solid ${accent.core}66`,
      }}
    >
      {copy.badges[status]}
    </span>
  );
}

type ArchitectureColumnProps = {
  layer: FlowLayerKey;
  title: string;
  nodes: FlowNode[];
  copy: FlowRequestDictionary;
  activeNodeIds: ReadonlySet<string>;
  focused: boolean;
  selectedNodeId: string | null;
  extra?: ReactNode;
  onSelectNode: (id: string) => void;
  onHoverNode: (id: string | null) => void;
};

function ArchitectureColumn({
  layer,
  title,
  nodes,
  copy,
  activeNodeIds,
  focused,
  selectedNodeId,
  extra,
  onSelectNode,
  onHoverNode,
}: ArchitectureColumnProps) {
  const accent = FLOW_ACCENT_COLORS[LAYER_HEADER_ACCENT[layer]];
  return (
    <div
      className="flex flex-col gap-3 rounded-[12px] border p-3"
      style={{
        background: FLOW_BG_PANEL,
        borderColor: FLOW_BORDER_SOFT,
      }}
    >
      <div className="flex items-center gap-2 px-0.5">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: accent.core, boxShadow: `0 0 8px ${accent.core}66` }}
        />
        <h3
          className="text-[13px] font-bold uppercase tracking-wide"
          style={{ color: FLOW_TEXT_SECONDARY }}
        >
          {title}
        </h3>
      </div>
      {nodes.map((node) => (
        <NodeCard
          key={node.id}
          node={node}
          copy={copy}
          active={activeNodeIds.has(node.id)}
          focused={focused}
          selected={selectedNodeId === node.id}
          dimmed={focused && !activeNodeIds.has(node.id)}
          onSelect={onSelectNode}
          onHover={onHoverNode}
        />
      ))}
      {extra}
    </div>
  );
}

type ServiceColumnProps = {
  node: FlowNode;
  copy: FlowRequestDictionary;
  activeNodeIds: ReadonlySet<string>;
  focused: boolean;
  selectedNodeId: string | null;
  onSelectFlow: (id: FlowId) => void;
  onSelectNode: (id: string) => void;
  onHoverNode: (id: string | null) => void;
};

function ServiceColumn({
  node,
  copy,
  activeNodeIds,
  focused,
  selectedNodeId,
  onSelectFlow,
  onSelectNode,
  onHoverNode,
}: ServiceColumnProps) {
  const group = FLOW_REQUEST_SERVICE_GROUP[node.id];
  const groupAccent = FLOW_ACCENT_COLORS[group ? FLOW_GROUP_ACCENT[group] : "cyan"];
  const isActive = activeNodeIds.has(node.id);
  const dimmed = focused && !isActive;
  const title = group && group !== "shared"
    ? copy.filters[group]
    : copy.nodes[node.copyKey as keyof typeof copy.nodes].name;

  return (
    <div
      className="flex flex-col gap-3 rounded-[12px] border p-3"
      style={{
        background: FLOW_BG_PANEL,
        borderColor:
          isActive && focused ? `${groupAccent.core}88` : FLOW_BORDER_SOFT,
        boxShadow: isActive && focused ? `0 0 20px ${groupAccent.glow}` : undefined,
        opacity: dimmed ? 0.5 : undefined,
      }}
    >
      <div className="flex items-center gap-2 px-0.5">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: groupAccent.core, boxShadow: `0 0 8px ${groupAccent.core}66` }}
        />
        <h3
          className="text-[13px] font-bold uppercase tracking-wide"
          style={{ color: groupAccent.bright }}
        >
          {title}
        </h3>
      </div>
      <NodeCard
        node={node}
        copy={copy}
        active={isActive}
        focused={focused}
        selected={selectedNodeId === node.id}
        dimmed={dimmed}
        onSelect={onSelectNode}
        onHover={onHoverNode}
      />
      <ServiceTopics
        copy={copy}
        serviceNodeId={node.id}
        dimmed={dimmed}
        onSelectFlow={onSelectFlow}
      />
    </div>
  );
}

function EdgeArrow({
  color,
  active,
}: {
  color: string;
  active: boolean;
}) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 9 9"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M1.5 1 L6.5 4.5 L1.5 8"
        stroke={color}
        strokeWidth={active ? 1.8 : 1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

type FlowConnectorProps = {
  edges: FlowEdge[];
  activeEdgeIds: ReadonlySet<string>;
  hoverEdgeIds: ReadonlySet<string>;
  liftAccent: FlowAccent | null;
  copy: FlowRequestDictionary;
  edgeLabelOverrides?: ReadonlyMap<string, string>;
};

function FlowConnector({
  edges,
  activeEdgeIds,
  hoverEdgeIds,
  liftAccent,
  copy,
  edgeLabelOverrides,
}: FlowConnectorProps) {
  const liftColor = liftAccent ? FLOW_ACCENT_COLORS[liftAccent].core : null;
  const hovering = hoverEdgeIds.size > 0;

  if (edges.length === 0) return <div aria-hidden="true" />;

  return (
    <div className="flex flex-col items-stretch py-1" aria-hidden="true">
      {edges.map((edge) => {
        const label =
          edgeLabelOverrides?.get(edge.id) ??
          copy.edges[edge.labelKey as keyof typeof copy.edges];
        const isActive = liftAccent !== null && activeEdgeIds.has(edge.id);
        const isHovered = hovering && hoverEdgeIds.has(edge.id);

        let line: CSSProperties;
        let lineColor: string;
        let labelColor = FLOW_TEXT_MUTED;
        let labelBg = "transparent";

        if (isActive && liftColor) {
          lineColor = liftColor;
          line = {
            backgroundImage: `repeating-linear-gradient(90deg, ${liftColor} 0, ${liftColor} 6px, transparent 6px, transparent 12px)`,
            backgroundSize: "12px 2px",
            backgroundPosition: "0 0",
            animation: "flowEdgeDash 1.2s linear infinite",
            opacity: 0.92,
          };
          labelColor = liftColor;
          labelBg = FLOW_ACCENT_COLORS[liftAccent ?? "cyan"].soft;
        } else if (isHovered) {
          const hoverColor = liftColor ?? FLOW_NEUTRAL;
          lineColor = hoverColor;
          line = { backgroundColor: hoverColor, opacity: 0.85 };
          labelColor = FLOW_TEXT_SECONDARY;
        } else if (liftAccent) {
          lineColor = FLOW_NEUTRAL;
          line = { backgroundColor: FLOW_NEUTRAL, opacity: 0.18 };
        } else if (hovering) {
          lineColor = FLOW_NEUTRAL;
          line = { backgroundColor: FLOW_NEUTRAL, opacity: 0.22 };
        } else {
          lineColor = FLOW_NEUTRAL;
          line = { backgroundColor: FLOW_NEUTRAL, opacity: 0.45 };
        }

        return (
          <div
            key={edge.id}
            className="flex flex-1 flex-col items-center justify-center"
          >
            <span
              className="mb-1 rounded-full px-1.5 py-px font-mono text-[9px] font-semibold whitespace-nowrap"
              style={{ color: labelColor, backgroundColor: labelBg }}
            >
              {label}
            </span>
            <div className="flex w-full items-center gap-0.5">
              <div className="h-0.5 min-w-[16px] flex-1" style={line} />
              <EdgeArrow color={lineColor} active={isActive} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type FlowDiagramProps = {
  copy: FlowRequestDictionary;
  flowId: FlowId;
  activeNodeIds: ReadonlySet<string>;
  activeEdgeIds: ReadonlySet<string>;
  liftAccent: FlowAccent | null;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  selectedReqId: string | null;
  edgeLabelOverrides?: ReadonlyMap<string, string>;
  footer?: ReactNode;
  onSelectFlow: (id: FlowId) => void;
  onSelectNode: (id: string) => void;
  onSelectRequest: (id: string) => void;
  onHoverNode: (id: string | null) => void;
};

export function FlowDiagram({
  copy,
  flowId,
  activeNodeIds,
  activeEdgeIds,
  liftAccent,
  hoveredNodeId,
  selectedNodeId,
  selectedReqId,
  edgeLabelOverrides,
  footer,
  onSelectFlow,
  onSelectNode,
  onSelectRequest,
  onHoverNode,
}: FlowDiagramProps) {
  const focused = liftAccent !== null;
  const hoverEdgeIds = new Set(
    hoveredNodeId
      ? FLOW_EDGES.filter(
          (e) => e.source === hoveredNodeId || e.target === hoveredNodeId,
        ).map((e) => e.id)
      : [],
  );

  const cells: ReactNode[] = [];
  FLOW_LAYER_ORDER.forEach((layer, index) => {
    const layerNodes = FLOW_NODES_OF_LAYER(layer);
    if (layer === "service") {
      cells.push(
        <div key={`col-${layer}`} className="flex flex-col gap-3">
          {layerNodes.map((node) => (
            <ServiceColumn
              key={node.id}
              node={node}
              copy={copy}
              activeNodeIds={activeNodeIds}
              focused={focused}
              selectedNodeId={selectedNodeId}
              onSelectFlow={onSelectFlow}
              onSelectNode={onSelectNode}
              onHoverNode={onHoverNode}
            />
          ))}
        </div>,
      );
    } else {
      cells.push(
        <ArchitectureColumn
          key={`col-${layer}`}
          layer={layer}
          title={copy.columns[layer]}
          nodes={layerNodes}
          copy={copy}
          activeNodeIds={activeNodeIds}
          focused={focused}
          selectedNodeId={selectedNodeId}
          extra={
            layer === "client" ? (
              <ClientRequests
                copy={copy}
                flowId={flowId}
                selectedReqId={selectedReqId}
                onSelectFlow={onSelectFlow}
                onSelectRequest={onSelectRequest}
              />
            ) : undefined
          }
          onSelectNode={onSelectNode}
          onHoverNode={onHoverNode}
        />,
      );
    }

    if (index < FLOW_LAYER_ORDER.length - 1) {
      const nextLayer = FLOW_LAYER_ORDER[index + 1];
      const between = FLOW_EDGES.filter(
        (e) =>
          FLOW_NODE_BY_ID.get(e.source)?.layer === layer &&
          FLOW_NODE_BY_ID.get(e.target)?.layer === nextLayer,
      );
      cells.push(
        <FlowConnector
          key={`conn-${layer}-${nextLayer}`}
          edges={between}
          activeEdgeIds={activeEdgeIds}
          hoverEdgeIds={hoverEdgeIds}
          liftAccent={liftAccent}
          copy={copy}
          edgeLabelOverrides={edgeLabelOverrides}
        />,
      );
    }
  });

  return (
    <div
      className="w-full overflow-hidden rounded-[12px] border"
      style={{
        borderColor: FLOW_BORDER,
        background: `radial-gradient(circle at 50% 20%, rgba(37, 90, 150, 0.10), transparent 45%), ${FLOW_BG_ROOT}`,
      }}
    >
      <style>{`@keyframes flowEdgeDash { to { background-position: -24px 0; } }`}</style>

      {/* Header / toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3"
        style={{ borderColor: FLOW_BORDER_SOFT, background: "#0B1120" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 items-center justify-center rounded-[9px] border"
            style={{
              backgroundColor: FLOW_ACCENT_COLORS.cyan.soft,
              borderColor: `${FLOW_ACCENT_COLORS.cyan.core}66`,
            }}
          >
            <Workflow
              className="size-4"
              style={{ color: FLOW_ACCENT_COLORS.cyan.bright }}
              strokeWidth={1.8}
            />
          </div>
          <div>
            <h2
              className="text-[15px] font-bold leading-tight"
              style={{ color: FLOW_TEXT_PRIMARY }}
            >
              {copy.map.title}
            </h2>
            <p
              className="font-mono text-[10px] tracking-wide"
              style={{ color: FLOW_TEXT_MUTED }}
            >
              {copy.map.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="mr-1 text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: FLOW_TEXT_MUTED }}
          >
            {copy.filters.legend}
          </span>
          {FLOWS.map((flow) => {
            const active = flow.id === flowId;
            return (
              <Button
                key={flow.id}
                type="button"
                size="sm"
                onClick={() => onSelectFlow(flow.id)}
                className={cn(
                  "h-auto! w-auto! rounded-[8px]! px-3! py-1.5! text-[11px]! font-semibold!",
                  active
                    ? "text-[#63D8E8]!"
                    : "text-[#9DA7BA]! hover:text-[#C2C9D6]!",
                )}
                style={
                  active
                    ? {
                        background: "rgba(36, 150, 210, 0.18)",
                        borderColor: "#2496D2",
                      }
                    : { background: "#141C30", borderColor: "#29344D" }
                }
              >
                {copy.filters[flow.id]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[1040px] gap-x-2 p-4"
          style={{
            gridTemplateColumns:
              "minmax(150px,1fr) 92px minmax(175px,1.1fr) 92px minmax(150px,1fr) 92px minmax(240px,1.3fr) 92px minmax(175px,1fr)",
          }}
        >
          {cells}
        </div>
      </div>

      {footer ? (
        <div className="border-t p-3.5" style={{ borderColor: FLOW_BORDER_SOFT }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Node lookup per-layer (kept next to usage to avoid an extra export). */
function FLOW_NODES_OF_LAYER(layer: FlowLayerKey): FlowNode[] {
  return [...FLOW_NODE_BY_ID.values()].filter((n) => n.layer === layer);
}