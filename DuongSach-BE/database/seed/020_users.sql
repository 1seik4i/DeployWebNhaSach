-- 020_users.sql
-- Nạp toàn bộ Users hệ thống với mật khẩu 'Demo2026!' và gán user_roles (Admin & Partner)

INSERT INTO users (id, code, full_name, email, phone, password_hash, primary_role, status, total_points) VALUES
  ('518a7ba0-302a-4463-a113-f0ca5eb94dd7', 'USR-USER-01', 'Nguyễn Văn A', 'nguyenvana@gmail.com', '0909876543', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'active'::account_status, 60),
  ('782f71b1-5350-491a-aaa9-16d54998964f', 'U002', 'Trần Thị B', 'tranthib@gmail.com', '0988 234 567', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'active'::account_status, 100),
  ('33c2a21d-4a71-4820-a171-97df600f78ce', 'U003', 'Lê Minh C', 'leminhc@gmail.com', '0903 456 789', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'admin'::user_role, 'active'::account_status, 100),
  ('7b927425-34c8-480f-ae43-c5b44e602026', 'U004', 'Phạm Thu D', 'phamthud@gmail.com', '0934 567 890', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'locked'::account_status, 100),
  ('1d646476-a477-4895-ab3b-319e24ce7115', 'U005', 'Hoàng Anh E', 'hoanganhe@gmail.com', '0977 889 900', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'active'::account_status, 100),
  ('28b86971-83f1-47de-a8dc-7bf083bfffe8', 'U006', 'Nguyễn Thành F', 'thanhf.nguyen@gmail.com', '0918 112 233', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'admin'::user_role, 'active'::account_status, 100),
  ('b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac', 'U007', 'Đỗ Thị G', 'dothig@gmail.com', '0945 667 788', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'active'::account_status, 100),
  ('e5396e24-6c7b-45c1-a24e-ef63aad57c0f', 'U008', 'Trần Văn H', 'tranvanh@gmail.com', '0966 334 455', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'active'::account_status, 100),
  ('ac24ce99-3fd9-47f7-a852-09262fe07c7b', 'U009', 'Lê Ngọc I', 'lengoci@gmail.com', '0919 778 899', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'active'::account_status, 100),
  ('7d1be1fc-f868-4402-a1b9-dc90260860dc', 'U010', 'Phan K J', 'phankj@gmail.com', '0908 990 011', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'admin'::user_role, 'active'::account_status, 100),
  ('b9d37b50-942d-430a-a45f-0e303739b400', 'USR-ADMIN-01', 'Quản Trị Viên Hệ Thống', 'admin@duongsach.example.vn', '0901234567', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'admin'::user_role, 'active'::account_status, 500),
  ('87427bb9-732b-44b3-aed9-18938ae98fe9', 'USR-ORG-01', 'Ban Quản Lý Đường Sách', 'bql@duongsach.example.vn', '0902345678', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'admin'::user_role, 'active'::account_status, 300),
  ('bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', 'USR-PARTNER-01', 'Đại diện NXB Trẻ', 'nxbtre@partner.duongsach.vn', '0903456789', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'active'::account_status, 150),
  ('a1997704-8ccd-4838-ab09-31be558bf632', 'USR-PARTNER-02', 'Đại diện Nhà Sách Bình Minh', 'binhminh@books.com', '0909123456', '$2b$10$ldV6KyqaJyZzxHSmhGG2SeBo00nJvk1UA.EkZLsJMstPFjQXwcyzK', 'partner'::user_role, 'active'::account_status, 120)
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, primary_role = EXCLUDED.primary_role, status = EXCLUDED.status;

-- Gán User Roles
INSERT INTO user_roles (user_id, role_id)
SELECT '518a7ba0-302a-4463-a113-f0ca5eb94dd7', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '782f71b1-5350-491a-aaa9-16d54998964f', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '33c2a21d-4a71-4820-a171-97df600f78ce', id FROM roles WHERE code = 'admin'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '7b927425-34c8-480f-ae43-c5b44e602026', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '1d646476-a477-4895-ab3b-319e24ce7115', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '28b86971-83f1-47de-a8dc-7bf083bfffe8', id FROM roles WHERE code = 'admin'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 'b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 'e5396e24-6c7b-45c1-a24e-ef63aad57c0f', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 'ac24ce99-3fd9-47f7-a852-09262fe07c7b', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '7d1be1fc-f868-4402-a1b9-dc90260860dc', id FROM roles WHERE code = 'admin'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 'b9d37b50-942d-430a-a45f-0e303739b400', id FROM roles WHERE code = 'admin'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '87427bb9-732b-44b3-aed9-18938ae98fe9', id FROM roles WHERE code = 'admin'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 'bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 'a1997704-8ccd-4838-ab09-31be558bf632', id FROM roles WHERE code = 'partner'
ON CONFLICT DO NOTHING;
