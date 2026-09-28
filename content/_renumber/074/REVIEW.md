# Carnet 074 rebuild (tome 10): review (2026-09-28)

Plan: `plan-074.json`. It ran together with the other tome-10 plans: `just rebuild-carnets plan-069.json plan-070.json plan-071.json plan-072.json plan-073.json plan-074.json --write`. Map: `../074-2026-09-28.json`; SQL for reader reports: `../069+070+071+072+073+074-2026-09-28.sql`.
Source: `content/_raw/tome10.docx` and the Tome 10 scan (Mon Journal, t.10), checked page by page where the notes say so.

## Summary

- **Paragraphs:** 446 after the rebuild, numbered 074.0001–074.0446.
  - 444 old paragraphs carried, 0 moved in from another carnet, 2 new, 0 dropped.
  - 85 IDs change.
- **Entries:** 37 (0 added, 0 removed).
- **set_french** on 13 old paragraphs.
- **Kinds:** editorial×2, letter×4, rayé×5 (new: none; old: editorial×2, letter×4, rayé×5).
- **Approval flags reset** per tree: cz 12, uk 12, en 12, fr 12.

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

None.

## Drawings and facsimiles

None.

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
== renumber-check 074
RESULT: PASS (0 fail, 0 warn)
GATE _original 069 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE _original 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE _original 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE _original 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE _original 073 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE _original 074 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 069 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 073 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 074 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 069 | RESULT: PASS (0 fail, 1 warn) | splice 0
GATE uk 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 073 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 074 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 069 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 073 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 074 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 069 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 070 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 073 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 074 | RESULT: PASS (0 fail, 0 warn) | splice 0
check-comments: OK (_original)
check-comments: OK (cz)
check-comments: OK (uk)
check-comments: OK (en)
check-comments: OK (fr)

```

## Withdrawn cover pages (for when the manuscript is available)

Owner decision KRR 2026-09-28: no cover entries or cover paragraphs until the manuscript is scanned. Texts as printed:

- Restored from tome10.docx ¶4309–4312, Mon Journal t.10 p.311:

  > Gloriae Cupiditas
  > Livre 74ème
  > commencé le lundi 20 août 1877
  > terminé le mardi 25 septembre 1877
  > Paris, boulevard Haussmann 29
  > depuis le 23 août jeudi à Schlangenbad,
  > Badehaus n° 3 et 9
  > Wiesbaden, Römer bad n° 30
  > Paris, Grand Hôtel, depuis le 16 septembre 1877

### New layout (37 entries)

| New file | Heading | carried | moved in | new | set_french | kinds |
|---|---|---|---|---|---|---|
| 1877-08-20.md | Lundi 20 août 1877 | 23 | 0 | 0 |  | rayé×1 |
| 1877-08-21.md | Mardi 21 août 1877 | 8 | 0 | 0 | 1 |  |
| 1877-08-22.md | Mercredi 22 août 1877 | 3 | 0 | 0 |  |  |
| 1877-08-23.md | Jeudi 23 août 1877 | 21 | 0 | 0 |  |  |
| 1877-08-24.md | Vendredi 24 août 1877 | 5 | 0 | 0 |  |  |
| 1877-08-25.md | Samedi 25 août 1877 | 6 | 0 | 0 |  |  |
| 1877-08-26.md | Dimanche 26 août 1877 | 23 | 0 | 0 |  |  |
| 1877-08-27.md | Lundi 27 août 1877 | 15 | 0 | 0 |  | rayé×1 |
| 1877-08-28.md | Mardi 28 août 1877 | 20 | 0 | 0 |  |  |
| 1877-08-29.md | Mercredi 29 août 1877 | 17 | 0 | 0 |  | rayé×1 |
| 1877-08-30.md | Jeudi 30 août 1877 | 22 | 0 | 0 |  | editorial×1 |
| 1877-08-31.md | Vendredi 31 août 1877 | 14 | 0 | 0 | 1 |  |
| 1877-09-01.md | Samedi 1er septembre 1877 | 10 | 0 | 0 | 1 |  |
| 1877-09-02.md | Dimanche 2 septembre 1877 | 24 | 0 | 0 | 3 |  |
| 1877-09-03.md | Lundi 3 septembre 1877 | 6 | 0 | 0 |  |  |
| 1877-09-04.md | Mardi 4 septembre 1877 | 10 | 0 | 0 |  |  |
| 1877-09-05.md | Mercredi 5 septembre 1877 | 10 | 0 | 0 | 3 | letter×3 |
| 1877-09-06.md | Jeudi 6 septembre 1877 | 7 | 0 | 0 |  |  |
| 1877-09-07.md | Vendredi 7 septembre 1877 | 3 | 0 | 0 |  |  |
| 1877-09-08.md | Samedi 8 septembre 1877 | 8 | 0 | 0 |  |  |
| 1877-09-09.md |  | 20 | 0 | 0 | 1 | editorial×1, rayé×1 |
| 1877-09-10.md | Lundi 10 septembre 1877 | 1 | 0 | 0 |  |  |
| 1877-09-11.md |  | 23 | 0 | 0 |  |  |
| 1877-09-12.md | Mercredi 12 septembre 1877 | 16 | 0 | 0 |  |  |
| 1877-09-13.md | Jeudi 13 septembre 1877 | 21 | 0 | 0 |  |  |
| 1877-09-14.md | Vendredi 14 septembre 1877 | 16 | 0 | 0 |  |  |
| 1877-09-15.md | Samedi 15 septembre 1877 | 13 | 0 | 0 |  |  |
| 1877-09-16.md |  | 1 | 0 | 1 |  |  |
| 1877-09-17.md | Lundi 17 septembre 1877 | 9 | 0 | 0 |  | rayé×1 |
| 1877-09-18.md | Mardi 18 septembre 1877 | 15 | 0 | 0 |  |  |
| 1877-09-19.md | Mercredi 19 septembre 1877 | 10 | 0 | 0 |  |  |
| 1877-09-20.md | Jeudi 20 septembre 1877 | 1 | 0 | 1 |  |  |
| 1877-09-21.md | Vendredi 21 septembre 1877 | 10 | 0 | 0 | 1 |  |
| 1877-09-22.md | Samedi 22 septembre 1877 | 6 | 0 | 0 | 2 | letter×1 |
| 1877-09-23.md | Dimanche 23 septembre 1877 | 10 | 0 | 0 |  |  |
| 1877-09-24.md | Lundi 24 septembre 1877 | 10 | 0 | 0 |  |  |
| 1877-09-25.md | Mardi 25 septembre 1877 | 7 | 0 | 0 |  |  |
