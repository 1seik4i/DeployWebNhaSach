-- 040_assets.sql
-- Nạp danh mục thiết bị hỗ trợ tổ chức hoạt động

INSERT INTO assets (id, name, total_quantity, description, is_deleted) VALUES
  ('2360f2f8-a524-4f81-ad25-1638175f62b9', 'Micro không dây', 8, 'Thiết bị sự kiện: Micro không dây (chiếc)', false),
  ('12026f0c-6ad2-4fc5-a2ac-a6d3675da8f8', 'Hệ thống loa di động', 4, 'Thiết bị sự kiện: Hệ thống loa di động (bộ)', false),
  ('e3d17f73-d44c-428e-ad88-4f548dba7d8f', 'Ghế ngồi khán giả', 150, 'Thiết bị sự kiện: Ghế ngồi khán giả (ghế)', false),
  ('2e6f21a3-f539-4820-a66a-996f97c04472', 'Bàn đại biểu có khăn phủ', 6, 'Thiết bị sự kiện: Bàn đại biểu có khăn phủ (bàn)', false),
  ('74949de4-f359-4679-a3bd-e4adf5098a35', 'Máy chiếu & Màn chiếu', 2, 'Thiết bị sự kiện: Máy chiếu & Màn chiếu (bộ)', false),
  ('48e501d5-35c6-4e81-a970-b58b71886191', 'Khung Backdrop sân khấu', 2, 'Thiết bị sự kiện: Khung Backdrop sân khấu (khung)', false),
  ('2ffbb187-8359-4065-a376-7683d861d7cc', 'Khung Standee chỉ dẫn', 6, 'Thiết bị sự kiện: Khung Standee chỉ dẫn (chân)', false)
ON CONFLICT DO NOTHING;
