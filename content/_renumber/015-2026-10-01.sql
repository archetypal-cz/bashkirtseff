-- rebuild-carnet 015 (2026-10-01): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_015 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_015 (old_id, new_id) VALUES
  ('015.0321', '015.0320'),
  ('015.0322', '015.0321'),
  ('015.0323', '015.0322'),
  ('015.0324', '015.0323'),
  ('015.0325', '015.0324'),
  ('015.0326', '015.0325'),
  ('015.0327', '015.0326'),
  ('015.0328', '015.0327'),
  ('015.0329', '015.0328'),
  ('015.0330', '015.0329'),
  ('015.0331', '015.0330'),
  ('015.0332', '015.0331'),
  ('015.0333', '015.0332'),
  ('015.0334', '015.0333'),
  ('015.0335', '015.0334'),
  ('015.0336', '015.0335'),
  ('015.0337', '015.0336'),
  ('015.0320', '015.DROPPED-0320');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_015 m WHERE r.paragraph_id = m.old_id;
COMMIT;
