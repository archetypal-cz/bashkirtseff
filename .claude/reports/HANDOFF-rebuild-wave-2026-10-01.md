# HANDOFF: source restoration and post-rebuild translation wave (2026-10-01)

This follows on from `HANDOFF-rebuild-2026-09-28.md`. Lead session: the Coder workspace, 2026-09-28 to 2026-10-01.
The detailed working state is in `~/rebuild-state/`, which is not in git:
- `LEAD_STATUS.md`
- `source-issues.md`, with a RESUME HERE block at the top
- `wave/{cz,uk,en}.md`, each with a RESUME HERE block at the top
- the `plan-*/FINISH.md` files

## Done

- **Source restoration (Windmill #63):** all carnets 001–106 were rebuilt into manuscript order and renumbered. The records are in `content/_renumber/`.
  - Marie's own title-page notes are included as margin/other. Cover formulas are withdrawn.
- **Post-rebuild audit:** `just rebuild-audit` (`src/scripts/rebuild_audit.py` plus `rebuild_audit_exceptions.yaml`). Sonnet triaged its findings and they were fixed.
  - What's left: 13 accent cases, skipped on purpose as uncertain, and 83 cosmetic findings.
- **Accent restoration:** corpus-wide, exact match with the printed edition only (owner-approved).
- **Source fixes:** made in `_original` and carried into every tree:
  - OCR «I»/«II» for «!»
  - Russian passages: the ★ markers are gone; the passages are marked with ==…== and a localized footnote
  - Larderei → Larderel in the text (not yet in the glossary)
  - wrong footnotes corrected, with cited sources
  - page-break joins: about 280 pairs, each scan-checked
- **Tooling** (toolsmith):
  - `just sync` now makes line-level edits only
  - `rebuild-carnet`: the ED-comment false positive, duplicate footnote definitions, date-heading TODOs, the README range, IDs inside RSR notes and fr multi-line blocks are fixed
  - `source-completeness`: no more `-2` report files
  - the drafter is fixed
- **Translation wave:** cz, uk and en each have 0 TODO and all entries conductor_approved (checked 2026-10-01 at 81f6f4869).
  - Pipeline: TR → RED → CON, with gates after each stage, then a commit per carnet.
  - From 2026-10-01, TR and RED ran on Sonnet 5.5 and CON on Opus.
- **Frontend:**
  - footnotes are numbered 1..n per entry (3944f6ffe)
  - Ctrl+Enter submits the report dialog (0b0b7d2b6)
- **Glossary:**
  - SILENE written
  - AQUARIUM, GIOIA, LIVOURNE, RUE_DE_BOULOGNE, PINCIO, MARCHE, CHANTILLY, HALFWEG, HAARLEM and AMSTERDAM moved to their correct categories

## Owner rulings made in this run

- God is addressed as «ty» in cz and «ти» in uk.
- Names follow Marie's spelling at each occurrence, e.g. Audiffer stays Audiffer.
- *Bigre!* is not translated and stays in italics.
- «Le Bec» is a proper name.
- EN uses British spelling.
- CZ: Marie's English words are kept in the text as ==English== across the whole tree. A whole entry written in English stays translated, with the note „V originále anglicky (tento a N následujících odstavců)."
- Names (2026-10-02, option B): private persons keep Marie's French spelling, and famous public figures get the standard form. This supersedes the 2026-10-01 cz forms Karagjorgjevič, Čumakov and Musja. «maršálová» stands.
- Russian passages carry the note "written in Russian in the manuscript; translated by the editor".
- Factual footnotes must cite a source. Notes written from memory are not acceptable.

## Next session: in this order

1. **fix-source:**
   - sync + Larderel + backlog for 084–106
   - the remaining joins: 094 (9), 097 (1), 099 (7), 102 (1)
   - the three new source items: 093.0128, 092/1881-07-16, 093.0109

   Then the seam RED pass in each tree.
2. **cz end sweep:**
   - NAMES, owner ruling 2026-10-02 (option B, research in ~/rebuild-state/names-research.md): **private persons keep Marie's French spelling** (Tchoumakoff, Moussia, Karageorgevitch, Walitsky, Sapogenikoff…, declined the Czech way: s Tchoumakoffem). **Famous public figures get the standard Czech form** (Turgeněv, Tolstoj, Puškin). This REVERSES the 2026-10-01 TM locks Čumakov, Karagjorgjevič, Musja, and the old Miloradovič/Gricja rows. Sweep about 640 occurrences in cz and about 10 in en; uk stays as it is (Gurevich model). Fix the cz TM first, then sweep with RED/CON spot checks.
   - apply «maršálová» across the tree (locked in the TM; the English-run notes were already reworded in e592ce466)
   - remaining cz owner questions (listed in `.claude/reports/2026-10-01-cz-001-106.md`): Tchernitská/Černická, Saint Amand/Saint-Amand, Jurkov/Yourkoff
   - 078.0249 «sur son bras»
3. **uk:**
   - seam RED on 183 entries
   - the three fix-source items listed in `wave/uk.md`
   - TM questions: Gabriel, Fedus, Blackprince, Tamancheff, and the struck/blacked-out label forms
4. **Final steps:**
   - rename the glossary file `LARDEREI.md` → `LARDEREL.md`, with its link paths, tag names and frontmatter entity IDs, all in one lock window
   - `just tag-sync` for every tree
   - re-run `just rebuild-audit` and the length check across the corpus
5. **Frontend:** show the language marker on the paragraphs that follow the noted one in an English run.
6. **Owner (KRR) only:**
   - after deploy, run the auth-DB SQL remaps (`content/_renumber/*.sql`) on aretea
   - delete the local branches fix-inplace, fix-inplace2 and fix-inplace3; their content is all on main
   - the worktree `~/rebuild-wt/toolsmith` has local changes in drafter files. They are probably already in 03f10a5fb, so check, then remove it.
7. **Windmill task #63:** report progress, then set the status to done.

## Lessons (also in memory)

- **Idle subagents:** they don't wake themselves to wait for a lock. They have to loop in Bash.
- **Shared checkout:** stage only files that were clean before your run. Never restore files from HEAD in bulk. Never leave renames staged, because any other agent's commit sweeps them in.
- **The lock:** only the agent named in the owner file may remove it. Check the owner file after `mkdir`.
- **Sonnet RED:** it once invented words to fill a real gap in the source, and once reported a fix it never made. Opus CON caught both, so keep CON on Opus.
- **Spend and session limits:** they stop all agents at once. Recover by recounting from disk (frontmatter flags, TODO) and restarting each stage at its exact resume point.

## Added 2026-10-02

- **Done today:**
  - fix-source finished 084–106: sync, Larderel, backlog, the last page-break joins (batch 5), and batch 6 (062.0833 margin, splits in 081/082, 083.0540).
  - The five print gaps are marked. 018.0113 is restored.
  - «de Daillens» = Mme, née de Mouzay, unified in cz/uk/en.
  - The «son bras» nickname is fixed in all trees.
  - Works hub, works catalogue (docs/research/), reproductions research, Marie's main glossary entry rewritten, glossary renderer fixes.
- **Survey of gaps fillable from the 1887 edition:** none. The 1887 edition fills no gap in the modern print.
- **NEXT (owner GO 2026-10-02):** the multi-paragraph split wave, in batches by tome (survey: ~/rebuild-state/plan-sourcefix/multipara-survey.md).
  - Scope: 588 clusters to split, about 2,931 new IDs. Only scan- or docx-confirmed split points; the 103 unconfirmed points and the 14 mixed cases go later and separately.
  - Translations: split mechanically where the tree line counts match (about 40%); otherwise the drivers redistribute (Sonnet RED, Opus CON).
  - Same discipline as batches 5–6: run only when every tree is clean in the carnet, and each committer stages only its own files.
- **Also in the split wave:** fold the 451 comment-only paragraph IDs (old RSR entry summaries from the Feb normalisation, carnets 001–044 and 072) into each entry's real paragraph, in the same rebuild runs; keep the approval flags. Rule (fix-source): drop the ID and move its RSR comment(s) and tags into the entry's **last** real paragraph, in every tree; the post-step restores flags from HEAD where nothing else in the entry changed. Prepared tooling and the tome-16 plans: `~/rebuild-state/plan-sourcefix/wave1/` (RESUME HERE in `source-issues.md`).
- **Tags in the split wave (owner 2026-10-02):** audit the tags of every paragraph in each batch's carnets (entity tags must match their paragraph; split tags across new pieces), Sonnet glossary-tagger with an Opus spot-check. ADD NEW THEMES once the owner approves the taxonomy in ~/rebuild-state/theme-taxonomy-proposal.md (weather, clothing, shopping, church, money/property with qualifiers, …).
- **Owner cleanup:** remove the worktrees ~/rebuild-wt/{fs-split,fs-split2,toolsmith} and the branches fix-inplace{,2,3}.
- **Still on hold:** the names sweep (option B) waits for the owner's go.
