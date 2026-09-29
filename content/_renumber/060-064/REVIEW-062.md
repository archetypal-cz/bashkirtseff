# REVIEW 062 (Livre 62, 29 May – 3 July 1876): final plan

Built by `tools/fix_062.py` (common/plan-062.json → final/plan-062.json, re-runnable).
Dry run: `just rebuild-carnet 062 …/final/plan-062.json` **accepted, rc 0**. The only warnings are footnote-label collisions and the 13 expected «set_french changes/removes its heading» notices.
Helper checks: `tools/align062.py` (every carried paragraph's first and last 6 words sit under the right docx date line: 714/714 OK) and `tools/cover062.py` (every docx ¶1355–2792 is covered by a new paragraph or old text; the 6 it reports are only OCR/italic spelling differences in text that is already present).

## Summary

| | common | final |
|---|---|---|
| entries | 35 | 35 (1876-06-18.md renamed back to **1876-06-18-19.md**) |
| old placed | 725 | 721 |
| new | 149 | 155 |
| dropped | 11 | 15 |
| set_french | 1 | 22 (each has `_rsr`) |
| kinds | editorial 10, margin 13, rayé 2, letter 4, clipping 2, other 1 | editorial 14, margin 25, rayé 2, letter 1, clipping 13 |

## Withdrawn cover pages

- **Livre 62 title page**, tome08.docx ¶1348–1354, Mon Journal t.8 p.117 (already withdrawn by common08, `common/withdrawn-062.json`):
  ¶1348 «Gloriae cupiditate / H[is] G[race] t[he] D[uke] off] Hfamilton]» (its old counterpart is 061.0216, which belongs to the 061 plan) ·
  ¶1349 «Livre 62'» · ¶1350 «Depuis le lundi 29 mai 1876 / jusqu'au lundi 3 juillet 1876» · ¶1351 «Nice» ·
  ¶1352–1353 «Quanti cen' è che misentan cantare / Diran : buon per colei ch'à il cor contento.» · ¶1354 «[six lignes cancellées]».
  No old 062 paragraph holds any of it: the drafter's «¶1351 Nice looked like 062.0004» was a false fuzzy match (062.0004 is diary text).
  No note by Marie on this title page.
- **062.0736** «Gloriae cupiditate[^6]» (end of 1876-07-03.md) = tome08.docx ¶2793, first line of the **Livre 63** title page (Mon Journal t.8 p.249, checked on the scan) → dropped as title-page text (its LAN note and footnote go with it; the 07-03 entry-level RSR note stays with the entry). The rest of that title page (¶2794–2798) is in common/withdrawn-063.json.

## Drops (added to the drafter's 11 empty RSR-summary clusters)

- 062.0633 «[La suite est l'article du Figaro sur le Cardinal Antonelli, transcrit en détail dans le journal]» → placeholder replaced by the restored clipping.
- 062.0736 → title-page text withdrawn (above).
- 062.0351 → empty cluster holding only the RSR entry summary for 15 June (like the drafter's 11); en showed a visible «[RSR note: no French text…]» stub, which goes too.
- 062.0419 «---» → extraction artefact where the date line «Dimanche 18 juin 1876 - lundi 19 juin 1876» (¶2076) stands.

## Splits / moves / headings

- **Day moves by the drafter are right.** All clusters the draft moves to another day (0025–0035 to 30 May; 0264–0273 to 6 June; 0286 to 7 June; 0402–0418 to 17 June; 0509–0515 to 21 June; 0553–0563 to 23 June; 0614–0627 to 26 June; 0636–0641 to 27 June) sit in the printed edition under the earlier date line (checked with `align062.py`; p.140 scan checked for 6/7 June). These moves cause the footnote collision warnings.
- **Headings the old extraction put in the wrong place**: the moved clusters kept their `#` date heading, which would have been left mid-entry. `set_french` without the heading on **0264** (Mercredi 7 juin), **0286** (Jeudi 8 juin), **0509** (Jeudi 22 juin), **0553** (Samedi 24 juin), **0614** (Mardi 27 juin), **0636** (Mercredi 28 juin). The entry `heading` key puts the printed date line on the first paragraph of 06-07, 06-08, 06-22, 06-24, 06-27 and 06-28 (checked in `--emit` output).
- **062.0273** spanned 6/7 June (docx ¶1663–1666): set_french = ¶1663; new ¶1665 «Il faut partir…» and ¶1666 «Cette insulte me pèse…» open 1876-06-07.md under «Mercredi 7 juin 1876».
- **18–19 June**: one entry. The file keeps the old range name `1876-06-18-19.md` with heading «Dimanche 18 juin 1876 - lundi 19 juin 1876» (the drafter's `1876-06-18.md` and its redirect_from are removed).
- Headings with a comma after the weekday (0001, 0015, 0024, 0074, 0123, 0148, 0164: «# Lundi, 29 mai 1876» …) → set_french to the printed form «# Lundi 29 mai 1876».

## Kinds (with sources)

- **clipping ×13**: the Ignotus article, 27 June (see below), source «Le Figaro, Le cardinal Antonelli par Ignotus, juin 1876», tags `[#Le_Figaro]` and `[#Cardinal_Antonelli]` (the tool adds `[#Press_clipping]`).
- **letter ×1** (new, split off 062.0605): Marie's French translation of Pietro's letter (docx ¶2507–2509, p.218), source «Lettre de Pietro Antonelli à Marie, 23 juin 1876, traduite de l'italien par Marie» (the date is from 27 June: «La lettre est datée du 23 juin»), tag `[#Pietro]`. Before it is a new **editorial** «LETTRE EN ITALIEN ÉPINGLÉE AU CAHIER» (the edition's label, ¶2506; OCR «ÉPINCLÉE» corrected). 0605 keeps «Et je lus ce qui suit, … attaché là :[^4]» (its footnote about the pinned original stays).
- **Letter guesses removed** (these are dialogue): 062.0502 «— Madame, vous dites des bêtises…», 062.0627 «— Madame, écoutez ce qu'a dit Publius Syrus…», 062.0636 «— Mademoiselle, répondis-je…», new ¶2703 «— Mademoiselle, je ne bougerai pas.».
- **Clipping guess removed** on new ¶2435 «Si je chante…»: it is Marie's translation of the Italian song she sang (p.212). The drafter's 7 one-line paragraphs ¶2432–2438 are rebuilt as **2 verse paragraphs** following the print: the Italian stanza (8 italic lines) and Marie's French (8 lines).
- **«[annotation]» CHECK items from common/log-062.md**:
  - 0272 (inline, end of paragraph): split → 0272 (set_french) + new editorial «[annotation]» (¶1661) + new margin «*Voilà que je m'amuse d'aimer tout le monde*» (¶1662).
  - 0277 (inline, end): split → 0277 + editorial (¶1680) + margin «*S'il avait été plus* plobster, *plus Hamilton, …*» (¶1681; «plobster» as printed, p.145).
  - 0309 (inline, **mid-sentence**: «…de s'exalter [annotation] Paris, 1877. Que je m'aime de parler ainsi ! que je suis gentille. et de mon peu d'expérience…»): **kept inline, no kind** (a split would cut a sentence). Open question below.
  - 0428 «no italic run follows»: the run is old 0429 «Mes bons amis, apprenez…» (italic in the print, ¶2087) → **margin**.
  - 0555, 0611, 0656 «no italic run follows»: the italic sentence opens the next old cluster. Split: a new **margin** paragraph (¶2291 «*Jolie vengeance ! …*», ¶2527 «*Mais c'est un ordre du jour cela !*», ¶2652 «*En lisant tout ceci je commence à me réconcilier avec moi-même.*») goes after the editorial marker, and 0556 / 0612 / 0657 keep the diary text that follows (set_french).
  - 0378: the italic run is 6 paragraphs (¶2037–2042), not 3 → 0382, 0383, 0384 also **margin**.
  - 0117: the run is 4 paragraphs (¶1470–1473) → 0121 «Folie.» also **margin** (this was on the drafter's «not found» list; it is ¶1473 «*Folie.*»).
  - 12 June: the marker ¶1910 had been lost → new **editorial** «[annotation]» before new ¶1911, and ¶1911 «*Combien de fois j'ai tremblé…*» → **margin**.
  - 0685 «*[Pour sûr)*» (¶2729, p.242: «(*Pour sûr*)», Marie's later remark) → set_french «(*Pour sûr*)», **margin**.
  - All margin sources are «Annotation de Marie».
- The drafter's `other` on 0633 is gone (0633 is dropped). rayé 0312, 0531 are kept.

## The Ignotus article (27 June 1876)

After «…je le lus et, le coupant soigneusement, je l'attache ci-après.» (end of 0632, p.223), Marie pasted in Le Figaro's «LE CARDINAL ANTONELLI» signed Ignotus (docx ¶2585–2599, Mon Journal t.8 pp.223–230). It is restored as **13 clipping paragraphs**, one per printed paragraph (¶2586…¶2598). «LE CARDINAL ANTONELLI» is the first line of the first paragraph and «Ignotus.» the last line of the last. They replace 062.0633, and the model is 067.1344ff. (the November Ignotus article, a different text). The proofread against scans pp.223–230 fixed:
«pro secrétaire»→«pro-secrétaire», «M. de Bevel»→«M. de **Revel**», «Éminence ?»»→«Éminence ? »», «départ ?»»→«départ ? »», «religione;»→«religione ;», «lè roi»→«le roi», «II aime»→«Il aime», «xix' siècle»→«XIXe siècle», «demi- profane»→«demi-profane», «qïi'on»→«qu'on». Italics of the print (*connubio*, the Italian quotation, *Domine salvum*, *papabile*) are kept. The small capitals «Le comte» / «Le cardinal» (p.224) are not marked. The print's spellings «Quant la République», «Bismark», «catholica» and «Je conservai de ce une vraie colère» stay as printed (it is the newspaper's text).

## set_french list (22, each with `_rsr` for the applier)

0001, 0015, 0024, 0074, 0123, 0148, 0164 (heading comma) · 0264, 0286, 0509, 0553, 0614, 0636 (misplaced heading removed) · 0273 (split at the date line) · 0272, 0277 (annotation split off at the end) · 0556, 0612, 0657 (annotation split off at the start) · 0605 (label + letter split off) · 0382 (OCR «j'avai?.»→«j'avais»; broken italics «D'*ailleurs … *volage.» → «*D'ailleurs … volage.*», p.176) · 0685 («(*Pour sûr*)»).
**Removed**: the drafter's completion on **0394**. docx ¶2052 = 0393 + 0394 (the old extraction split one paragraph into two), so the completion would have duplicated 0393. The drafter's «not found» on 0393 was a matcher miss.

## OCR/typo fixes in new text

¶1551 «Oh I non»→«Oh ! non» · ¶1553 «punis- sez-pas»→«punissez-pas» · ¶2366 «non.,»→«non..» (as printed) · ¶2375 «cela I Rien»→«cela ! Rien» · ¶2423 «que.,»→«que..» · ¶2430 «justice, [deux lignes cancellées]»→«justice. [deux…]» (p.211) · ¶2442 «espion.,»→«espion..» · dialogue openers «- »→«— » on ¶2368, 2375, 2376, 2391, 2392, 2394 · the song (p.212) · the article (above) · «ÉPINCLÉE»→«ÉPINGLÉE».

## Kept but flagged

- Drafter's «not found» items that are really in the docx at that place: 0090 «— Encore une.» (¶1442), 0097 «— Ho ! ho !» (¶1449), 0121 (now margin), 0393, 0719 «Une vie illustre !» (¶2775). All are kept.
- Uncertain alignments (repeats in other carnets): 0442 («Amans ita ut fax…», which is also the Livre 61 title-page motto ¶1048, 061's), 0500 (also ¶1131, 061), 0304 (also ¶3027, 063). 0502 vs new ¶2365: different sentences («Mais tu ne lui as pas donné parole.» on 21 June, ¶2199, vs «…ta parole ?» on 24 June), so both stay.
- 0309: inline annotation (see above).
- 0302 «- - Vous imprimez des lettres de faire-part ?» (double dash, an old-text artefact) is left untouched.
- 0315 and 0319 are common08's «[annotation] *…*» margin clusters; the label stays inside the text.
- No drawings or facsimiles on the pages viewed (117, 140, 145, 176, 207, 208, 211–213, 218, 223–230, 242, 249).

## Open questions for the owner (conservative default chosen)

1. 0309: split the mid-sentence «[annotation] Paris, 1877. …» into editorial + margin + a paragraph starting «et de mon peu d'expérience» as the print lays it out? Default: kept inline.
2. The song, p.212: the print reads «s'entendomi» (the Italian is «sentendomi»). Default: as printed, treated as Marie's spelling.
3. Dropping RSR-summary-only clusters (0351 plus the drafter's 11) loses those entry summaries from `_original`. Default: dropped, following the drafter/common policy.

## For the applier after --write

- Turn the 22 `_rsr` keys into RSR comments.
- 13 of the set_french paragraphs are heading-only changes, so translations keep their old translated headings: in cz/uk/en/fr the translated «# Středa, 7. června 1876»-type heading lines in 0264, 0286, 0509, 0553, 0614 and 0636 (new IDs) must be deleted by hand/the next TR pass. The tool flags them «SOURCE CHANGED».
