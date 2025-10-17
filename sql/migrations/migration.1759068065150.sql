CREATE TABLE clothing_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE outfit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outfit_clothing_items (
  outfit_id UUID NOT NULL REFERENCES outfit (id) ON DELETE CASCADE,
  clothing_item_id UUID NOT NULL REFERENCES clothing_item (id) ON DELETE CASCADE,
  PRIMARY KEY (outfit_id, clothing_item_id)
);
