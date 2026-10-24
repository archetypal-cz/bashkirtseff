# D: owner decisions on the sharp-scan questions, part 1 (`_original`) (2026-10-24)

Brief: `BRIEF-D.md`. Only `content/_original/` was edited, in carnets 022, 033, 034, 039 and 051. No translation trees, no git, no OPEN-ITEMS.

## Changes

### 1. A-69, 051.0435: Cogery → Gogery (`051/1876-01-07.md`)
- 051.0435 letter text: «à Cogery du London House et le dit Cogery» → «à Gogery … le dit Gogery».
- The RSR NOTE of 2026-10-23 was updated. «Cogery» is out of the "kept as printed" list, and the note now says: «Gogery» follows the facsimile, owner decision 2026-10-24. The other four differences from the facsimile («O», «Et tu le voulais», «7 Fr.», «London House») stay as printed.

### 2. A-70, the print's broken «l» in 033.0340–0368 (t.5 pp.94–95 = PDF 95–96), plus 034.0081
I re-read both pages on the sharp images. Every i-for-l form was normalised to «l». Each changed paragraph has one RSR NOTE: «Type defect of the print (broken «l» printed as «i», Mon Journal t.5 p.N (PDF p.M)) normalised to «l»; owner decision 2026-10-24.» Some notes add the specific forms. Marie's own forms were not touched («déferrée», «Girofla», «Audiffer»).

| pid | old → new (short) |
|---|---|
| 033.0340 | «beiie» → «belle» |
| 033.0342 | «ii», «ceia», «ie voyage», «queis gens iis», «ies», «eiies» ×2, «ailer», «ie petit» → l-forms |
| 033.0343 | «ie Russe» → «le Russe» |
| 033.0344 | «ie château» → «le château» |
| 033.0345 | «eiles s'habiiient», «ia voiture» → «elles s'habillent», «la voiture» |
| 033.0348 | «Rumpeimayer», «ies dames» → «Rumpelmayer», «les dames» |
| 033.0349 | «son onde Saëtone» → «son oncle Saëtone» (print «oncie»; the OCR read «onde») |
| 033.0350 | «il pieut» → «il pleut» |
| 033.0351 | «ne me ies» → «ne me les» |
| 033.0352 | «vouiais aiier … aiié … mai» → «voulais aller … allé … mal» |
| 033.0353 | «ia même» → «la même» |
| 033.0355 | «i'ègiise», «oubiie», «queiie trembiante», «fabie» → «l'église», «oublie», «quelle tremblante», «fable» |
| 033.0356 | «Eiles», «ie rideau», «ies ombres» → l-forms |
| 033.0357 | «Eiles» → «Elles» |
| 033.0358 | «i'église», «Agiaé et Eupnrosine» → «l'église», «Aglaé et Euphrosine» («Eupnrosine» was an OCR slip; the print has «Euphrosine») |
| 033.0359 | «saiue», «ceia», «ie» ×2, «parie, ii me sembie» → «salue», «cela», «le», «parle, il me semble» |
| 033.0360 | «iongtemps … eiie me sembie» → «longtemps … elle me semble» |
| 033.0361 | «ia», «ii» ×3, «ie» ×2, «paiiie», «écoiier», «*rouier*», «*dégringoier*», «gentii» → l-forms; «. ii a» → «. Il a» |
| 033.0363 | «ie» ×2, «aiions», «aiier» → «le», «allons», «aller» |
| 033.0365 | «aiiez», «ià», «ie piaisir», «pius iongtemps» → «allez», «là», «le plaisir», «plus longtemps» |
| 033.0366 | «miiieu de ia» → «milieu de la» |
| 033.0367 | «ii se tourne» → «il se tourne» |
| 033.0368 | «Gaiuia» → «Galula» |
| 033.0341 | ocr-fix: «d^:^un» → «d'un» (own note) |
| 033.0310 | ocr-fix outside the range: «ies bouts» → «les bouts». The print (PDF 93) has a sound «l» there (own note). |

- Four older notes that said "kept as printed / see the report" were rewritten to drop that clause: 0340, 0352 and 0361 keep their other content, and 0355 was replaced by the new note, which records that the OCR had «tremolante».
- 033 has no i-for-l forms left (`grep -E '\b(ii|ie|ia|ies|iis|eiles|ceia|aiier)\b|iie|aiié|sembie'` on text lines returns 0 hits).
- Old LAN notes now describe superseded readings and were left in place: 033.0340 «beiie», 033.0355 «tremolante», 033.0356 «piètre».
- **034.0081** (`034/1875-06-09.md`): «tcncô» → «tcncó» in the text and in footnote 034.0081.1. I confirmed the acute on t.5 p.112 (PDF 113). RSR NOTE added. The LAN note still quotes «tcncô».

### 3. A-67, Ukrainian verses 039.0252–0258 (`039/1875-08-26.md`)
- The definitions 039.0252.r1, 0254.r1, 0255.r1, 0257.r1 and 0258.r1 now read `Written in Ukrainian (Little Russian) in the manuscript; French translation by the editor.` The labels are unchanged.
- I added one RSR NOTE on 0252 that cites 039.0259 «la petite russienne». In the existing 2026-10-24T01:43 note, «pending the owner's ruling (report A5)» became «(see the next note)».
- 039.0262 «Obeziana», 044.0161 and 038.0218 are unchanged.
- There is no UKRAINIAN glossary entry under `culture/languages/`, so no language tag was added.

### 4. C-33, 022.0080: the verse opening restored (`022/1874-07-25.md`)
- I re-read t.4 p.59 on the sharp image. find.py puts «Pas habillé» on PDF 60; the text layer does not have the p.59 lines.
- The 12 lines plus «Wal[itsky]» were prepended inside 022.0080, one line per verse line, as a single run `==D'un Etat détruit … Enflé de graisse==[^022.0080.r2]`. This follows the multi-line run format of 023.0218. The existing `==Pas habillé, pas lavé==[^022.0080.r1]` was kept as it is: I numbered the new run r2 so that the trees' existing r1 labels stay valid. A new definition 022.0080.r2 (standard Russian note) was added.
- I added a tag line `[#Merjeewsky] [#Walitsky]` to the cluster, and an RSR NOTE: the lines are missing from the docx and the text layer, were restored from the print, «Merjeevsky» is the print's spelling, and they stay in 0080 until `just rebuild-carnet 022`.
- Text added: «D'un Etat détruit / De l'ancien empire de Pologne / Un petit comte tel / Un agneau craintif / A genoux entre les arbres / Il demande l'amour à une jeune fille / Merjeevsky Mechlav / Gentil garçon / Docteur en droit / Wal[itsky] / Voilà le directeur de la redoute / Enflé de graisse».

### 5. Gates
`just splicescan _original CCC` printed nothing and `just verify-carnet _original CCC` returned PASS (0 fail, 0 warn) for 022, 033, 034, 039 and 051. `just check-comments _original` is OK.

## Translation impact

**cz**
- 051.0435: visible «Cogery» ×2 (line 90) → Gogery. Embedded French follows on sync.
- 022.0080: translate the 12 new verse lines plus «Wal[itsky]» as one `==…==[^022.0080.r2]` run before «Neoblečený, neumytý», and add the def `[^022.0080.r2]: Pozn. překl.: V originále rusky; do francouzštiny přeložil vydavatel.` Delete the TR note that says the 13 lines are not in the source. The multi-line embedded French comes in via `just sync 022 cz`; run sync-verify afterwards.
- 039.0252–0258: change the five defs to Ukrainian, e.g. `Pozn. překl.: V originále ukrajinsky (maloruštinou); do francouzštiny přeložil vydavatel.`
- 034.0081: footnote `[^34.81.1]` quotes «tcncô» → «tcncó».
- 033: no visible change. The cz text already reads uncle, Galula, Aglaé/Euphrosine and «neuškodí». Only the embedded French changes on sync.

**uk**
- 051.0435: the visible «Коджері» ×2 (line 86) needs re-transliterating, e.g. «Ґожері»/«Гожері» (TR's choice). The 2026 FAB/CON notes quoting «Cogery» can stay.
- 022.0080: translate the new run `==…==[^022.0080.r2]` and add the def `В оригіналі російською; французький переклад видавця.`
- 039.0252–0258: five defs → `В оригіналі українською (малоросійською); французький переклад видавця.` (wording is TR's choice).
- 034.0081: `[^34.06.2]` quotes «tcncô» → «tcncó».
- 033: no visible change.

**en**
- 051.0435: visible «Cogery» ×2 (line 84) → Gogery.
- 022.0080: translate the new run with r2, def `Written in Russian in the manuscript; French translation by the editor.`
- 039.0252–0258: five defs → `Written in Ukrainian (Little Russian) in the manuscript; French translation by the editor.`
- 034.0081: `[^6]` quotes *tcncô* → *tcncó*.
- 033: no visible change.

**fr**
- 051: the frontmatter entity list has `Cogery` (line 14) → Gogery. The letter has no visible fr text; it renders `_original`.
- 022.0080: the fr cluster has no visible text, so it renders `_original` and needs only the def `[^022.0080.r2]: En russe dans le manuscrit ; traduction française de l'éditeur.` plus sync.
- 039.0252–0258: five defs → `En ukrainien (petit-russien) dans le manuscrit ; traduction française de l'éditeur.`
- 034.0081: `[^034.0081.1]` quotes *tcncô* → *tcncó*. The FRE note of 2026-02-14 also quotes it and can stay as history.
- 033: 0310 and 0340–0368 have no visible fr text and render `_original`, so the l-forms appear automatically.

All trees: `just sync CCC LANG` carries the new embedded French for 022.0080 (a multi-line block), 033 (25 pids), 034.0081 and 051.0435. Sync does not overwrite footnote definitions that already exist, so the 039 and 034 defs have to be patched by hand.

## Open / flags
- 022.0080 now holds a multi-line verse block, so it is a split candidate for the next `just rebuild-carnet 022` (E-13 / C-33).
- The stale LAN notes (033.0340, 0355, 0356; 034.0081) were left in place. A LAN pass could retire them.

## Counts
- Paragraphs with changed text: 28 (051: 1; 033: 25 = 23 i→l + 2 OCR; 034: 1; 022: 1). 039 changed footnote definitions only (5).
- New RSR NOTEs: 29 (033: 25, 034: 1, 039: 1, 022: 1, plus 051 updated in place). Old notes rewritten: 6 (051 ×1, 033 ×4, 039 ×1).
- Footnote definitions: 5 rewritten (039), 1 corrected (034.0081.1), 1 added (022.0080.r2).
- Tag lines added: 1 (022.0080). Glossary entries: 0.
- Page images read: t.5 PDF 93, 95, 96, 113; t.4 PDF 59.
