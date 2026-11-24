import { useMutation } from "@tanstack/react-query";

import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { apiPut, useGet } from "@/lib/axios/query";
import type { ApiResponse, ParentPasswordPayload, AdminParentsPayload } from "@/types";

export const PARENTS_QUERY_KEY = ["parents"] as const;

/** Quản lý phụ huynh (admin): danh sách và đặt mật khẩu. */
export function useParentActions(args?: {
  list?: { page?: number; limit?: number; search?: string };
}) {
  const list = useGet<ApiResponse<AdminParentsPayload>, AdminParentsPayload>(
    [...PARENTS_QUERY_KEY, args?.list],
    "/admin/parents",
    {
      params: args?.list && { ...args.list, search: args.list.search?.trim() || undefined },
      enabled: !!args?.list,
      select: (raw) => unwrapApiData<AdminParentsPayload>(raw),
    },
  );

  /* id nằm trong URL; body chỉ gửi `password` (BE schema strict). */
  const setPassword = useMutation<ApiResponse<unknown>, Error, ParentPasswordPayload>({
    mutationFn: ({ id, password }) => apiPut(`/admin/parents/${id}/password`, { password }),
  });

  return { list, setPassword };
}
