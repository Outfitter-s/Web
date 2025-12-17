-- Migration created at 2025-12-17T08:58:12.602Z

ALTER TABLE outfit_clothing_items DROP COLUMN position;
DROP TYPE outfit_item_position;

ALTER TABLE followers DROP COLUMN id;
ALTER TABLE followers ADD PRIMARY KEY (follower_id, following_id);
