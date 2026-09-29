# Carnet 071 rebuild (tome 10): review (2026-09-28)

Plan: `plan-071.json`. It ran together with the other tome-10 plans: `just rebuild-carnets plan-069.json plan-070.json plan-071.json plan-072.json plan-073.json plan-074.json --write`. Map: `../071-2026-09-28.json`; SQL for reader reports: `../069+070+071+072+073+074-2026-09-28.sql`.
Source: `content/_raw/tome10.docx` and the Tome 10 scan (Mon Journal, t.10), checked page by page where the notes say so.

## Summary

- **Paragraphs:** 624 after the rebuild, numbered 071.0001–071.0624.
  - 326 old paragraphs carried, 0 moved in from another carnet, 298 new, 0 dropped.
  - 326 IDs change.
- **Entries:** 46 (21 added, 0 removed).
- **set_french** on 29 old paragraphs.
- **Kinds:** letter×10, margin×2, rayé×1 (new: none; old: letter×10, margin×2, rayé×1).
- **Approval flags reset** per tree: cz 33, uk 33, en 33, fr 33.

## 1. Owner decisions applied (KRR, 2026-09-28)

These override anything the planner notes (§4) say to the contrary.

1. **No cover or title-page entries.** The 7 old title-page paragraphs (069.0650–0651, 070.0198–0199, 073.0037–0039) are dropped in their own carnets and no new cover text is added. Their text is kept below under «Withdrawn cover pages».
2. **Facsimiles shown as well as transcribed.** The printed programmes and the newspaper cutting are transcribed as kind `clipping` paragraphs, and their facsimiles are linked through `drawings:` in the entry frontmatter (captions in fr/cz/uk/en), anchored to the entry's last clipping paragraph.
3. **«Larderel».** Every «Larderei» in the French text of 069–074 (old and new paragraphs, headings) is set to «Larderel», the printed reading (the Larderel family of Livorno; «Larderei» is an OCR i/l slip). Other carnets, the glossary, entity names, comments and footnote definitions are untouched; the translations keep their wording, and each translated paragraph whose French changed gets the rebuild's «SOURCE CHANGED» ED note.
4. **Printed typesetting errors corrected** with an RSR note citing the page: «cettte», «priincesses», «acccompagné», «trliste», «diffférence», «réctifié». Marie's genuine spellings stay («sâle», «embarassée», «patisseries», «fânée»…).
5. **Drawings credited to Marie**, except printed p.109: its caption says «fait pour Marcuard» and that the authorship is uncertain.
6. **072.0094 + 072.0106 merged** (one sentence split by the page swap of printed pp.218–219). 0106 is dropped; its translation was carried into the merged paragraph by hand in cz, uk and en, with an ED note.
7. **072.0462** («Cette manière de parler ressemble à Alexandre…», foot of printed p.253) is kind `margin`.
8. **069.0285 / 069.0429** (day heading + «[N lignes cancellées]» in one cluster) stay without a kind, and the struck date «[Rayé: Lundi 21 mai 1877]» stays at the end of 20 May (071).
9. **Empty placeholder clusters** are kept where that lets an entry keep its translation approvals (`keep_empties.py`); the others are dropped.

## 2. Scripts (in this directory; run in this order)

1. `prereq_fix.py <root>` (before the run):
   - _original/070/1877-04-03.md: the legacy `[//]: # ( 10.8xx )` separators inside 070.0001 become blank lines;
   - fr/073/1877-07-24.md: the cluster labelled `%% 10.0126 %%` becomes 073.0126;
   - fr 069.0437, 069.0455, 069.0459, 070.0001: the multi-line `%%` block of embedded French becomes one `%% line %%` per line (the rebuild refuses `set_french` on a multi-line block).
   - Also, by hand: WALITSKY.md 071.1010 → 071.0241 (a citation that was already wrong).
2. `just rebuild-carnets plan-069.json … plan-074.json --write` (one multi-carnet run).
3. `post_apply.py <root> <date>`: translated heading labels; the «Samedi 11 août» heading moved in the translations; the 072.0094+0106 merge in cz/uk/en; RSR notes for typo corrections in old paragraphs; drawings and facsimiles (images + `drawings:` + captions); stale README ranges (071–073); fr/070 footnote markers without definitions.
4. `fix_fn_070.py <root>`: the footnote definitions left in 070.0001 by the 3 April split move to the clusters that now hold their markers.
5. `rsr_headings.py <root> <date>`: RSR notes for the heading labels changed through `set_french`.

Plan history: `owner_0928.py` applied the owner decisions to the plans (final2), `keep_empties.py` produced the final plans (final3 = the `plan-CCC.json` here).

## 3. Dropped paragraphs

None.

## Drawings and facsimiles

Images in `src/frontend/public/images/marie/drawings/071/`, linked by `drawings:` in the entry frontmatter.

- `tome10-p0165-1.webp` (1877-05-10.md): Programme imprimé des courses de Florence, 10 mai 1877 (Corsa Elena, Corsa delle Cascine, Premio del Re) — Mon Journal, t. 10, p. 165 (fac-similé)
- `tome10-p0166-1.webp` (1877-05-10.md): Programme imprimé des courses de Florence, 10 mai 1877, suite (Premio del Circolo dell’Unione, Corsa di consolazione, Comitato dirigente) — Mon Journal, t. 10, p. 166 (fac-similé)

## 4. Planner notes (2026-09-27, superseded where §1 says so)

### 071 final plan: notes (fork t10-071, 2026-09-27)

Plan: `final/plan-071.json`, built by `work-071/build071.py` from `draft/plan-071.json`. Dry run in wt-t10: exit 0, no ERROR.

#### Counts

| | |
|---|---|
| Entries | 47 (cover + 46 days, 1877-04-26 … 1877-06-10; 22 added, none removed) |
| Old carried | 321 (all IDs change) |
| New | 300 (70,929 chars) |
| Dropped | 5 empty placeholder clusters (0287 0294 0311 0318 0326; uk footnote definitions under them move to the referring clusters, tool warns) |
| set_french | 10 (letter quoting only) |
| Kinds | new: cover 2, letter 14, clipping 6, rayé 5, margin 4 · old: letter 10, margin 2, rayé 1 |
| Flag resets | 31 entries per tree (cz uk en fr); references rewritten in 55 files |

Dry-run warnings: the cover entry has no heading (expected); «old embedded French not found — new copy inserted» for 0176 and 0177 in cz/uk/en/fr (the long letter paragraphs with footnote markers; translators re-trim); uk footnotes moved off the dropped empty clusters.

#### Decisions

- **Cover** (`1877-04-26-cover.md`, 2 paragraphs, printed p.143 = PDF 144, checked on the scan): (1) ¶2356–2363 «"Dubium, illusio, deceptio, oppressio"» / Gloriae Cupiditate / Livre 71ème / dates / Naples, Florence, Nice / «desinit in piscen. Hir.»; (2) ¶2364–2366 the two Latin sayings set apart on the left of the page, «(Luc)» and «(Augustin)». «desinit in piscen. Hir.» and «Remittum» are printed so and kept (flagged in RSR: Horace «desinit in piscem», Vulgate «Remittuntur»).
- **Dates/headings**: every docx date line ¶2367–3089 checked against file date and calendar weekday: all consistent, no heading fixes. 28 and 30 April are date-only (¶2396, ¶2448) → «[Aucun texte…]» entries. 7–10 May and 12, 14 May restored whole.
- **¶2846 «[Rayé: Lundi 21 mai 1877]» + ¶2847 «[Cinq lignes cancellées]»** stay at the end of 20 May, kind rayé: this keeps the manuscript order (struck date, struck lines, then the real «Lundi 21 mai» ¶2848). Moving them under the 21 May heading would put them after the heading the tool inserts.
- **¶2375–2377 struck telegram to Paul de Cassagnac**: one paragraph, kind **rayé** (source "télégramme de Marie à Paul de Cassagnac, 26 avril 1877, rayé"). Chosen over `letter` because the struck rendering is what the manuscript shows; the telegram nature is in `source`.
- **Letters** (kind letter, `> ` quoted): 14 May ¶2759–2764 Marie → Marcuard (signature ¶2764 split from the diary line ¶2765 the draft had glued to it); 31 May ¶2974–2982 Marie's «PAX VOBIS» answer to Marcuard incl. «Tutti saluti…» and the P.S. (signature ¶2981 split from ¶2982); old 0176–0180 Marie → Marcuard 23 May, old 0182 Marcuard → Marie (extract), old 0211–0214 Marie → Marcuard 30 May (set_french = each _original text line prefixed «> », footnote markers kept). ¶2983 (the rose-bud note described by Marie) stays diary text.
- **Not letters**: ¶2512 «Cher Larderei, c'est la partie la plus lumineuse…» is Marie apostrophising (kind removed); ¶2682–2684 reported speech.
- **¶2598** «[En travers: Je suis allée voir les maisons de Galilée…]» → margin (draft said clipping). 0250 mixes a margin note with diary text → no kind.
- **Printed item, 10 May**: the Florence race programme (docx ¶2614–2668 empty picture slots, no OCR) inserted after ¶2612–2613 as 6 clipping paragraphs (title + I Corsa Elena; II Corsa delle Cascine; III Premio del Re; IV Premio del Circolo dell'Unione; V Corsa di consolazione; Comitato dirigente), source "Programme des courses de chevaux de Florence, 10 mai 1877", transcribed from the 300-dpi scan (PDF 166 is printed sideways). Horse rows as «N. Name. description, Ch. weight. — owner. — colours.». Uncertain readings marked «[?]» (some weights, «La Burdent», «La Commense», «Wild Boy» age). Pencil crosses in the margin beside «Palma» and «La Gorgona» noted in RSR. Facsimiles cut: `final/images/tome10-p0165-1.webp` (rotated to reading orientation, 1400×1102, 272 KB) and `tome10-p0166-1.webp` (715×1400, 263 KB), listed in post-071.json as candidates.
- No drawing in 071 (scan-figures: only PDF 166–167; ¶3097 is a blank line, PDF 206 has no figure).
- **Old clusters**: 0112 «— Ah ! ha !» (dialogue, 15 May) and 0209 «[Deux lignes cancellées]» (= docx ¶2940, end of 27 May) are correctly placed. Old-vs-docx comparison of all 321 clusters: no missing labels, no truncated clusters (differences are docx page-break fragments only).

#### Text of new paragraphs (applies to the whole tome, tell the other forks)

- **Dialogue dashes lost in the docx.** Paragraphs that are Word list items (`w:numPr`, bullet text «-») lost their leading «- » in python-docx; the scan prints it (checked ¶2426, 2681, 2682, 2850, 2920, 2835, 2688). The builder restores «- » for every new paragraph whose first docx ¶ is such a list item (map in `work-071/numpr.json`, all of tome10; numIds 128 and 137 are numbered, not bullets). 664 such paragraphs in the tome; 068's new text probably has the same loss.
- Apostrophes ’ → ' (tome10 switches to curly quotes from ¶~2358; _original uses ').
- Line-end hyphenations rejoined («peut- être», «amour- propre», «celui- ci»…).
- Verse set one line per printed line: ¶2568, ¶2571–2572, ¶2592–2593, ¶2854–2855, ¶2858.
- OCR corrected (scan checked): ¶2407 caniccio→carricolo; ¶2461 «serait II Car»→«serait !! Car»; ¶2505 «0 mes»→«O mes»; ¶2563 «Alex.fandre]»→«Alex.[andre]»; ¶2567 «notamment]:»→«not[amment]:»; ¶2572 «/gnoblement»→«Ignoblement»; ¶2600 «Jbur-in-hand»→«four-in-hand»; ¶2982 «Casette»→«Caserte»; ¶2987 «m'en- courâge»→«m'encourage»; ¶2989 «Pouchkine I)»→«Pouchkine !)».
- Kept as printed: «diffférence» (¶2769), «Leontievena» (¶2918, elsewhere Leontievna), «compteur» (¶2982).

#### Owner questions

1. The printed edition reads **«Larderel»** (the real family name; ¶2600 «Gaston de Larderel», ¶2850) where the docx OCR and all of `_original` read «Larderei». The new text follows the corpus («Larderei»). Normalise, or leave?
2. Race programme: link the two facsimiles on the 10 May page, or is the transcription enough? Is a full transcription of the horse rows wanted, or only the headings?
3. The struck date «[Rayé: Lundi 21 mai 1877]» + five cancelled lines: end of 20 May (current) or head of 21 May?


## 5. Gate results

```
== renumber-check 071
RESULT: PASS (0 fail, 0 warn)
GATE _original 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 071 | RESULT: PASS (0 fail, 0 warn) | splice 0
check-comments: OK (_original)
check-comments: OK (cz)
check-comments: OK (uk)
check-comments: OK (en)
check-comments: OK (fr)
```

## Withdrawn cover pages (for when the manuscript is available)

> **Update.** Title-notes pass 2026-09-29 (`_renumber/titlenotes-2026-09-29/`, owner policy: Marie's own notes on title/flyleaf pages go in as `margin`/`other` at the carnet's first entry; the formal title lines stay withdrawn; the carnet was renumbered): «desinit in piscen. Hir.» (¶2363, 2nd line) is now **071.0001** (`margin`) and the two sayings «Remittum ei peccata multa… (Luc) / Dulciores sunt lacrymae… (Augustin)» (¶2364–2366) **071.0002** (`other`), both before the heading paragraph of 1877-04-26 (it also holds diary text). Printed forms kept; readings (Horace, Vulgate Luke 7:47) in the RSR notes. Still withdrawn, **owner question**: the motto «Dubium, illusio, deceptio, oppressio» (default withdrawn, see 068/REVIEW.md).

Owner decision KRR 2026-09-28: no cover entries or cover paragraphs until the manuscript is scanned. Texts as printed:

- old 070.0198:

  > "Dubium, illusio, deceptio, oppressio"[^latin]

- old 070.0199:

  > Gloriae Cupiditate

- Restored from tome10.docx ¶2358–2363, Mon Journal t.10 p.143:

  > Livre 71ème
  > depuis le jeudi 26 avril 1877
  > jusqu'au dimanche 10 juin 1877
  > Naples, hôtel du Louvre
  > Florence, hôtel de la Paix
  > Nice, depuis dimanche 13 mai.
  > desinit in piscen. Hir.

- Restored from tome10.docx ¶2364–2366, Mon Journal t.10 p.143:

  > Remittum ei peccata multa quoniam dilexit multum
  > (Luc)
  > Dulciores sunt lacrymae orantium quam gaudia theatrorum
  > (Augustin)

### New layout (46 entries)

| New file | Heading | carried | moved in | new | set_french | kinds |
|---|---|---|---|---|---|---|
| 1877-04-26.md | Jeudi 26 avril 1877 | 0 | 0 | 9 |  |  |
| 1877-04-27.md | Vendredi 27 avril 1877 | 15 | 0 | 0 | 1 |  |
| 1877-04-28.md | Samedi 28 avril 1877 | 0 | 0 | 1 |  |  |
| 1877-04-29.md | Dimanche 29 avril 1877 | 0 | 0 | 49 |  |  |
| 1877-04-30.md | Lundi 30 avril 1877 | 0 | 0 | 1 |  |  |
| 1877-05-01.md | Mardi 1er mai 1877 | 0 | 0 | 23 |  |  |
| 1877-05-02.md | Mercredi 2 mai 1877 | 15 | 0 | 0 | 4 |  |
| 1877-05-03.md | Jeudi 3 mai 1877 | 0 | 0 | 24 |  |  |
| 1877-05-04.md | Vendredi 4 mai 1877 | 12 | 0 | 0 | 1 |  |
| 1877-05-05.md | Samedi 5 mai 1877 | 0 | 0 | 6 |  |  |
| 1877-05-06.md | Dimanche 6 mai 1877 | 10 | 0 | 0 | 3 |  |
| 1877-05-07.md | Lundi 7 mai 1877 | 0 | 0 | 7 |  |  |
| 1877-05-08.md | Mardi 8 mai 1877 | 0 | 0 | 31 |  |  |
| 1877-05-09.md | Mercredi 9 mai 1877 | 0 | 0 | 18 |  |  |
| 1877-05-10.md | Jeudi 10 mai 1877 | 0 | 0 | 33 |  |  |
| 1877-05-11.md | Vendredi 11 mai 1877 | 13 | 0 | 0 |  |  |
| 1877-05-12.md | Samedi 12 mai 1877 | 0 | 0 | 8 |  |  |
| 1877-05-13.md | Dimanche 13 mai 1877 | 36 | 0 | 0 | 2 |  |
| 1877-05-14.md | Lundi 14 mai 1877 | 0 | 0 | 13 |  |  |
| 1877-05-15.md | Mardi 15 mai 1877 | 33 | 0 | 1 | 4 |  |
| 1877-05-16.md | Mercredi 16 mai 1877 | 9 | 0 | 0 |  |  |
| 1877-05-17.md | Jeudi 17 mai 1877 | 6 | 0 | 0 |  | margin×1 |
| 1877-05-18.md | Vendredi 18 mai 1877 | 6 | 0 | 0 | 1 |  |
| 1877-05-19.md | Samedi 19 mai 1877 | 0 | 0 | 8 |  |  |
| 1877-05-20.md | Dimanche 20 mai 1877 | 5 | 0 | 2 |  |  |
| 1877-05-21.md | Lundi 21 mai 1877 | 0 | 0 | 11 |  |  |
| 1877-05-22.md | Mardi 22 mai 1877 | 0 | 0 | 4 |  |  |
| 1877-05-23.md | Mercredi 23 mai 1877 | 24 | 0 | 0 | 6 | letter×6, margin×1 |
| 1877-05-24.md | Jeudi 24 mai 1877 | 0 | 0 | 3 |  |  |
| 1877-05-25.md | Vendredi 25 mai 1877 | 15 | 0 | 0 | 2 |  |
| 1877-05-26.md | Samedi 26 mai 1877 | 0 | 0 | 17 |  |  |
| 1877-05-27.md | Dimanche 27 mai 1877 | 10 | 0 | 0 |  | rayé×1 |
| 1877-05-28.md | Lundi 28 mai 1877 | 0 | 0 | 4 |  |  |
| 1877-05-29.md | Mardi 29 mai 1877 | 0 | 0 | 6 |  |  |
| 1877-05-30.md | Mercredi 30 mai 1877 | 16 | 0 | 0 | 4 | letter×4 |
| 1877-05-31.md | Jeudi 31 mai 1877 | 0 | 0 | 19 |  |  |
| 1877-06-01.md | Vendredi 1er juin 1877 | 11 | 0 | 0 |  |  |
| 1877-06-02.md | Samedi 2 juin 1877 | 8 | 0 | 0 | 1 |  |
| 1877-06-03.md | Dimanche 3 juin 1877 | 20 | 0 | 0 |  |  |
| 1877-06-04.md | Lundi 4 juin 1877 | 3 | 0 | 0 |  |  |
| 1877-06-05.md | Mardi 5 juin 1877 | 5 | 0 | 0 |  |  |
| 1877-06-06.md | Mercredi 6 juin 1877 | 15 | 0 | 0 |  |  |
| 1877-06-07.md | Jeudi 7 juin 1877 | 7 | 0 | 0 |  |  |
| 1877-06-08.md | Vendredi 8 juin 1877 | 17 | 0 | 0 |  |  |
| 1877-06-09.md | Samedi 9 juin 1877 | 7 | 0 | 0 |  |  |
| 1877-06-10.md | Dimanche 10 juin 1877 | 8 | 0 | 0 |  |  |
