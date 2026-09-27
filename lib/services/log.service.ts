import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  ApiRequestLog,
  RequestLogsApiPayload,
  LogType,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const LOGS_QUERY_KEY = ["logs", "list"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Log monitoring — read-only (không có mutation). Gộp query list (`/logs`,
 * phân trang + filter) và query trace (`/logs/trace/:correlationId`, mảng
 * phẳng toàn bộ hop cùng correlationId, đã sort theo `createdAt` ở BE).
 */
export function useLogActions(args?: {
  list?: {
    page?: number;
    limit?: number;
    serviceName?: string;
    type?: LogType;
    correlationId?: string;
    search?: string;
  };
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<RequestLogsApiPayload>, Error, RequestLogsApiPayload>,
    "queryKey" | "queryFn"
  >;
  traceCorrelationId?: string;
  traceOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiRequestLog[]>, Error, ApiRequestLog[]>,
    "queryKey" | "queryFn"
  >;
}) {
  const list = useGet<ApiResponse<RequestLogsApiPayload>, RequestLogsApiPayload>(
    [...LOGS_QUERY_KEY, args?.list],
    "/logs",
    {
      params: args?.list,
      enabled: !!args?.list,
      select: (raw) => unwrapApiData<RequestLogsApiPayload>(raw),
      ...args?.listOptions,
    },
  );

  const trace = useGet<ApiResponse<ApiRequestLog[]>, ApiRequestLog[]>(
    [...LOGS_QUERY_KEY, "trace", args?.traceCorrelationId],
    `/logs/trace/${args?.traceCorrelationId ?? ""}`,
    {
      enabled: !!args?.traceCorrelationId,
      select: (raw) => unwrapApiData<ApiRequestLog[]>(raw),
      ...args?.traceOptions,
    },
  );

  return { list, trace };
}
