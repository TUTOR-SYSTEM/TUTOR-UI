import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePost, usePut, useDelete } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  CurriculumFramework,
  CurriculumFrameworksApiPayload,
  CurriculumDetail,
  CreateCurriculumPayload,
  UpdateCurriculumPayload,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const CURRICULUM_QUERY_KEY = ["curriculum"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All curriculum queries + mutations behind one hook: `useCurriculumActions({...}).create.mutate(...)`. */
export function useCurriculumActions(args?: {
  list?: { page?: number; limit?: number; search?: string };
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<CurriculumFrameworksApiPayload>, Error, CurriculumFramework[]>,
    "queryKey" | "queryFn"
  >;
  detailId?: string;
  detailOptions?: Omit<
    UseQueryOptions<ApiResponse<CurriculumDetail>, Error, CurriculumDetail>,
    "queryKey" | "queryFn"
  >;
  /** Subject name (VN) → code `PREFIX-NNN` from BE; query runs only when set. */
  generateCodeSubject?: string;
  generateCodeOptions?: Omit<
    UseQueryOptions<ApiResponse<string>, Error, string>,
    "queryKey" | "queryFn"
  >;
}) {
  const list = useGet<ApiResponse<CurriculumFrameworksApiPayload>, CurriculumFramework[]>(
    [...CURRICULUM_QUERY_KEY, args?.list],
    "/curriculum",
    {
      params: args?.list,
      enabled: !!args?.list,
      select: (raw) =>
        unwrapApiData<CurriculumFrameworksApiPayload>(raw)?.curriculums ?? [],
      ...args?.listOptions,
    },
  );

  const detail = useGet<ApiResponse<CurriculumDetail>, CurriculumDetail>(
    [...CURRICULUM_QUERY_KEY, "detail", args?.detailId],
    `/curriculum/${args?.detailId ?? ""}`,
    {
      enabled: !!args?.detailId,
      select: (raw) => unwrapApiData<CurriculumDetail>(raw),
      ...args?.detailOptions,
    },
  );

  /**
   * `GET /curriculum/generate-code?subject=` returns a plain string, e.g. `MAT-463`.
   * A fresh code is wanted on every call, so no caching and no refetch on focus.
   */
  const generateCode = useGet<ApiResponse<string>, string>(
    [...CURRICULUM_QUERY_KEY, "generate-code", args?.generateCodeSubject],
    "/curriculum/generate-code",
    {
      params: { subject: args?.generateCodeSubject },
      enabled: !!args?.generateCodeSubject,
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: false,
      select: (raw) => unwrapApiData<string>(raw) ?? "",
      ...args?.generateCodeOptions,
    },
  );

  const create = usePost<ApiResponse<CurriculumFramework>, CreateCurriculumPayload>(
    "/curriculum",
  );
  const update = usePut<
    ApiResponse<CurriculumFramework>,
    { id: string } & UpdateCurriculumPayload
  >((payload) => `/curriculum/${payload.id}`);
  /** Backend replies `data: true` when a row was deleted, `false` when nothing matched. */
  const del = useDelete<ApiResponse<boolean>, string>(
    (id) => `/curriculum/${id}`,
  );

  return { list, detail, generateCode, create, update, delete: del };
}
