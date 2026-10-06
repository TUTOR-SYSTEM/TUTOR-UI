import type {
  ApiRequestLog,
  ApiTestRun,
  ApiTestScenario,
  EndpointStats,
  ScenarioStats,
  TestScenarioCategory,
  TestScenarioFlowHop,
  TestScenarioMeta,
} from "@/types";

/**
 * Dữ liệu DEMO cho trang `/test-monitor` (bật bằng `?mock=1` hoặc
 * `NEXT_PUBLIC_TEST_MONITOR_MOCK=true`) — để xem/duyệt UI khi catalog BE chưa sẵn sàng. Hình dạng
 * khớp đúng `GET /test-scenarios`, `/test-scenarios/stats`, `/logs/stats`, `/logs/trace/:id`; không
 * gọi API thật.
 */

type MockDef = {
  id: string;
  service: string;
  method: string;
  path: string;
  name: string;
  description: string;
  category: TestScenarioCategory;
  expected: number;
  /** Status thật của lần chạy gần nhất (khác `expected` = không đạt). */
  actual: number;
  durationMs: number;
  /** Phút trước khi chạy lần gần nhất; `null` = chưa chạy lần nào. */
  ranMinAgo: number | null;
  requestBody?: unknown;
  responseBody?: unknown;
  /** Hop RPC lồng bên dưới hop của service chính (vd gọi sang service khác). */
  downstream?: { service: string; path: string };
};

const NOW = Date.now();
const MIN = 60_000;
const iso = (ms: number) => new Date(ms).toISOString();

/** `GET /test-scenarios/meta` giả lập. */
export const MOCK_META: TestScenarioMeta = { environment: "staging" };

const HOSTS: Record<string, string> = {
  gateway: "api-gateway-7d9f6c5b8-x2k4m",
  "user-service": "user-service-5c8b7f9d4-q8w2n",
  "tutor-service": "tutor-service-6b7d8c9f5-m4t7p",
  "third-service": "third-service-84c6d7b5f-h9v3c",
};

const USER_ID = "7c1f0b52-3a1e-4d8a-9a57-5e2b6f1d0c01";

const DEFS: MockDef[] = [
  // ─── POST /auth/login ──────────────────────────────────────────────────────
  {
    id: "mock-sc-001", service: "user-service", method: "POST", path: "/auth/login",
    name: "Đăng nhập hợp lệ", description: "Gia sư đăng nhập đúng email và mật khẩu, nhận cặp access/refresh token.",
    category: "valid", expected: 200, actual: 200, durationMs: 142, ranMinAgo: 6,
    requestBody: { email: "nguyen.minhanh@tutorpro.vn", password: "Matkhau@123" },
    responseBody: { accessToken: "eyJhbGciOiJIUzI1NiJ9.demo", refreshToken: "rt_demo_5f1c", user: { id: USER_ID, role: "TUTOR" } },
    downstream: { service: "third-service", path: "audit.record" },
  },
  {
    id: "mock-sc-002", service: "user-service", method: "POST", path: "/auth/login",
    name: "Sai mật khẩu", description: "Email tồn tại nhưng mật khẩu sai — trả 401, không lộ thông tin tài khoản.",
    category: "auth", expected: 401, actual: 401, durationMs: 96, ranMinAgo: 6,
    requestBody: { email: "nguyen.minhanh@tutorpro.vn", password: "sai-mat-khau" },
    responseBody: { statusCode: 401, message: "Email hoặc mật khẩu không đúng" },
  },
  {
    id: "mock-sc-003", service: "user-service", method: "POST", path: "/auth/login",
    name: "Thiếu trường email", description: "Body không có email — validation pipe trả 400.",
    category: "validation", expected: 400, actual: 400, durationMs: 18, ranMinAgo: 6,
    requestBody: { password: "Matkhau@123" },
    responseBody: { statusCode: 400, message: "Validation failed", errors: [{ field: "email", message: "Email là bắt buộc" }] },
  },
  // ─── POST /auth/refresh ────────────────────────────────────────────────────
  {
    id: "mock-sc-004", service: "user-service", method: "POST", path: "/auth/refresh",
    name: "Làm mới token hợp lệ", description: "Refresh token còn hạn, cấp access token mới.",
    category: "valid", expected: 200, actual: 200, durationMs: 74, ranMinAgo: 6,
    requestBody: { refreshToken: "rt_demo_5f1c" },
    responseBody: { accessToken: "eyJhbGciOiJIUzI1NiJ9.demo2" },
  },
  {
    id: "mock-sc-005", service: "user-service", method: "POST", path: "/auth/refresh",
    name: "Refresh token hết hạn", description: "Refresh token đã quá hạn 30 ngày — buộc đăng nhập lại.",
    category: "auth", expected: 401, actual: 401, durationMs: 41, ranMinAgo: 6,
    requestBody: { refreshToken: "rt_demo_expired" },
    responseBody: { statusCode: 401, message: "Phiên đăng nhập đã hết hạn" },
  },
  // ─── GET /users/me ─────────────────────────────────────────────────────────
  {
    id: "mock-sc-006", service: "user-service", method: "GET", path: "/users/me",
    name: "Lấy hồ sơ người dùng hiện tại", description: "Có Bearer token hợp lệ, trả thông tin hồ sơ.",
    category: "valid", expected: 200, actual: 200, durationMs: 58, ranMinAgo: 5,
    responseBody: { id: USER_ID, fullName: "Nguyễn Minh Anh", role: "TUTOR", email: "nguyen.minhanh@tutorpro.vn" },
  },
  {
    id: "mock-sc-007", service: "user-service", method: "GET", path: "/users/me",
    name: "Không có Authorization header", description: "Gọi không kèm token — gateway chặn với 401.",
    category: "auth", expected: 401, actual: 401, durationMs: 9, ranMinAgo: 5,
    responseBody: { statusCode: 401, message: "Unauthorized" },
  },
  // ─── PATCH /users/profile ──────────────────────────────────────────────────
  {
    id: "mock-sc-008", service: "user-service", method: "PATCH", path: "/users/profile",
    name: "Cập nhật họ tên", description: "Đổi họ tên hiển thị của gia sư.",
    category: "valid", expected: 200, actual: 200, durationMs: 112, ranMinAgo: 5,
    requestBody: { fullName: "Nguyễn Minh Anh" },
    responseBody: { id: USER_ID, fullName: "Nguyễn Minh Anh" },
  },
  {
    id: "mock-sc-009", service: "user-service", method: "PATCH", path: "/users/profile",
    name: "SĐT sai định dạng", description: "Số điện thoại có chữ cái — mong đợi 400 validation, nhưng service ném lỗi 500.",
    category: "validation", expected: 400, actual: 500, durationMs: 188, ranMinAgo: 5,
    requestBody: { phone: "09abc12xyz" },
    responseBody: { statusCode: 500, message: "Internal server error" },
  },
  {
    id: "mock-sc-010", service: "user-service", method: "PATCH", path: "/users/profile",
    name: "Email đã được dùng", description: "Đổi sang email thuộc tài khoản khác — trả 409.",
    category: "domain", expected: 409, actual: 409, durationMs: 87, ranMinAgo: 5,
    requestBody: { email: "tran.hoanglong@tutorpro.vn" },
    responseBody: { statusCode: 409, message: "Email đã tồn tại" },
  },
  {
    id: "mock-sc-011", service: "user-service", method: "PATCH", path: "/users/profile",
    name: "Cập nhật không có token", description: "Thiếu Bearer token — 401.",
    category: "auth", expected: 401, actual: 401, durationMs: 8, ranMinAgo: null,
    requestBody: { fullName: "Khách" },
    responseBody: { statusCode: 401, message: "Unauthorized" },
  },
  // ─── GET /classes ──────────────────────────────────────────────────────────
  {
    id: "mock-sc-012", service: "tutor-service", method: "GET", path: "/classes",
    name: "Danh sách lớp phân trang", description: "Lấy trang 1, 10 lớp của gia sư đang đăng nhập.",
    category: "valid", expected: 200, actual: 200, durationMs: 163, ranMinAgo: 4,
    responseBody: {
      classes: [{ id: "c-1001", name: "Toán 9 - Ôn thi vào 10", studentCount: 12 }],
      pagination: { total: 6, page: 1, limit: 10, totalPages: 1 },
    },
  },
  {
    id: "mock-sc-013", service: "tutor-service", method: "GET", path: "/classes",
    name: "Tham số limit vượt giới hạn", description: "limit=500 vượt mức tối đa 100 — 400.",
    category: "validation", expected: 400, actual: 400, durationMs: 21, ranMinAgo: 4,
    responseBody: { statusCode: 400, message: "limit must not be greater than 100" },
  },
  {
    id: "mock-sc-014", service: "tutor-service", method: "GET", path: "/classes",
    name: "Học sinh xem danh sách lớp", description: "Role STUDENT không được quản lý lớp — 403.",
    category: "auth", expected: 403, actual: 403, durationMs: 33, ranMinAgo: 4,
    responseBody: { statusCode: 403, message: "Forbidden resource" },
  },
  // ─── GET /classes/detail ───────────────────────────────────────────────────
  {
    id: "mock-sc-015", service: "tutor-service", method: "GET", path: "/classes/detail",
    name: "Chi tiết lớp Toán 9", description: "Lấy chi tiết lớp kèm lịch học và học sinh.",
    category: "valid", expected: 200, actual: 200, durationMs: 214, ranMinAgo: 4,
    responseBody: { id: "c-1001", name: "Toán 9 - Ôn thi vào 10", schedule: "T3 - T5 19:00", tutor: "Nguyễn Minh Anh" },
    downstream: { service: "user-service", path: "users.findById" },
  },
  {
    id: "mock-sc-016", service: "tutor-service", method: "GET", path: "/classes/detail",
    name: "Lớp không tồn tại", description: "id lớp không có trong hệ thống — 404.",
    category: "not_found", expected: 404, actual: 404, durationMs: 47, ranMinAgo: 4,
    responseBody: { statusCode: 404, message: "Không tìm thấy lớp học" },
  },
  {
    id: "mock-sc-017", service: "tutor-service", method: "GET", path: "/classes/detail",
    name: "Lớp của gia sư khác", description: "Gia sư xem lớp không phải của mình — 403.",
    category: "domain", expected: 403, actual: 403, durationMs: 52, ranMinAgo: 4,
    responseBody: { statusCode: 403, message: "Bạn không có quyền xem lớp này" },
  },
  // ─── GET /classes/members ──────────────────────────────────────────────────
  {
    id: "mock-sc-018", service: "tutor-service", method: "GET", path: "/classes/members",
    name: "Danh sách học sinh trong lớp", description: "Lấy thành viên của lớp Toán 9.",
    category: "valid", expected: 200, actual: 200, durationMs: 176, ranMinAgo: 3,
    responseBody: { members: [{ id: "st-01", fullName: "Lê Thảo Vy" }, { id: "st-02", fullName: "Phạm Quốc Bảo" }] },
    downstream: { service: "user-service", path: "users.findMany" },
  },
  {
    id: "mock-sc-019", service: "tutor-service", method: "GET", path: "/classes/members",
    name: "Lớp không tồn tại", description: "Thành viên của lớp đã bị xoá — 404.",
    category: "not_found", expected: 404, actual: 404, durationMs: 39, ranMinAgo: 3,
    responseBody: { statusCode: 404, message: "Không tìm thấy lớp học" },
  },
  // ─── POST /classes ─────────────────────────────────────────────────────────
  {
    id: "mock-sc-020", service: "tutor-service", method: "POST", path: "/classes",
    name: "Tạo lớp mới đầy đủ thông tin", description: "Tạo lớp kèm lịch học định kỳ — sinh 24 buổi nên chậm hơn bình thường.",
    category: "valid", expected: 201, actual: 201, durationMs: 1130, ranMinAgo: 3,
    requestBody: { name: "Vật lý 11 - Cơ bản", grade: 11, schedule: ["T2 18:30", "T6 18:30"], totalSessions: 24 },
    responseBody: { id: "c-1007", name: "Vật lý 11 - Cơ bản", sessionsGenerated: 24 },
    downstream: { service: "third-service", path: "notification.classCreated" },
  },
  {
    id: "mock-sc-021", service: "tutor-service", method: "POST", path: "/classes",
    name: "Thiếu tên lớp", description: "Body không có name — 400.",
    category: "validation", expected: 400, actual: 400, durationMs: 24, ranMinAgo: 3,
    requestBody: { grade: 11 },
    responseBody: { statusCode: 400, message: "Validation failed", errors: [{ field: "name", message: "Tên lớp là bắt buộc" }] },
  },
  {
    id: "mock-sc-022", service: "tutor-service", method: "POST", path: "/classes",
    name: "Trùng tên lớp", description: "Gia sư đã có lớp cùng tên — 409.",
    category: "domain", expected: 409, actual: 409, durationMs: 98, ranMinAgo: null,
    requestBody: { name: "Toán 9 - Ôn thi vào 10", grade: 9 },
    responseBody: { statusCode: 409, message: "Tên lớp đã tồn tại" },
  },
  // ─── GET /logs/stats ───────────────────────────────────────────────────────
  {
    id: "mock-sc-023", service: "third-service", method: "GET", path: "/logs/stats",
    name: "Thống kê request 24h (admin)", description: "Admin lấy số lượt gọi và P95 theo endpoint.",
    category: "valid", expected: 200, actual: 200, durationMs: 231, ranMinAgo: 2,
    responseBody: [{ method: "GET", path: "/classes", calls24h: 640, errorCount24h: 3, p95Ms: 210 }],
  },
  {
    id: "mock-sc-024", service: "third-service", method: "GET", path: "/logs/stats",
    name: "Gia sư xem thống kê", description: "Role TUTOR không phải admin — 403.",
    category: "auth", expected: 403, actual: 403, durationMs: 27, ranMinAgo: 2,
    responseBody: { statusCode: 403, message: "Forbidden resource" },
  },
  // ─── POST /notifications/send ──────────────────────────────────────────────
  {
    id: "mock-sc-025", service: "third-service", method: "POST", path: "/notifications/send",
    name: "Gửi nhắc lịch học cho phụ huynh", description: "Gửi thông báo buổi học 19:00 tới phụ huynh học sinh.",
    category: "valid", expected: 201, actual: 201, durationMs: 305, ranMinAgo: 2,
    requestBody: { recipientId: "pa-0042", title: "Nhắc lịch học", body: "Buổi Toán 9 bắt đầu lúc 19:00 hôm nay." },
    responseBody: { id: "nt-9001", status: "SENT" },
  },
  {
    id: "mock-sc-026", service: "third-service", method: "POST", path: "/notifications/send",
    name: "Người nhận không tồn tại", description: "recipientId không có trong hệ thống — 404.",
    category: "not_found", expected: 404, actual: 404, durationMs: 61, ranMinAgo: 2,
    requestBody: { recipientId: "khong-ton-tai", title: "Nhắc lịch học", body: "..." },
    responseBody: { statusCode: 404, message: "Không tìm thấy người nhận" },
  },
];

const defById = new Map(DEFS.map((d) => [d.id, d]));

const correlationOf = (def: MockDef) => `mock-corr-${def.id.slice(-3)}`;
const json = (value: unknown) => (value === undefined ? null : JSON.stringify(value));

/** `/auth/login` → `auth.login` — tên lệnh RPC nội bộ giả lập của hop service. */
const rpcName = (path: string) => path.split("/").filter(Boolean).join(".");

/** Dựng các hop của 1 lần chạy: gateway (HTTP) → service chính (RPC) → (tuỳ chọn) service phụ.
 * `createdAt` là mốc hop XONG (đúng như `request_logs`), nên con luôn kết thúc trước cha. */
function buildTrace(def: MockDef, correlationId: string, endMs: number, durationMs: number, actual: number): ApiRequestLog[] {
  const failed = actual >= 500;
  const errorMessage = failed ? "Cannot read properties of undefined (reading 'match')" : null;
  const rootTraceId = `${correlationId}-t0`;
  const svcTraceId = `${correlationId}-t1`;
  const base = { correlationId, userId: def.category === "auth" && actual === 401 ? null : USER_ID, ip: "113.161.24.18" };

  const requestHeaders = JSON.stringify({
    host: "api.staging.tutorpro.vn",
    "user-agent": "tutor-pro-test-runner/1.0",
    accept: "application/json",
    "content-type": "application/json",
    authorization: "[REDACTED]",
    "x-correlation-id": correlationId,
  });
  const responseHeaders = JSON.stringify({
    "content-type": "application/json; charset=utf-8",
    "x-correlation-id": correlationId,
    "cache-control": "no-store",
  });
  const rows: ApiRequestLog[] = [
    {
      ...base, requestHeaders, responseHeaders, host: HOSTS.gateway, id: `${correlationId}-r0`, serviceName: "gateway", type: "HTTP", method: def.method,
      path: def.path, statusCode: actual, durationMs, traceId: rootTraceId, parentTraceId: null,
      requestBody: json(def.requestBody), responseBody: json(def.responseBody),
      errorMessage: failed ? "Internal server error" : null, createdAt: iso(endMs),
    },
  ];
  if (actual === 401 && def.category === "auth" && def.path === "/users/me") return rows;

  const svcDuration = Math.max(1, durationMs - 8);
  rows.push({
    ...base, requestHeaders: null, responseHeaders: null, host: HOSTS[def.service],
    id: `${correlationId}-r1`, serviceName: def.service, type: "RPC", method: null,
    path: rpcName(def.path), statusCode: actual, durationMs: svcDuration, traceId: svcTraceId,
    parentTraceId: rootTraceId, requestBody: json(def.requestBody), responseBody: json(def.responseBody),
    errorMessage, createdAt: iso(endMs - 3),
  });
  if (def.downstream) {
    rows.push({
      ...base, requestHeaders: null, responseHeaders: null, host: HOSTS[def.downstream.service],
      id: `${correlationId}-r2`, serviceName: def.downstream.service, type: "RPC", method: null,
      path: def.downstream.path, statusCode: 200, durationMs: Math.max(1, Math.round(svcDuration * 0.35)),
      traceId: `${correlationId}-t2`, parentTraceId: svcTraceId, requestBody: json({ correlationId }),
      responseBody: json({ ok: true }), errorMessage: null, createdAt: iso(endMs - 6),
    });
  }
  return rows;
}

/** Các hop của 1 trace theo thứ tự thời gian (`createdAt` tăng dần) — đúng shape `flow` mà
 * `GET /test-scenarios` trả cho `lastRun`. */
export function flowFromTrace(trace: ApiRequestLog[]): TestScenarioFlowHop[] {
  return [...trace]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((r) => ({ serviceName: r.serviceName, type: r.type, statusCode: r.statusCode, durationMs: r.durationMs }));
}

function toScenario(def: MockDef): ApiTestScenario {
  const ran = def.ranMinAgo !== null;
  return {
    id: def.id,
    service: def.service,
    method: def.method,
    path: def.path,
    name: def.name,
    description: def.description,
    requestTemplate: {
      headers: def.category === "auth" ? {} : { Authorization: "Bearer {{accessToken}}" },
      body: def.requestBody,
    },
    expectedStatus: def.expected,
    category: def.category,
    createdAt: iso(NOW - 20 * 24 * 60 * MIN),
    updatedAt: null,
    flow: ran
      ? flowFromTrace(
          buildTrace(def, correlationOf(def), NOW - (def.ranMinAgo as number) * MIN, def.durationMs, def.actual),
        )
      : [],
    lastRun: ran
      ? {
          correlationId: correlationOf(def),
          actualStatus: def.actual,
          passed: def.actual === def.expected,
          durationMs: def.durationMs,
          runAt: iso(NOW - (def.ranMinAgo as number) * MIN),
        }
      : null,
  };
}

export const MOCK_SCENARIOS: ApiTestScenario[] = DEFS.map(toScenario);

/** Gộp số case đạt/tổng theo `(method, path)` từ danh sách case hiện tại. */
export function buildMockScenarioStats(scenarios: ApiTestScenario[]): ScenarioStats[] {
  const map = new Map<string, ScenarioStats>();
  for (const s of scenarios) {
    const key = `${s.method} ${s.path}`;
    const stat = map.get(key) ?? { method: s.method, path: s.path, casesPassed: 0, casesTotal: 0 };
    stat.casesTotal += 1;
    if (s.lastRun?.passed) stat.casesPassed += 1;
    map.set(key, stat);
  }
  return [...map.values()];
}

export const MOCK_SCENARIO_STATS: ScenarioStats[] = buildMockScenarioStats(MOCK_SCENARIOS);

export const MOCK_LOG_STATS: EndpointStats[] = [
  { method: "POST", path: "/auth/login", calls24h: 1840, errorCount24h: 96, p95Ms: 180 },
  { method: "POST", path: "/auth/refresh", calls24h: 4820, errorCount24h: 41, p95Ms: 95 },
  { method: "GET", path: "/users/me", calls24h: 9260, errorCount24h: 12, p95Ms: 70 },
  { method: "PATCH", path: "/users/profile", calls24h: 312, errorCount24h: 18, p95Ms: 240 },
  { method: "GET", path: "/classes", calls24h: 640, errorCount24h: 3, p95Ms: 210 },
  { method: "GET", path: "/classes/detail", calls24h: 585, errorCount24h: 9, p95Ms: 290 },
  { method: "GET", path: "/classes/members", calls24h: 410, errorCount24h: 2, p95Ms: 230 },
  { method: "POST", path: "/classes", calls24h: 74, errorCount24h: 4, p95Ms: 1130 },
  { method: "GET", path: "/logs/stats", calls24h: 58, errorCount24h: 0, p95Ms: 260 },
  { method: "POST", path: "/notifications/send", calls24h: 226, errorCount24h: 7, p95Ms: 340 },
];

/** Trace của lần chạy gần nhất, tra theo `correlationId`. Mọi case có `lastRun` đều có entry;
 * case chưa chạy được thêm vào đây lúc `mockRunScenario` chạy lần đầu. */
export const MOCK_TRACES: Record<string, ApiRequestLog[]> = {};
for (const def of DEFS) {
  if (def.ranMinAgo === null) continue;
  MOCK_TRACES[correlationOf(def)] = buildTrace(
    def,
    correlationOf(def),
    NOW - def.ranMinAgo * MIN,
    def.durationMs,
    def.actual,
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Giả lập `POST /test-scenarios/:id/run`: trễ 400–800ms, kết quả giữ nguyên (đạt/không đạt) như
 * lần chạy gần nhất, thời lượng dao động nhẹ; không đụng mạng. */
export async function mockRunScenario(id: string): Promise<ApiTestRun> {
  const def = defById.get(id);
  if (!def) throw new Error(`Mock scenario not found: ${id}`);
  await wait(400 + Math.round(Math.random() * 400));

  const durationMs = Math.max(5, Math.round(def.durationMs * (0.9 + Math.random() * 0.2)));
  const correlationId = correlationOf(def);
  const now = Date.now();
  MOCK_TRACES[correlationId] = buildTrace(def, correlationId, now, durationMs, def.actual);

  const passed = def.actual === def.expected;
  return {
    id: `mock-run-${id}-${now}`,
    scenarioId: id,
    correlationId,
    actualStatus: def.actual,
    expectedStatus: def.expected,
    passed,
    durationMs,
    errorMessage: passed ? null : `Expected ${def.expected}, got ${def.actual}`,
    triggeredBy: USER_ID,
    createdAt: iso(now),
  };
}
