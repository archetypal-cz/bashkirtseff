# Brief D — owner decisions on the sharp-scan questions (KRR 2026-10-24: «podle doporučení»)

The owner accepted the lead's recommendations. Apply them to `content/_original/` (part 1), then report.
Read first: `.claude/skills/_shared/editing_rules.md`, `content/CLAUDE.md` (Russian mark ~line 92), BRIEF-A.md
(tools: view.py / find.py for page images). Rules as in BRIEF-A: Edit tool for comment lines, comments on their
own lines, real timestamps, role RSR, never renumber, no git, no OPEN-ITEMS.

## Part 1 — `_original`

1. **A-69, 051.0435 monks' letter:** «Cogery» → «Gogery» (both occurrences), following Marie's facsimile
   (t.6 p.267, `hires/Tome6/p267.png`). Leave the other facsimile differences as printed. Update the existing
   RSR NOTE of 2026-10-23 in that entry (one short added sentence: «Gogery» follows the facsimile, owner
   decision 2026-10-24) rather than adding a long new one.
2. **A-70, broken type «l» read «i», 033.0340–0368** (t.5 PDF pp.95–96, files 033/1875-05-28…05-30):
   normalise every i-for-l form («vouiais aiier», «ii», «ie», «ia», «Eiles», «Gaiuia», «queiie trembiante»,
   «ceia», «pius iongtemps» …) to the intended «l» spelling. Check each on the image; touch nothing that is
   Marie's own spelling. Replace the existing per-paragraph «kept as printed» notes with one RSR NOTE per
   paragraph: «Type defect of the print (broken «l» printed as «i», Mon Journal t.5 p.N) normalised to «l»;
   owner decision 2026-10-24.» Also **034.0081**: the print has «tcncó» (acute), ours «tcncô»: fix text and
   the footnote 034.0081.1 if it quotes it; note.
3. **A-67, Ukrainian verses 039.0252–0258:** replace those r-footnote definitions (labels unchanged) with
   `Written in Ukrainian (Little Russian) in the manuscript; French translation by the editor.` and add one
   RSR NOTE in the entry citing 039.0259 («la petite russienne»). 044.0161 and 038.0218 stay as they are.
4. **C-33, 022.0080 missing verse opening (t.4 p.59):** the 12 lines plus the signature line «Wal[itsky]»
   transcribed in A2.md "Open questions" item 1 belong before «Pas habillé, pas lavé». Re-read them on the
   image (Tome4 p059 — confirm the PDF page with find.py). Prepend them inside the 022.0080 cluster, one verse
   line per text line, as in the neighbouring verse paragraphs; the whole prepended block is one Russian run
   `==…==[^022.0080.rK]` (keep or renumber K within 0080 so labels stay unique, and keep the existing mark of
   «Pas habillé, pas lavé»), localized definition as usual. RSR NOTE: the lines are missing from the docx and
   the text layer, restored from the print, kept in 0080 until a future `just rebuild-carnet 022` splits them;
   tag line for Merjeewsky if not already on the cluster.
5. **Gates:** `just splicescan _original CCC` prints nothing and `just verify-carnet _original CCC` passes for
   022, 033, 034, 039, 051.

## Report

Write `.claude/reports/hires-2026-10-23/D.md`: per item the pids changed (old → new, short), and a
**Translation impact** list per tree: what the translators must change (Gogery spelling; 022.0080 new verse
lines to translate with the Russian mark; 039.0252–0258 note wording; 034.0081 footnote quote if any tree
quotes «tcncô»; 033 i→l only where a tree's visible text — likely only fr — carries the broken forms).
Final message: counts + path.
