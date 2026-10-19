# Admin đổi trực tiếp mật khẩu tài khoản

`POST /api/admin/users/{id}/password` yêu cầu Bearer token của admin và UUID tài khoản còn tồn tại.

Body JSON: `{ "newPassword": "..." }`. Mật khẩu phải có ít nhất 8 ký tự, tối đa 72 byte UTF-8 và đáp ứng chính sách bảo mật hệ thống. Không yêu cầu mật khẩu cũ của tài khoản.

Thành công: HTTP 200, `data: { "success": true }`. Lưu bcrypt hash, cập nhật `passwordChangedAt`, vô hiệu hóa token đặt lại chưa dùng, thu hồi refresh token và ghi audit không chứa mật khẩu. Các thao tác nằm trong một transaction.

Lỗi: 401 chưa đăng nhập, 403 không phải admin, 404 tài khoản không tồn tại/đã xóa, 422 dữ liệu hoặc mật khẩu không hợp lệ. Endpoint reset-password cũ vẫn phục vụ luồng tạo liên kết; giao diện quản lý tài khoản dùng endpoint password mới.
