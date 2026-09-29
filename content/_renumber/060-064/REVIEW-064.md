# Review 064 (Livre 64, tome08.docx ¶3599–4283, Mon Journal t.8 pp.309–377)

Built by `tools/fix_064.py` from `common/plan-064.json` → `final/plan-064.json`. Dry run accepted (rc 0).
Warnings: two footnote-label collisions in 1876-07-24.md (`[^1]`/`[^2]` from 07-25 → `[^1b]`/`[^2b]`; _original and en),
and three expected "set_french changes its heading" warnings (0417, 0452, 0464).

## Summary counts

| | common | final |
|---|---|---|
| entries | 28 | 27 (7 new files, 3 removed: 1876-08-05-06, 1876-08-08-09, 1876-08-15-16; 1876-08-14 stub replaced by the rebuilt day) |
| old placed | 559 | 551 |
| dropped | 0 | 8 |
| new | 108 | 108 (−¶4008 «style russe)», +1 from splitting ¶3744) |
| set_french | 0 | 3 (0417, 0452, 0464) |
| kinds | letter×3, rayé×7, margin×7, editorial×6, clipping×1 (guesses) | editorial×10, margin×8, rayé×8 |

Dry run: 659 paragraphs (551 carried, 108 new, 8 dropped), 506 IDs change; flags reset in 18 entries per tree (cz uk en fr).
URL moves: 1876-08-05-06 → 1876-08-05, 1876-08-08-09 → 1876-08-08, 1876-08-15-16 → 1876-08-15.

## Withdrawn cover pages

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

## Drops

- 064.0002–0007: withdrawn title page (above).
- 064.0373 «---» (end of 31 July): extraction artefact, no rule in the docx or on p.342.
- 064.0424 «---» (end of 5 August): extraction artefact standing where the print has the «[annotation]» note ¶4041–4042 (p.348–349), which is restored as new paragraphs.

## Splits / moves / entries

- **19 July** (docx ¶3606 «Mercredi 19 juillet 1876», p.309): the scan confirms the first date line is 19 July, not 20.
  New entry 1876-07-19.md = old 0008–0022 (heading «Mercredi 19 juillet 1876» inserted by the tool). Old 0001
  «# Jeudi, 20 juillet 1876» stays in 1876-07-20.md in front of 0023 — exactly where ¶3622 is. 1876-07-20.md survives, no redirect needed.
- **064.0067 «Paul de Cassagnac.»** (draft: «not found», placed after the 23 July heading): it is ¶3667, the last line of 22 July
  (p.315) → moved to 1876-07-22.md before 0068 («Yssayevitch…», ¶3668), which the draft already moved there. Kept (Marie's text).
- Draft moves confirmed against the docx: 0068 → 22 July; 0168–0221 → 24 July (the evening at Mouzay's; ¶3830 «Mardi 25 juillet» comes before 0222);
  0250–0253 → 25 July (before ¶3865); 0310 → 29 July; 0370–0372 → 31 July; 0425–0435 → 6 August.
- **26–27 July**: one date line ¶3865 «Mercredi 26 juillet 1876 - jeudi 27 juillet 1876» → one entry under the old name **1876-07-26-27.md** (the draft's 1876-07-26.md + redirect removed).
- **4 August**: ¶4008 is ONE date line «Vendredi 4 août 1876 (23 juillet, style russe)»; the draft's new paragraph «style russe)» removed. 0393 keeps its full heading.
- **5 / 6 August**: separate date lines ¶4034 / ¶4043 → two entries; 0417 set_french «# Samedi, 5 août 1876 (24 juillet 1876)»; 1876-08-06.md gets the heading «Dimanche 6 août 1876 (25 juillet)» from the plan; `redirect_from: 1876-08-05-06.md` on 1876-08-05.
- **8 / 9 August**: separate date lines ¶4072 / ¶4084 (p.354, not bracketed) → 0452 set_french «# Mardi, 8 août 1876 (27 juillet)»;
  0464 «# [Mercredi, 9 août 1876 (28 juillet)]» (draft: «not found») moved to the head of 1876-08-09.md, set_french «# Mercredi, 9 août 1876 (28 juillet)» (brackets removed as printed); `redirect_from: 1876-08-08-09.md` on 1876-08-08.
- **11 / 12 August**: the print stacks the two date lines ¶4143 «Vendredi 11 août 1876 (30 juillet)» / ¶4144 «Samedi 12 août 1876 (31 juillet 1876)» with no text between (p.361).
  Kept as ONE entry under the old name **1876-08-11-12.md** (0522 heading unchanged). See open question 1.
- **14 August**: heading «Lundi 14 août (2 août 1876)» (plan heading, as printed); frontmatter comes from the old stub of the same name (location Chpatowoka).
- **15 / 16 August** (¶4220 / ¶4236): ID-less range stub 1876-08-15-16.md → drop_files + `redirect_from` on 1876-08-15 (common08); both days have real text (¶4221–4235, ¶4237–4283).
  Headings as printed «Mardi 15 août (3 août 1876)», «Mercredi 16 août (4 août 1876)»; `frontmatter_from` changed from 1876-08-13.md (Moscow + Moscow entities) to 1876-08-14.md (Chpatowoka, empty entities).
- 064.0347 «— Non.» («not found»): it is ¶3962 — kept.

## Kinds (with sources)

- 064.0049 «[EN TRAVERS DE LA PAGE]» → **editorial** (the edition's small-caps label, p.313); 064.0050 «*Remarquez que je suis à cette époque…*» → **margin**, source «Annotation de Marie, en travers de la page» (same pattern as «[annotation]» label + italic note).
- 064.0097, 0120, 0121 letter guesses **removed** (dialogue: «— Mademoiselle, dit-il…», «— Madame la comtesse, fit Cassagnac…»).
- **rayé** (standalone struck-line paragraphs, own docx paragraph in each case): 0079 «[mots rayés]» (¶3681, own paragraph, not inline), 0147, 0177, 0214, 0247, 0337, 0471, and new ¶4281 «[HUIT LIGNES CANCELLÉES]».
- 064.0456 «*[Quatre mots latins dépourvus de sens.]*» → **editorial** (edition's description of the manuscript, ¶4076).
- 064.0542 «[pièce jointe]» → **editorial** (edition's note that the Moscow Slavic committee's proclamation was pinned in; the item itself is not in the print).
- «[annotation]» markers ¶3746, ¶3764, ¶3792, ¶3853, ¶4041, ¶4205 → **editorial**; notes → **margin** «Annotation de Marie»: ¶3747 «*Hum !*», ¶3765 «*Hum !*» (common08's CHECK: the docx lost the italic; p.324 shows italic «Hum !»), 064.0185 (old, ¶3793), ¶3854 «*Il l'avoue.*», ¶4042 (source «Annotation de Marie, 1879»), ¶4206 «*On n'a seulement pas la bonté d'être poli avec ces pauvres martyrs.*» (p.371, italic).
- ¶3744 «[annotation] *Déjà !*» (one printed line, p.321) split into **editorial** «[annotation]» + **margin** «*Déjà !*», like the others.
- ¶4282 «corresp. serbe…» clipping guess **removed**: on p.377 it is one of Marie's last-page jottings («Brute !», «Alecto.», «Castruccio.», struck lines, «corresp. serbe…», «Je dois publier cet ouvrage !…»), not printed matter. Kept at the end of 16 August (last page of the notebook).
- Inline, no kind: ¶4212 «[ligne rayée, on peut lire : chants italiens]», ¶4237 «[huit lignes cancellées] Une foule de voisins…» (printed inline at the start of the paragraph, p.373), 0250 «[mots rayés]», 0404, 0474, 0491, 0493.

## set_french list (each has `_rsr`)

- 064.0417 → «# Samedi, 5 août 1876 (24 juillet 1876)» (heading split, ¶4034/¶4043).
- 064.0452 → «# Mardi, 8 août 1876 (27 juillet)» (heading split, ¶4072/¶4084).
- 064.0464 → «# Mercredi, 9 août 1876 (28 juillet)» (brackets removed, as printed p.354; moved to the head of 9 August).

## OCR / typo fixes (new text; noted in each RSR)

- Dialogue dashes «- » → «— » (as printed pp.369–375): ¶4186, ¶4191, ¶4194, ¶4195, ¶4196, ¶4249.
- ¶3765 «*Hum* I» → «*Hum !*» (p.324).
- ¶4221 «il y a un an 1 II y a un an» → «il y a un an ! Il y a un an» (p.372).
- ¶4226 «lorsqu'on passant» → «lorsqu'en passant» (p.372).
- ¶4230 «Ah 1 que» → «Ah ! que» (p.373).
- ¶4232 «jè veux» → «je veux» (p.373).
- ¶4237 «An- tiquité» → «Antiquité»; ¶4248 «Zan- kowski» → «Zankowski»; ¶4263 «Yakow- leff» → «Yakowleff» (line-break hyphens).
- ¶4266 «parfait 1» → «parfait !» (p.376).
- ¶4281 «[HUIT LIGNES CANCELLÉES] ,» → stray «,» (scan speck) removed.
- ¶4282 commas → full stops as printed: «corresp. serbe. interventions humaines. l'âme en Serbie.» (p.377, 200 dpi crop).
- ¶4283 «de Girofla *.» → «de Girofla.» (the edition's footnote asterisk; 0420/0457 in _original also carry «Giro»/«Girofla» without it).

## Kept but flagged

- ¶4271 «Il serait stupide de m'écrier : - « Ah ! il m'a trompée…» — inline hyphen kept as printed.
- ¶4265 «s'asseye [sic]» kept. ¶4189 «Chpatowoka» vs ¶4225 «Chpatowska»: both as printed.
- ¶4227–4228 joined into one paragraph by the drafter (the print runs it on across pp.372–373) — fine.
- Drawings: none seen on the pages viewed (309, 313, 315, 321, 324, 342, 349, 354, 361, 369–373, 375–377).

## Open questions for the owner (conservative default chosen)

1. **11/12 August** — SETTLED by the lead applier (owner policy «empty days get separate [Aucun texte…] entries»): 1876-08-11.md holds 064.0522 set_french «# Vendredi, 11 août 1876 (30 juillet)» + «[Aucun texte - date seule mentionnée]»; 1876-08-12.md opens with its own heading «Samedi 12 août 1876 (31 juillet 1876)»; the old 1876-08-11-12.md redirects to 1876-08-12.md. (fix_064.py §10)
2. **«[EN TRAVERS DE LA PAGE]»** kept as a separate `editorial` label paragraph + `margin` note (old clusters 0049/0050 cannot be merged without a drop). Alternative: one `margin` paragraph holding both.

## For the applier after --write

- Turn the three `_rsr` notes (0417, 0452, 0464 → their new IDs) into RSR comments.
- New entry 1876-07-19.md inherits 1876-07-20.md's frontmatter (entities/`kernberger_covered`); the entry-level RSR summary of old 1876-07-20.md (mentions «Chpatovska» itinerary / title page) stays on 1876-07-20.md — may want a touch-up.
- 1876-08-14/15/16 have empty `entities`; glossary tagging for the ~108 new paragraphs is still to do.
