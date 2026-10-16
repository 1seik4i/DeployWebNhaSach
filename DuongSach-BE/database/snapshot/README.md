# Seed snapshot

`current.sql` là snapshot schema và dữ liệu nghiệp vụ từ PostgreSQL Docker nguồn.
Tài khoản giữ email, vai trò, trạng thái; tất cả password hash được thay bằng
hash của mật khẩu test `123456`. Hai bảng `refresh_tokens` và `password_resets`
không có dữ liệu. Database nguồn không bị thay đổi.

Docker nạp file này tự động khi volume mới được tạo; volume đang có dữ liệu không
bị ghi đè. Chạy `npm run seed:export` trong thư mục backend để cập nhật snapshot,
rồi commit file SQL vào repo. Không dùng snapshot này làm dữ liệu production.
