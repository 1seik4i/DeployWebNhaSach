# Giới hạn gửi biểu mẫu khách vãng lai

Mỗi phiên trình duyệt được gửi thành công tối đa **3 góp ý** và **3 đề xuất sự kiện**. Hai bộ đếm độc lập. Lỗi validation, lỗi mạng trước khi lưu và lỗi transaction không tính lượt. Nếu server đã lưu nhưng phản hồi bị mất do mạng, lượt đó vẫn được tính; giao diện đồng bộ lại khi tải trang/lấy lại focus.

Frontend lưu UUID phiên trong sessionStorage, dùng lại sau khi tải lại hoặc chuyển trang trong cùng tab. Phiên dùng sessionStorage mới có UUID mới; tab nhân bản có thể chia sẻ UUID được sao chép từ tab gốc. Đây là giới hạn theo phiên, không phải giới hạn theo người dùng hay IP. Các client cũ không có header dùng cookie phiên HttpOnly. Khi cookie/sessionStorage bị xóa sẽ là phiên mới.

Backend lưu bộ đếm trong bảng guest_submission_sessions. Không reset theo phút, không mất lượt khi ứng dụng khởi động lại hoặc chạy nhiều instance. Cập nhật có điều kiện và lưu biểu mẫu cùng transaction; PostgreSQL khóa hàng và kiểm tra count<3, tránh vượt lượt khi gửi đồng thời. Xóa/phân loại góp ý không khôi phục lượt của phiên.

## API

- Header X-Guest-Session: UUID phiên; không đổi payload biểu mẫu.
- GET /api/public/submission-quota: data.feedback và data.eventProposal, mỗi mục có {limit:3,used,remaining}.
- POST /api/public/feedbacks và POST /api/public/event-suggestions: giữ response cũ, bổ sung data.submissionQuota.
- Lần thứ tư: HTTP 429, error.code=GUEST_SUBMISSION_LIMIT, thông báo đúng giới hạn thay vì lỗi mạng.
- Rate limiter ngắn hạn hiện có vẫn áp dụng riêng.

## Triển khai

Cần tạo bảng mới trước khi chạy backend đã sửa: npm --prefix DuongSach-BE run migrate:deploy (hoặc quy trình db:push hiện tại của Render), và generate Prisma Client. Migration: DuongSach-BE/prisma/migrations/20261021000000_guest_submission_limits/migration.sql. Chưa áp dụng migration lên database đang chạy trong lượt sửa này.

## Kiểm chứng

- Backend: 93 ca đạt, 1 skip có sẵn, gồm 6 ca mới kiểm tra giới hạn, hai bộ đếm độc lập, phiên độc lập, rollback, cookie, header và gửi đồng thời. Các ca HTTP dùng database giả lập có khóa transaction; chưa chạy integration trên PostgreSQL thật.
- Frontend: 20 ca Chromium desktop/mobile đạt, gồm 6 ca giới hạn/validation liên hệ và 14 ca hồi quy TC07–TC25. Kiểm tra hai form, quota sau reload, chặn lần thứ tư, lỗi 429 đúng thông báo. Production build đạt; git diff --check đạt.
- Prisma schema validate đạt; sinh client vào thư mục kiểm tra riêng đạt. Client mặc định đang bị Windows khóa DLL bởi tiến trình đang dùng nên cần generate lại khi khởi động/deploy sau khi tiến trình đó dừng.
- Có thêm tests/integration/guest-submission-limit.test.js để kiểm chứng concurrency/rollback bằng PostgreSQL sau migration.
