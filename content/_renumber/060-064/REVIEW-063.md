# Review 063 (Livre 63, 4–19 July 1876, tome08.docx ¶2793–3598) — 2026-09-29

Built by `tools/fix_063.py` (common/plan-063.json → final/plan-063.json). Dry run accepted (rc 0):
781 paragraphs (498 carried, 283 new, 2 dropped), 15 entries (2 added: 1876-07-10, 1876-07-11).
The approval flags reset in 11 of 15 entries per tree; 1876-07-07, -08, -09 and -18 keep theirs (same paragraph list as before).
Two expected warnings: the headings changed by set_french on 063.0049 and 063.0342.

## Summary counts

| | |
|---|---|
| Entries | 15 (1876-07-04-05, 06, 07, 08, 09, **10 new**, **11 new**, 12, 13–17 rebuilt over ID-less stubs, 18, 19) |
| Old paragraphs kept | 498 |
| New paragraphs | 283 (the drafter had 286: −¶3330 duplicate, −¶3373 running head, −¶3155 edition footnote, ¶3154+¶3156 joined, +3 from splitting ¶3100–3101, ¶3199–3200, ¶3262–3263) |
| Dropped | 2 (063.0051, 063.0500) |
| drop_files | 1876-07-13 … 1876-07-17.md (ID-less stubs, rebuilt by entries with the same name) |
| set_french | 4 (063.0049, 063.0133, 063.0134, 063.0342) |
| Kinds | editorial×2, margin×3, rayé×2 (list below) |

## Withdrawn cover pages

- **Livre 63 title page** (docx ¶2793–2798, Mon Journal t.8 p.249). None of it is in `_original` (063.0001 starts with «Hier à deux heures»); the common step removed the drafter's cover entry. Verbatim:
  - ¶2793 «Gloriae cupiditate»
  - ¶2794 «Hfis] Gfrace] tfhe] Dfuke] off] Hfamilton]» (= H[is] G[race] t[he] D[uke] o[f] H[amilton])
  - ¶2795 «Livre 63'»
  - ¶2796 «depuis le 4 juillet 1876, mardi, / jusqu'au mercredi 19 juillet 1876 / Grand Hôtel, 159, Paris. / Alexis, rue St Lazare, 20.»
  - ¶2797 «*Amor, ut lacryma, oculo oritur in pectus cadit.*»
  - ¶2798 «Publius Syrus.»
  No first-person note from Marie on this title page (the address lines are the itinerary/address kind), so there is no margin paragraph.
- **063.0500** «\*Gloriae cupiditate\*[^6] [His] Grace] t[he] D[uke] of[f] H[amilton][^7]» → dropped (WITHDRAWN reason). It is the start of the **Livre 64** title page, docx ¶3599, Mon Journal t.8 p.309. The rest of that title page (¶3600–3605: «Livre 64e», «Depuis le mercredi 19 juillet 1876 jusqu'au mercredi 16 août 1876», Paris/Berlin/Moscou/Chpatovska lines) belongs to 064's review. Its footnotes [^6]/[^7] go with the dropped cluster.

## Drops

- 063.0051 «---» — separator line from the extraction, not manuscript text.
- 063.0500 — Livre 64 title page (above).
- New paragraphs removed from the draft: ¶3330 «— Et il sera pape ?» (this line is 063.0232; the drafter created it because it had moved 063.0344 into 18 July); ¶3373 «Soixante-troisième cahier» (the printed running head of p.296, checked on the scan); ¶3155 «1. « *Nihil ante, nihil post* » : est-ce cela ?» (the printed edition's own footnote on «Rien avant, rien après», p.283: an editor's guess, italic Latin plus roman question).

## Splits/moves

- **First entry** keeps the old file name **1876-07-04-05.md** (the drafter used 1876-07-04.md). Heading «Mardi 4 juillet 1876 - mercredi 5 juillet 1876» (docx ¶2799); 063.0001 has no heading of its own.
- **063.0049/0050** («Effroyable néant, désespérante nullité !», «Rien, rien !») stay at the end of 4–5 July, as in the docx (¶2849–2850 come before the date line ¶2851). 063.0049 loses its misplaced «# Jeudi 6 juillet 1876» (set_french).
- **063.0052** (first half of docx ¶2852, «Après les visites chez Reboux…») moved from the end of 4–5 July to the start of 1876-07-06.md; it gets the plan heading «Jeudi 6 juillet 1876».
- **063.0053**: the drafter's completion removed. `_original` splits ¶2852 into 0052 + 0053, so the completion would have duplicated 0052.
- **063.0134** completion kept. `_original` held only the tail after the page break («d'y tenir, de mendier…», top of p.268); the first half («Collignon a dit…», p.267) is nowhere else. It is placed at the end of 11 July as in the docx (¶2971).
- **063.0344** moved back to 19 July, right after 063.0343. It is docx ¶3443: Marie copies the forgotten part of the 18 July dialogue into her 19 July entry («Je reprends le dialogue à la page [293]…»). The draft had put it in the 18 July dialogue after 063.0232. 063.0231/0232 are the real ¶3329/3330. So the «cluster spans days» item is resolved: it does not span days and needs no split.
- **063.0145** (Marie's footnote, see Kinds) moved from after 063.0144 to right after 063.0141, which carries its «¹» call.
- The new entries 1876-07-10 and 1876-07-11 match the docx date lines ¶2938 «Lundi 10 juillet 1876» and ¶2965 «Mardi 11 juillet 1876». 1876-07-13…17 match ¶3011, ¶3043, ¶3126, ¶3145 and ¶3158. 1876-07-11 now takes its frontmatter from 1876-07-12.md, which also gives it 063.0134.
- Page-break joins and splits in new text: ¶2963+¶2964 are one paragraph, and the stray newline is now a space. ¶3154 + ¶3156 are one paragraph cut by the page break and the edition footnote ¶3155, and are joined. The drafter had merged ¶3100/¶3101, ¶3199/¶3200 and ¶3262/¶3263 into single paragraphs. The scans (pp.279, 286, 289) show two paragraphs each, so each pair is split back into two.
- A full alignment check of the final plan against docx ¶2799–3598 shows every paragraph in docx order. All 10 «not found» dialogue lines (063.0196, 0200, 0212, 0219, 0226, 0231, 0232, 0245, 0374, 0437) sit at their docx place. The tiler's far-away matches (063.0205, 0231, 0232, 0257, 0314, 0344, 0427) come from short repeated dialogue lines. They are all in place now (0344 fixed above).
- Repeated-text items: 063.0030 ↔ ¶2384 («Oh ! c'est vrai, c'est vrai, pensai-je.», in 062) and 063.0086 ↔ ¶3148 («Quand donc vivrai-je comme j'aime !») are different sentences. They are no duplicates and both stay.

## Kinds (with sources)

- 063.0017 `editorial` «[annotation ]» + 063.0018 `margin` «Annotation de Marie». The common step made both.
- 063.0183 `editorial` «[annotation]» + 063.0184 `margin` «Annotation de Marie» (*Une laryngite.*). The common step made both.
- 063.0145 `margin`, source «Note de Marie, renvoi ¹ après «table d'hôte»». The printed edition has «Ce qui est très curieux, une fois par an. On voit tant de types…» as a footnote on p.268. It is Marie's own note (her voice, her table-d'hôte scene), not an editor's note, so it stays. Its «¹. » prefix and the «¹» in 063.0141 are left as they are (see Open questions).
- 063.0499 `rayé` «[une ligne rayée]» (kept).
- new ¶3130 `rayé` «[une ligne rayée]». The print has «[UNE LIGNE RAYÉE].»; the period is dropped.
- 063.0347 `letter` guess **removed**: «— Monsieur, dis-je en lui prenant la main…» opens a dialogue.
- No clippings or letters in 063. «[la lettre manque]» inside ¶3127 (Rémy's note) is an edition bracket inside a diary paragraph, so it gets no kind.

## set_french list (each carries an `_rsr`)

- 063.0049 → «Effroyable néant, désespérante nullité !». Removes the misplaced heading «# Jeudi 6 juillet 1876».
- 063.0133 → «# Mercredi 12 juillet 1876». Removes «SOIXANTE-TROISIÈME CAHIER», the running head of p.268.
- 063.0134 → the whole docx ¶2971 («Collignon a dit qu'il m'aimait… Attendons à demain.»). Drafter's completion, checked against the docx. `_rsr` added.
- 063.0342 → «# Mercredi 19 juillet 1876», without the comma, as in docx ¶3441 and the print.

## OCR/typo fixes (new text; each noted in the paragraph's RSR)

| docx ¶ | was | now | check |
|---|---|---|---|
| 2949–2950 | «à Paris I Et» | «à Paris ! Et» | scan p.265 |
| 2954 | «font pomme une auréole» | «font comme une auréole» | scan p.265 |
| 2963–2964 | «quelqu 'un», «au- dessus», newline | «quelqu'un», «au-dessus», one line | pp.266–267 |
| 2967 | «la Prodgefs» | «la Prodgers» | scan p.267 |
| 2969 | «moi- même» | «moi-même» | p.267 |
| 3023 | «Ah I ha !» | «Ah ! ha !» | scan p.275 |
| 3042 | «mourir 1» | «mourir !» | |
| 3140 | «sert- elle» | «sert-elle» | p.282 |
| 3152 | «- « Rien avant, rien après » '.» | «— « Rien avant, rien après ».» (edition footnote call removed) | p.283 |
| 3160 | «somnanbule» | «somnambule» (the print has «somnanbule»: typesetting typo corrected) | p.284 |
| 3199 | «Je vois 1» | «Je vois !» | scan p.286 |
| 3255 | «Non I vous» | «Non ! vous» | p.288 |
| 3262 | «énergie I» | «énergie !» | scan p.289 |
| 3266 | «dévergondé 1 Oh I oui», «[moti \*rayés]\*» | «dévergondé ! Oh ! oui», «[mots rayés]» | scan p.290 |
| 3269 | «étemel» | «éternel» | scan p.290 |

Dialogue dashes: 42 new paragraphs that began with «- » now begin with «— », the dash the common step restored for the other 119. Old paragraphs keep whatever dash they have.

## Kept-but-flagged

- ¶3100 «…de son air impassible, protecteur» has no final period, as printed (p.279). Left as printed.
- «Merjeevsky» (¶3033) is kept as printed. Elsewhere Marie writes «Merjevski».
- OCR slips in **old** `_original` text are not touched (they are outside the new/completed text, and changing them resets approvals): 063.0025 «11 est bien naturel» (= Il), 063.0060 «Ah I Pietro m'a oubliée I», 063.0090 «Je suis misérable 1», 063.0017 «[annotation ]». They are candidates for a later typo pass.
- 063.0174 heading «# Mardi, 18 juillet 1876» keeps its comma (docx/print: «Mardi 18 juillet 1876»). Fixing it would be the only change to the 18 July entry and would reset its approval flags in every tree.
- Drawings: none seen on the pages checked (249, 252, 265, 267, 268, 275, 279, 281–284, 286, 289, 290, 296).

## Open questions for the owner (conservative default chosen)

1. 063.0145 «¹. Ce qui est très curieux…», Marie's own footnote (p.268): kept as a `margin` paragraph right after its call, with the «¹» call left in 063.0141 and the «¹. » prefix left in 063.0145. Should both «¹» be stripped, or should it become a real footnote of 063.0141? Default: leave as is.
2. 063.0174: fix the heading comma now, which resets approvals for 18 July, or leave it for a later heading-normalisation pass? Default: leave it.
3. «somnanbule» (¶3160) is corrected as a typesetting typo. If the manuscript really has Marie's spelling, revert. Default: corrected.

## For the applier after --write

- Turn the `_rsr` notes on 063.0049, 063.0133, 063.0134 and 063.0342 into RSR comments.
- New IDs: 063.0052 → 0051 onward (the dry run prints the id map). Glossary/TM references are rewritten by the tool: uk TranslationMemory, fr manifest and non-French passages, FLORENCE.md, MOUZAY.md.
