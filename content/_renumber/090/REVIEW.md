# Rebuild of carnets 090–094 (tome14.docx): review (2026-09-28)

Plans: `CCC/plan.json` (090–094), applied together with `just rebuild-carnets`. Draft by `just rebuild-draft-plan` (2026-09-28), every judgement point reviewed per carnet against tome14.docx and the printed «Mon Journal» t.14 (Tome14.pdf). Owner policy of 2026-09-27/28: manuscript order, missing French inserted, kinds for letters/clippings/rayé/margin/editorial, no cover entries, edition footnotes out, empty days as «[Aucun texte…]» entries.

The tome 14–15 apply steps are in `090/APPLIED.md`. Per-carnet notes follow; the planner's summary, owner questions and post-apply edits are in the commit messages and the lead's report.



## Withdrawn cover pages (owner policy: no cover entries)

Not added to `_original`; recorded here. The manuscript itself is not scanned; these are the printed edition's readings.

- **Before Livre 90** (tome14 ¶43–53, p.5): flyleaf lines in small type «Dessin 3 octobre 1877 / Peinture 30 septbembre 1878 / Médaille 14 janvier 1879 / Peinture 30 septembre 1878 / préd. d'Edmond, livre 75 / page 139, livre 89, arrangemement sage / Ceux que je choque et qui ne veulent pas de moi ne sont pas de l'espèce de ceux dont je voudrais.»; title page «Gloriae Cupiditas / Livre 90ème / commencé le dimanche 3 octobre 1880 / terminé le 22 janvier 1881 / 34 avenue Montaigne, Paris».
- **¶908** (p.71, small type directly above the Livre 91 title): «Faire vite que du nu et en fin Décembre aller à Biarritz ou Nice et là en plein air peindre Aradnié, effet du soleil levant si Tony approuve.» Withdrawn as flyleaf text; **owner question**: keep it as a `margin` paragraph at the end of 090/1881-01-22?
- **Livre 91** (¶909–912, p.71): «Gloriae Cupidatas / Livre 91 ème / commencé le dimanche 23 janvier 1881 / terminé le samedi 14 mai 1881 / 34, avenue Montaigne, Paris».
- **Livre 92** (¶1731–1735): «Gloriae Cupiditas / Livre 92ème / du dimanche 15 mai 1881 / au jeudi 18 août 1881 / 34, avenue Montaigne, Paris / Gavronzi, Poltava, Soumy, Kiev, Varsovie, Berlin-Paris».
- **Livre 93** (¶2402–2406): «Gloriae Cupiditas / Livre 93ème / du jeudi 18 août 1881 / au mardi 22 novembre 1881 / 34, avenue Montaigne, Paris / Biarritz, Burgos, Madrid, Séville, Cordoue, Grenade».
- **Livre 94** (¶3044–3047, p.257; was old 093.0141, now dropped): «Gloriae Cupiditas / Livre 94ème / du mercredi 23 novembre 1881 / au samedi 29 avril 1882 / Paris, 34, avenue Montaigne / Nice, du 29 janvier au mercredi 13 avril.» (OCR «Gioriae»).

---

# Carnet 090

## 090 rebuild plan: review notes (tome14, 2026-09-28)

Range: tome14.docx ¶54 («Dimanche 3 octobre 1880») to ¶905 (end of «Samedi 22 janvier 1881»). Livre 91 title page is ¶909–912 (printed p.71), and «Dimanche 23 janvier 1881» (¶913) comes after it. So **23–31 January 1881 belong to 091**. The draft already puts them there, and 090 ends with 1881-01-22. This matches the covers: Livre 90 «terminé le 22 janvier 1881», Livre 91 «commencé le dimanche 23 janvier 1881». The letter ¶947–955 (29 Jan) is also in 091, so it is for 091's reviewer.

Result: 112 entries and 648 paragraphs (476 carried, 172 new, 0 dropped). 53 paragraphs move out to 094. Dry run (090–094 together): 0 errors, no 090 warnings.

### Changes to the draft
- **Removed all 19 draft completions** (`set_french`): 0003–0063 (17) and 0133, 0135. `_original` splits each docx paragraph into one cluster per sentence, so every "missing" word is already in the following clusters (0134 and 0136 hold the rest of ¶207 and ¶208). I checked with a word diff that the docx and the plan agree for 3, 5 and 12 Oct and other days.
- **Labels restored** (`set_french`, old text kept otherwise):
  - 0055: `~~on sait que~~` → «[Rayé: on sait que]» (docx ¶85)
  - 0064: «[Mots noircis: et la]», «[Mots noircis: et qui]» (docx ¶92)
  - 0287: «[Rayé: et les rhumes]» (docx ¶443)
  - 0140: «[persifleur en travers]» → «[En travers: persifleur]», kind margin. This is the same thing as docx ¶214, so the draft's new ¶214 paragraph is removed (no duplicate).
- **Dates and entries:**
  - ¶254 «Dimande 31 octobre 1880» (so printed, p.22). The draft had made the date line a text paragraph of 30 Oct. Now 1880-10-30 is «[Aucun texte…]», and a new entry **1880-10-31** has heading «Dimande 31 octobre 1880» (printed form kept, flagged) and «[Aucun texte…]».
  - 4–6 Nov: the draft put old 0172 (heading Jeudi 4 + «Saint Amand est venu.») under 5 Nov and duplicated its sentence as new under 4 Nov. Fixed: 4 Nov = 0172, 0173.
  - The print (p.22) shows «Vendredi 5 novembre» as a bare date line and «Samedi 6 novembre 1880 / Saint Amand est venu.» after it. The docx ¶269 runs these together. So 0174 (heading Vendredi 5) gets `set_french` «[Aucun texte - date seule mentionnée]». New entry **1880-11-06** has heading «Samedi 6 novembre 1880», a new «Saint Amand est venu.» (¶269), then 0175–0178, which moved from the old 11-05 file.
  - ¶382 «Vendredi 26 novembbre 1880»: the draft had made the date line text in 25 Nov and moved 0249 into 25 Nov. Restored the entry **1880-11-26** = 0249 (old file 1880-11-26.md, heading already in the cluster).
  - 25 Dec: removed the draft's new «- Noël». It is part of the heading, which 0423 already has.
  - 13 Jan 1881: heading «Jeudi 13 janvier 1881 - (1er janvier)» (printed p.63 has the parentheses). Removed the stray new paragraph «- (1er janvier)».
  - 17 Nov: restored manuscript order 0218, 0219, 0220, 0221, 0222. The draft had swapped the two «Quel écœurement !» paragraphs, but the docx ¶339–343 order equals `_original`.
- **Kinds:**
  - 0086 and 0091 → `letter` with `> `-quoted `set_french`. These are the two telegrams (Poltava nobility to Marie, received 11 Oct; Marie's telegraphic reply).
  - ¶191 «[En travers: Vous est-il arrivé…]» clipping → **margin** (small type, «En travers»).
  - ¶703 «[ L'amour vrai…]»: kind **removed**. It is set in normal body type on p.54, not the small margin type, so it is Marie's own bracketed sentence.
  - ¶718 «[Deux lignes cancellées]» stays **rayé**: it is in small type on p.55, like 0378 and 0472, and 066/067 give the same precedent.
  - The old kinds 0103 margin, 0162 rayé, 0169 rayé, 0374 margin, 0378 rayé and 0472 rayé are confirmed.
  - 0181–0187 (Mouzay letter) and 0443–0444 (note to Julian) already carry `letter` in `_original`, so 0186 and 0444 are confirmed as they are.
- **OCR in new text:**
  - Dialogue dashes are restored as «— » (the carnet's convention) on 14 new lines where the print has «-» and the OCR dropped or garbled it: p.62 «Faites un speech…», p.65 «Oui, Monsieur…», p.66 ×5, p.67 ×7.
  - ¶847 «I!» → «!!» (print p.66).

### Flags (not changed)
- ¶698 «Ls cartes de Caillas…»: the print (p.53) also reads «Ls». Kept, probably a misprint for «Les».
- 1880-12-21 «Mercredi 21 décembre 1880»: 21 Dec 1880 was a Tuesday, and 22 Dec is also «Mercredi». This is Marie's slip, kept.
- ¶529 «1180» is an OCR slip; the heading uses 1880.
- These old `_original` OCR slips are not touched (no set_french): 0225 «sans issue 11!» (read «!!!»), and the ¶376 cluster «(Mots noircis: qu'il est nécessaire]», where the bracket is mismatched in the docx too.
- The 1882-04 files (090.0477–0529 → 094) are confirmed. Docx ¶3647–3726 lie inside Livre 94, whose successor Livre 95 begins 30 April 1882. 094's reviewer places them.
- The figure candidate on p.51 (docx ¶676 picture, 29 Dec) is not handled; drawings are outside this plan.

### Withdrawn cover pages (not added)
- **Before Livre 90 (¶43–53, printed p.5).**
  - Flyleaf lines in small type: «Dessin 3 octobre 1877 / Peinture 30 septbembre 1878 / Médaille 14 janvier 1879 / Peinture 30 septembre 1878 / préd. d'Edmond, livre 75 / page 139, livre 89, arrangemement sage / Ceux que je choque et qui ne veulent pas de moi ne sont pas de l'espèce de ceux dont je voudrais.»
  - Then the title page: «Gloriae Cupiditas / Livre 90ème / commencé le dimanche 3 octobre 1880 / terminé le 22 janvier 1881 / 34 avenue Montaigne, Paris».
  - Note: withdrawn-covers.json for 090 lacks the «Gloriae Cupiditas» line (¶51).
- **¶908 (printed p.71, small type, directly above the Livre 91 title):** «Faire vite que du nu et en fin Décembre aller à Biarritz ou Nice et là en plein air peindre Aradnié, effet du soleil levant si Tony approuve.» The draft had it as the last paragraph of 22 Jan. I removed it, as a flyleaf line before a Livre heading.
  - **Question for the owner:** it is Marie's working note, probably written in autumn 1880, since it plans for «fin Décembre». It could sit on the last page of Livre 90 or the first flyleaf of Livre 91. If it should be kept, re-add it as a `margin` paragraph at the end of 090/1881-01-22 (rsr: tome14.docx ¶908, Mon Journal t.14 p.71).
