---
date: 2026-09-07
type: review-and-fix
operator: "@kerray"
duration_minutes: ~480
scope: all trees (_original, cz, uk, en, fr, es), tooling (sync, verify-carnet, scaffold, link checkers), glossary, docs, skills
pipeline: [review (read-only, 7 agents), fix (8 agents), lead-commits]
commits: a390b1b61..4872ddeb1 (23)
status: reviewed
---

# Review-and-fix session 2026-09-07 — "is last week's work exemplary?"

The maintainer asked for a check of the 2026-09-05/06 work (≈60 commits: tooling gates,
fablelous waves, the cz/018 restoration, footnote-marker recovery, a 600-link glossary
repair, the es pilot, an integrity audit): what remains, and whether the patches made
sense in the wider order of things. Method: seven **read-only** review agents in
parallel, one per theme, reporting conclusions only; then eight **fixer** agents with
disjoint file scopes and a no-commit rule, the lead committing each theme with explicit
paths; then the maintainer's decisions applied by four more agents plus one merge agent.

## Configuration

- **Models**: Fable 5.1 lead; general-purpose subagents (inherit) for review and fixes.
- **Structure**: lead never edited content; every agent got a file scope and the list of
  files other agents owned; agents were forbidden to commit, stash, checkout or reset.
  The lead committed per theme with explicit `git add` paths and pushed after each batch.
- **Skills consulted**: teamcouch (this review), glossary, fablelous, project-status,
  editor/conductor/translator (for the docs pass).

## Results

### Phase 1 — review (read-only)

| Reviewer | Verdict | Defects the gates had missed |
|---|---|---|
| tooling gates | fixes cause-level; all sweeps PASS | `verify-carnet` tolerated the multi-line `%%` block that `sync` produces; sync still emitted it (renderer) — reproduced on scratch copies (cz/011 26, en/102 73, uk/011 26 blocks); id-alignment is sequence-only (en/027, en/028 shifted +2 with matching IDs) |
| cz/018 | restoration sound, cannot leak to readers | block 018.0244 still variant; all 26 entries approved with pre-restoration dates; 16 stale annotations; audit §1 still stated the retracted premise |
| footnotes | all 8 restoration commits correct (24+18+27 markers checked) | 3 wrong 095 footnotes only commented in source, en/uk verbatim wrong; 15 source definitions reachable only from a comment; sync would re-add renumbered notes |
| glossary | 596 repairs + 11 retargets all semantically right | main CI red since f6df30e02 (36 glossary-internal broken); 3 uppercase `.MD` links invisible to the checker |
| waves | fablelous/translation state clean, 0 splices, flags honest | FAB reversed a TM-locked term (cz/089 velkovévoda→velkokníže); memory said cz/092 done (72/96); 4 hook report stubs empty |
| es/frontend | pilot committed, gated off the site, 5 entries high quality | scaffold flag bug still in code; frontend parser opener-order disagreement; vitest hook timeout |
| cross-cutting | commits accurate, no junk | docs/skills lagged the tooling (gate doc, S7, FRONTMATTER, 4 skills with retired %%-parity wording, language lists without es); WATCHLIST lacked the week's 5 new defect families; 3 memory claims stale |

### Phase 2 — fixes (maintainer: "start on the mechanical items in that order")

| Agent | Scope | Outcome | Commits |
|---|---|---|---|
| fix-links | glossary + checker | 36 cross-refs resolved (11 retargets, 6 new sourced entries, 17 delinks, 1 docs path); `.MD` ×3 fixed; checker case/anchor/title aware + `--selftest` 12/12; `check-links-repo` exit 0, CI green | 770104d2c, c9a97296d |
| fix-sync | src/shared, verify-carnet, scaffold, frontend | renderer wraps per physical line; sync footnote id-mapping guard; verify-carnet FAILs multi-line blocks outside fr, source def→ref uses rendered text, S5 fr-only, case-aware links; scaffold writes 4 pipeline flags; content.ts opener order; vitest config; 10 new shared tests (45/45), 26/26 frontend; corpus sweep PASS all trees | 72a4ce7c7, e9076d600, d7b7ab821, a0a13f585, 62c1959f9, bed1289f0 |
| fix-content | _original/001, 073, 095; en/uk 095; es/001; uk TM | 3 × 095 footnotes corrected in source+en+uk; Collignon in es + uk TM; 15 buried markers surfaced; cz/095 README | d47e6ecd7, cb5bb39cb, 8496736a1 |
| fix-docs | docs, skills, reports, hook | 13 drift items fixed; WATCHLIST +7 families; 2 run reports filled, 2 empty stubs deleted; hook row duplication fixed (+test); audit corrections + outcomes addendum | 42eab71e4, 7bc6d3171, da77638c9, e62c96c44 |

### Phase 3 — maintainer decisions (1c, 2b, 3b, 4a, 5 keep, 6 disband, 7 defaults, 8 re-sync)

| Agent | Decision | Outcome | Commit |
|---|---|---|---|
| do-cz018 | 1c discard variant text; 2b reset approvals | 120 preservation comments removed (79 wrappers + 41 introducers); all 26 entries `editor_approved`/`conductor_approved` false with dated ED note; 018.0244 marked OPEN; README, audit, WATCHLIST updated; visible text unchanged | 966dea141 |
| do-grandduke | 3b lift the velkokníže ban | 73 swaps in 41 files (28 carnets) with plural-neuter agreement; 6 Western/fictional kept; TM + WATCHLIST rewritten | e2aeb30a2 |
| do-merge | 4a merge duplicates | GAMBETTA → people/politicians (341 path rewrites), LEON_/M_GAMBETTA merged (61), ST_PETERSBURG → PETERSBURG (6); orphaned 94→94; link gate 0 | f3b6a434f |
| do-espolicy | 7 pan-Hispanic defaults | ustedes plural / tú-usted per French; 3-tier names; N. de la A./T./E.; Spanish exonyms table (35); slice 1 unaffected | a62abb0c0 |
| do-resync | 8 re-sync cz/023, cz/029 | 029 clean first pass (3 placeholders → 0; +634 notes); 023 FAILED on a **third** sync defect (inline glossary links in copied notes not depth-localised), reverted, fixed (2e3091386), re-run clean (+577 notes, 19 links localised) | 0a71b2f05, 2e3091386, 4872ddeb1 |

### Gate state at close

| gate | result |
|---|---|
| `verify-carnet` full sweep | PASS every carnet in all six trees (after e9076d600 tightening) |
| `check-comments` | OK all six trees |
| `check-links-repo` | exit 0, 0 broken; glossary-missing empty; CI green on every push after c9a97296d |
| `test-shared` / frontend vitest | 45/45, 26/26 |
| working tree | clean |

## Agent Lifecycle

- 7 reviewers + 8 fixers + 5 decision agents + 1 teamcouch: **every agent delivered its report unprompted** (0 chases) and went idle cleanly. Reports arrived twice each (message + idle notification) — harness echo, harmless.
- `do-resync` hit the subagent `git checkout` block when reverting its failed 023 sync and restored each file with `git show HEAD:<file> >` instead — correct behaviour; the block worked as designed and the agent stayed in scope.
- `fix-docs` caught two files the lead had missed staging from `fix-sync` (a new test file and the vitest config: created, not modified, so absent from the modified-files list) — fixed in bed1289f0. Lead-side lesson: check `git status` for untracked files, not only `M` lines, before declaring a theme committed.
- `fix-sync` reported its long corpus sweep as "waiting on the tally" twice; the lead verified the tally file directly rather than waiting, then committed. No stall.
- Zero concurrent-edit incidents across 8 parallel writers (disjoint scopes named in every prompt; the one shared file, WATCHLIST.md, was committed once after both writers finished).

## Issues Encountered (WATCHLIST categories)

- **Gate blind to a writer's own failure shape** (Tooling/Process): sync ×3 defects vs verify-carnet tolerance; footnote def→ref counting comment markers; `.md` regex duplicated in three checkers. See teamcouch pattern (b).
- **Source-of-truth fixes not propagated** (new item, now 2 chains: 095 footnotes, Collignon→es/uk-TM).
- **Independent post-wave review finds what gates miss** (positive practice, 3rd+ instance — codified, see below).
- **Session-end hook stubs never filled** (4 stubs, one 3 weeks old) — hook fixed, watch added.
- **glossary-merge appends cruft** — 2nd instance (manual trim after `--simple`).
- **Elided French embeds** (fablelous-wave item) — cz/029 placeholders resolved by re-sync.
- **Stale memory** — three prior-session memory claims were wrong at session start (sync "safe", es "uncommitted", cz "085–093 done"); corrected in memory, not a repo matter.

## Observations

- The review-then-fix split paid for itself: read-only reviewers with a "report only" brief found six defect classes the mechanical gates had passed, and none of the fixes had to be reverted. Fixers ran in parallel without conflict because each prompt named its scope *and* the files other agents owned.
- Two of the three sync defects were only findable by running the writer against real content on a scratch copy; the third only appeared on a production run against the one carnet whose source notes contain inline links. A writer's gate must be tested on the writer's real output, not on fixtures alone.
- The maintainer's decisions were all mechanical to apply once stated; the costliest open item (cz/018 RED+CON) is translation work and was explicitly deferred.

## Proposed Changes

- ED skill: post-wave independent review as a standard gate (applied below).
- workflow-architect skill: writer/gate co-testing rule (applied below).
- editor/conductor skills: compare against `content/_original`, never only the embedded copy (applied below).
- researcher/editor skills: source-fact corrections propagate to every tree in the same commit (applied below).
- Frontend + shared parsers keep only the first French line of a multi-line paragraph as `originalText` (reader's French panel shows line 1) — pre-existing, needs a ticket.

## Teamcouch Review

**Reviewed**: 2026-09-07 (same session)
**Reports analyzed**: 12 (2026-05-31 → 2026-09-07: cz-050-055, uk-062-064, uk-075-077, cz-080-082, glossary-link-cleanup, footnote backfill 06-17, cz-fluidity-105-106, uk-fluidity-000-105-106, frontend-a11y 07-03, report-triage 08-13, integrity-audit 09-05, cz-002-106 09-05, es-001) plus WATCHLIST in full

### Patterns Identified
- **Independent post-wave review catches what the gates pass**: 4 / 4 waves it ran on (07-02 cz, 07-02 uk, 07-03 frontend, 09-07) — **ED SKILL updated** (standard gate after every edit wave; fresh-context, read-only, conclusions only).
- **A content writer shipped without a gate that fails its own output shape**: 5 reports (uk-075-077, cz-050-055, uk-062-064, 09-05 audit, 09-07: three sync defects, def→ref counting comment markers, one regex in three checkers) — **workflow-architect SKILL updated** (scratch-copy test of the writer on real carnets; gate tested against the writer's output; grep duplicated checker logic).
- **Reviews approve against a stale or condensed embedded French**: 3 reports (cz-080-082, 2026-08 fablelous wave, 09-05 audit: cz/018 ×12, en/091, en/102, cz/011, cz/014) — **editor + conductor SKILLs updated** (coverage against `content/_original`, never only the `%%` copy).
- **Source-fact corrections not propagated to every tree**: 4 reports (05-31 tag propagation, 06-17 footnote backfill, 09-05 095 footnotes cz-only, 09-07 Collignon skipped es + uk TM) — **researcher + editor SKILLs updated** (fix `_original` and every tree in the same commit, or hand the lead the file list).
- **Disjoint scopes + lead-only commits for parallel writers**: 1 instance at scale (8 writers, 0 conflicts) extending the confirmed 5-instance concurrent-edit family — one sentence added to the ED git-safety section; WATCHLIST positive-practice watch.
- **Session-end hook stubs never filled**: 1 instance-set (4 stubs) — hook fixed; WATCHLIST watch.
- **Agents idle without report**: 0 / 21 today, 2nd clean session — evidence lines updated on both WATCHLIST items; not yet Resolved (needs a 3rd).
- **glossary-merge appends cruft**: 2nd instance — evidence updated; build `--clean` on a 3rd.

### Skill Updates Applied
- executive-director/SKILL.md: parallel-writer scopes + lead commits (git-safety section); independent post-wave review gate (before "Commit the report").
- workflow-architect/SKILL.md: writer/gate co-testing rule (§4 Testing).
- editor/SKILL.md: two checklist items — coverage against `_original`; propagate source-fact fixes.
- conductor/SKILL.md: approval means matching `content/_original`, not the embedded copy.
- researcher/SKILL.md: source-fact corrections propagate in the same commit (Footnote Management).

### WATCHLIST Changes
- Confirmed → skill updated: independent post-wave review; writer-without-gate (new item).
- Resolved: Elided French embeds (cz/029, cz/023 re-synced).
- Fix applied, watching: missing `conductor_approved` scaffold field (d7b7ab821); stale-embedded-French reviewer rule; propagation rule; sync third defect recorded.
- Added watches: session-end hook stubs; disjoint-scope/lead-commit practice.
- Evidence updated: idle-without-report (×2 items), glossary-merge cruft.

### Recommendations for Human
- cz/018 RED+CON pass (26 entries, approvals reset; 018.0244 and 16 stale annotations inside it) is the largest correctness debt now; nobody is assigned.
- The reader's French panel shows only the first line of a multi-line French paragraph (shared + frontend parsers keep line 1 as `originalText`) — pre-existing, needs a ticket before the next sync wave makes multi-line embeds common.
- Memory notes were wrong on three counts at session start (sync "safe", es "uncommitted", cz "085–093 done"). Corrected today; worth a habit of re-verifying memory claims against disk before acting, as the ED skill already says for agent claims.
- `glossary-move` does not update the moved entry's own `category:`/`type:` frontmatter; small fix worth doing before the next move.
- Decide whether the 2026-09-07 rule "stubs filled or deleted in-session" should be enforced by the hook itself (refuse to write a second stub while an unfilled one exists).
