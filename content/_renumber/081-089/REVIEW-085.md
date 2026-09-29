# 085 rebuild plan — review (worker C, 2026-09-28)

Plan: `final/plan-085.json`, built by `tools/fix_085.py` (helpers `tools/fixlib_c.py`) from `common/plan-085.json`.
Edit log: `final/fixlog-085.txt`. Dry run with 086: `final/dry-085-086.out` (not rejected; the only warnings are
«old embedded French not found» on the rewritten heading clusters).

## Summary

- **104 entries** (8 added), **643 paragraphs**: 475 old carried, **168 new**, 0 dropped, 0 moved in/out.
- **31 `set_french`**: 9 heading strips, 21 label restorations («[Mots noircis: …]» etc.), 1 placeholder normalisation
  (085.0437), 1 accent fix (0129), 1 OCR fix (0400) — 0400 carries two of these.
- Approval flags reset in 45 of 104 entries per translation tree.
- Kinds: new letter ×1, editorial ×2, margin ×1, other ×1; old letter ×1.

## Decisions

- **Livre 86 boundary.** The draft's entry «1878-06-27» was built from the Livre 86 title page (¶957–965, printed p.69:
  Marie's index lines «Dessin 3 octobre 1879 / peinture 30 septembre 1878 / reçu médaille 14 janvier 1879 / 27 juin 1878 /
  Verdi -Prince Impérial / hautbois / Lettres à Jeanne, Daillens, Gavini. / [Deux lignes cancellées] / Je m'attendais à
  faire dans ce monde…»). All withdrawn. 086.0089 goes back to 086 (16 Aug 1879, its own place, docx ¶1074; the title page
  repeats that sentence). The draft's move 086.0089 → 085 is rejected.
- **«- suite» date lines.** ¶62 «Vendredi 25 avril 1879 - suite / voir pour y croire.» (continuation of 25 April from Livre 84)
  → entry 1879-04-25 with heading «Vendredi 25 avril 1879 - suite» and text «voir pour y croire.». ¶146 «Dimanche 11 mai 1879
  - suite / que je ne sais plus quoi.» (scan p.10 checked: the line completes 10 May's «C'est dommage pour la Postérité que
  je…») → 11 May heading «Dimanche 11 mai 1879 - suite», first paragraph «que je ne sais plus quoi.», 085.0055 loses its
  heading (set_french).
- **Headings glued to the previous day's paragraph.** 085.0062 (Mardi 13 mai), 0080 (18 mai), 0094 (20 mai), 0118 (24 mai),
  0294 (28 juin), 0330 (4 juillet), 0364 (13 juillet), 0400 (21 juillet) carry the next day's heading, but their text belongs
  to the day before (docx). The heading is removed by `set_french`; the next entry gets it from the plan's `heading`.
- **29 July.** «March 29 juillet 1 879» (¶884) is the OCR of «Mardi»; bare date line → entry 1879-07-29 holding old 085.0421
  («[Aucun texte - date seule mentionnée]»).
- **2 August.** 085.0437 «[Aucune entrée pour cette date.]» → «[Aucun texte - date seule mentionnée]» (¶903 is a bare date line).
- **Labels restored** (set_french from the docx logical paragraph, page-break halves joined): «[Mots noircis: …]» /
  «[Mot noirci: …]» had lost their label in 0227 0251 0266 0269 0277 0280 0304 0320 0324 0335 0336 0338 0344 0410 0443 0445
  0455, and (inline pass: «[x]» whose docx reads «[Mots noircis: x]») 0387 0423 0432 0441; 0251 and 0269 had also lost the struck words themselves («[Mots noircis : déjà]», «[Mot noirci: pleure]», «[Mots
  noircis: le souffle me manquer]»). 0304 keeps «Elle n'a» (docx OCR «elle n'ai»).
- **Tiler:** 085.0025's prefix completion was a duplicate of 0024's end (page break) → removed.
- **Kinds.** Removed false letter guesses 0030 0147 0206 0404; removed editorial/rayé guesses on 0178 0310 0340 (a day heading
  plus an inline struck line: no kind, so the heading is not struck through). 085.0359 (already `> `-quoted) → letter,
  «Invitation de Marie à Bojidar Karageorgevitch, signée «la mère Couvelet», 11 juillet 1879». ¶633–637 → one `letter`
  paragraph: «la note suivante» Marie had Mme de Bailleul drop at the Figaro and the Pays, signed «Un abonné, revenant de
  Londres» (small type; not a clipping — it was never printed as far as the diary says; «L'émotion et énorme» kept as printed).
  ¶365 and ¶369 «[MOITIE DE PAGE BLANCHE]» → editorial. ¶604 «[En travers: …]» margin (draft).
- **¶265 «[Annotation: 1905. … M. Bashkirtseff mère. 1905]»** → kind `other`, source «Annotation de la mère de Marie
  (M. Bashkirtseff mère), 1905»: it is not Marie's hand (flag).
- **OCR** fixed in new text: «qu'/7 *faut*» → «qu'il *faut*» (¶502), glued page numbers «nos 18 fenêtres», «sans 43 parler»
  removed, page-break line breaks joined. Old 0400 «('Exposition» → «l'Exposition».
- **Accents:** only 085.0129 (1 word) in this carnet.
- Dialogue dashes: fix_common restored «- » from the docx list numbering in new text (¶213–226, ¶444–469, ¶524–528 …
  sampled against printed p.16, ¶213–228: correct, including the dash before «"Cette créature extraordinaire…»).

## Printer's typos corrected (owner policy 2026-09-28)

Each correction is noted in the paragraph's RSR (`rsr` for new paragraphs, `_rsr` for old ones). Marie's own spellings
and «[sic]» cases (e.g. «gambettai [sic]») are kept. OCR artefacts fixed without a note: hyphen-space splits such as
«sang- froid», «peut- être» joined.

| printed | corrected | paragraph (old ID or docx ¶) | Mon Journal t.13 |
|---|---|---|---|
| belle toille | belle toile | new ¶158–161 | p.11 |
| me condurie | me conduire | new ¶461 | p.33 |
| respécter | respecter | new ¶527 | p.37 |
| asurément | assurément | new ¶545 | p.39 |
| d'aillleurs | d'ailleurs | new ¶613 | p.44 |
| intellignece | intelligence | new ¶644 | p.46 |
| aussi madade | aussi malade | new ¶656 | p.47 |
| réssusciter | ressusciter | 085.0294 | p.50 |
| m'empécher | m'empêcher | new ¶609 | p.44 |
| L'émotion et énorme | L'émotion est énorme | new ¶633–637 | p.46 |

## Facsimiles

None in 085: the scan has no reproduced programme or clipping in this range (the only picture region is the 28 June
drawing on p.50). The note to the newspapers (¶633–637) and the 14 Sep menu are typeset text, not facsimiles.

## Withdrawn cover pages

| docx ¶ | printed | text |
|---|---|---|
| 50–56 | p.5 (before the title) | «Dessin 3 octobre 1877 / peinture 30 septembre 1878 / reçu médaille 14 janvier 1879 / mardi 27 juin 1878 / dimanche 27 janvier 1878 : 5 femmes / arrangement tranquille 83 p. 140 / Verdi - Prince impérial» |
| 57–61 | p.5 | «Gloriae Cupiditas / Livre 85ème / commencé le samedi 26 avril 1879 / terminé le mercredi 6 août 1879 / Paris, Avenue Montaigne 34» |
| 957–965 | p.69 | Livre 86 title-page index: «Dessin 3 octobre 1879 / peinture 30 septembre 1878 / reçu médaille 14 janvier 1879 / 27 juin 1878 / Verdi -Prince Impérial / hautbois / Lettres à Jeanne, Daillens, Gavini. / [Deux lignes cancellées] / Je m'attendais à faire dans ce monde tout autre chose que ce que j'y fais et du moment que ce n'est pas ce que je croyais peu m'importe ce que cela peut être.» (listed also in REVIEW-086) |

## Drawings

- `drawings/085/tome13-p0050-1.webp` (709×442, 28 KB, cut at 600 dpi from the image region of PDF p.51): pen sketch of a
  figure reclining on a day bed, printed after «Il fait trop chaud pour que je puisse écrire.» (28 June 1879, docx ¶708
  picture). Anchor: old 085.0301 in 1879-06-28.md. Caption «Croquis à la plume : une femme étendue sur un lit de repos».
- Other candidates checked, no drawing: p.18 (¶267), p.43 (¶607), p.56 (¶806: page-break slot; p.56 has Marie's invitation
  in small type = old 0359).

## Owner questions

1. ¶265: the 1905 annotation by Marie's mother, kept as `other`. Keep it in `_original` at all?
2. Heading strips (9 clusters) and label restorations make the translations show «SOURCE CHANGED»; the translated headings
   of the stripped clusters must be moved to the next entry (post-apply, mechanical as in 068).
3. ¶633–637 as `letter` (a note to newspapers) rather than `clipping` — OK?

## Post-apply

- Drawings frontmatter for 1879-06-28 (anchor = new ID of 085.0301); copy the WebP to
  `src/frontend/public/images/marie/drawings/085/`.
- Move the translated day headings off 0055 0062 0080 0094 0118 0294 0330 0364 0400 into the next entry (replace `# TODO`).
- Glossary tagging for the 168 new paragraphs.

## Lead review (resumed session, 2026-09-28)

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_085.py`)

- 085.0387: the extraction had bracketed the wrong words («meilleure que [celle que j'use ici bas]»); now «meilleure que [Rayé: la mienne d'ici] celle que j'use ici bas.» as printed (¶830), and «testatmenet» → «testament» (printer's typo, RSR note).
- 085.0142: printer's typo «noirici» → «noirci» (label; old cluster).

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

## Title-page notes restored (applier, 2026-09-28 night)
Owner policy in the handoff («Marie's own notes on title pages go in as margin/other at the first entry»): the
Marie-written lines listed above under «Withdrawn cover pages» that are not the title formula (Gloriae Cupiditas /
Livre N / commencé–terminé / addresses) are now `margin` paragraphs (source «note de Marie sur la page de titre du
Livre N») at the start of the first entry, inserted by `tools/title_notes.py`. The formal title lines stay withdrawn.
