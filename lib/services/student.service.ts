import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePost, usePut, useDelete } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  DeleteResult,
  ApiStudent,
  StudentsApiPayload,
  ParentsApiPayload,
  CreateStudentPayload,
  UpdateStudentPayload,
  UploadResult,
  SetStudentPasswordPayload,
} from "@/types";
import { axiosInstance } from "@/lib/axios";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const STUDENTS_QUERY_KEY = ["students"] as const;

// ─── Plain functions ─────────────────────────────────────────────────────────

export async function apiUploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const raw = await axiosInstance.post<ApiResponse<UploadResult>>(
    "/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return unwrapApiData<UploadResult>(raw.data);
}

export async function apiDownloadFile(key: string): Promise<Blob> {
  const response = await axiosInstance.get<Blob>("/upload/download", {
    params: { key },
    responseType: "blob",
  });
  return response.data;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All student queries + mutations behind one hook: `useStudentActions({...}).create.mutate(...)`. */
export function useStudentActions(args?: {
  list?: {
    page?: number;
    limit?: number;
    search?: string;
    classCode?: string;
    classId?: string;
    gender?: string;
    isActive?: boolean;
  };
  listOptions?: Omit<
    UseQueryOptions<ApiResponse<StudentsApiPayload>, Error, StudentsApiPayload>,
    "queryKey" | "queryFn"
  >;
  /** Search existing PARENT accounts (parent picker) so several students can share one parent. */
  parents?: { page?: number; limit?: number; search?: string };
  parentsOptions?: Omit<
    UseQueryOptions<ApiResponse<ParentsApiPayload>, Error, ParentsApiPayload>,
    "queryKey" | "queryFn"
  >;
  detailId?: string;
  detailOptions?: Omit<
    UseQueryOptions<ApiResponse<ApiStudent>, Error, ApiStudent>,
    "queryKey" | "queryFn"
  >;
  generateCodeOptions?: Omit<
    UseQueryOptions<ApiResponse<string>, Error, string>,
    "queryKey" | "queryFn"
  >;
}) {
  const list = useGet<ApiResponse<StudentsApiPayload>, StudentsApiPayload>(
    [...STUDENTS_QUERY_KEY, args?.list],
    "/students",
    {
      params: args?.list,
      enabled: !!args?.list,
      select: (raw) => unwrapApiData<StudentsApiPayload>(raw),
      ...args?.listOptions,
    },
  );

  const parents = useGet<ApiResponse<ParentsApiPayload>, ParentsApiPayload>(
    [...STUDENTS_QUERY_KEY, "parents", args?.parents],
    "/students/parents",
    {
      params: args?.parents,
      enabled: !!args?.parents,
      select: (raw) => unwrapApiData<ParentsApiPayload>(raw),
      ...args?.parentsOptions,
    },
  );

  const detail = useGet<ApiResponse<ApiStudent>, ApiStudent>(
    [...STUDENTS_QUERY_KEY, "detail", args?.detailId],
    `/students/${args?.detailId ?? ""}`,
    {
      enabled: !!args?.detailId,
      select: (raw) => unwrapApiData<ApiStudent>(raw),
      ...args?.detailOptions,
    },
  );

  const generateCode = useGet<ApiResponse<string>, string>(
    [...STUDENTS_QUERY_KEY, "generate-code"],
    "/students/get-student-code",
    {
      select: (raw) => unwrapApiData<string>(raw),
      ...args?.generateCodeOptions,
    },
  );

  const create = usePost<ApiResponse<ApiStudent>, CreateStudentPayload>(
    "/students",
  );
  const update = usePut<ApiResponse<ApiStudent>, UpdateStudentPayload>(
    (payload) => `/students/${payload.id}`,
  );
  const del = useDelete<ApiResponse<DeleteResult>, string>(
    (id) => `/students/${id}`,
  );
  // PUT /students/:id/password — id nằm trong URL; gateway schema không strict nên `id` trong body bị bỏ qua.
  const setPassword = usePut<ApiResponse<unknown>, SetStudentPasswordPayload>(
    (payload) => `/students/${payload.id}/password`,
  );

  return {
    list,
    parents,
    detail,
    generateCode,
    create,
    update,
    delete: del,
    setPassword,
  };
}
