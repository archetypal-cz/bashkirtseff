# Carnet 099

## Notes: plan-099 (Livre 99, tome15.docx ¶2559–3410, 31 Mar – 26 May 1883)

Plan rebuilt by `build099.py` in the work dir, from the draft. Result: 57 entries (every day from 31 Mar to 26 May), 395 old paragraphs carried, 47 new, nothing dropped.

### Decisions
- **8 April (¶2667 «Dimanche 8 août 1883», an edition misprint)**:
  - The new entry 1883-04-08 holds 099.0091–0097 in manuscript order. The draft had put 0091–0093 under 7 April and the rest in an «08-08» entry.
  - 099.0091–0097 and 100.0209–0217 are the same text (docx ¶2668–2673). I kept the 099 set: it is accented, follows the docx paragraphs and has the footnote. 100.0209–0217 are dropped in plan-100.
  - The draft's «not found» for 0091–0096 was a matcher miss: the text is in the docx.
- **¶2839 «Samedi 26 août 1883» is Saturday 28 April 1883.** It stands between Friday 27 and Sunday 29 April. The day before mentions the services of Holy Week, and the Easter-eve midnight mass fits Orthodox Easter on 29 April 1883.
  - The file is 1883-04-28.md, heading «Samedi 28 avril 1883», with new text from ¶2840–2850.
  - The first paragraph's RSR note records the printed date.
  - Checked on the scan: «faie» is printed that way and kept.
- **The «[Pas d'entrée pour cette date]» stubs 0040 (5 Apr), 0132 (16 Apr) and 0134 (17 Apr)**: each day has a date line with nothing under it (¶2608, ¶2717, ¶2718), so each gets `set_french` «[Aucun texte - date seule mentionnée]». 26 April (¶2810) stays as the draft's new empty entry.
- **14 May**: the draft's new paragraph «Lundi 1 4 mail 883» was the date line itself, so I removed it. 0367 («# Lundi 14 mai 1883») and 0368 get their own entry, 1883-05-14.md (the draft had merged them into 13 May).
- **24 May (0393) and 25 May (0394)**: each day was one cluster with the copied letters inside. I split them.
  - Each cluster keeps its opening lines verbatim with `set_french`: 0393 up to «La meme chose ici. Je lui ecris:», 0394 up to «Voici ce que je recois:».
  - The rest of each day is new text from the docx: one paragraph per manuscript paragraph, and one `letter` paragraph per letter (lines kept together).
  - The old footnote markers [^3]–[^9] (24 May) and [^3] (25 May) are put back after the same words in the new text. The definitions stay in the day's first cluster, in the same file; the tool warns about this, but it renders correctly.
  - The draft's 4 new paragraphs for 24 May («Monsieur,» ¶3302/3331/3344 and «Marie» ¶3310) duplicated lines already in 0393, so I removed them.
- **Letters** (small type in the print, style «Body text (2)» in the docx):
  - ¶3302–3310: Lettre de Marie à Tony Robert-Fleury (copie), 24 mai 1883.
  - ¶3315–3328: Lettre de Tony Robert-Fleury à Marie, 24 mai 1883. Marie's remarks to the reader (¶3318–3320, ¶3322) sit inside the copied letter in the same small type, so they stay in one letter paragraph; `source` says so.
  - ¶3331–3334: Lettre de Marie à Tony Robert-Fleury (copie), 24 mai 1883.
  - ¶3344–3349: Lettre de Marie à Jules Bastien-Lepage (copie), 24 mai 1883, including the «N.B.».
  - ¶3375–3379: Lettre d'Émile Bastien-Lepage à Marie, 25 mai 1883.
  - ¶3382–3386: Billet de Marie à Émile Bastien-Lepage (copie), 25 mai 1883.
  - ¶3338 ends in small type in the print («Et cette année aussi du reste… de m'indigner.», p.263), which may be an addition written across the page. It stays inline, since the docx has no label. The docx «Cette» is set to «cette», as printed.
- **0395 (26 May)**:
  - `set_french` keeps the day's text up to «Me calmer...». It drops the `---` line and the **Livre 100 title page** (withdrawn cover: «Gloriae Cupiditas / Livre 100ème / depuis le dimanche 27 mai 1883 jusqu'au mardi 7 août 1883 / Paris, 30 rue Ampère», docx ¶3411–3414).
  - The definition of its footnote [^4] is now orphaned; **delete it by hand** after the apply, in `_original` and in the translations.
- **Kinds**:
  - 0074 is dialogue («— Madame, vous allez m'intéresser…»), so its `letter` kind is removed.
  - 0113 and 0115 «[Bas de page mutilé]» are `editorial`.
  - 0142 and 0293 stay `margin`: each is a whole paragraph.
  - 0319 is split: it becomes the marginal note «[En travers: La bourse et la femme…]» (¶2962, small type), kind `margin`. ¶2963 becomes a new paragraph, with the OCR «tombe I”» read as «tombe !”» from the print (p.240).
  - The notes inside 0036 («[Dans la marge: Gabriel…]») and 0263 («[En travers: Avant le bal…]») stay inline, because in the docx they are the start of a longer paragraph.
- **Checked, no change**: the «not found» dialogue lines 0061 and 0277. Every docx paragraph of Livre 99 is in the final plan (3-gram check).

### Withdrawn cover pages
- ¶2559–2562, the Livre 99 title page (already out of the draft).
- ¶3411–3414, the Livre 100 title page, cut from 099.0395 (see above).

### Not mine / for the lead
- ¶2541–2550 is in 098's range, not 099's. It is Tony Robert-Fleury's letter on the letterhead «Palais des Champs Élysées / Association des Artistes français / pour les Expositions annuelles des Beaux-Arts», set in small type, followed by «La lettre elle-même va être épinglée ici».
  - It should be **one `letter`** (letterhead included), source «Lettre de Tony Robert-Fleury à Marie (épinglée), [date of that 098 entry]». The draft marks only ¶2541 as a `clipping`.
- 099 was already partly accent-stripped (the 23–26 May clusters, parts of 04-30 and 05-04). The old text is kept verbatim.
- 099.0392 ends with a line «---[^1]» (separator plus footnote marker); left as it is.
- The new paragraphs have no tags. The 0393 tags still cover the whole day. The glossary tagger should run on 099 after the apply.
