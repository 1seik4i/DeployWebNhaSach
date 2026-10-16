-- Additional invariants not representable in the Prisma datamodel.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_location_no_overlap;
ALTER TABLE books ADD CONSTRAINT books_status_check CHECK (status IN ('active','draft','archived'));
ALTER TABLE books ADD CONSTRAINT books_version_check CHECK (version > 0);
ALTER TABLE book_categories ADD CONSTRAINT book_categories_status_check CHECK (status IN ('active','archived'));
ALTER TABLE book_labels ADD CONSTRAINT book_labels_status_check CHECK (status IN ('active','archived'));
ALTER TABLE book_stalls ADD CONSTRAINT book_stalls_quantity_check CHECK (inventory_quantity >= 0 AND (sold_quantity IS NULL OR sold_quantity >= 0));
ALTER TABLE book_stalls ADD CONSTRAINT book_stalls_version_check CHECK (version > 0);
ALTER TABLE book_submissions ADD CONSTRAINT book_submissions_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED'));
ALTER TABLE book_submissions ADD CONSTRAINT book_submissions_type_check CHECK (type IN ('CREATE','UPDATE'));
ALTER TABLE book_submissions ADD CONSTRAINT book_submissions_quantity_check CHECK (inventory_quantity >= 0 AND (sold_quantity IS NULL OR sold_quantity >= 0));
ALTER TABLE book_sales ADD CONSTRAINT book_sales_quantity_check CHECK (quantity >= 0);
ALTER TABLE content_entries ADD CONSTRAINT content_entries_status_check CHECK (status IN ('draft','published','hidden'));
ALTER TABLE content_entries ADD CONSTRAINT content_entries_kind_check CHECK (kind IN ('journey','organization','news','footer'));
ALTER TABLE event_suggestions ADD CONSTRAINT event_suggestions_status_check CHECK (status IN ('new','contacted','approved','rejected','closed'));
ALTER TABLE events ADD CONSTRAINT events_visibility_check CHECK (visibility IN ('public','internal'));
INSERT INTO permissions (id,code,name,module) VALUES
  (gen_random_uuid(),'library.read','Xem sách trong gian hàng','library'),
  (gen_random_uuid(),'library.submit','Gửi nội dung sách để duyệt','library'),
  (gen_random_uuid(),'library.inventory.update','Cập nhật tồn kho sách','library'),
  (gen_random_uuid(),'library.sales.update','Cập nhật số bán sách','library'),
  (gen_random_uuid(),'library.moderate','Kiểm duyệt sách','library'),
  (gen_random_uuid(),'library.taxonomy.manage','Quản lý phân loại và nhãn sách','library')
ON CONFLICT (code) DO NOTHING;
INSERT INTO role_permissions (role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (r.code='admin' AND p.code LIKE 'library.%') OR (r.code='partner' AND p.code IN ('library.read','library.submit','library.inventory.update','library.sales.update'))
ON CONFLICT DO NOTHING;
