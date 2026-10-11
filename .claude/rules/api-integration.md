# Rule: Tích hợp API (FE ↔ BE)

FE tiêu thụ hợp đồng do BE (`backends/`, cổng 8888) sản xuất. Giữ đúng các cam kết sau.

## Kiến trúc tổng quát

```
Component (page/dialog)
  └─ lib/services/{name}.service.ts   ← query key + use{Resource}Actions() (gộp cả query lẫn mutation)
       └─ lib/axios/query.ts          ← useGet / usePost / usePut / useDelete / usePatch
            └─ lib/axios/client.ts    ← axiosInstance (interceptor: Bearer token, 401 refresh)
                 └─ BE API
```

- **Query hooks** (`useGet`, `usePost`, ...): dùng trong React component — quản lý cache/invalidate
  qua TanStack Query.
- **Raw helpers** (`apiGet`, `apiPost`, ...): dùng ngoài React (vd service function gọi từ `onClick`
  không qua hook, hoặc SSR utility).
- **`axiosInstance`**: chỉ import từ `@/lib/axios`; **không** tạo instance mới.

## Wrapper hooks (`lib/axios/query.ts`)

Mọi lời gọi API từ component **phải** đi qua wrapper — không gọi `useQuery`/`useMutation` thô hay
`axiosInstance` trực tiếp trong component.

### `useGet<TRaw, TData>(queryKey, url, options?)`

```ts
// TRaw = ApiResponse<T> (envelope BE bọc quanh data); TData = shape sau select (mặc định = TRaw)
// Không dùng unknown cho TRaw — xem mục Service file conventions bên dưới.
useGet<ApiResponse<StudentsApiPayload>, StudentsApiPayload>(
  [...STUDENTS_QUERY_KEY, page, search],  // query key
  "/students",                            // endpoint
  {
    params: { page, limit, search },      // query params (optional)
    select: (raw) => unwrapApiData<StudentsApiPayload>(raw),  // bóc data
    enabled: role === "ADMIN",            // any UseQueryOptions
    ...options,
  },
)
```

### `usePost<TData, TPayload>(url, options?)`

```ts
// url tĩnh hoặc function dynamic — TData là ApiResponse<T> (mutation không tự unwrapApiData())
usePost<ApiResponse<ApiStudent>, CreateStudentPayload>("/students", options)

// URL động theo payload
useDelete<ApiResponse<DeleteResult>, string>((id) => `/students/${id}`, options)
```

### `usePut<TData, TPayload>(url | fn, options?)`

```ts
usePut<ApiResponse<ApiStudent>, UpdateStudentPayload>(
  (payload) => `/students/${payload.id}`,  // dynamic URL
  options,
)
```

### `usePatch<TData, TPayload>(url | fn, options?)`

```ts
usePatch<ApiResponse<ApiNotification>, string>(
  (id) => `/notifications/${id}/read`,
  options,
)
```

### `useDelete<TData, TPayload>(url | fn, options?)`

```ts
useDelete<ApiResponse<DeleteResult>, string>((id) => `/students/${id}`, options)
```

### Raw helpers (ngoài React)

```ts
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/axios/query";

const data = await apiGet<ApiResponse<ApiUser>>("/users/detail-user");
const result = await apiPost<ApiResponse<ApiClassRow>, CreateClassPayload>("/classes", payload);
```

## Bóc response — `unwrapApiData()`

BE bọc response dạng `{ statusCode, message, data, ... }`. **Luôn** dùng `unwrapApiData()` để lấy
phần `data` — **đọc** trực tiếp body mà chưa bóc sẽ sai.

```ts
import { unwrapApiData } from "@/lib/axios/api-unwrap";

// Trong select option của useGet
select: (raw) => unwrapApiData<StudentsApiPayload>(raw)

// Ngoài React
const raw = await apiGet<ApiResponse<ApiUser>>("/users/detail-user");
const user = unwrapApiData<ApiUser>(raw);
```

**Cạm bẫy `data: null`**: `unwrapApiData` chỉ bóc khi `data` khác `null`/`undefined`; nếu `data`
là `null` thì trả nguyên envelope `{ statusCode, data: null }`. Vì vậy fallback kiểu
`unwrapApiData<T[]>(raw) ?? []` **không** hoạt động — kết quả là object, không phải mảng. Khi cần
fallback, kiểm tra kiểu trên kết quả bóc (vd `Array.isArray(d) ? d : []`). Đã gặp ở
`lib/services/class.service.ts` (query `students`), đang được ghi nhận bằng test `it.fails` trong
`test/lib/services/class.service.test.ts`.

## Xử lý lỗi

### `getErrorMessage(error, fallback?)`

Lấy chuỗi lỗi an toàn để hiển thị toast/alert — luôn có fallback phòng khi BE trả custom shape.

```ts
import { getErrorMessage } from "@/lib/axios";

onError: (err) => toast.error(getErrorMessage(err, copy.list.deleteError))
```

### `getValidationMessages(error)`

Lấy danh sách message lỗi validation (422) — useful cho form display.

```ts
import { getValidationMessages } from "@/lib/axios";
const messages = getValidationMessages(error); // string[]
```

### `handleFormApiError(error, setError, fallbackMessage)`

Map lỗi 422 Nest validation pipe (field-level errors) vào React Hook Form `setError` — tự phân biệt
`errors[]` (field + message) và `issues[]` (path + message).

```ts
import { handleFormApiError } from "@/lib/axios/form-error";

onError: (err) => {
  handleFormApiError(err, setError, "Tạo học sinh thất bại");
}
```

### `ApiError` class

```ts
// types/error.types.ts
class ApiError extends Error {
  statusCode?: number;    // HTTP status
  data?: ApiErrorResponse; // full body { message, errors, issues, ... }
}
```

## Service file conventions (`lib/services/{name}.service.ts`)

Mỗi tài nguyên export **đúng một** hook: `use{Resource}Actions(args?)`. Hook này gộp **tất cả** — mọi
query (list/detail/summary/generate-code/by-class...) lẫn mọi mutation (create/update/delete và mọi
action khác — resubmit, grade, markRead, toggleStatus...) — không tách hook query riêng
(`useFoos`/`useFooDetail`) như trước nữa. Xem `lib/services/auth.service.ts` (`useAuthActions` — chỉ
có mutation, không có query) và `lib/services/tuition.service.ts` (`useTuitionActions` — đủ cả
`list`/`summary`/`detail` lẫn `create`/`update`/`delete`) làm mẫu đầy đủ nhất. Resource chỉ đọc,
không có mutation (vd dashboard) vẫn giữ tên `use{Resource}Actions` — xem
`lib/services/dashboard.service.ts` (`useDashboardActions()` chỉ trả `overview`).

**Bên trong hook**: mỗi `useGet`/`usePost`/`usePut`/`usePatch`/`useDelete` chạy **không điều kiện
ngay ở đầu hook** (`use{Resource}Actions` tự nó là hook, gọi hook khác ở đây hợp lệ) — **không** đặt
trong closure trả về (`{ create: (options) => usePost(...) }`), vì closure đó không phải hook nên gọi
hook bên trong nó vi phạm rules-of-hooks (`react-hooks/rules-of-hooks`).

**Query có tham số động** (id chi tiết, filter list...) nhận qua field tương ứng trong `args` — hook
vẫn gọi `useGet` unconditional, chỉ set `enabled: !!args.xxx` để trì hoãn thực thi tới khi có tham số:

```ts
list?: { page?: number; limit?: number; search?: string };
listOptions?: Omit<UseQueryOptions<ApiResponse<FoosApiPayload>, Error, FoosApiPayload>, "queryKey" | "queryFn">;
detailId?: string;
detailOptions?: Omit<UseQueryOptions<ApiResponse<ApiFoo>, Error, ApiFoo>, "queryKey" | "queryFn">;
```

Component chỉ truyền field mình cần (component list truyền `list`, component detail truyền
`detailId`) — field không truyền thì `enabled` mặc định `false`, query đó không chạy nhưng hook vẫn
được gọi (đúng rules-of-hooks). `listOptions`/`detailOptions` cho phép override `enabled` hoặc thêm
`UseQueryOptions` khác từ component gọi.

**Query không có tham số phân biệt** (vd "lấy toàn bộ danh mục", không nhận id/filter nào — xem
`useUserActions().allGrades`/`userGrades` trong `user.service.ts`, gọi `/curriculum/grades`/
`/users/grades` không điều kiện) mặc định `enabled: true` (không có field nào để suy ra `!!args.xxx`)
— hook luôn tự chạy khi được gọi, **bất kể component gọi `use{Resource}Actions()` chỉ cần 1 field
khác trong cùng hook** (vd chỉ cần `byField` để tra tên gia sư). Field `*Options` (vd `allGradesOptions`,
`userGradesOptions`) là escape hatch bắt buộc dùng ở call site không cần dữ liệu đó — truyền
`{ enabled: false }` để tắt, tránh bắn request thừa và (nghiêm trọng hơn) lỗi 400/404 thật khi role
hiện tại không có quyền gọi endpoint đó (vd STUDENT/PARENT gọi `/users/grades` vốn chỉ dành
ADMIN/TUTOR). Đã xảy ra thật ở `class-detail-watch-page.tsx` và `session-detail-view.tsx` — cả hai chỉ
cần `byField` (tra tên gia sư) nhưng vẫn kéo theo 2 request `grades` lỗi cho tới khi thêm
`allGradesOptions: { enabled: false }`/`userGradesOptions: { enabled: false }`. Khi thêm field không-
tham-số kiểu này vào 1 service hook, luôn thêm `{field}Options` đi kèm ngay từ đầu.

Hook trả về **một object gộp hết**: field query trả nguyên kết quả `useQuery` (`list`, `detail`,
`summary`,...); field mutation trả nguyên `UseMutationResult` (`mutate`/`mutateAsync`/`isPending`...),
đặt tên theo domain: `create`, `update`, `delete`, hoặc tên action cụ thể (`markRead`, `grade`,
`toggleStatus`, `changePassword`...). `delete` là từ khoá nên khai biến local là `del` rồi return
`{ delete: del, ... }`.

Dùng `use{Resource}Actions({ list: params }).create.mutate(payload, { onSuccess, onError })` —
callback mutate truyền **lúc gọi `mutate()`/`mutateAsync()`**, không bind lúc tạo hook (hook không
nhận callback mutation qua `args`). Mutation không tự `unwrapApiData()` — nơi gọi tự bóc trong
`onSuccess` nếu cần đọc response.

**Không dùng `unknown` làm generic của `useGet`/`usePost`/`usePut`/`usePatch`/`useDelete`.** `TRaw`
(tham số generic đầu của `useGet`, và tham số đầu của mutation hook) là **`ApiResponse<T>`**
(`types/api.types.ts` — envelope `{ statusCode, message, data, timestamp, method, path }` BE bọc mọi
response) với `T` là shape thật sự nằm trong `data`. Query luôn khai đủ 2 type argument:
`useGet<ApiResponse<FoosApiPayload>, FoosApiPayload>(...)` — `unwrapApiData<T>()` nhận `body: unknown`
nên truyền `ApiResponse<T>` vào đó vẫn hợp lệ (an toàn hơn vì biết chắc shape đầu vào). Mutation không
tự bóc nên `TData` luôn là `ApiResponse<T>` (không phải `T` trần) — vd `usePost<ApiResponse<ApiFoo>,
CreateFooPayload>(...)`. DELETE dùng type dùng chung `DeleteResult` (`{ id: string }`,
`types/api.types.ts`) trừ khi doc ghi rõ shape khác: `useDelete<ApiResponse<DeleteResult>,
string>(...)`. Nếu BE row chưa được type đầy đủ (chưa rõ hết field), dùng `Record<string, unknown>`
đặt tên (vd `ChapterItem`) thay vì để nguyên `unknown` — xem `lib/services/chapter.service.ts`.

### Cấu trúc template

```ts
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePost, usePut, useDelete } from "@/lib/axios/query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ApiResponse, DeleteResult, ApiFoo, FoosApiPayload, CreateFooPayload, UpdateFooPayload } from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────
export const FOOS_QUERY_KEY = ["foos", "list"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** All foo queries + mutations behind one hook: `useFooActions({...}).create.mutate(...)`. */
export function useFooActions(args?: {
  list?: { page?: number; limit?: number; search?: string };
  listOptions?: Omit<UseQueryOptions<ApiResponse<FoosApiPayload>, Error, FoosApiPayload>, "queryKey" | "queryFn">;
  detailId?: string;
  detailOptions?: Omit<UseQueryOptions<ApiResponse<ApiFoo>, Error, ApiFoo>, "queryKey" | "queryFn">;
}) {
  const list = useGet<ApiResponse<FoosApiPayload>, FoosApiPayload>(
    [...FOOS_QUERY_KEY, args?.list],
    "/foos",
    {
      params: args?.list,
      enabled: !!args?.list,
      select: (raw) => unwrapApiData<FoosApiPayload>(raw),
      ...args?.listOptions,
    },
  );

  const detail = useGet<ApiResponse<ApiFoo>, ApiFoo>(
    [...FOOS_QUERY_KEY, "detail", args?.detailId],
    `/foos/${args?.detailId ?? ""}`,
    {
      enabled: !!args?.detailId,
      select: (raw) => unwrapApiData<ApiFoo>(raw),
      ...args?.detailOptions,
    },
  );

  const create = usePost<ApiResponse<ApiFoo>, CreateFooPayload>("/foos");
  const update = usePut<ApiResponse<ApiFoo>, { id: string } & UpdateFooPayload>(
    (payload) => `/foos/${payload.id}`,
  );
  const del = useDelete<ApiResponse<DeleteResult>, string>((id) => `/foos/${id}`);

  return { list, detail, create, update, delete: del };
}
```

Component dùng:

```ts
// List page — chỉ truyền `list`
const { list, create, update, delete: deleteFoo } = useFooActions({
  list: { page, limit, search },
});
const { data, isLoading } = list;

create.mutate(payload, {
  onSuccess: () => { toast.success("Tạo thành công"); queryClient.invalidateQueries({ queryKey: FOOS_QUERY_KEY }); },
  onError: (err) => toast.error(getErrorMessage(err)),
});

// Detail page — chỉ truyền `detailId`, không gọi `list`
const { detail } = useFooActions({
  detailId: fooId,
  detailOptions: { enabled: !!fooId },
});
```

### Query key conventions

- Đặt `const {NAME}_QUERY_KEY = ["{name}", "list"] as const` ở đầu file service.
- List query key mở rộng bằng spread + nguyên object params: `[...FOOS_QUERY_KEY, args?.list]` —
  React Query so sánh key theo cấu trúc (deep equality) nên không cần liệt kê từng field rời.
- Detail query key dùng pattern `[...FOOS_QUERY_KEY, "detail", args?.detailId]`.
- Include tham số ảnh hưởng cache vào key (vd page, search, filter values) để mỗi filter state
  có cache riêng — truyền cả `args?.list`/`args?.detailId` là đủ, không cần tách field.

## Phân trang

BE trả `{ <resource>, pagination: { total, page, limit, totalPages } }`.

```ts
// Types
type StudentsApiPayload = {
  students: ApiStudent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Trong component
const pagination = apiPayload?.pagination;
const totalPages = pagination?.totalPages ?? 1;
```

**Đọc đúng key theo tên tài nguyên** (`students`, `classes`, `sessions`...) — **KHÔNG** giả định
`data`/`items`.

## Type conventions (`types/{name}.types.ts`)

**Tất cả `type`/`interface`/`enum` DTO phải sống trong `types/`** — không khai báo inline trong file
component/service/hook.

- **`Api{Resource}`** — shape thô BE trả về sau `unwrapApiData()` (vd `ApiStudent`, `ApiManagedUser`).
- **`Create{Resource}Payload`** — payload POST tạo mới.
- **`Update{Resource}Payload`** — payload PUT cập nhật.
- **`{Resources}ApiPayload`** — shape list có pagination: `{ [resource]: Api{Resource}[], pagination }`.
- **`{Resource}`** — shape đã map cho UI (vd `Student` trong `student.types.ts` khác `ApiStudent`).
- **Enum/constant** liên quan đến resource cũng đặt trong cùng file types (vd `FooStatus`,
  `GENDER_ENUM` trong `student.types.ts`).
- **`ApiResponse<T>`** và **`DeleteResult`** (`types/api.types.ts`) — type dùng chung cho mọi
  resource: `ApiResponse<T>` là envelope BE bọc quanh `data`, dùng làm `TRaw` cho mọi
  `useGet`/`usePost`/`usePut`/`usePatch`/`useDelete` (xem mục Service file conventions bên dưới,
  KHÔNG dùng `unknown`); `DeleteResult` (`{ id: string }`) dùng cho response DELETE.
- BE row **chưa type đầy đủ** (chưa rõ hết field) → đặt tên `Record<string, unknown>` trong
  `types/{name}.types.ts` (vd `ChapterItem`, `ScheduleItem`, `LessonItem`) thay vì để `unknown` trần
  trong service file — dễ tìm/nâng cấp dần khi biết thêm field.

**Quy tắc:**
- Tạo file `types/{name}.types.ts` khi thêm resource mới — barrel `types/index.ts` re-export hết
  → import qua `@/types` hoặc `@/types/{name}.types`.
- **Không** khai báo `type`/`interface`/`enum` inline trong `components/**/*.tsx`,
  `lib/services/*.service.ts`, hay `hooks/*.hook.ts` — kể cả khi chỉ dùng ở 1 nơi. Di chuyển
  vào `types/{name}.types.ts` rồi import.
- **Ngoại lệ duy nhất**: component props type (`FooListProps`, `AddFooDialogProps`) — nếu chỉ dùng
  trong 1 file thì khai báo inline trong file đó; nếu dùng ở nhiều nơi thì đưa vào `types/`.
- Kiểm tra `types/*.types.ts` (đặc biệt `session.types.ts` có sẵn `SessionStatus`/`SessionFile`)
  trước khi thêm mới để tránh trùng lặp.
- Xem `types/student.types.ts` (`ApiStudent` + `CreateStudentPayload` + `UpdateStudentPayload` +
  `StudentsApiPayload` + enum `GENDER_ENUM`) làm mẫu đầy đủ nhất.

## Payload rules

- **Chỉ gửi field cần đổi** — đừng gửi nguyên object state kèm field không đổi nếu field đó có thể
  bị chặn theo role ở BE (validate theo **sự có mặt của key**, không phải giá trị).
- **422 Nest validation pipe**: `errors[]` (field + message) hoặc `issues[]` (path + message) — dùng
  `handleFormApiError()` để map vào React Hook Form.

## File upload / download

```ts
// Upload (multipart)
export async function apiUploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const raw = await axiosInstance.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapApiData<UploadResult>(raw.data);
}

// Download (blob)
export async function apiDownloadFile(key: string): Promise<Blob> {
  const response = await axiosInstance.get("/upload/download", {
    params: { key },
    responseType: "blob",
  });
  return response.data;
}
```

## 401 / Token Refresh

Response interceptor tự gọi `POST /auth/refresh` khi 401; fail → redirect `/login`. Các route auth
(login/register/forgot/reset) bỏ qua vòng refresh. **Không** tự implement refresh trong component.

## Pattern "con mình" (PARENT)

Chưa có API trả danh sách học sinh của PARENT. Pattern chuẩn:

```ts
// Gọi list lớn rồi filter FE-side
const { data } = useStudentActions({ list: { page: 1, limit: 100 } }).list;
const childIds = (data?.students ?? [])
  .filter(s => s.parentId === viewerId)
  .map(s => s.id);
```

Xem `components/fees/family-fees-page.tsx` và `app/(app)/settings/page.tsx` làm mẫu.

## Ví dụ hoàn chỉnh: List page + CRUD

Xem `app/(app)/students/page.tsx` + `lib/services/student.service.ts` +
`components/students/*.tsx` làm mẫu cho pattern:

1. Service file: query key + `useStudentActions(args?)` gộp cả `list` (query) lẫn
   `create`/`update`/`delete` (mutation) trong 1 hook.
2. Page component: `useStudentActions({ list: queryParams }).list` → `mapApiToStudent()` → render
   `Table` + `Pagination`; nút xoá gọi
   `useStudentActions().delete.mutate(id, { onSuccess, onError })`, `onSuccess` invalidate query key
   — xem `handleDelete` trong `app/(app)/students/page.tsx`.
3. Dialog components: mỗi dialog nhận `open`/`onClose`/`onSaved`. **Lưu ý**:
   `components/students/add-student-dialog.tsx`/`edit-student-dialog.tsx` hiện gọi thẳng
   `usePost`/`usePut` (chưa qua `useStudentActions().create`/`.update`) — nợ kỹ thuật có sẵn, không
   phải mẫu để copy; dialog mới nên gọi qua `useStudentActions()` như mô tả ở trên.
4. Type: `ApiStudent` (BE shape) + `Student` (UI shape) + `CreateStudentPayload` + `UpdateStudentPayload`
   trong `types/student.types.ts`.

Danh mục endpoint: `API_ENDPOINTS.md`. Khi thêm/đổi lời gọi, cập nhật file này cho khớp
`../API-REPORT.md` của BE.
