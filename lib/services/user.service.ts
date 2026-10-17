import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { apiGet, apiPut, useGet, usePost, usePut, useDelete } from "@/lib/axios/query";
import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  DeleteResult,
  ApiUser,
  ApiManagedUser,
  ManagedUserRole,
  ManagedUsersApiPayload,
  CreateManagedUserPayload,
  UpdateManagedUserPayload,
  UpdateUserProfilePayload,
  ChangePasswordPayload,
  ChangePasswordResult,
  UserGrade,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const USERS_QUERY_KEY = ["users"] as const;

// ─── Plain functions ─────────────────────────────────────────────────────────

export async function apiGetCurrentUser(): Promise<ApiUser> {
  const raw = await apiGet<ApiResponse<ApiUser>>("/users/detail-user");
  return unwrapApiData<ApiUser>(raw);
}

export async function apiUpdateProfile(
  payload: UpdateUserProfilePayload,
): Promise<Partial<ApiUser>> {
  const raw = await axiosInstance.put<ApiResponse<Partial<ApiUser>>>(
    "/users",
    payload,
  );
  return unwrapApiData<Partial<ApiUser>>(raw.data);
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All user queries + mutations behind one hook: `useUserActions({...}).changePassword.mutate(...)`. */
export function useUserActions(args?: {
  list?: {
    page: number;
    limit: number;
    search?: string;
    role?: ManagedUserRole;
  };
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<ManagedUsersApiPayload>, Error, ManagedUsersApiPayload>,
    "queryKey" | "queryFn"
  >;
  byField?: Record<string, unknown>;
  byFieldOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiUser[]>, Error, ApiUser[]>,
    "queryKey" | "queryFn"
  >;
  allGradesOptions?: Omit<
    UseQueryOptions<ApiResponse<UserGrade[]>, Error, UserGrade[]>,
    "queryKey" | "queryFn"
  >;
  userGradesOptions?: Omit<
    UseQueryOptions<ApiResponse<UserGrade[]>, Error, UserGrade[]>,
    "queryKey" | "queryFn"
  >;
}) {
  /** Fetch paginated managed users. */
  const list = useGet<ApiResponse<ManagedUsersApiPayload>, ManagedUsersApiPayload>(
    [...USERS_QUERY_KEY, args?.list],
    "/users",
    {
      params: args?.list,
      enabled: !!args?.list,
      select: (raw) => unwrapApiData<ManagedUsersApiPayload>(raw),
      ...args?.listOptions,
    },
  );

  /** Fetch a user by field (e.g. tutor name). */
  const byField = useGet<ApiResponse<ApiUser[]>, ApiUser[]>(
    ["user-by-field", args?.byField],
    "/users/get-by-field",
    {
      params: args?.byField,
      enabled: !!args?.byField,
      select: (raw) => unwrapApiData<ApiUser[]>(raw) ?? [],
      ...args?.byFieldOptions,
    },
  );

  /**
   * Fetch all available grades. Disabled by default: gateway has no `GET /curriculum/grades`
   * (404 on every mount). Enable explicitly via `allGradesOptions` once the route exists.
   */
  const allGrades = useGet<ApiResponse<UserGrade[]>, UserGrade[]>(
    ["all-grades"],
    "/curriculum/grades",
    {
      enabled: false,
      select: (raw) => unwrapApiData<UserGrade[]>(raw) ?? [],
      ...args?.allGradesOptions,
    },
  );

  /**
   * Fetch grades assigned to current user. Disabled by default: gateway has no
   * `GET /users/grades` (404 on every mount). Enable via `userGradesOptions` once it exists.
   */
  const userGrades = useGet<ApiResponse<UserGrade[]>, UserGrade[]>(
    ["user-grades"],
    "/users/grades",
    {
      enabled: false,
      select: (raw) => unwrapApiData<UserGrade[]>(raw) ?? [],
      ...args?.userGradesOptions,
    },
  );

  const createManaged = usePost<
    ApiResponse<ApiManagedUser>,
    CreateManagedUserPayload
  >("/users");
  const updateManaged = usePut<
    ApiResponse<ApiManagedUser>,
    UpdateManagedUserPayload & { id: string }
  >((payload) => `/users/${payload.id}`);
  const deleteManaged = useDelete<ApiResponse<DeleteResult>, string>(
    (id) => `/users/${id}`,
  );
  /** `PUT /users/:id/status` nhận `{ isActive }` tường minh (idempotent); `id` đi vào URL. */
  const toggleStatus = useMutation<
    ApiResponse<ApiManagedUser>,
    Error,
    { id: string; isActive: boolean }
  >({
    mutationFn: ({ id, isActive }) =>
      apiPut<ApiResponse<ApiManagedUser>, { isActive: boolean }>(
        `/users/${id}/status`,
        { isActive },
      ),
  });
  const changePassword = usePost<
    ApiResponse<ChangePasswordResult>,
    ChangePasswordPayload
  >("/users/change-password");

  return {
    list,
    byField,
    allGrades,
    userGrades,
    createManaged,
    updateManaged,
    deleteManaged,
    toggleStatus,
    changePassword,
  };
}
