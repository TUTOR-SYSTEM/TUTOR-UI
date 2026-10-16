import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { apiGet, useGet, usePost, usePut, useDelete } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  DeleteResult,
  StudentSessionListItem,
  StudentSessionDetail,
  StudentSessionsResponse,
  SessionStatus,
  CreateSessionPayload,
  UpdateSessionPayload,
  BulkSessionPayload,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const SESSIONS_QUERY_KEY = ["sessions"] as const;

// ─── Plain functions ─────────────────────────────────────────────────────────

/**
 * Next free `sessionNumber` for a class (max existing + 1). The gateway requires
 * `sessionNumber` on create and the form has no field for it.
 */
export async function apiGetNextSessionNumber(classId: string): Promise<number> {
  const raw = await apiGet<ApiResponse<StudentSessionListItem[]>>(
    `/sessions/class/${classId}`,
  );
  const body = unwrapApiData<StudentSessionListItem[]>(raw);
  const list = Array.isArray(body) ? body : [];
  return list.reduce((max, s) => Math.max(max, s.sessionNumber ?? 0), 0) + 1;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All session queries + mutations behind one hook: `useSessionActions({...}).create.mutate(...)`. */
export function useSessionActions(args?: {
  list?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: SessionStatus;
    classId?: string;
  };
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<StudentSessionsResponse>, Error, StudentSessionsResponse>,
    "queryKey" | "queryFn"
  >;
  classId?: string;
  byClassOptions?: Omit<
    UseQueryOptions<ApiResponse<StudentSessionListItem[]>, Error, StudentSessionListItem[]>,
    "queryKey" | "queryFn"
  >;
  detailId?: string;
  detailOptions?: Omit<
    UseQueryOptions<ApiResponse<StudentSessionDetail>, Error, StudentSessionDetail>,
    "queryKey" | "queryFn"
  >;
}) {
  const list = useGet<ApiResponse<StudentSessionsResponse>, StudentSessionsResponse>(
    [...SESSIONS_QUERY_KEY, args?.list],
    "/sessions",
    {
      params: args?.list,
      enabled: !!args?.list,
      select: (raw) => unwrapApiData<StudentSessionsResponse>(raw),
      ...args?.listOptions,
    },
  );

  const byClass = useGet<ApiResponse<StudentSessionListItem[]>, StudentSessionListItem[]>(
    [...SESSIONS_QUERY_KEY, "class", args?.classId],
    `/sessions/class/${args?.classId ?? ""}`,
    {
      enabled: !!args?.classId,
      select: (raw) => unwrapApiData<StudentSessionListItem[]>(raw) ?? [],
      ...args?.byClassOptions,
    },
  );

  const detail = useGet<ApiResponse<StudentSessionDetail>, StudentSessionDetail>(
    [...SESSIONS_QUERY_KEY, "detail", args?.detailId],
    `/sessions/${args?.detailId ?? ""}`,
    {
      enabled: !!args?.detailId,
      select: (raw) => unwrapApiData<StudentSessionDetail>(raw),
      ...args?.detailOptions,
    },
  );

  const create = usePost<ApiResponse<StudentSessionDetail>, CreateSessionPayload>(
    "/sessions",
  );
  const createBulk = usePost<
    ApiResponse<StudentSessionDetail[]>,
    BulkSessionPayload
  >("/sessions/bulk");
  const update = usePut<
    ApiResponse<StudentSessionDetail>,
    { id: string } & UpdateSessionPayload
  >((payload) => `/sessions/${payload.id}`);
  const del = useDelete<ApiResponse<DeleteResult>, string>(
    (id) => `/sessions/${id}`,
  );

  return { list, byClass, detail, create, createBulk, update, delete: del };
}
