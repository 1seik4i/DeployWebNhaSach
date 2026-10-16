-- Bật các extensions PostgreSQL bắt buộc theo mục 5.1
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger khóa bất biến slug di sản (SLUG_IMMUTABLE)
CREATE OR REPLACE FUNCTION trg_lock_heritage_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug <> OLD.slug THEN
    RAISE EXCEPTION 'SLUG_IMMUTABLE: Slug di sản là định danh cố định không thể thay đổi'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_heritage_slug_immutable ON heritages;
CREATE TRIGGER check_heritage_slug_immutable
  BEFORE UPDATE ON heritages
  FOR EACH ROW
  EXECUTE FUNCTION trg_lock_heritage_slug();

-- Hàm IMMUTABLE unaccent để đánh index pg_trgm tiếng Việt
CREATE OR REPLACE FUNCTION f_unaccent(text)
  RETURNS text AS
$func$
SELECT public.unaccent('public.unaccent', $1)
$func$  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- Chỉ mục GiST & pg_trgm tìm kiếm & Exclusion constraint
-- 1. Tìm kiếm tên gian hàng không dấu
CREATE INDEX IF NOT EXISTS idx_booths_name_trgm ON booths USING gin (f_unaccent(name) gin_trgm_ops);
-- 2. Tìm kiếm thời gian sự kiện
CREATE INDEX IF NOT EXISTS idx_events_time ON events (start_at, end_at) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_events_status ON events (status, priority_level);
-- 3. Đề xuất hoạt động
CREATE INDEX IF NOT EXISTS idx_proposals_filter ON activity_proposals (status, submitted_at DESC);
-- 4. Hoạt động theo địa điểm và thời gian
CREATE INDEX IF NOT EXISTS idx_activities_loc_time ON activities (location_id, start_at, end_at);
-- 5. Đăng ký hoạt động theo người dùng
CREATE INDEX IF NOT EXISTS idx_reg_user ON activity_registrations (user_id, status);
-- 6. Phản hồi
CREATE INDEX IF NOT EXISTS idx_feedbacks_filter ON feedbacks (heritage_id, rating, status, created_at DESC);
-- 7. Thông báo
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
-- 8. Nhật ký audit log
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs (target_type, target_id, created_at DESC);

-- Unique partial index cho attendance active (BR-44: 1 user chỉ có 1 session check-in đồng thời)
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_session ON attendance_sessions (user_id) WHERE state = 'checked_in';

-- Unique partial index cho activity registration active
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_registration ON activity_registrations (activity_id, user_id) WHERE status <> 'cancelled';

-- 9. Thêm cột period (tstzrange) và 3 EXCLUSION CONSTRAINTS (P0 - BR-19, BR-20, BR-30)
ALTER TABLE booth_holds ADD COLUMN IF NOT EXISTS period tstzrange;
ALTER TABLE booth_assignments ADD COLUMN IF NOT EXISTS period tstzrange;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'period'
  ) THEN
    ALTER TABLE activities ADD COLUMN period tstzrange GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booth_holds_no_overlap') THEN
    ALTER TABLE booth_holds
      ADD CONSTRAINT booth_holds_no_overlap
      EXCLUDE USING gist (booth_id WITH =, period WITH &&)
      WHERE (released_at IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booth_assignments_no_overlap') THEN
    ALTER TABLE booth_assignments
      ADD CONSTRAINT booth_assignments_no_overlap
      EXCLUDE USING gist (booth_id WITH =, period WITH &&)
      WHERE (status = 'active');
  END IF;
END $$;

-- Multiple activities may run at the same place and time.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_location_no_overlap;

