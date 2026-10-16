ALTER TABLE "site_visits"
  ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing daily visits were not active at migration time. Preserve their real
-- last-known timestamp instead of temporarily counting every historical row online.
UPDATE "site_visits" SET "last_seen_at" = "created_at";

CREATE INDEX IF NOT EXISTS "site_visits_day_idx" ON "site_visits"("day");
CREATE INDEX IF NOT EXISTS "site_visits_last_seen_at_idx" ON "site_visits"("last_seen_at");
