-- 0001: paragraph stars (reader bookmarks). One star per (user, paragraph), shared across languages.
-- Additive, transaction-safe and idempotent. No BEGIN/COMMIT, no NOTIFY (the runner does both).
-- Everything is schema-qualified: the gotrue role's search_path is "auth, public".

CREATE TABLE IF NOT EXISTS public.paragraph_stars (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL DEFAULT (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
  paragraph_id TEXT NOT NULL CHECK (paragraph_id ~ '^[0-9]{3}\.(DROPPED-)?[0-9]{4}$'),
  language     TEXT NOT NULL CHECK (language IN ('original','cz','uk','en','fr','es')),
  commit_hash  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NOT deferrable: ON CONFLICT (user_id, paragraph_id) needs a plain unique constraint.
  CONSTRAINT paragraph_stars_user_para UNIQUE (user_id, paragraph_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'paragraph_stars_user_fk'
                 AND conrelid = 'public.paragraph_stars'::regclass) THEN
    ALTER TABLE public.paragraph_stars
      ADD CONSTRAINT paragraph_stars_user_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_stars_paragraph ON public.paragraph_stars(paragraph_id);

-- Cap: 1000 stars per user, for API callers only. Scripts running as gotrue (renumber remaps) are exempt.
-- Re-starring an already-starred paragraph passes (ON CONFLICT DO NOTHING then ignores it).
-- A race can overshoot by at most the number of concurrent requests (accepted).
CREATE OR REPLACE FUNCTION public.paragraph_stars_cap() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'authenticated'
     AND NOT EXISTS (SELECT 1 FROM public.paragraph_stars
                     WHERE user_id = NEW.user_id AND paragraph_id = NEW.paragraph_id)
     AND (SELECT count(*) FROM public.paragraph_stars WHERE user_id = NEW.user_id) >= 1000
  THEN
    RAISE EXCEPTION 'star_cap_reached' USING ERRCODE = 'P0001';  -- PostgREST: HTTP 400
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS paragraph_stars_cap ON public.paragraph_stars;
CREATE TRIGGER paragraph_stars_cap
  BEFORE INSERT ON public.paragraph_stars
  FOR EACH ROW EXECUTE FUNCTION public.paragraph_stars_cap();

ALTER TABLE public.paragraph_stars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own stars" ON public.paragraph_stars;
CREATE POLICY "Users can insert own stars" ON public.paragraph_stars
  FOR INSERT TO authenticated
  WITH CHECK ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = user_id);

DROP POLICY IF EXISTS "Users can view own stars" ON public.paragraph_stars;
CREATE POLICY "Users can view own stars" ON public.paragraph_stars
  FOR SELECT TO authenticated
  USING ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = user_id);

DROP POLICY IF EXISTS "Users can delete own stars" ON public.paragraph_stars;
CREATE POLICY "Users can delete own stars" ON public.paragraph_stars
  FOR DELETE TO authenticated
  USING ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = user_id);

-- No UPDATE grant or policy. admin_api: no grant.
GRANT SELECT, INSERT, DELETE ON public.paragraph_stars TO authenticated;
GRANT SELECT ON public.paragraph_stars TO anon;  -- schema cache only; RLS yields no rows for anon
