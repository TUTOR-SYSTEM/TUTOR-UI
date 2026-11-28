# Báo cáo bug: ui (FE Gia Sư Pro + API)

Cập nhật: 2026-11-28, theo báo cáo test E2E 2026-11-24.
Trạng thái: **Đã fix** = đã sửa (chưa commit); **Fix một phần** = còn việc; **Chưa xong** = chưa sửa; **Đóng** = không phải lỗi hoặc đúng thiết kế; **Ghi nhận** = thông tin.

| ID | Mức độ | Vấn đề | Trạng thái | Còn cần làm |
|---|---|---|---|---|
| B-08 | Cao | Trợ lý AI không truy cập dữ liệu ứng dụng, trả lời sai, gợi ý đường dẫn sandbox | Chưa xong | Tạm đóng theo yêu cầu. Cần nối AI với dữ liệu lịch và lớp, hoặc ghi rõ phạm vi. |
| B-06 | Thấp | Tab Học sinh không nhận SĐT; nhãn ô dễ nhầm | Chưa xong | Làm rõ nhãn hoặc hỗ trợ SĐT. |
| B-09 | Thấp | Ô "Số tiền" hoá đơn tự điền khi chọn học sinh, nhập thêm thành số lạ | Chưa xong | Tạm đóng theo yêu cầu. Đổi thành placeholder hoặc nút "Dùng học phí lớp". |
| B-18 | Thấp | Hướng dẫn nhắc nút "Đánh dấu đã đọc" nhưng nút không có | Chưa xong | Sửa hướng dẫn hoặc thêm nút. |
| B-03 | Cao | Admin không chấm được bài lớp của gia sư khác; buổi kết thúc chưa khoá đúng | Fix một phần | Admin đã xem ở chế độ chỉ đọc. Chưa kiểm tra phía tutor: nút thêm bài tập bị khoá khi buổi chưa kết thúc. Cần quyết định sản phẩm về việc admin chấm bài lớp khác. |
| B-05 | Trung bình | Buổi học tạo thủ công lệch lịch cố định của lớp, không cảnh báo | Fix một phần | Đã thêm popup cảnh báo. Chưa kiểm tra popup trên trình duyệt. |
| B-16 | Thấp | Badge "Thông báo" hiện 8, trang chỉ có 6 | Fix một phần | Chưa kiểm tra badge sau khi làm mới. |
| B-17 | Thấp | Thông báo "Bài tập mới cần nộp" hiện "Chưa có hạn nộp" | Fix một phần | Sửa ở BE tutor (dùng `endAt` làm dự phòng). Chưa kiểm tra nội dung thông báo mới. |
| B-12 | Cao | Admin không đặt được mật khẩu phụ huynh | Đã fix | Đã kiểm tra: admin đặt mật khẩu, phụ huynh đăng nhập được. |
| B-15 | Cao | Phụ huynh thấy nút "Tạo chương trình" | Đã fix | Đã kiểm tra: phụ huynh vào `/curriculum` bị chuyển về trang chủ. |
| B-01 | Trung bình | Email giả `@no-email.local` hiện ở form Sửa học sinh | Đã fix | Chưa kiểm tra lại trên trình duyệt sau khi sửa BE trả về email. |
| B-04 | Trung bình | Học sinh tạo không có email nên không nhận mật khẩu ngẫu nhiên | Đã fix | Email học sinh đã bắt buộc (FE và gateway). |
| B-10 | Trung bình | Thẻ "Quá hạn" đếm không khớp dữ liệu | Đã fix | Chưa kiểm tra lại trên trình duyệt. |
| B-13 | Trung bình | Trang bài tập của con có link "Xem học phí" nhưng trang học phí báo chưa khả dụng | Đã fix | - |
| U-01 | Trung bình | Form tạo học sinh không có SĐT/email phụ huynh; phụ huynh mới phải có một trong hai | Đã fix | - |
| U-02 | Trung bình | Tên học sinh hiển thị sai thứ tự ở nhiều màn hình | Đã fix | Đã kiểm tra điểm danh. |
| B-02 | Thấp | Cột "Học sinh" của gia sư mới hiện "0" thay vì "—" | Đã fix | - |
| B-19 | Thấp | Gia sư tạo không chọn môn, hiện "Môn dạy: —" | Đã fix | Bắt buộc chọn ít nhất một môn (FE và gateway). |
| U-04 | Thấp | "_ _ _ _" ở tiêu đề buổi học khi chưa có chương | Đã fix | - |
| U-05 | Thấp | "- - - -" dưới tên buổi học | Đã fix | Cùng nguyên nhân với U-04. |
| U-03 | Thấp | Tên phụ huynh "Nguyễn QA Phụ Huynh" | Đóng | Hiển thị đúng thứ tự Họ Tên, chờ xác nhận kỳ vọng. |
| B-07 | — | File bài tập không hiện cho học sinh khi buổi "Sắp diễn ra" | Đóng | Đúng thiết kế: bài tập chỉ hiện sau khi buổi kết thúc. |
| B-14 | — | Cài đặt phụ huynh trống | Đóng | Đã kiểm tra lại: hồ sơ hiển thị đủ, không phải lỗi. |
| B-11 | — | Thảo luận với phụ huynh đang tắt, menu vẫn hiện "Tin nhắn" | Ghi nhận | - |

Ghi chú: `tsc --noEmit` còn một lỗi có sẵn ở `test/lib/axios/client.test.ts`, không do thay đổi này.
