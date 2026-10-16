UPDATE "content_entries"
SET "data" = jsonb_set(
  "data",
  '{articles}',
  COALESCE(
    (
      SELECT jsonb_agg(jsonb_set(article, '{views}', '0'::jsonb, true))
      FROM jsonb_array_elements("data"->'articles') AS article
    ),
    '[]'::jsonb
  )
)
WHERE "kind" = 'news'
  AND jsonb_typeof("data"->'articles') = 'array';
