# REVIEW 061 (Livre 61, 21–28 May 1876, Genoa/Nice) — final plan

Built by `tools/fix_061.py` from `common/plan-061.json` (log: `final/fix-061.log`). Dry run accepted (rc 0).
The only warnings are footnote moves: definitions that lived in the dropped 061.0217 (en and uk) move to their referring
clusters, and the en [^1] of the dropped motto moves as well (see «After --write»).

## Summary counts

| | |
|---|---|
| Entries | 7 (first entry renamed back to **1876-05-21-22.md**) |
| Old paragraphs carried | 212 |
| New paragraphs | 82 (common had 83; the motto ¶1048–1049 was removed) |
| Dropped | 5 (061.0002, 0003, 0004, 0216, 0217) |
| set_french | 5 OCR fixes. The drafter's completion of 061.0029 is removed. |
| Kinds | editorial 3, margin 3 (unchanged from common) |

## Withdrawn cover pages

- **Livre 61 title page**, docx ¶1044–1049, Mon Journal t.8 p.87 (¶1044–1045 are handled in 060):
  - ¶1046 «Livre 61e»: withdrawn by common08 (common/withdrawn-061.json).
  - ¶1047 «Depuis le dimanche 21 mai 1876 / jusqu'au dimanche 28 mai 1876 / Un jour à Gènes, hôtel de Londres, puis Nice.»
    = **061.0002**, dropped.
  - ¶1048 «*Amans ita ut fax, agitando ardescit magis*» = **061.0003**, dropped.
  - ¶1049 «*Publius Syrus*» = **061.0004**, dropped.
  - The common plan also had ¶1048–1049 as a new paragraph, which duplicated 061.0003–0004. **Removed.**
- **Livre 62 title page, first line**, docx ¶1348, Mon Journal t.8 p.117: «*Gloriae cupiditate* / H[is] G[race] t[he] D[uke]
  o[f] H[amilton]» = **061.0216**, dropped. The rest of that title page (¶1349–1354) belongs to the 062 plan.
- All the drops above use the reason «title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is
  scanned)», followed by the docx ¶ and the page.
- Kept at the end of 061, as Marie's diary text: 061.0215 «Mari, femme, duc, amour, Gioia *.» (¶1346–1347, p.115, roman).

## Drops

- 061.0002–0004 and 061.0216: see above.
- **061.0217**: an empty cluster. _original, cz, uk and fr hold only a 2025 RSR summary of the 28 May entry in it. en has the
  placeholder «[End of Cahier 61]». Neither is manuscript text, so it is dropped (convention 4). The uk CON verdict and the
  footnote definitions that followed it are entry-level notes or referenced definitions, and they move with the entry.
  The RSR summary itself is lost; it is not important.

## Splits/moves

- The first entry is **1876-05-21-22.md**, the old _original name, and not the drafter's 1876-05-21.md. The date line
  (docx ¶1050) is «Dimanche 21 mai 1876 - lundi 22 mai 1876»; the `heading` field is set to it. The first paragraph is
  now 061.0001, whose heading is «# Dimanche, 21 mai 1876 - Lundi, 22 mai 1876» (old comma style, left as is).
- There are no moves between days or carnets.

## Completions

- 061.0029: the drafter's `set_french` is **removed**. docx ¶1075 is split over two clusters in _original: 061.0029
  («Et faut-il être mauvais !… de ne pas le dire.») and 061.0030 («Je sais que personne…la première.»). The completion
  would have duplicated 061.0030. Both clusters are kept as they are. 061.0030 was reported «not found» only because of that split.

## Kinds (with sources)

The kinds are unchanged from common:
- New ¶1256 is `editorial` and ¶1257 is `margin` «Annotation de Marie».
- 061.0155 is `editorial` and 061.0156 is `margin` «Annotation de Marie».
- 061.0169 is `editorial` and 061.0170 is `margin` «Annotation de Marie, 1882».

The drafter's `other` guesses are gone. There are no letters or clippings.

## set_french list (OCR, checked against the print)

- 061.0013 «Bon Dieu 1 Faut»→«Bon Dieu ! Faut» (p.88)
- 061.0021 «tout cela 1»→«tout cela !» (p.89)
- 061.0101 «sollicitude[^6] 1 En»→«… ! En» (p.98)
- 061.0182 «Ville Étemelle»→«Ville Éternelle» (p.111)
- 061.0205 «plaisir 1 et»→«plaisir ! et» and «(il y a toujours *et puis,}*»→«*et puis,*)» (p.114)

## OCR/typo fixes in new text (noted in each rsr)

- ¶1135 «mais., mais»: the print has «mais.. mais» (p.94), a typesetting slip, corrected to «mais... mais».
- ¶1218 «Croyez- vous»→«Croyez-vous» (p.101).
- ¶1220 «soi- même»→«soi-même» (p.101–102).
- ¶1232 «pas 1& temps»→«pas le temps» (p.103).
- ¶1234 «amour- propre»→«amour-propre» (p.103).

## Kept but flagged

- Draft «uncertain alignment» 061.0216 ↔ ¶1045: this is the repeated Gloriae/H.G. formula, which heads both title pages. It is moot now, because both are withdrawn.
- 061.0016 has the footnote marker inside a word, «abracadabrant[^3]s». It is left as is (not OCR, just a marker
  position); it can be fixed with the footnote tooling later.

## Drawings

None on the pages I viewed (p.87, 94, 103, 114, 115, 117). `final/drawings-061.json` = [].

## After --write (applier)

- Turn the `_rsr` keys on 061.0013, 0021, 0101, 0182 and 0205 into RSR comments.
- Check en 061/1876-05-21-22.md for a stray `[^1]:` definition (the Publius Syrus gloss). The tool moved it to the
  dropped motto cluster; if it survived as an orphan, delete it.

## Open questions for the owner

- None.
