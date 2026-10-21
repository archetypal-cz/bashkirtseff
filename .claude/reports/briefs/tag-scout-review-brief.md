# Brief — review untagged alias mentions (originals wave, 2026-10-21)

Read `.claude/skills/glossary-tagger/SKILL.md`, `~/rebuild-state/tag-audit/TAGGER_BRIEF.md` (binding calibration:
canonical files per period, never-targets, home-city and «tout Paris» rules, kinship rule) and
`.claude/skills/_shared/editing_rules.md` §1.

## Input

`tag-scout/candidates.tsv` in the session scratchpad named in your prompt: one row per (paragraph, glossary ID)
where the French body text matches an alias of that entry and the paragraph has no tag for it. Columns: carnet,
file, paragraph_id, glossary_id, current_path, alias, snippet, triage (LIKELY / AMBIGUOUS / NOISE), alt_ids,
target_uses, note. Paths may have changed since the scout ran (the glossary was reorganised): resolve every ID
with `just glossary-resolve` or by finding `<ID>.md` under `content/_original/_glossary/` before writing a link.
Your prompt says which rows are yours (a carnet range, or a list of IDs).

## Decide each row

- Tag only where the alias really refers to that entity in that paragraph. Read the paragraph, and the entry
  around it when the referent depends on context (who is «la princesse», «Marie», «Alexandre», «papa» in this
  year; which Opéra, Salon, Exposition). Check `alt_ids`: the right file may be one of them.
- Never tag Marie's code names, «tout Paris»/society uses, office titles («député de…»), nationality words.
- Auto-generated stubs: if a canonical file exists for the same entity, tag that instead; if the stub is the
  only file, tag it.
- A row you can't settle from the text: leave it and list it (unsure).

## Write

Add `%% [#Display](../_glossary/<path>.md) %%` on its own line in the paragraph, with the other tag lines after
the ID line (display name as used elsewhere for that file — grep). Prefer `just tag-audit-apply C --decisions
FILE --write` with a decisions file if it fits your rows; otherwise the Edit tool or Python. Never
printf/echo/sed for double-percent lines. Only tag lines; never French, notes, footnotes, IDs, frontmatter.
Never git checkout/restore/stash/reset. Don't run entities-sync. No commits.

If you see an existing tag that is plainly wrong, fix it and list it; doubtful ones go to
`.claude/reports/OPEN-ITEMS.md` section B (check the highest B number right before adding).

## Gates and report

Per touched carnet: `just verify-carnet _original C` PASS, `just splicescan _original C` empty,
`just check-links _original C` OK. Write touched files to the file list named in your prompt. Report: rows
tagged / rejected (main reasons with counts) / unsure (list); existing tags fixed; ledger lines; gates.
