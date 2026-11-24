import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePost, usePut, useDelete } from "@/lib/axios/query";
import type { QueryClient, UseQueryOptions } from "@tanstack/react-query";
import { STUDENTS_QUERY_KEY } from "@/lib/services/student.service";
import { ApiError } from "@/types";
import type {
  ApiResponse,
  DeleteResult,
  ApiClassRow,
  ClassesApiPayload,
  ClassDetailDto,
  ClassStudentDto,
} from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const CLASSES_QUERY_KEY = ["classes"] as const;

/**
 * Làm mới mọi dữ liệu bị ảnh hưởng khi lớp đổi (tên/mã/gia sư/roster...):
 * danh sách lớp VÀ danh sách học sinh (mã lớp, gia sư hiển thị ở trang học sinh).
 */
export function invalidateClassRelatedQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY }),
  ]);
}

/**
 * BE trả 404 cho list khi tài khoản chưa có lớp nào (không phải lỗi thật) → coi như danh sách rỗng.
 * Không retry 404 (vô ích); các lỗi khác (500/401/403...) giữ nguyên hành vi lỗi.
 */
function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 404;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All class queries + mutations behind one hook: `useClassActions({...}).create.mutate(...)`. */
export function useClassActions(args?: {
  list?: Record<string, unknown>;
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<ClassesApiPayload>, Error, ClassesApiPayload>,
    "queryKey" | "queryFn"
  >;
  detailId?: string;
  detailOptions?: Omit<
    UseQueryOptions<ApiResponse<ClassDetailDto>, Error, ClassDetailDto>,
    "queryKey" | "queryFn"
  >;
  studentsClassId?: string;
  studentsOptions?: Omit<
    UseQueryOptions<ApiResponse<ClassStudentDto[]>, Error, ClassStudentDto[]>,
    "queryKey" | "queryFn"
  >;
  generateCodeOptions?: Omit<
    UseQueryOptions<ApiResponse<{ code: string }>, Error, string>,
    "queryKey" | "queryFn"
  >;
}) {
  const listQuery = useGet<ApiResponse<ClassesApiPayload>, ClassesApiPayload>(
    [...CLASSES_QUERY_KEY, args?.list],
    "/classes",
    {
      params: { limit: 100, ...args?.list },
      select: (raw) => unwrapApiData<ClassesApiPayload>(raw),
      retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 3,
      ...args?.listOptions,
    },
  );
  // 404 của list = chưa có lớp → hiển thị trạng thái rỗng thay vì lỗi.
  const list = isNotFoundError(listQuery.error)
    ? {
        ...listQuery,
        data: {
          classes: [],
          pagination: {
            total: 0,
            page: Number(args?.list?.page ?? 1),
            limit: Number(args?.list?.limit ?? 100),
            totalPages: 0,
          },
        } satisfies ClassesApiPayload,
        error: null,
        isError: false,
        isPending: false,
        isLoading: false,
        isSuccess: true,
        status: "success" as const,
      }
    : listQuery;

  const detail = useGet<ApiResponse<ClassDetailDto>, ClassDetailDto>(
    [...CLASSES_QUERY_KEY, "detail", args?.detailId],
    `/classes/${args?.detailId ?? ""}`,
    {
      enabled: !!args?.detailId,
      select: (raw) => unwrapApiData<ClassDetailDto>(raw),
      ...args?.detailOptions,
    },
  );

  const students = useGet<ApiResponse<ClassStudentDto[]>, ClassStudentDto[]>(
    [...CLASSES_QUERY_KEY, "students", args?.studentsClassId],
    `/classes/${args?.studentsClassId ?? ""}/students`,
    {
      enabled: !!args?.studentsClassId,
      select: (raw) => unwrapApiData<ClassStudentDto[]>(raw) ?? [],
      ...args?.studentsOptions,
    },
  );

  /** `GET /classes/generate-code` returns `{ code: string }`. */
  const generateCode = useGet<ApiResponse<{ code: string }>, string>(
    [...CLASSES_QUERY_KEY, "generate-code"],
    "/classes/generate-code",
    {
      select: (raw) => unwrapApiData<{ code: string }>(raw)?.code ?? "",
      ...args?.generateCodeOptions,
    },
  );

  const create = usePost<ApiResponse<ApiClassRow>, Record<string, unknown>>(
    "/classes",
  );
  const update = usePut<
    ApiResponse<ApiClassRow>,
    { id: string } & Record<string, unknown>
  >((payload) => `/classes/${payload.id}`);
  const del = useDelete<ApiResponse<DeleteResult>, string>(
    (id) => `/classes/${id}`,
  );
  const enrollStudents = usePost<
    ApiResponse<ClassStudentDto[]>,
    { classId: string; studentIds: string[] }
  >((payload) => `/classes/${payload.classId}/students`);
  /** `DELETE /classes/:id/students/:studentId` — removes one student from the class. */
  const removeStudent = useDelete<
    ApiResponse<{ classId: string; studentId: string; removed: boolean }>,
    { classId: string; studentId: string }
  >((payload) => `/classes/${payload.classId}/students/${payload.studentId}`);

  return {
    list,
    detail,
    students,
    generateCode,
    create,
    update,
    delete: del,
    enrollStudents,
    removeStudent,
  };
}
