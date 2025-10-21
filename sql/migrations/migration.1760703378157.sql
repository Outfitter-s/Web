-- Migration created at 2025-10-17T12:16:18.157Z

ALTER TABLE clothing_item ADD COLUMN name TEXT NOT NULL;
ALTER TABLE clothing_item ADD COLUMN description TEXT NOT NULL;
ALTER TABLE clothing_item ADD COLUMN type TEXT NOT NULL;
ALTER TABLE clothing_item ADD COLUMN color TEXT NOT NULL;
ALTER TABLE clothing_item ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT now();
