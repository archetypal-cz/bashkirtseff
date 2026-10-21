# Brief — RSR on restored paragraphs (originals wave, 2026-10-21)

Role: researcher (RSR). Read `.claude/skills/researcher/SKILL.md` and `.claude/skills/_shared/editing_rules.md` first.

## Task

The 2026-09-28 rebuild restored text that was missing from the old extraction. These "bare" paragraphs carry
only a `RSR: Restored from tomeNN.docx ¶…` provenance note and were never researched. The list for your
carnet (file, paragraph ID, word count) is `bare/CCC.txt` in the session scratchpad named in your prompt.

For each listed paragraph, do the research the rest of the carnet already has:

- **Notes:** identify people, places, works, events and allusions; add an RSR comment where context helps a
  translator. Not every paragraph needs one. No filler.
- **Tags:** add missing `%% [#Name](../_glossary/…) %%` tag lines (look up with `just glossary-search` /
  `just glossary-resolve`; canonical files per `~/rebuild-state/tag-audit/TAGGER_BRIEF.md` calibration for
  the period; theme tags per the 35-theme taxonomy in `_glossary/culture/themes/`; clippings get entity tags,
  not themes).
- **Glossary:** create an entry only if the entity has none and is mentioned at least twice in the corpus
  (grep). Check the file doesn't exist right before writing it; other researchers run in parallel. Never run
  glossary-move, -merge, -dedup or anything that rewrites references repo-wide; report such needs.
- **Footnotes** only where the skill says one belongs, in the carnet's existing format.
- **Frontmatter: leave `entities:` alone** (the lead runs `just entities-sync`). Correct `location` only if
  the restored text clearly shows Marie elsewhere. Don't touch `linguistic_annotation_complete`.

## Rules learned from the pilot review (034/037) — binding

1. Before writing "first appearance"/"first used", grep the **whole carnet** (and earlier carnets if you
   claim a corpus first). Before citing a date or file in a note or glossary entry, open/grep that file.
2. For an identity, **quote the deciding source line** in the note, and look for counter-evidence in the
   same entry before linking two passages. If unsure, hedge with a confidence (e.g. "probably … (0.6)").
3. Never state a fact about a period institution (law, transport, theatre, Freemasonry, church) without a
   cited source; otherwise hedge or leave it out.
4. If an existing glossary entry conflicts with the source, don't work around it: add a line to
   `.claude/reports/OPEN-ITEMS.md` (section B, `[glossary]`) and mention it in your report.
5. Quote sources exactly for spelling variants and cross-references; never add unsourced variants.
6. One note per fact. If a LAN note already explains it, don't repeat it.
7. Cite secondary sources (Kernberger 2013, Blind 1890, Wikipedia, etc.) whenever you use them.
8. Cite paragraphs by their `%% CCC.NNNN %%` ID, found by searching the text, never by line number: other
   agents insert lines into the same carnet while you work (070, 2026-10-21: two citations pointed one
   paragraph off). Re-check every ID you cite just before you finish.

## Format

Keep the provenance note. New comments on their own lines, after the ID/tag lines and before the French.
Timestamps from `date +%Y-%m-%dT%H:%M:%S`. Never change Marie's French text or paragraph IDs; never edit
other paragraphs except to fix an obvious tag error (report it). Problems in the restored text itself (OCR
damage, misplaced paragraph, wrong date): add `RSR: NOTE:` and list it. Never restore or checkout files from
git; name scratch files with your carnet number.

## Gates and report

`just verify-carnet _original CCC` PASS and `just splicescan _original CCC` empty. No commits or git
mutations. Report concisely: paragraphs annotated / left, glossary entries created or extended (paths),
tags added, footnotes, problems found, ledger lines added, gate results.
