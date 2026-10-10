-- deploy-ledger: renumber v1
-- rebuild-carnet 037 (2026-10-10): remap reader reports and stars to the new paragraph IDs.
-- Applied automatically by the deploy job (src/auth/db-deploy.sh); do not run by hand.
-- Never edit a committed script (a changed sha256 fails the deploy): write a follow-up script instead.
-- Emergency manual run only via `psql -1` on stdin (no BEGIN/COMMIT in this file).
-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.
-- Stars move through a temp table; a star that lands on an ID the user already starred is dropped (one star per user and paragraph).
-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.
CREATE TEMP TABLE renumber_map_5e55f3a1 (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL);
INSERT INTO renumber_map_5e55f3a1 (old_id, new_id) VALUES
  ('037.0463', '037.0464'),
  ('037.0464', '037.0465'),
  ('037.0465', '037.0466'),
  ('037.0466', '037.0467'),
  ('037.0467', '037.0468'),
  ('037.0468', '037.0469'),
  ('037.0469', '037.0470'),
  ('037.0470', '037.0471'),
  ('037.0471', '037.0472'),
  ('037.0472', '037.0473'),
  ('037.0473', '037.0474'),
  ('037.0474', '037.0475'),
  ('037.0475', '037.0476'),
  ('037.0476', '037.0477'),
  ('037.0477', '037.0478'),
  ('037.0478', '037.0479'),
  ('037.0479', '037.0480'),
  ('037.0480', '037.0481'),
  ('037.0481', '037.0482'),
  ('037.0482', '037.0483'),
  ('037.0483', '037.0484'),
  ('037.0484', '037.0485'),
  ('037.0485', '037.0486'),
  ('037.0486', '037.0487'),
  ('037.0487', '037.0488'),
  ('037.0488', '037.0489'),
  ('037.0489', '037.0490'),
  ('037.0490', '037.0491'),
  ('037.0491', '037.0492'),
  ('037.0492', '037.0493'),
  ('037.0493', '037.0494'),
  ('037.0494', '037.0495'),
  ('037.0495', '037.0496'),
  ('037.0496', '037.0497'),
  ('037.0497', '037.0498'),
  ('037.0498', '037.0499'),
  ('037.0499', '037.0500'),
  ('037.0500', '037.0501'),
  ('037.0501', '037.0502'),
  ('037.0502', '037.0503'),
  ('037.0503', '037.0504'),
  ('037.0504', '037.0505'),
  ('037.0505', '037.0506'),
  ('037.0506', '037.0507'),
  ('037.0507', '037.0508'),
  ('037.0508', '037.0509'),
  ('037.0509', '037.0510'),
  ('037.0510', '037.0511'),
  ('037.0511', '037.0512'),
  ('037.0512', '037.0513'),
  ('037.0513', '037.0514'),
  ('037.0514', '037.0515'),
  ('037.0515', '037.0516'),
  ('037.0516', '037.0517'),
  ('037.0517', '037.0518'),
  ('037.0518', '037.0519'),
  ('037.0519', '037.0520'),
  ('037.0520', '037.0521'),
  ('037.0521', '037.0522'),
  ('037.0522', '037.0523'),
  ('037.0523', '037.0524'),
  ('037.0524', '037.0525'),
  ('037.0525', '037.0526'),
  ('037.0526', '037.0527'),
  ('037.0527', '037.0528'),
  ('037.0528', '037.0529'),
  ('037.0529', '037.0530'),
  ('037.0530', '037.0531'),
  ('037.0531', '037.0532'),
  ('037.0532', '037.0533');
UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_map_5e55f3a1 m WHERE r.paragraph_id = m.old_id;
CREATE TEMP TABLE moved_stars_5e55f3a1 AS
  SELECT s.id, s.user_id, m.new_id, s.language, s.commit_hash, s.created_at
  FROM paragraph_stars s JOIN renumber_map_5e55f3a1 m ON s.paragraph_id = m.old_id;
DELETE FROM paragraph_stars s USING renumber_map_5e55f3a1 m WHERE s.paragraph_id = m.old_id;
INSERT INTO paragraph_stars (id, user_id, paragraph_id, language, commit_hash, created_at)
  SELECT id, user_id, new_id, language, commit_hash, created_at FROM moved_stars_5e55f3a1
  ON CONFLICT (user_id, paragraph_id) DO NOTHING;
DROP TABLE renumber_map_5e55f3a1, moved_stars_5e55f3a1;
