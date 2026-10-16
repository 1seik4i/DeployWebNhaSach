-- 170_library_and_map.sql
-- Dữ liệu khởi tạo cho thư viện số và nền bản đồ landing page.
-- Các lệnh đều idempotent để có thể chạy lại bằng `npm run seed`.

INSERT INTO book_categories (id, name, name_en, status) VALUES
  ('a1000001-0000-4000-8000-000000000001', 'Văn học Việt Nam', 'Vietnamese literature', 'active'),
  ('a1000001-0000-4000-8000-000000000002', 'Thiếu nhi', 'Children books', 'active'),
  ('a1000001-0000-4000-8000-000000000003', 'Lịch sử & Văn hóa', 'History & culture', 'active'),
  ('a1000001-0000-4000-8000-000000000004', 'Kỹ năng & Kinh doanh', 'Skills & business', 'active')
ON CONFLICT (name) DO UPDATE SET name_en = EXCLUDED.name_en, status = EXCLUDED.status;

INSERT INTO book_labels (id, name, status) VALUES
  ('a2000001-0000-4000-8000-000000000001', 'Sách mới', 'active'),
  ('a2000001-0000-4000-8000-000000000002', 'Được yêu thích', 'active'),
  ('a2000001-0000-4000-8000-000000000003', 'Dành cho gia đình', 'active'),
  ('a2000001-0000-4000-8000-000000000004', 'Tác giả Việt', 'active')
ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO books (id, isbn, title, title_en, author, publisher, cover_url, description, publication_year, category_id, status) VALUES
  ('a3000001-0000-4000-8000-000000000001', '9786041000001', 'Mắt biếc', 'Blue Eyes', 'Nguyễn Nhật Ánh', 'NXB Trẻ', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80', 'Tác phẩm văn học Việt Nam giàu cảm xúc về tuổi trẻ, tình bạn và những rung động đầu đời.', 2019, 'a1000001-0000-4000-8000-000000000001', 'active'),
  ('a3000001-0000-4000-8000-000000000002', '9786041000002', 'Kính vạn hoa: Bí mật của một kho báu', 'Kaleidoscope: A Treasure Secret', 'Nguyễn Nhật Ánh', 'NXB Kim Đồng', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80', 'Cuộc phiêu lưu trong trẻo và đầy bất ngờ của bộ ba Quý ròm, Tiểu Long và Hạnh.', 2020, 'a1000001-0000-4000-8000-000000000002', 'active'),
  ('a3000001-0000-4000-8000-000000000003', '9786041000003', 'Sài Gòn: Chuyện đời của phố', 'Saigon: Stories of the Streets', 'Phạm Công Luận', 'NXB Tổng Hợp TP.HCM', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80', 'Những lát cắt về con người, ký ức và nhịp sống của Sài Gòn qua nhiều thời kỳ.', 2022, 'a1000001-0000-4000-8000-000000000003', 'active'),
  ('a3000001-0000-4000-8000-000000000004', '9786041000004', 'Tuổi trẻ đáng giá bao nhiêu', 'How Much Is Your Youth Worth?', 'Rosie Nguyễn', 'Nhã Nam', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8f?auto=format&fit=crop&w=600&q=80', 'Gợi mở hành trình học tập, trải nghiệm và định hướng bản thân cho người trẻ.', 2021, 'a1000001-0000-4000-8000-000000000004', 'active'),
  ('a3000001-0000-4000-8000-000000000005', '9786041000005', 'Dế Mèn phiêu lưu ký', 'Adventures of a Cricket', 'Tô Hoài', 'NXB Kim Đồng', 'https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=600&q=80', 'Hành trình trưởng thành kinh điển của chú Dế Mèn, dành cho nhiều thế hệ độc giả.', 2023, 'a1000001-0000-4000-8000-000000000002', 'active'),
  ('a3000001-0000-4000-8000-000000000006', '9786041000006', 'Việt Nam phong tục', 'Vietnamese Customs', 'Phan Kế Bính', 'NXB Văn Học', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80', 'Khảo cứu nền tảng về phong tục, nếp sống và văn hóa truyền thống Việt Nam.', 2020, 'a1000001-0000-4000-8000-000000000003', 'active'),
  ('a3000001-0000-4000-8000-000000000007', '9786040297938', 'Cho tôi xin một vé đi tuổi thơ', 'Give Me a Ticket Back to Childhood', 'Nguyễn Nhật Ánh', 'NXB Trẻ', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80', 'Câu chuyện về tuổi thơ hồn nhiên của nhà văn Nguyễn Nhật Ánh.', 2008, 'a1000001-0000-4000-8000-000000000001', 'active'),
  ('a3000001-0000-4000-8000-000000000008', '9786041186248', 'Tôi thấy hoa vàng trên cỏ xanh', 'Yellow Flowers on the Green Grass', 'Nguyễn Nhật Ánh', 'NXB Trẻ', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80', 'Thiếu nhi, tình bạn và cuộc sống ở nông thôn miền Trung.', 2010, 'a1000001-0000-4000-8000-000000000002', 'active'),
  ('a3000001-0000-4000-8000-000000000009', '9786049855634', 'Đắc Nhân Tâm', 'How to Win Friends and Influence People', 'Dale Carnegie', 'First News', 'https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=600&q=80', 'Cuốn sách kinh điển về nghệ thuật giao tiếp và thu phục lòng người.', 1936, 'a1000001-0000-4000-8000-000000000004', 'active'),
  ('a3000001-0000-4000-8000-000000000010', '9786041166547', 'Nhà Giả Kim', 'The Alchemist', 'Paulo Coelho', 'NXB Văn học', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80', 'Hành trình của chàng chăn cừu đi tìm kho báu và ý nghĩa cuộc đời.', 1988, 'a1000001-0000-4000-8000-000000000001', 'active'),
  ('a3000001-0000-4000-8000-000000000011', '9786040110701', 'Hành trình về phương Đông', 'Life and Teaching of the Masters of the Far East', 'Baird T. Spalding', 'NXB Tổng Hợp', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80', 'Ghi lại hành trình khám phá những huyền bí phương Đông.', 2012, 'a1000001-0000-4000-8000-000000000003', 'active'),
  ('a3000001-0000-4000-8000-000000000012', '9786043821147', 'Sapiens: Lược sử loài người', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'Alpha Books', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80', 'Hành trình tiến hóa và lịch sử phát triển của loài người.', 2011, 'a1000001-0000-4000-8000-000000000003', 'active'),
  ('a3000001-0000-4000-8000-000000000013', '9786043822717', 'Doraemon - Truyện dài: Nobita và vương quốc trên mây', 'Doraemon: Nobita and the Kingdom of Clouds', 'Fujiko F. Fujio', 'NXB Kim Đồng', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80', 'Cuộc phiêu lưu của Nobita và Doraemon trên vương quốc trên mây.', 2005, 'a1000001-0000-4000-8000-000000000002', 'active'),
  ('a3000001-0000-4000-8000-000000000014', '9786043829518', 'Nghĩ giàu & Làm giàu', 'Think and Grow Rich', 'Napoleon Hill', 'First News', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8f?auto=format&fit=crop&w=600&q=80', 'Bí quyết làm giàu được tổng hợp từ những người thành công.', 1937, 'a1000001-0000-4000-8000-000000000004', 'active')
ON CONFLICT (isbn) DO UPDATE SET
  title = EXCLUDED.title, title_en = EXCLUDED.title_en, author = EXCLUDED.author,
  publisher = EXCLUDED.publisher, cover_url = EXCLUDED.cover_url,
  description = EXCLUDED.description, publication_year = EXCLUDED.publication_year,
  category_id = EXCLUDED.category_id, status = EXCLUDED.status;

INSERT INTO book_label_assignments (book_id, label_id) VALUES
  ('a3000001-0000-4000-8000-000000000001', 'a2000001-0000-4000-8000-000000000001'),
  ('a3000001-0000-4000-8000-000000000001', 'a2000001-0000-4000-8000-000000000004'),
  ('a3000001-0000-4000-8000-000000000002', 'a2000001-0000-4000-8000-000000000002'),
  ('a3000001-0000-4000-8000-000000000002', 'a2000001-0000-4000-8000-000000000003'),
  ('a3000001-0000-4000-8000-000000000003', 'a2000001-0000-4000-8000-000000000004'),
  ('a3000001-0000-4000-8000-000000000004', 'a2000001-0000-4000-8000-000000000001'),
  ('a3000001-0000-4000-8000-000000000005', 'a2000001-0000-4000-8000-000000000003'),
  ('a3000001-0000-4000-8000-000000000006', 'a2000001-0000-4000-8000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO book_stalls (id, book_id, stall_id, inventory_quantity, sold_quantity) VALUES
  ('a4000001-0000-4000-8000-000000000001', 'a3000001-0000-4000-8000-000000000001', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 36, 8),
  ('a4000001-0000-4000-8000-000000000002', 'a3000001-0000-4000-8000-000000000002', 'e757df4c-4212-4f50-af7f-bb2c38f6a9cf', 42, 15),
  ('a4000001-0000-4000-8000-000000000003', 'a3000001-0000-4000-8000-000000000003', '6d2df04d-8992-4959-a787-6fdbf3c55804', 24, 5),
  ('a4000001-0000-4000-8000-000000000004', 'a3000001-0000-4000-8000-000000000004', '2291365a-10b9-445c-a44b-ad5f0261d2d1', 30, 12),
  ('a4000001-0000-4000-8000-000000000005', 'a3000001-0000-4000-8000-000000000005', 'e757df4c-4212-4f50-af7f-bb2c38f6a9cf', 50, 20),
  ('a4000001-0000-4000-8000-000000000006', 'a3000001-0000-4000-8000-000000000006', '6d2df04d-8992-4959-a787-6fdbf3c55804', 18, 3),
  ('a4000001-0000-4000-8000-000000000007', 'a3000001-0000-4000-8000-000000000007', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 35, 22),
  ('a4000001-0000-4000-8000-000000000008', 'a3000001-0000-4000-8000-000000000008', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 40, 28),
  ('a4000001-0000-4000-8000-000000000009', 'a3000001-0000-4000-8000-000000000009', '88266c1a-e23b-4235-a1da-7652da4b4639', 60, 45),
  ('a4000001-0000-4000-8000-000000000010', 'a3000001-0000-4000-8000-000000000010', '2291365a-10b9-445c-a44b-ad5f0261d2d1', 25, 18),
  ('a4000001-0000-4000-8000-000000000011', 'a3000001-0000-4000-8000-000000000011', '6d2df04d-8992-4959-a787-6fdbf3c55804', 20, 10),
  ('a4000001-0000-4000-8000-000000000012', 'a3000001-0000-4000-8000-000000000012', '7fc55ea4-e4c7-46f6-ac99-41aa8a149d42', 30, 16),
  ('a4000001-0000-4000-8000-000000000013', 'a3000001-0000-4000-8000-000000000013', 'e757df4c-4212-4f50-af7f-bb2c38f6a9cf', 50, 35),
  ('a4000001-0000-4000-8000-000000000014', 'a3000001-0000-4000-8000-000000000014', '88266c1a-e23b-4235-a1da-7652da4b4639', 45, 30)
ON CONFLICT (book_id, stall_id) DO UPDATE SET
  inventory_quantity = EXCLUDED.inventory_quantity, sold_quantity = EXCLUDED.sold_quantity;

INSERT INTO settings (key, value, description) VALUES
  ('public.map', '{"imageUrl":"/assets/maps/duong-sach-nguyen-van-binh.png"}'::jsonb, 'Ảnh nền bản đồ công khai trên landing page'),
  ('admin.system', '{"general":{"systemName":"Đường Sách TP.HCM","slogan":"Không gian Tri thức & Văn hóa Đọc","logoUrl":"/assets/logo.png","supportEmail":"hotro@duongsach.example.vn","supportPhone":"028 3822 5555","physicalAddress":"Đường Nguyễn Văn Bình, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh","primaryColor":"#059669"},"security":{"minPasswordLength":8,"requireSpecialChar":true,"maxFailedAttempts":5,"sessionTimeoutMinutes":60,"twoFactorEnabled":false},"notifications":{"sendWelcomeEmail":true,"alertOnFailedLogins":true,"notifyRoleChanges":true,"dailyDigestEmail":false}}'::jsonb, 'Cấu hình hệ thống quản trị')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

