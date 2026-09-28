# Carnet 070 rebuild (tome 10): review (2026-09-28)

Plan: `plan-070.json`. It ran together with the other tome-10 plans: `just rebuild-carnets plan-069.json plan-070.json plan-071.json plan-072.json plan-073.json plan-074.json --write`. Map: `../070-2026-09-28.json`; SQL for reader reports: `../069+070+071+072+073+074-2026-09-28.sql`.
Source: `content/_raw/tome10.docx` and the Tome 10 scan (Mon Journal, t.10), checked page by page where the notes say so.

## Summary

- **Paragraphs:** 930 after the rebuild, numbered 070.0001–070.0930.
  - 195 old paragraphs carried, 0 moved in from another carnet, 735 new, 4 dropped.
  - 194 IDs change.
- **Entries:** 23 (15 added, 0 removed).
- **set_french** on 54 old paragraphs.
- **Kinds:** letter×28, margin×1, rayé×1 (new: none; old: letter×28, margin×1, rayé×1).
- **Approval flags reset** per tree: cz 23, uk 23, en 23, fr 23.

## 1. Owner decisions applied (KRR, 2026-09-28)

These override anything the planner notes (§4) say to the contrary.

1. **No cover or title-page entries.** The 7 old title-page paragraphs (069.0650–0651, 070.0198–0199, 073.0037–0039) are dropped in their own carnets and no new cover text is added. Their text is kept below under «Withdrawn cover pages».
2. **Facsimiles shown as well as transcribed.** The printed programmes and the newspaper cutting are transcribed as kind `clipping` paragraphs, and their facsimiles are linked through `drawings:` in the entry frontmatter (captions in fr/cz/uk/en), anchored to the entry's last clipping paragraph.
3. **«Larderel».** Every «Larderei» in the French text of 069–074 (old and new paragraphs, headings) is set to «Larderel», the printed reading (the Larderel family of Livorno; «Larderei» is an OCR i/l slip). Other carnets, the glossary, entity names, comments and footnote definitions are untouched; the translations keep their wording, and each translated paragraph whose French changed gets the rebuild's «SOURCE CHANGED» ED note.
4. **Printed typesetting errors corrected** with an RSR note citing the page: «cettte», «priincesses», «acccompagné», «trliste», «diffférence», «réctifié». Marie's genuine spellings stay («sâle», «embarassée», «patisseries», «fânée»…).
5. **Drawings credited to Marie**, except printed p.109: its caption says «fait pour Marcuard» and that the authorship is uncertain.
6. **072.0094 + 072.0106 merged** (one sentence split by the page swap of printed pp.218–219). 0106 is dropped; its translation was carried into the merged paragraph by hand in cz, uk and en, with an ED note.
7. **072.0462** («Cette manière de parler ressemble à Alexandre…», foot of printed p.253) is kind `margin`.
8. **069.0285 / 069.0429** (day heading + «[N lignes cancellées]» in one cluster) stay without a kind, and the struck date «[Rayé: Lundi 21 mai 1877]» stays at the end of 20 May (071).
9. **Empty placeholder clusters** are kept where that lets an entry keep its translation approvals (`keep_empties.py`); the others are dropped.

## 2. Scripts (in this directory; run in this order)

1. `prereq_fix.py <root>` (before the run):
   - _original/070/1877-04-03.md: the legacy `[//]: # ( 10.8xx )` separators inside 070.0001 become blank lines;
   - fr/073/1877-07-24.md: the cluster labelled `%% 10.0126 %%` becomes 073.0126;
   - fr 069.0437, 069.0455, 069.0459, 070.0001: the multi-line `%%` block of embedded French becomes one `%% line %%` per line (the rebuild refuses `set_french` on a multi-line block).
   - Also, by hand: WALITSKY.md 071.1010 → 071.0241 (a citation that was already wrong).
2. `just rebuild-carnets plan-069.json … plan-074.json --write` (one multi-carnet run).
3. `post_apply.py <root> <date>`: translated heading labels; the «Samedi 11 août» heading moved in the translations; the 072.0094+0106 merge in cz/uk/en; RSR notes for typo corrections in old paragraphs; drawings and facsimiles (images + `drawings:` + captions); stale README ranges (071–073); fr/070 footnote markers without definitions.
4. `fix_fn_070.py <root>`: the footnote definitions left in 070.0001 by the 3 April split move to the clusters that now hold their markers.
5. `rsr_headings.py <root> <date>`: RSR notes for the heading labels changed through `set_french`.

Plan history: `owner_0928.py` applied the owner decisions to the plans (final2), `keep_empties.py` produced the final plans (final3 = the `plan-CCC.json` here).

## 3. Dropped paragraphs

- 070.0009: empty placeholder cluster marking where the extraction lost the rest of 4 April (restored as new paragraphs from docx ¶1168–1193); en held only an «[End of entry — no text in source]» note
- 070.0036: empty placeholder cluster marking where the extraction lost the rest of 7 April (restored as new paragraphs from docx ¶1551–1587); en held only an «[End of entry — no text in source]» note
- 070.0198: title-page (cover) text; withdrawn by owner decision 2026-09-28 until the manuscript is available (text kept in content/_renumber/CCC/REVIEW.md)
- 070.0199: title-page (cover) text; withdrawn by owner decision 2026-09-28 until the manuscript is available (text kept in content/_renumber/CCC/REVIEW.md)

## Drawings and facsimiles

Images in `src/frontend/public/images/marie/drawings/070/`, linked by `drawings:` in the entry frontmatter.

- `tome10-p0108-1.webp` (1877-04-10.md): Dessin de Marie : une jeune femme en robe à tournure salue un monsieur en haut-de-forme ; inscription manuscrite à droite — Mon Journal, t. 10, p. 108 (fac-similé)
- `tome10-p0108-2.webp` (1877-04-10.md): Dessin de Marie : croquis d'objets — une tête ronde, une lanterne ornée, une silhouette drapée — Mon Journal, t. 10, p. 108 (fac-similé)
- `tome10-p0109-1.webp` (1877-04-10.md): Dessin « fait pour Marcuard », auteur incertain : Marie à la balustrade des tribunes, messieurs en haut-de-forme et voitures ; en haut à droite, « Toujours trop tard ! » — Mon Journal, t. 10, p. 109 (fac-similé)
- `tome10-p0079-1.webp` (1877-04-05.md): Programme imprimé des courses de Naples au Campo di Marte, 5 avril 1877 (1re page) — Mon Journal, t. 10, p. 79 (fac-similé)
- `tome10-p0080-1.webp` (1877-04-05.md): Programme imprimé des courses de Naples au Campo di Marte, 5 avril 1877 (2e page) — Mon Journal, t. 10, p. 80 (fac-similé)
- `tome10-p0116-1.webp` (1877-04-15.md): Programme imprimé et jury des courses au trot de la Società Zoofila Napoletana, 15 avril 1877 (deux feuilles collées) — Mon Journal, t. 10, p. 116 (fac-similé)
- `tome10-p0117-1.webp` (1877-04-15.md): Programme imprimé des courses au trot, 15 avril 1877 : courses entre messieurs, course au chronomètre, juges et commission sanitaire — Mon Journal, t. 10, p. 117 (fac-similé)
- `tome10-p0139-1.webp` (1877-04-24.md): Coupure de journal collée dans le carnet : « Notizie artistiche », la comédie française à la Società Filarmonica — Mon Journal, t. 10, p. 139 (fac-similé)

## 4. Planner notes (2026-09-27, superseded where §1 says so)

### 070 final plan: notes (fork 070, 2026-09-27)

Built by `work-070/build.py` from `draft/plan-070.json` → `final/plan-070.json`. Post-apply items: `final/post-070.json`. Images: `final/images/tome10-p0109-1.webp` (drawing), `tome10-p0079-1`, `-p0080-1`, `-p0116-1`, `-p0139-1` (facsimile candidates).

#### Counts
- 931 paragraphs, 24 entries (cover + 3–25 April; 16 entries added: cover, 5, 6, 9–21 April).
- Old carried: 195 of 199 own IDs; moved in 2 (069.0650, 069.0651); moved out 2 (070.0198, 070.0199 → 071 cover); dropped 2 (070.0009, 070.0036).
- New: 734 (84 from the 3 April split, 8 clippings, 642 restored docx text incl. cover).
- set_french: 30 (070.0001 split, 069.0650 line break, 28 old letter paragraphs quoted).
- Kinds: cover 3 (2 old + 1 new); letter 36 (28 old + 8 new); clipping 8 (new); margin 6 (1 old + 5 new); rayé 2 (1 old + 1 new); editorial 1 (new).
- Translation flags reset in 23 of 24 entries per tree (cz uk en fr).

#### Dry run
`rebuild-carnet --multi final/plan-069.json final/plan-070.json work-070/plan-071.test.json` → exit 0, 0 ERROR.
`plan-071.test.json` = draft 071 with `{"old":"070.0198","kind":"cover"},{"old":"070.0199","kind":"cover"}` prepended to its cover entry — **the 071 plan must do this** (see Cross-carnet). Warnings, all expected:
- `_original 070.0001: set_french drops footnote marker(s) bijou, lazzarone, silene, horns, thule, faust, lustucru, swiss, faun`. The markers now sit in the new split paragraphs of the same file; the definitions stay at the end of 0001's cluster in the same file, so they still resolve. Cosmetic: the definitions sit after the first paragraph instead of at the end of the entry; move them after `--write` if wanted.
- «old embedded French not found — new copy inserted» in cz/uk/en/fr for 070.0001, 069.0650, and for the quoted letters 0086, 0153, 0195 (their embeds differ from _original). The translations of the whole 3 April entry stay inside new 070.0004 (old 0001); translators must re-segment them over the 84 new split paragraphs (en already marks sub-paragraphs with `(cont.)`).
- en footnotes of the dropped 0009/0036 are moved by the tool to the clusters that cite them (dante1, villareale, aquarium, poisson, …): nothing lost.

#### Cross-carnet
- In: 069.0650 («Dubium, illusio, Deceptio / Oppresio[^2]», `set_french` restores the printed line break) and 069.0651 («Gloriae Cupiditate») open the cover entry, kind cover, then new ¶1055–1056 (Livre 70ème / dates / Naples, Hôtel du Louvre). Printed p.71 (PDF 72) checked: the title page has exactly these lines.
- Out: 070.0198 («"Dubium, illusio, deceptio, oppressio"[^latin]», docx ¶2356) and 070.0199 («Gloriae Cupiditate», ¶2357) are the Livre 71 title page (they stand right before «Livre 71ème» ¶2358, same layout as p.71 for Livre 70). **071's plan must place them at the top of its cover entry with kind cover**, and 069+070+071 must run together.
- ¶1052 «Documents sur le pape Alexandre XI Borgia. [manque dans le manuscrit]» is on printed p.69 (PDF 70), last line of Livre 69 after «[Demi page blanche]» and «Maman vient me raconter…»; PDF 71 is blank. It belongs to 069 (the 069 fork keeps it as 069.0649). Agreed.

#### Decisions
- **3 April split.** 0001 `set_french` = «— Pas trop de Larderei n'est-ce pas ? dit en partant Doenhoff.» (heading stays). The other 84 blank-line blocks of the fixed _original file become new paragraphs, French as in _original (LAN-reviewed, footnote markers kept), each mapped to its docx ¶ (1059–1146; page-break joins 1064–65, 1076–77, 1099–1100, 1125–26 were already joined in _original). The Thulé verses (¶1082–1085) are one stanza paragraph. ¶1136 «[En travers : …]» → margin. OCR fixed in the split text (checked on the scan, printed pp.72–75): «Silène H II écoutait»→«Silène !! Il écoutait», «de vous II»→«!!», «l'aime II»→«!!», «effrayée I!»→«!!», «me le dire II!»→«!!!», «ivre II»/«ivre I!»→«ivre !!».
- **Dropped 070.0009 / 070.0036**: empty in _original, cz, uk, fr; en only has «[End of entry — paragraph N has no text in source]». They marked where the extraction lost the rest of 4 and 7 April (now restored from ¶1168–1193 and ¶1551–1587).
- **070.0061** («— Bien.», not found by the drafter because the docx line ¶1613 has no dash): correct place, kept.
- **8 April order**: docx ¶1589 «Je ne me serais pas levée…» (0037, with the heading) precedes ¶1590 «C'est notre jour de Pâques» (0038); the draft had them swapped. Fixed.
- **¶1463 «re...»** was a page-break tail already inside 070.0015 («tout à l'heure...»): removed.
- **Draft joins undone** (separate manuscript paragraphs): ¶1348/1349, 1352/1353, 1771/1772, 2033/2034, 2042/2043, 2091/2092. ¶2059–2060 kept joined but with a space (was a newline). ¶1978–2010 (draft glued ¶1978 to ¶2010 across the programme) → ¶1978+1979 joined («de pa-/raître», ¶1979 is diary text set as a caption), programme, then ¶2010 as its own paragraph.
- **Dates**: all 23 date lines match the plan. «Lundi 9 avril 1 977» → 1877 (OCR, note in rsr). «Samedi 16 avril 1877» is what the printed page reads (p.120, checked): 16 April 1877 was a Monday; the day number fits the sequence (Sunday 15 → Tuesday 17), so the file is 1877-04-16, heading kept as printed, RSR note on the first paragraph.
- **Heading label** (post file): 070.0037 «# Dimanche 8 avril 1877» → «# Dimanche 8 avril 1877 - Pâques» (docx ¶1588, as printed).
- **Kinds**: draft guesses removed as dialogue, not letters: ¶1571, 1694, 2172, 2191; ¶1573 clipping→margin; ¶2055 «[Fin de page blanche]» other→editorial; ¶1184 «[Une ligne rayée: illisible : un dîner assez gai.]» → rayé. Letters added — new: ¶1375–1376 aunt's letter (6 Apr), ¶1403 Marie's draft to Larderei, ¶1405 her billet «A neuf heures à l'Aquarium…», ¶2128–2131 aunt's letter translated by Marie (19 Apr); old (quoted with `> ` via set_french): 0076 billet 22 Apr; 0086–0102 letter copied by Dina 22 Apr; 0153–0154 first reply 23 Apr; 0156–0159 second letter 23 Apr; 0164 unsent billet 23 Apr; 0195–0197 letter to her aunt 25 Apr. 0149 «Et dites-moi si je suis bonne à autre chose qu'à être tuée !» is Marie's own cry, not Larderei's billet (which is not copied): no kind. 0072–0073 (Dante sonnet written by Santasiglia) and the Dante tercets stay plain text. ¶1823 «Ce mouchoir est attaché… [Manque dans le manuscrit]» mixes Marie's sentence and an editors' note: inline, no kind.
- **Labels**: scripted check — every bracketed note in docx ¶1053–2355 is present in the plan's French (new text or _original).

#### Printed items (kind clipping, transcribed from the scan; italics not marked)
1. 5 April, after ¶1199: «Corse in Napoli al Campo di Marte, 5 Aprile 1877», printed pp.79–80 — 5 paragraphs (header + 1st race; 2nd race, heats; 3rd race; Seconda Prova N.B.; Gentlemen-Riders cup), each race card row as «horse, description — owner — colours». docx ¶1200–1334 (caption OCR garbage, picture slots) not used.
2. 15 April, after ¶1978–1979: two sheets pasted sideways on printed p.116 — «Corse di cavalli al trotto… Domenica 15 Aprile 1877» (batterie, Corsa internazionale) and «Giurì delle corse a trotto a cronometro» (officers and judges). The handwritten «124» on the sheets is omitted.
3. 24 April, after 070.0172 (¶2328, where it is pasted): newspaper cutting «Notizie artistiche» on the French comedy *Le Gant et l'éventail* at the Società Filarmonica (the play Marie attends that evening). Paper not identifiable; masthead line illegible. Column hyphenation removed (one paragraph).

#### Drawing
Printed p.109 (PDF 110), 10 April, docx ¶1852/1879 picture slots, after ¶1850 «Comment veut-on que les femmes soient vertueuses !!!»: pen caricature — young woman (Marie) from behind at the grandstand rail, gentlemen in top hats, carriages, top right a little man running under «Toujours trop tard !», bottom left **«fait pour Marcuard.»** — "made FOR Marcuard", so Marie's drawing (cf. ¶1340 «Marcuard prend mes caricatures»), not by him; the attribution is an inference. Cut 600 dpi → 1600×803, 83 KB.

#### OCR
Corrected (scan checked): ¶1363 «sàie»→«sâle», «! G'ai ôté»→«! (j'ai ôté»; ¶2163 «0 le sàie»→«O le sâle»; ¶2112 «lère»→«1ère»; ¶1928, ¶1937 «II»→«!!»; hyphenation/line-break joins ¶1371 1376 1736 1848 1934 1944 1946 2025 2203 2212 2214. Printed-edition typos kept as printed (the scan has them): «cettte» ¶1569, «voulir» ¶1687, «reprimé» ¶1716, «Démollissez» ¶1893, «fânée» ¶1924, «priincesses» ¶1973, «acccompagné» ¶2106, «concuru» ¶2145, «aquel» ¶2149, «trliste» ¶2170, «Piccollelis» ¶2183 / «Picolellis» ¶1849, «embarassée» ¶2205, «patisseries» ¶1777, «sâle» (Marie's spelling). Uncertain (small print): race-card names «King-of-my-Stud», «Freck», «Plea», «Craintive»; trot sheet «Pouaquet», «Mattei», «Rossi Giuseppe di Crespano», «Castracane Rodolfo»; cutting «Suvage» (as printed; the co-author is Sauvage), «Castania», «Jeri».

#### Owner questions
1. Printed typos in the edition itself («cettte», «priincesses», «acccompagné», «trliste»…): keep as printed (current) or correct silently?
2. Facsimiles of the race cards (pp.79–80, 116) and the cutting (p.139): link them on the page (post file lists them) or is the transcription enough?
3. Drawing p.109: caption says «Caricature de Marie « fait pour Marcuard »» — OK to attribute to Marie?
4. 070.0001's footnote definitions stay mid-file after the split (still valid): move them to the end of the entry after the run?

#### Revision 2 (2026-09-28, planner follow-up)
- Printed p.108 (PDF 109, docx ¶1852 slot): two more drawings, cut to `tome10-p0108-1.webp` (young woman greeting a man in top hat; handwritten inscription «La Majesté / vain… / par la Gr…»? — uncertain, likely the King episode of 6 April) and `-2.webp` (sketches: round head, lantern, draped figure). Added to post-070 `drawings` before the p.109 drawing, all `after_docx: 1850`.
- Printed p.117 (PDF 118, docx ¶1982 slot): the other two sheets of the 15 April programme were not covered. Added clipping sheets 3 («Corsa di gara al trotto fra signori», «Corsa al trotto a cronometro», «Corsa di gara») and 4 («Giudici del campo», supplenti, questori, commissione sanitaria, «Napoli 14 Aprile 1877», printer's line). Now 4 trot paragraphs; facsimile `tome10-p0117-1.webp`. Totals: 933 paragraphs, 736 new, clipping 10.
- The worktree wt-t10 has since been --written by the lead; `build.py` now reads the prerequisite-fixed tree exported from commit 56d958665 to `work-070/tree/` (git archive, no repo mutation), and dry runs run there.
- Dry run `--multi final3/plan-069.json final/plan-070.json final3/plan-071.json` (in work-070/tree): exit 0, 0 ERROR; 070 = 933 paragraphs.


## 5. Gate results

```
== renumber-check 070
  [WARN] en/070: embedded French differs from _original in 1 paragraph(s): 070.0196 (resync with just resync-french en 070)
  [WARN] fr/070: embedded French differs from _original in 1 paragraph(s): 070.0196 (resync with just resync-french fr 070)
  [WARN] content/uk/TranslationMemory.md:2106: reference to a dropped paragraph (070.DROPPED-…)
  [WARN] content/uk/TranslationMemory.md:2112: reference to a dropped paragraph (070.DROPPED-…)
  [WARN] content/fr/_non_french_passages.md:1332: reference to a dropped paragraph (070.DROPPED-…)
  [WARN] content/fr/_translate_manifest.json:12063: reference to a dropped paragraph (070.DROPPED-…)
  [WARN] content/en/070/README.md:7: reference to a dropped paragraph (070.DROPPED-…)
RESULT: PASS (0 fail, 7 warn)
GATE _original 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
check-comments: OK (_original)
check-comments: OK (cz)
check-comments: OK (uk)
check-comments: OK (en)
check-comments: OK (fr)
```

## Withdrawn cover pages (for when the manuscript is available)

Owner decision KRR 2026-09-28: no cover entries or cover paragraphs until the manuscript is scanned. Texts as printed:

- old 069.0650:

  > Dubium, illusio, Deceptio
  > Oppresio[^2]

- old 069.0651:

  > Gloriae Cupiditate

- Restored from tome10.docx ¶1055–1056, Mon Journal t.10 p.71::

  > Livre 70ème
  > Depuis le mardi 3 avril 1877
  > jusqu'au mercredi 25 avril 1877
  > Naples, Hôtel du Louvre

### New layout (23 entries)

| New file | Heading | carried | moved in | new | set_french | kinds |
|---|---|---|---|---|---|---|
| 1877-04-03.md | Mardi 3 avril 1877 | 1 | 0 | 81 | 1 |  |
| 1877-04-04.md | Mercredi 4 avril 1877 | 7 | 0 | 26 | 3 |  |
| 1877-04-05.md | Jeudi 5 avril 1877 | 0 | 0 | 16 |  |  |
| 1877-04-06.md | Vendredi 6 avril 1877 | 0 | 0 | 63 |  |  |
| 1877-04-07.md | Samedi 7 avril 1877 | 26 | 0 | 37 | 9 |  |
| 1877-04-08.md | Dimanche 8 avril 1877 - Pâques | 35 | 0 | 0 | 5 | margin×1, rayé×1 |
| 1877-04-09.md | Lundi 9 avril 1877 | 0 | 0 | 166 |  |  |
| 1877-04-10.md | Mardi 10 avril 1877 | 0 | 0 | 62 |  |  |
| 1877-04-11.md | Mercredi 11 avril 1877 | 0 | 0 | 10 |  |  |
| 1877-04-12.md | Jeudi 12 avril 1877 | 0 | 0 | 11 |  |  |
| 1877-04-13.md | Vendredi 13 avril 1877 | 0 | 0 | 37 |  |  |
| 1877-04-14.md | Samedi 14 avril 1877 | 0 | 0 | 20 |  |  |
| 1877-04-15.md | Dimanche 15 avril 1877 | 0 | 0 | 45 |  |  |
| 1877-04-16.md | Samedi 16 avril 1877 | 0 | 0 | 16 |  |  |
| 1877-04-17.md | Mardi 17 avril 1877 | 0 | 0 | 15 |  |  |
| 1877-04-18.md | Mercredi 18 avril 1877 | 0 | 0 | 41 |  |  |
| 1877-04-19.md | Jeudi 19 avril 1877 | 0 | 0 | 13 |  |  |
| 1877-04-20.md | Vendredi 20 avril 1877 | 0 | 0 | 25 |  |  |
| 1877-04-21.md | Samedi 21 avril 1877 | 0 | 0 | 49 |  |  |
| 1877-04-22.md | Dimanche 22 avril 1877 | 34 | 0 | 0 | 21 | letter×18 |
| 1877-04-23.md | Lundi 23 avril 1877 | 60 | 0 | 1 | 9 | letter×7 |
| 1877-04-24.md | Mardi 24 avril 1877 | 22 | 0 | 1 | 2 |  |
| 1877-04-25.md | Mercredi 25 avril 1877 | 10 | 0 | 0 | 4 | letter×3 |
