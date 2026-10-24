# Brief E — structural fixes from the sharp scans (owner OK 2026-10-24: «jestli je někde potřeba opravit dělení
odstavců nebo jinou přestavbu carnetu, pusťme se do toho»)

Read first, fully: `docs/REBUILD_CARNET.md` (plan format, splits §"What moves", the split-wave rules, outputs,
gates), `.claude/skills/_shared/editing_rules.md`, `content/CLAUDE.md` (Russian mark). Page images: tools in
BRIEF-A.md (view.py / find.py). One image command at a time (low RAM). No git writes (read-only git is fine), no
OPEN-ITEMS. The lead commits after each carnet, so **finish one carnet completely (all trees, all gates) before
starting the next, and stop after each carnet with a short status in your report** — then continue.

## Work items (in this order)

1. **022 (t.4 pp.59–60).** (a) 022.0080 now holds 13 restored verse lines (run `r2`, «D'un Etat détruit … Enflé
   de graisse» + «Wal[itsky]») followed by «Pas habillé, pas lavé» (run `r1`). Give each restored verse line its
   own paragraph, like the neighbours 0081–0105 (one printed line = one ID; check the print's line grouping on
   the image — a signature line may stay with its stanza if the print sets it so). (b) 022.0091 «Aux quatre
   yeux» + 022.0092 «Albin Body»: the print sets them as one line — merge (0091 `set_french` with both, 0092 in
   `drop` with the reason). Footnote labels/marks: each new verse paragraph carries its own `==…==[^022.NNNN.r1]`
   + definition in every tree after the rebuild.
2. **032.0205 (t.5 PDF 44):** split into two paragraphs at the print's paragraph break («… plaisanteries.» /
   «On voit ce que j'ai ajouté …» — confirm on the image).
3. **034.0480:** the print has a dialogue dash («- Oui, c'est cela, fit Girofla …») and «Je ne dis rien.» as its
   own paragraph/line — confirm on the image; fix the dash (house style for dialogue dashes as in the
   neighbouring paragraphs) and split off «Je ne dis rien.» if the print sets it as its own paragraph.
4. **040.0038 (no rebuild):** add the print's footnote «Traduction donnée par Marie» as a source footnote in
   `_original` (English definition, like other source notes: what the edition's note says, attributed to the
   edition) and the localized definition in cz/uk/en/fr, ref at the right word.

## Method per carnet

`just rebuild-carnet-plan CCC > plan` (scratchpad) → edit the plan (`set_french` on the head, `new` paragraphs
with an `rsr` note citing «Mon Journal t.N p.X (sharp page image), split from CCC.NNNN», tags) → dry run → fix →
`--write` → in every tree: move the existing translation of each split-off piece out of the head into the new
cluster (replace `TODO`), restore the Russian marks/footnotes per piece, remove the `SOURCE CHANGED`/flag-reset
notes where the translation is now complete and restore approval flags from HEAD only where the rules allow
(split-wave rule: distributed unchanged → flags restored); fr: follow its visible-text state. Gates for
`_original` and cz/uk/en/fr (and es if it has the carnet): `just renumber-check CCC`, `just verify-carnet L CCC`
PASS, `just splicescan L CCC` empty.

## Report

`.claude/reports/hires-2026-10-23/E.md`: per carnet the id map summary (old → new ranges), what was split/merged,
per-tree status, gate results, files outside the carnet that the rewriter touched (list them — the lead must
commit them), and anything left. Final message: counts + path.
