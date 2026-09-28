# HANDOFF: source restoration rebuild (Windmill task #63)

The lead session on uvm stopped here on 2026-09-28 about 22:30. It moved to the Coder workspace **Bashkirtseff**, which has autostop OFF.
This file is the resume point for the new lead session. Read it together with the memory note `source-restoration-rebuild.md`, `docs/REBUILD_CARNET.md` and `content/CLAUDE.md`.

## Where things are

- **Rebuild planning state** (plans, REVIEW, STATUS, FINISH, scripts, drawings) was copied from uvm's scratchpad to **`~/rebuild-state/`** in the workspace.
  - Every STATUS/FINISH file and every script in there refers to the old path `/tmp/claude-1000/-home-krr-bashkirtseff/467edde8-50c6-480d-80c0-3a213d11ff10/scratchpad/…`. Read that prefix as `~/rebuild-state/`.
  - Worktrees were NOT copied. Recreate them fresh at HEAD.
- **Scans** (gitignored): `content/_raw/scans/Tome6..16.pdf` are extracted into the repo checkout.
- **Memory**: `~/.claude/projects/-home-coder-bashkirtseff/memory/`, copied from uvm.
- **Workspace git**: the old local main from April is kept as branch `backup/workspace-main-2026-04`. Its commits already exist on origin under rewritten hashes, and main now tracks origin/main.

## Done and pushed (origin/main 907f5482e)

- **Tooling:** `rebuild-carnet`, multi-carnet mode, `rebuild-draft-plan`, paragraph kinds and drawings, and the set_french fixes cac96e6cd and d08a2fb03.
- **068:** rebuilt; the cover was withdrawn and the carnet renumbered by −2. Research, LAN and sync to all trees are done, and one drawing is linked.
- **065–067 (tome 9):** rebuilt in ffc4e213d…ec6fa6163. Redirects for the removed range stubs point to each range's first day (86cf8c69a).
- **Clippings and letters** are marked corpus-wide, except the carnets still being rebuilt.
- **Frontend:**
  - consecutive clippings/letters render as one grouped block with its language once in the header, and notes that carry content are kept;
  - untranslated paragraphs fall back to the French with a "TODO";
  - calendars are collapsed;
  - theme tags were piloted on 014, then set aside by the owner.

## In flight: per-tome appliers (all STOPPED cleanly; nobody holds the lock)

The resume point for each tome is `~/rebuild-state/plan-<tome>/STATUS.md`.

| Tome | Carnets | State at stop |
|---|---|---|
| 10 | 069–074 | Plans updated with the owner's answers; worktree gates PASS; completeness re-run pending (it hit ENOSPC). Next: validate, then apply. |
| 11+16 | 075–080, 101–106 | Plans updated. The tome 16 owner questions were answered with the defaults (see STATUS). Typo and accent fixes in old tome 16 text were in progress. |
| 14–15 | 090–100 | Typo policy applied to 23 items; validation run 6 was in progress. |
| 6–7 | 045–059 | Everything PASSes in the worktree after postfix_ed. postfix_headings is now redundant; postfix_footnotes is still needed for en 056/057. The completeness re-run is pending. |
| 12–13 | 081–089 | Plans final. Validation interrupted by ENOSPC, so it must re-run. |
| 1–2 | 001–014 | Re-validation at HEAD in progress. |
| 3–4 | 015–030 | Validated: verify and splicescan PASS for all 80. Needs postfix.py for the ED-comment false positive (below). |
| 5 | 031–044 | Planning. The owner approved an accent restoration for 038–044 (≈1,700 paragraphs, exact match only), as a SEPARATE commit. |
| 8 | 060–064 | NOT started. Also restore the June Ignotus/Antonelli article at 062.0633 (tome08 ¶2585–2599). |

Any validation that ran while the uvm disk was full (about 21:30–22:10) may have corrupted output, so re-run it.

## Protocol

- **Write lock:** all writes to main go through the lock. `mkdir ~/rebuild-state/MAIN_WRITE_LOCK` (atomic), write the owner name into it, `git pull --no-rebase`, check that `git status --short content/` is clean, re-run the dry run at HEAD, apply, run the gates, commit, then `rm -r` the lock.
- **Commits:** layered. First `_original` plus `content/_renumber/<carnet>/` (plans, REVIEW, scripts), the drawings in `src/frontend/public/images/marie/drawings/<carnet>/`, and ref rewrites outside the language trees. Then one commit per language tree. Stage explicit paths only.
- **Gates:** `just renumber-check`, `verify-carnet` and `splicescan` for _original/cz/uk/en/fr (plus es for 001), `check-comments`, and `just source-completeness` with 0 missing diary text.
- **Push** after each finished tome. Deploys run automatically on push.
- **Concurrency:** the workspace has 12 cores and ample RAM, but keep it to about 4 appliers at once.
- **Model routing** (owner): Sonnet for research, RSR and maintenance; Opus for rebuild planning, translation, RED and CON.

## Owner policies (KRR, 2026-09-27/28)

- **Rebuild:** carnets are rebuilt into manuscript order and renumbered; the git history is the explanation.
- **Include ALL of Marie's content**, as paragraph kinds: clipping or letter (quoted with `> `), rayé, margin, editorial, other.
- **Cover and title pages are NOT included**, because the manuscript isn't scanned (a digitisation quote was about €90k). Record their text in REVIEW under "withdrawn cover pages". One exception: Marie's own notes on title pages go in as margin/other at the first entry, e.g. the Livre 80 «Femme nue» annotation and the Livre 102 reading notes.
- **Printed-edition footnotes** stay out.
- **Empty days** get separate "[Aucun texte…]" entries.
- **Labels** match the manuscript.
- **Typos:** the printed edition's obvious typesetting typos are CORRECTED via set_french, with an RSR note giving the page. Marie's genuine spellings stay.
- **Facsimiles** of programmes and clippings are shown as an image plus the transcription.
- **Drawings** are credited to Marie unless evidence says otherwise (e.g. «fait pour Marcuard»).
- **Larderei → Larderel:** fixed in tome 10. A corpus-wide rename (glossary LARDEREI → LARDEREL) is to be done after the rebuilds.
- **Clippings** are translated.
- **Tags** (weather, clothing, shopping, church, money and property with family/others qualifiers) are **postponed**. Faithful content comes first.

## Open follow-ups

1. **Tool: ED-comment false positive.** The tool's flag-reset ED comment names moved files as `CCC/file.md`, and renumber-check (c) reads that as a link to a removed entry. Fix the wording or make the check skip those comments. Tomes 3–4 and 6–7 currently use postfix scripts.
2. **Tool: duplicated footnote definitions** in cross-carnet moves (cz/009, en/012) and old footnote labels kept after set_french (082). Check whether these still happen.
3. **Italics audit:** does the docx formatting (italics, underline, superscript) survive in `_original`? A partial result is in `~/rebuild-state/italics/`. The owner suspects missing italics.
4. **Stale frontmatter:** `dates.primary` is stale in the 067 entries that were split from range stubs.
5. **Translation wave** for all restored paragraphs (cz/uk/en; fr edition). The site's percentages drop until this is done.
6. **UK calque pass** 082–097 (the cloud session stopped at 081).
7. **Report to Windmill task #63** (run 13): progress notes, then `update_status` done when complete.
