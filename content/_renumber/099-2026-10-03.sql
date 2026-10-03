-- deploy-ledger: renumber v1
-- rebuild-carnet 099 (2026-10-03): remap reader reports and stars to the new paragraph IDs.
-- Applied automatically by the deploy job (src/auth/db-deploy.sh); do not run by hand.
-- Never edit a committed script (a changed sha256 fails the deploy): write a follow-up script instead.
-- Emergency manual run only via `psql -1` on stdin (no BEGIN/COMMIT in this file).
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
-- Stars move through a temp table; a star that lands on an ID the user already starred is dropped (one star per user and paragraph).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
CREATE TEMP TABLE renumber_map_35b04c34 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL);
INSERT INTO renumber_map_35b04c34 (old_id, new_id) VALUES
  ('099.0546', '099.0561'),
  ('099.0547', '099.0570'),
  ('099.0548', '099.0571'),
  ('099.0549', '099.0572'),
  ('099.0550', '099.0573'),
  ('099.0551', '099.0574'),
  ('099.0552', '099.0575'),
  ('099.0553', '099.0576'),
  ('099.0554', '099.0577'),
  ('099.0555', '099.0578'),
  ('099.0556', '099.0579'),
  ('099.0557', '099.0580'),
  ('099.0558', '099.0581'),
  ('099.0559', '099.0582'),
  ('099.0560', '099.0583'),
  ('099.0561', '099.0584'),
  ('099.0562', '099.0585'),
  ('099.0563', '099.0586'),
  ('099.0564', '099.0587'),
  ('099.0565', '099.0588'),
  ('099.0566', '099.0589'),
  ('099.0567', '099.0590'),
  ('099.0568', '099.0591'),
  ('099.0569', '099.0592'),
  ('099.0570', '099.0593'),
  ('099.0571', '099.0594'),
  ('099.0572', '099.0595'),
  ('099.0573', '099.0596'),
  ('099.0574', '099.0597'),
  ('099.0575', '099.0598'),
  ('099.0576', '099.0599'),
  ('099.0577', '099.0600'),
  ('099.0578', '099.0601'),
  ('099.0579', '099.0602'),
  ('099.0580', '099.0603'),
  ('099.0581', '099.0604'),
  ('099.0582', '099.0605'),
  ('099.0583', '099.0606'),
  ('099.0584', '099.0607'),
  ('099.0585', '099.0608'),
  ('099.0586', '099.0609'),
  ('099.0587', '099.0610'),
  ('099.0588', '099.0611'),
  ('099.0589', '099.0612'),
  ('099.0590', '099.0613'),
  ('099.0591', '099.0614'),
  ('099.0592', '099.0615'),
  ('099.0593', '099.0616'),
  ('099.0594', '099.0617'),
  ('099.0595', '099.0618'),
  ('099.0596', '099.0619'),
  ('099.0597', '099.0620'),
  ('099.0598', '099.0621'),
  ('099.0599', '099.0622'),
  ('099.0600', '099.0623'),
  ('099.0601', '099.0624'),
  ('099.0602', '099.0625'),
  ('099.0603', '099.0626'),
  ('099.0604', '099.0627'),
  ('099.0605', '099.0628');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_map_35b04c34 m WHERE r.paragraph_id = m.old_id;
CREATE TEMP TABLE moved_stars_35b04c34 AS
  SELECT s.id, s.user_id, m.new_id, s.language, s.commit_hash, s.created_at
  FROM paragraph_stars s JOIN renumber_map_35b04c34 m ON s.paragraph_id = m.old_id;
DELETE FROM paragraph_stars s USING renumber_map_35b04c34 m WHERE s.paragraph_id = m.old_id;
INSERT INTO paragraph_stars (id, user_id, paragraph_id, language, commit_hash, created_at)
  SELECT id, user_id, new_id, language, commit_hash, created_at FROM moved_stars_35b04c34
  ON CONFLICT (user_id, paragraph_id) DO NOTHING;
DROP TABLE renumber_map_35b04c34, moved_stars_35b04c34;
