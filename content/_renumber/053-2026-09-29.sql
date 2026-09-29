-- rebuild-carnet 053 (2026-09-29): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_053 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_053 (old_id, new_id) VALUES
  ('053.0079', '053.0078'),
  ('053.0080', '053.0079'),
  ('053.0081', '053.0080'),
  ('053.0082', '053.0081'),
  ('053.0083', '053.0082'),
  ('053.0084', '053.0083'),
  ('053.0085', '053.0084'),
  ('053.0086', '053.0085'),
  ('053.0087', '053.0086'),
  ('053.0088', '053.0087'),
  ('053.0078', '053.0088');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_053 m WHERE r.paragraph_id = m.old_id;
COMMIT;
