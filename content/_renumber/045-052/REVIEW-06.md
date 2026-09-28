# Tome 06 rebuild plans: review (045–052, 2026-09-28)

Plans: `final/plan-045.json` … `final/plan-052.json`. They are built by `fix06.py` from the drafts in `draft06/` (`just rebuild-draft-plan 045 … 052`, run at HEAD 86af8817e; a re-draft at ba398e4b7 gives the same plans). Every correction is scripted; the log is `final/fix06.log`.
Source: `content/_raw/tome06.docx`, ¶35–5287. Scan: `content/_raw/scans/Tome6.pdf`.
**Page offset:** the printed page equals the PDF page, or PDF − 1 (pp. 35–99). The tool's page map handles it; checked visually on pp. 35, 98–99, 265–269 and 291.
**Run:** the eight plans go in one multi-carnet run, `just rebuild-carnets final/plan-045.json … final/plan-052.json`, because 151 paragraphs move from 048 to 049.

## Summary

| Carnet | Entries | Carried | Moved in | Moved out | New | Dropped | set_french | Kinds set by the plan |
|---|---|---|---|---|---|---|---|---|
| 045 | 7 | 353 | 0 | 0 | 5 | 0 | 0 | editorial 2 new; margin 1, rayé 1 old |
| 046 | 10 | 313 | 0 | 0 | 0 | 0 | 0 | rayé 4, margin 1 old (no renumbering) |
| 047 | 11 | 440 | 0 | 0 | 14 | 0 | 0 | margin 4, rayé 1 old (editorial 0130 already marked) |
| 048 | 14 | 622 | 0 | 151 | 29 | 2 | 2 | editorial 1 new; rayé 4, margin 1 old |
| 049 | 12 | 372 | 151 | 0 | 0 | 2 | 2 | margin 4, rayé 3, editorial 1 old |
| 050 | 38 | 1075 | 0 | 0 | 270 | 8 | 1 | margin 2, rayé 2, editorial 1 new; margin 6, rayé 4, editorial 1 old |
| 051 | 15 | 402 | 0 | 0 | 69 | 0 | 0 | margin 6 old |
| 052 | 14 | 402 | 0 | 0 | 3 | 0 | 0 | editorial 1, other 1 new; rayé 3, margin 3 old |

Totals from `final/dry06.out`. New carnet sizes: 045 358, 046 313, 047 454, 048 651, 049 523, 050 1345, 051 471, 052 405.

**Letters are left untouched.** Commit 0bde10221 (kind-marker, tome 6) already marked 45 letter paragraphs in 050–052 with sources. The plans set no kind on them. The draft's own letter guesses were all dialogue lines («— Ma chère…», «— Mademoiselle, …», «Mon cher Emile, …» said aloud) and are removed: 046.0023 0065, 047.0012 0349, 048.0033 0134 0214, 049.0176 0245, 050.0995, 051.0169, new ¶3657. The draft's «clipping» candidates from indentation (050.0393/0395 are stanzas of the Cassandre poem; the others are the already-marked letters) are not set.

## 1. Cross-carnet moves

| Move | Verdict | Why |
|---|---|---|
| 048.0625–0775 → 049 | **accepted** | Livre 48 runs «jusqu'au samedi 6 novembre», Livre 49 «depuis le samedi 6 novembre» (¶2234). After the Livre 49 title page the text goes on under «Samedi 6 novembre 1875 (suite)» (¶2235 = 048.0625) and «Samedi 7 novembe 1875» (¶2255 = 048.0644). New entries 049/1875-11-06.md (0625–0643) and 049/1875-11-07.md (0644–0775, the whole old 048/1875-11-07.md). The draft left 0625 behind; it moves too. |
| 046.0106 0116 0117 0249 → 050, 050.0367 0380 → 046 | **rejected** | Marie copied the «Prédiction de Cassandre» twice: 26 stanzas on 6 Oct (046) and an enlarged 38-stanza version on 2 Dec (050). Both copies are complete in `_original`; the draft matched stanzas across the two. 046.0249 («C'est là que je voudrais vivre / Aimer, aimer et mourir.») is 10 Oct; the same lines end Mignon's song on 21 Nov (see 050). Both 1875-10-06 files keep their old paragraph lists; the draft's 20 «new» stanza fragments are removed. |
| 050.0002 → 049 | **rejected; dropped** | «Paris 1875, Hôtel Splendid» is a Livre 50 title-page line (see §3). |

## 2. Per-carnet decisions

### 045
- «[Bas de page enlevé]» (¶252, 28 Sep) and «[Plusieurs pages non numérotées qui semblent être des brouillons]» (¶550, 2 Oct) are `editorial`.
- The draft song after it (printed p.35) is re-set as verse, two paragraphs: ¶551–555 (to «Bis») and ¶556–558 (to «Ecoute ma bête etc.»); ¶559–562 stays as drafted.
- Removed draft paragraphs: ¶302–303 (= 045.0163 last line and 045.0164) and ¶389 (a page-break fragment of 045.0246).

### 046
- No text change and no renumbering. Only kind markers: rayé on 0037 0114 0212 0218, margin on 0168. (0126 opens with the stanza number «25» before «[Rayé: …», so it gets no kind; its bracket is unclosed in the print too.)

### 047
- 22 Oct: ¶1460–1474 (14 paragraphs, 1,596 chars) restored after 047.0400.
- The villa plans «[Plans p. 98-99]» (047.0130, already `editorial`) are Marie's drawings: see Drawings.

### 048
- **048.0020 and 048.0021 are dropped, 048.0022 re-set (`set_french`).** Their French («Et puis c'est tout. A peine quelques mots échangés … ils allaient entendre Marie Ambre, je crois, chez des Russes. Imbéciles.», «Nous rentrons à sept heures et demie.», and «On se met au piano, Marie accompagne avec Olga. Je me mets à faire mon Orphée et mon Eurydice…») is not in the printed integral edition (not in the docx, not in the scan's text layer), nor in the 1887 edition. It has been in `_original` since the first import (a481bfc53). The printed text at that place, ¶1576–1597 (22 paragraphs: Audiffret and the photograph, the evening in boys' clothes), is restored, and 0022 becomes ¶1598+¶1599 («Après le chant vient la danse, sans musique… avec sa face brune et barbue !»). **Owner question 1.**
- **31 Oct** gets its own entry 1875-10-31.md (048.0247 heading «Dimanche 31 octobre 1875» … 0347). The docx date line reads «Dimanche 21 octobre 1875» (¶1830, a slip); the draft had made a 21 Oct entry at the head of the carnet. The heading is left as `_original` has it.
- 1 Nov: 048.0404 «[Quatre lignes cancellées]» becomes, as printed, «[Quatre lignes cancellées: Voyons, quoi ? lui dis-je. / Vous savez bie, ce que je vous dema / Je sais bien ce ]» (`set_french`; the struck words are cut off in the print).
- 4 Nov: ¶2115–2120 restored; ¶2121 «Sur l'original de la BNF [FNA 12 331] les pages correspondantes (p. 237 et suivantes) manquent.» is `editorial`. Old order kept (the draft moved 0499 on a short match).
- 048.0116 «[Annotation: 23 novembre 1875, Paris. Oh ! Ho !]» → margin (a later annotation by Marie).
- Removed draft paragraphs: the Livre 49 title-page lines ¶2231–2232 (withdrawn), ¶1993–1994 (part of 0404).

### 049
- 1875-11-06 (moved from 048): 048.0625 `set_french` «# Samedi, 6 novembre 1875 (suite)» (was «## (suite)»). Frontmatter from 049/1875-11-08.md.
- 1875-11-07 (moved whole from 048): 048.0644 `set_french` «# Samedi, 7 novembre 1875», as the manuscript date line ¶2255 («Samedi 7 novembe 1875»; the 7th was a Sunday). The heading-date sweep of 2026-09-26 had changed it to «Samedi, 6 novembre 1875 (suite)» on the reading that the content is still the 6th; with the real «(suite)» at ¶2235 two entries earlier that reading does not hold. **Owner question 3.** The `set_french` resets that entry's flags in all trees.
- **Headings.** `_original` 049 had invented headings one paragraph or one half-day off. The manuscript date lines decide: 049.0025 (Mardi 9) follows the margin note 0026; 049.0070 «Jeudi 11» moves from mid-10 Nov to ¶2489 and the stray «## (suite)» 049.0097 there is **dropped**; 049.0194 «Samedi 13» moves to ¶2610 and the stray «(suite)» 049.0213 is **dropped**; 049.0277 «Je suis furieuse.» ends 14 Nov, before 049.0276 «Lundi 15».
- 049.0358 «[Annotation: 1881. …]» → margin. 048.0734 «[Bas de la page enlevée]» → editorial.

### 050
- **Title page:** 050.0002–0008 dropped (withdrawn, §3). 050.0009 «[Dans la marge: Cahier que les lecteurs feront bien de passer. Il ne contient que des réflexions sur Audiffret.]» is Marie's note on that page: kept as `margin`, after the heading 0001. **Owner question 2.**
- **21 Nov:** 050.0098 «[Pas d'entrée pour cette date]» is a false placeholder: **dropped**; the day's text ¶2879–2907 is restored (28 paragraphs). Mignon's song (¶2895–2898) is one verse paragraph.
- **2 Dec:** the enlarged Cassandre poem 0360–0408 stays as it is (see §1). 0383 gets the struck line printed at ¶3246: `set_french` «23 Son ouvrage admirera / Dans sa loge se pavanera / [Rayé: Au deuxième acte se couchera] / Sur son siege s'endormira / Et pourrira et pourrira.»
- Restored text (270 paragraphs in all): 11 Dec ¶3537–3554, 12 Dec ¶3584–3589, 14 Dec ¶3631–3667, 15 Dec ¶3678–3692, 16 Dec ¶3725–3784, 18 Dec ¶3820–3850, 19 Dec ¶3875–3944, 21 Dec ¶4008–4014, 25 Dec ¶4246–4252, and smaller gaps. 30 Nov «[Rayé: départ fichue fille.]» (¶3123) and 14 Dec «[Deux mots cancellés]» (¶3650) are `rayé`; «[Demi-page enlevée]» (¶3548) is `editorial`. Marie's repetition on 11 Dec («Fiouloulou … Ah ! mais j'ai déjà dit cela») is kept.
- 19 Dec: 050.0801 «MON DIEU, SECOUREZ-MOI !…» follows the new ¶3944 «JE SUIS MALHEUREUSE ! et puis en des lettres plus grosses encore:», as printed.
- Removed draft paragraphs that repeat old text hidden by markup or missing accents: ¶3181–3288 (Cassandre), ¶3501 (= 0605), ¶3797 (= end of 0758), ¶3945 (= 0801), ¶4095 and ¶4118 (= 0937, 0959).
- 050.0152 «[Dans la marge: Marie fait la multiplication 365 x 15 ]» → `editorial` (the editors describe the margin; not Marie's words).
- **End of Livre 50 (pp.265–269), not carried:** «[Sur la page de garde:] [Deux lignes illisibles: [Rayé : Emile d'Audiffret / Marie Bashkirseff / Felix Galula Dechiar / Marie Bachkirseff]» (¶4253–4258, flyleaf: withdrawn with the covers, §3); the facsimile on p.267, captioned «Extrait d'une lettre de Marie Bashkirtseff» (¶4259–4268, 4271; OCR garbage of a block-capital letter «Ô fils du péché, enfant égaré, païen !…»): an editors' illustration from a letter, not a notebook page. **Owner question 5.**

### 051
- 30 Dec: ¶4440–4509 restored (68 paragraphs, the «Je pars dimanche à trois heures» quarrel and the night prayer). 051.0238 goes back to 3 Jan (the draft had matched it to one of the five «Je pars dimanche à trois heures !» lines; those five lines are all new paragraphs now).
- 1 Jan: ¶4609–4611 are a smudged patch of the scan over 0227–0228 (checked on p.291): not new text.
- **2 Jan** is a date line with no text (¶4619): entry 1876-01-02.md = 051.0236 + «[Aucun texte - date seule mentionnée]»; the old range file 1876-01-02-03.md redirects there. 3 Jan = 0237–0279 + ¶4666–4668.
- Removed draft paragraphs: ¶4292, ¶4318 (= 0016, 0038, hidden by `#####`), ¶4621 (= 0238), the title-page line ¶4818.

### 052
- The draft's «1875-01-11» entry (from the printed date line «Mardi 11 janvier 1875», ¶4889) is 1876-01-11.md again, 052.0061–0092; ¶4890 «+» is 052.0062.
- 052.0034 and 052.0041 are the same sentence, written twice by Marie (¶4859, ¶4867): old order kept.
- **Flyleaf note of Livre 52** (printed p.268, at the end of Livre 50): «[Ecrit au verso de la page de garde du Livre 52]» (`editorial`) and «Il y a entre certaines lamentations de Nice et de Rome une différence radicale…» (`other`, source «Écrit au verso de la page de garde du Livre 52») are placed at the head of 1876-01-10, after the heading. **Owner question 4.**
- 23 Jan: «- costumes: Florentin, Moyen Age, Henri II, Merveilleuse.» (¶5287) after 052.0402, which ends with the upside-down note at the foot of the page.

## 3. Withdrawn cover pages (for when the manuscript is available)

Owner decision KRR 2026-09-28: no cover entries or title-page paragraphs until the manuscript is scanned. Texts as printed (Mon Journal t.6):

- Livre 45, p.5 (¶34–37): «H[is] G[race] t[he] D[uke] o[f] H[amilton] / Livre 45ème / depuis le samedi 26 septembre 1875 / jusqu'au samedi 2 octobre 1875 / Nice, promenade des Anglais, en ma villa»
- Livre 46, p.37 (¶563–567): «Gloriae cupiditate / H[is] G[race] t[he] D[uke] o[f] H[amilton] / Livre 46ème / depuis le dimanche 3 octobre 1875 / jusqu'au mardi 12 octobre 1875 / Nice, promenade des Anglais, 55 bis / dans ma villa»
- Livre 47 (¶1036–1039): «Gloriae Cupiditate / H[is] G[race] t[he] D[uke] o[f] H[amilton] / Livre 47ème / depuis le mercredi 13 octobre 1875 / jusqu'au samedi 23 octobre 1875 / Nice, promenade des Anglais, 55 bis, en ma villa»
- Livre 48, p.101 (¶1543–1554): «Volo omnia / Gloriae Cupiditate habeos / H[is] G[race] t[he] D[uke] o[f] H[amilton] / Livre 48ème / depuis le dimanche 24 octobre 1875 / jusqu'au samedi 6 novembre 1875 / Nice, promenade des Anglais, 55 bis, en ma villa / [Coin de page manquant ?] / Sais tout, / fais tout, / [?] décide tout / [?] tout / [?] tout... / [?] te»
- Livre 49 (¶2231–2234): «Volo omnia gloriae cupiditate / solum modo habeo ! / H[is] G[race] t[he] D[uke] o[f] H[amilton] / Livre 49ème / depuis le samedi 6 novembre 1875 / jusqu'au mercredi 17 novembre 1875 / Nice, promenade des Anglais, 55 bis, en ma villa.»
- Livre 50 (¶2779–2785; old 050.0002–0008 dropped): «Paris 1875, Hôtel Splendid / H[is] G[race] t[he] D[uke] o[f] Hamilton] / Livre 50ème / depuis le jeudi 18 novembre 1875 / jusqu'au 25 décembre 1875 / Paris, Hôtel Splendid, 104 / depuis le 28 novembre à Nice / promenade des Anglais 55 bis, en ma villa / T.P.L. / Alex. Dumas». Kept: Marie's margin note 050.0009.
- Livre 50, back flyleaf, p.265 (¶4253–4258): «[Sur la page de garde:] / [Deux lignes illisibles: / [Rayé : Emile d'Audiffret / Marie Bashkirseff / Felix Galula Dechiar / Marie Bachkirseff]»
- Livre 51, p.269 (¶4272–4275): «H[is] G[race] t[he] D[uke] o[f] H[amilton] / Livre 51ème / depuis le dimanche 26 décembre 1875 / jusqu'au dimanche 8 janvier 1876 / Nice, promenade des Anglais 55 bis, en ma villa / Depuis le lundi 3 janvier 1876 à Rome, / hôtel de Londres, place d'Espagne.»
- Livre 52 (¶4818–4823): «H[is] G[race] t[he] D[uke] o[f] Hamilton] / Gloriae Cupiditate / Livre 52ème / depuis le lundi 10 janvier 1876 / jusqu'au lundi 23 janvier 1876 / Rome, Hôtel de Londres, place d'Espagne / [Rayé: Notre frère, Il nous est permis de voir une]»

## 4. OCR fixes in new text

- «! ..» → «!..» (¶1583); «ma fille I]» → «ma fille !]» (¶2891); «quei charmant» → «quel charmant» (¶4461); «endrois» → «endroits» (¶4482); «mal II me pardonnera» → «mal Il me pardonnera» (¶4506); «mon-daine» → «mondaine» (¶3543).
- Line-break hyphens rejoined: «t-elle», «Mettez-vous», «êtes-vous», «Donnez-moi», «peut-être» (¶3661 3682 3744 3891 3938).
- Kept as printed: «Hélas que je puis-je te suivre» (¶2897), «bie, … dema» (struck, cut off).
- **Typesetting typos of the printed edition corrected** (owner policy KRR 2026-09-28; `fix_typos.py`, log `final/fix_typos.log`; each with an RSR note citing the page): «famile» → «famille» (¶3757), «connaisait» → «connaissait» (¶3879), and in the old paragraph 048.0022 (`set_french`) «essouflé» → «essoufflé». Candidates checked and left because they are real words or Marie's own forms (`typos.txt`): liguât, bougeai, achevai, ravisai, embourbée, bâtonné, damnations, segreto and the Italian of ¶4484.

## 5. Known issues not fixed by this rebuild

- **Accent-stripped `_original`:** every paragraph of 050 from 2 Dec, and all of 051 and 052 (about 1,000 paragraphs), lacks accents («Prediction de Cassandre a M. Leon d'Audiffret»). The new paragraphs have accents, so these carnets now mix both. Restoring the accents is a separate `set_french` pass (it would add SOURCE CHANGED notes everywhere). **Owner question 6.**
- New paragraphs have no glossary tags: run glossary-tagger on 045, 047, 048, 050, 051, 052.
- en/050 stanza numbers of the Cassandre poem (fixed recently) are untouched: the poem's paragraphs keep their text.

## 6. Owner questions

1. **048.0020–0022:** drop the unprinted text and use the printed ¶1576–1599 (as planned), or keep the old paragraphs alongside?
2. **Title-page notes in Marie's voice** kept as `margin` (050.0009 «Cahier que les lecteurs feront bien de passer…»), the rest of each title page withdrawn. Right?
3. **049 «Samedi 7 novembre»:** restore the manuscript date line (planned), or keep the sweep's «6 novembre (suite)»?
4. **Livre 52 flyleaf note:** at the head of 052 (planned), or where the print sets it (end of Livre 50)?
5. **p.267 facsimile** of a block-capital letter: leave out (planned) or add as a drawing/illustration?
6. **Accent restoration** of 050 (2 Dec on), 051 and 052 as a follow-up task?

## Drawings

| Carnet / entry | Anchor | File | Source |
|---|---|---|---|
| 047 / 1875-10-17.md | 047.0130 «[Plans p. 98-99]» | `tome06-p0098-1.webp` (92 KB, 1292×1600; printed upside down, turned 180°) | Mon Journal, t. 6, p. 98 |
| 047 / 1875-10-17.md | 047.0130 | `tome06-p0099-1.webp` (72 KB, 967×1600) | Mon Journal, t. 6, p. 99 |

Marie's two plans of the villa on the promenade des Anglais (promenade at the top, rue de France at the bottom, the house and the garden beds), drawn for «par ce plan mieux qu'autrement on comprendra» (047.0129). Captions and alt text in `final/drawings-06.json`. No other drawing in Livres 45–52: the other figure candidates are the p.267 facsimile (§2, 050) and front/back matter.

## 7. Validation (throwaway worktree at ba398e4b7, both tomes)

Order: `rebuild-carnets 045…052 --write` (543 file operations), `rebuild-carnets 053…059 --write` (556), then the post-fixes below, then `apply_drawings.py`.

Post-fixes (scripted, mechanical, in `plan-tome0607/`):
- `postfix_footnotes.py content/en/056/1876-03-27.md content/en/057/1876-04-09.md`: the 055→056 and 056→057 moves copied a trailing footnote block into the target; 12 orphan/duplicate definitions and one orphan `[^day]` are deleted (verify-carnet en 056/057 failed without it).
- `postfix_headings.py`: **tool bug** — `set_french` on a cluster whose French is a date heading keeps the old heading and adds the new one (`applySetFrench` replaces text lines only). Affects 048.0625/0644 (→049.0001/0020), 053.0235 (→053.0236), 058.0053 (→058.0077). The script removes the stale heading in `_original` and the stale or duplicate embedded heading in the trees.
- `postfix_ed.py`: the tool's flag-reset ED comment in 049/1875-11-07.md (4 trees) names the pseudo-file «048/1875-11-07.md», which renumber-check reads as a link to a removed entry; reworded to «carnet 048, file 1875-11-07.md».

Gates:
- `verify-carnet` PASS (0 fail, 0 warn) and `splicescan` empty for all 15 carnets × 5 trees.
- `renumber-check`: PASS for 051 052 056 057 058 059. The remaining FAILs are not caused by the rebuild: (a) date citations of the form «045.1875-09-28» read as IDs (GIOIA.md, GEORGES.md, uk/048/1875-11-01.md, 036/1875-07-09.md in _original and fr: 045 047 048 049 050 053 055); (b) stale IDs that already fail on main at HEAD (046: 23, 047: 5 plus the 5 date citations, 054: 3 — identical counts on main; e.g. «046.0411» in _original/046 RSR comments, glossary citations beyond the carnet).
- `source-completeness 045…059`: 0 missing diary text. The unmatched tome paragraphs are the withdrawn title pages and flyleaf, the p.267 facsimile, page numbers, OCR forms corrected in the plan (¶1837, ¶2650), smudged scan lines (¶4608–4611) and page-break fragments. 059 went from 47,970 missing chars to none.
