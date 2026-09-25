---
date: 2026-09-25
type: skill-fixes
source: skill-audit-2026-09-25.md
status: uncommitted (for owner review)
---

# Skill fixes: results of the 2026-09-25 audit

Before each edit I checked the audit's claim against the repo: the justfile recipe signatures, `scaffold-translation.ts`/`sync.ts` arguments, frontmatter key counts in the corpus, and `project-status.ts`. Nothing has been committed.

## New shared pieces

- **`.claude/skills/_shared/editing_rules.md` (new).** This is now the single home for rules that several roles share:
  - §1 splice-safe comment insertion
  - §2 working against `_original`, including placeholder or missing French and scaffold `TODO`s
  - §3 never fact-correct Marie
  - §4 fix the class, not the instance
  - §5 locked terms, pending rulings, and who may rule
  - §6 gates, safe sync, and who commits

  TR, OPS, RED, CON, FAB, VOX, LAN, RSR and report-triage each point to it with a one- or two-line summary.
- **`justfile`: two new recipes.**
  - `splicescan lang carnet` wraps `src/scripts/splicescan.awk` and exits 1 when it finds anything.
  - `sync-verify carnet lang` (same argument order as `sync`) checks that visible text outside frontmatter is identical to HEAD, that splicescan is empty, and that no untracked `README.md` was left behind.
  - Both were tested: cz/050 comes back OK. cz/011 is flagged, as expected, because other agents are editing it right now. A synthetic splice is caught.

## FIX-NOW

| Item | Result | Files |
|---|---|---|
| F1 FAB/VOX "inherit Fable" | **Done, with neutral wording** per the lead's instruction: "runs on the session's model; Opus 5.5 and Fable both used — the owner chooses per run; never a smaller model". The report names the model that ran. The description and "Fable agent" wording were neutralised too. | fablelous, vox, skills/CLAUDE.md, root CLAUDE.md |
| F2 mandatory steps without Bash | **Done.** Added Bash to editor, conductor, opus-editor, translator, ED, LAN, researcher and entry-restructurer, and to all six agent files. `Task` became `Agent` in the tool lists of ED, translator, report-triage, teamcouch, workflow-architect and glossary-tagger (N3). | those SKILL.md files, `.claude/agents/*.md` |
| F3 agent files drift | **Done.** All six are now thin pointers: frontmatter, "read SKILL.md + editing_rules + `content/{lang}/CLAUDE.md`", and "never assume Czech". Also: `model: inherit`, no JSON-comment workflow, no embedded format. The restructurer's file says "never renumber" and no longer mentions `paragraph_parser.py`. | `.claude/agents/*.md` |
| F4 scaffold/sync default to cz | **Done.** ED now uses `just scaffold {c} --lang {lang}`, and FRONTMATTER.md uses `just scaffold 001 --lang cz` and `just sync 001 en`. Every sync mention passes the language. The recipe default was left unchanged (see owner list). | ED, docs/FRONTMATTER.md, editing_rules §6 |
| F5 cluster order vs scaffold | **Partial.** `_shared/paragraph_format.md` now lists the hard invariants and states that the order between ID and text is tolerated: scaffold order is valid, and existing clusters should not be reordered. It also clarifies that review comments go after the visible text. `docs/FORMAT.md` §3 prescribes yet another order (annotations after the translation). Choosing the canonical order is an **owner decision**. | `_shared/paragraph_format.md`, content/CLAUDE.md example |
| F6 FAB/VOX/OPS trust the embed | **Done.** All three now read `content/_original` and stop and report when counts differ. | fablelous, vox, opus-editor |
| F7 splice procedure in 2 skills | **Done.** The canonical procedure is in editing_rules §1, with pointers from TR, OPS, RED, CON, FAB, VOX, LAN and report-triage. Every skill's scan is now `just splicescan`. The divergent awk snippets were removed from editor and fablelous. | as listed |
| F8 LAN example splice | **Done.** | linguistic-annotator |

## SHOULD-FIX

| Item | Result | Files |
|---|---|---|
| S1 pipeline order | **Done.** A canonical "Pipeline 2" table in skills/CLAUDE.md gives the flags, the gate after each stage, "re-run after CON" and who commits. Root CLAUDE.md now links to it. OPS is marked "optional, lead's choice per wave" in ED, opus-editor and the table (confirm; see owner list). ED's "RED in real time" was replaced by blockedBy TR + gate. The content/{lang}/CLAUDE.md phase lists are unchanged (they still list OPS, which is compatible). | skills/CLAUDE.md, CLAUDE.md, ED, opus-editor |
| S2 ED structure | **Done.** ED now opens with translation waves and a new "Execution model (default)" section on background agents, folded in from memory: ≤3 carnets in flight, one agent per carnet per concern, explicit language, per-carnet scratch names, gates before RED, after RED and after CON, scoped `git add`, the check-links-repo caveat, the mtime stall watcher and exact-resume recovery. The team model is labelled fallback. Source prep moved to an appendix. The shutdown contradiction is resolved (background = none; team = handshake rules). The "general-purpose, not editor/conductor" advice was replaced. | ED, project_config.md |
| S3 obsolete headless pipeline | **Done.** Removed from root CLAUDE.md, content/CLAUDE.md, workflow-architect and `.claude/commands/architect.md`. The architect's Common Tasks were rewritten around the gates. | same |
| S4 dead approval process + stale "never sync" | **Done.** The architect's change process is now "edit directly; owner reviews diff before commit" (pending_changes/prompt_history marked retired). The backlog line now says sync is repaired and gives the safe-sync check. GLOSSARY_LINK_MAINTENANCE §1c was updated as well (sync localises depth since 2e3091386). | workflow-architect, architect.md, docs/GLOSSARY_LINK_MAINTENANCE.md |
| S5 footnotes | **Partial.** Placement now matches the corpus (after the referencing paragraph) in researcher and ED. The ID scheme and the `format-profile.yaml` regex are left as an **owner decision**; the researcher skill now notes the open item. | researcher, ED |
| S6 frontmatter | **Done (docs).** Removed the `workflow.translation_complete/editorial_review_complete/conductor_approval` ghosts (0 uses) from researcher and FRONTMATTER.md. Fixed report-triage's "fr has no frontmatter" (all 3,728 fr files carry `edition_complete`) and es/CLAUDE.md's same claim. The translator skill now covers lean frontmatter, `status`, `TODO` and `empty_in_source`. The project-status skill documents what `just status` really prints and how to count OPS, FAB and fr by hand. **Skipped:** the change to `project-status.ts` (code, outside my scope). | researcher, docs/FRONTMATTER.md, report-triage, es/CLAUDE.md, translator, project-status |
| S7 language examples in agnostic skills | **Done.** The Czech examples in translator, editor and FAB step 5 were reduced to categories. The Czech calque tells went into the cz traps table. The English register, word-order and "dear" lists moved to en/CLAUDE.md. **Not added:** new uk/es tell lists (they need a native-language pass). | translator, editor, fablelous, content/cz, content/en CLAUDE.md |
| S8 code-switch / quotes | **Partial.** Translator, editor and OPS now say "follow `content/{lang}/CLAUDE.md`" instead of mandating `==highlight==`. The convention and the cz quote spec are an **owner ruling**. | translator, editor, opus-editor |
| S9 VOX vs FAB commit | **Done.** FAB now says the lead commits and VOX needs FAB committed first. VOX says to run only on committed text, and its gate is now splicescan + verify-carnet. | fablelous, vox |
| S10 GEM residue etc. | **Mostly done.** Removed the FAB stale "breaks balance gate" line, the ED GEM line, the stale Feb benchmarks (replaced with a link and current plateaus), and CON's "lack Edit" line. LAN's language list is fixed and es was added to project_config. VOX, FRE and REV were added to `format-profile.yaml` (not read by any code), and root CLAUDE.md and content/CLAUDE.md now list KRR, ED, VOX, FRE and REV. **Skipped:** the WATCHLIST GEM items and the reports/README example (reports files); the INFRASTRUCTURE/CARNET_README "Gemini" row, whose name is matched by `src/scripts/hooks/lib/readme-parser.ts:182` (I edited it, then reverted it by hand). | as listed |
| S11 content/*/CLAUDE.md | **Done (small edits).** Removed the cz branch claim, fixed the `/src/_original` links (cz, uk, _original), the glossary categories (content, _original), the missing glossary CLAUDE.md link, and "launch subagent to update TM". **Skipped:** collapsing the per-language format/phase sections. | content/CLAUDE.md, _original, cz, uk |
| S12 frontend/codex facts | **Done.** Astro 7, Tailwind via vite, content languages. The codex skill now uses a direct `codex-companion.mjs` call (path verified), `gpt-6-astra`, lean briefs, ≤700 words, and the guard-git trap. | frontend-dev, codex-review-loop |
| S13 glossary-tagger propagation | **Done.** New Step 7: `just propagate-tag` with explicit tags, noting that the script has no carnet filter so the dry run must be read. | glossary-tagger |

## Gaps codified (lead's list)

- **G1 placeholder / missing source French** (never invent; flag `SOURCE MISSING`; report): editing_rules §2, translator Phase 1, editor, CON, FAB, VOX, OPS. The sibling-controlled coverage detector is described in ED's reviewer brief but was not built as a command.
- **G2 safe sync**: editing_rules §6, `just sync-verify`, FRONTMATTER.md, ED, researcher, report-triage, architect.
- **G3 TM rulings**: editing_rules §5 and ED "Owner decisions and TM rulings". Locks live in `content/{lang}/TranslationMemory.md` as `Ruling (date, WHO)`; pending items go under "Owner decisions" in the newest `WORKPLAN-*.md`.
- **G4 fix the class**: editing_rules §4, plus editor, CON, FAB, VOX and OPS.
- **G5 commits**: editing_rules §6 and the Pipeline 2 table.
- **G6 new language**: ED subsection.
- **G7 reviewer brief template**: ED.
- **G8**: printf trap → §1; lean frontmatter → translator; early-wave re-review detection → ED. **Not done:** dialogue-punctuation conventions and the non-word lint.
- **Re-gate after CON**: ED, Pipeline 2, CON, §6.
- **Never fact-correct Marie**: TR, RED, CON, FAB, VOX, LAN, RSR.
- **Researcher reading the manuscript tomes** (lead's addendum, from a failed 2026-09-25 run): the researcher skill and agent both have Bash, and the skill now shows how to extract `content/_raw/tome*.docx` to scratch text with `uv run --with python-docx` (pandoc is not installed; command tested on tome01, 2,578 paragraphs) and the gates to run after editing `_original`.

## Not done (NICE-TO-HAVE / out of scope)

- N1 teamcouch comment bloat
- N4 glossary skill URL table
- N6 the project-status example
- G9 hooks README

Also out of scope: all `.claude/reports/*` edits.

## Needs an owner decision

1. **FAB/VOX model**: Opus 5.5 or Fable, and whether the `redaction_passes` label should record the model.
2. **Canonical cluster order** (F5): scaffold order, hand-written order, or FORMAT.md §3 (annotations after the translation).
3. **Footnote ID scheme** (S5): plain `[^1]` vs `[^CCC.PPPP.N]`, and the matching `format-profile.yaml` regex.
4. **Code-switch convention and cz quote spec** (S8).
5. **OPS status**: codified as "optional, lead's choice per wave". Confirm.
6. **Who may rule on TM**: codified as "CON may lock where no lock exists; reversals and corpus-wide conventions are the owner's". Confirm.
7. **Skill change process**: codified as "direct edit, owner reviews the diff before commit". Confirm.
8. **Should `just sync`/`scaffold` require the language** instead of defaulting to cz? This is a small justfile/script change that could affect other callers.
9. **`project-status.ts` columns**: add OPS, FAB/VOX and fr `edition_complete`, and drop GEM. This is a dev task.
