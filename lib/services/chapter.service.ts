import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePost, usePut, useDelete } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  DeleteResult,
  ChapterItem,
  ChaptersApiPayload,
  CreateChapterPayload,
  UpdateChapterPayload,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const CHAPTERS_QUERY_KEY = ["chapters"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All chapter queries + mutations behind one hook: `useChapterActions({...}).create.mutate(...)`. */
export function useChapterActions(args?: {
  list?: { curriculumId: string; page?: number; limit?: number };
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<ChaptersApiPayload>, Error, ChapterItem[]>,
    "queryKey" | "queryFn"
  >;
  detailId?: string;
  detailOptions?: Omit<
    UseQueryOptions<ApiResponse<ChapterItem>, Error, ChapterItem>,
    "queryKey" | "queryFn"
  >;
}) {
  // BE trả `{ chapters, pagination }` (không phải mảng trần).
  const list = useGet<ApiResponse<ChaptersApiPayload>, ChapterItem[]>(
    [...CHAPTERS_QUERY_KEY, args?.list],
    "/chapter",
    {
      params: args?.list,
      enabled: !!args?.list,
      select: (raw) => unwrapApiData<ChaptersApiPayload>(raw)?.chapters ?? [],
      ...args?.listOptions,
    },
  );

  const detail = useGet<ApiResponse<ChapterItem>, ChapterItem>(
    [...CHAPTERS_QUERY_KEY, "detail", args?.detailId],
    `/chapter/${args?.detailId ?? ""}`,
    {
      enabled: !!args?.detailId,
      select: (raw) => unwrapApiData<ChapterItem>(raw),
      ...args?.detailOptions,
    },
  );

  const create = usePost<
    ApiResponse<ChapterItem>,
    { curriculumId: string } & CreateChapterPayload
  >((payload) => `/chapter/${payload.curriculumId}`);
  const update = usePut<
    ApiResponse<ChapterItem>,
    { id: string } & UpdateChapterPayload
  >((payload) => `/chapter/${payload.id}`);
  const del = useDelete<ApiResponse<DeleteResult>, string>(
    (id) => `/chapter/${id}`,
  );

  return { list, detail, create, update, delete: del };
}
