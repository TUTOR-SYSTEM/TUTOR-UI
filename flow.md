# Flow Detail — Step-by-Step Feature Flows

Mỗi flow mô tả: **trigger → validation → API calls (thứ tự) → success/error → side effects**
Kèm specific error cases cho từng bước.

---

## 1. Auth Flows

### Login (User-Code)
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | userCode + role hợp lệ | Lưu accessToken + refreshToken → Redux → redirect `/` |
| ❌ Sai userCode | userCode không tồn tại | Inline "Mã người dùng không đúng" |
| ❌ Nhập email (tab student/parent) | user nhập email thay vì mã code | Inline "Vui lòng nhập mã code" |
| ❌ Mã code sai định dạng | mã code không đúng format yêu cầu | Inline "Mã code gồm 6 ký tự chữ và số" |
| ❌ Thiếu userCode | userCode rỗng | Inline "Mã người dùng không được để trống" |
| ❌ Thiếu role | role rỗng | Inline "Vai trò không được để trống" |
| ❌ Server 500 | BE lỗi | Toast "Có lỗi xảy ra, vui lòng thử lại" |
| ❌ Network error | Mất kết nối internet | Toast "Lỗi kết nối, vui lòng thử lại" |

### Login (Email)
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | email + password hợp lệ | Lưu accessToken + refreshToken → Redux → redirect `/` |
| ❌ Sai email | email không tồn tại | Inline "Email không tồn tại" |
| ❌ Sai password | password không đúng | Inline "Mật khẩu không đúng" |
| ❌ Thiếu email | email rỗng | Inline "Email không được để trống" |
| ❌ Thiếu password | password rỗng | Inline "Mật khẩu không được để trống" |
| ❌ Email sai định dạng | email không đúng format | Inline "Email không hợp lệ" |
| ❌ Server 500 | BE lỗi | Toast "Có lỗi xảy ra, vui lòng thử lại" |
| ❌ Network error | Mất kết nối internet | Toast "Lỗi kết nối, vui lòng thử lại" |

### Register
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | email + password + fullName hợp lệ | Toast "Đăng ký thành công!" + redirect `/login` |
| ❌ Email đã tồn tại | email đã được đăng ký | Inline "Email đã được sử dụng" |
| ❌ Password yếu | password < 6 ký tự | Inline "Mật khẩu phải có ít nhất 6 ký tự" |
| ❌ Confirm không khớp | confirmPassword ≠ password | Inline "Mật khẩu xác nhận không khớp" |
| ❌ Thiếu fullName | fullName rỗng | Inline "Họ tên không được để trống" |
| ❌ Email sai định dạng | email không hợp lệ | Inline "Email không hợp lệ" |
| ❌ Server 500 | BE lỗi | Toast "Có lỗi xảy ra, vui lòng thử lại" |
| ❌ Network error | Mất kết nối internet | Toast "Lỗi kết nối, vui lòng thử lại" |

### Forgot Password
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | email hợp lệ, tồn tại trong hệ thống | Redirect `/verify-otp?email=...` |
| ❌ Email không tồn tại | email chưa đăng ký | Toast "Email chưa được đăng ký" |
| ❌ Email rỗng | email trống | Inline "Email không được để trống" |
| ❌ Email sai định dạng | email không hợp lệ | Inline "Email không hợp lệ" |
| ❌ Server 500 | BE lỗi | Toast |
| ❌ Network error | Mất kết nối | Toast |

### Verify OTP
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | OTP đúng 6 số, chưa hết hạn | Redirect `/reset-password?token=...` |
| ❌ OTP sai | mã OTP không đúng | Inline "Mã OTP không đúng" |
| ❌ OTP hết hạn | OTP quá 5 phút | Inline "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới" |
| ❌ Quá số lần thử | nhập sai OTP > 5 lần | Redirect `/forgot-password` + toast "Bạn đã nhập sai quá nhiều lần" |
| ❌ Thiếu OTP | OTP chưa nhập đủ 6 số | Inline "Vui lòng nhập mã OTP" |
| ❌ Server 500 | BE lỗi | Toast |
| ❌ Network error | Mất kết nối | Toast |

### Reset Password
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | token hợp lệ + password mới OK | Toast "Đặt lại mật khẩu thành công!" + redirect `/login` |
| ❌ Token hết hạn | token đã hết hiệu lực | Redirect `/forgot-password` + toast |
| ❌ Token không hợp lệ | token sai | Redirect `/forgot-password` + toast |
| ❌ Password yếu | < 6 ký tự | Inline "Mật khẩu phải có ít nhất 6 ký tự" |
| ❌ Confirm không khớp | confirmPassword ≠ password | Inline "Mật khẩu xác nhận không khớp" |
| ❌ Thiếu password | password rỗng | Inline "Mật khẩu không được để trống" |
| ❌ Server 500 | BE lỗi | Toast |
| ❌ Network error | Mất kết nối | Toast |

### OAuth Callback
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | code + provider hợp lệ | Lưu tokens → redirect `/` |
| ❌ Code không hợp lệ | code sai hoặc hết hạn | Toast "Đăng nhập thất bại" + redirect `/login` |
| ❌ Provider từ chối | Google/Facebook trả lỗi | Toast "Đăng nhập bằng {provider} thất bại" + redirect `/login` |
| ❌ Thiếu code | query param code rỗng | redirect `/login` |
| ❌ Server 500 | BE xử lý callback lỗi | Toast + redirect `/login` |
| ❌ Network error | Mất kết nối | Toast + redirect `/login` |

## 2. Create Class Flow (Multi-Step Modal)

### Step 1 — Thông tin cơ bản
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Đủ điều kiện | className + subject + teachingType đã nhập | Gọi generate code → Chuyển Step 2 |
| ❌ Thiếu className | className rỗng | Inline "Tên lớp không được để trống" |
| ❌ Thiếu subject | subject rỗng | Inline "Môn học không được để trống" |
| ❌ Thiếu teachingType | chưa chọn 1-1/group | Inline "Vui lòng chọn hình thức dạy" |
| ❌ Generate code fail | `GET /classes/generate-code` lỗi | Toast "Không thể tạo mã lớp" + cho phép nhập tay |

### Step 2 — Hình thức & Chương trình
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Đủ điều kiện | format + curriculum đã chọn | Chuyển Step 3 |
| ❌ Thiếu format | chưa chọn ONLINE/OFFLINE | Inline "Vui lòng chọn hình thức học" |
| ❌ Thiếu curriculum | chưa chọn chương trình | Inline "Vui lòng chọn chương trình học" |
| ❌ Thiếu location | link (online) hoặc địa chỉ (offline) rỗng | Inline "Vui lòng nhập địa điểm" |
| ❌ Load curriculum fail | `GET /curriculum` lỗi | Toast + empty select |

### Step 3 — Lịch & Học phí
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Đủ điều kiện | date range + schedule + fee hợp lệ | Chuyển Step 4 |
| ❌ endDate < startDate | ngày kết thúc trước ngày bắt đầu | Inline "Ngày kết thúc phải sau ngày bắt đầu" |
| ❌ Thiếu startDate | chưa chọn ngày bắt đầu | Inline "Vui lòng chọn ngày bắt đầu" |
| ❌ Thiếu endDate | chưa chọn ngày kết thúc | Inline "Vui lòng chọn ngày kết thúc" |
| ❌ Time conflict | 2 slot lịch trùng giờ | Inline "Lịch học bị trùng, vui lòng điều chỉnh" |
| ❌ fee <= 0 | học phí <= 0 | Inline "Học phí phải lớn hơn 0" |
| ❌ Thiếu fee | fee rỗng | Inline "Vui lòng nhập học phí" |
| ❌ Thiếu paymentMethod | chưa chọn phương thức thanh toán | Inline "Vui lòng chọn phương thức thanh toán" |
| ❌ Thiếu schedule slot | chưa thêm khung giờ nào | Inline "Vui lòng thêm ít nhất một khung giờ học" |

### Step 4 — Chọn học sinh
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Đủ điều kiện | chọn student (nếu maxStudents > 0) | Gọi API chain |
| ❌ Vượt quá maxStudents | chọn > maxStudents | Inline "Chỉ được chọn tối đa {n} học sinh" |
| ❌ Load students fail | `GET /students` lỗi | Toast + empty list |

### API Chain
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ `POST /classes` OK | classId trả về | Tiếp tục call 2 |
| ❌ `POST /classes` fail | BE không tạo được class | Dừng chain, toast "Tạo lớp thất bại", rollback UI |
| ✅ `POST /classes/{id}/students` OK | students đã thêm | Tiếp tục call 3 |
| ❌ POST students fail | 409 (student đã trong lớp) | Dừng chain, toast partial, user tự thêm sau |
| ✅ `POST /schedules/bulk` OK | schedules đã tạo | Tiếp tục call 4 |
| ❌ POST schedules fail | 409 (conflict) | Dừng chain, toast partial, user edit thêm lịch |
| ✅ `POST /sessions/bulk` OK | sessions đã tạo | Hoàn tất |
| ❌ POST sessions fail | 409/400 | Toast partial, đã có class + students + schedules |
| ✅ **All complete** | 4 API đều OK | Toast "Tạo lớp học thành công!" + close modal + invalidate |

## 3. Edit/Delete Class

### Edit Class
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | PUT hợp lệ | Toast "Cập nhật lớp học thành công!" + close dialog + invalidate |
| ❌ Lớp không tồn tại | 404 | Toast "Lớp học không tồn tại" |
| ❌ Dữ liệu không hợp lệ | 400 | Toast + inline field errors |
| ❌ Server 500 | BE lỗi | Toast |
| ❌ Network error | Mất kết nối | Toast |

### Delete Class
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | DELETE hợp lệ | Toast "Xóa lớp học thành công!" + invalidate |
| ❌ Lớp không tồn tại | 404 | Toast "Lớp học không tồn tại" |
| ❌ Có ràng buộc | 409 (class có sessions/students) | Toast "Không thể xóa lớp học này" |
| ❌ Server 500 | BE lỗi | Toast |

## 4. Add Students to Class

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | studentIds hợp lệ | Toast "Thêm học sinh thành công!" + invalidate + close |
| ❌ Student đã trong lớp | 409 | Toast "Học sinh đã có trong lớp" |
| ❌ Chưa chọn student | studentIds rỗng | Inline "Vui lòng chọn ít nhất một học sinh" |
| ❌ Lớp không tồn tại | 404 | Toast |
| ❌ Load list fail | `GET /students` lỗi | Toast + empty state |
| ❌ Server/Network | lỗi | Toast |

## 5. Session Flows

### Create Session
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | all fields hợp lệ | Toast "Tạo buổi học thành công!" + invalidate + close |
| ❌ sessionNumber < 1 | số thứ tự buổi < 1 | Inline "Số thứ tự buổi phải >= 1" |
| ❌ end <= start | giờ kết thúc <= giờ bắt đầu | Inline "Giờ kết thúc phải sau giờ bắt đầu" |
| ❌ Thiếu title | title rỗng | Inline |
| ❌ Thiếu date | chưa chọn ngày | Inline |
| ❌ Trùng sessionNumber | 409 | Toast + đề xuất số tiếp theo |
| ❌ Server/Network | lỗi | Toast |

### Edit Session
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | PUT hợp lệ | Toast + invalidate |
| ❌ Không tồn tại | 404 | Toast "Buổi học không tồn tại" |
| ❌ Conflict | 409 (trùng số thứ tự) | Toast |

### Delete Session
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Xác nhận xóa | user confirm | Gọi DELETE |
| ❌ Hủy xóa | user cancel | Đóng dialog |
| ✅ Xóa thành công | DELETE 200 | Toast + invalidate |
| ❌ Không tồn tại | 404 | Toast |
| ❌ Có ràng buộc | 409 | Toast |

### Change Session Status
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Transition hợp lệ | SCHEDULED → ONGOING → COMPLETED | Toast + invalidate |
| ❌ Transition không hợp lệ | SKIP (VD SCHEDULED → COMPLETED) | 400 + Toast "Không thể chuyển trạng thái" |
| ❌ Không tồn tại | 404 | Toast |

## 6. Student CRUD

### Add Student
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | all fields hợp lệ | Toast "Thêm học sinh thành công!" + invalidate + close |
| ❌ Email duplicate | 409 | Inline "Email đã được sử dụng" |
| ❌ Phone duplicate | 409 | Inline "Số điện thoại đã được sử dụng" |
| ❌ Thiếu required | fullName/dob/gender rỗng | Inline từng field |
| ❌ Email sai format | email không hợp lệ | Inline |
| ❌ Server/Network | lỗi | Toast |

### Edit Student
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Thành công | PUT hợp lệ | Toast + invalidate |
| ❌ Không tồn tại | 404 | Toast "Học sinh không tồn tại" |
| ❌ Duplicate | 409 (email/phone) | Inline |

### Delete Student
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Xác nhận | user confirm | Gọi DELETE |
| ❌ Hủy | user cancel | Đóng dialog |
| ✅ Xóa thành công | DELETE 200 | Toast "Xóa học sinh thành công!" + invalidate |
| ❌ Có ràng buộc | 409 (có lớp/lịch sử) | Toast "Không thể xóa học sinh này" |

## 7. Curriculum Flows

### Curriculum
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Create OK | code + name + subject OK | Toast + invalidate + close |
| ❌ Code duplicate | 409 | Inline "Mã chương trình đã tồn tại" |
| ❌ Thiếu required | name/subject rỗng | Inline |
| ✅ Edit OK | PUT hợp lệ | Toast + invalidate |
| ❌ Edit 404 | không tồn tại | Toast |
| ✅ Delete OK | DELETE 200 | Toast + invalidate |
| ❌ Delete 409 | có chapter con | Toast "Không thể xóa chương trình này" |

### Chapter
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Create OK | title OK | Toast + refetch tree |
| ❌ Thiếu title | title rỗng | Inline |
| ✅ Delete OK | DELETE 200 | Toast + refetch |
| ❌ Delete 409 | có lesson con | Toast |

### Lesson
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Create OK | title + description OK | Toast + refetch |
| ❌ Title duplicate | 409 trong cùng chapter | Inline "Tên bài đã tồn tại trong chương" |
| ✅ Delete OK | DELETE 200 | Toast + refetch |
| ❌ Delete 409 | có ràng buộc | Toast |

### Upload/Remove Material
| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Upload OK | file hợp lệ, <= 10MB | Toast + refetch files |
| ❌ File > 10MB | quá lớn | Client reject + toast "File không được vượt quá 10MB" |
| ❌ Sai định dạng | không phải PDF/doc/image | BE reject + toast |
| ❌ Server/Network | lỗi | Toast |
| ✅ Remove OK | DELETE 200 | Toast + refetch |
| ❌ Remove 404 | file ko tồn tại | Toast |

## 8. Tuition Flows

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Create OK | classId + studentId + amount > 0 | Toast + invalidate |
| ❌ amount <= 0 | số tiền <= 0 | Inline "Số tiền phải lớn hơn 0" |
| ❌ dueDate quá khứ | ngày đến hạn < hôm nay | Warning "Ngày đến hạn trong quá khứ" |
| ❌ Thiếu classId | chưa chọn lớp | Inline |
| ❌ Thiếu studentId | chưa chọn học sinh | Inline |
| ✅ Edit OK | PUT hợp lệ | Toast + invalidate |
| ❌ Edit 404/400 | lỗi | Toast |
| ✅ Delete OK | DELETE 200 | Toast + invalidate |
| ❌ Delete 409 | đã thanh toán | Toast "Không thể xóa hóa đơn đã thanh toán" |

## 9. Schedule Flows

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Create OK | dayOfWeek + time OK | Toast + invalidate |
| ❌ Time conflict | trùng schedule khác | 409 + inline "Lịch học bị trùng" |
| ✅ Bulk OK | schedules array hợp lệ | Toast + invalidate |
| ❌ Bulk conflict | 1+ entry bị trùng | 409 + toast + list conflict entries |
| ✅ Edit OK | PATCH hợp lệ | Toast + invalidate |
| ❌ Edit conflict | trùng thời gian | 409 + inline |
| ✅ Delete OK | DELETE 200 | Toast + invalidate |
| ❌ Delete 404 | không tồn tại | Toast |

## 10. Exercise Flows

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Create OK | content + file OK | Toast + invalidate |
| ❌ File > 20MB | quá lớn | Client reject + toast |
| ✅ Submit OK | PATCH hợp lệ | Toast + invalidate |
| ❌ Quá số lần nộp | đã nộp > 3 lần | 400 + toast "Bạn đã nộp bài quá số lần cho phép" |
| ✅ Grade OK | score 0-10 | Toast + invalidate |
| ❌ Score < 0 hoặc > 10 | điểm ngoài phạm vi | Inline "Điểm phải từ 0 đến 10" |

## 11. User Management (Admin)

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Create OK | email + password OK | Toast + invalidate |
| ❌ Email duplicate | 409 | Inline "Email đã được sử dụng" |
| ❌ Password yếu | < 6 ký tự | Inline |
| ❌ Thiếu required | email/fullName rỗng | Inline |
| ✅ Edit OK | PUT hợp lệ | Toast + invalidate |
| ❌ Edit 404 | không tồn tại | Toast |
| ✅ Toggle status OK | PUT status 200 | Toast + invalidate |
| ❌ Toggle 404 | không tồn tại | Toast |
| ✅ Delete OK | DELETE 200 | Toast + invalidate |
| ❌ Delete self | tự xóa chính mình | 409 + toast "Không thể tự xóa tài khoản" |
| ❌ Delete 409 | có lớp/dữ liệu | Toast |
| ✅ Change password OK | old + new OK | Toast "Đổi mật khẩu thành công!" |
| ❌ Old password sai | 400 | Inline "Mật khẩu cũ không đúng" |
| ❌ New password yếu | < 6 ký tự | Inline |

## 12. Tutor Management (Admin)

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Create OK | email + fields OK | Toast + invalidate |
| ❌ Email duplicate | 409 | Inline |
| ❌ Thiếu required | email/firstName/lastName rỗng | Inline |
| ✅ Edit OK | PUT hợp lệ | Toast + invalidate |
| ❌ Edit 404 | không tồn tại | Toast |
| ✅ Delete OK | DELETE 200 | Toast + invalidate |
| ❌ Delete 409 | có lớp đang dạy | Toast "Không thể xóa gia sư này" |

## 13. Notification Flows

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Fetch OK | API trả list | Render list + pagination |
| ❌ Fetch fail | network/500 | Empty state + toast "Không thể tải thông báo" |
| ✅ Mark read OK | PATCH 200 | Update local read state |
| ❌ Mark read 404 | thông báo ko tồn tại | Toast |
| ✅ Mark all OK | PATCH 200 | Refetch list |
| ❌ Mark all fail | network | Toast |
| ✅ Delete OK | DELETE 200 | Refetch list |
| ❌ Delete 404 | không tồn tại | Toast |

## 14. AI Chat

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Send OK | POST 200 | Append reply to chat |
| ❌ Send fail | network/500 | Revert optimistic message + toast |
| ✅ Load history OK | GET 200 + có data | Render messages |
| ❌ Load empty | không có history | Empty state "Chưa có tin nhắn" |
| ❌ Load fail | network/500 | Toast |
| ✅ Clear OK | DELETE 200 | Clear local messages |
| ❌ Clear fail | network | Toast |

## 15. Settings

| Case | Điều kiện | Hành vi |
|------|-----------|---------|
| ✅ Update profile OK | PUT 200 | Toast "Cập nhật thông tin thành công!" |
| ❌ Email/phone duplicate | 409 | Inline |
| ❌ Email sai format | email không hợp lệ | Inline |
| ✅ Upload avatar OK | POST 200 | Cập nhật avatar URL trong UI |
| ❌ File > 5MB | quá lớn | Client reject + toast |
| ❌ Sai format | không phải ảnh | BE reject + toast |
| ✅ Change theme | local storage | Lưu preference + áp dụng ngay |

---

## Summary: API Call Chains


| Feature                     | Sequential API Calls                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Create Class                | `POST /classes` → `POST /classes/{id}/students` → `POST /schedules/bulk` → `POST /sessions/bulk` |
| Add Students to Class       | `POST /classes/{id}/students`                                                                    |
| Create Session              | `POST /sessions`                                                                                 |
| Bulk Create Sessions        | `POST /sessions/bulk`                                                                            |
| Create Curriculum           | `POST /curriculum`                                                                               |
| Create Chapter              | `POST /chapters/{curriculumId}`                                                                   |
| Create Lesson               | `POST /lesson?curriculumId=&chapterId=`                                                          |
| Upload Lesson Material      | `PUT /lesson/{id}/add-theory` hoặc `PUT /lesson/{id}/exercises`                                  |
| Create Tuition              | `POST /tuitions`                                                                                 |
| Create Schedule             | `POST /schedules` hoặc `POST /schedules/bulk`                                                    |
| Submit Exercise             | `POST /exercises` → `PATCH /exercises/{id}/submit`                                               |
| Grade Exercise              | `PATCH /exercises/{id}/grade`                                                                    |
| Create User                 | `POST /users`                                                                                    |
| Create Tutor                | `POST /admin/tutors`                                                                             |
| Mark All Notifications Read | `PATCH /notifications/read-all`                                                                  |
