import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ApiResponse, ParentChild, ParentExerciseRow, ParentExercisesPayload } from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const PARENT_CHILDREN_QUERY_KEY = ["parent", "children"] as const;
export const PARENT_EXERCISES_QUERY_KEY = ["parent", "exercises"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Parent portal data: the children linked to the logged-in PARENT (`GET /students/my-children`)
 * and the homework of one child (`GET /exercises?studentId=`, BE scopes parent → child).
 */
export function useParentPortalActions(args?: {
  childId?: string;
  exercisesOptions?: Omit<
    UseQueryOptions<ApiResponse<ParentExercisesPayload>, Error, ParentExerciseRow[]>,
    "queryKey" | "queryFn"
  >;
}) {
  const children = useGet<ApiResponse<ParentChild[]>, ParentChild[]>(
    [...PARENT_CHILDREN_QUERY_KEY],
    "/students/my-children",
    {
      select: (raw) => unwrapApiData<ParentChild[]>(raw) ?? [],
    },
  );

  // Không chọn con → mặc định con đầu tiên trong danh sách.
  const childId = args?.childId ?? children.data?.[0]?.id;
  const exercises = useGet<ApiResponse<ParentExercisesPayload>, ParentExerciseRow[]>(
    [...PARENT_EXERCISES_QUERY_KEY, childId],
    "/exercises",
    {
      params: { studentId: childId, limit: 100 },
      enabled: !!childId,
      select: (raw) => unwrapApiData<ParentExercisesPayload>(raw)?.data ?? [],
      ...args?.exercisesOptions,
    },
  );

  return { children, exercises };
}
