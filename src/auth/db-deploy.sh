#!/usr/bin/env bash
# DB deploy runner: applies src/auth/migrations/*.sql and content/_renumber/*.sql to the auth database.
#
# Prod (on aretea, in the freshly reset deploy checkout):
#   GIT_COMMIT=<sha> bash src/auth/db-deploy.sh migrations [--dry-run]
#   GIT_COMMIT=<sha> bash src/auth/db-deploy.sh renumber   [--dry-run]
# Helpers (no database needed unless noted):
#   db-deploy.sh lint <migration|renumber> <file>   lint one file (exit 1 = rejected)
#   db-deploy.sh verify-ledger <kind> <file>...     fail unless each file has an applied ledger row (needs the database)
#   db-deploy.sh renumber-order                     top-level renumber scripts in apply order
#   db-deploy.sh seed [--check]                     write / verify the legacy seed (just db-seed)
#   db-deploy.sh seed-add <file>                    append one file to the seed (just db-seed-add)
#
# Environment: GIT_COMMIT (required for migrations|renumber), DOCKER (default docker), AUTH_DB_CONTAINER
# (default auth-db), DEPLOY_ROOT (default: git toplevel of this script), SEED_FILE (default
# src/auth/migrations/legacy-renumber-seed.tsv), AWK (default awk).
# Needs only bash (4+), git, coreutils, a POSIX awk and docker on the host. psql runs INSIDE the auth-db container
# and reads SQL from stdin: host files are never visible to it, so \i is never used.
#
# Design: see docs/DB_DEPLOY.md (ledger, classification, lint, ordering, bootstrap seed, failure table).
# Concurrency (B3-8): the \gset/\if re-check IS implemented. Each ledger insert is `ON CONFLICT DO NOTHING`
# wrapped in a CTE so \gset always gets exactly one row (a bare RETURNING with zero rows makes \gset error out);
# when a concurrent run already recorded the file the runner-emitted `\if` branch prints a nonce-tagged marker and
# `\quit`s before COMMIT (rollback). The runner then re-reads the ledger, re-classifies and applies what is still
# pending (at most 3 attempts; still conflicting -> exit 1 "concurrent run; re-run"), so a partial overlap never
# leaves a script unapplied behind an exit 0.
# Commit check: every transaction ends with `\echo DEPLOY_COMMITTED_<nonce>` (random per transaction, so repo SQL
# cannot forge it). The nonce is only a sanity check, NOT proof of COMMIT: if psql's paren / `CREATE FUNCTION ... begin`
# depth is non-zero at EOF, the `\echo` can print while the final COMMIT is still buffered and never sent. Safety rests
# on psql's exit code plus verify_ledger (a ledger row (kind, filename, sha256, status='applied') for every file,
# read in a separate session after psql exited); a missing nonce or a missing row is a hard failure. The lint also
# rejects a statement that reaches its `;` with open parentheses (unbalanced-parens).
# Lint limits: transaction control is rejected, including `BEGIN ATOMIC` SQL-standard function bodies (use AS $$ ... $$).
# Also rejected: LANGUAGE c/internal/untrusted (...u), LOAD, CREATE LANGUAGE, pg_{execute,read,write}_server_* grants.
# Known over-strictness (the server rejects these anyway): a dollar quote or an E'...' string directly after a digit or
# `$` (e.g. `1$$`, `1e'..'`, `$e'..'`) is treated as a plain token by the lint, so the quote state may differ from psql's
# and the file is rejected or mis-split; also `SET names = ...` (an UPDATE column called names) trips encoding-setting, and
# a legitimate UTF-8 character directly followed by a backslash (`é\`) trips binary-content.
# Quote-state guarantee: a plain '...' literal that contains a backslash-quote run (a `'` directly preceded by an odd
# number of backslashes: backslash-quote-in-literal) is rejected, as is a U&"..." / U&'...' prefix (unicode-escape-literal).
# Without such a run psql lexes a plain literal identically whether standard_conforming_strings is on or off, so a
# migration that turns it off (SET, ALTER ROLE/DATABASE, U&"..." identifiers, concatenated set_config, dynamic EXECUTE)
# can no longer move a statement boundary. The encoding/quoting rules (quoting-setting, encoding-setting) are keyword
# checks only and easy to evade; the structural rules (binary-content, backslash-quote-in-literal) carry the guarantee.
# psql also runs with PGOPTIONS='-c standard_conforming_strings=on' to override role/database defaults.
# Output: only file names, hashes, counts and verdicts. psql runs with VERBOSITY=terse (no DETAIL/row echoes);
# on success psql output is discarded, on failure only its ERROR/FATAL lines are shown. (A terse error message
# can still quote a value in rare cases, e.g. a failed type cast; DETAIL, which carries failing rows, never appears.)
set -u -o pipefail

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER="${DOCKER:-docker}"
AUTH_DB_CONTAINER="${AUTH_DB_CONTAINER:-auth-db}"
AWK="${AWK:-awk}"
ROOT="${DEPLOY_ROOT:-$(git -C "$SELF_DIR" rev-parse --show-toplevel 2>/dev/null)}"
MIG_DIR="$ROOT/src/auth/migrations"
REN_DIR="$ROOT/content/_renumber"
SEED_FILE="${SEED_FILE:-$MIG_DIR/legacy-renumber-seed.tsv}"
MARKER='-- deploy-ledger: renumber v1'
ALLOWED_EXTENSIONS=""   # CREATE EXTENSION allowlist for migrations (space separated); empty for now
LOCK_KEY=4242
NAME_RE='^[A-Za-z0-9._+-]+\.sql$'

die() { echo "db-deploy: $*" >&2; exit 1; }

# ---------------------------------------------------------------- lint (tokeniser + rules, in awk)
# Tokeniser state machine: -- and nested /* */ comments are dropped; '...' (with E'...' backslash escapes),
# "..." and $tag$...$tag$ bodies are opaque to the splitter; top-level statements end at ';'; a psql backslash
# outside quotes/comments is a violation, and so is a physical line whose first non-blank char is '\' when the
# tokeniser is at top level at the start of that line (inside a multi-line literal or body such a line is data).
# Rules on top-level statements: transaction control, COPY, ALTER SYSTEM, superuser roles, CREATE EXTENSION
# (outside the allowlist), the renumber allowlist. Rules on everything incl. bodies and literals: forbidden
# server-side file/program functions, COPY ... TO|FROM|PROGRAM, quoting-mode and client_encoding / SET NAMES settings.
# Top level also: ALTER DATABASE|ROLE|USER ... SET, and a statement with open parentheses at its ';'. Prints "rule<TAB>line".
read -r -d '' LINT_AWK <<'AWK'
function viol(rule, ln,    k) { k = rule SUBSEP ln; if (!(k in sv)) { sv[k] = 1; printf "%s\t%d\n", rule, ln } }
function add(s) { stmt = stmt s; if (!first_ln && s ~ /[^ \t\r\n]/) first_ln = NR }
function isid(ch) { return (ch != "" && ch ~ /[A-Za-z0-9_$\200-\377]/) }   # bytes >= 0x80 are identifier chars (awk runs under LC_ALL=C)
function hasword(l, w,    re) { re = "(^|[^a-z0-9_])" w "([^a-z0-9_]|$)"; return (l ~ re) }
function finish() { check(stmt, first_ln); stmt = ""; first_ln = 0 }

# Renumber allowlist: the exact D4 shape, in order (normalised: lower case, single spaces).
function renum(a, ln,    p, p2, body, nt, ok) {
  ok = 0
  if (rs == 0) {
    if (a ~ ("^create temp table renumber_map_" h8 " \\(old_id text primary key, new_id text not null\\)$")) {
      H = substr(a, 32, 8); rs = 1; ok = 1
    }
  } else if (rs == 1 || rs == 2) {
    p = "insert into renumber_map_" H " (old_id, new_id) values "
    p2 = "insert into renumber_map_" H " values "      # the column list is optional
    if (substr(a, 1, length(p)) == p || substr(a, 1, length(p2)) == p2) {
      body = substr(a, (substr(a, 1, length(p)) == p) ? length(p) + 1 : length(p2) + 1)
      nt = gsub(/\('[0-9a-z._-]+', ?'[0-9a-z._-]+'\)/, "", body)
      if (nt > 0 && body ~ /^[ ,]*$/) { rs = 2; ok = 1 }
    } else if (rs == 2 && a == "update paragraph_reports r set paragraph_id = m.new_id from renumber_map_" H " m where r.paragraph_id = m.old_id") { rs = 3; ok = 1 }
  } else if (rs == 3 && a == "create temp table moved_stars_" H " as select s.id, s.user_id, m.new_id, s.language, s.commit_hash, s.created_at from paragraph_stars s join renumber_map_" H " m on s.paragraph_id = m.old_id") { rs = 4; ok = 1 }
  else if (rs == 4 && a == "delete from paragraph_stars s using renumber_map_" H " m where s.paragraph_id = m.old_id") { rs = 5; ok = 1 }
  else if (rs == 5 && a == "insert into paragraph_stars (id, user_id, paragraph_id, language, commit_hash, created_at) select id, user_id, new_id, language, commit_hash, created_at from moved_stars_" H " on conflict (user_id, paragraph_id) do nothing") { rs = 6; ok = 1 }
  else if (rs == 6 && a == "drop table renumber_map_" H ", moved_stars_" H) { rs = 7; ok = 1 }
  if (!ok) viol("renumber-shape", ln)
}

function check(s, ln,    n, l, fw, rest, a, ext) {
  n = s; gsub(/[ \t\r\n]+/, " ", n); sub(/^ /, "", n); sub(/ $/, "", n)
  if (n == "") return
  nstmt++
  l = tolower(n)
  fw = l; sub(/[^a-z_].*$/, "", fw)
  if (fw ~ /^(begin|commit|end|rollback|savepoint|release|abort|start)$/ || l ~ /^prepare transaction/) viol("transaction-control (note: BEGIN ATOMIC function bodies are not supported; use AS $$ ... $$)", ln)
  if (fw == "copy") viol("copy", ln)
  if (l ~ /^alter system/) viol("alter-system", ln)
  if (l ~ /^alter (database|role|user) / && hasword(l, "set")) viol("alter-set", ln)   # persistent per-db/role settings (e.g. client_encoding)
  if (fw == "load") viol("load", ln)
  if (l ~ /^create (or replace )?(trusted )?(procedural )?language/) viol("create-language", ln)
  if (l ~ /^(create|alter) (role|user|group) / && hasword(l, "superuser")) viol("superuser-role", ln)
  if (l ~ /^create extension/) {
    ext = l; sub(/^create extension (if not exists )?/, "", ext); sub(/[^a-z0-9_"-].*$/, "", ext); gsub(/"/, "", ext)
    if (index(" " allowed_ext " ", " " ext " ") == 0) viol("extension-not-allowed", ln)
  }
  if (hasword(l, "(pg_read_file|pg_read_binary_file|pg_ls_[a-z0-9_]*|pg_stat_file|pg_file_write|pg_file_unlink|pg_logdir_ls|lo_import|lo_export|dblink[a-z0-9_]*)")) viol("forbidden-function", ln)
  # languages that run native code or are untrusted (any ...u: plpythonu, plperlu, pltclu), also in DO ... LANGUAGE ...
  if (l ~ /(^|[^a-z0-9_])language +["']?(c|internal|[a-z0-9_]*u)["']?([^a-z0-9_]|$)/) viol("unsafe-language", ln)
  if (hasword(l, "(pg_execute_server_program|pg_read_server_files|pg_write_server_files)")) viol("server-file-role", ln)
  if (hasword(l, "(standard_conforming_strings|backslash_quote)")) viol("quoting-setting", ln)
  # a different client encoding makes psql's quote scanning disagree with ours (e.g. SJIS: high byte + 0x5C is one char)
  if (hasword(l, "client_encoding") || l ~ /(^|[^a-z0-9_])set +names([^a-z0-9_]|$)/) viol("encoding-setting", ln)
  # NOTE: the COPY rule below matches the word "copy" anywhere (comments are dropped, but string literals and
  # function bodies are not), so prose such as 'copy to the archive' in a literal is rejected too. Deliberate
  # over-match: rewrite the literal.
  if (match(l, /(^|[^a-z0-9_])copy([^a-z0-9_]|$)/)) {
    rest = substr(l, RSTART + RLENGTH - 1)
    if (hasword(rest, "(program|to|from)")) viol("copy", ln)
  }
  if (kind == "renumber") {
    a = l; gsub(/\( /, "(", a); gsub(/ \)/, ")", a)
    renum(a, ln)
  }
}

BEGIN { pd = 0; h8 = "[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]"; st = 0; rs = 0 }
{
  line = $0; sub(/\r$/, "", line)
  if (NR == 1 && kind == "renumber" && line != marker) viol("missing-marker", 1)
  if (st == 0 && line ~ /^[ \t]*\\/) viol("psql-meta-command", NR)
  L = length(line); i = 1
  while (i <= L) {
    rest = substr(line, i)
    if (st == 0) {
      if (!match(rest, /[-\/'"$\\;:()]/)) { add(rest); i = L + 1; break }
      if (RSTART > 1) { add(substr(rest, 1, RSTART - 1)); i += RSTART - 1; rest = substr(line, i) }
      c = substr(line, i, 1); c2 = substr(line, i, 2)
      if (c == "-") { if (c2 == "--") break; add(c); i++ }
      else if (c == "/") { if (c2 == "/*") { st = 5; depth = 1; add(" "); i += 2 } else { add(c); i++ } }
      else if (c == "'") {
        prev = (i > 1) ? substr(line, i - 1, 1) : ""; pp = (i > 2) ? substr(line, i - 2, 1) : ""
        if (prev == "&" && pp ~ /[uU]/ && !isid((i > 3) ? substr(line, i - 3, 1) : "")) viol("unicode-escape-literal", NR)
        st = (prev ~ /[eE]/ && !isid(pp)) ? 2 : 1
        add(c); i++
      }
      else if (c == "\"") {
        if (i > 2 && substr(line, i - 1, 1) == "&" && substr(line, i - 2, 1) ~ /[uU]/ && !isid((i > 3) ? substr(line, i - 3, 1) : "")) viol("unicode-escape-literal", NR)
        st = 3; add(c); i++ }
      else if (c == "$") {
        prev = (i > 1) ? substr(line, i - 1, 1) : ""
        if (!isid(prev) && match(rest, /^\$([A-Za-z_\200-\377][A-Za-z0-9_\200-\377]*)?\$/)) { tag = substr(rest, 1, RLENGTH); add(tag); i += RLENGTH; st = 4 }
        else { add(c); i++ }
      }
      else if (c == "\\") { viol("psql-meta-command", NR); add(c); i++ }
      else if (c == "(") { pd++; add(c); i++ }
      else if (c == ")") { if (pd > 0) pd--; add(c); i++ }   # like psql, never below 0
      else if (c == ";") { if (pd > 0) viol("unbalanced-parens", first_ln ? first_ln : NR); pd = 0; finish(); i++ }
      else if (c == ":") {   # psql substitutes :name, :'name', :"name", :{?name} outside quotes; a :: cast is fine
        if (c2 == "::") { add(c2); i += 2 }
        else { if (substr(line, i + 1, 1) ~ /[A-Za-z_'"{]/) viol("psql-variable", NR); add(c); i++ }
      }
    } else if (st == 1 || st == 3) {
      q = (st == 1) ? "'" : "\""
      p = index(rest, q)
      if (p == 0) { add(rest); i = L + 1 }
      else {
        if (st == 1) { k = i + p - 2; nb = 0; while (k >= 1 && substr(line, k, 1) == "\\") { nb++; k-- } if (nb % 2 == 1) viol("backslash-quote-in-literal", NR) }
        add(substr(rest, 1, p)); i += p; if (substr(line, i, 1) == q) { add(q); i++ } else st = 0 }
    } else if (st == 2) {
      if (!match(rest, /['\\]/)) { add(rest); i = L + 1 }
      else if (substr(rest, RSTART, 1) == "\\") { add(substr(rest, 1, RSTART)); i += RSTART; if (i <= L) { add(substr(line, i, 1)); i++ } }
      else { add(substr(rest, 1, RSTART)); i += RSTART; if (substr(line, i, 1) == "'") { add("'"); i++ } else st = 0 }
    } else if (st == 4) {
      p = index(rest, tag)
      if (p == 0) { add(rest); i = L + 1 }
      else { n = p - 1 + length(tag); add(substr(rest, 1, n)); i += n; st = 0 }
    } else if (st == 5) {
      if (!match(rest, /\/\*|\*\//)) { i = L + 1 }
      else {
        if (substr(rest, RSTART, 2) == "/*") depth++; else depth--
        i += RSTART + 1
        if (depth == 0) { st = 0; add(" ") }
      }
    }
  }
  add("\n")
}
END {
  if (st != 0) viol("unterminated-quote-or-comment", NR)
  if (stmt ~ /[^ \t\r\n]/) viol("missing-final-semicolon", first_ln)
  if (kind == "renumber" && rs != 7) viol("renumber-shape", NR)
}
AWK

# binary_line <file>: prints "<line><TAB><reason>" for the first problem line, nothing for clean text (byte-exact, LC_ALL=C):
#  - NUL, a C0 control byte other than TAB/LF/CR, or DEL (psql drops the rest of an input line after a NUL);
#  - a CR that is not immediately followed by LF (psql ends a `--` comment at CR, awk does not; CRLF is fine);
#  - a byte >= 0x80 immediately followed by a backslash: in SJIS/GBK/BIG5/GB18030/UHC the pair is one character, so
#    psql's E'..' escape handling would differ from ours. Valid UTF-8 never needs this, except a text character
#    directly followed by a backslash (`é\`): that false positive is accepted; rewrite it.
# Such bytes make awk and psql disagree about quote state, so the tokeniser must never see them. Not checked: UTF-8
# validity (psql with client_encoding UTF8 rejects invalid sequences itself).
binary_line() {
  local f="$1" n
  n="$(LC_ALL=C tr '\000-\010\013\014\016-\037\177' '\001' < "$f" | LC_ALL=C grep -a -n -m1 $'\001' | cut -d: -f1)"
  [ -n "$n" ] && { printf '%s\tNUL, control byte or DEL\n' "$n"; return 0; }
  n="$(LC_ALL=C grep -a -n -m1 $'\r.' "$f" | cut -d: -f1)"
  if [ -z "$n" ] && [ -s "$f" ] && [ "$(tail -c1 "$f" | od -An -tx1 | tr -d ' \n')" = 0d ]; then n="$(( $(wc -l < "$f") + 1 ))"; fi
  [ -n "$n" ] && { printf '%s\tCR not followed by LF\n' "$n"; return 0; }
  n="$(LC_ALL=C grep -a -n -m1 -P '[\x80-\xff]\\' "$f" | cut -d: -f1)"
  [ -n "$n" ] && { printf '%s\tbyte >= 0x80 followed by a backslash (also rejects UTF-8 text like "é\\"; rewrite it)\n' "$n"; return 0; }
  return 0
}

# lint_file <migration|renumber> <file>: returns 0 if clean; prints rule + line (never file content) otherwise.
lint_file() {
  local kind="$1" f="$2" out rule ln bl
  bl="$(binary_line "$f")" || true
  if [ -n "$bl" ]; then echo "LINT FAIL: $(basename "$f"): binary-content (line ${bl%%$'\t'*}: ${bl#*$'\t'})" >&2; return 1; fi
  out=$(LC_ALL=C "$AWK" -v kind="$kind" -v marker="$MARKER" -v allowed_ext="$ALLOWED_EXTENSIONS" "$LINT_AWK" "$f") \
    || { echo "LINT ERROR: $(basename "$f"): tokeniser failed" >&2; return 1; }
  [ -z "$out" ] && return 0
  while IFS=$'\t' read -r rule ln; do
    echo "LINT FAIL: $(basename "$f"): $rule (line $ln)" >&2
  done <<<"$out"
  return 1
}

# ---------------------------------------------------------------- helpers
sha_of() { sha256sum "$1" | cut -c1-64; }
has_marker() { [ "$(head -n1 "$1" | tr -d '\r')" = "$MARKER" ]; }

# psql exactly as on prod; stdin carries the SQL.
# shellcheck disable=SC2086
# PGCLIENTENCODING=UTF8 is explicit: the lint's quote scanning assumes a UTF-8 (ASCII-safe) client encoding.
psql_run() { $DOCKER exec -i -e PGCLIENTENCODING=UTF8 -e 'PGOPTIONS=-c standard_conforming_strings=on' "$AUTH_DB_CONTAINER" psql -X -q -v ON_ERROR_STOP=1 -v VERBOSITY=terse -U gotrue -d gotrue "$@"; }

# Top-level renumber scripts in apply order: first-add order along history (topology, no clocks), ties inside one
# commit by natural sort (<base>.sql < <base>-2.sql < <base>-10.sql). --no-renames so a renamed-in file still counts as added.
renumber_order() {
  local f line group=() name
  declare -A done_=() ondisk=()
  shopt -s nullglob
  for f in "$REN_DIR"/*.sql; do [ -f "$f" ] && ondisk[$(basename "$f")]=1; done
  shopt -u nullglob
  flush() {
    local n
    [ "${#group[@]}" -gt 0 ] || return 0
    printf '%s\n' "${group[@]}" | LC_ALL=C sort -V | while IFS= read -r n; do echo "$n.sql"; done
    group=()
  }
  {
    git -C "$ROOT" -c core.quotepath=off log --reverse --topo-order --diff-filter=A --no-renames --name-only \
      --format='@@COMMIT@@%H' -- 'content/_renumber/*.sql' || echo "@@GITFAIL@@"
  } | {
    while IFS= read -r line; do
      case "$line" in
        '@@GITFAIL@@') return 3 ;;
        '@@COMMIT@@'*) flush ;;
        '') ;;
        content/_renumber/*.sql)
          name="${line#content/_renumber/}"
          case "$name" in */*) continue ;; esac            # top level only
          [ -n "${done_[$name]:-}" ] && continue            # first add wins
          done_[$name]=1
          [ -n "${ondisk[$name]:-}" ] && group+=("${name%.sql}")
          ;;
      esac
    done
    flush
  } > "$ORDER_TMP" || return 1
  cat "$ORDER_TMP"
}

# ---------------------------------------------------------------- seed commands
seed_gen_lines() {   # stdout: sorted "name<TAB>sha" lines for the generated seed
  local f name existing
  {
    shopt -s nullglob
    for f in "$REN_DIR"/*.sql; do
      [ -f "$f" ] || continue
      name="$(basename "$f")"
      if ! has_marker "$f"; then printf '%s\t%s\n' "$name" "$(sha_of "$f")"; fi
    done
    shopt -u nullglob
    # keep manual `db-seed-add` lines for files that exist and carry the marker
    if [ -f "$SEED_FILE" ]; then
      while IFS=$'\t' read -r name existing; do
        [ -n "$name" ] || continue
        if [ -f "$REN_DIR/$name" ] && has_marker "$REN_DIR/$name"; then printf '%s\t%s\n' "$name" "$existing"; fi
      done < "$SEED_FILE"
    fi
  } | LC_ALL=C sort -u
}

cmd_seed() {
  local check=0 lines name sha f missing=0 expected
  [ "${1:-}" = "--check" ] && check=1
  if [ "$check" = 1 ]; then
    [ -f "$SEED_FILE" ] || { echo "db-seed --check: seed file missing: $SEED_FILE" >&2; return 1; }
    declare -A S=()
    while IFS=$'\t' read -r name sha; do [ -n "$name" ] && S[$name]="$sha"; done < "$SEED_FILE"
    shopt -s nullglob
    for f in "$REN_DIR"/*.sql; do
      [ -f "$f" ] || continue
      has_marker "$f" && continue
      name="$(basename "$f")"; sha="$(sha_of "$f")"
      if [ -z "${S[$name]:-}" ]; then echo "db-seed --check: not in seed: $name" >&2; missing=$((missing+1))
      elif [ "${S[$name]}" != "$sha" ]; then echo "db-seed --check: hash mismatch: $name" >&2; missing=$((missing+1)); fi
    done
    shopt -u nullglob
    [ "$missing" -eq 0 ] || { echo "db-seed --check: $missing problem(s); run: just db-seed" >&2; return 1; }
    echo "db-seed --check: seed covers every marker-less top-level renumber script"
    return 0
  fi
  lines="$(seed_gen_lines)"
  mkdir -p "$(dirname "$SEED_FILE")"
  if [ -n "$lines" ]; then printf '%s\n' "$lines" > "$SEED_FILE.tmp"; else : > "$SEED_FILE.tmp"; fi
  mv "$SEED_FILE.tmp" "$SEED_FILE"
  expected=$([ -n "$lines" ] && printf '%s\n' "$lines" | wc -l || echo 0)
  echo "db-seed: wrote $expected line(s) to $SEED_FILE"
}

cmd_seed_add() {
  local f="${1:-}" name sha cur
  [ -n "$f" ] || die "usage: seed-add <file>"
  [ -f "$f" ] || die "no such file: $f"
  f="$(cd "$(dirname "$f")" && pwd)/$(basename "$f")"
  [ "$(dirname "$f")" = "$(cd "$REN_DIR" && pwd)" ] || die "seed-add: $f is not a top-level content/_renumber/*.sql file"
  name="$(basename "$f")"
  [[ "$name" =~ $NAME_RE ]] || die "seed-add: invalid file name $name"
  sha="$(sha_of "$f")"
  if [ -f "$SEED_FILE" ]; then
    cur="$("$AWK" -F '\t' -v n="$name" '$1 == n { print $2 }' "$SEED_FILE")"
    if [ "$cur" = "$sha" ]; then echo "db-seed-add: $name already in seed"; return 0; fi
    [ -z "$cur" ] || die "seed-add: $name is in the seed with a different hash (never edit a committed script)"
  fi
  { [ -f "$SEED_FILE" ] && cat "$SEED_FILE"; printf '%s\t%s\n' "$name" "$sha"; } | LC_ALL=C sort -u > "$SEED_FILE.tmp"
  mv "$SEED_FILE.tmp" "$SEED_FILE"
  echo "db-seed-add: added $name"
}

# ---------------------------------------------------------------- run (migrations | renumber)
RECOVERY_TEXT() {
  echo "  $1 is a pre-ledger renumber script that is not in the seed. Either regenerate it with the current generator (just rebuild-carnet ...) or, ONLY if you have confirmed it must never run, append its line to src/auth/migrations/legacy-renumber-seed.tsv (just db-seed-add $1)." >&2
}

# verify_ledger <kind> <files...>: 0 only if public.deploy_ledger holds an applied row with the file's sha256 for every
# file (proof the transaction really committed). Prints the missing file names on failure.
verify_ledger() {
  local kind="$1" f vals="" missing
  shift
  [ "$#" -gt 0 ] || return 0
  for f in "$@"; do   # same validation as cmd_run: the names go into SQL
    [[ "$(basename "$f")" =~ $NAME_RE ]] || { echo "db-deploy: FAIL: unsafe file name: $(basename "$f")" >&2; return 1; }
    vals="${vals:+$vals,}('$(basename "$f")','$(sha_of "$f")')"
  done
  missing="$(psql_run -At -c "SELECT v.fn FROM (VALUES $vals) AS v(fn, sh) WHERE NOT EXISTS (SELECT 1 FROM public.deploy_ledger l WHERE l.kind = '$kind' AND l.filename = v.fn AND l.sha256 = v.sh AND l.status = 'applied')")" \
    || { echo "db-deploy: FAIL: could not verify the ledger" >&2; return 1; }
  if [ -n "$missing" ]; then
    echo "db-deploy: FAIL: no applied ledger row for: $(echo "$missing" | tr '\n' ' ')" >&2
    return 1
  fi
  return 0
}

# apply_txn <kind> <files...>: one transaction; returns 0 applied (commit proven), 10 already applied concurrently
# (rolled back), 1 failed.
apply_txn() {
  local kind="$1" f out err rc nonce
  shift
  nonce="$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  [ "${#nonce}" -eq 32 ] || { echo "db-deploy: FAIL: cannot generate a nonce" >&2; return 1; }
  err="$(mktemp)"
  out=$(
    {
      printf 'BEGIN;\nSELECT pg_advisory_xact_lock(%s);\n' "$LOCK_KEY"
      for f in "$@"; do
        # runner-emitted meta-commands: the only backslash lines that ever reach psql (repo files are linted)
        printf "WITH ins AS (INSERT INTO public.deploy_ledger (kind, filename, sha256, status, git_commit) VALUES ('%s','%s','%s','applied','%s') ON CONFLICT DO NOTHING RETURNING 1) SELECT EXISTS (SELECT 1 FROM ins) AS fresh \\\\gset\n" \
          "$kind" "$(basename "$f")" "$(sha_of "$f")" "$GIT_COMMIT"
        printf '\\if :fresh\n\\else\n\\echo DEPLOY_ALREADY_APPLIED_%s\n\\quit\n\\endif\n' "$nonce"
        cat "$f"; printf '\n'
      done
      printf 'COMMIT;\n\\echo DEPLOY_COMMITTED_%s\n' "$nonce"
    } | psql_run 2>"$err"
  )
  rc=$?
  if [ "$rc" -ne 0 ]; then
    grep -E 'ERROR|FATAL' "$err" | head -5 | sed 's/^/  psql: /' >&2
    rm -f "$err"; return 1
  fi
  rm -f "$err"
  if printf '%s\n' "$out" | grep -qxF "DEPLOY_ALREADY_APPLIED_$nonce"; then return 10; fi
  if ! printf '%s\n' "$out" | grep -qxF "DEPLOY_COMMITTED_$nonce"; then
    echo "db-deploy: FAIL: psql exited 0 but never confirmed COMMIT (nothing is committed)" >&2
    return 1
  fi
  verify_ledger "$kind" "$@" || return 1
  return 0
}

# die_notify <msg>: like die, but first (best effort) tells PostgREST to reload when an earlier migration of this run
# already committed; a NOTIFY failure must not mask the original error.
die_notify() {
  if [ "${applied:-0}" -gt 0 ]; then
    printf "NOTIFY pgrst, 'reload schema';\n" | psql_run >/dev/null 2>&1 && echo "notified pgrst: reload schema" >&2
  fi
  die "$@"
}

# read_ledger: (re)load the ledger into L_SHA / L_ST (declared by cmd_run) and set `legacy` to the number of legacy rows.
read_ledger() {
  local rows k fn sh s
  rows="$(psql_run -At -F $'\t' -c "SELECT kind, filename, sha256, status FROM public.deploy_ledger")" \
    || die "could not read the ledger"
  legacy=0
  while IFS=$'\t' read -r k fn sh s; do
    [ -n "$k" ] || continue
    L_SHA["$k|$fn"]="$sh"; L_ST["$k|$fn"]="$s"
    [ "$s" = legacy ] && legacy=$((legacy+1))
  done <<<"$rows"
}

cmd_run() {
  local which="$1" dry="$2" kind f name sha key st
  case "$which" in migrations) kind=migration ;; renumber) kind=renumber ;; esac

  # preconditions
  [ -n "${GIT_COMMIT:-}" ] || die "GIT_COMMIT must be set and non-empty"
  [[ "$GIT_COMMIT" =~ ^[A-Za-z0-9._-]+$ ]] || die "GIT_COMMIT has unexpected characters"
  [ -n "$ROOT" ] || die "cannot find the repository root (set DEPLOY_ROOT)"
  [ "$(git -C "$ROOT" rev-parse --is-shallow-repository 2>/dev/null)" = "false" ] \
    || die "the checkout is shallow (or not a git repository): the renumber order needs full history"
  psql_run -At -c 'SELECT 1' >/dev/null 2>&1 || die "cannot reach the database via: $DOCKER exec -i $AUTH_DB_CONTAINER psql"

  declare -A L_SHA=() L_ST=()
  legacy=0
  local has_ledger
  has_ledger="$(psql_run -At -c "SELECT to_regclass('public.deploy_ledger') IS NOT NULL")" || die "ledger probe failed"
  if [ "$has_ledger" != t ] && [ "$dry" = 0 ]; then
    { printf 'BEGIN;\nSELECT pg_advisory_xact_lock(%s);\n' "$LOCK_KEY"
      cat <<'SQL'
CREATE TABLE IF NOT EXISTS public.deploy_ledger (
  kind       TEXT NOT NULL CHECK (kind IN ('migration','renumber')),
  filename   TEXT NOT NULL,
  sha256     TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('applied','legacy')),
  git_commit TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (kind, filename)
);
COMMIT;
SQL
    } | psql_run >/dev/null || die "could not create deploy_ledger"
    has_ledger=t
  fi
  [ "$has_ledger" = t ] && read_ledger

  # bootstrap check (first run: no legacy rows in the ledger)
  declare -A S_SHA=()
  local seed_names=()
  if [ -f "$SEED_FILE" ]; then
    while IFS=$'\t' read -r name sha; do
      [ -n "$name" ] || continue
      [[ "$name" =~ $NAME_RE ]] && [[ "$sha" =~ ^[0-9a-f]{64}$ ]] || die "malformed seed line in $SEED_FILE"
      S_SHA[$name]="$sha"; seed_names+=("$name")
    done < "$SEED_FILE"
  fi
  if [ "$legacy" -eq 0 ]; then
    [ -f "$SEED_FILE" ] || { echo "db-deploy: FAIL: the legacy seed is missing ($SEED_FILE); the ledger has no legacy rows yet" >&2; echo "  generate it with: just db-seed" >&2; exit 1; }
    local bad=0
    shopt -s nullglob
    for f in "$REN_DIR"/*.sql; do
      [ -f "$f" ] || continue
      has_marker "$f" && continue
      name="$(basename "$f")"
      if [ "${S_SHA[$name]:-}" != "$(sha_of "$f")" ]; then
        echo "db-deploy: FAIL: seed does not cover $name (missing or hash differs)" >&2; RECOVERY_TEXT "$name"; bad=1
      fi
    done
    shopt -u nullglob
    [ "$bad" = 0 ] || exit 1
  fi
  local seed_new=()   # seed rows the ledger does not have yet -> legacy
  for name in "${seed_names[@]+"${seed_names[@]}"}"; do
    if [ -z "${L_SHA[renumber|$name]:-}" ]; then
      seed_new+=("$name"); L_SHA["renumber|$name"]="${S_SHA[$name]}"; L_ST["renumber|$name"]=legacy
    fi
  done

  # candidates
  local files=()
  if [ "$kind" = migration ]; then
    while IFS= read -r f; do files+=("$f"); done < <(find "$MIG_DIR" -maxdepth 1 -type f -name '*.sql' 2>/dev/null | LC_ALL=C sort)
  else
    ORDER_TMP="$(mktemp)"
    renumber_order >/dev/null || { rm -f "$ORDER_TMP"; die "cannot determine the renumber order from git history"; }
    local n
    while IFS= read -r n; do [ -n "$n" ] && files+=("$REN_DIR/$n"); done < "$ORDER_TMP"
    rm -f "$ORDER_TMP"
    shopt -s nullglob
    for f in "$REN_DIR"/*.sql; do   # a top-level script git has never seen cannot be ordered
      [ -f "$f" ] || continue
      local found=0 g
      for g in "${files[@]+"${files[@]}"}"; do [ "$g" = "$f" ] && { found=1; break; }; done
      [ "$found" = 1 ] || die "$(basename "$f") is not in git history (untracked?); commit it before deploying"
    done
    shopt -u nullglob
  fi

  # classify
  local pending=() failed=0 skipped=0
  for f in "${files[@]+"${files[@]}"}"; do
    name="$(basename "$f")"
    [[ "$name" =~ $NAME_RE ]] || { echo "db-deploy: FAIL: unsafe file name: $name" >&2; failed=1; continue; }
    sha="$(sha_of "$f")"; key="$kind|$name"
    if [ -n "${L_SHA[$key]:-}" ]; then
      if [ "${L_SHA[$key]}" = "$sha" ]; then skipped=$((skipped+1)); echo "skip    $name (${L_ST[$key]})"
      else echo "db-deploy: FAIL: $name changed after it was recorded: ledger sha256 ${L_SHA[$key]}, file sha256 $sha (never edit a committed script; write a follow-up)" >&2; failed=1; fi
    elif [ "$kind" = renumber ] && ! has_marker "$f"; then
      echo "db-deploy: FAIL: $name" >&2; RECOVERY_TEXT "$name"; failed=1
    else
      pending+=("$f")
    fi
  done
  [ "$failed" = 0 ] || exit 1

  # lint every pending file before anything is applied
  for f in "${pending[@]+"${pending[@]}"}"; do lint_file "$kind" "$f" || failed=1; done
  [ "$failed" = 0 ] || { echo "db-deploy: FAIL: lint rejected the file(s) above; nothing applied" >&2; exit 1; }

  if [ "$dry" = 1 ]; then
    echo "dry-run ($which): ${#pending[@]} pending, $skipped skipped, ${#seed_new[@]} legacy seed row(s) would be recorded"
    for f in "${pending[@]+"${pending[@]}"}"; do echo "would apply $(basename "$f") sha256:$(sha_of "$f" | cut -c1-12)"; done
    exit 0
  fi

  # record the seed (one transaction), then apply
  if [ "${#seed_new[@]}" -gt 0 ]; then
    { printf 'BEGIN;\nSELECT pg_advisory_xact_lock(%s);\nINSERT INTO public.deploy_ledger (kind, filename, sha256, status, git_commit) VALUES\n' "$LOCK_KEY"
      local first=1
      for name in "${seed_new[@]}"; do
        [ "$first" = 1 ] || printf ',\n'; first=0
        printf "('renumber','%s','%s','legacy','%s')" "$name" "${S_SHA[$name]}" "$GIT_COMMIT"
      done
      printf '\nON CONFLICT DO NOTHING;\nCOMMIT;\n'
    } | psql_run >/dev/null || die "could not record the legacy seed"
    echo "seeded  ${#seed_new[@]} legacy row(s)"
  fi

  local applied=0 rc attempt=0 still sh_now
  if [ "${#pending[@]}" -eq 0 ]; then
    echo "$which: nothing pending ($skipped skipped)"; exit 0
  fi
  if [ "$kind" = migration ]; then
    for f in "${pending[@]}"; do   # one transaction per file
      apply_txn migration "$f"; rc=$?
      case "$rc" in
        0) echo "applied $(basename "$f") sha256:$(sha_of "$f" | cut -c1-12)"; applied=$((applied+1)) ;;
        10) # the conflict means the ledger already has this file: confirm it is the same content
          read_ledger; key="migration|$(basename "$f")"; sh_now="$(sha_of "$f")"
          [ "${L_SHA[$key]:-}" = "$sh_now" ] || die_notify "concurrent run recorded $(basename "$f") with a different hash (${L_SHA[$key]:-none}); re-run"
          echo "already applied by a concurrent run; nothing done ($(basename "$f"))" ;;
        *) die_notify "FAILED applying $(basename "$f"); rolled back, no ledger row" ;;
      esac
    done
    if [ "$applied" -gt 0 ]; then
      printf "NOTIFY pgrst, 'reload schema';\n" | psql_run >/dev/null || die "NOTIFY failed"
      echo "notified pgrst: reload schema"
    fi
  else
    # one transaction for all pending scripts; on a concurrent partial overlap re-read, re-classify, apply the rest
    while [ "${#pending[@]}" -gt 0 ]; do
      attempt=$((attempt+1))
      apply_txn renumber "${pending[@]}"; rc=$?
      case "$rc" in
        0) for f in "${pending[@]}"; do echo "applied $(basename "$f") sha256:$(sha_of "$f" | cut -c1-12)"; done
           applied=$((applied+${#pending[@]})); pending=() ;;
        10) [ "$attempt" -lt 3 ] || die "concurrent run keeps recording scripts we have pending; re-run"
            echo "a concurrent run recorded some of the pending scripts; re-reading the ledger"
            read_ledger
            still=()
            for f in "${pending[@]}"; do
              key="renumber|$(basename "$f")"; sh_now="$(sha_of "$f")"
              if [ -z "${L_SHA[$key]:-}" ]; then still+=("$f")
              elif [ "${L_SHA[$key]}" != "$sh_now" ]; then die "concurrent run recorded $(basename "$f") with a different hash; re-run"
              else echo "already applied by a concurrent run; nothing done ($(basename "$f"))"; fi
            done
            pending=("${still[@]+"${still[@]}"}") ;;
        # plain die (not die_notify): nothing is ever committed before this point in a renumber run, and renumber changes
        # no schema, so there is nothing for PostgREST to reload
        *) die "FAILED applying the renumber scripts; one transaction rolled back, none recorded" ;;
      esac
    done
  fi
  echo "$which: $applied applied, $skipped skipped"
}

# ---------------------------------------------------------------- dispatch
case "${1:-}" in
  migrations|renumber)
    dry=0
    case "${2:-}" in --dry-run) dry=1 ;; '') ;; *) die "unknown argument: $2" ;; esac
    cmd_run "$1" "$dry" ;;
  lint)
    [ "${2:-}" = migration ] || [ "${2:-}" = renumber ] || die "usage: lint <migration|renumber> <file>"
    [ -f "${3:-}" ] || die "no such file: ${3:-}"
    lint_file "$2" "$3" ;;
  renumber-order)
    ORDER_TMP="$(mktemp)"; renumber_order; rc=$?; rm -f "$ORDER_TMP"; exit $rc ;;
  verify-ledger)   # verify-ledger <kind> <file>...: every file has an applied ledger row with its sha256
    [ "${2:-}" = migration ] || [ "${2:-}" = renumber ] || die "usage: verify-ledger <migration|renumber> <file>..."
    k="$2"; shift 2; verify_ledger "$k" "$@" ;;
  seed) cmd_seed "${2:-}" ;;
  seed-add) cmd_seed_add "${2:-}" ;;
  *) die "usage: db-deploy.sh migrations|renumber [--dry-run] | lint <kind> <file> | renumber-order | seed [--check] | seed-add <file>" ;;
esac
