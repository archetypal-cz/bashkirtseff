#!/usr/bin/env bash
# Tests for src/auth/db-deploy.sh through the real `docker exec -i $AUTH_DB_CONTAINER psql` path, against
# throwaway fixture git repos (DEPLOY_ROOT). The gotrue role's search_path is `auth, public` (init.sql), so fixture
# tables paragraph_reports / paragraph_stars and the dbd_* tables the fixture migrations create live in schema `auth`
# and shadow the real public tables: the runner's unqualified SQL never touches them. The ledger is always
# public.deploy_ledger; everything is dropped again at the end.
set -u
. "$(dirname "$0")/lib.sh"

RUNNER="$(cd "$(dirname "$0")/.." && pwd)/db-deploy.sh"
REAL_0001="$(cd "$(dirname "$0")/.." && pwd)/migrations/0001-paragraph-stars.sql"
MARKER='-- deploy-ledger: renumber v1'
WORK="$(mktemp -d)"
REPO="$WORK/repo"
U1=11111111-1111-1111-1111-111111111111
U2=22222222-2222-2222-2222-222222222222
SAME_DATE="2026-01-01T00:00:00+0000"

cleanup() { drop_fixtures >/dev/null 2>&1; rm -rf "$WORK"; }
trap cleanup EXIT

assert_not_contains() { # <needle> <haystack> <label>
  case "$2" in *"$1"*) T_FAIL=$((T_FAIL+1)); echo "  FAIL $3"; echo "       unexpected: $1";;
    *) T_PASS=$((T_PASS+1)); echo "  ok   $3";; esac
}

# ---- fixtures
drop_fixtures() {
  sql_su 'DROP TABLE IF EXISTS public.deploy_ledger;
    DO $$ DECLARE r record; BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = $q$auth$q$ AND (tablename LIKE $q$dbd\_%$q$ OR tablename IN ($q$paragraph_reports$q$, $q$paragraph_stars$q$))
      LOOP EXECUTE format($f$DROP TABLE auth.%I CASCADE$f$, r.tablename); END LOOP; END $$;'
}
reset_db() {
  drop_fixtures >/dev/null
  sql_su "CREATE TABLE auth.paragraph_reports (id serial PRIMARY KEY, user_id uuid, paragraph_id text, language text, commit_hash text, reason text);
    CREATE TABLE auth.paragraph_stars (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, paragraph_id text NOT NULL,
      language text NOT NULL DEFAULT 'original', commit_hash text NOT NULL DEFAULT 'x', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, paragraph_id));" >/dev/null
}
new_repo() {
  rm -rf "$REPO"; mkdir -p "$REPO/src/auth/migrations" "$REPO/content/_renumber"
  git -C "$REPO" init -q -b main
  git -C "$REPO" config user.name t; git -C "$REPO" config user.email t@t
  git -C "$REPO" config commit.gpgsign false
}
commit() { git -C "$REPO" add -A >/dev/null; GIT_AUTHOR_DATE="$SAME_DATE" GIT_COMMITTER_DATE="$SAME_DATE" git -C "$REPO" commit -q --allow-empty -m "$1"; }
run() { OUT=$(DEPLOY_ROOT="$REPO" GIT_COMMIT="${GC-deadbeef01}" bash "$RUNNER" "$@" 2>&1); RC=$?; }
mig() { printf '%s\n' "$2" > "$REPO/src/auth/migrations/$1"; }
# mk_ren <file> <hex8> <old:new>...  : a script in the exact D4 shape
mk_ren() {
  local f="$REPO/content/_renumber/$1" h="$2" first=1 p; shift 2
  {
    echo "$MARKER"; echo "-- fixture"
    echo "CREATE TEMP TABLE renumber_map_$h (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL);"
    echo "INSERT INTO renumber_map_$h (old_id, new_id) VALUES"
    for p in "$@"; do [ "$first" = 1 ] || echo ","; first=0; printf "  ('%s', '%s')" "${p%%:*}" "${p##*:}"; done
    echo ";"
    echo "UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM renumber_map_$h m WHERE r.paragraph_id = m.old_id;"
    echo "CREATE TEMP TABLE moved_stars_$h AS"
    echo "  SELECT s.id, s.user_id, m.new_id, s.language, s.commit_hash, s.created_at"
    echo "  FROM paragraph_stars s JOIN renumber_map_$h m ON s.paragraph_id = m.old_id;"
    echo "DELETE FROM paragraph_stars s USING renumber_map_$h m WHERE s.paragraph_id = m.old_id;"
    echo "INSERT INTO paragraph_stars (id, user_id, paragraph_id, language, commit_hash, created_at)"
    echo "  SELECT id, user_id, new_id, language, commit_hash, created_at FROM moved_stars_$h"
    echo "  ON CONFLICT (user_id, paragraph_id) DO NOTHING;"
    echo "DROP TABLE renumber_map_$h, moved_stars_$h;"
  } > "$f"
}
ledger_count() { sql_su "SELECT count(*) FROM public.deploy_ledger ${1:-};" 2>/dev/null; }
table_exists() { sql_su "SELECT to_regclass('$1') IS NOT NULL;"; }
report_at() { sql_su "SELECT paragraph_id FROM auth.paragraph_reports WHERE id=$1;"; }

# ============================================================== lint (pure; no database)
echo "-- lint"
L="$WORK/lint"; mkdir -p "$L"
lint_rc() { bash "$RUNNER" lint "$1" "$2" >"$WORK/lint.out" 2>&1; echo $?; }
cat > "$L/ok.sql" <<'EOF'
-- BEGIN; COMMIT; inside comments and strings are inert
CREATE TABLE IF NOT EXISTS t (id int);
CREATE OR REPLACE FUNCTION f() RETURNS void LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM 1; -- ; here
  RAISE NOTICE 'x;y''z';
END
$fn$;
/* nested /* comment */ ; COMMIT; */
DO $$ BEGIN IF true THEN NULL; END IF; END $$;
COMMENT ON TABLE t IS 'has \ backslash and ; and COMMIT;';
SELECT E'it\'s; fine', 'a' || "weird;name";
EOF
assert_eq 0 "$(lint_rc migration "$L/ok.sql")" "lint: BEGIN/END inside a function and DO body, strings, comments pass"
if [ -f "$REAL_0001" ]; then
  assert_eq 0 "$(lint_rc migration "$REAL_0001")" "lint: the real 0001-paragraph-stars.sql passes"
else echo "  SKIP real 0001 file not present"; fi
printf 'DO $$ BEGIN PERFORM pg_read_file(%s); END $$;\n' "'/etc/passwd'" > "$L/do_read.sql"
assert_eq 1 "$(lint_rc migration "$L/do_read.sql")" "lint: DO \$\$ ... pg_read_file ... \$\$ fails"
assert_contains forbidden-function "$(cat "$WORK/lint.out")" "lint: ...with the forbidden-function verdict"
printf 'SELECT 1;\nCOMMIT;\n' > "$L/commit.sql";    assert_eq 1 "$(lint_rc migration "$L/commit.sql")" "lint: top-level COMMIT; fails"
printf 'BEGIN;\nSELECT 1;\n' > "$L/begin.sql";      assert_eq 1 "$(lint_rc migration "$L/begin.sql")" "lint: top-level BEGIN; fails"
printf 'SELECT 1;\n\\! id\n' > "$L/bang.sql";       assert_eq 1 "$(lint_rc migration "$L/bang.sql")" "lint: \\! fails"
printf '\\i /etc/passwd\n' > "$L/i.sql";            assert_eq 1 "$(lint_rc migration "$L/i.sql")" "lint: \\i fails"
printf 'SELECT 1 \\gset\n' > "$L/gset.sql";         assert_eq 1 "$(lint_rc migration "$L/gset.sql")" "lint: a mid-line backslash command fails"
printf "COPY t FROM PROGRAM 'id';\n" > "$L/copy.sql"; assert_eq 1 "$(lint_rc migration "$L/copy.sql")" "lint: COPY ... PROGRAM fails"
printf "COPY t TO '/tmp/x';\n" > "$L/copy2.sql";    assert_eq 1 "$(lint_rc migration "$L/copy2.sql")" "lint: COPY ... TO fails"
printf 'ALTER SYSTEM SET work_mem = 1;\n' > "$L/as.sql"; assert_eq 1 "$(lint_rc migration "$L/as.sql")" "lint: ALTER SYSTEM fails"
printf 'CREATE ROLE evil WITH SUPERUSER;\n' > "$L/role.sql"; assert_eq 1 "$(lint_rc migration "$L/role.sql")" "lint: CREATE ROLE ... SUPERUSER fails"
printf 'CREATE EXTENSION dblink;\n' > "$L/ext.sql"; assert_eq 1 "$(lint_rc migration "$L/ext.sql")" "lint: CREATE EXTENSION outside the (empty) allowlist fails"
printf 'SELECT 1\n' > "$L/noterm.sql";              assert_eq 1 "$(lint_rc migration "$L/noterm.sql")" "lint: missing final semicolon fails"
printf "SELECT 'abc;\n" > "$L/unterm.sql";          assert_eq 1 "$(lint_rc migration "$L/unterm.sql")" "lint: unterminated quote fails"
printf 'SELECT 1; COMMIT; -- BEGIN\n' > "$L/two.sql"; assert_eq 1 "$(lint_rc migration "$L/two.sql")" "lint: COMMIT after another statement on one line fails"
printf "SET standard_conforming_strings = off;\nSELECT 1;\n" > "$L/scs.sql"; assert_eq 1 "$(lint_rc migration "$L/scs.sql")" "lint: quoting-mode setting fails"
# ---- backslash-quote-in-literal: a plain '...' literal with a backslash-quote run is rejected (scs on/off lexing can differ)
printf "SELECT 'a\\\\'';\nCOMMIT; SELECT 1; -- ';\n" > "$L/bq_embed.sql"
assert_eq 1 "$(lint_rc migration "$L/bq_embed.sql")" "lint: 'a\\'' (backslash-quote inside a plain literal) fails"; assert_contains backslash-quote-in-literal "$(cat "$WORK/lint.out")" "lint: ...with backslash-quote-in-literal"
printf "SELECT 'a\\\\';\nSELECT 1;\n" > "$L/bq_close.sql"
assert_eq 1 "$(lint_rc migration "$L/bq_close.sql")" "lint: 'a\\' (a closing quote after one backslash) fails"; assert_contains backslash-quote-in-literal "$(cat "$WORK/lint.out")" "lint: ...close -> backslash-quote-in-literal"
printf "SELECT set_config('standard_' || 'conforming_strings', 'off', false);\nSELECT 'a\\\\''; COMMIT; SELECT 1; -- ';\n" > "$L/bq_concat.sql"
assert_eq 1 "$(lint_rc migration "$L/bq_concat.sql")" "lint: concatenated set_config + backslash-quote fails"
printf "DO \$\$ BEGIN EXECUTE 'SET standard_' || 'conforming_strings = off'; END \$\$;\nSELECT 'a\\\\''; COMMIT; SELECT 1; -- ';\n" > "$L/bq_exec.sql"
assert_eq 1 "$(lint_rc migration "$L/bq_exec.sql")" "lint: dynamic EXECUTE + backslash-quote fails"
printf "SELECT 'a\\\\''; COMMIT; SELECT 1; -- ';\n" > "$L/bq_payload.sql"
assert_eq 1 "$(lint_rc migration "$L/bq_payload.sql")" "lint: a bare backslash-quote payload fails"
printf "SELECT 'x1' ~ '^[a-z]\\\\d\$' AS a, E'\\\\\\\\' AS b, 'x\\\\\\\\y' AS c, 'C:\\\\\\\\' AS d, '\\\\.' AS e, E'it\\\\'s' AS f;\n" > "$L/bq_ok.sql"
assert_eq 0 "$(lint_rc migration "$L/bq_ok.sql")" "lint: 'C:\\\\' (even run), regex '\\.' and E'..\\'..' pass"
# ---- unicode-escape-literal: U&"..." / U&'...' prefixes are rejected outright (any case)
printf "SET U&\"standard_conforming_string\\\\0073\" TO off;\nSELECT 1;\n" > "$L/ue_ident.sql"
assert_eq 1 "$(lint_rc migration "$L/ue_ident.sql")" "lint: U&\"...\" identifier fails"; assert_contains unicode-escape-literal "$(cat "$WORK/lint.out")" "lint: ...with unicode-escape-literal"
printf "SELECT u&'d\\\\0061t\\\\+000061';\n" > "$L/ue_str.sql"
assert_eq 1 "$(lint_rc migration "$L/ue_str.sql")" "lint: u&'...' string (lower case) fails"; assert_contains unicode-escape-literal "$(cat "$WORK/lint.out")" "lint: ...string -> unicode-escape-literal"
# non-ASCII dollar-quote tags / identifiers (bytes >= 0x80 are identifier chars; awk runs under LC_ALL=C)
printf "SELECT \$\xc3\xa9\$ it's; COMMIT; \$\xc3\xa9\$;\nSELECT 1 AS caf\xc3\xa9;\n" > "$L/utf.sql"
assert_eq 0 "$(lint_rc migration "$L/utf.sql")" "lint: SELECT \$é\$ it's ... \$é\$; (non-ASCII dollar-quote tag) lints clean"
printf 'SELECT 1;\nBEGIN ATOMIC SELECT 1; END;\n' > "$L/atomic.sql"
assert_eq 1 "$(lint_rc migration "$L/atomic.sql")" "lint: BEGIN ATOMIC is rejected"
assert_contains "BEGIN ATOMIC function bodies are not supported" "$(cat "$WORK/lint.out")" "lint: ...with a message that names BEGIN ATOMIC"
# unsafe languages, LOAD, CREATE LANGUAGE, server-file roles
lint_bad() { # <name> <sql> <rule>
  printf '%s\n' "$2" > "$L/$1.sql"
  assert_eq 1 "$(lint_rc migration "$L/$1.sql")" "lint: $1 fails"; assert_contains "$3" "$(cat "$WORK/lint.out")" "lint: $1 -> $3"
}
lint_bad lang_c "CREATE FUNCTION f() RETURNS int AS 'x', 'y' LANGUAGE c;" unsafe-language
lint_bad lang_internal "CREATE FUNCTION f() RETURNS int AS 'now' LANGUAGE internal;" unsafe-language
lint_bad lang_quoted "CREATE FUNCTION f() RETURNS int AS 'x' LANGUAGE 'C';" unsafe-language
lint_bad lang_py "CREATE FUNCTION f() RETURNS int LANGUAGE plpythonu AS \$\$ return 1 \$\$;" unsafe-language
lint_bad lang_perl "DO LANGUAGE plperlu \$\$ 1 \$\$;" unsafe-language
lint_bad lang_tcl "CREATE FUNCTION f() RETURNS int LANGUAGE pltclu AS \$\$ return 1 \$\$;" unsafe-language
lint_bad load_stmt "LOAD 'auto_explain';" load
lint_bad create_lang "CREATE LANGUAGE plfoo;" create-language
lint_bad create_trusted_lang "CREATE OR REPLACE TRUSTED LANGUAGE plfoo;" create-language
lint_bad role_prog "GRANT pg_execute_server_program TO gotrue;" server-file-role
lint_bad role_read "GRANT pg_read_server_files TO gotrue;" server-file-role
lint_bad role_write "GRANT pg_write_server_files TO gotrue;" server-file-role
printf 'CREATE FUNCTION f() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;\nCREATE FUNCTION g() RETURNS void LANGUAGE plpgsql AS $$ BEGIN NULL; END $$;\nSELECT 1 AS "language c";\n' > "$L/lang_ok.sql"
assert_eq 1 "$(lint_rc migration "$L/lang_ok.sql")" "lint: (documented over-match) the words 'language c' in a quoted identifier are rejected"
printf 'CREATE FUNCTION f() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;\nCREATE FUNCTION g() RETURNS void LANGUAGE plpgsql AS $$ BEGIN NULL; END $$;\n' > "$L/lang_ok.sql"
assert_eq 0 "$(lint_rc migration "$L/lang_ok.sql")" "lint: LANGUAGE sql and plpgsql pass"
# renumber shape
new_repo; reset_db >/dev/null; mk_ren good.sql aabbccdd 001.0002:001.0001
assert_eq 0 "$(lint_rc renumber "$REPO/content/_renumber/good.sql")" "lint: the D4 renumber shape passes"
{ head -n 3 "$REPO/content/_renumber/good.sql"; echo "DELETE FROM paragraph_reports;"; tail -n +4 "$REPO/content/_renumber/good.sql"; } > "$L/ren_extra.sql"
assert_eq 1 "$(lint_rc renumber "$L/ren_extra.sql")" "lint: a non-allowlisted statement in a renumber file fails"
assert_contains renumber-shape "$(cat "$WORK/lint.out")" "lint: ...with the renumber-shape verdict"
sed 's/^DROP TABLE.*$//' "$REPO/content/_renumber/good.sql" > "$L/ren_nodrop.sql"
assert_eq 1 "$(lint_rc renumber "$L/ren_nodrop.sql")" "lint: a renumber file without the trailing DROP fails"
tail -n +2 "$REPO/content/_renumber/good.sql" > "$L/ren_nomarker.sql"
assert_eq 1 "$(lint_rc renumber "$L/ren_nomarker.sql")" "lint: a renumber file without the marker fails"
{ echo "$MARKER"; echo "BEGIN;"; tail -n +2 "$REPO/content/_renumber/good.sql"; echo "COMMIT;"; } > "$L/ren_txn.sql"
assert_eq 1 "$(lint_rc renumber "$L/ren_txn.sql")" "lint: BEGIN/COMMIT in a renumber file fails"
sed "s/'001.0001')/'001.0001; DROP TABLE x')/" "$REPO/content/_renumber/good.sql" > "$L/ren_inj.sql"
assert_eq 1 "$(lint_rc renumber "$L/ren_inj.sql")" "lint: a renumber map value outside the ID alphabet fails"

# ---- binary content (NUL / C0 controls / DEL) is rejected before tokenising; tab and CRLF are fine
printf "SELECT 'a\\000b';\nCOMMIT;\n" > "$L/nul.sql"
assert_eq 1 "$(lint_rc migration "$L/nul.sql")" "lint: a NUL byte fails"; assert_contains binary-content "$(cat "$WORK/lint.out")" "lint: NUL -> binary-content"
printf "SELECT 1;\nSELECT '\\001';\n" > "$L/c01.sql"
assert_eq 1 "$(lint_rc migration "$L/c01.sql")" "lint: a \\x01 byte fails"; assert_contains binary-content "$(cat "$WORK/lint.out")" "lint: \\x01 -> binary-content"
assert_contains "line 2" "$(cat "$WORK/lint.out")" "lint: binary-content names the line"
printf "SELECT 1; -- \\033[0m\n" > "$L/esc.sql"
assert_eq 1 "$(lint_rc migration "$L/esc.sql")" "lint: a \\x1b byte fails"; assert_contains binary-content "$(cat "$WORK/lint.out")" "lint: \\x1b -> binary-content"
printf "SELECT 1; -- \\177\n" > "$L/del.sql"
assert_eq 1 "$(lint_rc migration "$L/del.sql")" "lint: a DEL byte fails"
cp "$L/nul.sql" "$L/ren_nul.sql"; assert_eq 1 "$(lint_rc renumber "$L/ren_nul.sql")" "lint: a NUL byte in a renumber file fails"; assert_contains binary-content "$(cat "$WORK/lint.out")" "lint: renumber NUL -> binary-content"
printf "SELECT\t1;\r\nSELECT 2;\r\n" > "$L/tabcrlf.sql"
assert_eq 0 "$(lint_rc migration "$L/tabcrlf.sql")" "lint: tabs and CRLF line ends still pass"
# ---- lone CR (psql ends a `--` comment at CR; awk does not) is rejected, CRLF is fine
printf 'SELECT 1; -- c\rCOMMIT;\rSELECT 3;\r' > "$L/lonecr.sql"
assert_eq 1 "$(lint_rc migration "$L/lonecr.sql")" "lint: a lone-CR file fails"; assert_contains binary-content "$(cat "$WORK/lint.out")" "lint: lone CR -> binary-content"
printf 'SELECT 1; -- note\rCOMMIT;\n' > "$L/crcomment.sql"
assert_eq 1 "$(lint_rc migration "$L/crcomment.sql")" "lint: a CR inside a -- comment of an LF file fails"
printf 'SELECT 1;\r' > "$L/crlast.sql"
assert_eq 1 "$(lint_rc migration "$L/crlast.sql")" "lint: a CR as the very last byte fails"
printf 'SELECT 1;\r\nSELECT 2; -- c\r\n' > "$L/crlf.sql"
assert_eq 0 "$(lint_rc migration "$L/crlf.sql")" "lint: CRLF line ends (incl. after a comment) still pass"
# ---- client encodings: a high byte + 0x5C is one char in SJIS/GBK/BIG5/..., so E'\x95\' would close differently
printf "SET client_encoding = 'SJIS';\nSELECT E'\\225\\\\'; COMMIT; SELECT 1; -- '\n" > "$L/sjis.sql"
assert_eq 1 "$(lint_rc migration "$L/sjis.sql")" "lint: SJIS hide (client_encoding + high byte + backslash) fails"
assert_contains binary-content "$(cat "$WORK/lint.out")" "lint: ...with binary-content (checked before the tokeniser)"
printf "SET client_encoding = 'SJIS';\nSELECT 1;\n" > "$L/sjis_set.sql"
assert_eq 1 "$(lint_rc migration "$L/sjis_set.sql")" "lint: SET client_encoding fails"; assert_contains encoding-setting "$(cat "$WORK/lint.out")" "lint: ...with encoding-setting"
printf "SELECT E'\\225\\\\'; COMMIT; SELECT 1; -- '\n" > "$L/hibs.sql"
assert_eq 1 "$(lint_rc migration "$L/hibs.sql")" "lint: a byte >= 0x80 followed by a backslash fails"
assert_contains "rewrite it" "$(cat "$WORK/lint.out")" "lint: ...and the message names the UTF-8 false positive"
printf "SELECT 'caf\\303\\251\\\\';\n" > "$L/eacute_bs.sql"
assert_eq 1 "$(lint_rc migration "$L/eacute_bs.sql")" "lint: (accepted false positive) UTF-8 e-acute followed by a backslash fails"
printf "SELECT 'caf\\303\\251', E'it\\\\'s', '\\\\\\303\\251';\n" > "$L/utf_ok.sql"
assert_eq 0 "$(lint_rc migration "$L/utf_ok.sql")" "lint: valid UTF-8 not followed by a backslash passes (backslash before a UTF-8 char too)"
printf "SELECT set_config('client_encoding', 'GBK', false);\nSELECT 1;\n" > "$L/gbk.sql"
assert_eq 1 "$(lint_rc migration "$L/gbk.sql")" "lint: set_config('client_encoding', ...) in a literal fails"; assert_contains encoding-setting "$(cat "$WORK/lint.out")" "lint: gbk -> encoding-setting"
printf "SET NAMES 'BIG5';\nSELECT 1;\n" > "$L/names.sql"
assert_eq 1 "$(lint_rc migration "$L/names.sql")" "lint: SET NAMES fails"; assert_contains encoding-setting "$(cat "$WORK/lint.out")" "lint: SET NAMES -> encoding-setting"
printf "set\n  /* x */  Names 'UTF8';\n" > "$L/names2.sql"
assert_eq 1 "$(lint_rc migration "$L/names2.sql")" "lint: whitespace / newline / comment tolerant SET NAMES fails"
printf "CREATE FUNCTION f() RETURNS void LANGUAGE plpgsql AS \$\$ BEGIN SET CLIENT_ENCODING TO 'SJIS'; END \$\$;\n" > "$L/body_enc.sql"
assert_eq 1 "$(lint_rc migration "$L/body_enc.sql")" "lint: client_encoding inside a function body fails"; assert_contains encoding-setting "$(cat "$WORK/lint.out")" "lint: body -> encoding-setting"
lint_bad alter_db_set "ALTER DATABASE gotrue SET search_path = a;" alter-set
lint_bad alter_role_set "ALTER ROLE gotrue IN DATABASE gotrue SET work_mem = 1;" alter-set
lint_bad alter_user_set "ALTER USER gotrue SET work_mem = 1;" alter-set
lint_bad alter_db_enc "ALTER DATABASE gotrue SET client_encoding = 'SJIS';" encoding-setting
printf "ALTER ROLE gotrue WITH CONNECTION LIMIT 5;\n" > "$L/alter_role_ok.sql"
assert_eq 0 "$(lint_rc migration "$L/alter_role_ok.sql")" "lint: ALTER ROLE without SET passes"
lint_bad alter_system "ALTER SYSTEM SET work_mem = 1;" alter-system
# ---- a line starting with a backslash is data inside a multi-line literal / dollar body, a violation at top level
printf "SELECT 'a\n\\\\echo HI\n';\nDO \$\$\n\\\\echo HI2\nBEGIN PERFORM 1; END \$\$;\n" > "$L/bs_in_lit.sql"
assert_eq 0 "$(lint_rc migration "$L/bs_in_lit.sql")" "lint: a backslash line inside a multi-line literal / dollar body passes"
printf "SELECT 1;\n  \\\\echo HI\n" > "$L/bs_top.sql"
assert_eq 1 "$(lint_rc migration "$L/bs_top.sql")" "lint: a top-level backslash line fails"; assert_contains psql-meta-command "$(cat "$WORK/lint.out")" "lint: ...with psql-meta-command"
printf "SELECT 'a\n';\\\\echo HI\n" > "$L/bs_after_lit.sql"
assert_eq 1 "$(lint_rc migration "$L/bs_after_lit.sql")" "lint: a backslash command after a closed multi-line literal fails"
# ---- statements that reach their ';' with open parentheses (psql would keep reading) are rejected
lint_bad open_paren "SELECT (1;" unbalanced-parens
printf "SELECT (1;\nSELECT 2);\n" > "$L/open_paren2.sql"
assert_eq 1 "$(lint_rc migration "$L/open_paren2.sql")" "lint: a ';' inside open parentheses fails"
printf "SELECT (1 + (2)), ')' , \$\$(\$\$, \"(\" FROM t; -- (\nSELECT f(1);\n" > "$L/paren_ok.sql"
assert_eq 0 "$(lint_rc migration "$L/paren_ok.sql")" "lint: balanced parentheses (and parens in literals/comments) pass"
# ---- reviewer's lexer-conformance fixtures: the hide-a-COMMIT tricks all fail
printf "SELECT 1; -- c\rCOMMIT;\rSELECT 3;\r" > "$L/lex07.sql"
printf "SELECT E'\\225\\\\'; COMMIT; SELECT 1; -- '\n" > "$L/lex11.sql"
printf "SELECT 1e'\\\\'; COMMIT; SELECT '';\n" > "$L/lex12b.sql"
for t in lex07 lex11 lex12b; do assert_eq 1 "$(lint_rc migration "$L/$t.sql")" "lint: conformance fixture $t fails"; done
printf "SELECT \$e'\\\\'; COMMIT; SELECT '';\n" > "$L/lex12.sql"
assert_eq 1 "$(lint_rc migration "$L/lex12.sql")" "lint: (documented over-strictness) \$ then e'..' directly adjacent is rejected"
# ---- psql variable interpolation outside quotes is rejected; casts, slices, bodies and literals are fine
lint_bad var_plain "SELECT :fresh;" psql-variable
lint_bad var_quoted "SELECT :'x';" psql-variable
lint_bad var_ident "SELECT :\"x\";" psql-variable
lint_bad var_exists "SELECT :{?x};" psql-variable
lint_bad var_slice "SELECT a[1:b] FROM t;" psql-variable
cat > "$L/var_ok.sql" <<'EOF'
SELECT 1::text, now()::date, '{1,2}'::int[];
SELECT a[1:2] FROM (SELECT ARRAY[1,2,3] AS a) q;
SELECT 'it :is fine', "col:umn", $$ :x $$;
-- :commented
/* :commented */
CREATE FUNCTION f() RETURNS int LANGUAGE plpgsql AS $b$ DECLARE v int; BEGIN v := 1; RETURN v; END $b$;
EOF
assert_eq 0 "$(lint_rc migration "$L/var_ok.sql")" "lint: ::casts, a[1:2], literals, comments and plpgsql := pass"

# ============================================================== order (git topology)
echo "-- order"
new_repo
mk_ren 001-b.sql 11111111 001.0001:001.0002; commit "c1: b"
mk_ren 001-a.sql 22222222 001.0002:001.0003; commit "c2: a (same timestamp as c1)"
mk_ren 002-d-2.sql 33333333 001.0002:001.0003; mk_ren 002-d.sql 44444444 001.0001:001.0002; mk_ren 002-d-10.sql 55555555 001.0003:001.0004
mkdir -p "$REPO/content/_renumber/split-wave"; mk_ren split-wave/zzz.sql 66666666 001.0001:001.0002
commit "c3: d, d-2, d-10 together"
ORD="$(DEPLOY_ROOT="$REPO" bash "$RUNNER" renumber-order | tr '\n' ' ')"
assert_eq "001-b.sql 001-a.sql 002-d.sql 002-d-2.sql 002-d-10.sql " "$ORD" "order: commit order beats name order; X.sql < X-2.sql < X-10.sql; subdirectories excluded"

# ============================================================== apply, skip, edit
echo "-- migrations"
reset_db; new_repo
DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
mig 0001-a.sql "CREATE TABLE dbd_a (id int); INSERT INTO dbd_a VALUES (1);"
mig 0002-b.sql "CREATE TABLE dbd_b (id int);"
commit "migrations"
run migrations
assert_eq 0 "$RC" "migrations: first run exits 0"
assert_contains "applied 0001-a.sql" "$OUT" "migrations: 0001 reported applied"
assert_contains "applied 0002-b.sql" "$OUT" "migrations: 0002 reported applied"
assert_eq "t" "$(table_exists dbd_a)" "migrations: the SQL ran"
assert_eq 2 "$(ledger_count "WHERE kind='migration' AND status='applied' AND git_commit='deadbeef01'")" "migrations: ledger rows recorded with the commit"
run migrations
assert_eq 0 "$RC" "migrations: re-run exits 0"
assert_contains "skip    0001-a.sql" "$OUT" "migrations: re-run skips"
assert_not_contains "applied 0001" "$OUT" "migrations: re-run applies nothing"
assert_eq 2 "$(ledger_count "WHERE kind='migration'")" "migrations: re-run adds no rows"

OLD_SHA="$(sha256sum "$REPO/src/auth/migrations/0001-a.sql" | cut -c1-64)"
mig 0001-a.sql "CREATE TABLE dbd_a (id int); -- edited"
NEW_SHA="$(sha256sum "$REPO/src/auth/migrations/0001-a.sql" | cut -c1-64)"
run migrations
assert_eq 1 "$RC" "migrations: an edited applied file fails"
assert_contains "$OLD_SHA" "$OUT" "migrations: ...showing the ledger hash"
assert_contains "$NEW_SHA" "$OUT" "migrations: ...and the file hash"
mig 0001-a.sql "CREATE TABLE dbd_a (id int); INSERT INTO dbd_a VALUES (1);"

# ---- failing SQL leaves no ledger row
echo "-- failure atomicity"
mig 0003-bad.sql "CREATE TABLE dbd_bad (id int); SELECT 1/0;"
run migrations
assert_eq 1 "$RC" "failure: a failing migration exits non-zero"
assert_eq "f" "$(table_exists dbd_bad)" "failure: its DDL was rolled back"
assert_eq 0 "$(ledger_count "WHERE filename='0003-bad.sql'")" "failure: no ledger row"
rm "$REPO/src/auth/migrations/0003-bad.sql"

# ---- lint blocks apply (nothing applied, even the good pending file)
mig 0004-good.sql "CREATE TABLE dbd_good (id int);"
mig 0005-evil.sql "SELECT 1;
COMMIT;"
run migrations
assert_eq 1 "$RC" "lint gate: a rejected pending file fails the run"
assert_eq "f" "$(table_exists dbd_good)" "lint gate: nothing applied, not even the good pending file"
rm "$REPO/src/auth/migrations/0005-evil.sql"
run migrations; assert_eq "t" "$(table_exists dbd_good)" "lint gate: once the bad file is gone the rest applies"

# ---- candidates: down/ and the tsv are never candidates; subdirectories of _renumber neither
echo "-- candidates"
mkdir -p "$REPO/src/auth/migrations/down"
mig down/0001-a.sql "DROP TABLE dbd_a;"
mig down/0099-x.sql "CREATE TABLE dbd_down (id int);"
mig 0006-c.sql "CREATE TABLE dbd_c6 (id int);"
run migrations --dry-run
assert_eq 0 "$RC" "candidates: dry-run exits 0"
assert_contains "would apply 0006-c.sql" "$OUT" "candidates: dry-run lists the new file"
assert_not_contains "down" "$OUT" "candidates: migrations/down is not listed"
assert_not_contains "tsv" "$OUT" "candidates: the seed tsv is not listed"
assert_eq "f" "$(table_exists dbd_c6)" "dry-run: nothing applied"
assert_eq 3 "$(ledger_count "WHERE kind='migration'")" "dry-run: no ledger change"
run migrations
assert_eq "f" "$(table_exists dbd_down)" "candidates: down/*.sql never ran"
assert_eq "t" "$(table_exists dbd_c6)" "candidates: real run applied the top-level file"

# ---- dry-run on a pristine database creates nothing at all
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null; mig 0001-a.sql "CREATE TABLE dbd_a (id int);"; commit m
run migrations --dry-run
assert_eq 0 "$RC" "dry-run (pristine DB): exits 0"
assert_contains "would apply 0001-a.sql" "$OUT" "dry-run (pristine DB): prints the plan"
assert_eq "f" "$(table_exists public.deploy_ledger)" "dry-run (pristine DB): even the ledger is not created"
assert_eq "f" "$(table_exists dbd_a)" "dry-run (pristine DB): nothing applied"

# ============================================================== preconditions
echo "-- preconditions"
OUT=$(env -u GIT_COMMIT DEPLOY_ROOT="$REPO" bash "$RUNNER" migrations 2>&1); RC=$?
assert_eq 1 "$RC" "preconditions: missing GIT_COMMIT fails"; assert_contains GIT_COMMIT "$OUT" "preconditions: ...and says why"
GC="" run migrations; assert_eq 1 "$RC" "preconditions: empty GIT_COMMIT fails"
commit "second commit"
git clone -q --depth 1 "file://$REPO" "$WORK/shallow" 2>/dev/null
OUT=$(DEPLOY_ROOT="$WORK/shallow" GIT_COMMIT=abc bash "$RUNNER" migrations 2>&1); RC=$?
assert_eq 1 "$RC" "preconditions: a shallow checkout fails"; assert_contains shallow "$OUT" "preconditions: ...and says why"
assert_eq "f" "$(table_exists dbd_a)" "preconditions: nothing applied"

# ============================================================== bootstrap seed
echo "-- bootstrap"
reset_db; new_repo
printf -- '-- legacy: pre-ledger script, must never run\nCREATE TABLE dbd_legacy_ran (id int);\n' > "$REPO/content/_renumber/003-legacy.sql"
mig 0001-a.sql "CREATE TABLE dbd_a (id int);"; commit "legacy + migration"
run migrations
assert_eq 1 "$RC" "bootstrap: a missing seed fails"
assert_contains "just db-seed" "$OUT" "bootstrap: ...pointing at just db-seed"
assert_eq "f" "$(table_exists dbd_a)" "bootstrap: nothing applied without a seed"
DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
printf -- '-- second legacy\nCREATE TABLE dbd_legacy_ran2 (id int);\n' > "$REPO/content/_renumber/004-legacy.sql"
run migrations
assert_eq 1 "$RC" "bootstrap: a marker-less file the seed does not cover fails the first run"
assert_contains "pre-ledger renumber script that is not in the seed" "$OUT" "bootstrap: ...with the recovery text"
assert_contains "004-legacy.sql" "$OUT" "bootstrap: ...naming the file"
assert_eq "f" "$(table_exists dbd_a)" "bootstrap: nothing applied"
assert_eq 0 "$(ledger_count)" "bootstrap: no ledger rows"
DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null; commit "seed"
run migrations
assert_eq 0 "$RC" "bootstrap: with a complete seed the first run succeeds"
assert_contains "seeded  2 legacy" "$OUT" "bootstrap: 2 legacy rows recorded"
assert_eq 2 "$(ledger_count "WHERE status='legacy' AND kind='renumber' AND git_commit='deadbeef01'")" "bootstrap: legacy rows carry the commit"
run renumber
assert_eq 0 "$RC" "bootstrap: renumber run with only legacy files exits 0"
assert_eq "f" "$(table_exists dbd_legacy_ran)" "bootstrap: legacy scripts are never executed"
# a later marker-less file not in the seed -> recovery text, nothing applied (ledger already bootstrapped)
printf -- '-- late legacy\nSELECT 1;\n' > "$REPO/content/_renumber/005-late.sql"
mk_ren 006-new.sql 77777777 001.0001:001.0002; sql_su "INSERT INTO auth.paragraph_reports(user_id,paragraph_id,language,commit_hash,reason) VALUES ('$U1','001.0001','cz','dbd','t');" >/dev/null
commit "late"
run renumber
assert_eq 1 "$RC" "classify: an unseeded marker-less file fails"
assert_contains "pre-ledger renumber script that is not in the seed" "$OUT" "classify: ...with the recovery text"
assert_contains "just db-seed-add 005-late.sql" "$OUT" "classify: ...naming the db-seed-add command"
assert_eq "001.0001" "$(report_at 1)" "classify: nothing applied, even the valid new script"
DEPLOY_ROOT="$REPO" bash "$RUNNER" seed-add "$REPO/content/_renumber/005-late.sql" >/dev/null
assert_eq 1 "$(grep -c '^005-late.sql' "$REPO/src/auth/migrations/legacy-renumber-seed.tsv")" "seed-add: line appended"
run renumber
assert_eq 0 "$RC" "classify: after seed-add the run proceeds"
assert_contains "seeded  1 legacy" "$OUT" "bootstrap: a later seed addition is recorded as legacy"
assert_eq "001.0002" "$(report_at 1)" "renumber: the new script remapped the report"
assert_eq 3 "$(ledger_count "WHERE status='legacy'")" "bootstrap: 3 legacy rows now"

# ============================================================== renumber: atomicity, order, stars
echo "-- renumber"
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
sql_su "INSERT INTO auth.paragraph_reports(user_id,paragraph_id,language,commit_hash,reason) VALUES ('$U1','001.0001','cz','dbd','t');" >/dev/null
mk_ren 001-first.sql aaaaaaa1 001.0001:001.0002
mk_ren 001-second.sql bbbbbbb2 001.0002:001.0003 001.0002:001.0004    # duplicate old_id -> PK violation at runtime
commit "two scripts, second fails"
run renumber
assert_eq 1 "$RC" "renumber atomicity: second script failing fails the run"
assert_eq "001.0001" "$(report_at 1)" "renumber atomicity: the first script was rolled back too"
assert_eq 0 "$(ledger_count)" "renumber atomicity: neither script recorded"
# fix: replace the failing script by a follow-up (a committed script is never edited, but nothing was recorded)
mk_ren 001-second.sql bbbbbbb2 001.0002:001.0003; commit "fix second"
sql_su "INSERT INTO auth.paragraph_stars(user_id,paragraph_id) VALUES ('$U1','001.0001'),('$U1','001.0002'),('$U2','001.0001');" >/dev/null
run renumber
assert_eq 0 "$RC" "renumber: both scripts apply in one run"
assert_contains "applied 001-first.sql" "$OUT" "renumber: first reported"
assert_eq "001.0003" "$(report_at 1)" "renumber: chained remap 0001 -> 0002 -> 0003 (commit order)"
assert_eq "001.0003|001.0003" "$(sql_su "SELECT string_agg(paragraph_id, '|' ORDER BY user_id) FROM auth.paragraph_stars;")" "renumber: stars moved, the merge kept one star per user"
assert_eq 2 "$(sql_su "SELECT count(*) FROM auth.paragraph_stars;")" "renumber: star count (U1 merged to one, U2 kept)"
assert_eq 2 "$(ledger_count "WHERE kind='renumber' AND status='applied'")" "renumber: both recorded"
run renumber; assert_contains "nothing pending" "$OUT" "renumber: re-run is a no-op"
mk_ren 001-first.sql aaaaaaa1 001.0001:001.0009
run renumber; assert_eq 1 "$RC" "renumber: an edited applied script fails"

# ---- N4-2: same timestamp, two commits; X-2 after X (effect on data, not just the listing)
echo "-- order (effect)"
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
sql_su "INSERT INTO auth.paragraph_reports(user_id,paragraph_id,language,commit_hash,reason) VALUES ('$U1','001.0001','cz','dbd','t'),('$U1','002.0001','cz','dbd','t');" >/dev/null
mk_ren 001-b.sql 11111111 001.0001:001.0002; commit "c1 (b, sorts after a)"
mk_ren 001-a.sql 22222222 001.0002:001.0003; commit "c2 (a, identical timestamp)"
mk_ren 002-d-2.sql 33333333 002.0002:002.0003; mk_ren 002-d.sql 44444444 002.0001:002.0002; commit "c3 (d and d-2 in one commit)"
run renumber
assert_eq 0 "$RC" "order: run succeeds"
assert_eq "001.0003" "$(report_at 1)" "order: identical timestamps apply in commit order (b then a), not name order"
assert_eq "002.0003" "$(report_at 2)" "order: X.sql applies before X-2.sql"

# ============================================================== concurrency
echo "-- concurrency"
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
mig 0001-slow.sql "CREATE TABLE dbd_slow (id int); SELECT pg_sleep(4);"; commit "slow"
( DEPLOY_ROOT="$REPO" GIT_COMMIT=aaa111 bash "$RUNNER" migrations >"$WORK/c1.out" 2>&1; echo $? >"$WORK/c1.rc" ) &
P1=$!
sleep 1.5
( DEPLOY_ROOT="$REPO" GIT_COMMIT=bbb222 bash "$RUNNER" migrations >"$WORK/c2.out" 2>&1; echo $? >"$WORK/c2.rc" ) &
P2=$!
wait $P1 $P2
assert_eq "0 0" "$(cat "$WORK/c1.rc") $(cat "$WORK/c2.rc")" "concurrency: both runs exit 0"
assert_contains "applied 0001-slow.sql" "$(cat "$WORK/c1.out")" "concurrency: the first run applied it"
assert_contains "already applied by a concurrent run" "$(cat "$WORK/c2.out")" "concurrency: the second run reports already applied"
assert_eq 1 "$(ledger_count "WHERE filename='0001-slow.sql'")" "concurrency: exactly one ledger row"
assert_eq aaa111 "$(sql_su "SELECT git_commit FROM public.deploy_ledger WHERE filename='0001-slow.sql';")" "concurrency: recorded by the first run"

# ============================================================== commit proof, marker forgery, partial concurrency
echo "-- commit proof"
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
# a file whose own output carries the old marker text is still recorded as applied (markers are nonce-tagged)
mig 0001-forge.sql "SELECT 'DEPLOY_ALREADY_APPLIED' AS a, 'DEPLOY_ALREADY_APPLIED_00000000000000000000000000000000' AS b;
CREATE TABLE dbd_forge (id int);"
commit m
run migrations
assert_eq 0 "$RC" "forgery: a file printing the old marker text runs"
assert_contains "applied 0001-forge.sql" "$OUT" "forgery: ...and is reported applied, not 'already applied'"
assert_eq "t" "$(table_exists dbd_forge)" "forgery: its SQL committed"
assert_eq 1 "$(ledger_count "WHERE filename='0001-forge.sql' AND status='applied'")" "forgery: the ledger row exists"
# verify-ledger: fails loudly for a file whose transaction rolled back (no ledger row), passes for a recorded one
mig 0002-ghost.sql "CREATE TABLE dbd_ghost (id int);"
OUT=$(DEPLOY_ROOT="$REPO" bash "$RUNNER" verify-ledger migration "$REPO/src/auth/migrations/0001-forge.sql" 2>&1); RC=$?
assert_eq 0 "$RC" "verify-ledger: a recorded file passes"
OUT=$(DEPLOY_ROOT="$REPO" bash "$RUNNER" verify-ledger migration "$REPO/src/auth/migrations/0001-forge.sql" "$REPO/src/auth/migrations/0002-ghost.sql" 2>&1); RC=$?
assert_eq 1 "$RC" "verify-ledger: an unrecorded (rolled-back) file fails"
assert_contains "0002-ghost.sql" "$OUT" "verify-ledger: ...naming it"

# verify-ledger validates names like cmd_run does (they go into SQL)
OUT=$(DEPLOY_ROOT="$REPO" bash "$RUNNER" verify-ledger migration "$REPO/src/auth/migrations/x'y.sql" 2>&1); RC=$?
assert_eq 1 "$RC" "verify-ledger: an unsafe file name is refused"; assert_contains "unsafe file name" "$OUT" "verify-ledger: ...with a name verdict"
# NOTIFY pgrst still goes out when migration 1 commits and migration 2 fails (wrapper records every NOTIFY it sees on stdin)
cat > "$WORK/spy.sh" <<'EOS'
#!/usr/bin/env bash
buf="$(mktemp)"; cat > "$buf"
grep -q 'NOTIFY pgrst' "$buf" && echo notify >> "$SPY_LOG"
$REAL_DOCKER "$@" < "$buf"; rc=$?; rm -f "$buf"; exit $rc
EOS
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
mig 0001-ok.sql "CREATE TABLE dbd_ok (id int);"; mig 0002-bad.sql "SELECT 1/0;"; commit m
: > "$WORK/spy.log"
OUT=$(SPY_LOG="$WORK/spy.log" REAL_DOCKER="$DOCKER" DOCKER="bash $WORK/spy.sh" DEPLOY_ROOT="$REPO" GIT_COMMIT=x2 bash "$RUNNER" migrations 2>&1); RC=$?
assert_eq 1 "$RC" "notify: migration 2 failing still fails the run"
assert_eq "t" "$(table_exists dbd_ok)" "notify: migration 1 stayed committed"
assert_eq 1 "$(wc -l < "$WORK/spy.log")" "notify: NOTIFY pgrst was sent despite the failure"
assert_contains "FAILED applying 0002-bad.sql" "$OUT" "notify: the original error is reported"
# COMMIT swallowed: a DOCKER wrapper drops everything from the runner's COMMIT; on, so psql exits 0 with nothing committed
cat > "$WORK/nocommit.sh" <<'EOS'
#!/usr/bin/env bash
sed '/^COMMIT;$/,$d' | $REAL_DOCKER "$@"
EOS
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
mig 0001-a.sql "CREATE TABLE dbd_a (id int);"; commit m
run migrations --dry-run   # (no ledger yet) create it with a real run of an empty set first
mig 0002-b.sql "CREATE TABLE dbd_b (id int);"
OUT=$(REAL_DOCKER="$DOCKER" DOCKER="bash $WORK/nocommit.sh" DEPLOY_ROOT="$REPO" GIT_COMMIT=x1 bash "$RUNNER" migrations 2>&1); RC=$?
# the bootstrap ledger-creation txn also ends in COMMIT; so the ledger is missing and the runner must die, not report applied
assert_eq 1 "$RC" "swallowed COMMIT: the run fails (exit non-zero)"
assert_not_contains "applied 0001-a.sql" "$OUT" "swallowed COMMIT: nothing is reported applied"
assert_eq "f" "$(table_exists dbd_a)" "swallowed COMMIT: nothing committed"
run migrations   # real run creates the ledger and applies both
assert_eq 0 "$RC" "swallowed COMMIT: ledger bootstrap with the real docker works"
mig 0003-c.sql "CREATE TABLE dbd_c (id int);"
OUT=$(REAL_DOCKER="$DOCKER" DOCKER="bash $WORK/nocommit.sh" DEPLOY_ROOT="$REPO" GIT_COMMIT=x2 bash "$RUNNER" migrations 2>&1); RC=$?
assert_eq 1 "$RC" "swallowed COMMIT (ledger exists): the run fails"
assert_contains "never confirmed COMMIT" "$OUT" "swallowed COMMIT: ...saying COMMIT was not confirmed"
assert_not_contains "applied 0003-c.sql" "$OUT" "swallowed COMMIT: ...and not reporting it applied"
assert_eq "f" "$(table_exists dbd_c)" "swallowed COMMIT: file not applied"
assert_eq 0 "$(ledger_count "WHERE filename='0003-c.sql'")" "swallowed COMMIT: no ledger row"

echo "-- concurrent partial overlap (stale ledger read)"
# DOCKER wrapper: just before the runner's first apply transaction, "another session" runs STUB_PRE_SQL (records A etc.)
cat > "$WORK/racer.sh" <<'EOS'
#!/usr/bin/env bash
if [ "$1 $2" = "exec -i" ] && [ ! -e "$STUB_FLAG" ]; then
  in="$(cat)"
  if printf '%s' "$in" | grep -q 'RETURNING 1'; then
    : > "$STUB_FLAG"
    printf '%s\n' "$STUB_PRE_SQL" | $REAL_DOCKER exec -i "$AUTH_DB_CONTAINER" psql -X -q -v ON_ERROR_STOP=1 -U gotrue -d gotrue >/dev/null || exit 99
  fi
  printf '%s\n' "$in" | $REAL_DOCKER "$@"
else
  $REAL_DOCKER "$@"
fi
EOS
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
sql_su "INSERT INTO auth.paragraph_reports(user_id,paragraph_id,language,commit_hash,reason) VALUES ('$U1','001.0001','cz','dbd','t');" >/dev/null
mk_ren 001-a.sql aaaaaaa1 001.0001:001.0002
mk_ren 002-b.sql bbbbbbb2 001.0002:001.0003
commit "A and B"
SHA_A="$(sha256sum "$REPO/content/_renumber/001-a.sql" | cut -c1-64)"
# ledger must exist for the pre-SQL: the runner creates it before the apply txn, which is when the racer fires
rm -f "$WORK/flag"
OUT=$(REAL_DOCKER="$DOCKER" DOCKER="bash $WORK/racer.sh" STUB_FLAG="$WORK/flag" \
  STUB_PRE_SQL="UPDATE auth.paragraph_reports SET paragraph_id='001.0002' WHERE id=1; INSERT INTO public.deploy_ledger (kind,filename,sha256,status,git_commit) VALUES ('renumber','001-a.sql','$SHA_A','applied','other');" \
  DEPLOY_ROOT="$REPO" GIT_COMMIT=me1 bash "$RUNNER" renumber 2>&1); RC=$?
assert_eq 0 "$RC" "partial overlap (renumber): exits 0"
assert_contains "re-reading the ledger" "$OUT" "partial overlap (renumber): re-classified after the conflict"
assert_contains "applied 002-b.sql" "$OUT" "partial overlap (renumber): B reported applied"
assert_eq "001.0003" "$(report_at 1)" "partial overlap (renumber): B really ran (0002 -> 0003)"
assert_eq 2 "$(ledger_count "WHERE kind='renumber' AND status='applied'")" "partial overlap (renumber): A and B recorded"
assert_eq other "$(sql_su "SELECT git_commit FROM public.deploy_ledger WHERE filename='001-a.sql';")" "partial overlap (renumber): A stays recorded by the other session"
# same for migrations (one transaction per file): A recorded by the other session, B still applied
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
mig 0001-a.sql "CREATE TABLE dbd_a (id int);"; mig 0002-b.sql "CREATE TABLE dbd_b (id int);"; commit "mig A and B"
SHA_A="$(sha256sum "$REPO/src/auth/migrations/0001-a.sql" | cut -c1-64)"
rm -f "$WORK/flag"
OUT=$(REAL_DOCKER="$DOCKER" DOCKER="bash $WORK/racer.sh" STUB_FLAG="$WORK/flag" \
  STUB_PRE_SQL="CREATE TABLE auth.dbd_a (id int); INSERT INTO public.deploy_ledger (kind,filename,sha256,status,git_commit) VALUES ('migration','0001-a.sql','$SHA_A','applied','other');" \
  DEPLOY_ROOT="$REPO" GIT_COMMIT=me2 bash "$RUNNER" migrations 2>&1); RC=$?
assert_eq 0 "$RC" "partial overlap (migrations): exits 0"
assert_contains "already applied by a concurrent run" "$OUT" "partial overlap (migrations): A reported as concurrent"
assert_contains "applied 0002-b.sql" "$OUT" "partial overlap (migrations): B applied"
assert_eq "t" "$(table_exists dbd_b)" "partial overlap (migrations): B's SQL ran"
# a concurrent run that recorded A with a DIFFERENT hash is a hard failure, not a silent skip
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
mig 0001-a.sql "CREATE TABLE dbd_a (id int);"; commit "m"
rm -f "$WORK/flag"
OUT=$(REAL_DOCKER="$DOCKER" DOCKER="bash $WORK/racer.sh" STUB_FLAG="$WORK/flag" \
  STUB_PRE_SQL="INSERT INTO public.deploy_ledger (kind,filename,sha256,status,git_commit) VALUES ('migration','0001-a.sql','$(printf '0%.0s' $(seq 64))','applied','other');" \
  DEPLOY_ROOT="$REPO" GIT_COMMIT=me3 bash "$RUNNER" migrations 2>&1); RC=$?
assert_eq 1 "$RC" "partial overlap: a conflicting row with a different hash fails"

echo "-- root resolution from a subdirectory"
reset_db; new_repo
mkdir -p "$REPO/src/frontend"; cp "$RUNNER" "$REPO/src/auth/db-deploy.sh"
mk_ren 001-sub.sql 5ca1ab1e 001.0001:001.0002
DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
commit "fixture repo with its own copy of the runner"
OUT=$(cd "$REPO/src/frontend" && env -u DEPLOY_ROOT GIT_COMMIT=sub1 bash ../auth/db-deploy.sh renumber --dry-run 2>&1); RC=$?
assert_eq 0 "$RC" "subdir: dry-run without DEPLOY_ROOT exits 0"
assert_contains "would apply 001-sub.sql" "$OUT" "subdir: the fixture repo root was resolved (its script is listed)"

# ============================================================== output hygiene
echo "-- output"
reset_db; new_repo; DEPLOY_ROOT="$REPO" bash "$RUNNER" seed >/dev/null
mig 0001-data.sql "CREATE TABLE dbd_s (v text PRIMARY KEY);
INSERT INTO dbd_s VALUES ('SECRETROW_ALPHA');
SELECT * FROM dbd_s;
DO \$\$ BEGIN RAISE NOTICE 'NOTICE_SECRET_BETA'; END \$\$;"
commit m1
run migrations
assert_eq 0 "$RC" "output: success run"
assert_not_contains SECRETROW_ALPHA "$OUT" "output: SELECT results are not printed"
assert_not_contains NOTICE_SECRET_BETA "$OUT" "output: notices are not printed"
mig 0002-dup.sql "INSERT INTO dbd_s VALUES ('SECRETROW_ALPHA');"
run migrations
assert_eq 1 "$RC" "output: duplicate-key failure"
assert_not_contains SECRETROW_ALPHA "$OUT" "output: error output carries no row data (DETAIL suppressed)"
assert_contains "duplicate key" "$OUT" "output: ...but the error class is shown"
run migrations --dry-run
assert_not_contains SECRETROW_ALPHA "$OUT" "output: dry-run prints no row data"

# ============================================================== seed command
echo "-- seed"
reset_db; new_repo
printf -- '-- legacy A\nSELECT 1;\n' > "$REPO/content/_renumber/009-z.sql"
printf -- '-- legacy B\nSELECT 2;\n' > "$REPO/content/_renumber/001-a.sql"
mk_ren 005-new.sql 99999999 001.0001:001.0002
export DEPLOY_ROOT="$REPO"
OUT=$(bash "$RUNNER" seed 2>&1); RC=$?
assert_eq 0 "$RC" "seed: generation exits 0"
SEED="$REPO/src/auth/migrations/legacy-renumber-seed.tsv"
assert_eq "001-a.sql 009-z.sql" "$(cut -f1 "$SEED" | tr '\n' ' ' | sed 's/ $//')" "seed: marker-less files only, sorted"
assert_eq "$(sha256sum "$REPO/content/_renumber/009-z.sql" | cut -c1-64)" "$(awk -F'\t' '$1=="009-z.sql"{print $2}' "$SEED")" "seed: sha256 recorded"
bash "$RUNNER" seed --check >/dev/null 2>&1; assert_eq 0 "$?" "seed --check: passes on a fresh seed"
printf -- '-- legacy C\nSELECT 3;\n' > "$REPO/content/_renumber/010-new.sql"
OUT=$(bash "$RUNNER" seed --check 2>&1); RC=$?
assert_eq 1 "$RC" "seed --check: fails when a marker-less file is not covered"; assert_contains 010-new.sql "$OUT" "seed --check: ...naming it"
bash "$RUNNER" seed >/dev/null; printf -- '-- edited\nSELECT 9;\n' > "$REPO/content/_renumber/009-z.sql"
OUT=$(bash "$RUNNER" seed --check 2>&1); RC=$?
assert_eq 1 "$RC" "seed --check: fails on a hash mismatch"; assert_contains "hash mismatch: 009-z.sql" "$OUT" "seed --check: ...naming it"
mv "$SEED" "$SEED.gone"; bash "$RUNNER" seed --check >/dev/null 2>&1; assert_eq 1 "$?" "seed --check: fails when the seed is missing"; mv "$SEED.gone" "$SEED"
bash "$RUNNER" seed >/dev/null
bash "$RUNNER" seed-add "$REPO/content/_renumber/005-new.sql" >/dev/null
assert_eq 1 "$(grep -c '^005-new.sql' "$SEED")" "seed-add: a marker-bearing file can be added by hand"
bash "$RUNNER" seed >/dev/null
assert_eq 1 "$(grep -c '^005-new.sql' "$SEED")" "seed: regeneration keeps hand-added lines"
bash "$RUNNER" seed-add "$REPO/content/_renumber/005-new.sql" >/dev/null; assert_eq 0 "$?" "seed-add: idempotent"
mkdir -p "$REPO/content/_renumber/sub"; printf 'SELECT 1;\n' > "$REPO/content/_renumber/sub/x.sql"
bash "$RUNNER" seed-add "$REPO/content/_renumber/sub/x.sql" >/dev/null 2>&1; assert_eq 1 "$?" "seed-add: subdirectory files are refused"
unset DEPLOY_ROOT

test_done
