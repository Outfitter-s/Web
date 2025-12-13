-- Migration created at 2025-11-30T13:41:12.283Z

CREATE TYPE role AS ENUM ('user', 'admin');

ALTER TABLE users ADD COLUMN role role NOT NULL DEFAULT 'user';
