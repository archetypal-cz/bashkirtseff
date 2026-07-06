# Backend Tooling Review — 2026-07-06

Audit of everything backend-side: justfile, shared TypeScript package, src/scripts/,
VSCode highlighting plugin, and a quick pass over the other src/ dirs.
Method: four parallel read-only subagent audits, fixes applied in the main thread.
Nothing was deleted; obsolete items are marked in place. Nothing committed.

## Headline results

- **Build**: `npm run build:shared` passes (tsc clean), re-verified after the roles.ts fix.
- **Tests**: the shared package has NO test suite (CLAUDE.md admits this). The only
  fidelity check, `just round-trip-test`, currently reports **311/355 files DIFF**
  (0/23 on carnet 001, 0/85 on 083) and still exits 0 — see Broken below.
- **Justfile**: 92 recipes → ~70 working, 5 broken (now fixed), 12 marked obsolete,
  ~10 unknown/working-by-design (need docker/ssh/env).
- **Content link health**: `just check-links-repo` → 0 broken across all 5 trees.

## Inventory

| Component | Status | Notes |
|---|---|---|
| justfile — glossary block (20 recipes) | working | smoke-tested stats/alias-stats; `glossary-migrate-flat` marked OBSOLETE |
| justfile — tagging/links (propagate-tag, harvest-footnotes, remap-glossary-links, check-links-repo, glossary-resolve, theme-*) | working | bare `python3` (not uv) but all stdlib-only; ran fine |
| justfile — utilities (status, verify, search, i18n-diff, scaffold, sync, extract-czech, docx-verify) | working | status/verify/search/i18n-diff run live |
| justfile — `find-missing`, `check-frontmatter` | was broken → FIXED | `$$` PID-expansion bug; never worked |
| justfile — `check-para-start`, `list-missing-para-start` | working → improved | `_summary.md` false positive fixed |
| justfile — `verify-carnet`, `check-links`, a11y-* | working | verify-carnet cz 001 PASS; a11y-contrast ALL PASS |
| justfile — `round-trip-test`, `debug-roundtrip` | runs, results bad | renderer infidelity, exit code always 0 (see Broken) |
| justfile — AI workflow block (architect, ed, research…pipeline, prepare-batch, workflow-report, workflow-clean) | OBSOLETE (marked) | headless `claude -p` pipeline dead since Feb 2026; `--resume latest` invalid on current CLI; `workflow-status` kept (works) |
| justfile — stewardship block | working, dormant | approve-all/archive had the `$$` bug → FIXED; feature unused ~5 months |
| justfile — kernberger/censored blocks | working | scripts + raw_books inputs exist; stale EPUB filename in comment fixed |
| justfile — reports/report-status (ssh) | unknown | needs DEPLOY_HOST env; by design |
| justfile — workspace/analytics docker | unknown | compose files exist and look sane; not started; `analytics-status` escaping FIXED |
| justfile — fe-* recipes | working | scripts exist; builds not run |
| src/shared — build | working | tsc clean |
| src/shared — parser vs current formats | mostly working | all `%%` formats + footnotes parse; roles were stale → FIXED; see Broken for legacy-comment bug |
| src/shared — renderer | broken-ish | not byte-faithful (merges tag lines, reorders notes); warning added to README/CLAUDE.md |
| src/shared — README.md / CLAUDE.md | was inaccurate → FIXED | nonexistent `DiaryParser`/`DiaryRenderer`, wrong paths, stale architecture tree |
| src/scripts — 35 top-level scripts | ~30 active | full inventory in audit; 3 marked OBSOLETE; hooks/ mostly wired |
| VSCode plugin | working, was stale → FIXED | grammar missing OPS/ED/PPX/KRR roles; README stale paths/roles; test doc rewritten |
| src/admin-api | alive | deploys with auth stack; last change 2026-06-02 |
| src/analytics | alive | Umami compose for running prod service; untouched since Feb (expected) |
| src/auth | alive | GoTrue/PostgREST prod stack; justfile report recipes query its DB |
| src/workspace | alive-ish | Docker dev env; structurally sound; pinned tool versions drifted since Feb |

## What I fixed

1. **Justfile `$$` PID-expansion bug** (just passes `$$` through to bash → PID) in
   `find-missing`, `check-frontmatter`, `stewardship-approve-all`, `stewardship-archive`.
   These recipes had literally never worked (`find-missing` silently reported nothing —
   dangerous false negative). Verified working after fix. The same bug in the obsolete
   `prepare-batch`/`workflow-clean` is noted in their OBSOLETE comments, not fixed.
2. **`check-para-start` / `list-missing-para-start`**: skip `_*.md` (was flagging `_summary.md`).
3. **`analytics-status`**: `{{{{.Names}}}}` → `{{{{.Names}}` (docker table headers were garbled).
4. **Kernberger section comment**: stale EPUB filename → `raw_books/Kernberger_Journal_illustrated.epub`.
5. **`src/shared/src/constants/roles.ts`**: added OPS, ED, PPX, KRR to `NOTE_ROLES`
   (+ descriptions + defaults). PA kept — real PA comments exist in content (e.g.
   content/cz/085/1879-05-10.md). Rebuilt cleanly. (Parsing was never blocked — the
   NOTE_PATTERN regex is generic `[A-Z]+` — but `isValidNoteRole('OPS')` was false.)
6. **VSCode grammar** (.vscode/bashkirtseff-highlighting/syntaxes/markdown-comment-injection.tmLanguage.json):
   role alternation now `RSR|LAN|TR|RED|CON|PA|GEM|OPS|ED|PPX|KRR`.
7. **Plugin README**: role list updated; 3 stale `scripts/vscode-markdown-highlighting`
   paths → `.vscode/bashkirtseff-highlighting`.
8. **docs/test-highlighting.md**: rewritten — was 11 lines exercising 0 current role codes
   and non-current ID forms; now covers all 11 roles, real paragraph IDs, glossary tags,
   footnotes and legacy format (the latter two labeled as known grammar gaps).
9. **src/shared/README.md + CLAUDE.md**: `DiaryParser`/`DiaryRenderer` → real
   `ParagraphParser`/`ParagraphRenderer` (verified against source), `src/_original/` →
   `content/_original/`, `scripts/` → `src/scripts/`, architecture tree corrected
   (added summary-*, roles.ts, marie.ts), renderer-infidelity caution added.

## What I marked OBSOLETE (not deleted)

- **Justfile AI-workflow block** (banner + per-recipe `# OBSOLETE:` lines):
  `architect`, `ed`, `research`, `annotate`, `translate`, `review`, `conduct`,
  `pipeline`, `prepare-batch`, `workflow-report`, `workflow-clean`.
  Evidence: content/_original/_workflow/ dormant since Feb 2026 (carnet-015-era JSONs
  only); `claude --resume latest` invalid on current CLI; workflow moved to skills/agent
  teams. `workflow-status` NOT marked (works, wraps project-status.ts).
- **Justfile `glossary-migrate-flat`** + **src/scripts/glossary-migrate-flat.ts** header:
  one-shot done Feb 2026 (7,650 refs, ec39f9b0b); 0 flat refs remain repo-wide.
- **src/scripts/a11y-axe-detail.mjs** header: unreferenced; superseded by a11y-audit.mjs.
- **src/scripts/migration-report-2026-01-31.md** note: historical report, wrong home.

## Broken / needs attention (not fixed — beyond small-and-obvious)

1. **Parser leaks legacy comments into paragraph text** (highest-impact code bug).
   `ParagraphParser` has `OLD_COMMENT_PATTERN` (patterns.ts:44) but never uses it —
   `[//]: # ( ... RSR: ... )` lines are appended to `originalText`. **110 files** in
   content/_original/ still carry legacy-format comments (worst: 062 ×23, 081 ×20,
   068 ×17, 067 ×15, 053 ×12). Verified live: 062.0263 originalText contains the RSR
   comment as prose. Fix either way: migrate the 110 files' comments to `%%` format
   (probably better) or teach parseParagraphCluster the old pattern. Legacy paragraph
   IDs, by contrast, are fully migrated (0 files) — only comments remain.
2. **Round-trip renderer infidelity + masked exit code.** `renderOriginalEntry`
   (paragraph-renderer.ts:286-333) merges all glossary tags into one line and reorders
   notes before text; 311/355 sample files DIFF; script exits 0 regardless (its `--fix`
   usage text is also dead — no such flag parsed). Harmless while nothing rewrites
   entries via the renderer, but it's a loaded footgun; docs now carry a warning.
3. **`WorkflowStatus`/frontmatter model mismatch.** parser/frontmatter.ts:160-168 uses
   camelCase names matching neither the snake_case translation flags
   (translation_complete, editor_approved, conductor_approved) nor originals' `workflow:`
   block; `gemini_reviewed`/`redaction_passes` absent. Aspirational, unused — either
   type the real flags or drop it.
4. **`check-frontmatter` now works and reveals** most entries lack `marie_age:`
   (only 160 files repo-wide have it). Decide if the field/check is still wanted, or
   run `just update-frontmatter-all`.
5. **VSCode grammar gaps** (feature work, not done): no footnote `[^NN.NN.N]` pattern,
   no legacy-format pattern. Plugin is NOT installed locally (~/.vscode/extensions
   absent) and not in .vscode/extensions.json; only the workspace container installs it.
   Stray `package-alternative.json` references two files that don't exist.
6. **One live inline-comment splice** remains: content/cz/024/1874-10-13.md:88
   (CON comment with trailing text on the same line) — the fix-inline-comments.py family.

## Needs KRR's decision

- **Repair-kit scripts**: fix-midline-paragraph-ids.ts (target condition eradicated) and
  fix-inline-comments.py (1 live instance left) — archive, or keep as repair kit for the
  recurring %%-balance/splice defect family (WATCHLIST)?
- **normalize_uk_frontmatter.py**: NOT finished — 218 uk files (carnets 047, 050, 067,
  071–074) still carry heavy `workflow:` frontmatter. Run to completion, or document the
  exemption? Not wired into the justfile either way.
- **merges.txt** (src/scripts/): consumed Feb batch input with a stale path in its own
  header — left untouched (data file; a comment header might break re-consumption). Remove?
- **Orphaned hooks**: hooks/pre-session.ts and hooks/bootstrap-readmes.ts are not wired
  into .claude/settings.json (no SessionStart hook) — wire or archive. Also
  .claude/settings.local.json:27 allowlists nonexistent `.claude/hooks/validate-write.sh`.
- **experiments/** (format-impact, untouched since May): move under _archive/?
- **glossary-dedup.ts / theme-tagger.ts**: campaigns finished in Feb but rerunnable by
  design — keep as-is (my recommendation) or demote.
- **Legacy-comment strategy** (item 1 above): migrate 110 files vs. extend parser.
- **Dead shared-package exports** (candidates for pruning if the package is ever slimmed):
  GlossaryManager, GlossaryParser/Renderer, SummaryParser/Renderer, utils/validation.ts,
  utils/glossary-merge.ts, exportToTmx, renderSideBySide/exportToHtml/exportToJson,
  parseCarnet/parseBook — zero consumers found; the frontend parses content itself and
  imports only types/constants from shared.
- **src/scripts/CLAUDE.md** is stale (~15 scripts missing from its listing: verify-carnet,
  a11y-*, all the py tools, hooks/guard-git…). Left for a deliberate rewrite rather than
  a drive-by edit.
- **src/admin-api/node_modules/** is checked into git — intentional?

## Not audited deeply (per scope)

Frontend PWA, content correctness, docker stacks (not started), ssh/DB recipes
(no DEPLOY_HOST in this environment).
