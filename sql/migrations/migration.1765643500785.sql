-- Migration created at 2025-12-13T16:31:40.785Z

CREATE TYPE outfit_item_position AS ENUM ('pants', 'sweater', 'dress', 'jacket', 'shirt', 'shoes', 'accessory');

ALTER TABLE outfit DROP COLUMN name;
ALTER TABLE outfit_clothing_items ADD COLUMN position outfit_item_position NOT NULL DEFAULT 'shirt';
