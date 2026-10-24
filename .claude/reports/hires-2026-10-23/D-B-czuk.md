# D-B (cz, uk): owner decisions from D carried into the trees (2026-10-24)

Source: `_original` commit 5d42bdbc66 (report `D.md`, "Translation impact"). The lead had already synced the embedded French and footnotes. Only the cz and uk trees were edited. No git, no OPEN-ITEMS.

## cz

| pid | change |
|---|---|
| 022.0080 | Translated the 12 restored verse lines plus «Wal[itsky]» as one multi-line run `==…==[^022.0080.r2]` before `==Neoblečený, neumytý==[^022.0080.r1]`, one line per verse line like 0081–0105. Names: «Merjeevsky Mechlav» follows Marie's spelling per occurrence (TM rule 2), «Wal[itský]» uses the locked Walitský, and «la redoute» became «Redouty» as in 022/1874-08-08. Sync had appended a stray `[^022.0080.r2]` after r1; I removed it. The English r2 definition that sync placed at the end of the file was replaced by a cz definition next to r1. The 00:54 TR note now drops the "13 lines still missing" sentence, and a new TR note was added. |
| 039.0252, 0254, 0255, 0257, 0258 | The 5 definitions now read `Pozn. překl.: V originále ukrajinsky (maloruštinou); do francouzštiny přeložil vydavatel.` One TR note was added per paragraph. |
| 051.0435 | Cogerymu/Cogery became Gogerymu/Gogery. TR note added. |
| 034.0081 | Footnote `[^34.81.1]` now quotes «tcncó» instead of «tcncô». TR note added. |
| 033 | No visible change needed. The cz text already reads uncle, Galula, Aglaé/Euphrosine and Rumpelmayer. |

## uk

| pid | change |
|---|---|
| 022.0080 | Translated the same run as r2, one line per verse line with the trailing commas used in 0081–0105. Names: Мержевський (TM lock) Мехлав, «Вал[іцький]», and «Редуту» for the redoute. Removed the stray `,[^022.0080.r2]` that sync had appended after r1. The English r2 definition at the end of the file was replaced with `В оригіналі російською; французький переклад видавця.` TR note added. |
| 039.0252, 0254, 0255, 0257, 0258 | The 5 definitions now read `В оригіналі українською (малоросійською); французький переклад видавця.` One TR note was added per paragraph. |
| 051.0435 | Коджері ×2 became **Ґожері**: French «ge» is rendered as ж, as in Жерікке. The older FAB/CON notes that quote Cogery were left as history. TR note added. |
| 034.0081 | Footnote `[^34.06.2]` now quotes «tcncó» instead of «tcncô». TR note added. The older LAN, TR and CON notes that quote tcncô were left as history. |
| 033 | No visible change needed. Checked 0349, 0352, 0358, 0361 and 0368 against `_original`. |

Skipped: nothing. The source tag line `[#Merjeewsky] [#Walitsky]` for 022.0080 was not copied into cz/uk, because tags were outside this task (`just sync 022 L --tags` would add it).

## Gates

For cz and uk on 022, 033, 034, 039 and 051: `just splicescan` printed nothing and `just verify-carnet` gave PASS (0 fail, 0 warn) in all 10 runs. `just check-comments` is OK for both cz and uk. No `Written in …` English definitions are left in these carnets.

## Counts

- Paragraphs changed per tree: 8 (022: 1, 039: 5, 051: 1, 034: 1). That makes 16 in total.
- New verse lines translated: 12 per tree.
- Footnote definitions: 1 added (r2) and 6 rewritten per tree (5 in 039, 1 in 034).
- TR notes added: 8 per tree.
- New TM terms: none. Ґожері (uk) and Gogery (cz) are one-off names in the letter.
