-- rebuild-carnet 055 (2026-09-30): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_055 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_055 (old_id, new_id) VALUES
  ('055.0263', '055.0262'),
  ('055.0264', '055.0263'),
  ('055.0265', '055.0264'),
  ('055.0266', '055.0265'),
  ('055.0262', '055.0266');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_055 m WHERE r.paragraph_id = m.old_id;
COMMIT;
