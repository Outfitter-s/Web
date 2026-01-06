-- Migration created at 2026-01-06T14:53:27.821Z

CREATE TABLE comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  content TEXT NOT NULL,
  publication_id UUID REFERENCES publication (id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comment (id) ON DELETE CASCADE,
  user_id UUID REFERENCES users (id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
  CHECK (
    (publication_id IS NOT NULL AND comment_id IS NULL)
    OR (publication_id IS NULL AND comment_id IS NOT NULL)
  )
);
