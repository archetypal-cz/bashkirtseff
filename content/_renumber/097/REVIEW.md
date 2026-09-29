# Carnet 097

## Carnet 097 — plan review notes (planner, 2026-09-28)

Range: tome15.docx ¶1224 (Livre 97 title page) – ¶1768; printed pp.107–154 (PDF = printed + 1).
Every date line 29 Oct 1882 – 11 Jan 1883 is present in the docx; every docx body paragraph is placed (checked by 4-gram coverage; the only unmatched lines are date lines, cover lines and short page-split tails that sit inside old clusters).

### Decisions
- **096.0444 → 097** confirmed: docx ¶1230–1231 «Dimanche 29 octobre 1882 - suite / Impossible de coller deux mots ensemble.» sits after the Livre 97 title page (printed p.107). Entry `1882-10-29.md` in 097 holds only 096.0444; the draft's NEW paragraph «-suite» (a heading fragment) is removed and the entry `heading` is «Dimanche 29 octobre 1882 - suite» as printed. `frontmatter_from: 1882-10-30.md` kept (097 frontmatter, carnet "097").
- **1883-01-08 / 01-09 restored** (draft had merged them into 01-09 and put heading 0391 at the end of 01-07). Old layout was right: `1883-01-08.md` = 0391–0405 (docx ¶1737–1754, printed «Lundi 9 janvier 1883», which is Monday 8 Jan: Marie's date slip), `1883-01-09.md` = 0406–0410 (¶1755 «Mardi 9 janvier»). Old heading 0391 «# Lundi 8 janvier 1883» kept as is (not changed to the slip, so the entry stays untouched; the old RSR note already records the slip). Plan `heading` fields record the manuscript line.
- **11 «[Pas d'entrée pour cette date]» stubs** — every one of these days has a bare date line in the docx followed directly by the next date line → `set_french` «[Aucun texte - date seule mentionnée]» (no kind): 0120 (22 nov, ¶1389), 0141 (25 nov, ¶1421), 0143 (26 nov, ¶1422), 0154 (28 nov, ¶1432), 0183 (4 déc, ¶1468), 0210 (8 déc, ¶1502), 0226 (12 déc, ¶1523), 0237 (15 déc, ¶1536), 0270 (22 déc, ¶1576), 0281 (25 déc, ¶1589), 0310 (29 déc, ¶1627). No drops.
- **0240 editorial** (already `kind: editorial` in `_original`) is the same note as docx ¶1539; no duplicate. The draft's NEW ¶1539 is removed and 0240 gets `set_french` «[pages 75 et 76 arrachées dans le manuscrit.]» (docx/print label, p.132; the old text «[Feuillets 75 et 76 arraches … carnet original]» was a transcriber's paraphrase).
- **NEW «tence.» removed** (01-01): tail of «exis-/tence» split by the page break (¶1650/¶1653); 0329 already has «existence».
- **0073 «- Monsieur je deviens sourde,»**: NOT a letter — it is what Marie says to the doctor (¶1329, followed by «jusqu'ici j'ai usé de…»). Kind removed.
- **0049 «Et puis.»** is in the docx: ¶1300, 8 nov, right after ¶1299 (=0048). Placement correct.
- 11-04/11-05: 0017–0023 (old file 11-05) are under «Samedi 4 novembre» in the docx (¶1250–1259); 11-05 (¶1260) is a bare date line → heading-only entry 0016 (old convention for heading-only days kept, like 11-01/02/03).
- 11-17/18: 0091–0094 (old file 11-18) belong to 17 nov (¶1351–1354); draft placement kept.
- NEW paragraphs kept: 11-07 ¶1279, ¶1280+1283, ¶1284+1287, ¶1288 (checked against printed pp.110–112), 12-30 editorial ¶1630 «[Une partie de la page blanche p. 98 du manuscrit]» (p.141).
- Kinds: 0240 editorial; 12-30 NEW editorial. 0222–0223 already `letter` in `_original` (card to Saint Marceaux) — unchanged.

### Flags / OCR (not changed)
- 0219 «Saint Marceaux est venu II!» — print p.131 reads «!!!». Old text, OCR slip; left (fix with set_french if wanted, keep the [^1] marker).
- ¶1284 (new, 7 nov) «les plus terre [Rayé: à terre, dépourvus même de méchancetés [pour la plupart du temps].» — unbalanced brackets exactly as printed p.111; kept.
- `_original` 097 from mid-Nov on is accent-stripped («decembre», «a dire», «etait»…). Kept, flag for a separate re-accent pass.

### Withdrawn cover page

> **Update.** Title-notes pass 2026-09-29 (`_renumber/titlenotes-2026-09-29/`, owner policy: Marie's own notes on title/flyleaf pages go in as `margin`/`other` at the carnet's first entry; the formal title lines stay withdrawn; the carnet was renumbered): the maxim is now **097.0001** (`editorial` «[Sur une page]») + **097.0002** (`other` «Dieu nous apprend le mépris des richesses…»), before the heading paragraph of 1882-10-29 (answers the question below).
- ¶1224–1229 (p.107): «Gloriae Cupiditas / [Livre] 97ème / depuis le dimanche 29 octobre 1882 jusqu'au jeudi 11 janvier 1883 / Russie / depuis le 15 novembre, Paris, 30, avenue Ampère / [Sur une page] : Dieu nous apprend le mépris des richesses par la façon dont il les distribue, (lu dans un roman feuilleton).» Question for owner: the «[Sur une page]» aphorism is Marie's own writing on a flyleaf — withdraw with the cover, or keep as an `other` paragraph?

### Dry run
Whole tome15 run (095–100 copies, with placeholder drop_files for other carnets' ID-less stubs): 0 errors. 097: 420 paragraphs (414 carried, 1 moved in, 5 new), 75 entries. Warning: en footnote [^1] moves from 097.0100 to 097.0094 (tool handles).
