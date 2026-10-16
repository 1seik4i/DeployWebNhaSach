-- 100_partner_applications.sql
-- Đơn đăng ký tham gia sự kiện của đối tác

INSERT INTO partner_applications (id, event_id, organization_id, status, step, submitted_at, reviewed_at, review_note) VALUES
  ('b556e577-d159-41c6-a60d-9711c2ae0083', 'daa1f312-395e-43a2-a91c-00f3a3d50bbb', '099484c0-25dc-40ab-a189-91d8ab2005bd', 'approved'::partner_app_status, 3, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', 'Hồ sơ pháp lý và kế hoạch tham gia đầy đủ, hợp lệ'),
  ('067a053f-b60d-4e26-a124-5310db0ee8bc', 'daa1f312-395e-43a2-a91c-00f3a3d50bbb', 'f4b638e5-2712-46b6-a6eb-ae50077cb0e3', 'approved'::partner_app_status, 3, NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', 'NXB Trẻ được phê duyệt tham gia khu gian hàng trung tâm')
ON CONFLICT (event_id, organization_id) DO NOTHING;
