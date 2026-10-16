CREATE TABLE IF NOT EXISTS book_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  ranking_type varchar(32) NOT NULL,
  rank integer NOT NULL,
  updated_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT book_rankings_type_check CHECK (ranking_type IN ('bestseller', 'weekly_hot')),
  CONSTRAINT book_rankings_rank_check CHECK (rank BETWEEN 1 AND 100),
  CONSTRAINT book_rankings_type_rank_key UNIQUE (ranking_type, rank),
  CONSTRAINT book_rankings_type_book_key UNIQUE (ranking_type, book_id)
);

CREATE INDEX IF NOT EXISTS book_rankings_type_rank_idx
  ON book_rankings (ranking_type, rank);
