-- GoTrue Auth Database Initialization
-- This runs automatically on first `docker compose up` (before GoTrue starts).
-- GoTrue creates its own auth schema/tables via migrations on startup.
-- We add: prerequisites for GoTrue, roles for PostgREST, reports table, and RLS.

-- =============================================================
-- 0. Prerequisites for GoTrue migrations
-- =============================================================
-- GoTrue expects an 'auth' schema and a 'postgres' superuser role.
-- The DB user (gotrue) also needs superuser for extension creation.

CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres SUPERUSER LOGIN;
  END IF;
END
$$;

ALTER ROLE gotrue SUPERUSER;
ALTER ROLE gotrue SET search_path TO auth, public;

-- =============================================================
-- 1. Roles for PostgREST (anon = unauthenticated, authenticated = logged in)
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

-- Grant usage to PostgREST roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

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

-- Anon can read the health check (optional)
-- No table access for anon by default.
