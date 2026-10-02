#!/usr/bin/env bash
# Helpers for the auth DB test harness. Sourced by run.sh and by every *.test.sh.
# Environment (exported by run.sh): DOCKER, AUTH_TEST_RUN_ID, AUTH_DB_CONTAINER, CURL_CONTAINER (curl sidecar),
# PGRST_URL (reachable from inside CURL_CONTAINER only), JWT_SECRET, AUTH_ROLE_OID_MAX.
# Safety: db_reset force-drops the gotrue database, so this lib refuses to run outside run.sh
# and never defaults AUTH_DB_CONTAINER (prod's container is called auth-db).

DOCKER="${DOCKER:-docker}"
if [ -z "${AUTH_TEST_RUN_ID:-}" ] || [ "${AUTH_DB_CONTAINER:-}" != "authtest-db-$AUTH_TEST_RUN_ID" ]; then
  echo "lib.sh: refusing to run outside the harness (need AUTH_TEST_RUN_ID and AUTH_DB_CONTAINER=authtest-db-<id>, set by run.sh). Use: just auth-test <name>" >&2
  exit 2
fi

# psql exactly as on prod: docker exec -i <container> psql -U gotrue -d gotrue
# shellcheck disable=SC2086
db_psql() { $DOCKER exec -i "$AUTH_DB_CONTAINER" psql -U gotrue -d gotrue -v ON_ERROR_STOP=1 "$@"; }

# Mint an HS256 JWT: jwt <sub> [role] [secret]. aud=authenticated like GoTrue.
b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
jwt() {
  local sub="$1" role="${2:-authenticated}" secret="${3:-$JWT_SECRET}" h p s
  h=$(printf '{"alg":"HS256","typ":"JWT"}' | b64url)
  p=$(printf '{"sub":"%s","role":"%s","aud":"authenticated","exp":%s}' "$sub" "$role" "$(( $(date +%s) + 3600 ))" | b64url)
  s=$(printf '%s.%s' "$h" "$p" | openssl dgst -sha256 -hmac "$secret" -binary | b64url)
  printf '%s.%s.%s' "$h" "$p" "$s"
}

# sql_as <role> <sub|-> "<sql>": run SQL as a PostgREST-like session, one transaction,
# with SET LOCAL ROLE and request.jwt.claims set. Prints tuples only (-At). Use sub "-" for none.
# Fails (non-zero, error on stderr) on SQL error.
sql_as() {
  local role="$1" sub="$2" sql="$3" claims
  if [ "$sub" = "-" ]; then claims="{}"; else claims="{\"sub\":\"$sub\",\"role\":\"$role\"}"; fi
  printf "BEGIN;\nSET LOCAL ROLE %s;\nSELECT set_config('request.jwt.claims', '%s', true) \\\\g /dev/null\n%s\nCOMMIT;\n" \
    "$role" "$claims" "$sql" | db_psql -At -q
}

# sql_su "<sql>": run as the gotrue owner (setup / fixtures).
sql_su() { printf '%s\n' "$1" | db_psql -At -q; }

# http <method> <path> <jwt|-> [json-body] [extra curl args...]
# Sets HTTP_STATUS and HTTP_BODY (also echoes "STATUS BODY").
http() {
  local method="$1" path="$2" tok="$3" body="${4:-}" out
  shift 3; [ $# -gt 0 ] && shift
  local args=(-sS -X "$method" -H 'Content-Type: application/json' -w $'\n%{http_code}')
  [ "$tok" != "-" ] && args+=(-H "Authorization: Bearer $tok")
  [ -n "$body" ] && args+=(--data-raw "$body")
  out=$($DOCKER exec "$CURL_CONTAINER" curl "${args[@]}" "$@" "$PGRST_URL$path") || { HTTP_STATUS=000; HTTP_BODY=""; return 1; }
  HTTP_STATUS="${out##*$'\n'}"
  HTTP_BODY="${out%$'\n'*}"
  printf '%s %s\n' "$HTTP_STATUS" "$HTTP_BODY"
}

# pgrst_reload [path]: NOTIFY PostgREST to reload its schema cache, then poll <path> (default /)
# until the answer is no longer 404/503/PGRST202/PGRST205 (stale or loading cache). 30 s timeout.
# NOTE: for /rpc/* paths the probe POSTs {} and so actually EXECUTES the function (possibly several times).
pgrst_reload() {
  local path="${1:-/}" i
  sql_su "NOTIFY pgrst, 'reload schema';" >/dev/null
  for i in $(seq 1 60); do
    case "$path" in /rpc/*) http POST "$path" - '{}' >/dev/null 2>&1;; *) http GET "$path" - >/dev/null 2>&1;; esac
    case "${HTTP_STATUS:-000}" in 404|503|000) ;; *)
      case "$HTTP_BODY" in *PGRST202*|*PGRST205*) ;; *) return 0;; esac;; esac
    sleep 0.5
  done
  echo "pgrst_reload: $path still $HTTP_STATUS after 30s" >&2; return 1
}

# db_reset: restore the gotrue database from the pristine template (gotrue_tpl, made by run.sh
# after init) and drop roles created since, then wait until PostgREST serves 200 on / again.
# run.sh calls it before every test file; call it between scenarios inside a file.
# Caveat: only roles CREATED after init are dropped; changes to pre-existing roles (ALTER ROLE,
# GRANT ... role memberships) are cluster-wide and persist across files.
db_reset() {
  local roles r
  # never DROP unless the pristine template exists
  # shellcheck disable=SC2086
  [ "$($DOCKER exec "$AUTH_DB_CONTAINER" psql -U gotrue -d postgres -Atc "select 1 from pg_database where datname='gotrue_tpl'")" = 1 ] \
    || { echo "db_reset: template gotrue_tpl missing, refusing to drop gotrue" >&2; return 1; }
  # shellcheck disable=SC2086
  $DOCKER exec -i "$AUTH_DB_CONTAINER" psql -U gotrue -d postgres -v ON_ERROR_STOP=1 -q >/dev/null <<'SQL' || return 1
DROP DATABASE IF EXISTS gotrue WITH (FORCE);
CREATE DATABASE gotrue TEMPLATE gotrue_tpl;
SQL
  if [ -n "${AUTH_ROLE_OID_MAX:-}" ]; then
    # shellcheck disable=SC2086
    roles="$($DOCKER exec "$AUTH_DB_CONTAINER" psql -U gotrue -d postgres -Atc "select rolname from pg_roles where oid::text::bigint > $AUTH_ROLE_OID_MAX")" || return 1
    for r in $roles; do
      # shellcheck disable=SC2086
      $DOCKER exec "$AUTH_DB_CONTAINER" psql -U gotrue -d postgres -qc "DROP ROLE \"$r\"" >/dev/null || return 1
    done
  fi
  local i code
  for i in $(seq 1 60); do
    sql_su "NOTIFY pgrst, 'reload schema';" >/dev/null 2>&1
    http GET / - >/dev/null 2>&1; code="${HTTP_STATUS:-000}"
    [ "$code" = 200 ] && return 0
    sleep 0.5
  done
  echo "db_reset: PostgREST not 200 after 30s (last $code)" >&2; return 1
}

# Assertions. Counters are per test process; the process exits non-zero if any failed (see test_done).
T_PASS=0; T_FAIL=0
assert_eq() { # <expected> <actual> <label>
  if [ "$1" = "$2" ]; then T_PASS=$((T_PASS+1)); echo "  ok   $3"
  else T_FAIL=$((T_FAIL+1)); echo "  FAIL $3"; echo "       expected: $1"; echo "       actual:   $2"; fi
}
assert_contains() { # <needle> <haystack> <label>
  case "$2" in *"$1"*) T_PASS=$((T_PASS+1)); echo "  ok   $3";;
    *) T_FAIL=$((T_FAIL+1)); echo "  FAIL $3"; echo "       missing: $1"; echo "       in:      $2";; esac
}
# assert_sql_fails <needle> <label> <role> <sub> <sql>: SQL must error and the message contain needle.
assert_sql_fails() {
  local needle="$1" label="$2" out
  if out=$(sql_as "$3" "$4" "$5" 2>&1); then T_FAIL=$((T_FAIL+1)); echo "  FAIL $label (expected error, got: $out)"
  else assert_contains "$needle" "$out" "$label"; fi
}
test_done() {
  echo "  -> $T_PASS passed, $T_FAIL failed"
  [ $((T_PASS+T_FAIL)) -gt 0 ] || { echo "  FAIL no assertions ran" >&2; return 1; }
  [ "$T_FAIL" -eq 0 ]
}
