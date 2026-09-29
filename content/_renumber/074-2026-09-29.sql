-- rebuild-carnet 074 (2026-09-29): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_074 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_074 (old_id, new_id) VALUES
  ('074.0278', '074.0277'),
  ('074.0279', '074.0278'),
  ('074.0280', '074.0279'),
  ('074.0281', '074.0280'),
  ('074.0282', '074.0281'),
  ('074.0283', '074.0282'),
  ('074.0277', '074.0283');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_074 m WHERE r.paragraph_id = m.old_id;
COMMIT;
