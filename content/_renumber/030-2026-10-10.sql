-- deploy-ledger: renumber v1
-- rebuild-carnet 030 (2026-10-10): remap reader reports and stars to the new paragraph IDs.
-- Applied automatically by the deploy job (src/auth/db-deploy.sh); do not run by hand.
-- Never edit a committed script (a changed sha256 fails the deploy): write a follow-up script instead.
-- Emergency manual run only via `psql -1` on stdin (no BEGIN/COMMIT in this file).
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
-- Stars move through a temp table; a star that lands on an ID the user already starred is dropped (one star per user and paragraph).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
CREATE TEMP TABLE renumber_map_1086abd4 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL);
INSERT INTO renumber_map_1086abd4 (old_id, new_id) VALUES
  ('030.0243', '030.0238'),
  ('030.0244', '030.0239'),
  ('030.0245', '030.0240'),
  ('030.0246', '030.0241'),
  ('030.0247', '030.0242'),
  ('030.0248', '030.0243'),
  ('030.0249', '030.0244'),
  ('030.0250', '030.0245'),
  ('030.0238', '030.0246'),
  ('030.0239', '030.0247'),
  ('030.0240', '030.0248'),
  ('030.0241', '030.0249'),
  ('030.0242', '030.0250');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_map_1086abd4 m WHERE r.paragraph_id = m.old_id;
CREATE TEMP TABLE moved_stars_1086abd4 AS
  SELECT s.id, s.user_id, m.new_id, s.language, s.commit_hash, s.created_at
  FROM paragraph_stars s JOIN renumber_map_1086abd4 m ON s.paragraph_id = m.old_id;
DELETE FROM paragraph_stars s USING renumber_map_1086abd4 m WHERE s.paragraph_id = m.old_id;
INSERT INTO paragraph_stars (id, user_id, paragraph_id, language, commit_hash, created_at)
  SELECT id, user_id, new_id, language, commit_hash, created_at FROM moved_stars_1086abd4
  ON CONFLICT (user_id, paragraph_id) DO NOTHING;
DROP TABLE renumber_map_1086abd4, moved_stars_1086abd4;
