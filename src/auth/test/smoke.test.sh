#!/usr/bin/env bash
# Proves the harness itself works: roles, RLS, PostgREST + JWT, and the P0001 -> HTTP 400 mapping.
set -u
. "$(dirname "$0")/lib.sh"

U1=11111111-1111-1111-1111-111111111111
sql_su "INSERT INTO auth.users(id) VALUES ('$U1') ON CONFLICT DO NOTHING;"

# SQL as authenticated: RLS on paragraph_reports (own rows only)
sql_as authenticated "$U1" "INSERT INTO paragraph_reports(paragraph_id, language, commit_hash, reason) VALUES ('001.0001','cz','abc','typo');" >/dev/null
assert_eq 1 "$(sql_as authenticated "$U1" "SELECT count(*) FROM paragraph_reports;")" "authenticated sees own report"
assert_eq 0 "$(sql_as authenticated 22222222-2222-2222-2222-222222222222 "SELECT count(*) FROM paragraph_reports;")" "other user sees none"
assert_eq 0 "$(sql_as anon - "SELECT count(*) FROM paragraph_reports;")" "anon sees none"

# PostgREST GET with a valid JWT
http GET "/paragraph_reports?select=paragraph_id" "$(jwt "$U1")" >/dev/null
assert_eq 200 "$HTTP_STATUS" "GET paragraph_reports with JWT -> 200"
assert_contains '001.0001' "$HTTP_BODY" "GET returns own row"
http GET "/paragraph_reports?select=paragraph_id" "$(jwt "$U1" authenticated wrong-secret-wrong-secret-wrong-secret)" >/dev/null
assert_eq 401 "$HTTP_STATUS" "bad JWT signature -> 401"

# Status mapping: RAISE ... ERRCODE 'P0001' -> HTTP 400 through PostgREST /rpc
sql_su "CREATE OR REPLACE FUNCTION public.smoke_cap() RETURNS void LANGUAGE plpgsql AS \$\$
BEGIN RAISE EXCEPTION 'star_cap_reached' USING ERRCODE = 'P0001'; END \$\$;
GRANT EXECUTE ON FUNCTION public.smoke_cap() TO authenticated;" >/dev/null
pgrst_reload
assert_sql_fails star_cap_reached "P0001 raised in SQL" authenticated "$U1" "SELECT smoke_cap();"
http POST /rpc/smoke_cap "$(jwt "$U1")" '{}' >/dev/null
assert_eq 400 "$HTTP_STATUS" "P0001 -> HTTP 400"
assert_contains star_cap_reached "$HTTP_BODY" "body carries star_cap_reached"
sql_su "DROP FUNCTION public.smoke_cap();" >/dev/null

test_done
