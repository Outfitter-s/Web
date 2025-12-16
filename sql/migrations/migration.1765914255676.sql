-- Migration created at 2025-12-16T19:44:15.676Z

CREATE TABLE ics_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id)
);
