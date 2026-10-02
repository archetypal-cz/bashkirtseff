#!/usr/bin/env bash
# Migration 0001-paragraph-stars: applied the way the D1 runner does (stdin, BEGIN/COMMIT), twice, then
# the acceptance checks through PostgREST with the exact requests the client makes.
set -u
. "$(dirname "$0")/lib.sh"
MIG="$(cd "$(dirname "$0")/../migrations" && pwd)"

# shellcheck disable=SC2086
apply() { { echo 'BEGIN;'; cat "$1"; echo 'COMMIT;'; } | $DOCKER exec -i "$AUTH_DB_CONTAINER" psql -X -q -v ON_ERROR_STOP=1 -U gotrue -d gotrue >/dev/null; }

apply "$MIG/0001-paragraph-stars.sql"; assert_eq 0 $? "migration applies"
apply "$MIG/0001-paragraph-stars.sql"; assert_eq 0 $? "migration re-applies (idempotent)"
pgrst_reload

A=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
B=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
C=cccccccc-cccc-cccc-cccc-cccccccccccc
for u in $A $B $C; do sql_su "INSERT INTO auth.users(id) VALUES ('$u') ON CONFLICT DO NOTHING;" >/dev/null; done
TA=$(jwt $A); TB=$(jwt $B); TC=$(jwt $C)
star() { http POST "/paragraph_stars?on_conflict=user_id,paragraph_id" "$1" "{\"paragraph_id\":\"$2\",\"language\":\"${3:-cz}\",\"commit_hash\":\"${4:-abc}\"}" -H 'Prefer: resolution=ignore-duplicates,return=minimal' >/dev/null; }
count() { sql_su "SELECT count(*) FROM paragraph_stars WHERE user_id='$1' ${2:+AND paragraph_id='$2'};"; }

# star, duplicate ignored, user_id from JWT
star "$TA" 001.0001; assert_eq 201 "$HTTP_STATUS" "star -> 201"
assert_eq "$A" "$(sql_su "SELECT user_id FROM paragraph_stars WHERE paragraph_id='001.0001';")" "user_id defaults from JWT sub"
star "$TA" 001.0001 en; case "$HTTP_STATUS" in 2??) r=2xx;; *) r=$HTTP_STATUS;; esac
assert_eq 2xx "$r" "duplicate star is ignored (2xx)"
assert_eq 1 "$(count $A 001.0001)" "duplicate leaves one row"
assert_eq cz "$(sql_su "SELECT language FROM paragraph_stars WHERE paragraph_id='001.0001';")" "duplicate does not overwrite"

# list
http GET "/paragraph_stars?select=paragraph_id,language,created_at&order=paragraph_id" "$TA" >/dev/null
assert_eq 200 "$HTTP_STATUS" "list -> 200"
assert_contains 001.0001 "$HTTP_BODY" "list shows own star"

# isolation
star "$TB" 002.0001
http GET "/paragraph_stars?select=paragraph_id" "$TB" >/dev/null
assert_eq '[{"paragraph_id":"002.0001"}]' "$HTTP_BODY" "B sees only own rows"
http DELETE "/paragraph_stars?paragraph_id=eq.001.0001" "$TB" >/dev/null
assert_eq 1 "$(count $A 001.0001)" "B cannot delete A's row"
http POST "/paragraph_stars" "$TB" "{\"user_id\":\"$A\",\"paragraph_id\":\"003.0001\",\"language\":\"cz\",\"commit_hash\":\"x\"}" >/dev/null
assert_eq 0 "$(count $A 003.0001)" "B cannot insert a row for A"

# validation
for bad in GLO_NICE.0001 1.1 001.001 001.00012 abc.0001 "001.0001 " "001.DROPPED-12"; do
  star "$TA" "$bad"; assert_eq 400 "$HTTP_STATUS" "invalid paragraph_id rejected: '$bad'"
done
star "$TA" 001.DROPPED-0001; assert_eq 201 "$HTTP_STATUS" "001.DROPPED-0001 accepted"
star "$TA" 001.0002 de; assert_eq 400 "$HTTP_STATUS" "invalid language rejected"
n=0; for l in original cz uk en fr es; do n=$((n+1)); star "$TC" "000.000$n" "$l"; done
assert_eq 6 "$(count $C)" "all six languages accepted"
http POST "/paragraph_stars" "$TA" '{"paragraph_id":"001.0003","language":"cz"}' >/dev/null
assert_eq 400 "$HTTP_STATUS" "missing commit_hash rejected"
assert_contains commit_hash "$HTTP_BODY" "error names commit_hash"

# no UPDATE
http PATCH "/paragraph_stars?paragraph_id=eq.001.0001" "$TA" '{"language":"en"}' >/dev/null
case "$HTTP_STATUS" in 4??) r=4xx;; *) r=$HTTP_STATUS;; esac
assert_eq 4xx "$r" "PATCH refused over HTTP"
assert_eq cz "$(sql_su "SELECT language FROM paragraph_stars WHERE paragraph_id='001.0001' AND user_id='$A';")" "row unchanged after PATCH"
assert_sql_fails "permission denied" "no UPDATE in SQL" authenticated $A "UPDATE paragraph_stars SET language='en';"
assert_sql_fails "permission denied" "admin_api has no grant" admin_api - "SELECT 1 FROM paragraph_stars;"

# anon
http GET "/paragraph_stars?select=paragraph_id" - >/dev/null
assert_eq 200 "$HTTP_STATUS" "anon GET -> 200"
assert_eq '[]' "$HTTP_BODY" "anon GET returns []"
http POST "/paragraph_stars" - '{"paragraph_id":"001.0009","language":"cz","commit_hash":"x"}' >/dev/null
case "$HTTP_STATUS" in 4??) r=4xx;; *) r=$HTTP_STATUS;; esac
assert_eq 4xx "$r" "anon cannot insert"

# unstar / remove all
star "$TA" 004.0001; star "$TB" 004.0001
http DELETE "/paragraph_stars?paragraph_id=eq.004.0001" "$TA" >/dev/null
assert_eq 0 "$(count $A 004.0001)" "unstar removes own row"
assert_eq 1 "$(count $B 004.0001)" "unstar leaves B's same-paragraph row"
before=$(count $B)
http DELETE "/paragraph_stars?paragraph_id=not.is.null" "$TA" >/dev/null
assert_eq 0 "$(count $A)" "remove-all clears A"
assert_eq "$before" "$(count $B)" "remove-all leaves B untouched"

# cap
D=dddddddd-dddd-dddd-dddd-dddddddddddd
sql_su "INSERT INTO auth.users(id) VALUES ('$D') ON CONFLICT DO NOTHING;
INSERT INTO paragraph_stars(user_id,paragraph_id,language,commit_hash)
SELECT '$D', lpad((100+i/9000)::text,3,'0')||'.'||lpad((i%9000+1)::text,4,'0'), 'cz','seed' FROM generate_series(0,999) i;" >/dev/null
TD=$(jwt $D)
assert_eq 1000 "$(count $D)" "seeded 1000 stars"
star "$TD" 050.0001
assert_eq 400 "$HTTP_STATUS" "1001st star -> HTTP 400"
http POST "/paragraph_stars?on_conflict=user_id,paragraph_id" "$TD" '{"paragraph_id":"050.0001","language":"cz","commit_hash":"x"}' -H 'Prefer: resolution=ignore-duplicates,return=minimal' >/dev/null
assert_contains star_cap_reached "$HTTP_BODY" "body message is star_cap_reached"
assert_contains P0001 "$HTTP_BODY" "body code is P0001"
assert_eq 1000 "$(count $D)" "no row added over the cap"
existing=$(sql_su "SELECT paragraph_id FROM paragraph_stars WHERE user_id='$D' LIMIT 1;")
star "$TD" "$existing"
case "$HTTP_STATUS" in 2??) r=2xx;; *) r=$HTTP_STATUS;; esac
assert_eq 2xx "$r" "re-star at the cap accepted"
assert_eq 1000 "$(count $D)" "re-star at the cap adds nothing"
sql_su "INSERT INTO paragraph_stars(user_id,paragraph_id,language,commit_hash) VALUES ('$D','050.0001','cz','remap');" >/dev/null
assert_eq 1001 "$(count $D)" "cap does not apply to gotrue (remap scripts)"
http DELETE "/paragraph_stars?paragraph_id=eq.050.0001" "$TD" >/dev/null
star "$TD" 050.0002
assert_eq 400 "$HTTP_STATUS" "still capped at 1001 rows"

# cascade
assert_eq 1 "$(count $B 002.0001)" "B has a row before user delete"
sql_su "DELETE FROM auth.users WHERE id='$B';" >/dev/null
assert_eq 0 "$(count $B)" "deleting the auth user cascades"

# down migration, then up again
apply "$MIG/down/0001-paragraph-stars.sql"; assert_eq 0 $? "down migration applies"
assert_eq "" "$(sql_su "SELECT to_regclass('public.paragraph_stars');")" "down removes the table"
assert_eq 0 "$(sql_su "SELECT count(*) FROM pg_proc WHERE proname='paragraph_stars_cap';")" "down removes the function"
apply "$MIG/down/0001-paragraph-stars.sql"; assert_eq 0 $? "down is idempotent"
apply "$MIG/0001-paragraph-stars.sql"; assert_eq 0 $? "up re-applies after down"

test_done
