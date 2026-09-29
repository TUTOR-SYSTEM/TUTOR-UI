import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiRequestLog,
  ApiResponse,
  EndpointStats,
  LogType,
  RequestLogsApiPayload,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const LOGS_QUERY_KEY = ["logs", "list"] as const;
export const LOGS_STATS_QUERY_KEY = ["logs", "stats"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Logs only reads (admin-only monitoring) — `list` for `GET /logs`, `trace` for
 * `GET /logs/trace/:correlationId` (all hops sharing one correlationId, for the waterfall),
 * `stats` for `GET /logs/stats` (calls/24h + P95 per endpoint, for the summary table). */
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
  stats?: boolean;
  statsOptions?: Omit<
    UseQueryOptions<ApiResponse<EndpointStats[]>, Error, EndpointStats[]>,
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

  const stats = useGet<ApiResponse<EndpointStats[]>, EndpointStats[]>(
    LOGS_STATS_QUERY_KEY,
    "/logs/stats",
    {
      enabled: !!args?.stats,
      select: (raw) => unwrapApiData<EndpointStats[]>(raw),
      ...args?.statsOptions,
    },
  );

  return { list, trace, stats };
}
