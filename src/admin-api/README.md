# admin-api

Tiny aggregation service powering the admin-only dashboard at
`https://bashkirtseff.org/admin`. It holds the privileged secrets the static
frontend cannot, and exposes a single protected endpoint.

## What it does

`GET /overview` (requires a GoTrue JWT whose email is in `ADMIN_EMAILS`) returns:

```jsonc
{
  "generatedAt": "2026-06-01T12:00:00.000Z",
  "users":     { "total": 0, "active_1d": 0, "active_7d": 0, "active_30d": 0,
                 "new_1d": 0, "new_7d": 0, "new_30d": 0 },
  "reports":   { "byStatus": { "open": 0, "fixed": 0 }, "open": 0, "total": 0,
                 "recentOpen": [ { "id": "...", "paragraph_id": "002.0145",
                                   "language": "cz", "reason": "typo",
                                   "created_at": "..." } ] },
  "analytics": { "day":  { "pageviews": 0, "visitors": 0, "visits": 0 },
                 "week": { ... }, "month": { ... } }   // or null if Umami is unreachable
}
```

`GET /health` is unauthenticated.

## Data sources

- **Users / reports** — direct read-only SQL against the GoTrue Postgres
  (`auth.users`, `public.paragraph_reports`) via the `admin_api` role
  (SELECT-only, `BYPASSRLS`; created in [`../auth/init.sql`](../auth/init.sql)).
- **Analytics** — the self-hosted Umami HTTP API.

## Setup (production)

The service is defined in [`../auth/docker-compose.yml`](../auth/docker-compose.yml)
because it shares the auth Postgres and `JWT_SECRET`.

1. Fill the new vars in `../auth/.env` (see `../auth/.env.example`):
   `ADMIN_API_DB_PASSWORD`, `ADMIN_EMAILS`, `UMAMI_*`.
2. Create the read-only DB role on the existing database (the volume already
   exists, so `init.sql` won't re-run). Notes:
   - Use `exec -T` because we're piping a heredoc (no TTY).
   - Connect as the **superuser** (`-U postgres`): the `gotrue` role has neither
     `SUPERUSER` nor `CREATEROLE`, so it can't create roles. Confirm the
     superuser's name first with
     `psql -U gotrue -d gotrue -c "SELECT rolname FROM pg_roles WHERE rolsuper"`.
   - We grant read-all via an RLS policy rather than `BYPASSRLS` (only a
     superuser could grant `BYPASSRLS`, and the policy is least-privilege).
   ```bash
   docker compose -f ../auth/docker-compose.yml exec -T auth-db \
     psql -U postgres -d gotrue -v ON_ERROR_STOP=1 <<'SQL'
   DO $$ BEGIN
     IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin_api') THEN
       CREATE ROLE admin_api LOGIN PASSWORD 'PUT_ADMIN_API_DB_PASSWORD_HERE';
     END IF;
   END $$;
   GRANT USAGE ON SCHEMA public, auth TO admin_api;
   GRANT SELECT ON public.paragraph_reports TO admin_api;
   GRANT SELECT ON auth.users TO admin_api;
   DROP POLICY IF EXISTS "admin_api reads all reports" ON public.paragraph_reports;
   CREATE POLICY "admin_api reads all reports"
     ON public.paragraph_reports FOR SELECT TO admin_api USING (true);
   -- GoTrue enables RLS on auth.users too, so admin_api needs a read-all
   -- policy there as well (otherwise the user counts come back 0):
   DROP POLICY IF EXISTS "admin_api reads all users" ON auth.users;
   CREATE POLICY "admin_api reads all users"
     ON auth.users FOR SELECT TO admin_api USING (true);
   SQL
   ```
   (`auth.users` only exists after GoTrue's first startup; if you somehow run
   this before then, re-run just the `auth.users` grant + policy afterwards.)
3. Build & start: `docker compose -f ../auth/docker-compose.yml up -d --build admin-api`
4. Add a proxy host in Nginx Proxy Manager: `admin.bashkirtseff.org -> admin-api:8080`
5. Set `PUBLIC_ADMIN_API_URL=https://admin.bashkirtseff.org` in `../frontend/.env`
   and rebuild the frontend.

## Deleting a user account (privacy / erasure requests)

Run on aretea, from the repo checkout: `cd <repo>/src/admin-api` (all paths
below are relative to it). Deletion goes through the GoTrue admin API, never by
deleting from `auth.users` by hand. Nothing below puts a secret in the repo: the
JWT secret stays in `../auth/.env`.

1. Find the user id (SQL against the auth DB, superuser as in Setup):
   ```bash
   docker compose -f ../auth/docker-compose.yml exec -T auth-db \
     psql -U postgres -d gotrue -c "SELECT id, email FROM auth.users WHERE email = 'reader@example.com'"
   ```
2. Mint a short-lived admin JWT, signed HS256 with `JWT_SECRET` from
   `../auth/.env` (the same secret GoTrue and PostgREST use), claims
   `{"role":"service_role","aud":"authenticated","exp":<now+300>}`. Read only
   `JWT_SECRET` (not the whole env file), inside a subshell:
   ```bash
   TOKEN="$(JWT_SECRET="$(grep '^JWT_SECRET=' ../auth/.env | cut -d= -f2-)" node -e '
     const c=require("crypto"),b=o=>Buffer.from(JSON.stringify(o)).toString("base64url");
     const h=b({alg:"HS256",typ:"JWT"})+"."+b({role:"service_role",aud:"authenticated",exp:Math.floor(Date.now()/1000)+300});
     console.log(h+"."+c.createHmac("sha256",process.env.JWT_SECRET).update(h).digest("base64url"))')"
   ```
   GoTrue (v2.158.1) accepts a token with role `service_role` (or
   `supabase_admin`) on the admin endpoints with no extra configuration; a token
   with role `authenticated` gets 403 `not_admin`.
3. Delete. GoTrue listens on 9999 inside the compose network and the port is not
   published, so call it from that network. The gotrue image has only BusyBox
   `wget` (no `--method=DELETE`) and no `curl`, so use a throwaway curl
   container; the header goes in on stdin so the token is not in process args:
   ```bash
   docker run --rm -i --network nginx_npm_network curlimages/curl \
     -sS -X DELETE -H @- http://gotrue:9999/admin/users/<USER_ID> \
     <<<"Authorization: Bearer $TOKEN"
   ```
   Alternative: host `curl` against the public proxy, same `-H @-` trick:
   `curl -sS -X DELETE -H @- https://auth.bashkirtseff.org/admin/users/<USER_ID> <<<"Authorization: Bearer $TOKEN"`.
   Unset `TOKEN` afterwards.

**What it removes.** `public.paragraph_stars.user_id` has an FK to `auth.users`
with `ON DELETE CASCADE`, so the user's stars disappear with the account.
**`public.paragraph_reports.user_id` has no FK**, so the user's reports are NOT
removed (known gap, out of scope here). If a reader asks for them to go, run
one of these by hand:

```sql
-- anonymise (keeps the report text for the translation fixes)
UPDATE public.paragraph_reports SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id = '<USER_ID>';
-- or delete outright
DELETE FROM public.paragraph_reports WHERE user_id = '<USER_ID>';
```

Note `custom_reason` and `highlighted_text` are free text and may themselves
identify the reader; review them before choosing to keep a report.

**Verify** (all three must return 0 rows / 0):
```sql
SELECT count(*) FROM auth.users WHERE id = '<USER_ID>';
SELECT count(*) FROM public.paragraph_stars WHERE user_id = '<USER_ID>';
SELECT count(*) FROM public.paragraph_reports WHERE user_id = '<USER_ID>';  -- 0 only after the manual step above
```

## Local dev

```bash
npm install
cp .env.example .env   # point DATABASE_URL at a reachable Postgres, set JWT_SECRET
npm run dev            # http://localhost:8080
```
