-- Migration created at 2025-12-16T09:15:30.503Z
ALTER TABLE publication ADD COLUMN outfit_id UUID NULL REFERENCES outfit(id);
