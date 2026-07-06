# Team Review: Skills & Docs Maintenance Pass

**Trigger:** Scheduled brushing-and-polishing review of the multi-agent translation team — verify every skill against the justfile, disk paths, and current project truth; fix outright errors; small surgical improvements only, no restructuring.

**Scope:** Root `CLAUDE.md`, `.claude/skills/CLAUDE.md` + `README.md`, all 19 `SKILL.md` files, `_shared/paragraph_format.md`, `.claude/project_config.md`, `.claude/agents/*.md`, WATCHLIST, and the 5 most recent reports. Verification fanned out to 5 parallel read-only subagents (pipeline skills / review skills / orchestration skills / support skills / report mining); all edits applied centrally.

## Headline numbers

- **17 files edited** (15 in-repo + 1 auto-memory index + this report)
- **~30 distinct defects fixed**: 2 nonexistent `just` commands, 1 wrong glossary save path, 5 wrong/stale paths, 2 phantom frontend components (2nd instance of a watched pattern), 1 pipeline-order contradiction spanning 4 documents, 1 entirely stale config file read by the ED at startup, 6 stale stats/dates
- **3 new WATCHLIST items** added, 1 updated to CONFIRMED, 1 resolution recorded
- **1 new guard shipped**: three cross-language French-comprehension traps (recurred in BOTH 2026-07-02 fluidity waves, previously unguarded) added to the translator SKILL

## What was checked

- Every `just` command referenced in every skill → against the justfile (125 recipes). All exist except the two fixed below.
- Every referenced path/script/doc → against disk. All exist except those fixed below.
- Role codes → all within RSR/LAN/TR/GEM/OPS/RED/CON/ED/PPX.
- Skill claims → against current truth (UK 100% conductor-approved; CZ fluidity 000–015 + 105–106 done; source prep complete; 107 carnets; footnote divergence).
- Presence of every guard that past teamcouch fixes were supposed to have shipped (editor awk scan, Finalize section, literal-`%%` rules, ED serialization/gate/disk-state rules, translator scaffolding rules, frontend-dev pitfalls) → **all present** except the two ED gaps fixed below.

## Changes (file-by-file)

| File | Change |
|------|--------|
| `.claude/project_config.md` | **Was badly stale and is read by ED at startup**: model allocation said translator/editor = sonnet + "Phase 2 — future" (→ opus, ACTIVE); `active_pipeline: source_preparation` (→ translation); translation-pipeline block uncommented; languages listed `cz` + future `en, de` with no uk/fr (→ cz/uk/en/fr with real status); obsolete 2-digit "Book Status" snapshot replaced with a pointer to `just status` |
| `.claude/skills/CLAUDE.md` | Pipeline 2 table reordered: GEM/OPS now 2a/2b (optional) BEFORE RED, with an explicit order note — GEM must precede RED so RED cleans GEM splices (dispatching GEM after RED is what created the cz splice backlog); "106 carnets" → 107 (×2); `codex-review-loop/` added to the directory tree (was undocumented) |
| `.claude/skills/README.md` | `just glossary-validate` (nonexistent) → `glossary-missing` + `check-links-all`; "106 carnets" → 107 |
| `.claude/skills/executive-director/SKILL.md` | Pipeline line TR → RED → GEM → CON corrected to TR → optional GEM/OPS → RED → CON; **GEM Integration section rewritten as "GEM / OPS Integration"** — OPS now offered as the preferred no-corruption option (was never mentioned), GEM dispatch moved to pre-RED with the ~290-splice history as rationale; **missing oversized-entry guidance added** (>~150-paragraph entries kill translators on the 32k output-token limit — dedicate a fresh agent, batch-save ~30 paragraphs); "106 carnets" → 107 |
| `.claude/skills/researcher/SKILL.md` | Glossary save path was flat `_glossary/NAME.md` (all 3,257 entries actually live in category subfolders) → `{category}/NAME.md`; footnote ID scheme aligned to the padded `[^015.0119.1]` form matching paragraph IDs, with a legacy-form note (leave old IDs alone) |
| `.claude/skills/translator/SKILL.md` | Three rows added to the Meaning Reversal Traps table: `descendre/monter` direction swap, causative `faire + infinitive` agency reversal, rhetorical `Vous pensez si…` — each hit BOTH cz and uk 2026-07-02 fluidity waves with no prior guard anywhere |
| `.claude/skills/gemini-editor/SKILL.md` | Frontmatter description said "Use after Editor review" — contradicted its own Known Issues ("RED cleans these up"), the editor skill, and root CLAUDE.md → now "after translation and before (or alongside) Editor review" |
| `.claude/skills/conductor/SKILL.md` | Duplicate literal-`%%` rule merged (the rule appeared twice with divergent evidence citations; the teamcouch-annotated copy kept) |
| `.claude/skills/workflow-architect/SKILL.md` | "106 carnets" → 107 (×2); pipeline order aligned (GEM/OPS before RED) |
| `.claude/skills/frontend-dev/SKILL.md` | **Two more phantom components removed** (`MobileMenu.vue`, `FilterButton.vue` — zero files, zero imports; same pattern as FilterPanel/BookSidebar caught 2026-07-03) and the two real unlisted layout components added (`HeaderNav.vue`, `HistoryTracker.vue`); glossary category names fixed (`culture/arts/` → `culture/art/`, no top-level `themes/`) |
| `.claude/skills/glossary/SKILL.md` | Stale category examples in "Creating New Entries" (`culture/arts/`, nonexistent `society/events/`) fixed — they contradicted the file's own directory-structure block; three lib paths missing the `src/` prefix fixed |
| `.claude/skills/glossary-tagger/SKILL.md` | Evaluator prompt templates said "1858-1884 French diary" (1858 = birth year) → 1873-1884 (×2) |
| `.claude/skills/project-status/SKILL.md` | Nonexistent `content/_original/PROGRESS.md` removed from file list; example total 3300 → 3800 |
| `.claude/skills/stewardship/SKILL.md` | "3,300+ entries" → ~3,800 (disk: 3,841) |
| `.claude/skills/listmonk-copywriter/SKILL.md` | `just project-status` (nonexistent) → `just status` |
| `.claude/skills/codex-review-loop/SKILL.md` | Imported-skill mismatch defused: its gate commands (`just test`, `npm run type-check`) don't exist in this repo → repo gate defined once at top (`cd src/frontend && npm test` + `just fe-build`), other occurrences point at it; origin note added marking GenericGrid/useGridData/`Web/` examples as foreign-codebase patterns |
| `.claude/agents/{translator,conductor,editor}.md` | Descriptions said Czech-only → language-agnostic (cz/uk/en/fr). Tool lists and models untouched |

## WATCHLIST changes

- **Docs list dead components as live** → upgraded to CONFIRMED 2nd instance (MobileMenu + FilterButton); added "grep-verify component tables against `src/frontend/src/components/`" instruction.
- **NEW: Cross-language French-comprehension trap trio** — guard shipped to translator SKILL 2026-07-06; monitor for recurrence.
- **NEW: UK doc-vs-doc contradiction `excusez du peu`** — uk TranslationMemory («нічого собі») vs uk/CLAUDE.md traps table («жарт сказати»); needs operator decision (raised by the uk fluidity report, previously untracked).
- **NEW: `[Rayé:]`/`[Mots noircis:]` rendering convention split** — needs one project-wide convention + sweep (raised by the cz fluidity report, previously untracked).
- **Resolved recorded:** Kernberger page-number paragraphs (converted to ED comments repo-wide 2026-07-02, never tracked as open).

Also fixed outside the repo: the auto-memory index's CZ-fluidity line was stale ("000–005 done") → corrected to 000–015 + 105–106 done, remaining 016–104.

## Gaps found but NOT changed (deferred recommendations)

1. **`.claude/agents/translator.md` and `editor.md` declare `model: sonnet`** while the proven config (ED skill, project_config, all recent waves) is Opus. Left untouched because ED spawns may override per-invocation and a default-model change has cost implications — operator should decide whether to flip the defaults or annotate them.
2. **Conductor SKILL frontmatter `allowed-tools` declares Edit/Write** that the `conductor` subagent type doesn't actually get (body + ED skill document the spawn-as-general-purpose workaround). Cosmetic contradiction; reconcile whenever the agent-type issue is revisited.
3. **Idle-without-report Finalize guard exists only in the editor SKILL** while the pattern also hit frontend/content/reviewer roles (7/13 agents on 2026-07-02). 2026-07-03 showed zero recurrence when spawn prompts demand a structured payload, so per the WATCHLIST's own threshold this stays watch-only — extend to other role skills on recurrence.
4. **codex-review-loop remains a lightly-adapted import** — gate and origin note now correct, but a full adaptation pass (repo-specific example targets, e2e situation) is worth doing if the loop gets regular use here.
5. **Two empty DRAFT stub reports** (`2026-06-22-cz-000-106.md`, `2026-07-02-cz-000-106.md`) sit unfilled in `.claude/reports/` — fill or delete so report-mining doesn't keep tripping over them.
6. **CZ fluidity accounting wrinkle:** carnets 006–009 got a ~80-repair pass on 2026-06-12 (its own report) yet the 105–106 report's "Done" line credits only 000–015 — and the ~290-hit hotspot list (from the 2026-06-12 scan) predates the 006–015 completion, so the true remaining count for 016–104 is lower. Re-scan before planning the next fluidity wave.
7. **verify-carnet gate-enhancement backlog** (dup-ID, mojibake, source-line contamination, single-script contamination, paragraph-ID parity, TM-locked-name lint, straight-quote autofix) — unchanged, still the standing architect queue in the WATCHLIST.

## Verification

- All corrected `just` commands re-checked against the justfile; all corrected paths re-checked against disk (`culture/` subcategories listed, `components/layout/` listed, frontend `package.json` scripts read).
- Phantom-component removal grounded in `grep -rn "MobileMenu\|FilterButton" src/frontend/src/` → only one stale code comment, zero imports.
- No git commits made (per instruction).
