-- rebuild-carnet 071 (2026-10-02): remap reader reports to the new paragraph IDs.
-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
BEGIN;
CREATE TEMP TABLE renumber_071 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO renumber_071 (old_id, new_id) VALUES
  ('071.0588', '071.0587'),
  ('071.0589', '071.0588'),
  ('071.0590', '071.0589'),
  ('071.0591', '071.0590'),
  ('071.0592', '071.0591'),
  ('071.0593', '071.0592'),
  ('071.0595', '071.0593'),
  ('071.0596', '071.0594'),
  ('071.0597', '071.0595'),
  ('071.0598', '071.0596'),
  ('071.0599', '071.0597'),
  ('071.0600', '071.0598'),
  ('071.0601', '071.0599'),
  ('071.0602', '071.0600'),
  ('071.0603', '071.0601'),
  ('071.0604', '071.0602'),
  ('071.0605', '071.0603'),
  ('071.0606', '071.0604'),
  ('071.0607', '071.0605'),
  ('071.0608', '071.0606'),
  ('071.0609', '071.0607'),
  ('071.0610', '071.0608'),
  ('071.0612', '071.0609'),
  ('071.0613', '071.0610'),
  ('071.0614', '071.0611'),
  ('071.0615', '071.0612'),
  ('071.0616', '071.0613'),
  ('071.0617', '071.0614'),
  ('071.0619', '071.0615'),
  ('071.0620', '071.0616'),
  ('071.0621', '071.0617'),
  ('071.0622', '071.0618'),
  ('071.0623', '071.0619'),
  ('071.0624', '071.0620'),
  ('071.0625', '071.0621'),
  ('071.0587', '071.DROPPED-0587'),
  ('071.0594', '071.DROPPED-0594'),
  ('071.0611', '071.DROPPED-0611'),
  ('071.0618', '071.DROPPED-0618'),
  ('071.0626', '071.DROPPED-0626');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_071 m WHERE r.paragraph_id = m.old_id;
COMMIT;
