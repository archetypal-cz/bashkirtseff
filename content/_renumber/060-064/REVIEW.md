# Tome 8 rebuild (carnets 060–064): REVIEW

Plans: final/plan-060..064.json, built from draft/ (patched drafter tool/) → common/ (tools/common08.py + tools/title08.py) → final/ (tools/fix_CCC.py, one per carnet, Opus review 2026-09-29). Per-carnet detail: REVIEW-060.md … REVIEW-064.md. Conventions: CONVENTIONS.md.

## Tome-level decisions

- **Title-page notes** (owner policy, applier brief addendum): only the Livre 60 title page carries a note by Marie — «[Le] livre 59 est égaré ! ! … il manque du 19 avril au 10 mai … où cela peut-il être perdu ?» (1882) and, across it, «[en travers] *retrouvé*» (tome08.docx ¶70–71, Mon Journal t.8 p.21). Both are `margin` paragraphs (source «note de Marie sur la page de titre du Livre 60») right after the 060 first-entry heading 060.0001.
- **Ignotus article** (June 1876, Le Figaro «LE CARDINAL ANTONELLI», docx ¶2585–2599, pp.223–230): restored as 13 `clipping` paragraphs in 062/1876-06-27.md in place of the placeholder 062.0633 (dropped). It is a different article from the November 1876 Ignotus piece in 067/1876-12-11.md.
- **«[annotation]»**: the printed edition's label for Marie's later annotations (printed in italics) → the label is kind `editorial`, the annotation kind `margin` (source «Annotation de Marie[, year]»).
- **Empty days** get their own «[Aucun texte - date seule mentionnée]» entry (064 11 August, settled by the lead against the reviewer's default).
- **Pre-existing renumber-check FAILs on main** fixed by tools/prereq.py before --write: en 060.0257 stale embedded line; uk 063.0092/0117/0132 duplicated embedded lines; stale citations 061.0241→061.0043, 062.0248→062.0283, 062.0256→062.0317, 076.0074→076.0451 in COLLIGNON.md and the 060/1876-05-18 notes (_original/en/uk).
- No cross-carnet moves; carnet 059 untouched. No drawings or facsimiles in these carnets (figure scan: none in the diary pages; reviewers saw none).

## Withdrawn cover pages

### 060
- **Livre 60 title page**, docx ¶68–69, Mon Journal t.8 p.21. common08 already withdrew it (common/withdrawn-060.json):
  «Gloriae cupiditate / H[is] G[race] t[he] D[uke] o[f] H[amilton]» (unnumbered in the docx) · «Livre 60e» ·
  «depuis le mercredi 10 mai 1876 / jusqu'au samedi 20 mai 1876 / Rome, hôtel de la Ville».
  Marie's own note (docx ¶70–71, 1882: «[Le] livre 59 est égaré ! ! …» + «[en travers] *retrouvé*») stays as 2 `margin`
  paragraphs after 060.0001, placed by title08.py.
- **Livre 61 title page, first half**, Mon Journal t.8 p.87. _original filed this at the end of 060:
  - docx ¶1044 «Gloriae cupiditate» = **060.0884**, dropped with the withdrawn reason.
  - docx ¶1045 «H[is] G[race] t[he] D[uke] o[f] H[amilton]» (OCR «Gfrace … off] Hfamilton]») was a new paragraph. **Removed.**
  - The rest (¶1046–1049) is in 061; see REVIEW-061.

### 061
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

### 062
- **Livre 62 title page**, tome08.docx ¶1348–1354, Mon Journal t.8 p.117 (already withdrawn by common08, `common/withdrawn-062.json`):
  ¶1348 «Gloriae cupiditate / H[is] G[race] t[he] D[uke] off] Hfamilton]» (its old counterpart is 061.0216, which belongs to the 061 plan) ·
  ¶1349 «Livre 62'» · ¶1350 «Depuis le lundi 29 mai 1876 / jusqu'au lundi 3 juillet 1876» · ¶1351 «Nice» ·
  ¶1352–1353 «Quanti cen' è che misentan cantare / Diran : buon per colei ch'à il cor contento.» · ¶1354 «[six lignes cancellées]».
  No old 062 paragraph holds any of it: the drafter's «¶1351 Nice looked like 062.0004» was a false fuzzy match (062.0004 is diary text).
  No note by Marie on this title page.
- **062.0736** «Gloriae cupiditate[^6]» (end of 1876-07-03.md) = tome08.docx ¶2793, first line of the **Livre 63** title page (Mon Journal t.8 p.249, checked on the scan) → dropped as title-page text (its LAN note and footnote go with it; the 07-03 entry-level RSR note stays with the entry). The rest of that title page (¶2794–2798) is in common/withdrawn-063.json.

### 063
- **Livre 63 title page** (docx ¶2793–2798, Mon Journal t.8 p.249). None of it is in `_original` (063.0001 starts with «Hier à deux heures»); the common step removed the drafter's cover entry. Verbatim:
  - ¶2793 «Gloriae cupiditate»
  - ¶2794 «Hfis] Gfrace] tfhe] Dfuke] off] Hfamilton]» (= H[is] G[race] t[he] D[uke] o[f] H[amilton])
  - ¶2795 «Livre 63'»
  - ¶2796 «depuis le 4 juillet 1876, mardi, / jusqu'au mercredi 19 juillet 1876 / Grand Hôtel, 159, Paris. / Alexis, rue St Lazare, 20.»
  - ¶2797 «*Amor, ut lacryma, oculo oritur in pectus cadit.*»
  - ¶2798 «Publius Syrus.»
  No first-person note from Marie on this title page (the address lines are the itinerary/address kind), so there is no margin paragraph.
- **063.0500** «\*Gloriae cupiditate\*[^6] [His] Grace] t[he] D[uke] of[f] H[amilton][^7]» → dropped (WITHDRAWN reason). It is the start of the **Livre 64** title page, docx ¶3599, Mon Journal t.8 p.309. The rest of that title page (¶3600–3605: «Livre 64e», «Depuis le mercredi 19 juillet 1876 jusqu'au mercredi 16 août 1876», Paris/Berlin/Moscou/Chpatovska lines) belongs to 064's review. Its footnotes [^6]/[^7] go with the dropped cluster.

### 064
Livre 64 title page, Mon Journal t.8 p.309 (scan checked), docx ¶3599–3605 — all withdrawn, no own notes of Marie among them:

- ¶3599 «Gloriae cupiditate» / «H[is] G[race] t[he] D[uke] o[f] H[amilton]» (docx OCR «Hfis] Gfrace]…»; in _original this sits at 063.0500 — 063's reviewer)
- ¶3600 «Livre 64e» — old **064.0002** «LIVRE 64ᵉ» dropped
- ¶3601 «Depuis le mercredi 19 juillet 1876 jusqu'au mercredi 16 août 1876» — old **064.0003** dropped
- ¶3602 «Paris : Grand Hôtel, 59» — old **064.0004** dropped
- ¶3603 «Berlin : Hôtel de Russie, depuis le 26 juillet, / depuis le 3 août, à Pétersbourg» — old **064.0005** dropped
- ¶3604 «Moscou le 12 août» — old **064.0006** dropped
- ¶3605 «Lundi 14 août à Chpatovska» — old **064.0007** dropped

Reason on all six: «title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)».
The draft's cover entry 1876-08-14-cover (¶3600) was already removed by common08; the draft's ¶3605 date-line inference
left 0003–0007 at the head of 1876-08-14.md — they are now dropped, and 1876-08-14.md is built only from the real date
line ¶4183 «Lundi 14 août (2 août 1876)» (p.369) + ¶4184–4219. No trace of ¶3605 remains (checked in `--emit` output).

## Open owner questions (conservative defaults applied)

### 060
1. Are 060.0881–0883 (italic on p.85) a later annotation or diary text? Default: diary text, no kind.
2. 060.0003 is an italic paragraph with no [annotation] label. Default: `margin` «Annotation de Marie», because the
   edition prints Marie's later notes in italics.

### 061
- None.

### 062
1. 0309: split the mid-sentence «[annotation] Paris, 1877. …» into editorial + margin + a paragraph starting «et de mon peu d'expérience» as the print lays it out? Default: kept inline.
2. The song, p.212: the print reads «s'entendomi» (the Italian is «sentendomi»). Default: as printed, treated as Marie's spelling.
3. Dropping RSR-summary-only clusters (0351 plus the drafter's 11) loses those entry summaries from `_original`. Default: dropped, following the drafter/common policy.

### 063
1. 063.0145 «¹. Ce qui est très curieux…», Marie's own footnote (p.268): kept as a `margin` paragraph right after its call, with the «¹» call left in 063.0141 and the «¹. » prefix left in 063.0145. Should both «¹» be stripped, or should it become a real footnote of 063.0141? Default: leave as is.
2. 063.0174: fix the heading comma now, which resets approvals for 18 July, or leave it for a later heading-normalisation pass? Default: leave it.
3. «somnanbule» (¶3160) is corrected as a typesetting typo. If the manuscript really has Marie's spelling, revert. Default: corrected.

### 064
1. **11/12 August** — SETTLED by the lead applier (owner policy «empty days get separate [Aucun texte…] entries»): 1876-08-11.md holds 064.0522 set_french «# Vendredi, 11 août 1876 (30 juillet)» + «[Aucun texte - date seule mentionnée]»; 1876-08-12.md opens with its own heading «Samedi 12 août 1876 (31 juillet 1876)»; the old 1876-08-11-12.md redirects to 1876-08-12.md. (fix_064.py §10)
2. **«[EN TRAVERS DE LA PAGE]»** kept as a separate `editorial` label paragraph + `margin` note (old clusters 0049/0050 cannot be merged without a drop). Alternative: one `margin` paragraph holding both.
