# Carnets 015–030 rebuild (tome03.docx, tome04.docx): review (2026-09-28)

Plans: `plan-015.json` … `plan-030.json`, run together (`just rebuild-carnets plan-0*.json --write`) because paragraphs cross carnet boundaries.
They were drafted with `just rebuild-draft-plan` and every judgement point was reviewed by hand; the review is the script `fix.py` (with `fixlib.py`), which turns the drafts into these plans and writes the decision log at the end of this file.
Source: tome03.docx (Livres 15–20, 2 January – 4 July 1874) and tome04.docx (Livres 21–30, 5 July 1874 – 2 April 1875). Neither tome has a scan PDF, so there are no printed-page citations; new paragraphs cite docx ¶.

## Summary

| Carnet | Paragraphs | Carried | Moved in | Moved out | New | Dropped | Entries |
|---|---|---|---|---|---|---|---|
COUNTS

- **Cross-carnet moves** (the Livre boundaries in the manuscript):
  - 022.0465–0510 → 023: Livre 23 begins in the middle of 8 August 1874 («Samedi 8 août 1874 - suite», docx ¶1307). 1874-08-08 is now an entry in both 022 and 023.
  - 024.0001–0021 → 023/1874-09-16: the entry of Wednesday 16 September (Marie's account of 13–16 September) stands before the Livre 24 title page (docx ¶2219–2247). The old URL 024/1874-09-16 redirects to 023/1874-09-16.
  - 028.0002–0023 → 027/1874-12-24: the text of Jeudi 24 décembre stands before the Livre 28 title page (docx ¶3657–3683).
  - 029.0001 → 028/1875-01-20: «Mercredi 20 janvier 1875» with the torn-out leaves and the poem stands before the Livre 29 title page (docx ¶4046–4060); the rest of 20 January («On m'a apporté mes robes…») opens Livre 29. 1875-01-20 is an entry in both 028 and 029.
  - The draft moved 480 paragraphs of 017 into 016 because it did not read «[Carnet] N° 17» as a Livre heading (fixed in the drafter meanwhile, ba398e4b7), and 016.0281 into 017 on a repeated sentence; both reverted.
- **Days shifted by one** (the heading-date sweep of 2026-09-26): 027 from 18 December and 028 up to 20 January held each day's text under the next day's heading. The text now sits under the manuscript's date line. In 028 the wrong date line was the first line of the moved cluster, so it is corrected with `set_french` (028.0216 0218 0226 0241 0250, 029.0001 0014): the translations get an `ED: SOURCE CHANGED` note and still show the old translated date line — fix those headings in cz/uk/en/fr.
- **Invented date lines dropped:** 019.0221 «Vendredi, 15 mai 1874», 020.0373 «Mardi, 23 juin 1874», 020.0388 «Mercredi, 24 juin 1874». Neither the docx nor the raw carnet has them; the text stays under the day Marie wrote (14 May; 22 June, «depuis lundi 22 je n'ai rien écrit»). Their URLs redirect.
- **Date lines the drafter misread** (entries kept as in `_original`): «Merceredi 8 avril», «Lund 20 avril», «Mercredi 9 septembe», «Mardi 6 octore», «Mardi Gras 9 février», and «12 février Duc de Hamilton.» (text, not a date line). Marie's double dates stay two entries where the weekdays differ (015 «Mardi 21 / Mercredi 21 janvier» = 20/21 January; 028 «Mardi 6 / Mercredi 6 janvier» = 5/6 January), as in `_original`; where she repeated the same weekday and date (028 «Jeudi 14 janvier» twice, 027 «Jeudi 18» then «Vendredi 18 décembre») the second date line is kept as a `##` sub-heading in the same entry.
- **Empty days:** 14 February 1874 (016: «Samedi 14 février» then «Dimanche 15 février… Je n'ai rien écrit hier») becomes its own «[Aucun texte - date seule mentionnée]» entry; the old 1874-02-14-15 URL redirects to 1874-02-15. Heading-only entries already in `_original` are kept as they are.
- **Empty clusters kept.** The drafter drops the text-less clusters that hold old RSR entry summaries (91 in 016, 019, 020, 022, 023). Dropping them changes an entry's paragraph list and so resets the translations' approval flags (it would have reset 62 approved entries in 019–020 alone), so they stay.
- **Printed footnotes:** the edition's own notes stay out («[NdT]» 015, «(Nd R)» 024). Footnotes whose text is Marie's own remark are kept, as `_original` already does for 020.0158 and 020.0166, now with `kind: other` and source «Note de Marie, imprimée en bas de page dans Mon Journal»: 015 «Laid et poussiéreux, je ne le compte pas», 016 «Je ne pensais pas à ces choses-là… j'avais douze ans», 027 «belle-mère de la Prodgers…».
- **Kinds:** Marie's later annotations («[Annotation: 1880. …]») are `other` with the source «Annotation ultérieure de Marie, <year>»; bracketed marginal notes `margin`; struck paragraphs `rayé`; the editors' notes about the manuscript `editorial` (existing markers from d4dd02b2c/672b977ac are kept); the copy of Marie's letter to Berthe (19 July 1874) `letter`; Marie's tally of the days she saw the duke of Hamilton (end of Livre 24) `other`. The drafter's `letter` guesses on dialogue lines («- Monsieur, …») were removed.
- **Text of new paragraphs:** docx text, italics as `*…*`, typographic apostrophes and quotes straightened as in `_original`. OCR is otherwise verbatim (the `★` marks are the transcription's own, as in `_original`). 028/029 `_original` text is accent-stripped (a pre-existing extraction defect); the restored paragraphs keep the docx accents.

## Drawings

Tomes 3–4 have no scan PDF; the pictures are the docx's embedded facsimiles (low resolution, as printed). They are cut to WebP under `src/frontend/public/images/marie/drawings/<carnet>/tome0N-imgNN.webp` and listed under `drawings:` in the `_original` entry, after the paragraph that precedes the picture (or the editors' «[Note de l'éd. : ici un dessin…]»). Translations fall back to the French captions.

DRAWINGS

Not used: tome03 images 2, 3, 6, 8, 10–18 and tome04 images 1–3, 5–8, 10–16, 19–24, 28, 29, 32 are scan artefacts (page edges, fingers, the bookbinder's clamp); tome03 image 21 is the library stamp (back matter); tome04 image 30 is a blank page; tome04 image 4 (an engraved ornamental monogram, 23 July 1874) looks like printed matter rather than Marie's pen — owner question. The editors' notes «ici un dessin» at 018.0036 (28 March), 019.0142 (8 May), 025.0264 (18 November), 027.0010 (25 November) and 029.0001 (20 January) have no usable picture in the docx (the slot holds a page-edge crop).

## Prerequisite fixes (before the rebuild)

- cz/020/1874-06-25.md lacked 020.0399 (the editors' note «[Papier à en-tête Hôtel de l'Europe, Spa]»); en/019/1874-05-08.md lacked 019.0142 («[Note de l'éd. : ici un dessin…]»). Both added (renumber-check fails on a text paragraph a tree lacks).
- Glossary citation of the form `CCC.YYYY-MM-DD` (GEORGES.md «028.1874-12-28») read as a paragraph ID `CCC.1874` → «028/1874-12-27», where that text now is. (GIOIA.md, listed in the first run, no longer needs it at HEAD.)
- fr 028/029 (unedited tree): the embedded French of the clusters whose date line the plan corrects (028.0216 0218 0226 0241 0250, 029.0001 0014) was one multi-line comment block, which rebuild-carnet refuses for `set_french`; split into one comment per line.
- en: stale embedded French that renumber-check (d) fails on, visible English unchanged — a stray copy of 021.0499's French in 021.0500, 030.0237's sentence doubled into 030.0238, and the heading copies of 030.0303/0313/0322/0341 that also held the next paragraph's first sentence.

## Typo corrections

- Owner policy: the printed edition's obvious typesetting typos are corrected via `set_french`. Tomes 3–4 have no scan PDF, so the note cites the docx ¶. Corrected: 020.0194 «après- demain» → «après-demain». The rest of the typo scan (`typos.py`) was left as it stands: «estl» sits inside a [Rayé:] passage, «fourures» and «rappellée» may be Marie's own spellings (owner questions).

## Post-write fix

- The tool's flag-reset ED comment names the source of a cross-carnet move as «024/1874-09-16.md», which renumber-check (c) reads as a link to the removed entry (a known false positive, reported for the toolsmith). `postfix.py` rewrites that mention inside the rebuild's ED comments as «024, 1874-09-16.md».

## Gates

GATES

## Owner questions

QUESTIONS
