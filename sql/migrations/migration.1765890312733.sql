-- Migration created at 2025-12-16T13:05:12.733Z

CREATE TYPE reaction_type AS ENUM ('like', 'love', 'haha', 'wow', 'sad');

CREATE TABLE reaction (
  post_id UUID REFERENCES publication(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type reaction_type,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);
