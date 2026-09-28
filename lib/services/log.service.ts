import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ApiRequestLog, ApiResponse, LogType, RequestLogsApiPayload } from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const LOGS_QUERY_KEY = ["logs", "list"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Logs only reads (admin-only monitoring) — `list` for `GET /logs`, `trace` for
 * `GET /logs/trace/:correlationId` (all hops sharing one correlationId, for the waterfall). */
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
