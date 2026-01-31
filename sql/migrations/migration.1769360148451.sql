-- Migration created at 2026-01-25T16:55:48.451Z

ALTER TABLE reaction DROP CONSTRAINT IF EXISTS reaction_user_id_fkey;

ALTER TABLE reaction
ADD CONSTRAINT reaction_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
