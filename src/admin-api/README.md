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
   exists, so `init.sql` won't re-run):
   ```bash
   docker compose -f ../auth/docker-compose.yml exec auth-db \
     psql -U gotrue -d gotrue -v ON_ERROR_STOP=1 <<'SQL'
   DO $$ BEGIN
     IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin_api') THEN
       CREATE ROLE admin_api LOGIN PASSWORD 'PUT_ADMIN_API_DB_PASSWORD_HERE' BYPASSRLS;
     END IF;
   END $$;
   GRANT USAGE ON SCHEMA public, auth TO admin_api;
   GRANT SELECT ON public.paragraph_reports TO admin_api;
   GRANT SELECT ON auth.users TO admin_api;
   SQL
   ```
3. Build & start: `docker compose -f ../auth/docker-compose.yml up -d --build admin-api`
4. Add a proxy host in Nginx Proxy Manager: `admin.bashkirtseff.org -> admin-api:8080`
5. Set `PUBLIC_ADMIN_API_URL=https://admin.bashkirtseff.org` in `../frontend/.env`
   and rebuild the frontend.

## Local dev

```bash
npm install
cp .env.example .env   # point DATABASE_URL at a reachable Postgres, set JWT_SECRET
npm run dev            # http://localhost:8080
```
