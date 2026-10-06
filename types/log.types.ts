/**
 * "Giám sát Request" (Admin) — distributed tracing cho request đi qua từng microservice, chạy
 * trên dữ liệu THẬT từ bảng `request_logs` (THIRD_SERVICE), lấy qua gateway `GET /logs` +
 * `GET /logs/trace/:correlationId` (xem `API_ENDPOINTS.md` mục 22) và cập nhật realtime qua
 * websocket `/logs` (THIRD_SERVICE, event `log:new`, admin-only).
 */

export type LogType = "HTTP" | "RPC";

/** `serviceName` thực tế ghi vào `request_logs` — chỉ đúng 4 giá trị này. */
export type LoggerServiceKey = "gateway" | "tutor-service" | "third-service" | "user-service";

/** 1 hàng `request_logs` — 1 hop (HTTP vào gateway, hoặc 1 lệnh RPC nội bộ). */
export type ApiRequestLog = {
  id: string;
  serviceName: string;
  type: LogType;
  method: string | null;
  path: string;
  statusCode: number | null;
  durationMs: number;
  correlationId: string;
  traceId: string;
  parentTraceId: string | null;
  userId: string | null;
  ip: string | null;
  requestBody: string | null;
  responseBody: string | null;
  errorMessage: string | null;
  /** Header dạng JSON-string map; chỉ ghi ở hop HTTP của gateway (request) — hop RPC là `null`. */
  requestHeaders?: string | null;
  responseHeaders?: string | null;
  /** Host xử lý hop (cả HTTP lẫn RPC). */
  host?: string | null;
  createdAt: string;
};

export type RequestLogsApiPayload = {
  /** Key list BE trả là `data`, không phải `logs`/`requestLogs` — không đúng quy ước chung. */
  data: ApiRequestLog[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

export type LoggerRequestFilter = "all" | "err" | "warn" | "slow" | "ok";

/** 1 hàng trong cây trace của 1 correlationId, đã tính `depth` (qua `parentTraceId`) và `startMs`
 * (mốc thời gian tương đối so với hàng gốc) để vẽ waterfall — xem `buildTraceTree` trong
 * `components/logger/logger-utils.ts`. */
export type LoggerTraceNode = ApiRequestLog & { depth: number; startMs: number };

/** 1 hàng `GET /logs/stats` — gộp theo `(method, path)` trong 24h gần nhất. */
export type EndpointStats = {
  method: string;
  path: string;
  calls24h: number;
  errorCount24h: number;
  p95Ms: number;
};

/** Trạng thái theo dõi live 1 lần "Chạy realtime": `running` (chờ hop tới) → `settling` (hop gốc
 * ở gateway đã trả, chờ ~0.5s cho các log RPC còn trên đường) → `done` (đã đủ để gọi
 * `GET /logs/trace/:correlationId` 1 lần chốt). */
export type LiveTracePhase = "running" | "settling" | "done";

export type LiveTraceState = {
  correlationId: string;
  /** `Date.now()` lúc bấm chạy — mốc giờ của dòng "Client gửi..." trong LIVE TRACE. */
  startedAt: number;
  scenario: import("./test-scenario.types").ApiTestScenario;
  /** Các hop nhận qua `log:new`, đúng thứ tự tới. */
  rows: ApiRequestLog[];
  phase: LiveTracePhase;
  /** statusCode của hop gốc (gateway HTTP) khi đã tới. */
  rootStatus: number | null;
};

/** Phát lại (replay) một trace đã hoàn tất theo từng bước: request đi VÀO hop (`enter`) rồi kết
 * quả đi RA về hop cha (`exit`) — `index` trỏ vào mảng `LoggerTraceNode[]`. Log thật chỉ ghi khi hop
 * xong và cả run chỉ mất vài chục ms, nên FE dựng lại hành trình này với nhịp chậm để dễ theo dõi. */
export type PlaybackEvent =
  | { kind: "enter" | "exit" | "error"; index: number }
  /** Service nằm trong đường đi cũ nhưng lần chạy này không tới được (do lỗi phía trước). */
  | { kind: "skip"; index: -1; service: string };

export type PlaybackLineTone = "plain" | "muted" | "ok" | "warn" | "err" | "pass" | "fail";

/** 1 dòng LIVE TRACE của bản phát lại. `services` rỗng = luôn hiện (dòng gửi/kết quả); ngược lại chỉ
 * hiện khi không lọc, hoặc khi service đang được theo dõi nằm trong danh sách. */
export type PlaybackLine = {
  key: string;
  text: string;
  tone: PlaybackLineTone;
  services: string[];
};
