-- Mỗi gian hàng thư viện số chỉ được gắn với một tài khoản đăng nhập.
CREATE UNIQUE INDEX IF NOT EXISTS "user_stall_assignments_stall_id_key"
ON "user_stall_assignments"("stall_id");
