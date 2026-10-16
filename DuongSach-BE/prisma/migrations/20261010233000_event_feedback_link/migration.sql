ALTER TABLE "feedbacks" ADD COLUMN IF NOT EXISTS "event_id" UUID;
ALTER TABLE "feedbacks" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(160);

DO $$ BEGIN
  ALTER TABLE "feedbacks"
    ADD CONSTRAINT "feedbacks_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "feedbacks_event_id_created_at_idx"
  ON "feedbacks"("event_id", "created_at" DESC);

UPDATE "feedbacks" AS feedback
SET "event_id" = event."id"
FROM "events" AS event
WHERE feedback."event_id" IS NULL
  AND feedback."target_name" IN (event."title", event."title_en");
