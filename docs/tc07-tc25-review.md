# Rà soát TC07–TC25 — 21/10/2026

Nguồn: bảng Google Sheets “Test Đường Sách”, trang “Trang Lỗi”. Các sửa đổi nằm trong mã nguồn local; chưa deploy, chưa cập nhật trạng thái trên Google Sheets và chưa thay đổi database đang chạy.

| TC | Kết quả rà soát và sửa |
|---|---|
| 07 | Số di động 11 chữ số bị chặn trước khi gửi; lỗi đỏ ngay tại ô số điện thoại; giữ nguyên dữ liệu form. Tên người liên hệ sai cũng có lỗi riêng. |
| 08 | Ảnh bài viết không tải được chuyển sang ảnh dự phòng nội bộ. Chưa phục hồi được ảnh gốc của bài “Ra mắt không gian thư viện số”. |
| 09 | Tách cột số hạng và bìa sách; hạng 10 không bị ảnh che trên desktop/mobile. |
| 10 | Nội dung tổ chức đã có bản dịch tiếng Anh cho dữ liệu hiện có; tên riêng giữ nguyên; hỗ trợ trường En để nội dung quản trị có thể cung cấp bản dịch riêng. |
| 11 | Áp dụng bản dịch cho hero, câu chuyện, tầm nhìn/sứ mệnh, cột mốc, thành tựu và đối tác của trang hành trình. |
| 12 | Đề xuất chưa duyệt/bị từ chối không trả người đăng ký và có số lượng 0. Đề xuất thông thường chỉ lấy người đăng ký hoạt động của nó, không lấy người đăng ký chung của sự kiện cha. |
| 13 | Bìa sách trang chủ sử dụng titleEn và nhãn tiếng Anh khi chọn EN. Các tiêu đề phần trang chủ vốn đã có nhánh ngôn ngữ. |
| 14 | Danh sách/xếp hạng sách admin có ảnh dự phòng nội bộ khi URL gốc lỗi. Chưa phục hồi ảnh gốc của hai đầu sách được nêu. |
| 15 | Bắt buộc đối tượng tham gia khi tạo đề xuất/sự kiện đối tác; chặn chuỗi trống hoặc chỉ có khoảng trắng ở backend; chỉnh sửa có required; bản ghi cũ thiếu thông tin hiển thị “Chưa cập nhật…”. |
| 16 | Bỏ icon Sparkles ở phần duyệt hoạt động; thay icon Sparkles của mục hoạt động trong sidebar; bỏ emoji rải rác ở chi tiết hoạt động đối tác. |
| 17 | URL ảnh trong form sách admin/đối tác có liên kết mở thẻ mới; ô URL vẫn cho chọn và sao chép. |
| 18 | Form chỉnh sửa sách admin/đối tác không tự đóng khi nhả chuột trên nền. Đóng bằng nút đóng/hủy hoặc Escape. |
| 19 | Sửa dữ liệu soldQuantity=null bị chuyển thành chuỗi “null”, làm validation số lượng thất bại. Chuẩn hóa metadata null để chỉnh tồn kho không vô tình gửi duyệt nội dung; gửi một PATCH chứa đúng số lượng đã thay đổi. |
| 20 | Dùng ngày Việt Nam ở lịch đối tác; lịch tự cập nhật giới hạn sau nửa đêm; backend chặn ngày đã qua khi đối tác đăng ký sự kiện. |
| 21 | Yêu cầu APPROVED không còn trong hàng đợi gửi duyệt và bộ lọc; sách đã duyệt nằm ở danh sách sách gian hàng. |
| 22 | Bỏ nút đăng xuất lặp ở sidebar admin/đối tác. Nút “Chi tiết” mở trang sự kiện còn nút sửa mở form riêng trong mã hiện tại; giữ cả hai, đổi nhãn “Sửa thông tin” để rõ chức năng. |
| 23 | Bỏ số 3 viết cố định ở trang quản trị, tính số trụ cột theo chính mảng principles như trang công khai. |
| 24 | Login/reset mật khẩu cùng tối thiểu 8 ký tự; reset dùng chính sách hệ thống; cấu hình cũ không thể hạ tối thiểu dưới 8. Seed demo chuyển sang Demo2026!. Có script nâng cấp hai tài khoản demo vẫn dùng 123456 khi bootstrap. |
| 25 | Đăng nhập trả về timestamp vừa lưu; API hồ sơ trả lastActiveAt; đối tác hiển thị thời gian thật thay cho “Hôm nay, 08:30”; admin/đối tác định dạng múi giờ Việt Nam. |

## Kiểm chứng

- Frontend production build: đạt.
- Backend: 87 ca đạt, 1 ca vốn được đánh dấu skip; chạy các file tests/*.test.js. Các ca dùng Prisma giả lập kiểm chứng logic/API, không thay thế integration với PostgreSQL thật.
- Playwright: 24 ca đạt trên desktop Chromium và mobile Chromium (14 ca hồi quy mới và 10 ca lịch/đăng ký sự kiện hiện có). Kiểm tra phone, rank 10, EN, governance count, fallback ảnh, form không đóng khi click nền, PATCH tồn kho, hàng đợi duyệt và chuyển ngày lúc nửa đêm. API được giả lập trong các fixture trình duyệt.
- Lint: exit 0, repository vẫn có cảnh báo.
- git diff --check: đạt.

## Hành vi API thay đổi

- POST /auth/login: password ít nhất 8 ký tự; dữ liệu user có lastActiveAt mới nhất.
- POST /auth/reset-password: ít nhất 8 ký tự, tối đa 72 byte và theo chính sách hệ thống.
- POST /partner/event-registrations: bắt buộc targetAudience 1–2000 ký tự sau trim; không nhận ngày bắt đầu trước ngày Việt Nam hiện tại.
- POST /partner/activity-proposals: bắt buộc targetAudience; PATCH chặn giá trị rỗng nếu có gửi trường này.
- GET /partner/activity-proposals/:id/participants: trả [] cho đề xuất chưa được duyệt hoặc bị từ chối; không trộn đăng ký của sự kiện cha cho đề xuất thông thường.

## Giới hạn và áp dụng

- Chưa chạy integration với database thật hoặc kiểm tra bản website đã deploy. Cần deploy cả FE/BE để người dùng thấy thay đổi.
- TC08/14 được xử lý bằng ảnh dự phòng; muốn khôi phục đúng ảnh gốc cần URL/tệp ảnh gốc hoạt động.
- Bản dịch đi kèm bao phủ nội dung có trong snapshot dự án; nội dung CMS mới/có chỉnh sửa cần bản dịch En tương ứng, không có dịch máy tự động.
- Database hiện hữu: bootstrap chạy scripts/upgradeDemoPasswords.js, chỉ nâng cấp USR-ADMIN-01/USR-PARTNER-01 nếu hash còn khớp mật khẩu demo 123456; không sửa mật khẩu tùy chỉnh. Mật khẩu demo mặc định mới là Demo2026! (hoặc DEMO_PASSWORD nếu được cấu hình). Script chưa được chạy trên database trong lượt này. Những tài khoản cũ khác có mật khẩu dưới 8 ký tự cần đặt lại mật khẩu.
