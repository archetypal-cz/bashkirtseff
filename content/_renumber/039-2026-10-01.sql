-- rebuild-carnet 039 (2026-10-01): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_039 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_039 (old_id, new_id) VALUES
  ('039.0295', '039.0294'),
  ('039.0296', '039.0295'),
  ('039.0297', '039.0296'),
  ('039.0298', '039.0297'),
  ('039.0299', '039.0298'),
  ('039.0300', '039.0299'),
  ('039.0301', '039.0300'),
  ('039.0302', '039.0301'),
  ('039.0303', '039.0302'),
  ('039.0304', '039.0303'),
  ('039.0305', '039.0304'),
  ('039.0306', '039.0305'),
  ('039.0307', '039.0306'),
  ('039.0308', '039.0307'),
  ('039.0294', '039.DROPPED-0294');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_039 m WHERE r.paragraph_id = m.old_id;
COMMIT;
