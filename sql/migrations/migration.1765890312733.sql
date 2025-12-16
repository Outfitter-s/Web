-- Migration created at 2025-12-16T13:05:12.733Z

CREATE ENUM reaction_type_enum AS 'like', 'love', 'haha', 'wow', 'sad', 'angry';

CREATE TABLE reaction (
  post_id UUID REFERENCES publication(id),
  user_id UUID REFERENCES users(id),
  type reaction_type_enum,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);
