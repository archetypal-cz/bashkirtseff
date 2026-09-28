# Carnet 092

## 092 — plan review notes (planner for 091/092, 2026-09-28)

Range: tome14.docx ¶1731–2401 (Livre 92, «du dimanche 15 mai 1881 au jeudi 18 août 1881»). The result has 95 entries, 451 paragraphs (438 carried, 13 new, 2 dropped). Every docx date line has its entry and every weekday checks out. Completeness check: every body paragraph in the range is in the plan.

### Date lines with Julian dates and places (draft defect fixed)
- The draft turned the tail of every date line into a **new text paragraph**: «- 21 mai», «-Berlin», «- Fastow près Kiev», «- Gavronzi», and «-8 juin Mardi 21 juin 1881 - 9 juin Mercredi 22 juin 1881 - 10 juin». It also added the whole line «Dimanche 10 jullet 1881 - 28 juin» (¶2090) as text under 9 July. **All of these were removed.** Every entry `heading` now carries the full cleaned date line («Jeudi 2 juin 1881 - 21 mai», «Mercredi 25 mai 1881 - Berlin», «Jeudi 26 mai 1881 - Fastow près Kiev», «Dimanche 29 mai 1881 - Gavronzi», …).
- However, every 092 entry opens with an old cluster that has its own `# heading`, and those headings have **no** Julian date or place. A plan cannot edit a heading line: set_french leaves heading lines alone. The Julian dates therefore stay missing from the text. **Question for the owner:** do a post-apply hand or scripted edit of the `# ` lines in `_original` (and the embedded `%% … %%` headings in the translations), from docx ¶1811 and ¶1825 onward? The plan's `heading` fields give the target text.
- New entry **1881-07-10** (Dimanche 10 juillet - 28 juin, ¶2090) holds 0238–0242. `_original` already has 1881-07-10.md; the draft had lost the date line («jullet» OCR) and filed these five paragraphs under 9 July.

### Pointer stubs and common entries (split and swap)
- **12/13 June** (¶1909 «Dimanche 12 juin -31 mai» and ¶1910 «Lundi 13 juin -1er juin» are consecutive date lines; the text ¶1911–1918 follows the 13th). 0105 (13 June pointer) takes set_french = 0104's text verbatim («J'ai commencé une paysanne…»). New ¶1915–1918 follow it. 0104 (12 June) takes set_french «[Aucun texte - date seule mentionnée]». The draft had put 0104's 12-June heading inside the 13 June entry.
- **20/21/22 June**: the print (p.151) has three date lines stacked and the text under the last one, as with 12/13 June. So: 0133 (20 June) takes the placeholder, 0137 (21 June) the placeholder, and 0138 (22 June) takes set_french = 0133's text verbatim, followed by 0134–0136. New entries 1881-06-21 and 1881-06-22 reuse the old file names. **Alternative if the owner prefers:** one common entry for 20–22 June (the old «Entrée commune» reading). But the print is three separate lines, not one heading.
- **7/8 Aug**: ¶2288 «Dimanche 7 août» and ¶2289 «Lundi 8 août» are consecutive; the text ¶2290–2300 follows the 8th. 0371 (8 Aug pointer) takes set_french = ¶2290 with accents from the docx plus the marker `[^1]`. 0367 (7 Aug) takes the placeholder. 8 Aug = 0371, 0368, 0369, 0370. **Hand fix after apply:** the tool warns that the `[^1]` definition (Œdipe roi) stays in the 7 Aug file (`_original` and en). Move it to 1881-08-08.md. The LAN notes on 0367 («repetition generale»…) also stay on the 7 Aug placeholder cluster.
- The old RSR notes of 2026-09-26 on 0105/0371 («Proper fix: restructurer swaps…») stay in place and are now done.

### Drops (need the lead's confirmation)
- **092.0159** «[Pas d'entrée pour cette date]» (3 July): there is no date line for 3 July (¶1976 Samedi 2 juillet → ¶1988 Lundi 4 juillet). Old file 1881-07-03.md goes away.
- **092.0399** (12 Aug): a duplicate of 092.0402 (13 Aug). Docx ¶2345 «Eh bien j'y travaille deux heures…» occurs once, under 13 Aug. 0399 stood where ¶2338 belongs; ¶2338 («Et tout s'en mêle…») is restored as a new paragraph.

### Completions and corrections (set_french)
- **092.0103** (11 June, docx ¶1901): keeps the old start verbatim with `[^1]`, drops «[Content continues...]», and completes the paragraph with the rest of ¶1901 plus its page-break continuation ¶1904 («vide et puis le soir papa…»). ¶1904 is no longer a separate new paragraph. New ¶1905–1908 follow.
- **092.0106** (14 June, ¶1920): the old start with `[^1]`, plus the rest of ¶1920 («Quatre nouveaux extraits… par P. Orell.»). The OCR quotes «’’Sport”» are normalised to «"Sport"».
- **092.0127** (19 June): the print repeats a line across pp.150/151 («vis pas sur des roses… Je crèverai de»). 0127 held the repeat and 0128 holds it again. 0127 is cut after «il est vrai que je ne», so the paragraph now reads once: 0127 + 0128. I judge this an edition typesetting error; flag for the owner.
- Straight apostrophes are used in set_french, as in the old text. The new paragraphs keep the docx «’», as elsewhere in the draft.

### Kinds
- 092.0120 and 0121 «[En travers: Quand on objecte… Enfin I]» are `margin` (small type, p.150). The print reads «Enfin !]»; old 0121 keeps «I» (not fixed, to avoid a SOURCE CHANGED note just for that).
- 092.0439 and 0440 («il y a tableau à Grenade…», «Il y aussi tableau… Mont-Dore») are `margin`: small type at the end of Livre 92 (p.193), before the Livre 93 title. They are probably notes on the notebook's last page; `other` would also fit.
- 092.0354 had been guessed `letter` («opens with a salutation»). Wrong: it is diary text («Mademoiselle de Mertens, Weeb, Klumpte sont venues voir mon tableau…»). The kind is removed.
- 092.0200 opens with an inline «[Dans la marge: …]» followed by diary text, so it gets no kind.

### Flags (not changed)
- **Accents stripped** in `_original` from about 092.0345 (28 July) to 0440: «tres voilee», «a», «ete»… The docx has full accents. This is the same defect as 100. It is not fixed by this plan, which would mean ~95 set_french edits plus SOURCE CHANGED notes. Suggest a separate accent-restoration pass from the docx.
- 092.0268 («not found»): the mid-paragraph split of docx ¶2131+¶2134 (page break p.165/166), continuing 0267. It is present and correct.
- ¶1885–1888 (5–6 June gap): new ¶1885–1887 are under 5 June and new ¶1894 under 6 June. The dates are correct.
- The OCR «0 illustre» in 0369 is probably «Ô» in print. Not checked or changed.
- ¶1791 ends «[manque]» (Gabriel's letter not reproduced), inline.

### Withdrawn cover pages
- ¶1731–1735: «Gloriae Cupiditas» / «Livre 92ème» / «du dimanche 15 mai 1881 / au jeudi 18 août 1881» / «34, avenue Montaigne, Paris» / «Gavronzi, Poltava, Soumy, Kiev, Varsovie, Berlin-Paris».
