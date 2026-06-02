# Admin Dashboard — Implementation Plan & Status

Admin-only dashboard at `https://bashkirtseff.org/admin` showing user logins,
new bug reports, and Umami site analytics. Powered by the `admin-api`
microservice (this directory) which holds the privileged secrets the static
frontend cannot.

See architecture & rationale in the commit history and `README.md`.

## Done ✅

### Backend (`src/admin-api/`)
- [x] `admin-api` service: Hono server, `GET /overview` (auth-gated) + `GET /health`.
- [x] JWT verification (shared HS256 `JWT_SECRET`) + `ADMIN_EMAILS` allowlist gate.
- [x] Read-only DB queries: user stats from `auth.users`, report stats from `paragraph_reports`.
- [x] Umami client (API key OR username/password login, token cached), day/7d/30d ranges, degrades to `null` on failure.
- [x] CORS restricted to `bashkirtseff.org` (+ localhost for dev).
- [x] `Dockerfile`, `.env.example`, `README.md`, `tsconfig.json`.

### Auth stack
- [x] `src/auth/init.sql`: SELECT-only `admin_api` role with `BYPASSRLS`.
- [x] `src/auth/docker-compose.yml`: `admin-api` service on `auth-internal` + `nginx_npm_network`.
- [x] `src/auth/.env.example`: documented `ADMIN_API_DB_PASSWORD`, `ADMIN_EMAILS`, `UMAMI_*`.

### Frontend
- [x] `src/pages/admin/index.astro` (noindex) + `components/admin/AdminDashboard.vue` + `lib/admin.ts`.
- [x] States: loading / sign-in / not-authorized / error / ready; reuses existing auth store.
- [x] `BaseLayout.astro`: added reusable `noindex` prop.
- [x] `PUBLIC_ADMIN_API_URL` threaded through Dockerfile / docker-compose / `.env(.example)`.

### Verification
- [x] Backend smoke test: `/health` 200, no token 401, bad token 401, non-admin 403, admin passes gate.
- [x] `astro build` compiles all islands and emits `dist/admin/index.html` with `noindex`.

## To do — deployment (manual, on the deployment host) 🚧

- [ ] Provision Umami read access: set `UMAMI_API_KEY` (or read-only `UMAMI_USERNAME`/`PASSWORD`)
      plus `UMAMI_URL` / `UMAMI_WEBSITE_ID` in `src/auth/.env`. (The frontend gets its
      Umami URL + website ID from GitHub Actions variables; see `.github/workflows/deploy.yml`.)
- [ ] Set `ADMIN_API_DB_PASSWORD` and `ADMIN_EMAILS` in `src/auth/.env`.
- [ ] Create the `admin_api` DB role on the live DB (volume exists, so `init.sql` won't re-run) —
      run the `psql` snippet in `README.md`.
- [ ] Add Nginx Proxy Manager host: `admin.bashkirtseff.org -> admin-api:8080`.
- [ ] Bring up the service: `docker compose -f src/auth/docker-compose.yml up -d --build admin-api`.
- [ ] Redeploy the frontend (so `/admin` ships).
- [ ] Verify end-to-end: sign in as an allowlisted admin account → full dashboard; a non-admin account → "Not authorized".

## Possible follow-ups (not started) 💡

- [ ] "Refresh" button + last-updated indicator on the dashboard.
- [ ] Report breakdown by `reason` and by `language`.
- [ ] Link each open report to its paragraph (`/{lang}/{carnet}/{date}#{paragraph_id}`).
- [ ] Add `admin-api` to deploy automation (currently brought up manually like `auth`/`analytics`).
- [ ] Investigate where `current_setting('app.postgrest_password')` GUC is set — not visible in
      compose; matters only if the auth DB is ever rebuilt from scratch.
