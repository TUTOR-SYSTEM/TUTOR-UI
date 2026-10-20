import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePost, usePatch, useDelete, apiPatch } from "@/lib/axios/query";
import { useMutation } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  DeleteResult,
  ApiNotification,
  NotificationsApiPayload,
  CreateNotificationPayload,
  MarkAllReadResult,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize backend response — handles both flat array and { data, pagination } shapes. */
function normalizeNotificationsList(raw: unknown): NotificationsApiPayload {
  const unwrapped = raw as NotificationsApiPayload | ApiNotification[];
  if (Array.isArray(unwrapped)) {
    return {
      data: unwrapped,
      pagination: {
        total: unwrapped.length,
        page: 1,
        limit: unwrapped.length,
        totalPages: 1,
      },
    };
  }
  return unwrapped as NotificationsApiPayload;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All notification queries + mutations behind one hook: `useNotificationActions({...}).markRead.mutate(...)`. */
export function useNotificationActions(args?: {
  list?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    isRead?: boolean;
  };
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<NotificationsApiPayload>, Error, NotificationsApiPayload>,
    "queryKey" | "queryFn"
  >;
  detailId?: string;
  detailOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiNotification>, Error, ApiNotification>,
    "queryKey" | "queryFn"
  >;
}) {
  const list = useGet<ApiResponse<NotificationsApiPayload>, NotificationsApiPayload>(
    [...NOTIFICATIONS_QUERY_KEY, args?.list],
    "/notifications",
    {
      // `search` rỗng/khoảng trắng: bỏ param (BE từ chối `search=""` với 400).
      params: args?.list && {
        ...args.list,
        search: args.list.search?.trim() || undefined,
      },
      enabled: !!args?.list,
      select: (raw) => normalizeNotificationsList(unwrapApiData(raw)),
      ...args?.listOptions,
    },
  );

  const detail = useGet<ApiResponse<ApiNotification>, ApiNotification>(
    [...NOTIFICATIONS_QUERY_KEY, "detail", args?.detailId],
    `/notifications/${args?.detailId ?? ""}`,
    {
      enabled: !!args?.detailId,
      select: (raw) => unwrapApiData<ApiNotification>(raw),
      ...args?.detailOptions,
    },
  );

  const create = usePost<ApiResponse<ApiNotification>, CreateNotificationPayload>(
    "/notifications",
  );
  const markRead = useMutation<ApiResponse<ApiNotification>, Error, string>({
    mutationFn: (id) => apiPatch<ApiResponse<ApiNotification>>(`/notifications/${id}/read`, undefined),
  });
  const markAllRead = usePatch<ApiResponse<MarkAllReadResult>, void>(
    "/notifications/read-all",
  );
  const del = useDelete<ApiResponse<DeleteResult>, string>(
    (id) => `/notifications/${id}`,
  );

  return { list, detail, create, markRead, markAllRead, delete: del };
}
