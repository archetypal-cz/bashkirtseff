-- rebuild-carnet 004 (2026-10-01): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_004 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_004 (old_id, new_id) VALUES
  ('004.0388', '004.0387'),
  ('004.0389', '004.0388'),
  ('004.0390', '004.0389'),
  ('004.0387', '004.DROPPED-0387');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_004 m WHERE r.paragraph_id = m.old_id;
COMMIT;
