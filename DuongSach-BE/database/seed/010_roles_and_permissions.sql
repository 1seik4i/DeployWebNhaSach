-- 010_roles_and_permissions.sql
-- Nạp Roles (Admin & Partner), Permissions và Role-Permissions

INSERT INTO roles (id, code, name, description) VALUES
  ('584bddf2-6fe2-40f2-a255-1efb73552b97', 'admin', 'System Administrator', 'Quản trị hệ thống toàn quyền & Điều phối sự kiện'),
  ('e40c5e4d-f1c5-494c-a965-06c54956d1f7', 'partner', 'Partner / Exhibitor', 'Đơn vị xuất bản / Gian hàng đối tác')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (id, code, name, module) VALUES
  ('9fb8226b-b6bc-4f91-aede-cebba0a60a58', 'account.login', 'Đăng nhập hệ thống', 'account'),
  ('59594cd0-3c43-48e0-a95a-e8347ee177ed', 'account.profile', 'Quản lý hồ sơ cá nhân', 'account'),
  ('d2683da5-8521-48ad-a76c-ff8d8ba4ab3a', 'account.password', 'Đổi mật khẩu bảo mật', 'account'),
  ('cc4581ca-ce40-4e05-a78f-503b7ca80ed2', 'events.view', 'Xem danh sách sự kiện', 'events'),
  ('0ef0dd1f-3cf1-42d4-a505-b113b6b58696', 'events.manage', 'Tạo & Điều phối sự kiện', 'events'),
  ('06a35a6d-40a5-4e8b-a50e-b1062612ef89', 'events.apply', 'Nộp hồ sơ tham gia sự kiện', 'events'),
  ('5b144221-b2c6-4eab-a1f1-85d824133de0', 'booths.view', 'Xem sơ đồ mặt bằng gian hàng', 'booths'),
  ('28762d28-e6b8-40b9-af28-2fa2b84085c2', 'booths.register', 'Đăng ký chọn gian hàng', 'booths'),
  ('1adf46c2-8892-41ea-aa85-e78fe3856a26', 'booths.approve', 'Phê duyệt & phân bổ gian', 'booths'),
  ('1a5b6377-8541-4783-a756-0aba034996e1', 'activities.participate', 'Đăng ký tham gia hoạt động', 'activities'),
  ('694fb2b9-9929-442a-a7ba-bab6d3087984', 'activities.propose', 'Đề xuất hoạt động/tọa đàm', 'activities'),
  ('6109b509-47a4-40c7-acb4-2fe2f96e12dc', 'activities.review', 'Thẩm định & duyệt hoạt động', 'activities'),
  ('91d72db3-0e33-4b47-a1c1-b157c18cd02c', 'activities.checkin', 'Quét mã Check-in điểm danh', 'activities'),
  ('8e32ca9d-75e5-40a1-a135-3013b64e25a3', 'content.heritage.view', 'Xem câu chuyện di sản', 'content'),
  ('86efcfd9-80cd-4ba9-a232-ddb491ddc59e', 'content.heritage.edit', 'Biên tập nội dung di sản', 'content'),
  ('4361ae5f-ba13-4e8d-a1a8-c5dd0074a7d4', 'content.badges.manage', 'Cấu hình quy tắc huy hiệu', 'content'),
  ('639b6d74-7987-4468-a610-34f1d27bf40d', 'reports.partner', 'Xem báo cáo đối tác', 'reports'),
  ('6cab90bb-a2f4-4177-ac1f-46a9d57a129b', 'reports.organizer', 'Báo cáo điều hành tổng quan', 'reports'),
  ('712bf20d-125a-42f6-a944-b670c0da5f35', 'reports.system', 'Báo cáo toàn diện hệ thống', 'reports'),
  ('e6f261ec-ab9b-4789-a549-cbf869797ac1', 'system.users.manage', 'Quản lý tài khoản người dùng', 'system'),
  ('a194d622-e818-4206-a338-f8219586b9a9', 'system.roles.manage', 'Quản lý vai trò & phân quyền', 'system'),
  ('bf809b05-8864-4864-a174-e9d291c3a6cb', 'system.settings.manage', 'Cài đặt cấu hình nền tảng', 'system'),
  ('fe24c2ee-0b18-4afd-ae4a-27ba4611289c', 'system.logs.view', 'Xem nhật ký Audit logs', 'system')
ON CONFLICT (code) DO NOTHING;

-- Phân quyền cho PARTNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'partner' AND p.code IN (
  'account.login', 'account.profile', 'account.password',
  'events.view', 'events.apply',
  'booths.view', 'booths.register',
  'activities.participate', 'activities.propose',
  'content.heritage.view', 'reports.partner'
)
ON CONFLICT DO NOTHING;

-- Phân toàn quyền cho ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;
