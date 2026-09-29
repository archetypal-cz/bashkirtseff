# Title-page notes re-added (2026-09-29)

Corrective pass over tomes that had already landed (015, 048, 050, 059, 067, 068, 071, 090, 091, 097). Their 2026-09-28 rebuilds withdrew whole title pages, and with them some notes Marie wrote on those pages herself. Owner policy (KRR, handoff 2026-09-28): formal title lines stay withdrawn («Livre N», commencé/terminé, addresses, «Gloriae Cupiditas», HGtDoH). Marie's own notes (annotations, milestones, reading notes, resolutions, maxims) go in as `margin`/`other` paragraphs at the carnet's first entry. Findings: audit of 2026-09-29 (`~/rebuild-state/titlenotes-audit.md`); the lead chose the HIGH, MED-HIGH and MED items.

Method: identity plans at HEAD (`just rebuild-carnet-plan`), patched by `title_notes.py`, applied in one multi-carnet run (`just rebuild-carnets plan-*.json --write`). Every carnet renumbers from the insertion point; map `CCC-2026-09-29.json`, SQL `015+048+…+097-2026-09-29.sql`. Placement: right after the heading paragraph when it holds only the heading. When the heading shares its paragraph with diary text, the note goes before it, as 053.0001, 054.0001 and 058.0001–0002 already do, so the note never splits the narrative. Each new paragraph has an RSR note citing the docx ¶ and the printed page. Translations get the tool's TODO. The exception is the 059 name list, whose cz/uk/en text was taken from old 059.0004–0011 (`postfix_059.py`).

| New ID | Kind | Text (start) | Source |
|---|---|---|---|
| 015.0002 | margin | [En travers: J'ai déjà écrit deux mille sept cents pages !!!!] | tome03 ¶41, t.3 p.5 |
| 048.0002–0003 | editorial + other | [Coin de page manquant ?] / Sais tout, fais tout, [?] décide tout… | tome06 ¶1548–1554, t.6 p.101 (scan checked) |
| 050.0003 | other | T.P.L. / Alex. Dumas | tome06 ¶2784–2785 (memo for the letter 050.0130) |
| 059.0004 | other | Belmonte / Pandola / … / Angelini | tome07 ¶3925–3932, t.7 p.279 |
| 067.0001 | other | Ment sana in corpore sano / … (Alfieri) | tome09 ¶1690–1695, t.9 p.119 (scan: «fauno», «Francsi») |
| 068.0002 | margin | [En travers: 23 mai 1875] | tome09 ¶3388, t.9 p.225 (was the withdrawn cover's 068.0002) |
| 071.0001–0002 | margin + other | desinit in piscen. Hir. / Remittum ei peccata… (Luc) / Dulciores… (Augustin) | tome10 ¶2363–2366, t.10 p.143 (scan checked) |
| 090.0001–0002 | margin ×2 | Dessin 3 octobre 1877… / Ceux que je choque… | tome14 ¶44–50, t.14 p.5 (scan checked); typos «septbembre», «arrangemement» corrected |
| 091.0001 | margin | Faire vite que du nu… si Tony approuve. | tome14 ¶908, t.14 p.71 |
| 097.0001–0002 | editorial + other | [Sur une page] / Dieu nous apprend le mépris des richesses… | tome15 ¶1229, t.15 p.107 |

## Owner questions (conservative default applied)

1. **¶908 placement**: at the front of Livre 91 (091.0001, as applied, following the print's layout) or at the end of 090/1881-01-22, since «fin Décembre» points to autumn 1880?
2. **Mottos** «Volo omnia / Gloriae Cupiditate habeos» (048), «Volo omnia gloriae cupiditate / solum modo habeo !» (049) and «Dubium, illusio, deceptio, oppressio» (Livres 68–71): title formulas or personal maxims? Default: withdrawn.
3. **096 Dupleix memo** (tome15 ¶630): add as `margin` at 096/1882-08-01? Default: withdrawn.
4. **052 struck fragment** «[Rayé: Notre frère, Il nous est permis de voir une]» (tome06 ¶4823): default withdrawn.
5. **Livre 50 back-flyleaf name scribbles** (tome06 ¶4253–4258): default withdrawn.

Each carnet's own REVIEW records the update in its «Withdrawn cover pages» section.

## Gates (main, after write)

renumber-check PASS for all 10 carnets. The WARNs were already there before this pass: 050/090/091 embedded-French drift, a 050/059 DROPPED ref in fr manifests and uk/060. verify-carnet PASS and splicescan empty for _original/cz/uk/en/fr × 10 (50 runs). check-comments OK. source-completeness: no new gaps; the added texts now match their docx rows.

## Post-write fixes and tool notes

- The RSR note on 050.0003 cited the letter by its pre-run ID (050.0129). The tool does not renumber IDs inside a *new* paragraph's own RSR text, so it was fixed by hand to 050.0130 in all five trees. Tool bug: new paragraph text and notes should go through the reference rewriter.
- The dry run warns «first paragraph has no date heading» for 1876-10-12 (067), 1877-04-26 (071), 1880-10-03 (090), 1881-01-23 (091) and 1882-10-29 (097), and for 1876-04-20 (059), which was already so. This is intended: the title-page note comes before the date line, as in 053/054/058.

## Follow-ups

- Translation wave for the new paragraphs (TODO in cz/uk/en; fr shows the French).
- Glossary tags on the new paragraphs are minimal (Latin/Italian, Dumas fils, Tony Robert-Fleury); run glossary-tagger if wanted.
- Run the SQL remap on the auth DB after deploy.
