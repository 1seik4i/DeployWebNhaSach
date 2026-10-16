CREATE TABLE IF NOT EXISTS "news_article_reads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "content_entry_id" UUID NOT NULL,
  "article_id" VARCHAR(200) NOT NULL,
  "session_id" UUID NOT NULL,
  "day" DATE NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "news_article_reads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "news_article_reads_content_entry_id_fkey"
    FOREIGN KEY ("content_entry_id") REFERENCES "content_entries"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "news_article_reads_content_entry_id_article_id_session_id_day_key"
  ON "news_article_reads"("content_entry_id", "article_id", "session_id", "day");
CREATE INDEX IF NOT EXISTS "news_article_reads_content_entry_id_article_id_idx"
  ON "news_article_reads"("content_entry_id", "article_id");
CREATE INDEX IF NOT EXISTS "news_article_reads_day_idx" ON "news_article_reads"("day");
