# Carnet 069 rebuild (tome 10): review (2026-09-28)

Plan: `plan-069.json`. It ran together with the other tome-10 plans: `just rebuild-carnets plan-069.json plan-070.json plan-071.json plan-072.json plan-073.json plan-074.json --write`. Map: `../069-2026-09-28.json`; SQL for reader reports: `../069+070+071+072+073+074-2026-09-28.sql`.
Source: `content/_raw/tome10.docx` and the Tome 10 scan (Mon Journal, t.10), checked page by page where the notes say so.

## Summary

- **Paragraphs:** 718 after the rebuild, numbered 069.0001–069.0718.
  - 643 old paragraphs carried, 0 moved in from another carnet, 75 new, 8 dropped.
  - 218 IDs change.
- **Entries:** 38 (2 added, 0 removed).
- **set_french** on 97 old paragraphs.
- **Kinds:** editorial×1, letter×17, margin×9, rayé×5 (new: none; old: editorial×1, letter×17, margin×9, rayé×5).
- **Approval flags reset** per tree: cz 30, uk 30, en 30, fr 30.

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

- 069.0484: empty placeholder cluster (no text in _original or any translation)
- 069.0496: empty placeholder cluster (no text in _original or any translation)
- 069.0574: empty placeholder cluster (no text in _original or any translation)
- 069.0603: empty placeholder cluster (no text in _original or any translation)
- 069.0626: empty placeholder cluster (no text in _original or any translation)
- 069.0439: duplicate of 069.0450 (extraction artefact): tome10.docx ¶571 «Avant de me coucher je fais d'abominables jeux de mots…» occurs once, under Jeudi 22 mars
- 069.0650: title-page (cover) text; withdrawn by owner decision 2026-09-28 until the manuscript is available (text kept in content/_renumber/CCC/REVIEW.md)
- 069.0651: title-page (cover) text; withdrawn by owner decision 2026-09-28 until the manuscript is available (text kept in content/_renumber/CCC/REVIEW.md)

## Drawings and facsimiles

Images in `src/frontend/public/images/marie/drawings/069/`, linked by `drawings:` in the entry frontmatter.

- `tome10-p0043-1.webp` (1877-03-25.md): Programme imprimé du concert de musique sacrée de la Società Filarmonica, Naples, 25 mars 1877 (page de titre) — Mon Journal, t. 10, p. 43 (fac-similé)
- `tome10-p0044-1.webp` (1877-03-25.md): Programme imprimé du concert, première partie — Mon Journal, t. 10, p. 44 (fac-similé)
- `tome10-p0045-1.webp` (1877-03-25.md): Programme imprimé du concert, seconde partie — Mon Journal, t. 10, p. 45 (fac-similé)

## 4. Planner notes (2026-09-27, superseded where §1 says so)

### 069 and 074: final plan notes (2026-09-27)

Builders: `work-069-074/build069.py`, `build074.py` (from `draft/plan-CCC.json`), helpers `lib.py`, `mono.py` (docx-order check), `cut.py` (facsimiles).

#### Counts

| Carnet | Entries | Old carried | New | Dropped | Moved out | set_french | Kinds |
|---|---|---|---|---|---|---|---|
| 069 | 39 | 643 | 76 | 6 | 2 (→ 070) | 11 | cover 1 (new); letter 8 old + 5 new; clipping 3 (new); margin 9, rayé 5, editorial 1 (old) |
| 074 | 38 | 444 | 3 | 0 | 0 | 4 | cover 1 (new); letter 4, rayé 5, editorial 2 (old) |

Dry runs in wt-t10: `rebuild-carnet 074 final/plan-074.json` exit 0, no ERROR. 069 was dry-run as `work-069-074/plan-069.standalone.json` (identical to final/plan-069.json but still holding 069.0650/0651 at the end of 1877-04-02): exit 0, no ERROR. Warnings only: cover has no date heading (expected), and "old embedded French not found" in cz/uk/en/fr for 0455, 0459, 0641 (set_french targets whose translation embeds differ; the tool inserts the new copy).

#### CROSS-CARNET: 069.0650 and 069.0651 go to 070's cover

`final/plan-069.json` does NOT list 069.0650 («Dubium, illusio, Deceptio / Oppresio[^2]») and 069.0651 («Gloriae Cupiditate»). They are docx ¶1053–1054, and the scan shows them on printed p.71 (PDF 72), the Livre 70 title page, above «Livre 70ème». Printed p.69 ends Livre 69 with «[Demi page blanche]», «Maman vient me raconter…» and «Documents sur le pape Alexandre XI Borgia. [manque dans le manuscrit]» (069.0647–0649, kept in 069). The 070 plan must place `{"old":"069.0650","kind":"cover"}` and `{"old":"069.0651","kind":"cover"}` at the top of its cover entry, and the run must be `rebuild-carnets` with 069 and 070 together. 0650's footnote [^2] travels with it. Suggest `set_french` «Dubium, illusio, Deceptio\nOppresio[^2]» on 0650 if the line break matters (it is one line in _original).

#### 069 decisions

- **Cover** 1877-02-24-cover.md: ¶46–49 = «Dubium, illusio, Deceptio / Oppressio. / Gloriae Cupiditate / Livre 69ème / depuis le samedi 24 février 1877 / jusqu'au lundi 2 avril 1877 / Naples, hôtel du Louvre». OCR fixed «niusio», «69èrne».
- **Dates**: all 39 date lines match; the heading-sweep rows (03-01, 04-01) are no longer an issue — the draft's alignment puts 0062–0067 under Mercredi 28 février and 0604–0625 under Dimanche 1er avril, as in the docx. The two «Dimanche 4 mars 1877» date lines (¶205, ¶220; a card reading between them) stay one entry; 069.0157 keeps the second date line as plain text.
- **Easter heading**: the draft's new paragraph «- Pâques» (¶924) is removed; the heading of 069.0604 becomes «# Dimanche 1er avril 1877 - Pâques» via post-069.json (tool cannot edit headings).
- **Duplicate dropped**: 069.0439 (21 Mar) = 069.0450 (22 Mar), «Avant de me coucher je fais d'abominables jeux de mots…»; docx has it once (¶571, 22 Mar). Translations of 0439 are lost with it (same sentence as 0450).
- **Order fixes**: 069.0455's last line «C'est surtout mes vingt-sept millions.» (¶584) and 069.0459's last line «Le croirait-on ? …» (¶599) come after the restored ¶578–583 / ¶591–598; both cut by `set_french`, the tail re-inserted as a `new` paragraph with French as in _original. 069.0464 («Cette espèce de laideur…», ¶774) moved from 25 Mar to the end of Mardi 27 mars.
- **Label restored**: 069.0537 gains «[Mots noircis: et parlant]» (¶820). All other bracket notes of ¶46–1052 are in _original or in new text (scripted check).
- **Kinds**: margin 0035 0146 0235 0257 0295 0366 0380 0406 0470; rayé 0034 0044 0151 0278 0310; editorial 0647 «[Demi page blanche]». No kind on 0285 («# Mardi 13 mars 1877» + «[Huit lignes cancellées]») and 0429 (same with «[Quatre lignes cancellées.]») because the cluster carries the day heading — a crossed-out rendering would strike the heading; 0456 «[Mots rayés : Depuis ce matin]» is partial. 0503/0505 «Monsieur le comte est mort» are lines of Marie's Malbrough parody, not letters: kind removed.
- **Letters**: 0639–0646 Marie's reply to Mouzay (2 Apr, ¶1042–1049), quoted via set_french; new ¶553–555 (the words Marie paints on a card for Larderei, 21 Mar) and ¶596–597 (her note «Oh ! le vilain bout de papier !», 24 Mar).
- **Concert programme** (Società Filarmonica, 25 Mar): three `new` clipping paragraphs after 069.0463 («dont voici le programme»), transcribed from the facsimile pp.43–45 (docx ¶609–692 is unusable picture-caption OCR). The printed edition sets the facsimile at a page turn inside the ¶608/¶718 paragraph; I placed it after the announcing sentence. ¶608+¶718 stays one diary paragraph. Facsimiles cut: final/images/tome10-p0043-1.webp (28 KB), -p0044-1 (82 KB), -p0045-1 (98 KB), listed in post-069.json `facsimiles`.
- Empty clusters 0484 0496 0574 0603 0626 dropped (draft); 0484 and 0496 held only an extraction-era RSR summary note, which is lost.

#### 074 decisions

- **Cover** 1877-08-20-cover.md: ¶4309–4312, including the places list (the draft had put ¶4312 into 20 Aug): «Gloriae Cupiditas / Livre 74ème / commencé le lundi 20 août 1877 / terminé le mardi 25 septembre 1877 / Paris, boulevard Haussmann 29 / depuis le 23 août jeudi à Schlangenbad, / Badehaus n° 3 et 9 / Wiesbaden, Römer bad n° 30 / Paris, Grand Hôtel, depuis le 16 septembre 1877». OCR «Romer»→«Römer» (scan p.311).
- **Dates restored**: 09-09 (from 0256; date line «Dimache» misparsed), 09-11 (from 0283, «Mardi 10 septembre», file follows the weekday as before; RSR note already there), 09-16 (0366 heading + new «[Aucun texte - date seule mentionnée]», ¶4679). The draft's new date-line paragraphs ¶4568 and ¶4679 removed. 09-20 (0401, heading only; ¶4714 directly followed by ¶4715) also gets «[Aucun texte…]».
- **Heading fix** (post-074.json): 074.0256 «# Dimache 9 septembre 1877» → «# Dimanche 9 septembre 1877» (OCR typo copied into _original).
- **Kinds**: rayé 0022 (whole «[Rayé : Lettre de Paul…]»), 0101, 0126, 0271, 0368; editorial 0157, 0268 («[Bas de page enlevé par Marie]»); letter 0233–0235 (to Marcuard, 5 Sept, ¶4545–4547) and 0415 (to Marcuard, 22 Sept, ¶4728–4729), quoted via set_french. 0232 «à M. de Marcuard :» and 0189 (English epigraph) stay plain.

#### OCR corrections (new text, scan-checked)

069: ¶550 «Paierme»→«Palerme»; ¶606 «demi- tour»→«demi-tour»; ¶608 «reconnais- sance»→«reconnaissance»; ¶723 «vingt- sept»→«vingt-sept»; ¶724 «OIga»→«Olga»; ¶529 «du 1 3,»→«du 13,»; ¶596 «“Oh !»→«- “Oh !» (printed dash). Kept as printed: «s'efforcaient» (¶718), «Sanceso», «préferait» (¶722). Uncertain: ¶511 «et-Gryf-Jaxa-Bikowsky» (not checked on the scan).
074: cover «Romer»→«Römer».

#### Owner questions

1. Facsimiles of the concert programme: link them (e.g. under `drawings:` or a future `facsimiles:` field) or keep the transcription only?
2. 069.0285 / 069.0429: heading + whole «[N lignes cancellées]» in one cluster — leave without kind (my choice) or split the note into its own rayé paragraph (needs set_french + new, translations re-seated)?
3. 069.0182 has the typo «[heures}» in _original (old text, not changed here).


## 5. Gate results

```
== renumber-check 069
  [WARN] content/uk/069/1877-03-22.md:122: reference to a dropped paragraph (069.DROPPED-…)
  [WARN] content/fr/_non_french_passages.md:1323: reference to a dropped paragraph (069.DROPPED-…)
  [WARN] content/fr/_translate_manifest.json:11980: reference to a dropped paragraph (069.DROPPED-…)
  [WARN] content/cz/TranslationMemory.md:920: reference to a dropped paragraph (069.DROPPED-…)
RESULT: PASS (0 fail, 4 warn)
GATE _original 069 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 069 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 069 | RESULT: PASS (0 fail, 1 warn) | splice 0
GATE en 069 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 069 | RESULT: PASS (0 fail, 0 warn) | splice 0
check-comments: OK (_original)
check-comments: OK (cz)
check-comments: OK (uk)
check-comments: OK (en)
check-comments: OK (fr)
```

## Withdrawn cover pages (for when the manuscript is available)

> **Title-notes pass 2026-09-29.** Still withdrawn, **owner question**: the motto «Dubium, illusio, deceptio, oppressio» on the Livre 69 and 70 title pages (old 069.0650, 070.0198) — title formula or maxim? Default: withdrawn (see 068/REVIEW.md). Nothing re-added in 069/070.

Owner decision KRR 2026-09-28: no cover entries or cover paragraphs until the manuscript is scanned. Texts as printed:

- Restored from tome10.docx ¶46–49, Mon Journal t.10 p.5: the :

  > Dubium, illusio, Deceptio
  > Oppressio.
  > Gloriae Cupiditate
  > Livre 69ème
  > depuis le samedi 24 février 1877
  > jusqu'au lundi 2 avril 1877
  > Naples, hôtel du Louvre

### New layout (38 entries)

| New file | Heading | carried | moved in | new | set_french | kinds |
|---|---|---|---|---|---|---|
| 1877-02-24.md | Samedi 24 février 1877 | 8 | 0 | 0 |  |  |
| 1877-02-25.md | Dimanche 25 février 1877 | 20 | 0 | 0 | 3 |  |
| 1877-02-26.md | Lundi 26 février 1877 | 20 | 0 | 0 | 3 | margin×1, rayé×2 |
| 1877-02-27.md | Mardi 27 février 1877 | 13 | 0 | 0 | 3 |  |
| 1877-02-28.md | Mercredi 28 février 1877 | 6 | 0 | 0 | 1 |  |
| 1877-03-01.md | Jeudi 1er mars 1877 | 10 | 0 | 0 | 1 |  |
| 1877-03-02.md | Vendredi 2 mars 1877 | 28 | 0 | 0 | 5 |  |
| 1877-03-03.md | Samedi 3 mars 1877 | 37 | 0 | 0 | 2 |  |
| 1877-03-04.md | Dimanche 4 mars 1877 | 40 | 0 | 0 | 4 | margin×1, rayé×1 |
| 1877-03-05.md | Lundi 5 mars 1877 | 33 | 0 | 0 | 2 |  |
| 1877-03-06.md | Mardi 6 mars 1877 | 3 | 0 | 0 |  |  |
| 1877-03-07.md | Mercredi 7 mars 1877 | 9 | 0 | 0 | 2 |  |
| 1877-03-08.md | Jeudi 8 mars 1877 | 5 | 0 | 0 |  |  |
| 1877-03-09.md | Vendredi 9 mars 1877 | 16 | 0 | 0 | 3 | margin×1 |
| 1877-03-10.md | Samedi 10 mars 1877 | 11 | 0 | 0 | 2 | margin×1 |
| 1877-03-11.md | Dimanche 11 mars 1877 | 10 | 0 | 0 | 1 |  |
| 1877-03-12.md | Lundi 12 mars 1877 | 15 | 0 | 0 | 1 | rayé×1 |
| 1877-03-13.md | Mardi 13 mars 1877 | 5 | 0 | 0 |  |  |
| 1877-03-14.md | Mercredi 14 mars 1877 | 21 | 0 | 0 | 3 | margin×1, rayé×1 |
| 1877-03-15.md | Jeudi 15 mars 1877 | 3 | 0 | 0 |  |  |
| 1877-03-16.md | Vendredi 16 mars 1877 | 84 | 0 | 0 | 13 | letter×5, margin×2 |
| 1877-03-17.md | Samedi 17 mars 1877 | 31 | 0 | 0 | 4 | letter×4, margin×1 |
| 1877-03-18.md | Dimanche 18 mars 1877 | 0 | 0 | 12 |  |  |
| 1877-03-19.md | Lundi 19 mars 1877 | 0 | 0 | 12 |  |  |
| 1877-03-20.md | Mardi 20 mars 1877 | 6 | 0 | 0 |  |  |
| 1877-03-21.md | Mercredi 21 mars 1877 | 4 | 0 | 7 | 1 |  |
| 1877-03-22.md | Jeudi 22 mars 1877 | 11 | 0 | 0 |  |  |
| 1877-03-23.md | Vendredi 23 mars 1877 | 5 | 0 | 7 | 1 |  |
| 1877-03-24.md | Samedi 24 mars 1877 | 4 | 0 | 9 | 1 |  |
| 1877-03-25.md | Dimanche 25 mars 1877 | 4 | 0 | 16 |  |  |
| 1877-03-26.md | Lundi 26 mars 1877 | 19 | 0 | 0 | 2 | margin×1 |
| 1877-03-27.md | Mardi 27 mars 1877 | 12 | 0 | 0 |  |  |
| 1877-03-28.md | Mercredi 28 mars 1877 | 24 | 0 | 0 |  |  |
| 1877-03-29.md | Jeudi 29 mars 1877 | 31 | 0 | 0 | 10 |  |
| 1877-03-30.md | Vendredi 30 mars 1877 | 22 | 0 | 0 | 6 |  |
| 1877-03-31.md | Samedi 31 mars 1877 | 28 | 0 | 0 | 3 |  |
| 1877-04-01.md | Dimanche 1er avril 1877 | 22 | 0 | 12 | 7 |  |
| 1877-04-02.md | Lundi 2 avril 1877 | 23 | 0 | 0 | 13 | editorial×1, letter×8 |
