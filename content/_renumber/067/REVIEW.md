# Carnet 067 rebuild plan: review (2026-09-28)

Plan: `plan-067.json`. Run it together with 065 and 066. It has no cross-carnet paragraphs of its own, so `standalone/plan-067.json` is the same plan.
Method and scripts are as in REVIEW-065.
Source range: tome09.docx ¶1686 (Livre 67 title page) to ¶3380 (the empty picture slot of the last pasted clipping). ¶3381 «Gloriae Cupiditate» opens the Livre 68 title page.

## Summary

- **Livre 67 = docx ¶1686–3380**, 12 October – 11 December 1876. The title page reads «depuis le jeudi 12 octobre 1876 jusqu'au lundi 11 décembre 1876 … depuis le samedi 18 novembre à Paris, depuis le jeudi 1er décembre à Nice».
- The 369 old IDs become 361 carried and 8 dropped (empty placeholders). **998 new paragraphs** (151.4k chars) bring the new total to **1,359**, numbered 067.0001–1359.
- The 37 old files (17 with IDs, 20 ID-less stubs) become **60 entries**, one per manuscript date (no cover entry: KRR 2026-09-28), 12 October – 11 December.
- **Restored text:**
  - everything from 12 October to 8 November (docx ¶1696–2643), except 067.0001–0008, which were already there (1 Nov);
  - the first paragraph of most days from 25 November to 7 December (see §2d);
  - 7 cut-short paragraphs, completed;
  - the pasted clippings at the end of the notebook (§3).
- **set_french: 11.** Seven are completions (0018, 0031, 0056, 0064, 0071, 0083, 0176), three fix double headings (0199, 0215, 0226), and one is a split (0207).
- **Kinds.** New: clipping ×51, editorial ×3, letter ×1, margin ×11, rayé ×11. Old: editorial ×1, margin ×3, rayé ×2.

## 1. Prerequisites

None. cz, uk, en and fr each hold the same 369 IDs, with no duplicates, and every non-empty embedded French copy matches `_original`. One small change landed on main after the plan was built: uk/067/1876-12-02-07.md (+2/−2) in 039b93618…a0e26aebe. The plan does not depend on it, and the worktree run used the current HEAD a0e26aebe.

## 2. Structure decisions

### 2a. Cover page

Withdrawn (KRR 2026-09-28); the text is recorded under «Withdrawn cover pages».

### 2b. Days and headings

- **Empty days (new «[Aucun texte - date seule mentionnée]»):**
  - 12, 18, 21 and 27 October;
  - 12, 13 and 14 November (after the kept headings 067.0045–0047);
  - 16 and 17 November (after 067.0111–0112);
  - 24 November (after 067.0193).
- **The date line of 7 Nov** reads «Mardi 7 novembre 1876 (26 octobre) [Une ligne cancellée]». The heading gets the date, and «[Une ligne cancellée]» becomes a rayé paragraph.
- **Double headings fixed with set_french.** Each of these clusters held an invented heading line followed by the real one:

  | Cluster | Old | New |
  |---|---|---|
  | 067.0199 | «# Dimanche 26 / ## Samedi 26 novembre» | «## Samedi 26 novembre 1876» |
  | 067.0215 | Lundi 27 / Dimanche 27 | «## Dimanche 27 novembre 1876» |
  | 067.0226 | Mardi 28 / Lundi 28 | «## Lundi 28 novembre 1876» |

- **Day shifts fixed.**
  - 067.0201–0207 are 25 November text (¶2917–2976) that had been filed under «26 novembre».
  - 067.0071–0110 are «Mercredi 15 novembre» text that had been filed under 16–18 Nov.
  - 067.0242–0243 are 1 December text.
  - 067.0001–0008 («1876-11-01-continued») are the end of the long 1 November entry.
- **067.0207 split.** It ended with «[Quatre lignes cancellées]», which the manuscript puts after the date line «Samedi 26 novembre 1876» (¶2978). The line is removed from 0207 by set_french and becomes a new rayé paragraph at the start of 26 Nov.
- **Marie's day numbers from 24 Nov to 11 Dec are one ahead of the weekday.** «Jeudi 24 novembre» was really the 23rd, and so on. She repeats «11» for Dimanche and Lundi. File names follow her numbers, as in the rest of the repo. The two «11 décembre» date lines share one entry, `1876-12-11.md`, with 067.0349 «## Lundi 11 décembre 1876» inside it (owner question 2).

### 2c. Completions: inline struck words the extraction lost, and one sentence

Each is inserted at its place in the old text:

| Cluster | Inserted text | docx ¶ |
|---|---|---|
| 067.0018 | «[Mots noircis : l'expression de sa figure me dit]» | ¶2655 |
| 067.0031 | «[Mots rayés : se parle]» | — |
| 067.0056 | «[Mots rayés : il fut si heureux que le jour même du mariage après la]» | — |
| 067.0064 | «[Mots rayés : se mit]» | — |
| 067.0071 | «[Mots rayés : pour me voir]» | — |
| 067.0083 | the missing sentence «Ah ! si c'était encore Dumas, ce serait superbe, Dumas met de la noblesse et de l'honneur dans ses livres lors même qu'on n'y rencontre que souterrains et échelles de soie.» | ¶2736 |
| 067.0176 | «[Rayé : du moins]» | — |

The exact insert positions are in `completions.json`.

### 2d. Other new text

- **The lost first paragraphs of the days**, as in 068, e.g. «Bientôt je n'écrirai plus rien…» (29 Nov) and «Ce matin à Marseille…» (1 Dec). The same applies to ¶3016 (27 Nov), ¶3076–3077 (27 Nov), ¶3121, 3125, 3129, 3132, 3137, 3141, 3147, 3158, 3177, 3189, 3192, 3197, and ¶3210–3222 (7 Dec).
- **1 November** is rebuilt around 067.0001–0008: the new ¶2203–2220 come before them and the new ¶2228–2325 after.
- **067.0020** («Revoir Antonelli me fait peur…») stays in 10 November. The draft tool moved it to 30 October on a false match with the short line «Je ne l'aime pas du tout.» (¶2094).
- **Letter:** ¶2090–2093 «Cher papa, … Ta fille qui t'aime.» (30 Oct), kind `letter`.
- **Editorial:**
  - ¶1852 «[IBas de page déchiré]», ¶1857 «[Bas de page déchiré]» (17 Oct);
  - ¶3322, the editors' note «Marie a noté le manuscrit jusqu'à la p. 271, manque la p. 272…»;
  - the old 067.0019 «[Marie est passée de la page 153 à 160…]» gets kind `editorial`.
- **Marie's own jotting.** ¶3321 «220 Nathalie etc.», printed under «Episode salon vieille maison Gavronzi…» (067.0369), is a new plain paragraph.
- **Line-break hyphens** are repaired («celle- ci»→«celle-ci», «éton- nements»→«étonnements», «d'An- tonelli»→«d'Antonelli», …).
- **Doubtful OCR** is left verbatim: «minu- es», «m'af- olent», «l'excentrici- téne», «rou- blés», «Aussi- oui».

### 2e. ID-less stubs (`drop_files`, 20)

Every stub is replaced by a new entry built from the docx: 1876-10-14 … 10-17, 10-18-19, 10-20, 10-21-22, 10-23, 10-24, 10-25-26, 10-27-29, 10-30, 10-31, 11-01, 11-02-03, 11-04 … 11-08.
- Where the stub name is kept (e.g. 1876-10-14.md), the new entry takes its frontmatter from the stub.
- Range stubs (10-18-19, 10-21-22, 10-25-26, 10-27-29, 11-02-03) give way to one entry per day. The tool redirects their URLs to the carnet index, because they carried no paragraph (owner question 5).

## 3. The clippings at the end of Livre 67 (docx ¶3323–3380, printed pp.221–226)

The 068 planner said the clippings sit before «Livre 68ème». **Verified:** in the docx and on the scan they follow the last line of «Lundi 11 décembre» and precede the Livre 68 title page ¶3381. They are the end of carnet 067 and go into the 1876-12-11 entry.

The docx OCR (styles Body text 9/12) is badly garbled. A subagent transcribed the text from the facsimile pages at 300–900 dpi, word by word against the OCR (`clip/clippings.json`). There are 2 «[illisible]» spots, both in the sommaire. The print's italics are not marked.

Each newspaper paragraph is one `clipping` paragraph. Title, date line and dividers are joined to the paragraph they head, and the signature to the last one.

| Order | Clipping | Paragraphs | Source (marker) | Tags |
|---|---|---|---|---|
| 1 | «Gazette de la Chambre, 4 décembre», signed Albert Millaud (the Cassagnac «Laissez parler l'accusé !» incident). Printed pp.221–222 | 33 | Le Figaro, Gazette de la Chambre par Albert Millaud, séance du 4 décembre 1876 | Le_Figaro |
| 2 | The newspaper's «SOMMAIRE» box, above the Antonelli article. It lists «Le cardinal Antonelli : Ignotus», «Echos de Paris : Le Masque de Fer» and «Gazette de la Chambre : Albert Millaud». This is what identifies the paper as Le Figaro. p.223 | 1 | Le Figaro, sommaire … novembre 1876 | Le_Figaro |
| 3 | «LE CARDINAL ANTONELLI», signed Ignotus. pp.223–224 | 9 | Le Figaro, Le cardinal Antonelli par Ignotus, novembre 1876 | Le_Figaro, Cardinal_Antonelli |
| 4 | News item on Antonelli's death («dans la nuit de dimanche à lundi», i.e. 5–6 Nov 1876). p.224 | 7 | Le Figaro, nouvelle de la mort du cardinal Antonelli, novembre 1876 | same |
| 5 | Faint facsimile on PDF p.228 (docx ¶3380 is an empty picture slot). Unreadable | 1 | placeholder «[Coupure de presse collée, illisible sur le fac-similé]», kind clipping | — |

- **The «Livre 67» clippings versus 062 (lead's question).** The Ignotus article in tome08 ¶2585–2599 is a *different* article. It is the June 1876 portrait of Antonelli that Marie read on 27 June («Lisez-le…», tome08 ¶2603–2604). It belongs to 062/1876-06-27, where `_original` has only the placeholder 062.0633 «[La suite est l'article du Figaro sur le Cardinal Antonelli, transcrit en détail dans le journal]». The November obituary here even quotes it («mon ancien portrait du cardinal»). **Nothing moves from 062.** Restoring the June article in 062 (as a clipping, in place of or after 062.0633) is a separate 062 task.
- The draft tool moved **068.0001 (the Livre 68 cover) into 067**, because it placed the Livre 68 boundary one paragraph too late. This plan does not touch 068.

## 4. Drawings

There are no drawings in 067, and none in 065 or 066. The docx picture slots in this range are:
- ¶1250 (22 Sep; on the scan it is only the page number «85» set as an image);
- ¶3362 and ¶3380, the clipping facsimiles.

The figure candidates on the scan in this range are the clipping pages.

## 5. Owner questions

1. **Clippings.**
   - Keep one paragraph per newspaper paragraph (51 paragraphs, ~11k chars of Figaro prose for every translation tree)? The alternative is one paragraph per article (4).
   - Should translators translate clippings at all, or leave them in French?
2. **11 December ×2.** One entry with both date lines, as in the plan, or `1876-12-11.md` plus `1876-12-11-lundi.md`?
3. **The illegible clipping** (PDF p.228). Keep the bracketed placeholder paragraph, or leave it out?
4. (withdrawn: the cover pages are out of the plan, see «Withdrawn cover pages»)
5. **URLs of removed range stubs** (066/1876-10-12-13, 067/1876-10-18-19, 10-21-22, 10-25-26, 10-27-29, 11-02-03) redirect to the carnet index. Do you want manual redirects to the first day instead?
6. **Flag reset:** 56 of 60 entries per tree lose their flags. The others are new.
7. **062.0633 follow-up.** Queue a 062 task to restore the June Ignotus article, tome08 ¶2585–2599?

## 6. Tool notes (for toolsmith)

- **`renumber-check 066` warns twice** about «066.DROPPED-…» references. Both are inside historical comments: an ED comment in en/066/1876-09-25 and an RSR comment in 065/1876-08-24 that quotes «066.0017». This is harmless; leave it or reword it by hand.
- **Footnote labels are renamed on collision** in merged files (`[^1b]`, `[^1bb]`, `[^1bbb]` in 065/1876-08-23 and en). The result is valid but ugly; a later cleanup could renumber footnotes per file.
- **`redirect_from` cannot point an old file of carnet A to an entry in carnet B.** The multi-carnet run does link moved entries (`linkMovedEntries`). A removed ID-less stub has no paragraph, so it falls back to the carnet index.

## 7. Gate results

These are for all three plans applied together with `--multi --write` in a throwaway worktree (first at HEAD a0e26aebe; re-run without covers at HEAD b614998b5, same results). The worktree was removed afterwards.

```
RESULT: PASS (0 fail, 0 warn)
  [WARN] content/en/066/1876-09-25.md:20: reference to a dropped paragraph (066.DROPPED-…)
  [WARN] content/_original/065/1876-08-24.md:30: reference to a dropped paragraph (066.DROPPED-…)
RESULT: PASS (0 fail, 2 warn)
RESULT: PASS (0 fail, 0 warn)
065 _original verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
065 cz verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
065 uk verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
065 en verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
065 fr verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
066 _original verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
066 cz verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
066 uk verify: RESULT: PASS (0 fail, 1 warn) | splicescan lines: 0
066 en verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
066 fr verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
067 _original verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
067 cz verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
067 uk verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
067 en verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
067 fr verify: RESULT: PASS (0 fail, 0 warn) | splicescan lines: 0
check-comments: OK (_original)
```

- `rebuild-carnets --write` (without covers): 065 760, 066 800, 067 1359 paragraphs. renumber-check: 065 PASS 0 warn; 066 PASS, 2 warn (§6); 067 PASS 0 warn.
- The uk/066 warn is the pre-existing latin-in-cyr «<u>Богородиця» (REVIEW-066 §1).
- The run used the plans before two text-only touch-ups: line-break hyphens repaired in 31 new paragraphs, and «nobles-se»→«noblesse» in the 067.0083 completion. The final plans were then re-validated with a `--multi` dry run on main (accepted).

The completeness recheck was `just source-completeness 065 066 067` on the rebuilt worktree:

| Carnet | Unmatched tome ¶ | Missing diary text |
|---|---|---|
| 065 | 1 | none: ¶202 «et Mardi 22 août…» is inside heading cluster 065.0127 |
| 066 | 1 | none: ¶1214, which the plan corrects to «demi-page» |
| 067 | 36 | none |

The 36 in 067 are OCR variants of text that is present:
- the cover mottos (in the first run; the covers are now withdrawn, so ¶1686–1695 are unmatched by design);
- the «Deux paysans» dialogue lines ¶2864–2885 inside 067.0197 («je |'aj prise», «Quoj ?»);
- the clipping OCR ¶3323–3372, which is replaced by the transcription.

**0 missing diary paragraphs.**


## Withdrawn cover pages (for when the manuscript is available)

Owner decision KRR 2026-09-28: no cover entries until the manuscript is scanned. Text as printed, Mon Journal t.9 p.119 (docx ¶1686–1695). The print has «o[f]]»; the mottos are printed garbled, and the OCR's «fatino»/«Francai» were read from the scan as «fauno»/«Francsi»:
```
Gloriae Cupiditate
H[is] G[race] D[uke] o[f]] H[amilton]
Livre 67ème
depuis le jeudi 12 octobre 1876
jusqu'au lundi 11 décembre 1876
Gavronzi ou Poltava
depuis le samedi 18 novembre à Paris
depuis le jeudi 1er décembre à Nice.

Ment sana in corpore sano
Tutto fano nulla sauna
Tutto saumo, nulla fauno
Gara voit sa Francsi
Piu gli pesi mon fi danus (Alfieri)
Mont sana in corpore sano
```

### Old layout (17 files with IDs, 369 IDs)

| Old file | IDs |
|---|---|
| 1876-11-01-continued.md | 8 |
| 1876-11-09.md | 5 |
| 1876-11-10.md | 11 |
| 1876-11-11.md | 20 |
| 1876-11-12-15.md | 26 |
| 1876-11-16-18.md | 56 |
| 1876-11-19.md | 27 |
| 1876-11-20.md | 9 |
| 1876-11-21.md | 18 |
| 1876-11-22.md | 12 |
| 1876-11-24-25.md | 6 |
| 1876-11-26.md | 16 |
| 1876-11-27.md | 11 |
| 1876-11-28.md | 7 |
| 1876-11-29-30-12-01.md | 7 |
| 1876-12-02-07.md | 32 |
| 1876-12-08-11.md | 98 |

### New layout (60 entries)

| New file | Heading | carried | moved in | new | new chars | set_french | kinds |
|---|---|---|---|---|---|---|---|
| 1876-10-12.md | Jeudi 12 octobre 1876 (30 septembre) | 0 | 0 | 1 | 37 |  |  |
| 1876-10-13.md | Vendredi 13 octobre 1876 (1er octobre) | 0 | 0 | 43 | 10,327 |  | margin×2 |
| 1876-10-14.md | Samedi 14 octobre 1876 (2 octobre) | 0 | 0 | 19 | 3,646 |  |  |
| 1876-10-15.md | Dimanche 15 octobre 1876 (3 octobre) | 0 | 0 | 4 | 797 |  |  |
| 1876-10-16.md | Lundi 16 octobre 1876 (4 octobre) | 0 | 0 | 36 | 10,896 |  | margin×2, rayé×1 |
| 1876-10-17.md | Mardi 17 octobre 1876 (5 octobre) | 0 | 0 | 55 | 5,676 |  | rayé×1, editorial×2 |
| 1876-10-18.md | Mercredi 18 octobre 1876 (6 octobre) | 0 | 0 | 1 | 37 |  |  |
| 1876-10-19.md | Jeudi 19 octobre 1876 (7 octobre) | 0 | 0 | 21 | 4,728 |  |  |
| 1876-10-20.md | Vendredi 20 octobre 1876 (8 octobre) | 0 | 0 | 20 | 2,723 |  |  |
| 1876-10-21.md | Samedi 21 octobre 1876 (9 octobre) | 0 | 0 | 1 | 37 |  |  |
| 1876-10-22.md | Dimanche 22 octobre 1876 (10 octobre) | 0 | 0 | 9 | 2,836 |  |  |
| 1876-10-23.md | Lundi 23 octobre 1876 (11 octobre) | 0 | 0 | 75 | 9,106 |  | rayé×1, margin×1 |
| 1876-10-24.md | Mardi 24 octobre 1876 (12 octobre) | 0 | 0 | 16 | 2,694 |  | margin×1 |
| 1876-10-25.md | Mercredi 25 octobre 1876 (13 octobre) | 0 | 0 | 12 | 2,442 |  |  |
| 1876-10-26.md | Jeudi 26 octobre 1876 (14 octobre) | 0 | 0 | 19 | 4,111 |  | margin×2 |
| 1876-10-27.md | Vendredi 27 octobre 1876 (15 octobre) | 0 | 0 | 1 | 37 |  |  |
| 1876-10-28.md | Samedi 28 octobre 1876 (16 octobre) | 0 | 0 | 23 | 5,242 |  | rayé×1 |
| 1876-10-29.md | Dimanche 29 octobre 1876 (17 octobre) | 0 | 0 | 17 | 3,486 |  |  |
| 1876-10-30.md | Lundi 30 octobre 1876 (18 octobre) | 0 | 0 | 19 | 3,371 |  | letter×1 |
| 1876-10-31.md | Mardi 31 octobre 1876 (19 octobre) | 0 | 0 | 90 | 11,450 |  | rayé×1 |
| 1876-11-01.md | Mercredi 1er novembre 1876 (20 octobre) | 8 | 0 | 114 | 8,360 |  | margin×1 |
| 1876-11-02.md | Jeudi 2 novembre 1876 (21 octobre) | 0 | 0 | 20 | 4,044 |  | rayé×1 |
| 1876-11-03.md | Vendredi 3 novembre 1876 (22 octobre) | 0 | 0 | 40 | 4,753 |  | margin×1 |
| 1876-11-04.md | Samedi 4 novembre 1876 (23 octobre) | 0 | 0 | 64 | 7,475 |  | margin×1 |
| 1876-11-05.md | Dimanche 5 novembre 1876 (24 octobre) | 0 | 0 | 28 | 4,273 |  |  |
| 1876-11-06.md | Lundi 6 novembre 1876 (25 octobre) | 0 | 0 | 11 | 1,295 |  | rayé×1 |
| 1876-11-07.md | Mardi 7 novembre 1876 (26 octobre) | 0 | 0 | 114 | 7,370 |  | rayé×2 |
| 1876-11-08.md | Mercredi 8 novembre 1876 (27 octobre) | 0 | 0 | 35 | 4,008 |  |  |
| 1876-11-09.md | Jeudi 9 novembre 1876 (28 octobre) | 5 | 0 | 0 | 0 |  |  |
| 1876-11-10.md | Vendredi 10 novembre 1876 (29 octobre) | 11 | 0 | 0 | 0 | 0018 | editorial×1 |
| 1876-11-11.md | Samedi 11 novembre 1876 (30 octobre) | 20 | 0 | 0 | 0 | 0031 |  |
| 1876-11-12.md | Dimanche 12 novembre 1876 (31 octobre) | 1 | 0 | 1 | 37 |  |  |
| 1876-11-13.md | Lundi 13 novembre 1876 (1er novembre) | 1 | 0 | 1 | 37 |  |  |
| 1876-11-14.md | Mardi 14 novembre 1876 (2 novembre) | 1 | 0 | 1 | 37 |  |  |
| 1876-11-15.md | Mercredi 15 novembre 1876 (3 novembre) | 63 | 0 | 0 | 0 | 0056 0064 0071 0083 | margin×1 |
| 1876-11-16.md | Jeudi 16 novembre 1876 | 1 | 0 | 1 | 37 |  |  |
| 1876-11-17.md | Vendredi 17 novembre 1876 | 1 | 0 | 1 | 37 |  |  |
| 1876-11-18.md | Samedi 18 novembre 1876 | 14 | 0 | 0 | 0 |  | margin×1 |
| 1876-11-19.md | Dimanche 19 novembre 1876 | 27 | 0 | 0 | 0 |  |  |
| 1876-11-20.md | Lundi 20 novembre 1876 | 9 | 0 | 0 | 0 |  | margin×1 |
| 1876-11-21.md | Mardi 21 novembre 1876 | 18 | 0 | 0 | 0 | 0176 | rayé×1 |
| 1876-11-22.md | Mercredi 22 novembre 1876 | 12 | 0 | 0 | 0 |  |  |
| 1876-11-24.md | Jeudi 24 novembre 1876 | 1 | 0 | 1 | 37 |  |  |
| 1876-11-25.md | Vendredi 25 novembre 1876 | 12 | 0 | 1 | 196 | 0207 |  |
| 1876-11-26.md | Samedi 26 novembre 1876 | 8 | 0 | 2 | 52 | 0199 | rayé×2 |
| 1876-11-27.md | Dimanche 27 novembre 1876 | 10 | 0 | 3 | 409 | 0215 |  |
| 1876-11-28.md | Lundi 28 novembre 1876 | 6 | 0 | 0 | 0 | 0226 |  |
| 1876-11-29.md | Mardi 29 novembre 1876 | 2 | 0 | 1 | 76 |  |  |
| 1876-11-30.md | Mercredi 30 novembre 1876 | 2 | 0 | 0 | 0 |  |  |
| 1876-12-01.md | Jeudi 1er décembre 1876 | 4 | 0 | 2 | 163 |  |  |
| 1876-12-02.md | Vendredi 2 décembre 1876 | 9 | 0 | 5 | 1,307 |  |  |
| 1876-12-03.md | Samedi 3 décembre 1876 | 3 | 0 | 1 | 233 |  |  |
| 1876-12-04.md | Dimanche 4 décembre 1876 | 2 | 0 | 0 | 0 |  |  |
| 1876-12-05.md | Lundi 5 décembre 1876 | 4 | 0 | 1 | 164 |  |  |
| 1876-12-06.md | Mardi 6 décembre 1876 | 6 | 0 | 3 | 583 |  |  |
| 1876-12-07.md | Mercredi 7 décembre 1876 | 2 | 0 | 12 | 2,067 |  |  |
| 1876-12-08.md | Jeudi 8 décembre 1876 | 4 | 0 | 0 | 0 |  |  |
| 1876-12-09.md | Vendredi 9 décembre 1876 | 12 | 0 | 0 | 0 |  |  |
| 1876-12-10.md | Samedi 10 décembre 1876 | 40 | 0 | 0 | 0 |  |  |
| 1876-12-11.md | Dimanche 11 décembre 1876 | 42 | 0 | 53 | 20,630 |  | rayé×1, editorial×1, clipping×51 |

Total new paragraphs: 998, 151,359 chars.
