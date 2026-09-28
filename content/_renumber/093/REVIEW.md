# Carnet 093

## 093 (Livre 93, tome14.docx ¶2402–3043) — plan review notes

Coverage: every docx paragraph ¶2407–3043 is in the plan (old or new), checked with 3-gram containment per day. `_original` 093 is accent-stripped; old clusters often join several manuscript paragraphs and are cut at page breaks (e.g. 0041/0042 «et où il | demeure»). Left as they are.

### Decisions
- **1881-08-18 (new entry, ¶2408–2413, p.193–194)**: kept. Livre 93 opens with a second «Jeudi 18 août 1881» (092 also has 1881-08-18). Not duplicated in 092.
- **Removed the new «impression.» (¶2795)**: it is the tail of ¶2792 split by the page break (p.230/231). Old 093.0099 already starts with «impression.», so no text is lost. The orphan line at the start of 0099 is left as it is (cosmetic, no set_french).
- **26/27 Sept (¶2628 «Lundi 26», ¶2629 «Mardi 2.7 septembre»)**: 26 Sept has no text. 093.0070 (heading «Lundi 26» + all of the 27 Sept text) keeps its ID in 1881-09-26, with `set_french` «[Aucun texte…]». New entry **1881-09-27** «Mardi 27 septembre 1881» holds ¶2630–2634 as new paragraphs (docx text), then 0071, 0072.
  - FLAG: 0070 had footnote [^1] (Fontarabía). The marker is gone and the definition stays orphaned in the 09-26 stub. Re-attach it by hand to «Fontarabie» in the 09-27 paragraph (¶2632). The 0070 tag lines (Karaouleff, Bayonne, Fontarabie, Marseille…) also stay on the stub, so the new paragraphs need re-tagging.
- **1/2 Oct (¶2649 «Samedi 1er octobre 1881 Dimanche 2 octobre 1881», printed as two date lines on p.215)**: 1 Oct has no text. 093.0073 gets `set_french` «[Aucun texte…]» in 1881-10-01. New entry **1881-10-02** «Dimanche 2 octobre 1881»: new ¶2650 (the bullfight paragraph, docx text; «fit- on»→«fit-on» and «soit- disant»→«soit-disant» are line-break artefacts), then 0074–0078. I removed the draft's bogus new paragraph «Dimanche 2 octobre 1881». Tags of 0073 stay on the stub.
- **10/11 Nov (¶2987–2988, p.251)**: 093.0133 held «# Jeudi 10 novembre» plus the text line «Vendredi 11 novembe 1881». Both days are empty. 0133 gets `set_french` «[Aucun texte…]», and there is a new entry **1881-11-11** with «[Aucun texte…]».
- **Dropped 093.0141**: it is the Livre 94 title page (see withdrawn covers). Its footnote [^3] (Gioriae) went with it. The dry run moved the cz/en footnote definitions from 0141 to 0140 correctly.
- The existing «[Aucun texte…]» stubs (0001 19 Aug, 0009 22 Aug, 0030 26 Aug, 0038 30 Aug, 0039 31 Aug) match the docx date lines ¶2414, 2427, 2457, 2471, 2472. No kind.
- All 30 draft empty days (Sept–Nov) are checked against the docx date lines and the weekdays. All are correct, and there is no date line without an entry.

### Kinds
- 0005 `margin` («[Dans la marge: …]», ¶2419, small type) and 0006 `margin` («[En travers: …]», ¶2420) are confirmed.
- No letters. «Voici un brouillon de lettre à Julian» (0108) and «voici la lettre» (0083) do not copy the letters.
- Small-type notes sit INSIDE multi-paragraph old clusters and are left inline without a kind: ¶2590 [Dans la marge] and ¶2600, 2606 [En travers] in 1881-09-23; ¶2673 [En travers] in 10-01/02 (0075–0078); ¶2908 «[TROIS QUARTS de deux pages blancs]» (editorial) in 10-29; ¶2963 «[Ajouté : …]» in 11-06 (0128). Splitting them out would need set_french + new paragraphs. Owner: split or not?

### Headings
- «Vendredi 11 novembe 1881» is kept as printed (p.251), whether it is Marie's slip or the edition's.

### OCR / text flags (new text)
- ¶2650: «d”échapper» as in the docx (print d''échapper, old text d"echapper). A typo in the print, kept.
- ¶2410: «étangère» (étrangère) is printed so on p.194 and kept. «d’avantage», «j’aurai du» are Marie's.

### Withdrawn cover pages
- Livre 93 title (¶2402–2406) is already in withdrawn-covers.json.
- Livre 94 title (old 093.0141, docx ¶3044–3047, p.257): «Gloriae Cupiditas / Livre 94ème / du mercredi 23 novembre 1881 / au samedi 29 avril 1882 / Paris, 34, avenue Montaigne / Nice, du 29 janvier au mercredi 13 avril.» (the docx OCR reads «Gioriae»). withdrawn-covers.json has only «Livre 94ème» for 094: please complete it.
