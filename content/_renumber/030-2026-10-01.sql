-- rebuild-carnet 030 (2026-10-01): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_030 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_030 (old_id, new_id) VALUES
  ('030.0456', '030.0457'),
  ('030.0457', '030.0458'),
  ('030.0458', '030.0459');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_030 m WHERE r.paragraph_id = m.old_id;
COMMIT;
