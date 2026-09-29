# 089 (Livre 89, 20 Jun – 2 Oct 1880): final plan review — worker D, 2026-09-28

Plan: `final/plan-089.json`, built by `tools/fix_089.py` from the identity plan (the draft merged 07-18 into 07-17
over «Dimanche î 8 juillet», and the tiler garbled 0354 «(toile de 15). 5).» — an OCR-split number «1 5»;
**tiler bug for the lead: split digits make a spurious gap**, check other carnets' `_tiler` completions for this).

**Verdict: rebuild.** 684 old carried, 1 new, 3 dropped, 3 set_french, 102 entries (+1: 1880-10-01), 685
paragraphs; 69 IDs change (from 0616 on); flags reset in 3 entries per tree (09-28, 09-30, 10-01).

## 28 September 1880 (printed pp.351–353): manuscript order restored
The print shows «Saint Amand arrive à déjeuner, dans l'enthousiasme de ma lettre ainsi écrite:», then a facsimile of
Marie's note written in a spiral with its transcription beside it («Cher baron, nous allons ce soir au cirque… M.B.»),
the text «Cette bouffonnerie me vaut … quelque chose de fou pour s'amuser.» set around it in two columns, then «Le père
Gabriel…». The extraction scrambled this (LAN had flagged it as a two-column artefact):
- new letter paragraph (¶4962, p.352), kind letter, source «Lettre de Marie Bashkirtseff au baron de Saint-Amand,
  28 septembre 1880, écrite en spirale»; its text was glued to the end of 0621.
- 0623 moved up after the letter and `set_french` to one paragraph including the tail «chose de fou pour s'amuser.»
  (old 0616, dropped as merged) and the print's italic *quelqu'un*.
- 0621 `set_french`: the letter removed, the sentence completed with old 0624 «mon père est aussi votre père…»
  (dropped as merged; page-break continuation).
- 0622 «|» dropped (artefact, ¶4963).
- Drawing: the spiral facsimile, `drawings/089/tome13-p0352-1.webp` (1293×1600, 62 KB, printed text column masked,
  verso show-through lightened), anchored after 0615 («…ma lettre ainsi écrite:»). See drawings-089.json.
  **Owner question 4:** it is the facsimile of the note as sent/drafted (reproduced in the print), not a drawing
  proper — link it as a drawing? (I recommend yes; «ainsi écrite» points at it.)

## 30 September / 1 October 1880
The print (p.356) has two date lines «Jeudi 30 septembre 1880 / Vendredi 1er octobre 1880» and the text under the
second. `_original` had them as one heading line in 0658 on 09-30. Now 0658 = «# Jeudi 30 septembre 1880 /
[Aucun texte - date seule mentionnée]» (set_french) and a new entry `1880-10-01.md` (heading «Vendredi 1er octobre
1880», frontmatter from 09-30) holds 0659–0672.

## Kinds (21 old + 1 new)
| IDs | kind | source |
|---|---|---|
| 0285–0292 | letter | Lettre de Marie Bashkirtseff à sa mère, 3 août 1880 (already quoted) |
| 0561–0562 | letter | Billet de Soutzo à Marie Bashkirtseff, reçu le 14 septembre 1880 (already quoted; the inset «Je vous envoie ces fleurs…» is this note, not a clipping) |
| 0280 0293 0496 0500 0642 | rayé | «[N lignes cancellées/noircies/rayées]» |
| 0224 0583 | margin | «[Dans la marge: …]», «[En travers: …]» |
| 0365 | other | annotation marginale, peut-être de Mme Bashkirtseff mère (the edition's «[phrase ajoutée Mme Bashkirtseff ?)») |
| 0479 | other | annotation marginale de Mme Bashkirtseff mère |
| 0501 | editorial | «[Manque du 11 au 13 septembre 1880]» |
Rejected guesses: 0021 0064 0452 0585 0602 (sentences starting «Monsieur/Madame X»). 0244 and 0258 keep their
«[Dans la marge: …]» inline (mixed with diary text).

## Post-apply
- `tools/post_apply_d.py`: drops the OCR «Ier» duplicate headings of 0063, 0272, 0453 (`_original`, embedded copies,
  fr visible heading corrected), no resets.
- Drawing frontmatter per drawings-089.json (anchor 089.0615 keeps its ID).
- Translations: 0621/0623/0658 get «SOURCE CHANGED»; the translated «1 October» heading stays in 0658 (30 Sep entry)
  while 1880-10-01 shows `# TODO` — move it down (mechanical, as in 068). The stale embedded copies the tool warns
  about (0658 in cz/uk/en/fr, 0623 and 0621 in en/fr) should be deleted then.

## Withdrawn cover pages
- tome13.docx ¶4163–4167, Mon Journal t.13 p.293: «Dessin 3 octobre 1871 / Peinture 30 septembre 1872 / Médaille! 4
  janvier 1877 / Prédiction d'Edmond (livre 75, p. 6 / Résolution sage (page 13)» (OCR as printed-docx; the other two
  title pages read 1877/1878/14 janvier 1879).
- ¶4168–4169, p.293: «Gloriae Cupiditas / Livre 89 / commencé le dimanche 20 juin 1880 / terminé le samedi 4 octobre
  1880 / 34 avenue Montaigne, Paris / Depuis le lundi 19 juillet Mont-Dore / Hôtel Chobory aîné / depuis le dimanche
  22 août Paris».

## Where the notebook is kept
The lead's brief says 089 is held at the Bibliothèque de Cessole, Nice. **Tome XIII's own avertissement (docx ¶38)
says the opposite:** «Ce tome XIII comprend les cahiers 85 à 89 conservés au département des manuscrits à la
Bibliothèque nationale de France sous la cote Nouvelles Acquisitions françaises 12368 à 12372» (089 would be NAF
12372). **Owner question 5:** which is right? Nothing about Cessole anywhere in tome13.docx. No RSR change made.

## Dialogue dashes
34 docx dialogue paragraphs, 34 `_original` lines without the dash (not changed).

## Policy update (2026-09-28)
- Printer's typos: none in the new/set_french text (0621, 0623, 0658, spiral letter checked against p.352/356).
- Facsimiles: the only picture in Livre 89 is the spiral letter (already in drawings-089.json, stays linked). The
  scan's other picture regions (PDF 383–384) are after the diary text (edition back matter), outside 089.
- **New prerequisite** (HEAD ec6fa6163 refuses a set_french on a cluster with a multi-line comment block):
  `tools/prereq_089.py REPO` rewrites fr/089/1880-09-28.md 089.0623's 15-line embedded block as 15 single-line embeds
  (same text). With it, the dry run (scratch copy of content/, `--root`) passes: 685 paragraphs, 69 IDs change,
  3 resets per tree.

## Lead review (resumed session, 2026-09-28)

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_089.py`)

- none

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

## Title-page notes restored (applier, 2026-09-28 night)
Owner policy in the handoff («Marie's own notes on title pages go in as margin/other at the first entry»): the
Marie-written lines listed above under «Withdrawn cover pages» that are not the title formula (Gloriae Cupiditas /
Livre N / commencé–terminé / addresses) are now `margin` paragraphs (source «note de Marie sur la page de titre du
Livre N») at the start of the first entry, inserted by `tools/title_notes.py`. The formal title lines stay withdrawn.
The dates «Dessin 3 octobre 1871 / Peinture 30 septembre 1872 / Médaille 14 janvier 1877» are kept as printed (scan
checked, p.293); the other title pages read 1877/1878/1879. Owner question: correct them?
