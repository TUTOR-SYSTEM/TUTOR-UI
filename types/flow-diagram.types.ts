/** Selectable flow filter id for the Request Flow architecture diagram. */
export type FlowId = "all" | "user" | "tutor" | "third";

/** Semantic accent palette used across the diagram (nodes, edges, badges). */
export type FlowAccent = "blue" | "cyan" | "green" | "purple" | "red" | "yellow" | "gray";

/** Vertical layer/column key in the 5-zone diagram layout. */
export type FlowLayerKey = "client" | "gateway" | "transport" | "service" | "data";

/** Service-group an edge/request belongs to (drives filtering + accent color). */
export type FlowEdgeGroup = "shared" | "user" | "tutor" | "third";

/** Health/role badge shown on a diagram node card. */
export type FlowNodeStatus = "active" | "healthy" | "secondary";

/** A single topology node (Frontend/Gateway/Kafka/services/data stores). */
export type FlowNode = {
  id: string;
  copyKey: string;
  layer: FlowLayerKey;
  accent: FlowAccent;
  status: FlowNodeStatus;
  metadata: Record<string, string>;
};

/** A connection between two diagram nodes. */
export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  group: FlowEdgeGroup;
  labelKey: string;
};

/** A selectable flow (filter) through the architecture diagram. */
export type ArchitectureFlow = {
  id: FlowId;
  accent: FlowAccent;
  nodeIds: string[];
  edgeIds: string[];
  steps: string[];
};

/** HTTP method of a request hop shown in the architecture diagram. */
export type DiagramRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** A single FE → gateway → Kafka → service request hop in the diagram. */
export type DiagramRequest = {
  id: string;
  method: DiagramRequestMethod;
  endpoint: string;
  topic: string;
  serviceNodeId: string;
  storeNodeId?: string;
  emits?: string[];
};
