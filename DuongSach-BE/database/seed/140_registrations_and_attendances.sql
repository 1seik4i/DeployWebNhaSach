-- 140_registrations_and_attendances.sql
-- Đăng ký tham gia và phiên điểm danh thực tế

INSERT INTO event_registrations (id, event_id, user_id, joined_at) VALUES
  ('d2cdb89b-5e18-474b-a809-7bc7f4c22201', 'daa1f312-395e-43a2-a91c-00f3a3d50bbb', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', NOW() - INTERVAL '1 day'),
  ('e3ded89b-5e18-474b-a809-7bc7f4c22202', 'daa1f312-395e-43a2-a91c-00f3a3d50bbb', '1d646476-a477-4895-ab3b-319e24ce7115', NOW() - INTERVAL '2 days'),
  ('f4fed89b-5e18-474b-a809-7bc7f4c22203', 'daa1f312-395e-43a2-a91c-00f3a3d50bbb', 'b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac', NOW() - INTERVAL '3 days')
ON CONFLICT (event_id, user_id) DO NOTHING;

INSERT INTO activity_registrations (id, activity_id, user_id, registration_code, status, points_awarded, certificate_issued, qr_token) VALUES
  ('9d3a2d20-d390-4498-af87-83017eab53fd', '71a34c18-fceb-4eb8-a8e0-e74ba2d1408e', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', 'ACT-REG-001', 'attended'::registration_status, true, true, 'c289aa54-e9fb-4317-ade3-c79a5203b937'),
  ('8b2c1d10-d390-4498-af87-83017eab53fe', '3b83c180-2a8e-49b8-bfe2-f67b41981123', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', 'ACT-REG-002', 'attended'::registration_status, true, true, 'd39a1122-e9fb-4317-ade3-c79a5203b938'),
  ('7a1b0c09-d390-4498-af87-83017eab53ff', '5a25267d-92b3-44a7-ad5d-bd925829cfe6', '1d646476-a477-4895-ab3b-319e24ce7115', 'ACT-REG-003', 'registered'::registration_status, false, false, 'e40b2233-e9fb-4317-ade3-c79a5203b939'),
  ('6f0a9b98-d390-4498-af87-83017eab53fa', '8f22031a-e7c5-4d2b-8a89-aa81f2679d40', 'b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac', 'ACT-REG-004', 'attended'::registration_status, true, true, 'f51c3344-e9fb-4317-ade3-c79a5203b940')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, points_awarded = EXCLUDED.points_awarded;

INSERT INTO attendance_sessions (id, registration_id, user_id, activity_id, state, check_in_at, check_out_at, duration_minutes) VALUES
  ('fafe39b8-26b6-4ec1-af0c-e7b44dea363e', '9d3a2d20-d390-4498-af87-83017eab53fd', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', '71a34c18-fceb-4eb8-a8e0-e74ba2d1408e', 'checked_out'::attendance_state, NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day', 120),
  ('dafe39b8-26b6-4ec1-af0c-e7b44dea363d', '8b2c1d10-d390-4498-af87-83017eab53fe', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', '3b83c180-2a8e-49b8-bfe2-f67b41981123', 'checked_out'::attendance_state, NOW() - INTERVAL '1 day 5 hours', NOW() - INTERVAL '1 day 3 hours', 120),
  ('ebed28a7-26b6-4ec1-af0c-e7b44dea363f', '6f0a9b98-d390-4498-af87-83017eab53fa', 'b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac', '8f22031a-e7c5-4d2b-8a89-aa81f2679d40', 'checked_out'::attendance_state, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour 30 mins', 90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity_ratings (id, activity_id, user_id, registration_id, rating, comment) VALUES
  ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', '71a34c18-fceb-4eb8-a8e0-e74ba2d1408e', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', '9d3a2d20-d390-4498-af87-83017eab53fd', 5, 'Buổi tọa đàm rất ý nghĩa và nhiều kiến thức bổ ích!'),
  ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', '3b83c180-2a8e-49b8-bfe2-f67b41981123', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', '8b2c1d10-d390-4498-af87-83017eab53fe', 5, 'Giao lưu tác giả chân thành, không gian ấm cúng.'),
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', '8f22031a-e7c5-4d2b-8a89-aa81f2679d40', 'b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac', '6f0a9b98-d390-4498-af87-83017eab53fa', 4, 'Workshop hướng dẫn chi tiết, dụng cụ đầy đủ.')
ON CONFLICT (registration_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment;

