# Báo cáo review source FE (D:\projects\ui)

Ngày: 2026-10-11 · Phạm vi: `app/`, `components/`, `lib/`, `hooks/`, `types/`, `test/`
Phương pháp: 6 sub agent review song song, chỉ đọc code, không sửa file. Các phát hiện do sub agent báo lại, chưa được kiểm chứng lại từng mục.
Ký hiệu: **(x2)** / **(x3)** = nhiều agent độc lập cùng phát hiện. **[CHẮC]** = đã đối chiếu code (và BE nếu có). **[NGHI]** = suy luận, phụ thuộc BE/runtime.

---

## Nhóm 1: lỗi chức năng đang hỏng thật (sửa trước)

| # | Vị trí | Vấn đề |
|---|---|---|
| 1 | `components/schedule/schedule-form-dialog.tsx:132-171`, `types/session.types.ts:84` | Payload tạo/sửa buổi học sai hợp đồng BE. FE gửi `date/startTime/endTime`, BE (`createSessionSchema`) cần `startAt/endAt/sessionNumber`. Tạo bị 422; sửa trả 200 nhưng ngày giờ không đổi (Zod bỏ key lạ). Dòng 133-134 tính `startAt/endAt` rồi bỏ không dùng. |
| 2 | `components/sessions/session-detail-view.tsx:281,393` | Dùng `axiosInstance.patch('/sessions/:id')` nhưng gateway chỉ có `@Put(':id')` → 404 khi đổi trạng thái và nhập tài liệu/bài tập. Invalidate `["session-detail", id]` không khớp key thật `["sessions","detail",id]`. |
| 3 | `components/grades/grades-page.tsx:853-857, 197-201` | Đọc `.data` trong khi BE trả `{classes, pagination}` và `{sessions, pagination}` → danh sách lớp và buổi học luôn rỗng ở màn Điểm của gia sư. |
| 4 | `components/students/add-student-dialog.tsx:36,107-120`, `types/student.types.ts:21-25` | `parentRelationship` mặc định `"MALE"` (lấy nhầm từ `GENDER_ENUM`), option "Người giám hộ" gửi `"OTHER"`; BE chỉ nhận `FATHER/MOTHER/GUARDIAN` → 422. Select lớp gửi `classCode` (BE không có field này, bị strip) nên chọn lớp không có tác dụng. |
| 5 | `components/curriculum/components/chapter-section.tsx:31` | `setAddingLesson(true)` không được gọi ở đâu → không mở được form thêm bài học. |
| 6 | `components/classes/page/session-table.tsx:189-227`, `class-detail-page.tsx:418,581-617` | `actionsColumn` được tạo nhưng không đưa vào `columns`; menu đổi trạng thái và checkbox chọn nhiều đều vô dụng, `changeStatusSelected` là code chết. |
| 7 | `components/categories/category-form-dialog.tsx:56`, `categories-page.tsx:70,111` | `Category.parent` là tên cha nhưng select dùng `option.id`, API nhận `parent_id` → sửa category con gửi tên làm `parent_id`. |
| 8 | `components/classes/edit-class-dialog.tsx:172-273, 230` | `studentIds` luôn được gửi, mặc định `[]` nếu query `class-students-edit` chưa tải xong; BE `syncStudents` xoá toàn bộ học sinh khi mảng rỗng. Cache `staleTime` 30s không invalidate sau lưu. Dòng 230 invalidate `["classes","list"]` sai key. |
| 9 | `components/providers/socket.provider.tsx:35-79` **(x2)** | Socket không bao giờ kết nối: effect deps `[]` đọc token một lần, effect của con chạy trước effect rehydrate của cha (`skipHydration`) nên token còn `null`. Context truyền `socketRef.current` (ref, không re-render). Không disconnect khi logout. |
| 10 | `hooks/useCurrentUserRole.ts:15-30`, `hooks/useCurrentUserId.ts:16-17` **(x2)** | `atob` lỗi với base64url (`-`, `_`) và UTF-8 → role rơi về `"TUTOR"`, `RoleGuard` đá ADMIN về `/` khi F5 ở deep link. Nên trả "loading" thay vì mặc định TUTOR. |

---

## Nhóm 2: rủi ro cao về dữ liệu và bảo mật

- **QR chuyển khoản dùng thông tin giả**: `lib/bank-info.ts`, `components/fees/tuition-pay-dialog.tsx`, `tuition-detail-dialog.tsx` hard-code STK `1234567890123`. Phụ huynh quét QR sẽ chuyển tiền sai nơi.
- **PARENT thấy dữ liệu giả ở `/grades`**: `components/practice/parent-portal-view.tsx` dùng `MOCK_CHILD`/`MOCK_ASSIGNMENTS`.
- **PARENT dùng id phụ huynh làm `studentId`**: `components/classes/page/exercise-submit-page.tsx:135,164-166,195-201` → luôn thấy "chưa nộp bài", không có điểm danh. `canSubmit` (dòng 317) không kiểm tra `exercisesLocked`.
- **`/flow-request` thiếu guard role (x2)**: `app/(flow)/layout.tsx`, `lib/rbac/route-access.ts`. Mọi role đăng nhập xem được kiến trúc nội bộ (Kafka topic, gateway path, tên service). Cần `{ prefix: "/flow-request", allow: ["ADMIN"] }` hoặc `RoleGuard`.
- **Logout không xoá cache React Query**: `components/layout/app-sidebar.tsx:196-199`. User B đăng nhập cùng tab có thể thấy cache của A. Cần `queryClient.clear()`.
- **Refresh token**:
  - `lib/axios/client.ts:155`, `refresh-access-token.ts`: refresh lỗi chỉ `clearAuth()`, không `clearAuthTokens()`; request interceptor vẫn fallback `getAccessToken()` nên gửi token chết (kể cả `/auth/login`).
  - Mọi lỗi refresh (mạng, timeout, 5xx) đều coi là hết phiên → logout oan. Chỉ nên clear khi 401/403.
  - `components/providers/auth.provider.tsx:89-163` **(x2)**: `verifySession` chạy lại mỗi lần token đổi, `isAuthenticated` chớp false, và gọi refresh thủ công lần nữa bằng refresh token đã dùng/thu hồi (có thể kích hoạt reuse detection của BE).
  - `auth.provider.tsx:119-122`: lỗi mạng/500 vẫn `setSessionChecked(true)` mà không có `user`.
  - [NGHI] Đa tab với refresh token rotation: tab B refresh thất bại rồi ghi `null` vào `auth-store` dùng chung, làm tab A mất phiên.
- Hai nguồn lưu token (zustand persist và localStorage thô) không đồng bộ.
- [NGHI] Token OAuth truyền qua query string (`oauth-callback.tsx:24-25`).
- Admin tự đổi role của chính mình trong `edit-user-dialog` [NGHI]; `ROLE_COLOR[u.role]` crash nếu BE trả role lạ [NGHI].

---

## Nhóm 3: bug logic mức trung

### Data layer / API
- **Bẫy `unwrapApiData` với `data: null`** (`lib/axios/api-unwrap.ts:2-13` trả nguyên envelope) kết hợp `?? []`: `attendance.service:34`, `chapter.service:39`, `class.service:66`, `schedule.service:56`, `session.service:63`, `user.service:115,127,137`, `curriculum.service:63`, `fees/create-tuition-dialog.tsx:58`. Nên cho `unwrapApiData` nhận fallback hoặc thêm helper `unwrapApiList`. Hiện chỉ `class.service` có `it.fails`.
- **Query không tham số tự chạy ở nhiều call site (x3)**: `generateCode` (`/classes/generate-code`, `/students/get-student-code`, `/curriculum/generate-code`) và `class.service` `list` (`/classes?limit=100`). Call site: `fees-page:82`, `session-detail-view:428`, `exercise-submit-page:189`, `add-student-dialog:98`, `edit-student-dialog:158`, `schedule-form-dialog:116`, `students/page:130`, `settings/page:696`, `family-fees-page:65`, `delete-class-dialog:23`, `class-detail-page:127`, `create-class-modal:158,167`. STUDENT/PARENT có thể nhận 400/403. Nếu endpoint sinh mã có side-effect thì tệ hơn (chưa kiểm tra BE).
- `queryFn` không truyền `signal`; `apiDownloadFile` với `responseType: "blob"` làm mất message lỗi của BE (`toApiError` không đọc được Blob). Cùng vấn đề ở `session-shared.tsx:116-129`.
- [NGHI] `update` gửi kèm `id` (và `curriculumId`) trong body, có thể bị 400 nếu BE bật `forbidNonWhitelisted` (`chapter.service:59`).
- [NGHI] `useStudentActions` gửi `classCode/classId` nhưng `getStudentsQuerySchema` không có → filter lớp ở trang students có thể bị bỏ qua.
- Invalidate sai/thiếu key: curriculum (`curriculum-form-dialog:170`, `delete-curriculum-dialog:26`), class (`class-detail-page:391-404`), attendance (`session-detail-page:169-170,444`), exercise (`exercise-grade-workspace`), `useMarkAsRead` không invalidate `unread-counts`.

### Form / mutation
- `create-class-modal.tsx:304-347`: tạo lớp thành công nhưng `createBulk` lỗi → toast lỗi chung, không invalidate, bấm lại tạo lớp trùng.
- `create-class-modal.tsx:290-317`: `grade` và `maxStudents` không có trong `createClassSchema` BE, bị bỏ lặng lẽ. Nút "Tạo buổi học đầu tiên"/"Xem chi tiết" chỉ `onClose`, không điều hướng.
- `session-detail-page.tsx:428-453`: điểm danh nhanh nhiều học sinh bị mất callback (TanStack v5 chỉ gọi callback của lần `mutate` cuối). Nên dùng `mutateAsync` + try/catch.
- Không xoá được field: `session-detail-page:312-328` (title/description/note), `exercise-grade-workspace` (comment), `tuition-detail-dialog:272-275` (note/dueDate/paidDate) do `|| undefined` làm key bị bỏ.
- `tuition-detail-dialog.tsx:259`: chuyển PAID → UNPAID/OVERDUE vẫn gửi `paidDate`.
- `exercise-grade-workspace.tsx:206-268`: annotation và file lời giải chỉ nằm trong state, không lưu; `doSave` dùng `mutateAsync` không try/catch.
- `exercise-submit-page.tsx:205-230`: upload nhiều file, một file lỗi thì cả lô bị bỏ, file đã lên server bị orphan.
- `categories-page.tsx:113,118`: đóng dialog ngay sau `mutate`, API lỗi là mất dữ liệu đã nhập; `userId` có thể là chuỗi rỗng.
- `edit-user-dialog.tsx:297-301`: mở lại user cũ sau khi Hủy vẫn thấy giá trị gõ dở.
- `edit-student-dialog.tsx:438`: gender `OTHER`/null bị ép thành `MALE`; Zod enum không có `OTHER`.
- `wallet-form-dialog.tsx:63`: chặn số dư âm nên không sửa được ví CREDIT.
- `delete-student-dialog`, `delete-user-dialog` không truyền `loading` → bấm nhiều lần gửi nhiều DELETE; xoá phần tử cuối trang cuối khiến `page` vượt `totalPages`.
- `curriculum-detail-page:57-67`, `chapter-section:65,104`: xoá chương/bài học không có xác nhận.
- `curriculum-form-dialog.tsx:44`: `grade` chuỗi tự do nhưng BE ép `Number()`; `code` FE tối đa 50 ký tự, BE tối đa 6 [NGHI].

### UI primitives
- `components/ui/pagination.ui.tsx:62-91`: Prev chỉ tắt khi `page === 1`, Next chỉ tắt khi `page === totalPages`. Với `totalPages = 0` (list rỗng), Next vẫn bật và gửi `page = 0`. Cần `page <= 1` / `page >= totalPages`. Cũng render toàn bộ số trang, không rút gọn.
- `components/ui/dialog-form.ui.tsx:219-262`: thiếu focus trap, autofocus, restore focus, `aria-labelledby`.
- `components/ui/index.ts:3`: `export * from "./menu-popover.ui"` không export gì (chỉ có `export default`).
- `menu-popover.ui.tsx`: ESLint error `set-state-in-effect` (dòng 86); scroll listener capture đóng menu khi bất kỳ phần tử nào cuộn; thiếu `aria-expanded`, điều hướng bàn phím.
- `data-table.ui.tsx:182-228`: khi loading/error mà còn data cũ thì hàng dữ liệu hiện cùng spinner/lỗi; `colSpan` = 0 nếu columns rỗng; prop `pageSize` không dùng; thiếu `role="status"`/`role="alert"`.
- `otp-input.ui.tsx:63-80`: nhập vào ô sau khi ô trước còn trống thì chữ số bị dồn về ô trước.
- `select.ui.tsx`: dropdown `absolute` không portal, có thể bị cắt trong Dialog [NGHI]; không có điều hướng bàn phím.
- `button.ui.tsx`: không đặt `type="button"` mặc định; `loading` không có spinner.

### Role / route
- `app/(app)/schedule/page.tsx:536-963`: STUDENT/PARENT thấy nút Thêm/Sửa/Xoá lịch (không có check role; chưa xác minh BE có chặn 403).
- `lib/rbac/route-access.ts` lệch `app-sidebar.tsx`: `/users` (ADMIN) và `/fees` (STUDENT) có route nhưng không có menu; `NAV.reports` không role nào hiện; các route legacy (`/reports`, `/accounts`, `/analytics`, `/budgets`, `/categories`, `/investments`, `/transactions`, `/practice-exams`, `/api-gaps`) mở cho mọi role.
- `session-submissions-page.tsx`: danh sách bài nộp cả lớp không check role [NGHI, phụ thuộc BE].
- `components/layout/app-header.tsx:11-31`: `pageTitles` thiếu `grades`, `curriculum`, `sessions`, `tutors`, `users`, `logger`, `test-monitor`, `reports` → hiện "Tổng quan".
- `app-sidebar.tsx:50`: badge thông báo hard-code `5`.
- `components/auth/login-form.tsx`: không đọc `?error=oauth_failed` từ OAuth callback → lỗi không hiện.

### Phân trang cứng / thống kê sai
- `schedule/page.tsx:408-410`: chỉ tải `limit: 100`; còn `console.log` ở dòng 415-416.
- `fees-page:76`, `family-fees-page:227,211`, `tuitions-board:190-206`: `limit: 100`, thống kê tính trên mảng cắt cụt; hook `summary` có sẵn nhưng không dùng.
- `student-sessions-page.tsx:135`: `limit: 10`, thống kê tính trên 10 buổi đầu.
- `classes-page.tsx:283-299`: lọc/phân trang client trên 100 lớp; nhãn `sessionsThisWeek`/`pendingFee` thực chất là tổng.
- `notifications/page.tsx:284-297`: số đếm theo tab tính từ trang hiện tại (tối đa 5 item) nên không khớp tổng.
- `students/page.tsx:466-479`: khi request lỗi hiện đồng thời "danh sách trống" và "lỗi".

### Ngày giờ / múi giờ
- `toISOString().slice(0,10)` lấy ngày UTC → lùi một ngày trong khung 0h-7h giờ VN: `schedule-form-dialog:98`, `create-session-dialog:35`, `edit-class-dialog:48-55`, `tuition-detail-dialog:260`.
- `tuitions-board.tsx:389`: nhãn "Tháng 0 · 2026" khi chọn "Tất cả"; `YEARS` hard-code 2024-2027; `millionsFmt` làm tròn kém.
- `create-class-modal.tsx:98-104`: `endTime` < `startTime` khi buổi qua nửa đêm.
- `discussions-page.tsx`: `formatTime` dùng chênh lệch 24h thay vì ngày lịch.

### Họ tên
- `add-tutor-dialog.tsx:132-138` lưu "Họ" vào `lastName`, `create-user-dialog.tsx:143-166` lưu "Họ" vào `firstName`; `tutors-page.tsx:66-68` hiện `firstName lastName`, `discussions-page.tsx:316` hiện `lastName firstName` → "Trần Văn Khoa" hiện thành "Văn Khoa Trần". Cần thống nhất quy ước.

### Realtime / monitoring
- `components/ai-chat/ai-analysis-widget.tsx:160,232`, `hooks/useAiChat.hook.ts`: spinner không bao giờ hiện vì `messages` luôn có WELCOME_MESSAGE; lỗi hiển thị như kết quả phân tích. `useAiChat` có thể gửi đôi khi Enter nhanh (closure đóng băng `isPending`), và lưu thông báo lỗi vào `history`.
- `components/logger/logger-page.tsx:76-99`: log socket mới được chèn vào cache dù đang search và không khớp; `pagination.total` tăng sai.
- `hooks/useTestMonitorTrace.hook.ts:264-302`: đóng dialog trước khi response về thì `onSuccess` vẫn chạy, dialog tự mở lại và socket `/logs` mở lại. `open()` trace khác không `liveTrace.stop()`.
- `hooks/useLogSocket.hook.ts:33-54` **(x2)**: token đọc một lần, reconnect dùng token cũ. Dùng `auth: (cb) => cb({ token: useAuthStore.getState().accessToken })`.
- `hooks/useChatSocket.hook.ts:63-70`: không join lại room sau reconnect [NGHI].
- `components/flow-requests/flow-request-diagram.tsx:198`: list rỗng hợp lệ cũng hiện lại dữ liệu seed; sửa/xoá item seed gọi PUT/DELETE id không tồn tại → 404.
- `hooks/useTestMonitorMock.hook.ts:7,14`: `?mock=1` bật mock ở mọi môi trường; `test-monitor-mock-data.ts` (581 dòng) nằm trong bundle prod.
- `discussions-page.tsx:229-243,280-283,332-338`: tin mới trong hội thoại đang mở không gọi `markAsRead`; `mutateAsync` tạo chat không `try/catch`/`onError`; `sendMessage` không `stopTyping()` [NGHI].
- [NGHI] `useLiveTrace`: hop RPC log chậm hơn `SETTLE_MS = 500ms` có thể bị thiếu trong trace.

### Khác
- `session-detail-view.tsx:366-369,662-669,421`: điểm danh tutor chỉ ở state local và không có nút lưu; "Ghi chú riêng" hiện `SAMPLE.privateNote`; `tutorName` rơi về `SAMPLE.tutorName`.
- `class-detail-page.tsx:573`: link `/classes/${id}/students` không có route (404); nút `+` ở bảng học sinh không có `onClick`; `nextSessionNumber = sessions.length + 1` có thể trùng khi đã xoá buổi.
- `session-detail-page.tsx:1051-1053`: "Hạn nộp" dùng `session.endAt` thay vì `exerciseDueAt`. Dialog nói không thể sửa điểm danh sau khi kết thúc nhưng checkbox không bị disable (mâu thuẫn).
- `accounts-page.tsx:217-231,301`: cộng số dư các ví khác `currency` rồi format cứng USD; mock tx ngày 6/2026 nên thu/chi tháng này luôn bằng 0.
- `grades-page.tsx:844`: `.sort()` trực tiếp trên mảng trong cache React Query.
- `reports-page.tsx:336,109`: `averageScore.toFixed` crash nếu `undefined`; `pagination.totalPages` không optional-chain.
- Search không debounce: `tutors-page:127`, `users-page:334`, `reports-page:273`.
- `users-page.tsx:169` dùng `window.confirm`, trái quy tắc `ConfirmDialog`.
- `tuition-pay-dialog.tsx:80`: `window.open` thiếu `noopener`.
- `hooks/useTeachingGrades.hook.ts`: lệch SSR/CSR, key localStorage không gắn theo user, `setItem` không `try/catch`. `hooks/use-mobile.ts:5-9`: hydration mismatch.
- `components/logger/request-detail-dialog.tsx:283-342`: `navigator.clipboard.writeText` không `.catch`. `logger-utils.ts:173`: `roots[0]` có thể `undefined`.
- Typo "Offine" ở `discussions-page.tsx:176`.
- `app/layout.tsx`: `lang="en"` trong khi UI chủ yếu tiếng Việt.
- `practice-exams/*`: toàn mock, chỉ exam id `"1"` có câu hỏi; `practice-exam-take-page.tsx:57` dùng `px-40` cố định, tràn trên mobile. `student-assignments-view.tsx:154-159`: `RESUBMIT` bị gộp thành "Chưa nộp".

---

## Nhóm 4: tooling và test

- `bun run lint` bị hỏng: `eslint "{src,apps,libs,test}/**/*.ts" --fix` (package.json:9) glob sai thư mục nên gần như không lint gì, lại có `--fix`. Agent xác nhận `git status` vẫn sạch sau khi chạy.
- `tsc --noEmit`: 2 lỗi TS2345 ở `test/lib/axios/client.test.ts:55,63` (`AxiosError<unknown>` → `AxiosError<ApiErrorResponse>`); vitest không typecheck nên không phát hiện.
- ESLint đủ thư mục (`--no-fix`): 3 error + 58 warning. Error: `menu-popover.ui.tsx:86` (`set-state-in-effect`), `socket.provider.tsx:82` (`refs`, báo 2 lần). Warning đáng chú ý: `session-shared.tsx:173` `<img>` thiếu `alt`, nhiều import/biến thừa.
- Test: 43 file pass, 1 skipped; 369 pass, 1 expected-fail, 1 todo. Không có test fail.
  - `it.fails` ở `test/lib/services/class.service.test.ts:74` đang che bug `unwrapApiData ?? []`.
  - `it.todo` ở `test/app/layout.test.tsx:2` là placeholder rỗng.
- **Độ phủ test mỏng**:
  - `components/ui`: chỉ có test cho card, data-table, pagination, separator.
  - `lib/services`: 5/18 (auth, class, notification, student, test-scenario).
  - `hooks`: khoảng 4/36.
  - `app/`: không có test page nào.
- `types/index.ts` thiếu re-export `auth.types.ts` và `practice-exam.types.ts`.
- i18n: 17 dictionary, key vi/en khớp 100%.

---

## Nhóm 5: nợ kỹ thuật và code chết

- **Dead code**: `components/classes/page/curriculum-page.tsx` (cùng `curriculum-chapter-row`, `curriculum-lesson-row`, `create-class-chapter-dialog`; gọi sai endpoint), `components/sessions/student-session-detail.tsx`, `components/classes/page/session-detail-watch-page.tsx`, `components/practice/tutor-assignments-view.tsx`, `lib/axios/auth-redirect.ts` (`redirectIfAuthenticated` đọc cookie không bao giờ được set; còn khiến các trang auth bị dynamic render). Nhánh PARENT của `session-detail-view.tsx` là code chết vì `ROUTE_ACCESS` chặn.
- **Trang tài chính legacy là UI tĩnh chưa nối API**: budgets, transactions, accounts, investments, analytics, `dashboard/*` (một số nút không có handler: "New budget", nút "Filter" của transactions).
- **Vi phạm quy ước lan rộng**:
  - Khoảng 54 file dùng `<button>` thô; ngoài ra còn `<input>`, `<label>`, `<table>`, `<select>` thô.
  - Chuỗi hard-code không qua dictionary: fees, tutors, users, reports, discussions, budgets, analytics, categories.
  - `unknown` làm generic: `useAdminUsers.hook.ts`, `users-page`, `categories-page`, `reports-page`.
  - Gọi `axiosInstance`/`useQuery` thô trong component/hook: `useChat.hook.ts`, `session-detail-page`, `exercise-submit-page`, `exercise-grade-workspace`, `curriculum-detail-page`, `chapter-section`...
  - Type DTO khai báo inline: `categories-page.tsx:25-62`, `fees/*`, `edit-user-dialog`, `ClassStudentDto` lặp nhiều file.
  - `add-student-dialog`, `edit-student-dialog` vẫn gọi thẳng `usePost`/`usePut` (nợ đã ghi nhận trong rule).
- **`CLAUDE.md` lỗi thời**: nhắc Redux và route `verify-otp`, nhưng code dùng Zustand và không có route đó.

---

## Điểm tốt (đã kiểm tra)

- Không có XSS (`dangerouslySetInnerHTML`/render markdown) trong phạm vi monitoring/ai-chat.
- Không có type trùng tên giữa các `types/*.types.ts`; `DiagramRequest` đã tách đúng.
- Không có rò rỉ listener/timer nghiêm trọng (`useLogSocket`, `useLiveTrace`, `useTracePlayback`, `useChatSocket`, `useDebounce`, theme picker đều cleanup đúng).
- Logic xếp hàng refresh (`refreshInFlight`, cờ `_retry401`) đúng ở mức cơ bản.
- Không có redirect loop giữa `AuthGuard`/`RoleGuard`/`AuthLayout`.
- `useSearchParams` ở `oauth-callback` và `reset-pass` đã có Suspense.
- Không vi phạm barrel `@/components`.

---

## Chưa xác minh / giới hạn của review

- Chưa kiểm tra BE có chặn thao tác của STUDENT/PARENT ở `/schedule` và trang bài nộp hay không.
- Chưa kiểm tra endpoint "sinh mã" có side-effect đặt chỗ hay không.
- Chưa xác minh shape dashboard cho ADMIN/PARENT (`app/(app)/page.tsx:138` chỉ phân nhánh `isStudent`).
- `settings/page.tsx` (1976 dòng) và `schedule/page.tsx` (976 dòng) mới được đọc một phần.
- Một số file chỉ được grep, chưa đọc từng dòng: `flow-request/*`, các dialog test-monitor, `exercise-annotation-marker`, `staged-file-tile`, `watch-curriculum-chapter`, `class-status-menu`, `session-status-menu`, `curriculum-file-chip`, `class-student-badges`, `practice-exam-result-page`.
- Chưa chạy app trên trình duyệt; các nghi vấn về layout/UX (Select trong Dialog, OTP autofill...) chưa được kiểm chứng.

## Đề xuất thứ tự sửa

1. Nhóm 1 (10 mục). Mục #3 và #4 đã được đối chiếu với schema BE.
2. Các sửa nhỏ và an toàn: `Pagination` biên, guard `/flow-request`, `unwrapApiData` fallback, decode JWT base64url, `queryClient.clear()` khi logout, script `lint`, 2 lỗi `tsc` trong test.
3. Nhóm 2: xử lý QR chuyển khoản, `socket.provider`, refresh token.
4. Nhóm 3 và 5 theo từng feature, kèm bổ sung test cho `components/ui`, `lib/services` và `hooks`.
