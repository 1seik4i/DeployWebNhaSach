-- 160_feedbacks_and_badges.sql
-- Nạp Feedbacks của độc giả, Badge Rules, User Badges và Certificates

INSERT INTO badge_rules (id, code, title, description, icon_name, min_points) VALUES
  ('e909a516-4bac-4835-a8cd-ccc516be3f97', 'MAM_DOC', 'Mầm Đọc', 'Dành cho độc giả mới bắt đầu tham gia các hoạt động tại Đường Sách TP.HCM.', 'seedling', 50),
  ('9bc33ab2-12ed-4546-a996-ed65b75dac97', 'BAN_DOC_THAN_THIET', 'Bạn Đọc Thân Thiết', 'Dành cho độc giả tham gia tích cực từ 3 hoạt động và check-in các điểm di sản.', 'book', 150),
  ('fa35d64d-5194-4838-a885-f906d35d5c79', 'DAI_SU_VAN_HOA', 'Đại Sứ Văn Hóa', 'Dành cho cá nhân lan tỏa văn hóa đọc, có đóng góp phản hồi và đánh giá tích cực.', 'award', 600),
  ('6930af74-b994-40ca-a284-e479a87aa3eb', 'HOC_GIA_TINH_HOA', 'Học Giả Tinh Hoa', 'Huy hiệu danh dự cao cấp nhất, ghi nhận quá trình đồng hành bền bỉ cùng Đường Sách.', 'crown', 1200)
ON CONFLICT (code) DO NOTHING;

-- Cấp Badge cho User mẫu
INSERT INTO user_badges (id, user_id, rule_id, earned_at) VALUES
  ('0011a250-fd00-4dfc-ae8b-34451225e69c', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', 'e909a516-4bac-4835-a8cd-ccc516be3f97', NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, rule_id) DO NOTHING;

-- Cấp Chứng nhận Certificate
INSERT INTO certificates (id, registration_id, user_id, certificate_code, title, issued_at) VALUES
  ('dccffbc2-821a-4f62-af0c-e1f0dd91d771', '9d3a2d20-d390-4498-af87-83017eab53fd', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', 'CERT-TALKSHOW-001', 'Chứng nhận tham gia: Tọa đàm Ký ức văn học Sài Gòn - Chợ Lớn', NOW() - INTERVAL '1 day'),
  ('eccffbc2-821a-4f62-af0c-e1f0dd91d773', '8b2c1d10-d390-4498-af87-83017eab53fe', '518a7ba0-302a-4463-a113-f0ca5eb94dd7', 'CERT-AUTHOR-002', 'Chứng nhận tham gia: Giao lưu tác giả Hành Trình Lan Tỏa Văn Hóa Đọc', NOW() - INTERVAL '1 day 3 hours'),
  ('cbbffbc2-821a-4f62-af0c-e1f0dd91d772', '6f0a9b98-d390-4498-af87-83017eab53fa', 'b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac', 'CERT-WORKSHOP-002', 'Chứng nhận hoàn thành Workshop Nghệ thuật Khâu Sách Cổ', NOW() - INTERVAL '2 hours')
ON CONFLICT (registration_id) DO NOTHING;

-- Hai lượt hoàn tất đủ 20 phút, mỗi lượt nhận đúng 30 điểm theo event_settings.
INSERT INTO point_transactions (user_id, registration_id, points, reason) VALUES
  ('518a7ba0-302a-4463-a113-f0ca5eb94dd7', '9d3a2d20-d390-4498-af87-83017eab53fd', 30, 'Tham gia hoạt động: Tọa đàm Ký ức văn học Sài Gòn - Chợ Lớn'),
  ('518a7ba0-302a-4463-a113-f0ca5eb94dd7', '8b2c1d10-d390-4498-af87-83017eab53fe', 30, 'Tham gia hoạt động: Giao lưu tác giả Hành Trình Lan Tỏa Văn Hóa Đọc')
ON CONFLICT (registration_id, reason) DO NOTHING;

-- Ý kiến phản hồi & Đánh giá (Feedbacks) theo luồng thông báo và duyệt
INSERT INTO feedbacks (id, target_scope, heritage_id, target_name, rating, comments, contact_email, source, status, internal_note) VALUES
  ('b5b2d523-6015-4141-a9ce-43272283194f', 'heritage'::feedback_scope, 'e6b455d3-7f42-4e08-a332-23a6011a8a5d', 'DS-01 Quần thể di tích Cố đô Huế', 5, 'Phần thuyết minh và câu chuyện lịch sử về Cố đô Huế rất chi tiết, hình ảnh chụp Ngọ Môn sắc nét và sống động!', 'nguyenvana@gmail.com', 'web_landing'::feedback_source, 'responded'::feedback_status, 'Cảm ơn quý độc giả đã yêu mến di sản văn hóa.'),
  ('3f72e592-ec5a-437a-abcf-8a3f7dfe26b3', 'entire'::feedback_scope, NULL, 'Toàn Đường Sách TP.HCM', 4, 'Không gian rợp bóng cây xanh mát mẻ, tuy nhiên vào cuối tuần buổi tối sân khấu A hơi đông, cần bố trí thêm ghế ngồi.', 'nguyenvana@gmail.com', 'web_landing'::feedback_source, 'in_progress'::feedback_status, 'Đang bố trí thêm 50 ghế tựa tại khu vực khán đài A.'),
  ('c30e93f7-5d34-4786-a4c3-49d6eb72b498', 'booth'::feedback_scope, NULL, 'Gian hàng Nhà Xuất Bản Trẻ', 5, 'Nhân viên tư vấn nhiệt tình, tìm được cuốn sách văn học hiếm rất ưng ý.', 'nguyenvana@gmail.com', 'web_landing'::feedback_source, 'new'::feedback_status, NULL),
  ('df0cee45-2e16-477c-a3d3-765e8995dca2', 'heritage'::feedback_scope, 'e6b455d3-7f42-4e08-a332-23a6011a8a5d', 'DS-10 Di tích lịch sử Địa đạo Củ Chi', 5, 'Mã QR quét tại điểm tải trang rất mượt, xem được đầy đủ lược đồ chiến khu!', 'dukhach_saigon@yahoo.com', 'web_landing'::feedback_source, 'new'::feedback_status, NULL),
  ('e10aee45-2e16-477c-a3d3-765e8995dca3', 'entire'::feedback_scope, NULL, 'Khu tiện ích vệ sinh & nước uống', 4, 'Nước uống miễn phí sạch sẽ, đề xuất bổ sung thêm thùng phân loại rác tái chế.', 'hoangminh.reader@gmail.com', 'web_landing'::feedback_source, 'new'::feedback_status, NULL)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, internal_note = EXCLUDED.internal_note;
