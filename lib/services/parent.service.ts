import { useMutation } from "@tanstack/react-query";

import { unwrapApiData } from "@/lib/axios/api-unwrap";
import type {
  AdminParentsPayload,
  ApiResponse,
  ParentPasswordPayload,
  ParentUpdatePayload,
} from "@/types";
import { apiDelete, apiPut, useGet } from "@/lib/axios/query";


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

  const updateParent = useMutation<ApiResponse<unknown>, Error, { id: string; body: ParentUpdatePayload }>({
    mutationFn: ({ id, body }) => apiPut(`/admin/parents/${id}`, body),
  });

  const deleteParent = useMutation<ApiResponse<unknown>, Error, string>({
    mutationFn: (id) => apiDelete(`/admin/parents/${id}`),
  });

  return { list, setPassword, updateParent, deleteParent };
}
