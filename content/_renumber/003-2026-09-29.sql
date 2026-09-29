-- rebuild-carnet 003 (2026-09-29): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_003 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_003 (old_id, new_id) VALUES
  ('003.0308', '003.0310'),
  ('003.0309', '003.0311'),
  ('003.0310', '003.0312'),
  ('003.0311', '003.0313'),
  ('003.0312', '003.0314'),
  ('003.0313', '003.0315'),
  ('003.0314', '003.0316'),
  ('003.0315', '003.0317');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_003 m WHERE r.paragraph_id = m.old_id;
COMMIT;
