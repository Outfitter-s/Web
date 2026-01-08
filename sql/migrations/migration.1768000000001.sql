-- Migration created at a point in the time

UPDATE clothing_item SET pattern = 'solid' WHERE pattern IS NULL;

ALTER TABLE clothing_item ALTER COLUMN pattern SET DEFAULT 'solid';
