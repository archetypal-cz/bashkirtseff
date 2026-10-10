-- deploy-ledger: renumber v1
-- rebuild-carnet 008 (2026-10-10): remap reader reports and stars to the new paragraph IDs.
-- Applied automatically by the deploy job (src/auth/db-deploy.sh); do not run by hand.
-- Never edit a committed script (a changed sha256 fails the deploy): write a follow-up script instead.
-- Emergency manual run only via `psql -1` on stdin (no BEGIN/COMMIT in this file).
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
-- Stars move through a temp table; a star that lands on an ID the user already starred is dropped (one star per user and paragraph).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
CREATE TEMP TABLE renumber_map_8b6f577d (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL);
INSERT INTO renumber_map_8b6f577d (old_id, new_id) VALUES
  ('008.0307', '008.0309'),
  ('008.0308', '008.0310');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_map_8b6f577d m WHERE r.paragraph_id = m.old_id;
CREATE TEMP TABLE moved_stars_8b6f577d AS
  SELECT s.id, s.user_id, m.new_id, s.language, s.commit_hash, s.created_at
  FROM paragraph_stars s JOIN renumber_map_8b6f577d m ON s.paragraph_id = m.old_id;
DELETE FROM paragraph_stars s USING renumber_map_8b6f577d m WHERE s.paragraph_id = m.old_id;
INSERT INTO paragraph_stars (id, user_id, paragraph_id, language, commit_hash, created_at)
  SELECT id, user_id, new_id, language, commit_hash, created_at FROM moved_stars_8b6f577d
  ON CONFLICT (user_id, paragraph_id) DO NOTHING;
DROP TABLE renumber_map_8b6f577d, moved_stars_8b6f577d;
