# Carnet 098

## Carnet 098 — plan review notes (planner, 2026-09-28)

Range: tome15.docx ¶1769 (Livre 98 title page) – ¶2558; printed pp.155–212 (PDF = printed + 1).
All docx body paragraphs are placed (4-gram coverage check); all date lines checked against the weekday.

### Decisions
- **1883-01-12**: on printed p.155 «Vendredi 12 janvier 1883» is a diary date line (same type as «Samedi 13 janvier»), directly followed by the 13th → empty day. Entry `1883-01-12.md` = 0001 (heading) + 0002 `set_french` «[Aucun texte - date seule mentionnée]». The draft had moved both into 01-13 with a NEW «- 1er janvier» — undone.
  → **withdrawn-covers.json for 098 wrongly includes that date line** («Vendredi 1 2 janvierl 883», ¶1772): only ¶1769–1771 are the title page.
- **1883-01-13**: 0003 `set_french` «# Samedi 13 janvier 1883 - 1er janvier» (Julian date kept, ¶1773); NEW «- 1er janvier» removed.
- **¶2364 «Mardi 13 mars 1882»** = 1883-03-13 (Marie's year slip, print p.199 has 1882). Bogus entry `1882-03-13.md` removed; `1883-03-13.md` = 0484–0487 as in the old layout (heading 0484 «Mardi 13 mars 1883» kept; the old RSR note records the slip).
- **2/3 March**: print p.195 has two date lines «Vendredi 2 mars 1883 / Samedi 3 mars 1883» (docx merged them in ¶2314). Old layout restored: `1883-03-02.md` = 0439 + 0440 «[Aucun texte…]», `1883-03-03.md` = 0441–0446. Draft's NEW «Samedi 3 mars 1883» removed.
- **16–19 March**: ¶2397 Ven 16, ¶2399 Sam 17, then ¶2412 «Dimanche 16 mars» = Sunday 18 (empty) and ¶2413 «Lundi 17 mars» = Monday 19 (Marie's slips, print p.202). Old layout restored: 03-16 = 0511–0512, 03-17 = 0513–0522, 03-18 = 0523 + 0524 «[Aucun texte…]», 03-19 = 0525–0529. The draft's NEW «[Aucun texte]» in 03-16 is removed. Old headings «Dimanche 18 / Lundi 19 mars» kept (plan `heading` fields record the manuscript lines).
- **«[Pas d'entrée]» stubs** — all have a bare date line in the docx → `set_french` «[Aucun texte - date seule mentionnée]», no kind: 0002 (12 jan, p.155), 0088 (18 jan, ¶1879), 0328 (13 fév, ¶2178), 0367 (20 fév, ¶2228), 0391 (23 fév, ¶2253), 0440 (2 mars, ¶2314), 0448 (4 mars, ¶2322), 0471 (9 mars, ¶2350), 0473 (10 mars, ¶2351), 0524 (18 mars, ¶2412), 0561 (24 mars, ¶2459), 0611 (29 mars, ¶2516). No drops.
- **0068** «[Note de l'éd. : ici un plan dessiné par Marie dans le journal.]» kept, kind editorial (already in `_original`). The print (p.161) shows the drawing itself (plan of Gambetta's death-room at Ville d'Avray: lit, fenêtre, cheminée…), no bracket note. Cropped: `w9798/tome15-p161-1.webp` (623×491, 40 KB). Proposed frontmatter for 1883-01-16.md: `drawings: - src: /images/marie/drawings/098/tome15-p161-1.webp, caption: "Plan de la chambre mortuaire de Gambetta aux Jardies", source: "Tome 15, p. 161", paragraph: <new ID of 098.0068>`. Not applied (repo read-only for me).
- **Kinds**: 0030, 0033–0040 (Marie to Émile Bastien-Lepage), 0358–0360 and 0371–0373 (billets to Julian), 0581 (billet from Julian) are already `kind: letter` with sources in `_original` → confirmed, nothing to set. **0374 «P.S. …»** is part of the 21 Feb billet (docx Body text (2), ¶2235) → `kind: letter`, same source, `set_french` quoted (old text verbatim).
  Margin (whole paragraphs «[En travers: …]» / «[Dans la marge: …]», labels match docx): 0007, 0043, 0164, 0275, 0544 → `margin`. 0036 has an inline «[Dans la marge: …]» inside the letter paragraph (as in docx ¶1814) — stays inline.
- **30 March**: Tony Robert-Fleury's letter (¶2541–2550, printed small, pinned into the notebook — «La lettre elle-même va être épinglée ici») is `letter`, not clipping; split into letterhead / «Mademoiselle,» + first paragraph / ¶2547 / ¶2548 / closing+signature, source «Lettre de Tony Robert-Fleury à Marie, 30 mars 1883». «Expostions» is printed so — kept.
- 19 Feb NEW ¶2224 «Et Paris est là pour le dire.» and ¶2227 genuinely missing; kept.

### Flags (not changed)
- Heading «Jeud 8 mars 1883» in the print (p.197); old heading 0463 «Jeudi» kept.
- 0365 «…était *mieux* II!» and «…que Breslau II» — OCR of «!!!», print p.188; old text left.
- `_original` 098 is accent-stripped in many clusters («Pas d'entree», «fevrier», «a present»); kept, flag for a re-accent pass.
- Old RSR on 0002 says «Entry actually written on January 13» — now stale (it is an empty 12 Jan).
- Translations: set_french on heading 0003 inserts an embedded copy «%% Samedi 13 janvier 1883 - 1er janvier %%» (without «#») + ED comment in cz/uk/en/fr.
- en lacks the stub paragraphs 0328/0367/0391/0440/0448/0471/0473/0524/0561/0611 (pre-existing).

### Withdrawn cover page
- ¶1769–1771 (p.155): «Gloriae Cupiditas / [Livre] 98ème / depuis le vendredi 12 janvier 1883 jusqu'au vendredi 30 mars 1883 / Paris, 30, rue Ampère». (¶1772 is NOT cover, see above.)

### Dry run
Whole tome15 run (095–100): 0 errors. 098: 640 paragraphs (629 carried, 11 new), 78 entries, 31 unchanged.
