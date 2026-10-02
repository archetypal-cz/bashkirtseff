#!/usr/bin/env bash
# DB test harness: postgres:15-alpine + PostgREST v12.2.8 on a private docker network.
# Usage: DOCKER="sudo docker" src/auth/test/run.sh [test-name-glob ...]   (just auth-test)
# Runs every src/auth/test/*.test.sh; each gets AUTH_DB_CONTAINER, PGRST_URL, JWT_SECRET, DOCKER exported.
# The postgres container name is random, but `docker exec -i $AUTH_DB_CONTAINER psql -U gotrue -d gotrue`
# works exactly as `docker exec -i auth-db psql ...` does on prod. Everything is removed on exit.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
export DOCKER="${DOCKER:-docker}"
RUN_ID="$(openssl rand -hex 4)"
export AUTH_TEST_RUN_ID="$RUN_ID"
export AUTH_DB_CONTAINER="authtest-db-$RUN_ID"
PGRST_CONTAINER="authtest-pgrst-$RUN_ID"
export CURL_CONTAINER="authtest-curl-$RUN_ID"
NET="authtest-net-$RUN_ID"
export JWT_SECRET="test-jwt-secret-$(openssl rand -hex 24)"
DB_PASS="$(openssl rand -hex 12)"
PGRST_PASS="$(openssl rand -hex 12)"
ADMIN_PASS="$(openssl rand -hex 12)"
# shellcheck source=lib.sh
# (lib.sh has its own source guard so test files can also be run directly, outside run.sh)
. "$HERE/lib.sh" || exit 2
child=""

# Resolve the test-name globs BEFORE starting any container, so a typo fails fast.
shopt -s nullglob
[ $# -gt 0 ] || set -- '*'
tests=(); nomatch=0
for g in "$@"; do
  matched=0
  for t in "$HERE"/$g.test.sh; do
    [ -e "$t" ] || continue   # a pattern without wildcards is returned literally
    matched=1
    case " ${tests[*]-} " in *" $t "*) ;; *) tests+=("$t");; esac
  done
  [ "$matched" = 1 ] || { echo "no test matches '$g'" >&2; nomatch=1; }
done
[ "$nomatch" = 0 ] || exit 1
[ "${#tests[@]}" -gt 0 ] || { echo "no tests found" >&2; exit 1; }

cleanup() {
  trap '' INT TERM   # a second signal must not kill the cleanup half-way
  [ -n "$child" ] && kill "$child" 2>/dev/null
  # shellcheck disable=SC2086
  { $DOCKER rm -f "$CURL_CONTAINER" "$PGRST_CONTAINER" "$AUTH_DB_CONTAINER"; $DOCKER network rm "$NET"; } >/dev/null 2>&1
}
trap cleanup EXIT
trap 'echo "interrupted" >&2; exit 130' INT
trap 'echo "terminated" >&2; exit 143' TERM

# shellcheck disable=SC2086
D() { $DOCKER "$@"; }

echo "== starting stack $RUN_ID"
D network create "$NET" >/dev/null || exit 1
D run -d --name "$AUTH_DB_CONTAINER" --network "$NET" --network-alias auth-db \
  -e POSTGRES_DB=gotrue -e POSTGRES_USER=gotrue -e POSTGRES_PASSWORD="$DB_PASS" \
  postgres:15-alpine >/dev/null || exit 1

# Readiness: the postgres image restarts once after initdb, so require two consecutive successes.
ok=0
for _ in $(seq 1 60); do
  # TCP check: the unix socket also answers on the image's temporary initdb server.
  if D exec "$AUTH_DB_CONTAINER" pg_isready -h 127.0.0.1 -U gotrue -d gotrue >/dev/null 2>&1; then
    ok=$((ok+1)); [ "$ok" -ge 2 ] && break
  else ok=0; fi
  sleep 1
done
[ "$ok" -ge 2 ] || { echo "postgres did not become ready" >&2; D logs "$AUTH_DB_CONTAINER" 2>&1 | tail -20 >&2; exit 1; }

# Stub what GoTrue creates on first start, then run the real init.sql (prod mirror).
echo "== loading stub auth schema + init.sql"
{
  cat <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
SQL
  # init.sql's `PASSWORD current_setting('app.…')` is not valid SQL (CREATE ROLE needs a literal),
  # so the harness substitutes literals. init.sql itself is left untouched.
  sed -e "s/current_setting('app.postgrest_password')/'$PGRST_PASS'/" \
      -e "s/current_setting('app.admin_api_password')/'$ADMIN_PASS'/" "$HERE/../init.sql"
} | D exec -i "$AUTH_DB_CONTAINER" psql -U gotrue -d gotrue -v ON_ERROR_STOP=1 -q >/dev/null \
  || { echo "init.sql failed" >&2; exit 1; }

# Pristine template (made before PostgREST connects, CREATE DATABASE ... TEMPLATE needs no other sessions): every test file starts from a copy of this (db_reset in lib.sh).
# Roles are cluster-wide and survive a DB drop, so remember the highest role oid after init;
# db_reset drops any role created later.
$DOCKER exec -i "$AUTH_DB_CONTAINER" psql -U gotrue -d postgres -v ON_ERROR_STOP=1 -q \
  -c "CREATE DATABASE gotrue_tpl TEMPLATE gotrue" >/dev/null \
  || { echo "template database creation failed" >&2; exit 1; }
AUTH_ROLE_OID_MAX="$($DOCKER exec "$AUTH_DB_CONTAINER" psql -U gotrue -d postgres -Atc 'select max(oid::text::bigint) from pg_roles')"
export AUTH_ROLE_OID_MAX
D run -d --name "$PGRST_CONTAINER" --network "$NET" --network-alias pgrst \
  -e PGRST_DB_URI="postgresql://authenticator:$PGRST_PASS@auth-db:5432/gotrue" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$JWT_SECRET" -e PGRST_JWT_AUD=authenticated -e PGRST_MAX_ROWS=1000 \
  postgrest/postgrest:v12.2.8 >/dev/null || exit 1

# The daemon's published ports are not always reachable from the caller (remote/sibling docker),
# so HTTP goes through a curl sidecar on the private network: PGRST_URL is valid inside it only.
export PGRST_URL="http://pgrst:3000"
D run -d --name "$CURL_CONTAINER" --network "$NET" --entrypoint sleep curlimages/curl:8.10.1 infinity >/dev/null || exit 1
ok=0
for _ in $(seq 1 60); do
  code="$(D exec "$CURL_CONTAINER" curl -s -m 3 -o /dev/null -w '%{http_code}' "$PGRST_URL/" 2>/dev/null)"
  [ "$code" = 200 ] && { ok=1; break; }  # 503 = schema cache still loading
  sleep 1
done
if [ "$ok" != 1 ]; then
  echo "PostgREST did not become ready (HTTP status mapping untested)" >&2
  D logs "$PGRST_CONTAINER" 2>&1 | tail -20 >&2; exit 1
fi
echo "== ready: db=$AUTH_DB_CONTAINER pgrst=$PGRST_CONTAINER"

pass=0; fail=0; failed=()
for t in "${tests[@]}"; do
  echo "== $(basename "$t")"
  db_reset || { echo "db_reset failed" >&2; fail=$((fail+1)); failed+=("$(basename "$t") (reset)"); continue; }
  bash "$t" & child=$!
  if wait "$child"; then pass=$((pass+1)); else fail=$((fail+1)); failed+=("$(basename "$t")"); fi
  child=""
done
echo "== $pass test file(s) passed, $fail failed"
[ "$fail" -eq 0 ] || { printf 'FAILED: %s\n' "${failed[@]}"; exit 1; }
