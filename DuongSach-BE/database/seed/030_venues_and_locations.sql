-- 030_venues_and_locations.sql
-- Nạp Venues và Locations

INSERT INTO venues (id, name, facility, capacity, address, is_active) VALUES
  ('569210e0-e140-4ece-a8e1-0b67e32a3404', 'Đường Sách TP.HCM', 'Đường Nguyễn Văn Bình, Bến Nghé, Quận 1', 3000, 'Đường Nguyễn Văn Bình, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', true),
  ('a1112222-e140-4ece-a8e1-0b67e32a3405', 'Đường Sách TP. Thủ Đức', 'Đường Hồ Thị Tư, Hiệp Phú, TP. Thủ Đức', 1200, 'Đường Hồ Thị Tư, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh', true)
ON CONFLICT (name, facility) DO NOTHING;

INSERT INTO locations (id, venue_id, code, name, kind, capacity, zone, map_x, map_y) VALUES
  ('e98d0808-ceb7-4734-a471-c8d1e37dab61', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-STAGE', 'Sân Khấu Chính (Main Stage)', 'main_stage'::location_kind, 250, 'Khu Trung Tâm', 50.0, 25.0),
  ('70568dc7-f50b-4499-ade5-e3fcfd19e8b1', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-WORK-01', 'Khu Vực Workshop & Trải Nghiệm', 'workshop_area'::location_kind, 80, 'Khu B', 35.0, 45.0),
  ('d67622d5-1cd3-40a0-ac8e-271a550f258c', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-READ-01', 'Không Gian Đọc Sách Cộng Đồng', 'reading_area'::location_kind, 100, 'Khu C', 70.0, 60.0),
  ('74504a41-22d1-4a44-ac6c-a452359ef291', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-EXHIBIT', 'Khu Triển Lãm & Trưng Bày', 'other'::location_kind, 150, 'Khu A', 20.0, 30.0),
  ('e344f9f5-dc96-4189-a78e-5485c84f8349', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-01', 'Vị trí Gian hàng Nhà Xuất Bản Trẻ', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('10db7331-20ad-4073-af91-1ccd7e3987c0', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-02', 'Vị trí Gian hàng Nhà Xuất Bản Kim Đồng', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('a9e00195-fbc3-42e4-a60a-cdb18d961e5b', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-03', 'Vị trí Hiệu sách Nhã Nam', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('afa37df7-f49d-4728-a951-abfb72db4790', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-04', 'Vị trí Phương Nam Book Store', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('9ea56cd5-504c-485a-a30b-3d4b8b2375eb', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-05', 'Vị trí Thái Hà Books', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('35d794cd-618e-4380-ac04-c486665f0925', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-06', 'Vị trí Cà Phê Sách Bằng Lăng Tím', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('eca9f427-9189-4548-ad2f-2b33b4f1f179', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-07', 'Vị trí Gian hàng NXB Tổng Hợp TP.HCM', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('2a0ec771-a791-4a7b-af72-0d3826c99871', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-08', 'Vị trí First News - Trí Việt', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('1dd0b5d5-3651-475a-aab7-aebf6d628273', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-09', 'Vị trí Đinh Tị Books', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('0ce1362f-8a1e-4f0e-a42d-8129cc3d0926', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-10', 'Vị trí Alpha Books & Omega Plus', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('92522c68-e53f-4e54-ad29-651d6f89ca79', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-11', 'Vị trí Gian hàng Nhà Xuất Bản Phụ Nữ', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('22848a0d-4a62-4966-acdf-433cedb3a7e2', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B-12', 'Vị trí Không Gian Lưu Niệm & Tranh Cổ', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('eeef7413-87f1-41e6-af08-e1b450ad3fa8', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A01', 'Vị trí Gian A01', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('7aa9a164-3a8b-4f26-a0dd-5b84690818a4', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A02', 'Vị trí Gian A02', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('144a77c5-0747-4e48-a30f-07cc07435f6c', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A03', 'Vị trí Gian A03', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('30d8af73-2a6c-447d-a94f-24306ba919f6', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A04', 'Vị trí Gian A04', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A05', 'Vị trí Gian hàng Nhà Sách Bình Minh', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('fcff0457-4e8d-4eb7-a851-5d70135fa470', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A06', 'Vị trí Gian A06', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('482e8240-9a24-45b5-add4-2e930f80dc7c', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A07', 'Vị trí Gian A07', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('791c074f-a33f-4c69-a533-d4155d43c3d8', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A08', 'Vị trí Gian A08', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('d6556e8b-2735-4a08-a204-8c52c42798ef', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A09', 'Vị trí Gian A09', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('dd1f9c93-5b48-4292-ab25-1439296478af', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-A10', 'Vị trí Gian A10', 'booth'::location_kind, 30, 'Khu A', 50.0, 50.0),
  ('41de22f5-5607-4275-a7ae-99cccd6e01a0', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B01', 'Vị trí Gian B01', 'booth'::location_kind, 30, 'Khu B', 50.0, 50.0),
  ('8a01f7ba-c03f-4a77-a242-6b8d76717c1e', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B02', 'Vị trí Gian B02', 'booth'::location_kind, 30, 'Khu B', 50.0, 50.0),
  ('f3c48773-3fe6-45a5-a70f-b16d76b663ec', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B03', 'Vị trí Gian B03', 'booth'::location_kind, 30, 'Khu B', 50.0, 50.0),
  ('016d1641-8d59-4fcc-ada1-56eec3e61417', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B04', 'Vị trí Gian B04', 'booth'::location_kind, 30, 'Khu B', 50.0, 50.0),
  ('c66e044b-0194-4c1b-a9c3-93dcb95d8f65', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B05', 'Vị trí Gian B05', 'booth'::location_kind, 30, 'Khu B', 50.0, 50.0),
  ('b857e157-879c-4df0-a05c-bd00b1746d12', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-B06', 'Vị trí Gian B06', 'booth'::location_kind, 30, 'Khu B', 50.0, 50.0),
  ('15a42e0a-0d09-453b-a520-4bc95ef52ded', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-C01', 'Vị trí Gian C01', 'booth'::location_kind, 30, 'Khu C', 50.0, 50.0),
  ('35a0dd4f-c707-41b0-adce-296a925f3b60', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-C02', 'Vị trí Gian C02', 'booth'::location_kind, 30, 'Khu C', 50.0, 50.0),
  ('3ecd645e-7b9c-4abf-a864-bdde3226c50e', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-C03', 'Vị trí Gian C03', 'booth'::location_kind, 30, 'Khu C', 50.0, 50.0),
  ('a2f6a8ed-52c2-44d5-a0d4-075d5e639236', '569210e0-e140-4ece-a8e1-0b67e32a3404', 'LOC-C04', 'Vị trí Gian C04', 'booth'::location_kind, 30, 'Khu C', 50.0, 50.0),
  -- Các vị trí tại Đường Sách TP. Thủ Đức
  ('b1112222-ceb7-4734-a471-c8d1e37dab61', 'a1112222-e140-4ece-a8e1-0b67e32a3405', 'LOC-TD-STAGE', 'Sân Khấu Hoa Sen - Thủ Đức', 'main_stage'::location_kind, 200, 'Khu Trung Tâm', 50.0, 20.0),
  ('b2223333-dc96-4189-a78e-5485c84f8349', 'a1112222-e140-4ece-a8e1-0b67e32a3405', 'LOC-TD-01', 'Vị trí Gian hàng Thủ Đức 01', 'booth'::location_kind, 30, 'Khu A', 30.0, 40.0),
  ('b3334444-20ad-4073-af91-1ccd7e3987c0', 'a1112222-e140-4ece-a8e1-0b67e32a3405', 'LOC-TD-02', 'Vị trí Gian hàng Thủ Đức 02', 'booth'::location_kind, 30, 'Khu A', 50.0, 40.0),
  ('b4445555-cdb1-4073-af91-1ccd7e3987c1', 'a1112222-e140-4ece-a8e1-0b67e32a3405', 'LOC-TD-03', 'Vị trí Cà Phê Sách Thủ Đức', 'booth'::location_kind, 30, 'Khu B', 70.0, 40.0)
ON CONFLICT (venue_id, code) DO NOTHING;
