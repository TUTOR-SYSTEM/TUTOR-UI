"use client";

import { useMemo, useState } from "react";

import { FlowDiagram } from "@/components/flow-request/flow-diagram";
import { RequestList } from "@/components/flow-request/request-list";
import { FlowSummary } from "@/components/flow-request/flow-summary";
import {
  FLOWS,
  FLOW_BY_ID,
  FLOW_EDGES,
  FLOW_GROUP_ACCENT,
  FLOW_NODE_BY_ID,
  FLOW_REQUEST_BY_ID,
  FLOW_REQUEST_SERVICE_GROUP,
} from "@/components/flow-request/flow-request.data";
import { useFlowRequestCopy } from "@/hooks/useFlowRequestCopy.hook";
import type { FlowId } from "@/types";

export function FlowRequestPage() {
  const copy = useFlowRequestCopy();
  const [flowId, setFlowId] = useState<FlowId>("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const flow = FLOW_BY_ID.get(flowId) ?? FLOWS[0];
  const selectedNode = selectedNodeId
    ? FLOW_NODE_BY_ID.get(selectedNodeId) ?? null
    : null;
  const selectedReq = selectedReqId
    ? FLOW_REQUEST_BY_ID.get(selectedReqId) ?? null
    : null;

  const { activeNodeIds, activeEdgeIds, liftAccent, edgeLabelOverrides } = useMemo(() => {
    if (selectedNode) {
      const related = FLOW_EDGES.filter(
        (e) => e.source === selectedNode.id || e.target === selectedNode.id,
      );
      const activeEdges = new Set(related.map((e) => e.id));
      const activeNodes = new Set(
        related.flatMap((e) => [e.source, e.target]),
      );
      activeNodes.add(selectedNode.id);
      return {
        activeNodeIds: activeNodes,
        activeEdgeIds: activeEdges,
        liftAccent: selectedNode.accent,
        edgeLabelOverrides: undefined,
      };
    }

    if (selectedReq) {
      const activeNodes = new Set<string>(["ui-web", "api-gateway"]);
      const activeEdges = new Set<string>(["e-ui-gw"]);
      const labelOverrides = new Map<string, string>();
      if (selectedReq.topic) {
        activeNodes.add("kafka");
        activeEdges.add("e-gw-kafka");
        labelOverrides.set("e-gw-kafka", selectedReq.topic);
        const kafkaToService = FLOW_EDGES.find(
          (e) => e.source === "kafka" && e.target === selectedReq.serviceNodeId,
        );
        if (kafkaToService) {
          activeEdges.add(kafkaToService.id);
          labelOverrides.set(kafkaToService.id, selectedReq.topic);
        }
      }
      activeNodes.add(selectedReq.serviceNodeId);
      if (selectedReq.storeNodeId) {
        activeNodes.add(selectedReq.storeNodeId);
        const serviceToStore = FLOW_EDGES.find(
          (e) =>
            e.source === selectedReq.serviceNodeId &&
            e.target === selectedReq.storeNodeId,
        );
        if (serviceToStore) activeEdges.add(serviceToStore.id);
      }
      const group = FLOW_REQUEST_SERVICE_GROUP[selectedReq.serviceNodeId];
      return {
        activeNodeIds: activeNodes,
        activeEdgeIds: activeEdges,
        liftAccent: group ? FLOW_GROUP_ACCENT[group] : null,
        edgeLabelOverrides: labelOverrides,
      };
    }

    if (flowId === "all") {
      return {
        activeNodeIds: new Set(flow.nodeIds),
        activeEdgeIds: new Set(flow.edgeIds),
        liftAccent: null,
        edgeLabelOverrides: undefined,
      };
    }

    return {
      activeNodeIds: new Set(flow.nodeIds),
      activeEdgeIds: new Set(flow.edgeIds),
      liftAccent: flow.accent,
      edgeLabelOverrides: undefined,
    };
  }, [selectedNode, selectedReq, flow, flowId]);

  const handleSelectNode = (id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
    setSelectedReqId(null);
  };

  const handleSelectRequest = (id: string) => {
    setSelectedReqId((prev) => (prev === id ? null : id));
    setSelectedNodeId(null);
  };

  const handleSelectFlow = (id: FlowId) => {
    setSelectedNodeId(null);
    setSelectedReqId(null);
    setFlowId(id);
  };

  const clearSelection = () => {
    setSelectedNodeId(null);
    setSelectedReqId(null);
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="space-y-1">
        <h1 className="page-title">{copy.page.title}</h1>
        <p className="page-description">{copy.page.description}</p>
      </div>

      <FlowDiagram
        copy={copy}
        flowId={flowId}
        activeNodeIds={activeNodeIds}
        activeEdgeIds={activeEdgeIds}
        liftAccent={liftAccent}
        hoveredNodeId={hoveredNodeId}
        selectedNodeId={selectedNodeId}
        selectedReqId={selectedReqId}
        edgeLabelOverrides={edgeLabelOverrides}
        onSelectFlow={handleSelectFlow}
        onSelectNode={handleSelectNode}
        onSelectRequest={handleSelectRequest}
        onHoverNode={setHoveredNodeId}
        footer={
          <FlowSummary
            copy={copy}
            flow={flow}
            selectedNode={selectedNode}
            selectedReq={selectedReq}
            onBackToFlow={clearSelection}
          />
        }
      />

      <RequestList />
    </div>
  );
}