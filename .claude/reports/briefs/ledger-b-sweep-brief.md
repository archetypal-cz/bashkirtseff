# Brief — close the open research items of OPEN-ITEMS section B (2026-10-22)

Owner priority (2026-10-21): `_original` in perfect order — research, notes, tags, glossary. Section B of
`.claude/reports/OPEN-ITEMS.md` holds ~65 open research items, most from the 2026-10-21 waves. Close as many
as the sources allow. Role: researcher + glossary. Read `.claude/skills/researcher/SKILL.md`,
`.claude/skills/glossary/SKILL.md`, `.claude/reports/briefs/restored-rsr-brief.md` (rules 1–9),
`.claude/reports/briefs/glossary-identity-research-brief.md` («Identity uncertain» convention) and
`~/rebuild-state/tag-audit/TAGGER_BRIEF.md`.

## Scope

Your prompt names a carnet range and item IDs. Do every part of those items that concerns your carnets
(an item may span ranges: do your part, say which parts are left). Other researchers work on other ranges at
the same time: never edit a diary or tree file outside your range.

## What to do per part

- **Identity / fact questions:** settle from the sources (tome name indexes and scans in `content/_raw/`,
  Kernberger 2013 in `raw_books/`, web). Quote the deciding line, give a confidence. Unsettled after a real
  search → «Identity uncertain» section in the entry (or an RSR note saying what is unknown), and say so.
- **Wrong notes:** `RSR: CORRECTION —` line under the wrong RSR/LAN note; a wrong source footnote is rewritten
  in `_original` and in the equivalent footnote of cz/uk/en/fr (by hand, translated; never change translated
  text other than footnote markers/definitions).
- **Tags:** retag/add/remove tag lines in `_original` (≥0.8). Don't edit trees' tags (the lead reconciles).
- **Glossary bodies:** fix them. Check a file's current content right before editing (others edit the
  glossary too). New entries only under the ≥2-mentions rule. **No glossary-move/merge/retire tools** — list
  needed merges/moves/retirements (SRC → TGT, evidence) in your report; the lead runs them.
- **Source text problems** (OCR, readings): check the scan; fix only an evident transcription error with an
  `RSR: NOTE:` giving the scan page; otherwise note it.

## Ledger

Re-read OPEN-ITEMS.md right before each edit. Per item: tick `- [x]` when every part is done, else append
`— **sweep 2026-10-22:** done (1)(3); open (2): <why>`. New items only for genuinely new findings (highest
number checked first).

## Rules, gates, report

Never Marie's French (except an evident transcription error as above), IDs or frontmatter `entities:`.
Edit tool or Python; never printf/echo/sed for `%%` lines. Never git checkout/restore/stash/reset; no
commits. Gates per touched carnet: `just verify-carnet _original C` PASS, `just splicescan _original C`
empty; for touched trees the same plus visible text unchanged apart from footnotes; `just glossary-missing`
0. Write touched files (repo-relative, plain) to the file list named in your prompt. Report: per item what was
settled / left, merges/moves needed, gates.
