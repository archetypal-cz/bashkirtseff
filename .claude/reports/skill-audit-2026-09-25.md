---
date: 2026-09-25
type: audit
scope: .claude/skills/*/SKILL.md (21), .claude/skills/_shared, .claude/skills/CLAUDE.md, .claude/agents/*.md (6), root CLAUDE.md, content/CLAUDE.md, content/{_original,cz,uk,en,fr,es}/CLAUDE.md, docs referenced by skills
mode: read-only (no skill edited)
status: final
---

# Skill & agent audit — 2026-09-25

Every claim below was checked against the repo on 2026-09-25 (justfile, `src/`, content frontmatter, git history). Line numbers are for the files as they stand today, including the uncommitted `fablelous/SKILL.md` edit (new step 5 "Calque hunt").

Evidence commands used: `just --list`, `git ls-files`, frontmatter key counts over `content/*/0??/*.md`, `grep` over skills/docs, reading `src/scripts/{project-status,scaffold-translation,verify-carnet}.ts`, `src/shared/src/utils/scaffold.ts`, `.claude/settings.json`, `format-profile.yaml`.

Severity:
- **FIX-NOW**: an agent following the text today will damage content, run the wrong model, or execute an impossible "mandatory" step.
- **SHOULD-FIX**: stale or contradictory instructions that cost time or quality but have a known workaround.
- **NICE-TO-HAVE**: hygiene, deduplication, clarity.

---

## FIX-NOW

### F1. FAB and VOX agents are told to "inherit" a Fable model that the session does not have
- `fablelous/SKILL.md:13`: "specially instructed Fable agents (model: inherit — the session runs on Fable; do not downgrade…)". `vox/SKILL.md:18`: "Fable agents (model: inherit — never downgrade…)".
- Evidence: this orchestrating session runs Opus 5.5. Any FAB agent spawned from it with `model: inherit` (as the skill instructs), which may include the `fab-cz-000/001/002` agents running now, runs Opus, not Fable 5.1. The whole premise of FAB/VOX as a Fable pass (and the `redaction_passes` records that claim one) is then false.
- Fix: in both skills, replace "model: inherit" with "spawn with `model: "fable"` (Fable 5.1) explicitly; never rely on inheritance". Record the actual model in the pass label, e.g. `- fablelous(fable-5.1) 2026-09-25`. Check the model of the running fab-cz agents before trusting their output as a Fable pass.

### F2. "Mandatory" steps that the role's own tool list cannot execute
- `editor/SKILL.md:4` allows `Read, Edit, Write, Grep, Glob` (no Bash). But `:182-187` makes an awk scan "mandatory, before you report" and `:192` requires `just check-comments {lang}` to come back clean. `.claude/agents/editor.md:4` also lacks Bash.
- `translator/SKILL.md:4` has no Bash, yet `:336` says to run `just verify-carnet` before marking the task complete. The team-mode caveat at `:336` covers teammates but not a standalone `/translator`.
- `executive-director/SKILL.md:4` has no Bash. The lead is still told to run `just verify-carnet` (`:524-534`), `just check-links-repo` (`:660`), `git log` for skill hashes (`:645-648`), disk counts (`:516`) and `kill` (`:399`).
- `linguistic-annotator/SKILL.md:4`, `researcher/SKILL.md:4`, `entry-restructurer/SKILL.md:4` and `conductor/SKILL.md:4` have no Bash either, but list `just` commands (`linguistic-annotator:299-314`, `researcher:229-251,258-275,334-339,428-432`, `entry-restructurer:245-255`).
- Fix: add `Bash` to `allowed-tools` for executive-director, editor, conductor, opus-editor, translator and entry-restructurer, and to the `tools:` of `.claude/agents/{editor,conductor,translator}.md`. The guard-git hook still blocks git mutations. Where Bash is deliberately withheld, label the step "lead runs this" rather than "mandatory".

### F3. `.claude/agents/*.md` contradict their skills, and report-triage routes work straight to them
report-triage (`report-triage/SKILL.md:52`) spawns "translator, editor, researcher, entry-restructurer" agents, and the memory playbook (translation-wave-orchestration) spawns `subagent_type: translator|editor|conductor`. Those definitions are stale:
- `agents/translator.md:10,17,21`: "French to **Czech**", "Target language: Czech (cz)". Its output format at `:54-60` puts the French first, then a **blank line**, the Czech, and the **paragraph ID after the text** (`%% XX.YYY %%`). That breaks every rule in `_shared/paragraph_format.md:79-85`. `model: sonnet` (`:5`) against Opus everywhere else (`project_config.md:49`, ED `:335-337`).
- `agents/editor.md:32` and `agents/conductor.md:35,47` say "sound Czech". `:47-50` / `:53-59` say "Comments go in your JSON output (ED writes them to files)" while the tools include Edit and the skills (`editor/SKILL.md:163`, `conductor/SKILL.md:167`) say to write comments directly. `agents/editor.md:5` has `model: sonnet`.
- `agents/entry-restructurer.md:27,31`: 2-digit IDs (`01.12`). `:49` says "Renumber subsequent paragraphs", against the skill's "preserve IDs, don't renumber" (`entry-restructurer/SKILL.md:260`) and report-triage's "paragraph IDs unchanged" (`report-triage/SKILL.md:68`). `:54` validates with `cd scripts && uv run paragraph_parser.py`, which does not exist (`scripts/paragraph_parser.py` missing; the skill at `:247` admits it is gone).
- `agents/researcher.md:33`: "First tag must be Marie's location". `:40` says "Add tags to entry file (top, in comments)". Both are obsolete: entities live in frontmatter and tags sit per paragraph (`researcher/SKILL.md:288-349`).
- Fix: cut each agent file down to frontmatter plus "Read `.claude/skills/{role}/SKILL.md` and follow it; target language comes from the spawn prompt", and delete the embedded formats, JSON-only comment rules and Czech hard-coding. Set `model: opus` and add Bash for translator, editor and conductor. The skills then stay the only source.

### F4. ED scaffolds the wrong language
- `executive-director/SKILL.md:377`: "scaffold with `just scaffold {carnet}`". The recipe is `scaffold carnet *FLAGS` (justfile:307) and the script defaults to `--lang cz` (`scaffold-translation.ts:107`). An en/uk/es wave following this line scaffolds Czech files.
- `docs/FRONTMATTER.md:236` shows `scaffold-translation.ts 001 cz` (positional), which the script does not parse (it takes `--lang`).
- The same default-cz trap applies to `just sync carnet lang=default_lang` (justfile:331).
- Fix: ED `:377` → `just scaffold {carnet} --lang {lang}`. Fix the FRONTMATTER.md example. Every skill that names `sync` should say `just sync {carnet} {lang}` explicitly.

### F5. Scaffold/sync emit a different paragraph layout from the "authoritative" format spec
- `_shared/paragraph_format.md:3` calls itself "the authoritative reference". It prescribes ID → tags → LAN → French → TR → visible text (`:61-85`), and `linguistic-annotator:180` / `entry-restructurer:87` add "annotations BEFORE text".
- The writer tools do something else. `src/shared/src/utils/scaffold.ts:399-411` renders ID → **source comment** → tags+notes → TODO (see `content/es/001/1873-01-18.md:17-27`). `content/cz/CLAUDE.md:35-40`, `content/uk/CLAUDE.md:67-76` and `content/CLAUDE.md:60-64` show yet other orders; the last one puts RSR/LAN **after** the French text, which violates the rule stated one screen later.
- Why it matters: translators are told to copy the source "verbatim" into this shape, and reviewers are told to flag deviations. With tool output and spec disagreeing, correct files get "fixed" and the reverse.
- Fix: decide the canonical order (the parser accepts both). `docs/FORMAT.md` already claims to be "the single source of truth" (`FORMAT.md:13`), yet **no skill references it**. Make FORMAT.md + `format-profile.yaml` canonical, turn `_shared/paragraph_format.md` into a short Bashkirtseff profile that matches `scaffold.ts`, and have every example point there.

### F6. Two FAB/VOX/OPS rules still tell reviewers to trust the embedded French
- The 2026-09-07 rule (editor `:108-113`, conductor `:171-174`, WATCHLIST "Stale embedded French", memory stale-embedded-french) is: approve against `content/_original`, never the `%%` copy.
- Not applied where it matters most. `fablelous/SKILL.md:37` says "read the French original in `content/_original/{carnet}/` **(or** the `%% … %%` French embedded in the translation file)". `vox/SKILL.md:46` says the same. `opus-editor/SKILL.md:69-71` Pass 2 says "read the full file including `%% ... %%` comments. Compare the translation against the French original." cz/018 was FAB-approved on a stale copy (2026-08-08 wave) for exactly this reason.
- Fix: replace the "(or …)" with "always `content/_original`; the embedded copy may be stale or condensed; if paragraph count or length differs, stop and report". Add the same line to opus-editor Pass 2.

### F7. The splice-safe editing procedure lives in only two skills, but four roles insert comments
- The next-line anchoring rule, the "never bundle text edit + comment insertion" rule and the per-file scan are in `fablelous/SKILL.md:79` and partly in `editor/SKILL.md:182-192`. `opus-editor/SKILL.md:85-110`, `vox/SKILL.md:80-86`, `conductor/SKILL.md:184` and `translator/SKILL.md` (TR self-review fixes, `:163-166`) only say "own line". The WATCHLIST records splices introduced by RED, CON, OPS (stale OPS splices in early-wave carnets) and FAB (66 in one wave).
- The two awk scans also differ. `editor:185-186` flags only lines starting with `%%`; `fablelous:23` strips spans from any line. The tightened `src/scripts/splicescan.awk` has **no just recipe** (`just splicescan` does not exist).
- Fix: move the procedure into one shared file (e.g. `_shared/safe_comment_insertion.md`) and link it from TR, OPS, RED, CON, FAB, VOX, report-triage. Add `just splicescan {lang} {carnet}` wrapping `splicescan.awk` so every skill names one command. `verify-carnet`'s `splice` check (VERIFY_CARNET_GATE.md:31) remains the gate.

### F8. The LAN skill's own example is a splice
- `linguistic-annotator/SKILL.md:60`: `%% … LAN: "à la bonne heure" = well done/that's more like it (not time-related %% )`. The text after the closer is `)`, a "closer-without-opener/splice" shape per COMMENT_MARKER_RULES rule 3. Agents copy examples literally.
- Fix: `… (not time-related) %%`.

---

## SHOULD-FIX

### S1. Pipeline order and OPS status contradict each other across five places
- Root `CLAUDE.md:101-108` lists OPS as mandatory step 4. `opus-editor/SKILL.md:17` says "OPS is the standard review pass". `executive-director/SKILL.md:327` says "TR → **optional** OPS → RED → CON", and `:496-498` says "OPS Integration (**optional** extra review pass)… **OPS … is the standard** extra review pass" in the same paragraph. `skills/CLAUDE.md:77-81` and `workflow-architect/SKILL.md:48` say "[OPS optional]". `content/{cz,uk,en,es}/CLAUDE.md` "Translation Phases" list OPS as phase 2.
- The ED's own task graph (`:362-371`) puts RED on each carnet "in real time as entries appear" with no blockedBy. That contradicts the same skill's "run verify-carnet the moment a carnet is fully on disk, before pinging RED" (`:524-534`) and "one writer per carnet" (`:406-415`).
- None of the phase lists mention the verify-carnet gate, and only skills/CLAUDE.md mentions FAB/VOX ordering (VOX needs FAB committed first, see S9).
- Fix: one canonical pipeline table (propose `skills/CLAUDE.md` "Pipeline 2") listing TR → gate → [OPS] → RED → gate → CON → gate → commit → [FAB → commit] → [VOX], with OPS's status decided once. Replace the other copies with a link. Drop "RED in real time" from ED `:367-368`.

### S2. ED is structured around the finished source-prep pipeline and the team/SendMessage model the lead no longer uses
- `executive-director/SKILL.md:99-105` (Startup reads project_config, creates team "source-{carnet}"), `:106-150` (spawn RSR+LAN), `:196-220`, `:288-323` are all source prep, which `:327` says is complete. `skills/CLAUDE.md:58` still titles it "Pipeline 1: Source Preparation (**ACTIVE**)", and `:109-118` says `/executive-director 015` creates a source team.
- The proven translation model is in memory only (translation-wave-orchestration: background Agent per stage run to completion, 0 concurrent-edit incidents in 45 handoffs). The ED instead carries about 60 lines of shutdown-ack handshakes (`:401-448`) for the team model. It also says both "You do NOT need to send shutdown requests… just `kill` the process" (`:399`) and "send an explicit shutdown_request… wait for the shutdown_response" (`:409-432`).
- `:350-352` "Always spawn RED/CON as `general-purpose` (NOT `editor`/`conductor` — they lack Edit)" is stale: `agents/editor.md:4` and `agents/conductor.md:4` now list Edit, the memory playbook spawns them by type, and WATCHLIST "Resolved" records the Edit problem as the reason.
- Fix: reorder ED into (1) translation wave, background-agent model first, team model as fallback; (2) gates; (3) reporting; (4) an appendix for source prep. Fold in the memory playbook items: verify after RED **and after CON**, per-carnet scoped `git add`, mtime stall watcher, exact-resume recovery. Reconcile the subagent-type advice with F3.

### S3. Obsolete headless pipeline is advertised as live
- The justfile marks `research/annotate/translate/review/conduct/pipeline/workflow-report/workflow-clean` as `# OBSOLETE` (justfile:670-755).
- Still presented as current in root `CLAUDE.md:201-203` ("`just research ENTRY`", "`just pipeline ENTRY` # Full translation pipeline"), `content/CLAUDE.md:118,124`, and `workflow-architect/SKILL.md:101-121,205-218,235-237` (including `content/_original/_workflow/decision_log.md`, which does not exist). `just ed` (justfile:666-668) runs `claude --resume latest "<prompt>"` and loads project_config; it is likely broken too.
- Fix: remove these from CLAUDE.md, content/CLAUDE.md and workflow-architect, or mark them obsolete there too. Rewrite the architect's "Common Tasks" around `verify-carnet`, `check-comments`, `splicescan`, `sync --dry-run`.

### S4. The workflow-architect change-approval process is dead, and it contradicts teamcouch
- `workflow-architect/SKILL.md:172-201` says "CRITICAL: You cannot apply changes to skill files without human approval". Drafts go to `.claude/pending_changes/` (**does not exist**) and are logged in `.claude/prompt_history.md`, whose last entry is **2025-12-06**. `.claude/architect/sessions/` stops at 2025-12-06, and `.claude/commands/architect.md` still loads pending_changes.
- `teamcouch/SKILL.md:72-83` tells teamcouch to "Edit the skill file directly". Every change since December went that way, as `<!-- Teamcouch update -->` blocks.
- `workflow-architect/SKILL.md:250` says `just sync` is "frontmatter-destructive… do not run it against `content/{lang}/`". That is stale: sync was fixed 2026-09-07 (72a4ce7c7, e9076d600, per WATCHLIST and memory), and researcher `:112` and editor `:114` now rely on sync.
- Fix: pick one change process. The realistic one is teamcouch-direct-edit plus git history, with the human approving the commit. Delete the pending_changes/prompt_history machinery or revive it. Replace `:250` with the safe-sync procedure (G2).

### S5. Researcher/restructurer footnote rules contradict each other and the corpus
- Placement: `researcher/SKILL.md:96-100` says definitions go "at end of entry (after last paragraph block)", as does ED `:88`. `entry-restructurer/SKILL.md:81,88` says "Footnotes belong with the paragraph they reference". Corpus practice follows the restructurer: in a 400-file sample from carnets 050-099, 386/400 `_original` files and 392/400 cz files have footnote definitions **before** a later paragraph ID. `scaffold.ts:422` appends them at the end.
- ID scheme: researcher `:88-106` mandates `[^CCC.PPPP.N]`. The restructurer `:81` shows `[^CC.PP.N]`; cz CLAUDE.md `:277-282` shows `[^14.25.1]`/`[^09.05.1]`. `format-profile.yaml` (footnotes pattern `\d+|\d{2}\.\d{2}\.\d+`) does **not admit** the researcher's 3.4-digit form. `_original` mostly uses plain `[^1]` (1,945 definitions), then `[^99.999.9]`-shaped (56), then `[^999.9999.9]` (17). WATCHLIST "Footnote ID schemes collide or drift" is still open.
- Fix: one footnote section in FORMAT/profile covering placement (in-cluster, which matches the corpus and footnote-glue tooling), allowed ID patterns, and per-file uniqueness. Update the profile regex to include `\d{3}\.\d{4}\.\d+`. Researcher, restructurer, ED and cz/CLAUDE.md then link to it.

### S6. Frontmatter schema: skills document keys nobody writes, and miss the ones that exist
- `researcher/SKILL.md:312-319` and `docs/FRONTMATTER.md:79-87,179-187` document `workflow.translation_complete`, `workflow.editorial_review_complete` and `workflow.conductor_approval`. Count in `_original` 000-099: **0**. The real keys are top-level `translation_complete/opus_reviewed/editor_approved/conductor_approved` in translation trees (FRONTMATTER.md:192-203) and `edition_complete` in fr.
- `report-triage/SKILL.md:72`: "fr files also have no YAML frontmatter (repo-wide)". False since 82cb4f7d2: all 3,739 fr entry files start with `---` and carry `edition_complete`.
- `project-status/SKILL.md:139-147,156-174` promises OPS/`opus_reviewed` columns and "log / bootstrap / sync" subcommands. `src/scripts/project-status.ts` (the `just status` backend) prints a **GEM** column from `gemini_reviewed` (`:78,174`), has no OPS/FAB/VOX column, ignores `redaction_passes` (5,795 `fablelous` entries in cz+uk are invisible to status), and counts fr against `translation_complete`, so fr shows 0%.
- The translator skill never mentions `status: translation_pending` (written by scaffold, FRONTMATTER.md:203), `empty_in_source` (only LAN `:138` handles it), or the scaffold `TODO` placeholder lines.
- Fix: delete the `workflow.*` translation flags from researcher and FRONTMATTER.md. Fix report-triage `:72`. Change project-status.ts to show OPS (`opus_reviewed`), last `redaction_passes`, and fr `edition_complete`, then sync the skill text. Add a translator paragraph on scaffolded files: replace every `TODO`, set `status`, leave `empty_in_source` entries with no text.

### S7. Language-specific examples inside language-agnostic skills (and the new calque hunt)
- `translator/SKILL.md:237-242` (Czech examples) and `:260-283` (an **English**-only register watchlist and English word-order calques). `editor/SKILL.md:204-210` (Czech). `fablelous/SKILL.md:47` (new step 5): Czech-only tells (`„je to … co“`, `„udělat procházku“`, `„zvedla jsem svou ruku“`, "nenásilně") in a pass that runs on cz, uk, en and es. The uk agent gets no Ukrainian tells, and the en/es agents get Czech ones.
- The calque/false-friend taxonomy therefore exists four times (translator `:231-248`, editor `:198-221`, fablelous `:47`, each `content/{lang}/CLAUDE.md` traps table), with different example sets.
- Fix: keep only the language-neutral categories in the skills (gallicism / calque / false friend / semantic shift, and step 5's structural tells such as word order, nominal style, possessives, passives). Move every concrete example to the "Editor / review traps" table of the matching `content/{lang}/CLAUDE.md`. Give step 5 one line: "per-language tells: see the traps table in `content/{lang}/CLAUDE.md`". The Czech lines of step 5 go into `content/cz/CLAUDE.md`, with Ukrainian/English/Spanish equivalents added there.

### S8. Code-switch and quote conventions: skill and language doc disagree
- `translator/SKILL.md:287-294` and editor `:86-87,122` require `==highlight==` plus a footnote for Marie's English/Italian/Russian. `content/cz/CLAUDE.md:273-290` specifies Czech in the body plus a `Pozn. překl.: V originále anglicky:` footnote and never mentions highlight. WATCHLIST "English/foreign code-switch placement — One convention + one sweep" is open, and the corpus does both.
- `content/cz/CLAUDE.md:297` requires `„text”`, but its own examples at `:277,282` close with a straight `"`. The WATCHLIST item "cz quote-spec self-contradiction (needs operator decision)" is still open.
- Fix: operator ruling (one line each), recorded in the language CLAUDE.md, with the translator skill reduced to "follow `content/{lang}/CLAUDE.md` for code-switch marking".

### S9. VOX's freshness gate conflicts with FAB's "do not auto-commit"
- `fablelous/SKILL.md:29` says "Do NOT auto-commit". `vox/SKILL.md:32-40` skips every file with uncommitted changes as STALE. VOX run after an uncommitted FAB pass does nothing and reports everything STALE.
- `vox/SKILL.md:27` also still says "verify: `%%`-balance intact", which is file parity; the gate no longer measures that (8b69323fb).
- Fix: in both skills, "FAB must be committed (by the lead) before VOX runs on that carnet". Replace VOX's step 2 with the same gate as FAB (verify-carnet + splicescan).

### S10. Stale rationale and retired-role residue
- `fablelous/SKILL.md:80`: literal `%%` "breaks the balance gate". Stale since 8b69323fb. The other three copies (translator `:171-176`, editor `:196`, conductor `:176`) were updated, so the four copies of this rule have now drifted, which is the duplication cost in miniature.
- `executive-director/SKILL.md:626`: "what issues the GEM audits caught". `:604-620`: "Quality Benchmarks (from Feb 12-13 Czech runs)", including per-translator speeds for agents that no longer exist.
- `conductor/SKILL.md:27`: "If you lack Edit access (common when spawned as `conductor` subagent type)". Stale (agents/conductor.md has Edit).
- `.claude/reports/README.md:40,43` uses `pipeline: [translator, gemini-editor]` as the example. WATCHLIST "GEM Corruption Patterns" (4 open items) and "Pipeline Efficiency: Gemini API rate limits" are still under **Active**. `docs/INFRASTRUCTURE.md:86` carnet README template has a "Gemini" phase row. `project-status.ts` (S6) has a GEM column.
- `project_config.md:107-112` active languages omit `es`. `linguistic-annotator/SKILL.md:39` lists "Czech, English, German" (no German target exists; es/uk/fr missing).
- `format-profile.yaml` author vocabulary lacks `VOX`, `FRE`, `REV` (fr roles from `content/fr/CLAUDE.md:101-127`). Root `CLAUDE.md:148` lacks FRE/REV/KRR, and `content/CLAUDE.md:83-93` lacks VOX/ED/KRR.
- Fix: a one-time "retired GEM" sweep: move the WATCHLIST GEM items to Resolved, fix the README example and templates, and replace the ED benchmarks with a link to recent reports. Make `format-profile.yaml`'s vocabulary the single role-code list and point `CLAUDE.md:148` and every per-language "Comment Types" table at it.

### S11. content/*/CLAUDE.md staleness
- `content/cz/CLAUDE.md:226-231` says Czech lives on a `cz` branch with commits `[cz-001] …`. There is no `cz` branch, and all cz work lands on main as `ops(cz): …` (2 of the last 300 commits use `[cz-`).
- `content/cz/CLAUDE.md:235` and `content/uk/CLAUDE.md:199` link to `/src/_original/CLAUDE.md` (wrong path; it is `content/_original/CLAUDE.md`). `content/CLAUDE.md:141` links to `/_original/_glossary/CLAUDE.md`, which does not exist.
- `content/CLAUDE.md:100` and `content/_original/CLAUDE.md:22` list `society/` and `languages/` as top-level glossary categories. Wrong per `_categories.yaml` and `glossary/SKILL.md:178`.
- `content/cz/CLAUDE.md:57` says "launch subagent to update TM", but teammates cannot spawn subagents (translator `:145`).
- Fix: straightforward edits. Also collapse the six per-language "Translation File Format / Translation Phases / Comment Types" sections into links to the canonical format (F5), pipeline (S1) and role vocabulary (S10). Keep only the genuinely language-specific parts: style, traps, TM pointers, and fr's FRE/REV editorial phases.

### S12. frontend-dev and codex-review-loop facts
- `frontend-dev/SKILL.md:13`: "AstroJS **5.x**". `src/frontend/package.json` has `astro ^7.0.0`, and `src/frontend/CLAUDE.md:12,31` says Astro 7.
- `frontend-dev/SKILL.md:262`: `tailwind.config.mjs` does not exist (Tailwind v4 via `@tailwindcss/vite`).
- `frontend-dev/SKILL.md:15`: "content languages (Czech translation, French original)". cz/uk/en/fr/es exist.
- `codex-review-loop/SKILL.md:33-37,53,84,110` route Codex through the `codex:codex-rescue` subagent. The memory codex-review-loop-ops (2026-09-05) says those wrappers "returned the task ID but could not poll status/result and sat idle 40+ min" and that the working path is calling `codex-companion.mjs` directly with `--model gpt-6-astra` and briefs of 700 words or fewer. The skill says 1,500 words.
- Fix: update the versions and paths, and fold the memory's direct-call recipe and lean-brief limits into the codex skill.

### S13. glossary-tagger emits source-relative paths with no warning about translation trees
- `glossary-tagger/SKILL.md:19,264-273` applies tags as `../_glossary/…` to `_original` only. That is correct, but there is no step saying the new tags then need propagating to cz/uk/en/fr/es at `../../_original/_glossary/` depth. The memory glossary-tag-propagation rule ("scope to an explicit target set; never union all tags") is not referenced either.
- Fix: add a Step 7 "propagation: `just propagate-tag` per `docs/GLOSSARY_LINK_MAINTENANCE.md`, explicit targets only".

---

## GAPS (missing coverage)

### G1. Placeholder and incomplete source French (FIX-NOW class, no owner)
Nothing tells a translator or reviewer what to do when:
- the embedded French is an elision placeholder ("[full entry text too long for comment — see original]"; WATCHLIST, 029 fixed but "remaining elided embeds elsewhere, if any");
- a paragraph has no embedded French at all (WATCHLIST "Missing French source slot 020.0368");
- the scaffold wrote `# TODO`/`TODO` (es/001 has 17 such entries);
- the entry is `empty_in_source` (only LAN `:138` covers this).

Proposal: a short "Source integrity check" step at the top of translator Phase 1 and of the OPS/RED/CON/FAB/VOX preparation. Compare paragraph IDs and length against `content/_original/{carnet}/{date}.md`. If they diverge, run `just sync {carnet} {lang} --dry-run`, or stop and report; never translate or approve from the embed. Include the sibling-controlled coverage detector from memory stale-embedded-french (flag when one language is under 70% of `_original` while a sibling is over 80%) as a named command. Today it lives only in memory.

### G2. Safe `just sync` procedure is only in memory
The visible-text diff against HEAD, `splicescan` empty, deleting the stray `README.md` files sync creates, and "sync won't overwrite a definition the target already holds" are all in memory stale-embedded-french. Researcher `:112` and editor `:114` point at sync but not at the procedure, and workflow-architect `:250` forbids it outright (S4).
Proposal: a "Syncing a translation tree" section in `docs/FRONTMATTER.md` (already the doc sync links to), or `_shared/sync.md`, referenced from ED, researcher, editor, report-triage and architect. Better still, wrap it as `just sync-verify {carnet} {lang}`.

### G3. How TM rulings are made and recorded
Rulings are recorded ad hoc: "Ruling (2026-09-07, CON)" inside `content/cz/TranslationMemory.md:1707-1718`, "Ruling (maintainer…)" at `:1672`, operator rulings in WATCHLIST "Resolved", es rulings as "DECIDIDO" headings in `content/es/CLAUDE.md`. Meanwhile WATCHLIST lists at least eight open "needs one ruling" items (cocotte ×4 renderings, dělat dvůr/dvořit se, prayer address, Rayé convention, cz quotes, code-switch placement, the uk name divergences in memory uk-fablelous-wave, and more). No skill says who may rule (CON? maintainer only?), where the ruling goes, or that a ruling needs a corpus grep and a reverse grep. The velkovévoda reversal (FAB overrode a lock, then the maintainer reversed the lock) shows the cost.
Proposal: a "Locked terms & rulings" section at the top of each `TranslationMemory.md` with a fixed row format (term, form, scope, who ruled, date, sweep grep). A rule in translator, FAB, VOX and RED: "never change a locked term; an item listed as *pending ruling* is left as-is and flagged, not normalized". A one-paragraph ruling protocol in ED. The TMs are also large (uk 2,577 lines, en 4,605), and translator `:28` says to read the whole thing. A locked section at the top makes the "top 15-20 terms" advice (ED `:480`) mechanical.

### G4. "Fix the class, not the instance" is only in report-triage
`report-triage/SKILL.md:39-44` has it. WATCHLIST shows the same failure in RED ("RED changelog claiming a defect class done after fixing ONE instance is exactly how the rest escaped CON", fablelous-wave section) and in FAB (dîner/déjeuner ×35, regretter ×9 carnets).
Proposal: one line in editor, conductor, FAB and VOX: "when you fix a meaning error of a recurring family, grep the carnet (and name the grep in your comment); report the count".

### G5. Commit and verify discipline per role
Some pieces exist: ED `:32` (disjoint scopes, lead commits), ED `:660` (check-links before commit), memory (verify after CON; per-carnet scoped `git add`; `check-links-repo` exit code unreliable when another tree is being edited in parallel). There is no single "who commits, when, after which gates" statement. FAB says "do not auto-commit" and VOX needs commits (S9). Report-triage commits. OPS/RED/CON say nothing.
Proposal: in the canonical pipeline table (S1), one column "gate after this stage" and one "who commits", ending with "lead commits per carnet with explicit paths after verify-carnet PASS + splicescan empty".

### G6. es pilot / new-language onboarding
Only ED `:493` (a quality-bar number) and workflow-architect `:243` (a status note) mention es. `docs/ADDING_LANGUAGES.md` and `docs/LANGUAGE_EXPANSION_PLAN.md` are not referenced by any skill. `project_config.md` omits es (S10). The four es policies decided 2026-09-07 live in `content/es/CLAUDE.md`, which is correct, but nothing in ED says "for a new language, read ADDING_LANGUAGES.md; slices are CON-gated; placeholder entries stay `status: translation_pending`".
Proposal: a 5-line "New / pilot language" subsection in ED linking both docs.

### G7. Independent post-wave reviewer: brief template missing
ED `:667` makes the independent reviewer standard (evidence: 4 waves). It gives no brief template, although the memory and 2026-09-07 report show what worked: visible-text accounting against HEAD, flags against actual comments, TM-lock greps, and "report only".
Proposal: add a 10-line brief template to ED.

### G8. WATCHLIST items at or past threshold that never reached a skill
- **printf `%%` collapse** (WATCHLIST Tooling, cz-104-106). Only editor mentions printf. Add to the shared insertion doc (F7): "never write comments via printf/echo with `%%`; use Edit".
- **Lean translation frontmatter** (memory translation-wave-orchestration): "translators write lean frontmatter only". Translator `:328` only says preserve.
- **Pre-existing splices / stale OPS splices in early-wave carnets** and the **early-wave re-edit signature** (memory early-wave-carnet-reedit-signature: `editor_approved < conductor_approved` carnets need a full RED+CON). No skill tells the ED how to detect and route these carnets.
- **Morphological non-word lint** and **TM-locked-name lint** ("TOP RECOMMENDATION" in WATCHLIST since June). These are architect backlog items, but the skills still rely on manual "grep before fixing" advice scattered in WATCHLIST. At minimum, workflow-architect's backlog line `:250` should name them with their WATCHLIST anchors, which it does only partially.
- **Dialogue-punctuation convention** (WATCHLIST Ukrainian-Specific: "translator skill states no explicit convention"). Each language CLAUDE.md should state it, and the translator skill should point there.

### G9. Hook and tooling documentation drift
`.claude/hooks/README.md` documents the hooks as Write-only and `content/cz`-only (`validate-write.ts` "Files in content/cz/ or content/_original/"). `.claude/settings.json` also runs a `guard-git.ts` PreToolUse hook that the README does not list, although three skills cite "a PreToolUse hook enforces this". Low risk; document it so the "guard-git heredoc trap" (memory codex-review-loop-ops) has a home.

---

## NICE-TO-HAVE

- **N1. Teamcouch comment bloat.** ED has 15 `<!-- Teamcouch update … -->` blocks (about 120 lines of evidence prose agents must read). `teamcouch/SKILL.md:155` itself says "Don't make skills longer". Move evidence blocks to a per-skill `CHANGELOG.md` (or rely on git), and keep a one-line `<!-- see CHANGELOG 2026-06-10 -->` marker.
- **N2. Index completeness.** Root `CLAUDE.md:82-99` role table lacks glossary, glossary-tagger, entry-restructurer, stewardship and codex-review-loop. `skills/CLAUDE.md:7-54` tree lacks report-triage. `translator` is described as "Translate French → Czech" (`CLAUDE.md:86`).
- **N3. `allowed-tools: Task`.** The harness tool is now `Agent` (translator, ED, teamcouch, workflow-architect, glossary-tagger, report-triage list `Task`). Harmless if aliased; verify and rename.
- **N4. glossary skill.** `glossary/SKILL.md:343-349` URL table ("English (future)", root `/glossary/{id}`); routes are `src/frontend/src/pages/[lang]/glossary/[id].astro` for every language. The pattern quoted at `:368` omits `SUM\.\d{3}` (patterns.ts:13). The count "~3,260" is now 3,293.
- **N5. VERIFY_CARNET_GATE.md:5** "Remaining: wire into the executive-director + translator skills". Done; delete the line.
- **N6. project-status example output** (`project-status/SKILL.md:156-174`: "127/3800 (3.3%)"). Replace with a real `just status` excerpt, and note the carnet README TODO-sync machinery (`:64-71,189-194`) is dormant if it is (no recent use found).
- **N7. Timestamps.** Only VOX (`vox/SKILL.md:78`) says to use the real `date +%Y-%m-%dT%H:%M:%S`. Put that in the canonical comment-format section once.
- **N8. Stale agent roster in workflow-architect `:38-46`.** No FAB/VOX, and RSR is listed as "Sonnet/Opus" while project_config says opus.

---

## Duplicates map: where each rule lives today, and where it should live

| Rule | Copies today (drift noted) | Canonical home (proposal) |
|---|---|---|
| Paragraph/cluster format | `_shared/paragraph_format.md`; `docs/FORMAT.md` (claims SSOT, unreferenced); root CLAUDE.md:117-138; content/CLAUDE.md:50-68 (annotations **after** text); each content/{lang}/CLAUDE.md "Translation File Format" (3 different orders); translator:340-361; researcher:536-563; LAN:146-184; entry-restructurer:19-88; glossary (GLO variant); `scaffold.ts` (actual output, a 4th order) | `docs/FORMAT.md` + `format-profile.yaml`; `_shared/paragraph_format.md` shrinks to the Bashkirtseff profile matching scaffold output (F5) |
| `%%` marker/splice rules + scans | COMMENT_MARKER_RULES.md; VERIFY_CARNET_GATE.md:31; translator:168-176; editor:178-196 (awk A); conductor:169-176; fablelous:20-28 (awk B), :79-80 (stale rationale); vox:27 (parity wording); report-triage:67; `_shared/paragraph_format.md:117-120` | COMMENT_MARKER_RULES.md for rules; new `_shared/safe_comment_insertion.md` for the editing procedure; `just splicescan` for the scan (F7) |
| Comment format + role-code list | root CLAUDE.md:141-148; content/CLAUDE.md:79-93; cz:172-181, uk:79-87, en:178-186, es:404-413, fr:121-127 (FRE/REV); workflow-architect:123-133 (no OPS/FAB/VOX); `format-profile.yaml` (no VOX/FRE/REV) | `format-profile.yaml` vocabulary + one table in content/CLAUDE.md (S10) |
| Frontmatter flags | docs/FRONTMATTER.md (still lists `workflow.*_complete` ghosts); researcher:288-330 (ghosts); entry-restructurer:44-72; ED:196-208; project-status:137-147 (+ script's GEM column); translator:328; cz/uk/es CLAUDE.md examples | docs/FRONTMATTER.md after removing the ghosts (S6) |
| verify-carnet gate | VERIFY_CARNET_GATE.md; ED:523-534, :660; translator:336; editor:107; fablelous:28; report-triage:72; entry-restructurer:254 | VERIFY_CARNET_GATE.md; skills link to it plus the one-line "must PASS" |
| Review against `_original`, not the embed | editor:108-113; conductor:171-174; researcher:108-112 (propagation); fablelous:37 and vox:46 (**contradict**); opus-editor:69-71 (silent) | one line in each review skill that points to G1's "Source integrity check" |
| Calque / false-friend taxonomy + examples | translator:231-283 (cz + en examples); editor:198-221 (cz); fablelous:47 (cz); opus-editor:37-51; every content/{lang}/CLAUDE.md traps table | categories in skills; examples only in `content/{lang}/CLAUDE.md` (S7) |
| Meaning-reversal traps | translator:80-95; editor:138-144; WATCHLIST trio | translator table, with editor linking to it; language-agnostic instances as `LAN: TRAP:` in `_original` |
| Git safety | ED:25-27; researcher:29-31; glossary:20-23; workflow-architect:22-24 | `docs/GLOSSARY_LINK_MAINTENANCE.md §5` (already cited) or the hooks README; one sentence + link elsewhere |
| Quality-bar numbers | conductor:51; ED:493 | ED only (conductor links) |
| Pipeline order | root CLAUDE.md:101-111; skills/CLAUDE.md:72-83; ED:327, :331-339, :496-503; workflow-architect:48; content/{cz,uk,en,es}/CLAUDE.md "Translation Phases" | skills/CLAUDE.md "Pipeline 2" (S1) |
| Footnote format | researcher:65-113; ED:81-97; entry-restructurer:81,88; cz CLAUDE.md:255-290; format-profile.yaml; FORMAT.md §7 | FORMAT.md §7 + profile (S5) |
| One-carnet-per-agent / finalize-before-idle | translator:21-43; editor:15-27, :298-306; opus-editor:21-33; ED:379-399 | ED (lead's contract) + a 3-line standard block in each worker skill |

---

## Agents vs skills drift (summary)

| Agent file | Drift |
|---|---|
| `translator.md` | Czech hard-coded; broken output format (ID after text, blank line inside cluster); `model: sonnet`; no Bash |
| `editor.md` | "sound Czech"; comments in JSON "ED writes them" vs skill's direct edits; `model: sonnet`; no Bash for the mandatory scans |
| `conductor.md` | "Czech prose"; JSON-only comments; paragraph example `"15.236"` (old ID form) |
| `entry-restructurer.md` | 2-digit IDs; "renumber" (skill forbids); nonexistent `scripts/paragraph_parser.py` |
| `researcher.md` | "first tag must be location", tags "at top"; `model: sonnet` vs project_config `opus` |
| `linguistic-annotator.md` | consistent (thin); fine |
| (missing) | no agent defs for opus-editor, fablelous, vox. Fine if they are spawned as general-purpose/fable per F1, but say so in ED |
