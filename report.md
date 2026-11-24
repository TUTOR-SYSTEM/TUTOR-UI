# Báo cáo test E2E — Gia Sư Pro (FE `ui` + API)

Ngày test: 2026-11-24 · Môi trường: `localhost:3000` (FE), `localhost:8888` (gateway) · Trình duyệt: Chrome qua extension

## 0. Bảng tổng hợp lỗi (cập nhật sau đợt sửa)

Trạng thái: **Mở** = chưa sửa · **Đã sửa** = đã sửa trong đợt này (chưa commit) · **Đóng** = không phải lỗi / đúng thiết kế · **Ghi nhận** = thông tin, không chặn luồng.

| ID | Mức | Lỗi | Vị trí (file/BE) | Trạng thái |
|---|---|---|---|---|
| B-01 | Trung bình | Email giả `…@no-email.local` hiện ở form Sửa học sinh; lưu lại có thể ghi email giả | BE `user/src/features/student/student.service.ts:313,352`; FE `components/students/edit-student-dialog.tsx` | Đã sửa (chưa commit): email placeholder `@no-email.local` không còn hiển thị trong form Sửa; email học sinh bắt buộc khi tạo |
| B-02 | Thấp | Cột "Học sinh" của gia sư mới hiện "0" thay vì "—" | `components/tutors/tutors-page.tsx` | Đã sửa (chưa commit): cột Học sinh hiện "—" khi trống |
| B-03 | Cao | Admin không chấm được bài lớp của gia sư khác; buổi đã kết thúc không thêm được bài tập | `components/classes/page/session-detail-page.tsx`, `session-submissions-page.tsx` | Đã sửa (chưa commit): tutor chỉ thêm bài tập sau khi buổi kết thúc; admin xem bài nộp ở chế độ chỉ đọc (BE `exercise.repository.ts` cho ADMIN xem mọi bài) |
| B-04 | Trung bình | Học sinh tạo không có email nên không nhận mật khẩu ngẫu nhiên; cần quy trình thay thế | BE/FE | Đã sửa (chưa commit): email học sinh là trường bắt buộc (FE + gateway `createStudentSchema`) |
| B-05 | Trung bình | Buổi học tạo thủ công lệch lịch cố định của lớp, không cảnh báo | `components/classes/dialog/create-session-dialog.tsx` | Đã sửa (chưa commit): popup cảnh báo "Buổi học lệch lịch lớp" trước khi tạo; lịch lấy từ `/schedules/class/:id` |
| B-06 | Thấp | Tab Học sinh không nhận SĐT, chỉ nhận mã HS; nhãn "Mã người dùng hoặc email" dễ nhầm | `components/auth/auth-ui.tsx`, `lib/i18n/auth.dictionary.ts` | Giữ nguyên (chưa có chỉ đạo sửa) |
| B-07 | — | File bài tập không hiện cho học sinh khi buổi còn "Sắp diễn ra" | — | Tạm đóng (theo yêu cầu) |
| B-08 | Cao | Trợ lý AI không truy cập dữ liệu ứng dụng, trả lời sai và gợi ý đường dẫn sandbox | `components/ai-chat/ai-chat.tsx` | Tạm đóng (theo yêu cầu) |
| B-09 | Thấp | Ô "Số tiền" hoá đơn tự điền khi chọn học sinh; nhập thêm thành `300000300000` | `components/fees/create-tuition-dialog.tsx` | Tạm đóng (theo yêu cầu) |
| B-10 | Trung bình | Thẻ "Quá hạn" đếm học sinh không khớp dữ liệu (hoá đơn không có hạn đóng vẫn bị tính) | `components/fees/fees-page.tsx` | Đã sửa (chưa commit): quá hạn = đã qua hạn đóng và chưa thanh toán; đếm theo học sinh |
| B-11 | Ghi nhận | Thảo luận với phụ huynh đang tắt, menu vẫn hiện "Tin nhắn" | — | Ghi nhận |
| B-12 | Cao | Admin không có cách đặt mật khẩu cho phụ huynh; email giả nên không dùng được quên mật khẩu | BE `user/src/features/student/student.service.ts` (chỉ có `setPassword` cho học sinh); FE không có nút | Đã sửa (chưa commit): trang **Quản lý phụ huynh** `/parents` (admin): danh sách, tìm kiếm, đặt mật khẩu. BE: `admin.listParents`, `admin.setParentPassword`, gateway `GET /admin/parents`, `PUT /admin/parents/:id/password`. Đã kiểm tra: admin đặt mật khẩu → phụ huynh đăng nhập được |
| B-13 | Trung bình | Trang Bài tập của con có link "Xem học phí" nhưng trang Học phí báo chưa khả dụng | `components/grades/*`, `components/fees/*` | Đã sửa (chưa commit): bỏ link "Xem học phí" trong trang bài tập của con |
| B-14 | — | Cài đặt phụ huynh trống (nghi ngờ ban đầu) | — | Đóng: đã kiểm tra lại, hồ sơ phụ huynh hiển thị đủ họ tên/SĐT/email (không phải lỗi) |
| B-15 | Cao | Phụ huynh thấy nút "Tạo chương trình" ở trang Chương trình của con | `app/(app)/curriculum`, role guard | Đã sửa (chưa commit): `/curriculum` chỉ cho TUTOR (route guard), bỏ mục "Chương trình của con" khỏi menu phụ huynh. Đã kiểm tra: phụ huynh vào `/curriculum` bị chuyển về trang chủ |
| B-16 | Thấp | Badge "Thông báo" hiện 8, trang chỉ có 6 thông báo | sidebar + `app/(app)/notifications` | Đã sửa (chưa commit): số đếm tab lấy từ server (không theo trang hiện tại); danh sách làm mới cùng nhịp 30s với badge |
| B-17 | Thấp | Thông báo "Bài tập mới cần nộp" hiện "Chưa có hạn nộp" dù bài có hạn | BE/FE thông báo | Đã sửa (chưa commit): thông báo "Bài tập mới cần nộp" dùng hạn nộp = `endAt` của buổi khi chưa có `exerciseDueAt` (BE `tutor/src/features/session/session.service.ts`) |
| B-18 | Thấp | Hướng dẫn trang Thông báo nhắc nút "Đánh dấu đã đọc" nhưng nút không có (thông báo đã đọc khi mở) | `app/(app)/notifications` | Mở |
| B-19 | Ghi nhận | Gia sư tạo không chọn môn hiện "Môn dạy: —" | `components/tutors/add-tutor-dialog.tsx` | Đã sửa (chưa commit): bắt buộc chọn ít nhất một môn khi tạo gia sư (FE schema + gateway `admin.schema.ts`) |

Đã sửa trong đợt này (chưa commit) — xem mục 1: lỗi đăng ký/nhập SĐT-email phụ huynh, thứ tự tên hiển thị, fallback "_ _ _ _" ở tiêu đề buổi học.

Chi tiết lịch sử test ở các mục 2–10 bên dưới.

## 1. Đã sửa trong đợt này (chưa commit)

| # | Lỗi | Trạng thái | File chính |
|---|-----|-----------|-----------|
| 1 | Form tạo học sinh không có SĐT/email phụ huynh; phụ huynh mới phải có ít nhất một trong hai | Đã sửa, đã kiểm tra trên trình duyệt | `components/students/add-student-dialog.tsx`, `lib/validation/student-form.schema.ts`, `types/student.types.ts`, `lib/i18n/students.dictionary.ts` |
| 2 | Tên học sinh hiển thị sai thứ tự ("Học Sinh Một QA") ở điểm danh, bài nộp, học phí, bảng điểm, quản lý user, badge lớp | Đã sửa, đã kiểm tra điểm danh | `components/classes/page/session-detail-page.tsx`, `session-submissions-page.tsx`, `components/fees/tuition-*.tsx`, `components/grades/grades-page.tsx`, `components/users/*`, `components/classes/components/class-student-badges.tsx` |
| 3 | Tên phụ huynh "Nguyễn QA Phụ Huynh" | Không đổi — hiển thị đúng thứ tự Họ Tên, chờ xác nhận kỳ vọng | — |
| 4 | "_ _ _ _" ở tiêu đề buổi học khi chưa có chương | Đã sửa (fallback "—") | `components/classes/components/session-table.tsx` |
| 5 | "- - - -" dưới tên buổi học | Đã sửa (cùng nguyên nhân với #4) | như #4 |

Kiểm tra: `tsc --noEmit` chỉ còn lỗi có sẵn ở `test/lib/axios/client.test.ts`; ESLint trên file đã sửa: 0 lỗi, 2 warning có sẵn.

## 2. Bug còn lại

### 2.1 Bug mới (đợt admin)

- **B-01 — Email giả của phụ huynh hiển thị ở form Sửa học sinh** (BE `user/src/features/student/student.service.ts:313,352`; FE `components/students/edit-student-dialog.tsx`)
  - Hiện tượng: học sinh tạo không kèm email phụ huynh có email `tranqa_ph_hai@no-email.local` (BE tự sinh). Dialog Sửa hiển thị email này.
  - Rủi ro: bấm "Lưu thay đổi" có thể ghi email giả vào hồ sơ phụ huynh.
  - Nguyên nhân: BE dùng `${username}@no-email.local` khi không có email, và trả lại email này cho FE.
  - Đề xuất: BE không trả email tự sinh (hoặc trả `null`); FE hiển thị ô trống và chỉ gửi email khi người dùng sửa.
- **B-02 — Cột "Học sinh" của gia sư mới hiển thị "0"** (`components/tutors/tutors-page.tsx`)
  - Gia sư chưa có học sinh hiển thị "0" dạng chữ, các gia sư khác hiển thị "—" hoặc danh sách tên. Không đồng nhất. Mức nhỏ.

### 2.2 Bug đã có từ trước (chưa xử lý)

- **B-03 — Không có luồng chấm bài cho admin, và buổi đã kết thúc không thêm được bài tập** (`components/classes/page/session-detail-page.tsx`, `session-submissions-page.tsx`)
  - Admin không phải gia sư lớp SZP590 nên trang lớp chỉ hiện giao diện học sinh.
  - Buổi đã "Kết thúc" khoá ô upload bài tập và nút xem bài nộp ("Kết thúc buổi học để xem bài nộp").
  - Cần quyết định sản phẩm: admin có được chấm bài lớp gia sư khác không; có cho thêm bài tập sau khi kết thúc buổi không.
- **B-04 — Học sinh tạo không có email nên mật khẩu ngẫu nhiên không gửi được** (BE/FE)
  - Đã kiểm tra: admin đặt mật khẩu cho học sinh thì học sinh đăng nhập được bằng mã HS. Vẫn cần quy trình rõ ràng khi không có email (ví dụ hiển thị mật khẩu tạm cho admin).

### 2.3 Bug mới (đợt học sinh)

- **B-05 — Buổi học tạo thủ công lệch lịch cố định của lớp, không có cảnh báo** (`components/classes/dialog/create-session-dialog.tsx`)
  - Hiện tượng: lớp có lịch T2 & T4 08:00–09:30 nhưng "Buổi 1 - QA" được tạo ở thứ 3 18:00–20:00. Trang lớp của học sinh vẫn hiển thị "T2 & T4 · 08:00", thông báo gửi học sinh ghi 18:00.
  - Đề xuất: cảnh báo khi ngày/giờ không khớp lịch lớp, hoặc cho phép chọn có chủ đích.
- **B-06 — Đăng nhập học sinh không chấp nhận SĐT, chỉ chấp nhận mã HS** (`components/auth/auth-ui.tsx`, `lib/i18n/auth.dictionary.ts`)
  - Hiện tượng: tab "Học sinh" nhập `0900000001` báo "Dữ liệu không hợp lệ"; nhập mã `KHE2AF` thì đăng nhập được. Nhãn ô là "Mã người dùng hoặc email", nên người dùng dễ nhầm.
  - Đề xuất: làm rõ nhãn hoặc hỗ trợ SĐT.

### 2.4 Không kiểm tra được (bị chặn)

- Chấm bài (B-03) và nộp bài: cần bài tập trong buổi học đang mở.
- Học phí, lịch dạy, chương trình, bài tập về nhà, trao đổi, AI trợ lý, thông báo của gia sư/phụ huynh: cần tài khoản gia sư Phan Đăng Hải (không có mật khẩu) hoặc phụ huynh.


## 3. Dữ liệu test còn trong DB

- Học sinh: `QA Học Sinh Một` (KHE2AF, lớp SZP590), `QA Học Sinh Hai` (8PSOWW)
- Phụ huynh: `Nguyễn QA Phụ Huynh`, `Trần QA PH Hai` (SĐT 0912345678)
- Lớp: `QA Lớp Toán Test` (SZP590), buổi `Buổi 1 - QA` (đã kết thúc)
- Gia sư: `Trần QA Gia Sư` (qa.tutor.test@example.com) — đã khoá rồi mở lại

## 4. Kết quả test luồng học sinh (đợt này)

- Admin đặt mật khẩu học sinh KHE2AF: OK (toast xác nhận).
- Đăng nhập học sinh bằng mã HS: OK. Lần đầu bắt buộc đổi mật khẩu: OK, sau đó vào được trang chủ.
- Dashboard học sinh: hiển thị đúng 1 lớp đang học, 1 buổi tuần này, học phí và thông báo.
- Trang Bài tập về nhà: hiển thị "Chưa có bài tập nào được giao" (đúng, vì buổi học không có bài tập).
- Trang lớp học sinh: thông tin lớp, buổi "Đã kết thúc", danh sách bạn cùng lớp: OK. Thông báo "Bạn đã được thêm vào lớp" hiển thị. Sai lệch lịch: xem B-05.
- Lịch học: hiển thị buổi 24/11 18:00, đúng theo buổi đã tạo (xem B-05).
- Console: không có lỗi.
- Chưa test: nộp bài (không có bài tập), trang học phí của học sinh, tin nhắn, AI trợ lý, đổi mật khẩu từ Cài đặt.

## 5. Ghi chú về trạng thái tài khoản test

- Mật khẩu test của học sinh và gia sư đã được đặt riêng khi test; không ghi trong báo cáo. Đổi mật khẩu khi cần.

## 6. Đợt test gia sư + chấm bài (tài khoản gia sư test)

Tài khoản gia sư test `Trần QA Gia Sư` (`qa.tutor.test@example.com`) đăng nhập được. Lớp SZP590 thuộc Phan Đăng Hải nên không dùng được; tạo dữ liệu mới bằng tài khoản này.

| Bước | Kết quả |
|---|---|
| Đăng nhập gia sư, đổi mật khẩu lần đầu | OK |
| Danh sách lớp (chưa có lớp) | OK, "Không có lớp học nào phù hợp" |
| Học phí (chưa có hoá đơn) | OK, trang trống với hướng dẫn |
| Tạo học sinh (gia sư tạo, có phụ huynh) | OK, học sinh "QA Học Sinh Ba" (mã M1E7LE), danh sách học sinh chỉ thấy học sinh của mình |
| Tạo lớp mới (T2 08:00, 300.000đ) | OK, toast thành công |
| Thêm học sinh vào lớp | OK |
| Tạo buổi học "Buổi 1 - Bài tập QA" | OK, nhưng lệch lịch lớp (xem B-05) |
| Tải file bài tập lên buổi học (gia sư) | Giao diện báo đã tải: `bai-tap-qa.txt` hiện trong mục Bài tập |
| Học sinh đăng nhập (mã M1E7LE), đổi mật khẩu lần đầu | OK |
| Học sinh xem Bài tập về nhà | **Không hiện bài** ("Chưa có bài tập nào được giao") |
| Học sinh xem chi tiết buổi học | **Mục Bài tập: "Chưa có tài liệu bài tập"**, không có nút nộp bài |
| Học sinh điểm danh (trạng thái) | "Chưa điểm danh" (đúng, buổi chưa diễn ra) |

### Bug mới đợt này

- **B-07 — File bài tập gia sư tải lên không hiển thị cho học sinh** (`components/classes/page/session-detail-page.tsx`, BE upload/exercise)
  - Gia sư thấy file ngay sau khi tải lên, nhưng học sinh (cùng lớp, buổi "Sắp diễn ra") không thấy file, cũng không thấy bài tập trong "Bài tập về nhà", và không có nút nộp bài.
  - Chưa xác định: file có được lưu trên server không (có thể cần bước "Lưu nội dung" hoặc trạng thái buổi khác), hay học sinh bị lọc theo điều kiện nào. Cần kiểm tra API `GET` bài tập của buổi học và kết quả khi tải lại trang gia sư.
  - Mức ảnh hưởng: chặn toàn bộ luồng nộp bài và chấm bài.

### Chưa test trong đợt này

- Nộp bài và chấm điểm: bị chặn bởi B-07.
- Lịch dạy, chương trình, tin nhắn, AI trợ lý của gia sư: chưa test (cần đăng nhập gia sư lại; tài khoản gia sư hiện đang đăng nhập bằng học sinh).
- Tạo hoá đơn học phí và thanh toán: chưa test.

## 7. Đợt test tiếp (gia sư, kiểm tra B-07)

### Kết quả
- Đăng nhập gia sư (sau khi học sinh đăng xuất): OK.
- B-07 kiểm tra lại: sau khi tải lại trang, gia sư vẫn thấy `bai-tap-qa.txt` → file **đã được lưu trên server**. Lỗi nằm ở phía học sinh (học sinh không thấy file và không có nút nộp bài).
- Lịch dạy (`/schedule`): hiển thị buổi 18:00 của lớp, OK.
- Chương trình (`/curriculum`): trang trống có hướng dẫn, OK.
- Tin nhắn (`/discussions`): hiển thị "Tính năng thảo luận tạm thời chưa khả dụng" (xem B-11).
- AI trợ lý (`/ai-chat`): gửi được tin nhắn nhưng trả lời sai (xem B-08). Không có lỗi console.
- Học phí: tạo hoá đơn 300.000đ cho học sinh QA Học Sinh Ba: OK, toast thành công (xem B-10, B-09).

### Bug mới đợt này

- **B-07 (đã đóng: đúng thiết kế)** — Học sinh không thấy file bài tập. Đường dẫn `/classes/[id]/sessions/[sessionId]` dùng chung `SessionDetailPage` (`app/(app)/classes/[id]/sessions/[sessionId]/page.tsx`) cho cả gia sư và học sinh. Học sinh nhận cùng layout gia sư, trong khi `components/sessions/student-session-detail.tsx` là giao diện học sinh riêng và có nhánh hiển thị bài tập. Nghi ngờ: học sinh không được vào đúng giao diện. Chưa xác minh được dữ liệu API trả về cho học sinh (không đọc được token, bị từ chối quyền).
- **B-08 — AI trợ lý không truy cập được dữ liệu của ứng dụng và trả lời sai** (`components/ai-chat/ai-chat.tsx`)
  - Hiện tượng: hỏi "Lịch dạy hôm nay của tôi có gì?" → trả lời không có quyền truy cập lịch, yêu cầu dán lịch, gợi ý đọc file trong `/tmp/tutor-agent-sandbox`. Trong khi lịch hôm nay có buổi 18:00.
  - Đề xuất: nối AI với dữ liệu lịch/lớp của người dùng, hoặc ghi rõ phạm vi và không gợi ý đường dẫn sandbox.
- **B-09 — Ô "Số tiền" hoá đơn bị điền sẵn khi chọn học sinh, không rõ nguồn** (`components/fees/create-tuition-dialog.tsx`)
  - Hiện tượng: sau khi chọn học sinh, ô số tiền đã có giá trị; nhập thêm `300000` tạo thành `300000300000`. Phải bôi đen rồi nhập lại mới đúng.
  - Đề xuất: điền gợi ý dạng placeholder hoặc nút "Dùng học phí lớp", không điền thẳng vào ô nhập.
- **B-10 — Thống kê học phí "Quá hạn" không khớp dữ liệu** (`components/fees/fees-page.tsx`)
  - Hiện tượng: sau khi tạo 1 hoá đơn chưa đóng và không có hạn đóng, thẻ hiển thị "Chưa thu 0,3tr · 1 học sinh", "Quá hạn 0,0tr · 2 học sinh". Số học sinh quá hạn (2) lớn hơn số hoá đơn (1).
  - Đề xuất: kiểm tra logic đếm quá hạn (hoá đơn không có hạn đóng không được tính quá hạn).
- **B-11 — Tính năng Thảo luận với phụ huynh đang tắt** (thông tin, không phải lỗi). Menu vẫn hiển thị "Tin nhắn", dễ gây nhầm.

### Chưa test
- Nộp bài và chấm điểm: vẫn bị chặn bởi B-07.
- Phụ huynh: chưa có tài khoản đăng nhập (cần đặt mật khẩu cho phụ huynh).

## 8. Luồng nộp bài & chấm điểm end-to-end (đã hoàn thành)

Học sinh M1E7LE (QA Học Sinh Ba), gia sư Trần QA Gia Sư, lớp W5FWYV, buổi "Buổi 1 - Bài tập QA".

| Bước | Kết quả |
|---|---|
| Admin/gia sư đặt mật khẩu học sinh, học sinh đăng nhập | OK |
| Gia sư tải bài tập lên buổi học | OK (file lưu trên server) |
| Học sinh xem trang nộp bài khi buổi "Sắp diễn ra" | Bài tập ẩn: "Bài tập sẽ hiển thị sau khi buổi học kết thúc" (đúng thiết kế, B-07 đóng) |
| Gia sư kết thúc buổi học | OK |
| Học sinh thấy bài tập, nộp `bai-tap-qa.txt` | OK, "Đã nộp — chờ chấm" |
| Gia sư xem bài nộp, chấm 8.0 + nhận xét "Trình bày tốt", lưu & trả bài | OK, "Đã chấm điểm 8" |
| Học sinh xem điểm ở Bài tập về nhà | OK, "Đã có điểm 8.0/10", Điểm TB 8 |

Ghi chú nhỏ: trang nộp bài của học sinh hiện "Điểm danh của tôi: Vắng mặt" dù học sinh chưa được điểm danh; trạng thái này do hệ thống tự gán khi buổi kết thúc. Nên kiểm tra xem đây có phải hành vi mong muốn không.


## 9. Đăng nhập phụ huynh (phụ huynh của QA Học Sinh Ba)

- Đăng nhập tab Phụ huynh bằng SĐT `0912000003` với mật khẩu được cung cấp: **thất bại** ("Dữ liệu không hợp lệ"). Tài khoản phụ huynh này chưa có mật khẩu được đặt (không có đường đặt mật khẩu cho phụ huynh, xem mục 8/B-12).
- Đăng nhập bằng email giả `leqa_ph_ba@no-email.local` với mật khẩu đã cung cấp: **thành công**. Lần đầu bắt buộc đổi mật khẩu (đã đổi sang mật khẩu test khác).
- Lớp `/classes`: hiển thị lớp QA Lớp Gia Sư Test, học sinh QA Học Sinh Ba: OK.
- `/grades` (Bài tập của con): hiển thị điểm 8.0, 1/1 bài đã nộp, nhưng có link "Xem học phí".
- `/fees` (Học phí): "Chức năng xem học phí của học sinh liên kết hiện chưa khả dụng." → mâu thuẫn với link "Xem học phí" ở `/grades`.
- Console: không có lỗi.

**B-12 — Phụ huynh không có đường để nhận mật khẩu**: admin không đặt được mật khẩu phụ huynh; email giả nên không dùng được quên mật khẩu. (Mục 2/B-12 là ghi chú mới.)
**B-13 — Trang Bài tập của con có link "Xem học phí" nhưng trang Học phí báo chưa khả dụng.**

## 10. Đợt test: curriculum, sửa lớp/buổi, hoá đơn, chấm lại, nộp lại, thông báo, admin

| Khu vực | Kết quả |
|---|---|
| Gia sư: tạo chương trình "Toán – Khối 9" (MAT-717) | OK |
| Gia sư: tạo chương, thêm bài học, sửa tên chương, xoá bài học | OK |
| Gia sư: sửa buổi học đã kết thúc | Các ô bị khoá (đúng quy tắc: buổi "Kết thúc") |
| Gia sư: đánh dấu hoá đơn "Đã đóng" (ngày đóng tự điền hôm nay) | OK; "Đã thu 0,3tr · 1/1", tỷ lệ thu 100% |
| Gia sư: sửa điểm 8 → 9 | OK, "Đã chấm điểm 9" |
| Gia sư: "Yêu cầu nộp lại" | OK, trạng thái "Cần nộp lại" |
| Học sinh: "Nộp lại bài" với 2 file | OK, "Đã nộp — chờ chấm", hiển thị 2 file |
| Học sinh: nộp file > 20 MB | **Không test được**: công cụ upload giới hạn 10.4 MB mỗi lần |
| Học sinh: xem học phí (`/fees`) | OK, hiển thị hoá đơn đã đóng 300.000đ |
| Học sinh/gia sư: thông báo | Mở thông báo là tự đánh dấu đã đọc, không có nút "Đánh dấu đã đọc" (xem B-18) |
| Admin: tạo gia sư tạm, sửa (SĐT, môn), đặt mật khẩu, xoá | OK (toast cho từng bước) |
| Phụ huynh: thông báo | Trống, OK |
| Phụ huynh: cài đặt | OK, hiển thị đủ họ tên/SĐT/email giả |
| Phụ huynh: chương trình của con | **Bug B-15**: hiển thị nút "Tạo chương trình" và thẻ tạo chương cho phụ huynh |
| Phụ huynh: học phí / nộp học phí | Bị chặn: trang báo chưa khả dụng (B-13) |

### Bug mới đợt này
- **B-15 — Phụ huynh thấy nút "Tạo chương trình" ở trang Chương trình của con** (`app/(app)/curriculum`, role guard). Phụ huynh chỉ nên xem, không tạo.
- **B-16 — Badge "Thông báo" hiện 8 trong khi trang chỉ có 6 thông báo** (gia sư/học sinh; sidebar vs. danh sách).
- **B-17 — Thông báo "Bài tập mới cần nộp" hiện "Chưa có hạn nộp" dù bài tập có hạn nộp** (20:00 24/11).
- **B-18 — Hướng dẫn trang Thông báo nói nhấn "Đánh dấu đã đọc" nhưng nút không tồn tại** (đã đọc khi mở).
- **B-19 — Gia sư vừa tạo hiện "Môn dạy: —" dù có thể chọn môn** (chỉ là dữ liệu, không bắt buộc; ghi nhận).

### Dữ liệu test thêm
- Chương trình "Toán – Khối 9" (MAT-717) còn trong DB, chương "Chương 1: Số hữu tỉ (đã sửa)" không còn bài.
- Hoá đơn 300.000đ của QA Học Sinh Ba đã đóng.
- Gia sư tạm đã xoá; mật khẩu đã đặt bị xoá cùng.


## 11. Đợt sửa lỗi (chưa commit)

Thay đổi FE (`ui`):
- `components/tutors/tutors-page.tsx`: cột Học sinh hiện "—" (B-02).
- `components/classes/dialog/create-session-dialog.tsx` + `components/classes/page/class-detail-page.tsx`: popup cảnh báo khi buổi lệch lịch lớp (B-05).
- `components/classes/page/session-detail-page.tsx`: nút "Thêm ô nhập tệp" bài tập chỉ bật khi buổi đã kết thúc, có dòng hướng dẫn (B-03).
- `components/classes/page/session-submissions-page.tsx`: không phải tutor thì nút là "Xem bài" (B-03).
- `components/classes/page/exercise-grade-page.tsx`: admin được mở trang bài ở chế độ chỉ đọc (B-03).
- `components/students/add-student-dialog.tsx`, `types/student.types.ts`, `lib/validation/student-form.schema.ts`, `lib/i18n/students.dictionary.ts`: ô "Email học sinh" bắt buộc (B-01, B-04).
- `components/students/edit-student-dialog.tsx`: không hiển thị email giả `@no-email.local` (B-01).
- `components/fees/tuitions-board.tsx`: thống kê quá hạn theo hạn đóng, đếm theo học sinh (B-10).

Thay đổi BE:
- `../gateway/src/packages/entities/student/student.schema.ts`: `email` bắt buộc khi tạo học sinh (B-04).
- `../tutor/src/features/exercise/exercise.repository.ts`: ADMIN được liệt kê mọi bài tập (B-03).

Kiểm tra:
- `tsc --noEmit` (FE): không còn lỗi, chỉ còn lỗi có sẵn ở `test/lib/axios/client.test.ts`.
- ESLint các file đã sửa: 0 lỗi.
- Trình duyệt (admin): danh sách bài nộp hiện bài của học sinh với nút "Xem bài"; trang xem bài chỉ đọc; form thêm học sinh có ô email bắt buộc.

Chưa kiểm tra trên trình duyệt (cần thao tác riêng): popup lệch lịch khi tạo buổi, nút thêm bài tập bị khoá khi buổi chưa kết thúc (cần tutor đăng nhập), gateway/BE chạy lại sau khi sửa schema email.

Ghi chú:
- Nhập tài liệu bài giảng vào phần bài tập ("Nhập cả bài") vẫn có thể thực hiện khi buổi chưa kết thúc; chưa đổi.
- Điểm số của bài "Đã nộp — chờ chấm" sau khi nộp lại vẫn hiện điểm cũ (9) trong danh sách admin; cần xem lại khi nộp lại (chưa xử lý).

## 12. Đợt sửa B-12 → B-19 (chưa commit)

- **B-12**: thêm trang `/parents` (admin) với danh sách phụ huynh, tìm kiếm và đặt mật khẩu. Chỉ admin truy cập được (`lib/rbac/route-access.ts`, mục menu admin). BE: `user/src/features/admin/*` (thêm role PARENT), gateway `admin.controller.ts`. Lưu ý: payload đặt mật khẩu chỉ gửi `{ password }`, `id` nằm trong URL (BE schema strict).
- **B-13**: bỏ link "Xem học phí" ở `components/practice/parent-portal-view.tsx`.
- **B-14**: kiểm tra lại, không phải lỗi.
- **B-15**: `/curriculum` chỉ cho TUTOR; bỏ "Chương trình của con" khỏi menu phụ huynh.
- **B-16**: `components/…/notifications` → `useNotificationCounts()` đếm từ server; danh sách làm mới 30s.
- **B-17**: hạn nộp trong thông báo lấy `endAt` làm dự phòng.
- **B-19**: bắt buộc chọn môn khi tạo gia sư (FE + gateway).

Chưa kiểm tra trên trình duyệt: B-05 (popup lệch lịch), B-03 phía tutor (nút khoá trước khi kết thúc), B-16 (badge sau khi làm mới), B-17 (nội dung thông báo mới). B-18 chưa xử lý (không nằm trong yêu cầu lần này). B-06 vẫn mở.

