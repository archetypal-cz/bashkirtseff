-- GoTrue Auth Database Initialization
-- This runs automatically on first `docker compose up` (before GoTrue starts).
-- GoTrue creates its own auth schema/tables via migrations on startup.
-- We add: prerequisites for GoTrue, roles for PostgREST, reports table, and RLS.

-- =============================================================
-- 0. Prerequisites for GoTrue migrations
-- =============================================================

CREATE SCHEMA IF NOT EXISTS auth;
ALTER ROLE gotrue SET search_path TO auth, public;

-- =============================================================
-- 1. Roles for PostgREST
-- =============================================================
-- authenticator: low-privilege login role for PostgREST (NOINHERIT so it
-- must SET ROLE to anon/authenticated — RLS is always enforced).

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD current_setting('app.postgrest_password');
  END IF;
END
$$;

GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;

-- =============================================================
-- 2. Paragraph Reports Table
-- =============================================================

CREATE TABLE IF NOT EXISTS paragraph_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
  paragraph_id TEXT NOT NULL,
  language TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  reason TEXT NOT NULL,
  custom_reason TEXT,
  highlighted_text TEXT,
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'fixed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_paragraph ON paragraph_reports(paragraph_id, language);
CREATE INDEX IF NOT EXISTS idx_reports_status ON paragraph_reports(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_reports_user ON paragraph_reports(user_id);

-- =============================================================
-- 3. Row-Level Security
-- =============================================================

ALTER TABLE paragraph_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own reports
CREATE POLICY "Users can create reports"
  ON paragraph_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    -- The JWT 'sub' claim must match the user_id
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid = user_id
  );

-- Authenticated users can view their own reports
CREATE POLICY "Users can view own reports"
  ON paragraph_reports FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid = user_id
  );

-- Anon users cannot access reports
-- (no policy = no access when RLS is enabled)

-- =============================================================
-- 4. Grant table access to PostgREST roles
-- =============================================================

GRANT SELECT, INSERT ON paragraph_reports TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anon needs SELECT so PostgREST can discover the table in its schema cache.
-- RLS still blocks actual data access (no policy = no rows returned).
GRANT SELECT ON paragraph_reports TO anon;

-- =============================================================
-- 5. Read-only role for the admin-api service
-- =============================================================
-- admin-api (the admin dashboard backend) reads aggregate stats only.
-- SELECT-only, plus a permissive RLS policy so it can read ALL reports
-- (RLS otherwise hides rows belonging to other users). We use a policy
-- rather than BYPASSRLS because the `gotrue` role has CREATEROLE but not
-- SUPERUSER, and only a superuser can grant BYPASSRLS. This role is never
-- exposed to the browser — only the admin-api container connects with it.
-- NOTE: this section only auto-runs on a fresh DB volume. On an existing
-- database apply it manually (see ../admin-api/README.md).

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin_api') THEN
    CREATE ROLE admin_api LOGIN PASSWORD current_setting('app.admin_api_password');
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public, auth TO admin_api;
GRANT SELECT ON public.paragraph_reports TO admin_api;

-- admin_api is neither 'authenticated' nor 'anon', so the policies above
-- never match it; this one lets it read every report.
DROP POLICY IF EXISTS "admin_api reads all reports" ON paragraph_reports;
CREATE POLICY "admin_api reads all reports"
  ON paragraph_reports FOR SELECT
  TO admin_api
  USING (true);

-- auth.users is created by GoTrue's migrations on FIRST STARTUP, so it does
-- not exist yet at initdb time and cannot be granted here. GoTrue also enables
-- RLS on it, so admin_api needs both a SELECT grant and a read-all policy —
-- applied manually after first startup (see ../admin-api/README.md):
--   GRANT SELECT ON auth.users TO admin_api;
--   CREATE POLICY "admin_api reads all users"
--     ON auth.users FOR SELECT TO admin_api USING (true);
