# Plan: `just verify-carnet` — mechanical pre-RED integrity gate

**Status:** BUILT + validated (2026-06-06). Author: team-lead (uk-062-064 wave). Script `src/scripts/verify-carnet.ts`; recipes `just verify-carnet` / `just verify-carnet-all`.

**Build outcome:** Implemented all 7 checks. Validated: uk/062–064 PASS; a synthetic broken file FAILs on all 5 hard checks (proving it catches the tr-063 frontmatter + tr-064 path-drift regressions). **On first run it caught 5 real malformed footnote definitions in carnet 064** (missing the `]:` colon → won't render) that RED and CON both missed — all 5 fixed. One regex false-positive (inline ref followed by a prose colon) was found and fixed (definition = line-start `[^id]:` only). **Remaining:** wire into the executive-director + translator skills (deferred until the parallel teamcouch retro finishes, to avoid concurrent skill edits).

**Motivation:** Two translator regressions in the uk-062-064 wave were *invisible to a reading review* and caught only by ad-hoc post-hoc checks by the lead:
- **tr-063** used `Write` for "fresh"/continuation entries and **stripped YAML frontmatter** from 11/14 files (lost `translation_complete`, `date`, `carnet`).
- **tr-064** **drifted the glossary path** from canonical `../../_original/_glossary/` to short `../_glossary/` mid-carnet (608 broken links on entries 07-28→08-13).

Both are mechanical, deterministic, and would have been caught instantly by a script. This gate converts "the lead happened to check" into a **standing guarantee** run when a translation carnet is finished, *before* it goes to RED.

Related prior art (same meta-pattern — translators mechanically breaking structure invisibly): WATCHLIST "Translator copies source glossary paths without depth adjustment" (cz-050-055, 1,515 broken links), "Orphaned footnotes" (en-042-047). Existing tooling to reuse: `just check-links {lang} {carnet}` (already CI-usable, exits non-zero on broken `.md` links).

## Goal

A single command — `just verify-carnet {lang} {carnet}` — that asserts the structural integrity of a translated carnet and **exits non-zero** on any hard failure (CI-usable, scriptable by the ED loop). A companion `just verify-carnet-all {lang}` sweeps a whole tree.

It is a **structural/mechanical** gate only. It does NOT judge translation quality, naturalness, or accuracy — that stays with RED/CON. It catches the class of defect that reading review reliably misses.

## Checks

Each check reports `OK` / `WARN` / `FAIL` per file (and a carnet summary). Exit code is non-zero if any **FAIL**-severity check trips.

| # | Check | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Frontmatter present** | FAIL | Every entry `*.md` (excluding `README.md`) starts with `---` and the block contains `date`, `carnet`, and `translation_complete`. (Catches tr-063.) |
| 2 | **Link resolution** | FAIL | Reuse `check-links` logic: every relative `.md` link resolves from the file's location. (Catches broken glossary refs.) |
| 3 | **Glossary path-depth** | FAIL | No short `](../_glossary/` paths in `content/{lang}/…` — must be `](../../_original/_glossary/`. (Catches tr-064 + the scaffold path-depth bug directly, with a clearer message than #2.) |
| 4 | **Footnote integrity** | FAIL | Within each file: every inline `[^key]` ref has a matching `[^key]:` definition and vice-versa; no duplicate definition labels. (Catches "orphaned footnotes" + the label-collision class CON fixed in 062.) |
| 5 | **Balanced `%%` markers** | FAIL | Even count of `%%` per file (no unterminated comment/source block). (RED fixed an unbalanced `%%` in 062.) |
| 6 | **Latin-in-Cyrillic** | WARN | For Cyrillic-script languages (uk, …): flag tokens mixing Cyrillic + Latin letters inside one word (e.g. «відданi», «Музе»+Latin). Heuristic → WARN, not FAIL (deliberate code-switches/URLs exist). Excludes `%% … %%` source blocks (those legitimately contain French). |
| 7 | **Stray foreign scripts** | WARN | Flag CJK / other unexpected Unicode ranges in translation body (context-window artifacts, e.g. tr-062's «历»). WARN. |

Notes:
- Checks #6/#7 scan only the **translation body lines**, never the `%% French source %%` comment blocks (which legitimately hold French/italics).
- `language: {lang}` consistency (#1 extended) optional: warn if frontmatter `language` ≠ the tree.

## Output & UX

```
just verify-carnet uk 062
=== verify-carnet uk/062 (35 files) ===
  frontmatter:     OK   (35/35 have ---, translation_complete)
  links:           OK   (1444 resolve, 0 broken)
  glossary-depth:  OK   (0 short paths)
  footnotes:       OK   (33 defs, 33 refs, 0 orphan, 0 dup)
  %%-balance:      OK   (all even)
  latin-in-cyr:    WARN (2 suspect tokens — see below)   [non-fatal]
  foreign-script:  OK
RESULT: PASS (0 fail, 1 warn)
```

Exit 0 on PASS (warns allowed), exit 1 if any FAIL, exit 2 on usage/structural error (bad args, missing dir, empty carnet — an empty carnet must not silently PASS). `--strict` promotes WARN→FAIL. `--quiet` prints only failures (for the ED loop).

> **Caveat on `--strict`:** the WARN-tier heuristics (Latin-in-Cyrillic, stray-script) are intentionally conservative but can false-positive on legitimate Latin-rooted stems with Ukrainian suffixes or edge code-switches. `--strict` makes them blocking — use it only on a tuned tree, not as the default gate.

## Implementation

- **Script:** `src/scripts/verify-carnet.ts` (TS, run via `npx tsx`, matching project convention). Reuse the link-resolution logic from the existing `check-links` implementation rather than duplicating it (factor a shared helper if cheap).
- **Justfile recipes:**
  ```
  # Structural integrity gate for a translated carnet (run before RED). Exits non-zero on hard failures.
  verify-carnet lang carnet *FLAGS:
      npx tsx src/scripts/verify-carnet.ts {{lang}} {{carnet}} {{FLAGS}}
  # Sweep all carnets in a language
  verify-carnet-all lang *FLAGS:
      ... loop over carnets, fail if any fails ...
  ```
- **Severity config:** hard-fail set = {frontmatter, links, glossary-depth, footnotes, %%-balance}; warn set = {latin-in-cyrillic, foreign-script}.

## Integration into the workflow

1. **executive-director SKILL** — when a translate task is marked complete, the lead runs `just verify-carnet {lang} {carnet}` BEFORE pinging RED. Any FAIL is fixed (or bounced to the translator) first. This is the primary enforcement point.
2. **translator SKILL** — add a one-line finalize step: "run `just verify-carnet {lang} {carnet}` and clear all FAILs before marking the task complete." (Self-service; the ED gate is the backstop.)
3. **Pre-commit / CI** — `verify-carnet-all` can join `check-links-repo` as a repo-health gate.

## Scope / non-goals

- Not a linter for style, register, Russianisms, or accuracy (RED/CON own those).
- Latin-in-Cyrillic / foreign-script are heuristics → WARN by default to avoid false-positive fatigue; promote with `--strict` once tuned.
- Does not modify files (report-only); fixes are applied by the translator/RED/lead.

## Validation plan

Build, then run against this wave's carnets:
- `uk/062`, `uk/063`, `uk/064` should now PASS (already RED/CON-cleaned + link-verified).
- Temporarily reverting a known-good 063 file's frontmatter (or pointing a link at `../_glossary/`) should make the gate FAIL — confirms it would have caught tr-063/tr-064.
