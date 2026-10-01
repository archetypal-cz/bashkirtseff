-- rebuild-carnet 031 (2026-10-01): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_031 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_031 (old_id, new_id) VALUES
  ('031.0327', '031.0326'),
  ('031.0328', '031.0327'),
  ('031.0329', '031.0328'),
  ('031.0330', '031.0329'),
  ('031.0331', '031.0330'),
  ('031.0332', '031.0331'),
  ('031.0333', '031.0332'),
  ('031.0334', '031.0333'),
  ('031.0335', '031.0334'),
  ('031.0336', '031.0335'),
  ('031.0337', '031.0336'),
  ('031.0338', '031.0337'),
  ('031.0339', '031.0338'),
  ('031.0340', '031.0339'),
  ('031.0341', '031.0340'),
  ('031.0342', '031.0341'),
  ('031.0343', '031.0342'),
  ('031.0344', '031.0343'),
  ('031.0345', '031.0344'),
  ('031.0346', '031.0345'),
  ('031.0347', '031.0346'),
  ('031.0348', '031.0347'),
  ('031.0349', '031.0348'),
  ('031.0350', '031.0349'),
  ('031.0351', '031.0350'),
  ('031.0352', '031.0351'),
  ('031.0353', '031.0352'),
  ('031.0354', '031.0353'),
  ('031.0355', '031.0354'),
  ('031.0356', '031.0355'),
  ('031.0326', '031.DROPPED-0326');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_031 m WHERE r.paragraph_id = m.old_id;
COMMIT;
