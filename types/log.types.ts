/** Loại lời gọi được ghi log — khớp `type` trong `request_logs` (THIRD_SERVICE). */
export type LogType = "HTTP" | "RPC";

/** Tên service thực tế đang ghi log qua gateway (BE chưa có enum riêng cho field này). */
export type LogServiceName =
  | "gateway"
  | "tutor-service"
  | "user-service"
  | "third-service";

/** Một dòng log request/RPC — shape `request_logs` (THIRD_SERVICE `database/schema.ts`). */
export type ApiRequestLog = {
  id: string;
  serviceName: string;
  type: LogType;
  method?: string | null;
  path: string;
  statusCode?: number | null;
  durationMs: number;
  correlationId: string;
  traceId: string;
  parentTraceId?: string | null;
  userId?: string | null;
  ip?: string | null;
  requestBody?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

/** `GET /logs` — list có phân trang, key `data` (KHÔNG phải `logs`/`requestLogs`). */
export type RequestLogsApiPayload = {
  data: ApiRequestLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
