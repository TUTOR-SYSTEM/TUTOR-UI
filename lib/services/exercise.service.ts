import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePost, usePatch } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  ExerciseDetail,
  ExercisesResponse,
  CreateExercisePayload,
  ResubmitExercisePayload,
  GradeExercisePayload,
  RequestResubmitPayload,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const EXERCISES_QUERY_KEY = ["exercises"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All exercise queries + mutations behind one hook: `useExerciseActions({...}).create.mutate(...)`. */
export function useExerciseActions(args?: {
  list?: {
    page?: number;
    limit?: number;
    sessionId?: string;
    studentId?: string;
    classId?: string;
    tutorId?: string;
  };
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<ExercisesResponse>, Error, ExerciseDetail[]>,
    "queryKey" | "queryFn"
  >;
  detailId?: string;
  detailOptions?: Omit<
    UseQueryOptions<ApiResponse<ExerciseDetail>, Error, ExerciseDetail>,
    "queryKey" | "queryFn"
  >;
}) {
  const list = useGet<ApiResponse<ExercisesResponse>, ExerciseDetail[]>(
    [...EXERCISES_QUERY_KEY, args?.list],
    "/exercises",
    {
      params: args?.list,
      enabled: !!args?.list,
      select: (raw) => {
        const data = unwrapApiData<ExercisesResponse>(raw);
        return data?.data ?? [];
      },
      ...args?.listOptions,
    },
  );

  const detail = useGet<ApiResponse<ExerciseDetail>, ExerciseDetail>(
    [...EXERCISES_QUERY_KEY, "detail", args?.detailId],
    `/exercises/${args?.detailId ?? ""}`,
    {
      enabled: !!args?.detailId,
      select: (raw) => unwrapApiData<ExerciseDetail>(raw),
      ...args?.detailOptions,
    },
  );

  const create = usePost<ApiResponse<ExerciseDetail>, CreateExercisePayload>(
    "/exercises",
  );
  const resubmit = usePatch<
    ApiResponse<ExerciseDetail>,
    { id: string } & ResubmitExercisePayload
  >((payload) => `/exercises/${payload.id}/submit`);
  const grade = usePatch<
    ApiResponse<ExerciseDetail>,
    { id: string } & GradeExercisePayload
  >((payload) => `/exercises/${payload.id}/grade`);
  const requestResubmit = usePatch<
    ApiResponse<ExerciseDetail>,
    { id: string } & RequestResubmitPayload
  >((payload) => `/exercises/${payload.id}/request-resubmit`);

  return { list, detail, create, resubmit, grade, requestResubmit };
}
