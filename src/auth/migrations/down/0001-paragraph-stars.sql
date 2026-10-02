-- MANUAL EMERGENCY ROLLBACK ONLY. Never run by the deploy runner. Destroys all stars.
-- Run by hand inside a transaction, then delete the ledger row for 0001 so it can re-apply:
--   DELETE FROM public.deploy_ledger WHERE kind = 'migration' AND filename = '0001-paragraph-stars.sql';
-- After running, send: NOTIFY pgrst, 'reload schema';

DROP TABLE IF EXISTS public.paragraph_stars;          -- drops its trigger, policies, index, constraints
DROP FUNCTION IF EXISTS public.paragraph_stars_cap();
