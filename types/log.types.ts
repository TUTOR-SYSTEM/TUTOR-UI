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
  createdAt: string;
};

export type RequestLogsApiPayload = {
  /** Key list BE trả là `data`, không phải `logs`/`requestLogs` — không đúng quy ước chung. */
  data: ApiRequestLog[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

export type LoggerRequestFilter = "all" | "err" | "warn" | "slow" | "ok";

export type LoggerSpanTab = "req" | "res" | "processing";

/** 1 hàng trong cây trace của 1 correlationId, đã tính `depth` (qua `parentTraceId`) và `startMs`
 * (mốc thời gian tương đối so với hàng gốc) để vẽ waterfall — xem `buildTraceTree` trong
 * `components/logger/logger-utils.ts`. */
export type LoggerTraceNode = ApiRequestLog & { depth: number; startMs: number };
