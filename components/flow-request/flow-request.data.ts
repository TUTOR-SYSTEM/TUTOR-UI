import type {
  ArchitectureFlow,
  DiagramRequest,
  DiagramRequestMethod,
  FlowAccent,
  FlowEdge,
  FlowEdgeGroup,
  FlowLayerKey,
  FlowNode,
} from "@/types";

/**
 * Dữ liệu domain cho diagram Request Flow.
 *
 * Giữ ở đây chỉ giá trị kỹ thuật (port, topic, framework, domains...).
 * Mọi text hiển thị (name/kind/description, nhãn kết nối, badge, mô tả luồng)
 * nằm trong `lib/i18n/flow-request.dictionary.ts` theo quy ước i18n-copy.
 */

export type AccentColor = {
  core: string;
  bright: string;
  soft: string;
  glow: string;
};

/** Semantic accent palette theo kubernetes-diagram-color-ui-ux.md. */
export const FLOW_ACCENT_COLORS: Record<FlowAccent, AccentColor> = {
  blue: {
    core: "#2496D2",
    bright: "#35B6FF",
    soft: "rgba(53, 182, 255, 0.16)",
    glow: "rgba(53, 182, 255, 0.18)",
  },
  cyan: {
    core: "#63D8E8",
    bright: "#63D8E8",
    soft: "rgba(99, 216, 232, 0.14)",
    glow: "rgba(99, 216, 232, 0.16)",
  },
  green: {
    core: "#67D8B0",
    bright: "#8BE8C8",
    soft: "rgba(103, 216, 176, 0.16)",
    glow: "rgba(103, 216, 176, 0.18)",
  },
  purple: {
    core: "#956BFF",
    bright: "#B08BFF",
    soft: "rgba(149, 107, 255, 0.18)",
    glow: "rgba(149, 107, 255, 0.20)",
  },
  red: {
    core: "#FF5F61",
    bright: "#FF777A",
    soft: "rgba(255, 95, 97, 0.16)",
    glow: "rgba(255, 95, 97, 0.20)",
  },
  yellow: {
    core: "#F4C95D",
    bright: "#FCDE9C",
    soft: "rgba(244, 201, 93, 0.14)",
    glow: "rgba(244, 201, 93, 0.16)",
  },
  gray: {
    core: "#596276",
    bright: "#8992A5",
    soft: "rgba(137, 146, 165, 0.10)",
    glow: "rgba(137, 146, 165, 0.12)",
  },
};

export const FLOW_NEUTRAL = "#43516B";
export const FLOW_ACTIVE = "#FF626A";

/** Structural connection + khung state (code xử lý trong component cũng dùng các hex này). */
export const FLOW_BG_ROOT = "#080D1A";
export const FLOW_BG_PANEL = "rgba(17, 24, 42, 0.82)";
export const FLOW_BG_CARD = "#171E31";
export const FLOW_BG_CARD_HOVER = "#1D263D";
export const FLOW_BORDER = "#273149";
export const FLOW_BORDER_SOFT = "#202A40";
export const FLOW_BORDER_HOVER = "#3B4968";

export const FLOW_TEXT_PRIMARY = "#F4F7FB";
export const FLOW_TEXT_SECONDARY = "#C2C9D6";
export const FLOW_TEXT_MUTED = "#8992A5";

export const FLOW_NODES: readonly FlowNode[] = [
  {
    id: "ui-web",
    copyKey: "uiWeb",
    layer: "client",
    accent: "blue",
    status: "active",
    metadata: {
      framework: "Next.js 16 · React 19",
      http: "Axios + JWT Bearer",
      baseUrl: "localhost:8888",
    },
  },
  {
    id: "api-gateway",
    copyKey: "apiGateway",
    layer: "gateway",
    accent: "cyan",
    status: "healthy",
    metadata: {
      port: "8888",
      validation: "Zod v4",
      guard: "JWT (local verify)",
      db: "không sở hữu",
    },
  },
  {
    id: "gateway-oauth",
    copyKey: "gatewayOauth",
    layer: "gateway",
    accent: "yellow",
    status: "secondary",
    metadata: {
      flow: "redirect (Passport)",
      token: "Kafka → user-service",
    },
  },
  {
    id: "kafka",
    copyKey: "kafka",
    layer: "transport",
    accent: "green",
    status: "healthy",
    metadata: {
      transport: "request-reply / emit",
      topics: "topic + .reply",
    },
  },
  {
    id: "user-service",
    copyKey: "userService",
    layer: "service",
    accent: "blue",
    status: "healthy",
    metadata: {
      topics: "auth.* · user.*",
      domains: "auth · user · admin · student",
      db: "PostgreSQL",
    },
  },
  {
    id: "tutor-service",
    copyKey: "tutorService",
    layer: "service",
    accent: "purple",
    status: "active",
    metadata: {
      topics: "class.* · lesson.* · ai.*",
      domains:
        "class · schedule · session · curriculum · tuition · exercise · attendance · report · ai-chat",
      db: "PostgreSQL",
    },
  },
  {
    id: "third-service",
    copyKey: "thirdService",
    layer: "service",
    accent: "yellow",
    status: "healthy",
    metadata: {
      topics: "notification.* · upload.*",
      domains: "email · notification · redis · upload",
    },
  },
  {
    id: "postgres",
    copyKey: "postgres",
    layer: "data",
    accent: "red",
    status: "secondary",
    metadata: {
      orm: "Drizzle ORM",
      schema: "users · grades · edu…",
    },
  },
  {
    id: "redis",
    copyKey: "redis",
    layer: "data",
    accent: "green",
    status: "secondary",
    metadata: {
      transport: "cache / session",
    },
  },
  {
    id: "cloudflare-r2",
    copyKey: "cloudflareR2",
    layer: "data",
    accent: "yellow",
    status: "secondary",
    metadata: {
      transport: "S3-compatible",
      buckets: "upload · avatar · file",
    },
  },
];

export const FLOW_EDGES: readonly FlowEdge[] = [
  {
    id: "e-ui-gw",
    source: "ui-web",
    target: "api-gateway",
    group: "shared",
    labelKey: "http",
  },
  {
    id: "e-gw-kafka",
    source: "api-gateway",
    target: "kafka",
    group: "shared",
    labelKey: "produce",
  },
  {
    id: "e-kafka-user",
    source: "kafka",
    target: "user-service",
    group: "user",
    labelKey: "consumeUser",
  },
  {
    id: "e-kafka-tutor",
    source: "kafka",
    target: "tutor-service",
    group: "tutor",
    labelKey: "consumeTutor",
  },
  {
    id: "e-kafka-third",
    source: "kafka",
    target: "third-service",
    group: "third",
    labelKey: "consumeThird",
  },
  {
    id: "e-user-pg",
    source: "user-service",
    target: "postgres",
    group: "user",
    labelKey: "sql",
  },
  {
    id: "e-tutor-pg",
    source: "tutor-service",
    target: "postgres",
    group: "tutor",
    labelKey: "sql",
  },
  {
    id: "e-third-rd",
    source: "third-service",
    target: "redis",
    group: "third",
    labelKey: "cache",
  },
  {
    id: "e-third-pg",
    source: "third-service",
    target: "postgres",
    group: "third",
    labelKey: "sql",
  },
  {
    id: "e-third-r2",
    source: "third-service",
    target: "cloudflare-r2",
    group: "third",
    labelKey: "storage",
  },
];

export const FLOWS: readonly ArchitectureFlow[] = [
  {
    id: "all",
    accent: "cyan",
    nodeIds: FLOW_NODES.map((n) => n.id),
    edgeIds: FLOW_EDGES.map((e) => e.id),
    steps: ["ui-web", "api-gateway", "kafka"],
  },
  {
    id: "user",
    accent: "blue",
    nodeIds: ["ui-web", "api-gateway", "kafka", "user-service", "postgres"],
    edgeIds: ["e-ui-gw", "e-gw-kafka", "e-kafka-user", "e-user-pg"],
    steps: ["ui-web", "api-gateway", "kafka", "user-service", "postgres"],
  },
  {
    id: "tutor",
    accent: "purple",
    nodeIds: ["ui-web", "api-gateway", "kafka", "tutor-service", "postgres"],
    edgeIds: ["e-ui-gw", "e-gw-kafka", "e-kafka-tutor", "e-tutor-pg"],
    steps: ["ui-web", "api-gateway", "kafka", "tutor-service", "postgres"],
  },
  {
    id: "third",
    accent: "yellow",
    nodeIds: [
      "ui-web",
      "api-gateway",
      "kafka",
      "third-service",
      "postgres",
      "redis",
      "cloudflare-r2",
    ],
    edgeIds: [
      "e-ui-gw",
      "e-gw-kafka",
      "e-kafka-third",
      "e-third-rd",
      "e-third-pg",
      "e-third-r2",
    ],
    steps: ["ui-web", "api-gateway", "kafka", "third-service", "redis"],
  },
];

export const FLOW_NODE_BY_ID: ReadonlyMap<string, FlowNode> = new Map(
  FLOW_NODES.map((n) => [n.id, n]),
);

export const FLOW_EDGE_BY_ID: ReadonlyMap<string, FlowEdge> = new Map(
  FLOW_EDGES.map((e) => [e.id, e]),
);

export const FLOW_BY_ID: ReadonlyMap<string, ArchitectureFlow> = new Map(
  FLOWS.map((f) => [f.id, f]),
);

/** Thứ tự cột hiển thị trong diagram (matching spec 5-zone vertical layout). */
export const FLOW_LAYER_ORDER: readonly FlowLayerKey[] = [
  "client",
  "gateway",
  "transport",
  "service",
  "data",
];

/** Màu sắc mapping của từng service-group khi luồng tương ứng được chọn. */
export const FLOW_GROUP_ACCENT: Record<FlowEdgeGroup, FlowAccent> = {
  shared: "cyan",
  user: "blue",
  tutor: "purple",
  third: "yellow",
};

/** Service node id → service-group dùng để lọc/bôi màu trong bảng request. */
export const FLOW_REQUEST_SERVICE_GROUP: Record<string, FlowEdgeGroup> = {
  "user-service": "user",
  "tutor-service": "tutor",
  "third-service": "third",
};

type RequestDef = [
  method: DiagramRequestMethod,
  endpoint: string,
  topic: string,
  store?: string,
  emits?: string[],
];

/** Node dữ liệu mặc định theo service; rỗng "" = không lưu trữ (in-memory). */
const DEFAULT_STORE: Record<string, string> = {
  "user-service": "postgres",
  "tutor-service": "postgres",
  "third-service": "redis",
};

const REQUEST_BY_SERVICE: readonly { service: string; items: RequestDef[] }[] = [
  {
    service: "user-service",
    items: [
      ["POST", "/auth/login", "auth.login", "postgres", ["redis.set"]],
      ["POST", "/auth/login/user-code", "auth.loginByUserCode", "postgres", ["redis.set"]],
      ["POST", "/auth/register", "auth.register", "postgres"],
      ["POST", "/auth/forgot-password", "auth.forgotPassword", "postgres", ["redis.set", "email.sendForgotPasswordMail"]],
      ["POST", "/auth/reset-password", "auth.resetPassword", "postgres", ["redis.del"]],
      ["POST", "/auth/refresh", "auth.refresh", "postgres", ["redis.set"]],
      ["GET", "/auth/google", "auth.googleLogin", "postgres", ["redis.set"]],
      ["GET", "/auth/facebook", "auth.facebookLogin", "postgres", ["redis.set"]],
      ["GET", "/users/detail-user", "user.getDetailUser", "postgres"],
      ["GET", "/users", "user.getUsers", "postgres"],
      ["GET", "/users/get-by-field", "user.getUserByField", "postgres"],
      ["POST", "/users", "user.createUser", "postgres"],
      ["PUT", "/users", "user.updateUser", "postgres"],
      ["PUT", "/users/:id", "user.updateUserByAdmin", "postgres"],
      ["DELETE", "/users/:id", "user.deleteUserByAdmin", "postgres"],
      ["PUT", "/users/:id/status", "user.updateStatusUser", "postgres"],
      ["POST", "/users/change-password", "user.changePassword", "postgres"],
      ["GET", "/students", "user.getUsers", "postgres"],
      ["GET", "/students/:id", "user.getUserByField", "postgres"],
      ["POST", "/students", "user.createUser", "postgres"],
      ["PUT", "/students/:id", "user.updateUser", "postgres"],
      ["DELETE", "/students/:id", "user.deleteUserByAdmin", "postgres"],
      ["GET", "/admin/tutors", "user.getUsers", "postgres"],
      ["POST", "/admin/tutors", "user.createUser", "postgres"],
      ["PUT", "/admin/tutors/:id", "user.updateUserByAdmin", "postgres"],
      ["DELETE", "/admin/tutors/:id", "user.deleteUserByAdmin", "postgres"],
      ["GET", "/admin/students", "user.getUsers", "postgres"],
      ["POST", "/admin/students", "user.createUser", "postgres"],
      ["PUT", "/admin/students/:id", "user.updateUserByAdmin", "postgres"],
      ["DELETE", "/admin/students/:id", "user.deleteUserByAdmin", "postgres"],
    ],
  },
  {
    service: "tutor-service",
    items: [
      ["GET", "/classes", "class.getAll", "postgres"],
      ["GET", "/classes/:id", "class.getById", "postgres"],
      ["POST", "/classes", "class.create", "postgres"],
      ["PUT", "/classes/:id", "class.update", "postgres"],
      ["DELETE", "/classes/:id", "class.delete", "postgres"],
      ["GET", "/classes/:id/students", "class.getStudents", "postgres"],
      ["POST", "/classes/:id/students", "class.addStudents", "postgres"],
      ["GET", "/classes/generate-code", "class.generateCode", "postgres"],
      ["GET", "/classes/:id/materials", "class.getMaterials", "postgres"],
      ["GET", "/classes/:id/watches", "class.getWatch", "postgres"],
      ["GET", "/schedules", "schedule.getAll", "postgres"],
      ["GET", "/schedules/class/:classId", "schedule.getByClass", "postgres"],
      ["GET", "/schedules/:id", "schedule.getById", "postgres"],
      ["POST", "/schedules", "schedule.create", "postgres"],
      ["POST", "/schedules/bulk", "schedule.createBulk", "postgres"],
      ["PATCH", "/schedules/:id", "schedule.update", "postgres"],
      ["DELETE", "/schedules/:id", "schedule.delete", "postgres"],
      ["GET", "/sessions", "session.getAll", "postgres"],
      ["GET", "/sessions/class/:classId", "session.getByClass", "postgres"],
      ["GET", "/sessions/:id", "session.getById", "postgres"],
      ["POST", "/sessions", "session.create", "postgres"],
      ["POST", "/sessions/bulk", "session.createBulk", "postgres"],
      ["PUT", "/sessions/:id", "session.update", "postgres"],
      ["DELETE", "/sessions/:id", "session.delete", "postgres"],
      ["GET", "/curriculum", "curriculum.getAll", "postgres"],
      ["GET", "/curriculum/:id", "curriculum.getById", "postgres"],
      ["POST", "/curriculum", "curriculum.create", "postgres"],
      ["PUT", "/curriculum/:id", "curriculum.update", "postgres"],
      ["DELETE", "/curriculum/:id", "curriculum.delete", "postgres"],
      ["GET", "/curriculum/generate-code", "curriculum.generateCode", "postgres"],
      ["GET", "/chapter", "chapter.getAll", "postgres"],
      ["GET", "/chapter/:id", "chapter.getById", "postgres"],
      ["POST", "/chapter/:curriculumId", "chapter.create", "postgres"],
      ["PUT", "/chapter/:id", "chapter.update", "postgres"],
      ["DELETE", "/chapter/:id", "chapter.delete", "postgres"],
      ["GET", "/curriculum/lessons", "lesson.getAll", "postgres"],
      ["GET", "/curriculum/lessons/:id", "lesson.getById", "postgres"],
      ["POST", "/curriculum/lessons", "lesson.create", "postgres"],
      ["PUT", "/curriculum/lessons/:id", "lesson.update", "postgres"],
      ["DELETE", "/curriculum/lessons/:id", "lesson.delete", "postgres"],
      ["GET", "/exercises", "exercise.getAll", "postgres"],
      ["GET", "/exercises/:id", "exercise.getById", "postgres"],
      ["POST", "/exercises", "exercise.create", "postgres"],
      ["PATCH", "/exercises/:id/submit", "exercise.submit", "postgres"],
      ["PATCH", "/exercises/:id/grade", "exercise.grade", "postgres"],
      ["GET", "/attendances/session/:sessionId", "attendance.getBySession", "postgres"],
      ["PUT", "/attendances", "attendance.upsert", "postgres"],
      ["GET", "/tuitions", "tuition.getAll", "postgres"],
      ["GET", "/tuitions/summary", "tuition.getSummary", "postgres"],
      ["GET", "/tuitions/:id", "tuition.getById", "postgres"],
      ["POST", "/tuitions", "tuition.create", "postgres"],
      ["PUT", "/tuitions/:id", "tuition.update", "postgres"],
      ["DELETE", "/tuitions/:id", "tuition.delete", "postgres"],
      ["GET", "/dashboard/overview", "dashboard.overview", "postgres"],
      ["GET", "/reports/learning/summary", "report.summary", "postgres"],
      ["GET", "/reports/learning/attendance-trend", "report.attendanceTrend", "postgres"],
      ["GET", "/reports/learning/classes", "report.classList", "postgres"],
      ["POST", "/ai-chat/chat", "ai.chat", ""],
      ["GET", "/ai-chat/history", "ai.history", ""],
      ["DELETE", "/ai-chat/history", "ai.clearHistory", ""],
    ],
  },
  {
    service: "third-service",
    items: [
      ["GET", "/notifications", "notification.getAll", "postgres"],
      ["GET", "/notifications/:id", "notification.getById", "postgres"],
      ["POST", "/notifications", "notification.create", "postgres"],
      ["PATCH", "/notifications/:id/read", "notification.markAsRead", "postgres"],
      ["PATCH", "/notifications/read-all", "notification.markAllAsRead", "postgres"],
      ["DELETE", "/notifications/:id", "notification.delete", "postgres"],
      ["POST", "/upload", "upload.upload", "cloudflare-r2"],
      ["POST", "/upload/multiple", "upload.uploadMultiple", "cloudflare-r2"],
      ["GET", "/upload/download", "upload.download", "cloudflare-r2"],
      ["DELETE", "/upload/:key", "upload.delete", "cloudflare-r2"],
    ],
  },
];

/** Toàn bộ request FE → gateway → Kafka → service (đồng bộ với topic catalog ở gateway + service). */
export const FLOW_REQUESTS: readonly DiagramRequest[] = REQUEST_BY_SERVICE.flatMap(
  ({ service, items }) =>
    items.map(([method, endpoint, topic, store, emits], index) => {
      const storeNodeId = store === undefined ? DEFAULT_STORE[service] : store;
      return {
        id: `${service}.${index}`,
        method,
        endpoint,
        topic,
        serviceNodeId: service,
        storeNodeId: storeNodeId || undefined,
        ...(emits ? { emits } : {}),
      };
    }),
);

/**
 * Request tồn tại ở FE nhưng gateway chưa có route (chat, finance legacy, grade,
 * file upload phụ) — chưa đi qua Kafka/service.
 */
export const FLOW_UNROUTED_REQUESTS: readonly DiagramRequest[] = [
  { id: "unrouted.chat-0", method: "GET", endpoint: "/chat/conversations", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.chat-1", method: "GET", endpoint: "/chat/conversations/:conversationId", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.chat-2", method: "GET", endpoint: "/chat/conversations/:conversationId/messages", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.chat-3", method: "POST", endpoint: "/chat/conversations/direct", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.chat-4", method: "POST", endpoint: "/chat/conversations/group", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.chat-5", method: "POST", endpoint: "/chat/conversations/:conversationId/read", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.chat-6", method: "GET", endpoint: "/chat/unread", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.chat-7", method: "GET", endpoint: "/chat/users", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.finance-0", method: "GET", endpoint: "/transactions", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.finance-1", method: "GET", endpoint: "/wallets", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.finance-2", method: "GET", endpoint: "/categories", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.finance-3", method: "POST", endpoint: "/categories", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.finance-4", method: "PUT", endpoint: "/categories/:id", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.finance-5", method: "DELETE", endpoint: "/categories/:id", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.grades-0", method: "GET", endpoint: "/users/grades", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.grades-1", method: "GET", endpoint: "/curriculum/grades", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.avatar-0", method: "POST", endpoint: "/users/avatar", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.files-0", method: "PUT", endpoint: "/curriculum/lessons/:id/add-theory", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.files-1", method: "PUT", endpoint: "/curriculum/lessons/:id/exercises", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.files-2", method: "DELETE", endpoint: "/curriculum/lessons/:id/add-theory", topic: "", serviceNodeId: "unrouted" },
  { id: "unrouted.files-3", method: "DELETE", endpoint: "/curriculum/lessons/:id/exercises", topic: "", serviceNodeId: "unrouted" },
];

export const FLOW_REQUEST_BY_ID: ReadonlyMap<string, DiagramRequest> = new Map(
  FLOW_REQUESTS.map((r) => [r.id, r]),
);