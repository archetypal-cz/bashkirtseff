#!/usr/bin/env bash
# Renumber scripts from the REAL generator (sqlRemap, via fixtures/gen-remap.ts) applied through the runner
# (db-deploy.sh) into the real public.paragraph_reports / paragraph_stars (init.sql + migration 0001).
# Two scripts for the same carnet, a shift chain and then a merge, go through ONE transaction.
set -u
. "$(dirname "$0")/lib.sh"

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$HERE/.." && pwd)"
RUNNER="$SRC/db-deploy.sh"
WORK="$(mktemp -d)"
REPO="$WORK/repo"
U1=11111111-1111-1111-1111-111111111111
U2=22222222-2222-2222-2222-222222222222
U3=33333333-3333-3333-3333-333333333333

cleanup() { sql_su 'DROP TABLE IF EXISTS public.deploy_ledger;' >/dev/null 2>&1; rm -rf "$WORK"; }
trap cleanup EXIT

echo "-- generate"
GEN="$WORK/gen"
(cd "$SRC/.." && npx tsx "$HERE/fixtures/gen-remap.ts" "$GEN") || { echo "generator failed" >&2; exit 1; }
for f in "$GEN"/*.sql; do
  bash "$RUNNER" lint renumber "$f" >"$WORK/lint.out" 2>&1; assert_eq 0 "$?" "generated $(basename "$f") passes the runner lint"
done
assert_eq 0 "$(grep -ciE '^[[:space:]]*(begin|commit|rollback)' "$GEN"/*.sql | awk -F: '{s+=$NF} END {print s+0}')" "no transaction control in the generated scripts"

echo "-- apply both in one transaction"
mkdir -p "$REPO/src/auth/migrations" "$REPO/content/_renumber"
git -C "$REPO" init -q -b main; git -C "$REPO" config user.name t; git -C "$REPO" config user.email t@t; git -C "$REPO" config commit.gpgsign false
cp "$SRC/migrations/0001-paragraph-stars.sql" "$REPO/src/auth/migrations/"
cp "$GEN"/*.sql "$REPO/content/_renumber/"
DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
git -C "$REPO" add -A >/dev/null; git -C "$REPO" commit -q -m fixture
run() { OUT=$(DEPLOY_ROOT="$REPO" GIT_COMMIT=deadbeef01 bash "$RUNNER" "$@" 2>&1); RC=$?; }

sql_su "INSERT INTO auth.users (id, email) VALUES ('$U1','a@t'),('$U2','b@t'),('$U3','c@t');" >/dev/null
run migrations; assert_eq 0 "$RC" "migration 0001 applies"
# U1 starred 0003, 0004, 0005 (all end up on 0004: the merge keeps one), U2 starred 0003 and 0001 (untouched),
# U3 starred 0007 (-> 0005), and 0009 (dropped -> DROPPED-0009)
sql_su "INSERT INTO public.paragraph_stars (user_id, paragraph_id, language, commit_hash) VALUES
  ('$U1','099.0003','cz','x'),('$U1','099.0004','cz','x'),('$U1','099.0005','cz','x'),
  ('$U2','099.0003','en','x'),('$U2','099.0001','en','x'),
  ('$U3','099.0007','uk','x'),('$U3','099.0009','uk','x');
  INSERT INTO public.paragraph_reports (user_id, paragraph_id, language, commit_hash, reason) VALUES
  ('$U1','099.0003','cz','x','r3'),('$U1','099.0004','cz','x','r4'),('$U1','099.0005','cz','x','r5'),
  ('$U2','099.0007','cz','x','r7'),('$U2','099.0001','cz','x','r1');" >/dev/null

run renumber
assert_eq 0 "$RC" "renumber: both generated scripts apply in one run"
assert_contains "applied 099-2026-10-02.sql" "$OUT" "renumber: shift script applied"
assert_contains "applied 099-2026-10-02-2.sql" "$OUT" "renumber: merge script applied after it (-2 sorts after the base name)"
assert_eq "r1:099.0001|r3:099.0004|r4:099.0004|r5:099.0004|r7:099.0005" \
  "$(sql_su "SELECT string_agg(reason || ':' || paragraph_id, '|' ORDER BY reason) FROM public.paragraph_reports;")" "reports: remapped through the chain and the merge"
assert_eq "$U1:099.0004|$U2:099.0001|$U2:099.0004|$U3:099.0005|$U3:099.DROPPED-0009" \
  "$(sql_su "SELECT string_agg(user_id || ':' || paragraph_id, '|' ORDER BY user_id, paragraph_id) FROM public.paragraph_stars;")" "stars: remapped, merge keeps exactly one star per user, dropped paragraph follows its DROPPED id"
assert_eq 0 "$(sql_su "SELECT count(*) FROM (SELECT user_id, paragraph_id FROM public.paragraph_stars GROUP BY 1,2 HAVING count(*) > 1) d;")" "stars: no duplicate (user, paragraph)"
assert_eq 2 "$(sql_su "SELECT count(*) FROM public.deploy_ledger WHERE kind='renumber' AND status='applied';")" "ledger: both scripts recorded"
run renumber; assert_contains "nothing pending" "$OUT" "re-run is a no-op"

test_done
