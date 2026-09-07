# Plan: `just verify-carnet` — mechanical pre-RED integrity gate

**Status:** BUILT + validated (2026-06-06); checks tightened 2026-09-05..07 (see the table and the "Sidecar" section below). Author: team-lead (uk-062-064 wave). Script `src/scripts/verify-carnet.ts`; recipes `just verify-carnet` / `just verify-carnet-all`.

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
| 2 | **Link resolution** | FAIL | Reuse `check-links` logic: every relative `.md` link resolves from the file's location. (Catches broken glossary refs.) **Case-aware (e9076d600):** the link regex matches the `.md` extension in any letter case so a `FOO.MD` link is seen at all, and a target whose extension is not lowercase `.md` is reported as broken, because the filesystem is case-sensitive. Mirrors `check-links-repo` (c9a97296d) and the shared `MD_LINK_PATTERN` (62c1959f9). |
| 3 | **Glossary path-depth** | FAIL | No short `](../_glossary/` paths in `content/{lang}/…` — must be `](../../_original/_glossary/`. (Catches tr-064 + the scaffold path-depth bug directly, with a clearer message than #2.) |
| 4 | **Footnote integrity** | FAIL | Within each file: every inline `[^key]` ref has a matching `[^key]:` definition and vice-versa; no duplicate definition labels. (Catches "orphaned footnotes" + the label-collision class CON fixed in 062.) Markers quoted inside `%% … %%` comments never count as references for the ref→def direction (a RED note recording a renumbering does not oblige the file to define the old id). **Source-tree rule (e9076d600):** for the def→ref direction, translation trees accept a marker that sits in the embedded French mirror (fr/es legitimately keep markers there), but in `_original` a definition needs a marker in the *rendered* French — a marker that exists only inside a role comment fails with "marker sits inside a %% comment only". This exposed 15 comment-only markers in 001 and 073, fixed in 8496736a1. |
| 5 | **`%%` marker structure** (reported as `%%-balance`) | FAIL | Per-line shapes of `docs/COMMENT_MARKER_RULES.md` rule 3, shared with the frontend parser via `scanMarkerStructure()`: `splice` (a complete comment followed by prose on the same line — the prose vanishes from the page), `unclosed-block` (a block still open at EOF), `multi-line-block` (a `%% … %%` block spanning several lines — FAILs in every tree except `fr`, where the modern edition uses that shape by design; added in e9076d600 because `just sync` used to produce exactly this shape and the gate let it through, so `check-comments` and `verify-carnet` now agree), `closer-without-opener` (a line ending in `%%` that does not start with one; the exemption is now **fr-only** — S5 in the marker-rules doc — since `_original` carries none after the S7 repair 6c23b7aae). File-level `%%` parity is deliberately NOT checked: a comment may quote a literal `%%`, and 121 lines legitimately do. |
| 6 | **Latin-in-Cyrillic** | WARN | For Cyrillic-script languages (uk, …): flag tokens mixing Cyrillic + Latin letters inside one word (e.g. «відданi», «Музе»+Latin). Heuristic → WARN, not FAIL (deliberate code-switches/URLs exist). Excludes `%% … %%` source blocks (those legitimately contain French). |
| 7 | **Stray foreign scripts** | WARN | Flag CJK / other unexpected Unicode ranges in translation body (context-window artifacts, e.g. tr-062's «历»). WARN. |
| 8 | **Paragraph-ID alignment** | WARN | The ordered list of standalone `%% NNN.NNNN %%` markers in each translation entry vs the source entry's, plus entries missing on either side. (Catches dropped/reordered paragraphs and mid-line IDs, which the frontend parser ignores at build time.) WARN, not FAIL: a uk sweep flagged 140 files, of which 137 are the benign convention of omitting a notes-only source paragraph and 2 are headers the translation numbers and the source does not — 1 was a real dropped paragraph (uk/068 `1877-02-13-21.md`, source 068.0620). Promote to FAIL once the check ignores source paragraphs that carry no translatable text. |

Notes:
- Checks #6/#7 scan only the **translation body lines**, never the `%% French source %%` comment blocks (which legitimately hold French/italics).
- `language: {lang}` consistency (#1 extended) optional: warn if frontmatter `language` ≠ the tree.
- Check #1's completion key is tree-dependent (82cb4f7d2): `edition_complete` on `fr` (an annotated edition, not a translation), `translation_complete` everywhere else. See `docs/FRONTMATTER.md`.

### Sidecar: footnote-glue (WARN, wired in the justfile, not in the script)

`just verify-carnet` and `just verify-carnet-all` also run `uv run src/scripts/check_footnote_glue.py --lang {lang} --carnet {carnet} --warn-only` after `verify-carnet.ts` (0c0baa9e0). It is **not** one of the eight checks in the script's `CHECK_ORDER`, it prints its own block, and it never changes the exit code — the recipe saves the script's return code first and exits with it. What it catches: diary prose glued onto a `[^id]:` definition line, which is structurally valid (so check #4 cannot see it) yet renders as footnote text and vanishes from the paragraph; ten such blocks were repaired on 2026-09-05. It measures each block's visible translation against `content/_original`, never against the embedded French mirror, because the mirror can itself be stale (cz/018). Candidates are listed with two coverage ratios (`r1` visible/French, `r2` visible+footnote/French) for a human to open and compare. A few benign shapes are permanent, hence WARN. For a blocking run use the standalone `just check-footnote-glue --lang cz,uk --carnet 092`, which exits non-zero on any candidate.

`verify-carnet-all` additionally finishes with a tree-level `just check-comments {lang}` (the `%%` shape families the per-file scanner does not model) and that one **does** affect the sweep's exit code.

## Output & UX

```
just verify-carnet uk 062
=== verify-carnet uk/062 (35 files) ===
  frontmatter:     OK   (35/35 have ---, translation_complete)
  links:           OK   (1444 resolve, 0 broken)
  glossary-depth:  OK   (0 short paths)
  footnotes:       OK   (33 defs, 33 refs, 0 orphan, 0 dup)
  %%-balance:      OK   (no splice / unclosed / multi-line block / stray closer)
  id-alignment:    OK
  latin-in-cyr:    WARN (2 suspect tokens — see below)   [non-fatal]
  foreign-script:  OK
RESULT: PASS (0 fail, 1 warn)
footnote-glue: 0 candidate(s) in 33 footnote-bearing blocks (uk, carnet 062)   [sidecar, never affects exit code]
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
- **Severity config:** hard-fail set = {frontmatter, links, glossary-depth, footnotes, %%-balance}; warn set = {id-alignment, latin-in-cyrillic, foreign-script}. The footnote-glue sidecar lives outside both sets (justfile only, see above).

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
