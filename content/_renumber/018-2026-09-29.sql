-- rebuild-carnet 018 (2026-09-29): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_018 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_018 (old_id, new_id) VALUES
  ('018.0350', '018.0349'),
  ('018.0351', '018.0350'),
  ('018.0352', '018.0351'),
  ('018.0353', '018.0352'),
  ('018.0354', '018.0353'),
  ('018.0355', '018.0354'),
  ('018.0356', '018.0355'),
  ('018.0357', '018.0356'),
  ('018.0358', '018.0357'),
  ('018.0359', '018.0358'),
  ('018.0360', '018.0359'),
  ('018.0361', '018.0360'),
  ('018.0362', '018.0361'),
  ('018.0363', '018.0362'),
  ('018.0364', '018.0363'),
  ('018.0365', '018.0364'),
  ('018.0366', '018.0365'),
  ('018.0367', '018.0366'),
  ('018.0368', '018.0367'),
  ('018.0369', '018.0368'),
  ('018.0370', '018.0369'),
  ('018.0349', '018.DROPPED-0349');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_018 m WHERE r.paragraph_id = m.old_id;
COMMIT;
