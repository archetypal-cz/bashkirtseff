# Carnet 072 rebuild (tome 10): review (2026-09-28)

Plan: `plan-072.json`. It ran together with the other tome-10 plans: `just rebuild-carnets plan-069.json plan-070.json plan-071.json plan-072.json plan-073.json plan-074.json --write`. Map: `../072-2026-09-28.json`; SQL for reader reports: `../069+070+071+072+073+074-2026-09-28.sql`.
Source: `content/_raw/tome10.docx` and the Tome 10 scan (Mon Journal, t.10), checked page by page where the notes say so.

## Summary

- **Paragraphs:** 598 after the rebuild, numbered 072.0001–072.0598.
  - 496 old paragraphs carried, 35 moved in from another carnet, 67 new, 15 dropped.
  - 516 IDs change.
- **Entries:** 34 (0 added, 0 removed).
- **set_french** on 36 old paragraphs.
- **Kinds:** editorial×1, letter×2, margin×12, rayé×6 (new: none; old: editorial×1, letter×2, margin×12, rayé×6).
- **Approval flags reset** per tree: cz 14, uk 14, en 14, fr 14.

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

- 072.0016: empty placeholder cluster (no text in _original or any translation)
- 072.0036: empty placeholder cluster (no text in _original or any translation)
- 072.0095: empty placeholder cluster (no text in _original or any translation)
- 072.0148: empty placeholder cluster (no text in _original or any translation)
- 072.0189: empty placeholder cluster (no text in _original or any translation)
- 072.0222: empty placeholder cluster (no text in _original or any translation)
- 072.0234: empty placeholder cluster (no text in _original or any translation)
- 072.0275: empty placeholder cluster (no text in _original or any translation)
- 072.0343: empty placeholder cluster (no text in _original or any translation)
- 072.0450: empty placeholder cluster (no text in _original or any translation)
- 072.0475: empty placeholder cluster (no text in _original or any translation)
- 072.0481: empty placeholder cluster (no text in _original or any translation)
- 072.0511: empty placeholder cluster (no text in _original or any translation)
- 072.0096: «[Continuation du 15 juin]» is not in the manuscript (tome10.docx ¶3212 is the bare date line «Samedi 16 juin 1877»): the extraction's own note on the scan's swapped pages 218/219; the 16 June heading comes from the plan's `heading`
- 072.0106: merged into 072.0094: the two held one sentence split across the page swap of printed pp.218–219 (owner decision 2026-09-28); translations carried over by hand

Moved in: 073.0002–0036 (35).

## Drawings and facsimiles

Images in `src/frontend/public/images/marie/drawings/072/`, linked by `drawings:` in the entry frontmatter.

- `tome10-p0262-1.webp` (1877-07-14.md): Dessin de Marie à la plume dans le carnet : personnage assis vu de trois quarts dos, en veste boutonnée, le bras replié vers la tête — Mon Journal, t. 10, p. 262 (fac-similé)

## 4. Planner notes (2026-09-27, superseded where §1 says so)

### 072 + 073 rebuild plans: notes (2026-09-27)

Built by `work-072-073/build.py` from `draft/plan-072.json` and `draft/plan-073.json`. Every change is an explicit operation there. The two plans must run together: `just rebuild-carnets final/plan-072.json final/plan-073.json`. The dry run in wt-t10 exits 0; the only warnings are the two expected "cover has no heading" ones.

#### Counts

| | entries | old carried | moved in | moved out | new | dropped | set_french | total |
|---|---|---|---|---|---|---|---|---|
| 072 | 35 (1 added: 06-29 split from 06-28) | 477 | 35 (073.0002–0036) | 0 | 68 | 34 | 2 | 580 |
| 073 | 37 (1 added: 08-08) | 453 | 0 | 35 | 88 | 40 | 4 | 541 |

Kinds:
- 072: cover ×1 (new); margin ×11, rayé ×6, letter ×2, editorial ×1 (all old).
- 073: cover ×3 (old); rayé ×6 old + 2 new; editorial ×3 old + 3 new; margin ×1 (old).

Translation flags (dry run): reset in 34/35 (072) and 37/37 (073) entries per tree. **Most of these resets come only from dropping empty placeholder clusters.**
- `final/alt-keep-empties/plan-07{2,3}.json` is the same plan with the draft's 67 "empty placeholder" drops kept in place (each after its predecessor, as in the old file).
- With those plans, resets fall to 8 (072) and 14 (073) entries per tree. That is 49 entries × 4 trees whose approvals survive.
- Cost: 67 empty IDs remain, and they render nothing. My recommendation is the alt plans. The lead or owner decides.
- In the alt plans, 073 still drops 6 IDs: 0001, 0075, 0283, 0284, 0304, 0306.

#### Tool-wide finding: dialogue dashes are missing from the draft's new text

- In tome10.docx, dialogue lines carry their «- » as Word list numbering (`numPr`, bullet «-»), not as text. python-docx `p.text` drops it, so every drafted new dialogue paragraph lost its dash. The 068 _original has them.
- I computed the prefix per docx ¶ from the numbering definitions (`work-072-073/numprefix.json`, all of tome10: bullets «- », and two decimal lists at ¶3589–3591 «1. 2. 3.» and ¶4204–4205 «1 2»). I prefixed it on 55 of my 156 new paragraphs.
- **The other forks (069, 070, 071, 074) and `draft.py` itself have the same defect.** `numprefix.json` covers the whole tome and can be reused.

#### Structural decisions (with evidence)

1. **Scan page swap, 15/16 June.** Tome10.pdf p.219 is printed p.219 and p.220 is printed p.218, so the docx reads printed 217→219→218.
   - The docx ¶3206 glues «…Personne, je» + «n'y eut que Larderei…». The draft's `set_french` "completion" of 072.0106 reproduced that and was removed.
   - Manuscript order, 15 June: …0094 «Il est vrai qu'à Naples il» | 0106 «n'y eut que Larderei et Melissano…» | 0107–0111.
   - 16 June: 0112, 0113 (Monaco casino) | 0097–0104 | 0105 «Je le dis… Personne, je le jure personne…» | 0114…
   - 0094 and 0106 remain two clusters that split one sentence. I kept them rather than merge (a merge would drop 0106's translations). The owner can merge later.
2. **072.0096 dropped.** «# Samedi 16 juin 1877 / [Continuation du 15 juin]»: the bracket is not in the docx (¶3212 is the bare date line). It is the extraction's note on the page swap. 16 June takes `heading`.
3. **06-29.** The date line ¶3460 «Vendredri 29 juin 1877» (OCR) was not parsed, so the draft merged 29 June into 28 June and added the date line as "new" text. The 1877-06-29 entry is restored from 072.0302 (which has the heading); the bogus new paragraph is removed.
4. **Chronology of 11 July.** «Lundi 3 janvier 1876 nous arrivons à Rome», «Vendredi 9 février je rencontre Alexandre…» (¶3609–3616, 072.0442–0449) is Marie's list of fateful Fridays and Mondays, not date lines. The bogus 1876-01-03 and 1876-02-09 entries are gone, and 0444–0449 are back after 0443 in 1877-07-11.
5. **«p. 250» items.** ¶3582–3583 and ¶3597 (style Other, «p. 250», «>age 250»), set outside the text block in the left margin of printed p.249/251, are the edition's footnote pointers to the key on p.250 (Marie's «1. Melissano ou Torlonia / 2. Aquarium, Monaco / 3. Audiffret…»). They are removed as new text.
6. **072.0462** «' Cette manière de parler ressemble à Alexandre, sèche, polie et familière.» (¶3629, style Other) is printed at the foot of p.253, outside the text block, like the «p. 250» pointers. It could be the edition's footnote, or Marie's own note set as a footnote. It is **kept as in _original** (translated in all trees). Owner question 1.
7. **Tanlay letter.** 072.0337 «Monsieur,» and the letter half of 0338 become kind letter, source «Brouillon de lettre de Marie à M. de Tanlay (non envoyé), 1er juillet 1877», `> `-quoted via set_french. The diary sentence that closes 0338 («OU bien ceci non, nous verrons demain; j'aimerais bien rencontrer ce monsieur chez les Boyd…», ¶3497) becomes a new plain paragraph after it.
8. **073 cover.** 073.0037 «Gloriae Cupiditate[^2]» (text and footnote kept), 0038 → «Livre 73ème», 0039 → the three title-page lines (scan p.264 = printed 263). All three are kind cover in 1877-07-15-cover.md. The draft's new ¶3725 duplicate is removed, and 0037/0038 are taken back out of 072's 14 July.
9. **073.0001 dropped** («[Continuation de la fantaisie du 14 juillet]», not in the docx). 15 July takes `heading`, and 073.0002–0036 go to 072/1877-07-14 (Livre 72, ¶3687–3722).
10. **19 July.** ¶3801 «Jeudi 19 juillet 1877» is followed directly by ¶3802 «Vendredi 20 juillet». 073.0075 «Cette date n'apparaît pas dans le carnet original.» (an extraction invention) is dropped. 0074 (heading) is kept and a new «[Aucun texte - date seule mentionnée]» added.
11. **23 July.** The second «[Bas de page enlevé]» (¶3854) matched 0113 in the draft and was lost. It is restored as a new editorial paragraph.
12. **24 July.** The draft added ¶3878 «Et si mon père voulait…» as new; it is old 073.0126 (`######`). The duplicate is removed and 0126 is kept, with no kind. The scan (p.276 = printed 275) sets it in large type, hence the `######`.
13. **Early August.** Weekday + sequence, following the 074 precedent:
    - 1877-08-05 is Marie's «Dimanche 6 août» (0285 + new ¶4049–4055).
    - 1877-08-06 is «Lundi 7 août» (0287–0303).
    - 1877-08-07 is «Mardi 7 août» (0307–0329; plan `heading`).
    - 1877-08-08 is «Mercredi 8 août» (0330–; plan `heading`).
    - Dropped: 0283 «# Dimanche 5 août 1877» and 0284 «Cette date n'apparaît pas…» (an invented entry); 0306 «[Dans le carnet Marie a noté "Mardi 7 août 1877" mais c'est le 8]» (an invented and wrong note); 0304 (empty in _original; en/fr carried a wrong note that uk had already removed).
    - ¶4030–4034, under the struck «[Rayé: Samedi 5 août 1877]», stay in 3 August as the draft had them. Marie struck the date and the text precedes her «Samedi 4 août» line. The struck line 0265 is rayé.
14. **Printed notes in heading lines.**
    - 073.0211 is set to the printed wording «[Marie a écrit le 30]» (¶3974). The _original had «[Dans le carnet Marie a écrit le 30]».
    - 073.0330 is set to «(Marie a noté Mer.8 et jeudi 8, mais a réctifié par la suite)» (¶4098, as printed).
    - Both get **no kind**, because they share a cluster with the day heading, the same choice the 069 fork made.
15. **10/11 August.** 073.0371 carries «# Samedi 11 août 1877» *before* «Ah ! vous m'ennuyez tous !», which ends 10 August in the docx (¶4139, then the date line ¶4140).
    - 0371 stays in 08-10, and 08-11 takes `heading`.
    - The leading heading line must be deleted after the run (in `post-073.json`), in all trees.
16. **Kinds changed from the draft.**
    - «[Bas de page enlevé]» and «[Une feuille enlevée]» → editorial (not margin/other): 073.0033, 0113, 0408, 0445, new ¶3781, ¶3857.
    - 072.0417+0418 → margin (one «[En travers: …]» over two paragraphs).
    - 072.0235 and new ¶3843 have no kind. «Mon ami Alexandre, vous devriez bien garder cette photographie…» is Marie apostrophising him in the diary, not a letter.
    - The English passages ¶4178 and ¶4224 are dialogue (Hall), with no kind.
17. **Draft drops reviewed.** All 67 "empty placeholder" drops (33 in 072, 34 in 073) are empty in _original and every tree; the only content near them is entry-level CON notes, which the tool keeps. See the flag-reset trade-off above.

#### Text of new paragraphs

- Normalised to the _original convention: ’ → ', “ ” → ", punctuation moved out of italics (`*tout,*` → `*tout*,`), «- » line-break hyphens joined.
- Dialogue dashes are restored from the docx numbering.
- OCR corrected (scan checked):
  - ¶3917 «Gii» → «Gil» (p.278);
  - ¶3741 «intéres-ser» → «intéresser» (line-break hyphen);
  - ¶3793–3794 «repro-duiront» → «reproduiront».
- OCR uncertain / kept: ¶3387 «comeme». The scan (p.231) really prints «comeme», the edition's slip for «comme»; it is flagged in the RSR note.
- Italian «cameriere» (¶3383) is Marie's.
- Completeness recheck: every docx text row ¶3098–4308 is covered (3-gram ≥ 0.8) except explained items:
  - the page pointers;
  - the ¶3460 date line;
  - ¶3794 (merged into 3793);
  - ¶3878 (= 073.0126);
  - OCR variants of old text: ¶3223, 3888, 4036, 4080, 4087, 4135.

#### Drawing

- The docx ¶3723 picture, Tome10.pdf p.263 = printed p.262, is at the end of Livre 72, after «Je raconte mal, mais j'invente bien…» (old 073.0036, now in 072/1877-07-14).
- Cut from the page's picture region at 600 dpi, show-through of the verso text removed by levels. Output: `final/images/tome10-p0262-1.webp` (1443×1600, 122 KB). Caption and alt text are in `post-072.json` (publish path `/images/marie/drawings/072/`).
- It is a pen sketch of a seated figure seen three-quarter from behind, in a buttoned jacket, with one arm raised and bent over the head; hatched wall or curtain at left, a sinuous line from the hand at right.
- It has no caption in the edition, so authorship is presumed to be Marie's (a notebook facsimile), not proven.

#### Post-apply items (`post-073.json`)

- 073.0285 heading «# Lundi 6 août 1877» → «# Dimanche 6 août 1877».
- 073.0287 «# Mardi 7 août 1877» → «# Lundi 7 août 1877».
- 073.0371: delete «# Samedi 11 août 1877».
- Each item has an RSR note text to add.
- Translation trees need the same heading changes to their translated headings and embedded copies. Their flags reset anyway.

#### Owner questions

1. 072.0462 (the p.253 foot note «Cette manière de parler ressemble à Alexandre…»): is it Marie's note or the edition's footnote? It is kept for now.
2. Should empty placeholder clusters be dropped (the current final plans; about 70 entry resets per tree) or kept (the alt plans)?
3. 0094/0106 split one sentence across two clusters because of the scan page swap. Merge (losing 0106's translations) or leave as is?
4. The new heading-only day 19 July gets «[Aucun texte…]» (the convention). 20 June (072.0235) already had it.


## 5. Gate results

```
== renumber-check 072
  [WARN] cz/072: embedded French differs from _original in 1 paragraph(s): 072.0278 (resync with just resync-french cz 072)
  [WARN] uk/072: embedded French differs from _original in 1 paragraph(s): 072.0278 (resync with just resync-french uk 072)
  [WARN] en/072: embedded French differs from _original in 1 paragraph(s): 072.0278 (resync with just resync-french en 072)
  [WARN] fr/072: embedded French differs from _original in 1 paragraph(s): 072.0278 (resync with just resync-french fr 072)
RESULT: PASS (0 fail, 4 warn)
GATE _original 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE cz 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE uk 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE en 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
GATE fr 072 | RESULT: PASS (0 fail, 0 warn) | splice 0
check-comments: OK (_original)
check-comments: OK (cz)
check-comments: OK (uk)
check-comments: OK (en)
check-comments: OK (fr)
```

## Withdrawn cover pages (for when the manuscript is available)

Owner decision KRR 2026-09-28: no cover entries or cover paragraphs until the manuscript is scanned. Texts as printed:

- Restored from tome10.docx ¶3098–3101, Mon Journal t.10 p.207:

  > Gloriae Cupiditate
  > Livre 72ème
  > Depuis le lundi 11 juin 1877
  > jusqu'au samedi 14 juillet 1877
  > Nice
  > Depuis le jeudi 21 juin Paris
  > boulevard Haussman 29

### New layout (34 entries)

| New file | Heading | carried | moved in | new | set_french | kinds |
|---|---|---|---|---|---|---|
| 1877-06-11.md | Lundi 11 juin 1877 | 15 | 0 | 0 | 1 | margin×1 |
| 1877-06-12.md | Mardi 12 juin 1877 | 19 | 0 | 0 | 1 |  |
| 1877-06-13.md | Mercredi 13 juin 1877 | 7 | 0 | 0 |  |  |
| 1877-06-14.md | Jeudi 14 juin 1877 | 4 | 0 | 0 |  |  |
| 1877-06-15.md | Vendredi 15 juin 1877 | 52 | 0 | 0 | 4 | margin×2, rayé×1 |
| 1877-06-16.md | Samedi 16 juin 1877 | 45 | 0 | 0 | 9 | margin×3 |
| 1877-06-17.md | Dimanche 17 juin 1877 | 40 | 0 | 0 | 6 | margin×1, rayé×1 |
| 1877-06-18.md | Lundi 18 juin 1877 | 32 | 0 | 0 | 3 | margin×1 |
| 1877-06-19.md | Mardi 19 juin 1877 | 11 | 0 | 52 |  |  |
| 1877-06-20.md | Mercredi 20 juin 1877 | 2 | 0 | 0 |  |  |
| 1877-06-21.md | Jeudi 21 juin 1877 | 17 | 0 | 0 |  | margin×1, rayé×1 |
| 1877-06-22.md | Vendredi 22 juin 1877 | 6 | 0 | 0 |  |  |
| 1877-06-23.md | Samedi 23 juin 1877 | 15 | 0 | 6 |  |  |
| 1877-06-24.md | Dimanche 24 juin 1877 | 4 | 0 | 0 |  |  |
| 1877-06-25.md | Lundi 25 juin 1877 | 7 | 0 | 0 |  |  |
| 1877-06-26.md | Mardi 26 juin 1877 | 6 | 0 | 0 |  |  |
| 1877-06-27.md | Mercredi 27 juin 1877 | 6 | 0 | 0 |  |  |
| 1877-06-28.md | Jeudi 28 juin 1877 | 3 | 0 | 0 |  |  |
| 1877-06-29.md | Vendredi 29 juin 1877 | 10 | 0 | 0 |  |  |
| 1877-06-30.md | Samedi 30 juin 1877 | 10 | 0 | 0 |  |  |
| 1877-07-01.md | Dimanche 1er juillet 1877 | 21 | 0 | 1 | 2 | letter×2 |
| 1877-07-02.md | Lundi 2 juillet 1877 | 7 | 0 | 0 |  |  |
| 1877-07-03.md | Mardi 3 juillet 1877 | 12 | 0 | 0 |  |  |
| 1877-07-04.md | Mercredi 4 juillet 1877 | 5 | 0 | 0 |  |  |
| 1877-07-05.md | Jeudi 5 juillet 1877 | 4 | 0 | 0 |  |  |
| 1877-07-06.md | Vendredi 6 juillet 1877 | 6 | 0 | 0 |  |  |
| 1877-07-07.md | Samedi 7 juillet 1877 | 13 | 0 | 0 |  | rayé×1 |
| 1877-07-08.md | Dimanche 8 juillet 1877 | 23 | 0 | 0 | 1 |  |
| 1877-07-09.md | Lundi 9 juillet 1877 | 21 | 0 | 0 |  | margin×2 |
| 1877-07-10.md | Mardi 10 juillet 1877 | 4 | 0 | 0 |  |  |
| 1877-07-11.md | Mercredi 11 juillet 1877 | 11 | 0 | 0 | 1 |  |
| 1877-07-12.md | Jeudi 12 juillet 1877 | 24 | 0 | 8 | 5 | margin×1, rayé×2 |
| 1877-07-13.md | Vendredi 13 juillet 1877 | 5 | 0 | 0 | 1 |  |
| 1877-07-14.md | Samedi 14 juillet 1877 | 29 | 35 | 0 | 2 | editorial×1 |
