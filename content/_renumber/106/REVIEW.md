# Tome 16 rebuild plan (carnets 101–106): review (2026-09-28)

`build16.py` builds the plans from the drafter's output. The drafts are in `../draft16b/`, made by `draftwrap16.py` with the official `rebuild-draft-plan` at `ba398e4b7`. The duplicate August block 106.0143–0418 is hidden from the aligner there, because it would otherwise pair half of 105 with the duplicate.

- **Every judgement is in the code**, which is reproducible: `python3 build16.py` writes the plans, `build.log` and `headmoves.json`.
- **After `--write`, run** `postfix16.py <repo root>` once. It fixes headings and footnotes (see «After the write»).
- **Source:** `content/_raw/tome16.docx` and `content/_raw/scans/Tome16.pdf`.
- **Page map:** printed page = PDF page. `just scan-pagemap 16` maps 320 pages with offset 0, and I checked it on pp.11, 23, 35, 206, 214, 279, 289, 298, 299 and 311.
- **Run:** one multi-carnet run: `just rebuild-carnets plan-101.json … plan-106.json`.
- **Prerequisite:** `prereq.sh` (see below).

## Totals

| Carnet | Paragraphs (new numbering) | Entries | Old carried | Moved in | New (of which «Aucun texte») | Dropped | set_french | Kinds set by the plan |
|---|---|---|---|---|---|---|---|---|
| 101 | 631 | 69 | 603 | 0 | 28 (13) | 15 | 0 | rayé 2, editorial 1 |
| 102 | 150 | 88 | 149 (6 out → 103) | 0 | 1 (0) | 0 | 13 | – |
| 103 | 710 | 92 | 683 | 6 (102.0150–0155) | 21 (12) | 48 | 30 | margin 9, editorial 2, rayé 2, other 2 |
| 104 | 756 | 78 | 738 | 0 | 18 (11) | 60 | 38 | letter 15, margin 4, rayé 4 |
| 105 | 760 | 71 | 744 (105.0809 out → 106) | 1 (106.0142) | 15 (6) | 64 | 8 | rayé 6, margin 1 |
| 106 | 187 | 36 | 181 (106.0142 out → 105) | 1 (105.0809) | 5 (1) | 280 | 5 | letter 3, rayé 3, margin 1, editorial 1 |

The kinds that `0e3ca866e` marked this morning (letters in 101, 103 and 104, and an editorial kind on 101.0068) stay as they were, already quoted. The letter list above counts only the ones this plan adds.

## Drops (467)

- **Empty placeholder clusters (172):** 101 has 14, 103 has 47, 104 has 47 and 105 has 64. I re-checked each one with my own script: there is no visible text in `_original`, cz, uk, en or fr. Some hold only comments (an RSR summary, a CON verdict) or, in uk, a footnote definition. The tool moves such a definition to the paragraph that refers to it (4 uk warnings in 105).
- **106: the duplicate August block (276: 106.0143–0418).** See §1.
- **106: heading-only stubs for days the manuscript does not have (4):** 106.0431 (10 Oct) and 106.0442–0444 (13–15 Oct).
  - The docx goes from ¶4289 to ¶4290 (9 → 11 Oct) and from ¶4301 to ¶4302 (12 → 16 Oct), and the raw carnet agrees.
  - `redirect_from`: 1884-10-10 → 10-09, and 10-13/14/15 → 10-12.
- **104: Kernberger page numbers (11):** «209», «210» … «242» (104.0330 0346 0367 0393 0510 0590 0614 0633 0648 0666 0795). They are artefacts of the first import and are in no source.
- **Title pages (3):** 103.0731 (Livre 104, with the bare date lines of 14 and 15 April), and 104.0796–0797 (Livre 105).
- **101.0068:** «[Note de l'éd. : ici un dessin de Marie dans le journal.]».
  - It is not in the printed edition, which shows the drawing itself on p.11, and the drawing is now linked (see Drawings).
  - `0e3ca866e` had marked this line `editorial`; this plan drops it instead.

## 1. 106/1884-10-07.md: a second transcription of 7–31 August 1884

- **What the file held.** It had 277 paragraphs, and in the docx, 276 of them are 105's August 1884, from «Vendredi 8 août» (¶3768) to «Dimanche 31 août» (¶4043).
- **How the duplicates were found.** A 3-gram and whole-line comparison pairs 240 of them with a 105 paragraph holding the same docx text. The other 36 are:
  - date lines;
  - empty clusters (106.0418's en has only «[End of entry]»);
  - short lines («Alors tout va bien ?», «C'est un cancer.»…), each also present in 105.
- **Dropped.** Each drop reason names the 105 twin. Nothing that is only in 106 is lost: at docx level, 105 covers every paragraph of ¶3768–4043.
- **The one unique paragraph is 106.0142, from ¶3767** («Il sait que je suis à Paris mais je n'irai pas pour vexer cette cuisinière d'architecte…»). It is printed on p.279 under **«Jeudi 7 octobre 1884»**, between «Mercredi 6 août» and «Vendredi 8 août».
  - The scan shows «octobre» clearly, so it is the printed reading. It is a slip, by Marie or the transcriber: 7 August 1884 was a Thursday, 7 October a Tuesday.
  - It becomes **105/1884-08-07.md** with the heading «Jeudi 7 octobre 1884» as printed. The old heading «# Mardi 7 octobre» was an import «correction» that followed the file name. Its text now comes from the docx, with the accents restored.
  - The translations keep their text and get a SOURCE HEADING CHANGED note.
- **The real 7 October 1884** is a bare date line (¶4276). The entry 106/1884-10-07.md stays, holding «[Aucun texte - date seule mentionnée]», so its old URL now shows the empty day.

## 2. Old paragraphs the draft did not find in the docx (60, after hiding the block)

None of them is lost text.

- **Short lines (15)** that are present in the docx and too short for the aligner: «— Non.», «Enfin.», «Là.», «Bien.», «— Dix mètres ?!!», «Ah ! misère !» ×2 (the docx has it three times, ¶3598–3600), and so on. They stay where they are.
- **Date lines stored as paragraphs (≈45)**, such as «Jeudi 1 7 avril 1 884». Each moves to the start of its own day and becomes «# Jeudi 17 avril 1884» (split digits joined).
  - That is 42 «promote» paragraphs. In the translations, postfix16 puts «# » on the translated line and drops the ED note, because only the formatting changed.
  - 105.0802 «# Mercredi 10 septembre 1884» opens a restored 10 September entry.
- **The Kernberger numbers and title pages** listed under Drops.
- **Other cases:**
  - 102.0011 is the first half of ¶762 (see §4).
  - 105.0784 is the second half of ¶4060. The draft's «completion» of 105.0783 would have duplicated it, so it is removed.
  - 106.0101 «Ça c'est ce que j'ai rêvé.» is ¶4234.

## 3. Carnet 101: the «-evening» order, and misdated days

- **The two days after «Lundi 27 août».** The manuscript runs «Lundi 27 août 1883» (¶312–315), then **«Mardi 26 août 1883»** (¶316, no text), then **«Mercredi 27 août 1883»** (¶317–329), then «Jeudi 30 août». These are Marie's slips for Tuesday 28 and Wednesday 29: the weekdays are right.
- **The plan:**
  - 1883-08-27 keeps «Lundi»;
  - a new **1883-08-28.md** with the heading «Mardi 26 août 1883» holds «[Aucun texte…]», with an RSR note;
  - the old `1883-08-27-evening.md` becomes **1883-08-29.md** with the heading «Mercredi 27 août 1883», and its old URL redirects there (`redirect_from`).
- **The renumbering.** The ID inversion (evening numbered before the bare date) disappears.
- **Printed-typo date lines the draft missed.** Each is normalised in the heading and flagged here:
  - «Merecredi 22 août 1883» (p.23), an empty day: new entry 1883-08-22;
  - «Dimanche 16 septembe 1883» (p.35), which restores the entry 1883-09-16 that `_original` had filed as 15 Sept;
  - in 104: «Merredi 21 mai», «Merecredi 28 mai»;
  - in 105: «Samdi 23 août», «Mercredi 10 septembe».
  - The scan shows each misprint (`pages/datelines.png`).
- **The last line of Livre 101**, «Non, voyez dans le cahier suivant.» (¶737), is restored as 101's last paragraph. The draft had put it in 102's cover.

## 4. Carnet 102: granularity

- **The structure.** 102 has 155 IDs for 88 days, one or two big clusters per day, each holding the whole entry as many lines. The text is complete, and splitting the clusters would reset every translation, so the granularity is left as it is.
- **Real defects fixed:**
  - ¶762 had been cut in two in the middle of a word («…ou même d» | «misérable…»), losing «'autres malheurs, tandis que je persiste … comme une vie» and the end «les soirs avec du champagne … de bonne foi.» It is now 102.0011 = «Je viens de passer … je pensais mourir.» and 102.0012 = «Eh bien vous ne me prendrez … de bonne foi.», both through `set_french`.
  - 11 clusters (102.0019–0031) ended with the next day's date as a visible plain line, although the next entry has its own heading. The line is stripped, and postfix drops the translated duplicate where there is one (uk had 11, en 1).
  - «Mardi 25 décembre 1883 - Noël»: the heading is restored in full.
  - «(suite au prochain livre)» (¶1521), 102's last line, is restored.
- **Draft rows rejected because they are already lines of the big clusters:** «Ah.», «Non ?», «Pourtant.», «Enfin...», «Claire:».
- **102 → 103: 102.0150–0155.** They come after the Livre 103 title, under «Samedi 12 janvier 1884 - suite», so 103 opens with an entry 1884-01-12 with that heading. The Montmartre song is complete in 102.0153; the draft's extra lines are rejected. 103.0176 goes back to 31 Jan, where the song is quoted again.

## 5. 105.0809 and Livre 106

- **What 105.0809 held.** It carried Livre 106's title page, «Gloriae Cupiditas / [Livre 106] … / 30 rue Ampère, Paris». That was the 2026-09-26 placeholder fix, followed by «Jeudi 11 septembre 1884 - suite / Le principal s'est de travailler.»
- **Moved to 106.** It becomes the paragraph of **106/1884-09-11.md**, with the heading «Jeudi 11 septembre 1884 - suite» and the text «Le principal s'est de travailler.» The title-page lines are withdrawn, and «s'est» is as printed on p.299.
- **Its RSR comment** still cites «the convention of 104.0796–0797». Those IDs are dropped, so it now reads `104.DROPPED-…` (a renumber-check WARN, harmless).

## Withdrawn cover pages (owner policy: no cover entries)

- **101** (¶27–30, p.3): «Gloriae Cupiditas / [Livre] 101 / depuis le mercredi 8 août 1883 jusqu'au lundi 15 octobre 1883 / Paris / du 30 août au 10 septembre, à Jouy en Josas». Never in `_original`.
- **102** (¶738–743, pp.58–59): «Gloriae Cupiditas / [Cahier n°] 102 / depuis le mardi 16 octobre 1883 / jusqu'au samedi 12 janvier 1884 / 30, rue Ampère, Paris».
- **102, front pages** (¶741–749): reading notes after the title page, «Revue des deux Mondes / Conscience 15 octobre 1883 / Tous les changements psychiques sont liés à des mouvements physiques… / La psychologie moderne reconnaît que nous sommes une société de cellules… / La vie *inconsciente.* / Sphère du *moi*… / Hartmann attribue mille vertus à *l'inconscient*… / L'être ne fait rien plus sagement… / Tout homme comme moi *connaît* les principes philosophiques…» (1,103 chars). **Owner question 1.**
- **103** (¶1522–1523, p.119): «Gloriae Cupiditas / [Livre] 1 03 / depuis le samedi 12 janvier 1884 / jusqu'au dimanche 13 avril 1884 / 30, rue Ampère, Paris».
- **104** (¶2445–2446, p.183; old 103.0731): «Gloria Cupditas / [Livre] 1 04 / depuis le lundi 14 avril 1884 / jusqu'au mardi 1er juillet 1884 / 30, rue Ampère Paris».
- **105** (¶3271–3272, p.243; old 104.0796–0797): «Gloriae Cupiditas / [Livre ]105 / depuis le mercredi 2 juillet 1884 / jusqu'au [jeudi 11 septembre 1884] / 30, rue Ampère, Paris».
- **106** (¶4108–4110, p.299; the first lines of old 105.0809): «Gloriae Cupiditas / [Livre 1 06] / depuis le jeudi 11 septembre 1884 / jusqu'au [20 octobre 1884] / 30 rue Ampère, Paris».

## Kinds

Mixed paragraphs keep the inline `[Rayé: …]` form. A bracketed note that is a paragraph of its own in the printed edition and sat at the start of an old paragraph is split off (`set_french` on the old one, plus a new paragraph with the kind, as for 068.0238). There are 13 such splits:

| Kind | Split-off notes |
|---|---|
| rayé | 103 ¶1668; 104 ¶3017; 105 ¶3473 and ¶4039 |
| editorial | 103 ¶1845 «[TROIS QUARTS DE LA PAGE déchiré]», ¶1936 «[Sept pages arrachées]» |
| margin | 103 ¶1846, ¶1857, ¶1984, ¶2377; 104 ¶2935 and ¶3178; 105 ¶3785 |

Whole old paragraphs get a kind:

| Kind | Paragraphs |
|---|---|
| margin (Marie) | 103.0434, 103.0455 |
| margin, source «écriture de Mme Bashkirtseff mère» | 103.0631, 0671, 0688; 104.0042, 0053 |
| rayé | 103.0094; 104.0524, 0782; 105.0586 |
| editorial | 101.0257 «[Deux demi pages arrachées)]», 106.0425 «[Deux pages arrachées]» |
| other («note de Mme Bashkirtseff mère à la fin du cahier») | 103.0729–0730, «Ce cahier dont beaucoup de pages n'est qu'un délire d'une malade…», before the Livre 104 title |

Letters are quoted via `set_french`:

- 104.0404: Julian's telegram;
- 104.0406–0410: Marie's reply;
- 104.0426–0434: «Monsieur, …» to Tony Robert-Fleury, set in small type (Body text 5). Marie says it is «à peu près» her letter;
- 106.0095–0097: the Figaro illustré letter Marie dreams up («Ça c'est ce que j'ai rêvé»).

The drafter's guesses were rejected for 101.0465 (a Renan remark), 104.0287 (quoted speech) and 106.0024 («Mon bon petit Zola…», a diary apostrophe).

## New text

- New text follows the typography of `_original` 101–106: straight ' and ". Tome 16 carnets have no curly quotes.
- OCR and label fixes:
  - «Fourcaud,\nIe Wolff» → «Fourcaud, le Wolff» (¶ of 30 April);
  - «[Rayé :Saint-Amand ?]» → «[Rayé: Saint-Amand ?]»;
  - «*d'inspiration.]*» → «*d'inspiration.*]».
- Printed-typo weekday and month names in date lines are normalised in headings (§3).
- Two headings keep Marie's (or the printer's) wording against the calendar:
  - «Samedi 8 septembre 1884» (105/1884-09-06, before «Dimanche 7»; the old heading had been changed to «Samedi 6»);
  - «Jeudi 7 octobre 1884» (§1).
- Every new paragraph's RSR note cites «tome16.docx ¶N, Mon Journal t.16 p.X». This includes the «Aucun texte» rows, whose draft notes lacked the page.

## Drawings (cut at 600 dpi to WebP; `drawings.json`; not yet in `src/`)

| Carnet / entry | Anchor | File | Caption | Source |
|---|---|---|---|---|
| 101 / 1883-08-13.md | old 101.0067 («et en bas moi faisant un pied de nez à Jules avec la légende: Je le méprise.») | `drawings/101/tome16-p0011-1.webp` (560×299, 11 KB) | «Dessin de Marie dans le carnet : elle-même faisant un pied de nez à Jules» | Mon Journal, t. 16, p. 11 (fac-similé) |
| 106 / 1884-10-20.md | old 106.0462 (last paragraph) | `drawings/106/tome16-p0311-1.webp` (1229×542, 28 KB) | «Signature de Marie Bashkirtseff» | Mon Journal, t. 16, p. 311 (fac-similé), **owner question 2** |

- `just scan-figures 16` also flags PDF p.51, which is only the library stamp (no drawing), and pp.1, 3 and 328, which are front and back matter.
- After `--write`, add `drawings:` to the two `_original` entries with the new IDs (look them up in the id_map), as done in 7b0bc50ef.

## After the write

Run these in order:

1. `postfix16.py <root>`: translations only. Since d08a2fb03, `set_french` carries the `_original` headings itself.
   - It moves the translated headings to the `# TODO` of their day (headmoves, trailing date lines).
   - It promotes 42 translated date lines to `# …` and moves 3 inner date lines up.
   - It removes the footnote definitions the rebuild copied with 102.0155 into cz and en 103/1884-01-12 that have no reference there.
2. `../rsrpost.py <root> . 16 101 … 106`: the RSR notes for the source corrections below.
3. `../drawpost.py <root> .`: the `drawings:` frontmatter and the WebP files (see Drawings).

## Source corrections in old text (apply session, 2026-09-28)

Owner decision (tome 11 answer 4, 2026-09-28): the printed edition's obvious typesetting typos are corrected, with an RSR note citing the page. `build16.py` (last section) applies them through `set_french`. `../rsrpost.py` adds one RSR note per paragraph in `_original`, and `rsrnotes.json` lists them.

- **Typesetting typos, 44 from `typostate.json`.** Each row is docx-checked: «docx=WRONG» means the docx carries the same misprint. Examples:
  - vouiez, qelqu'un, ridcule, combient, amouresue, filile, Villevieillle, Montmjartre, ococupe, expostion, Hharkoff, «lais» → «mais», «pille» → «fille», bruquement;
  - «Aanchine» → «Kanchine», «Madi» → «Mardi», «simpl*ement» → «*simplement».
- **Kept as possibly Marie's own:** accent-only and single/double-consonant variants and one anglicism: enervée, détèste, éxemple, Zolà, plaisaît, colonnel, Ambasadeur, demoiseles, imposible, neni, réusi, ocuper, pourait, chemmin, Metting. Also kept: the rows the check confirmed as words (meuvent, fourrait, vida).
- **Accents lost at import, 34 paragraphs** (32 of them in 106, plus 104.0210 «félibres» and 105.0184 «déclassé»). The words are printed with accents but were stored without them. `accentfix.py` restores them token by token from the docx, changing only tokens that differ by diacritics alone.
- The translations get the tool's ED SOURCE CHANGED note. The meaning is unchanged.

## Prerequisite (mechanical, inside the carnets)

Not needed any more. Since d08a2fb03, `renumber-check` skips footnote labels such as `[^102.1224.N]` (uk/102/1883-12-24.md), so `prereq.sh` is not run.

## Gates (fresh worktree at ba398e4b7, then prereq, then `--write`, then postfix16)

- `rebuild-carnets --write`: OK, 1,799 file operations.
- `renumber-check`: PASS for 101, 102, 105 and 106. There are 2 WARNs about dropped references in comments: the RSR note of 106.0001 cites 104.0796, and a uk FAB note cites 106.0391 of the duplicate block.
- 103 and 104 each FAIL on `_original/_glossary/people/mentioned/LOUISE_BRESLAU.md:117`: «(103.1884-03-30)», «(103.1884-03-16)», «(104.1884-04-30)». These are false positives that exist before the rebuild too (carnet + date citations read as IDs), the same family as tome 11's GEORGES.md. The fix is outside these carnets: write them «(103, 1884-03-30)», or teach the checker.
- `verify-carnet` on _original, cz, uk, en and fr × 101–106: PASS with 0 fail and 0 warn, all 30.
- `splicescan`: empty, all 30.
- `check-comments`: OK for all five trees.
- `source-completeness 101–106`: 0 missing diary text. The only unmatched tome paragraphs are the withdrawn title pages above (¶27–30, 738–749, 1522–1523, 2445–2446, 3271–3272, 4108–4110) and three date lines that are normalised headings (¶435, ¶2519 «1 er», ¶4100).

## Translation state after the rebuild

- **Approval flags are reset** in 30 (101), 14 (102), 88 (103), 76 (104), 61 (105) and 5 (106) entries per tree.
- **New paragraphs** get `TODO` scaffolds (fr: the embedded copy).
- **`# TODO` headings remain** for the new empty-day entries and for 3 entries whose old heading named the wrong day (cz 40 files, uk 34, en 35).
- **en has no visible date line** for some of 104's plain date-line paragraphs (06-10 … 06-19). That was already the case before, and those entries still show no heading in en.
- **uk text is carried intact** (the 2026-09-26 cloud fablelous pass). The only uk text dropped is the uk rendering of the duplicate 106 August block, whose 105 twins keep their own FAB'd uk. None of 105's August paragraphs in any tree is a TODO at HEAD.

## Owner questions

1. **The reading notes on Livre 102's front pages** (¶741–749: Revue des deux Mondes, «Conscience», Hartmann…) are probably Marie's, but they sit with the title page. Keep them as `other` paragraphs at the start of 1883-10-16 (before the date heading), or leave them withdrawn as now?
2. **The signature facsimile on p.311** comes after the edition's «[Marie Bashkirtseff est décédée le 31 octobre 1884]», which is left out as the editors' note. Link it as a drawing of 106/1884-10-20 (prepared), or leave it out?
3. **Four misdated days** are kept as Marie wrote them, while the files follow the calendar or the sequence:
   - 101 «Mardi 26 août» → 1883-08-28, and «Mercredi 27 août» → 1883-08-29 (was `-evening`);
   - 105 «Samedi 8 septembre» → 1884-09-06;
   - 105 «Jeudi 7 octobre» → 1884-08-07.
   Agree?
4. **103.0729–0730**, the mother's note at the end of notebook 103, is kept as `other`. Is that right?
