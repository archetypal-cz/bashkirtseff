# Carnet 066 rebuild plan: review (2026-09-28)

Plan: `plan-066.json`. Run it with 065 and 067: `just rebuild-carnets plan-065.json plan-066.json plan-067.json`.
A variant that is valid on its own is `standalone/plan-066.json`. It keeps 066.0001–0173 in 066 as holding entries dated 1876-08-21 … 08-29.
Method, sources and scripts are as in REVIEW-065.
Source range: tome09.docx ¶852 (Livre 66 title page) to ¶1685 (the last line of «Mercredi 11 octobre 1876»). ¶1686 opens the Livre 67 title page «depuis le jeudi 12 octobre 1876».

## Summary

- **Livre 66 = docx ¶852–1685**, 3 September – 11 October 1876. This includes the booklet ¶1491–1685 (4–11 October), which has a title page of its own marked «Livre 67ème» (§2a, owner question 1).
- **IDs.** Of the 532 old IDs:
  - 354 are carried.
  - 166 move out to 065 (REVIEW-065 §3).
  - 12 are dropped.
  - 446 paragraphs are new (77.5k chars).
  - The new total is **800**, numbered 066.0001–0800.
- **Entries.** The 37 old files (33 with IDs, 4 ID-less stubs) become **39 entries**, one per manuscript date (no cover entry: KRR 2026-09-28), 3 September – 11 October.
- **Restored text.**
  - All of 3–15 September (¶856–1139).
  - The ends of 24, 27 and 29 September.
  - The end of 6 October, and 7–11 October.
  - Two cut-short paragraphs are completed.
- **set_french: 10.**
  - 2 completions: 066.0384 and 066.0420.
  - 8 letter quotings: 066.0450–0457.
- **Kinds.**
  - New: editorial ×2, letter ×3, margin ×7, rayé ×6.
  - Old: margin ×11, rayé ×2, letter ×8, other ×2.
- **Gates** (REVIEW-067 §7): all PASS, completeness 0 missing.

## 1. Prerequisites

None left. en/066/1876-09-25 was fixed in 2bfa7fd66.
- cz, uk, en and fr each hold the same 532 IDs, with no duplicates.
- Every non-empty embedded French copy matches its `_original` paragraph.
- The identity dry run is a zero diff.
- Pre-existing and unchanged: uk/066 `verify-carnet` WARN latin-in-cyr «<u>Богородиця» (1876-09-27). It is the uk copy of the stray `<u>` tag that this plan removes from 066.0384.

## 2. Structure decisions

### 2a. The «Livre 67ème» booklet of 4–11 October

¶1491–1495 («His Grace the Duc of Hamilton / Gloriae Cupiditate / Livre 67ème / [4 octobre au 11 octobre 1876] / Gavronzi», printed p.105) is a notebook title page. A second, dated «Livre 67ème» title page follows at ¶1686 («depuis le jeudi 12 octobre 1876 jusqu'au lundi 11 décembre 1876»). Marie's Livre 66 cover runs «jusqu'au jeudi 12 octobre 1876». Her own dates therefore put 4–11 October in Livre 66, and `_original` has always had it there (066.0471–0532).

**Plan:** keep it in 066. Its title page is withdrawn with the other covers (KRR 2026-09-28); only the editors' bracketed dates stay, as a kind editorial paragraph at the end of 1876-10-03.md. The bracketed dates ¶1494 are the edition's addition, so they become kind `editorial`. Moving the booklet to 067 would move 62 old paragraphs across carnets, plus the new 6–11 October text (owner question 1).

### 2b. Heading and empty clusters dropped (12)

- The empty placeholders 066.0290, 0365, 0393, 0470 and 0498 have no text in `_original` or any tree. For 066.0290, en holds only the placeholder «[No further text]».
- 066.0166 «[Entry content missing from source]» is the stub for the lost stretch, now restored.
- 066.0017 duplicates the «Jeudi 24 août» heading (the day keeps 066.0104).
- 066.0119, 0129, 0137, 0156 and 0167 are «Jeudi, 24 août 1876 (12 août) (suite)», continuation headings the 2026-09-26 sweep invented.

### 2c. ID-less stub files (`drop_files`)

- 1876-10-07.md and 1876-10-08.md are replaced by new entries of the same name, built from the docx. Their frontmatter comes from the stub.
- 1876-10-09-11.md is replaced by 1876-10-09 / 10 / 11.md.
- 1876-10-12-13.md belongs to Livre 67. 067 gets 1876-10-12.md and 1876-10-13.md. The URL `/…/066/1876-10-12-13` has no successor in 066, so the tool redirects it to the carnet index (owner question 5).

### 2d. Completions (`set_french`)

- **066.0384** was cut at «car cela s'est embrouillé». It gains the rest of ¶1357: «davantage après. Et puis, dois-je le dire, tu riras… sans être vu.».
  - The stray printed-footnote marker «^1^» is removed, and the footnote `[^1]` is kept.
  - «<u>Vierge porte ma</u>lheur» becomes «Vierge porte malheur».
  - ¶1358–1391 follow as new paragraphs.
- **066.0420** was cut at «que j'éclatai de». It gains «rire, et la vue de son visage … de ces jambes.» (¶1426). ¶1427–1441 follow as new paragraphs.

### 2e. Letters and other copied text

The print sets each of these in from both margins.

- **066.0449–0457 (3 Oct).** 066.0449 is «Ma journée est contenue dans une lettre que je viens d'écrire et que voici, c'est une réponse à Collignon…». 066.0450–0457 are that letter (printed pp.102–103). They get kind `letter`, source «Lettre de Marie à Collignon (copie), 3 octobre 1876», and `> ` quoting via `set_french`.
- **066.0360–0361 (25 Sep).** This is the dedication Marie dictates to Michel Eristoff for the back of his portrait («Je soussigné, le plus dévergondé des gommeux…»). It gets kind `other` with a source, and is not quoted, because it is not a letter (owner question 3).
- **New letters:**

| docx ¶ | Day | What |
|---|---|---|
| ¶1567–1568 | 6 Oct | «Mon cher, J'ai besoin du plan de la forêt…», a note to Alexandre |
| ¶1641–1643 | 11 Oct | letter to a newspaper editor signed «Amanda», about Albert Millaud's «histoire du petit Gambetta» |
| ¶1645–1647 | 11 Oct | a second letter to an editor, «pour le citoyen L. G.» |

  Each is one paragraph, kind `letter`. The tool quotes it.

### 2f. Other new-text decisions

- **Empty days:** 11 September, 5 October, 9 October and 10 October get «[Aucun texte - date seule mentionnée]».
- **¶1214 «[Une deùi-page blanche]»** (18 Sep) becomes «[Une demi-page blanche]», kind `editorial`. It is the editors' description of the manuscript.
- **Other kinds** on whole bracketed paragraphs, old and new, as in 068: `[En travers…]` / `[Dans la marge…]` / `[En haut de la page:]` / `[Annotation…]` → margin; `[… cancellée(s)]` / `[Mots noircis]` → rayé.
- **066.0468 «[En haut de la page:]»** and the line it announces, 066.0469 «- Lampes à Amours…», are both margin.
- **The printed footnote «Figurez-vous : expression de portier !»** (p.24, spliced into docx ¶408) stays out, per the owner rule. It is not in `_original` either.
- **Line-break hyphens** are repaired («deman- dai-je»→«demandai-je», «eux- mêmes»→«eux-mêmes», …).
- **OCR slips** that are not certain are left verbatim for the RSR/OCR pass, as in 068.

### 2g. Cover page

Withdrawn (KRR 2026-09-28); see «Withdrawn cover pages».

## 3. Cross-carnet moves

066.0001–0173 (166 IDs, 7 dropped) → 065. The table is in REVIEW-065 §3, and the full list is in `plan-065.json` → `_cross_carnet`. Nothing moves into 066.

## 4. Owner questions

1. **4–11 October booklet**: keep it in 066 (the plan, which follows Marie's Livre 66 and Livre 67 cover dates) or move it to 067 (following the physical title page «Livre 67ème»)?
2. **Letters quoted via set_french** (066.0450–0457) add SOURCE CHANGED notes in 4 trees. Confirm.
3. **066.0360–0361**: is the dedication kind `other`, as planned, or `letter` (quoted)?
4. **Flag reset:** 29 of 39 entries per tree lose their approval flags. The other 10 are new.
5. The **old URL 066/1876-10-12-13** had no text. It now redirects to the 066 index. Should it redirect to 067/1876-10-13 instead? That needs a manual edit to `redirects.json`, because `redirect_from` cannot name a file in another carnet.

## 5. Differences from the draft tool

- The draft keeps 066.0166 and the five «(suite)» headings, and keeps 066.0290 because en has text there. The en text is only a placeholder.
- It proposes no completion for 066.0384 (it found it as "not in the docx").
- It uses OCR text for the covers.
- It makes `[Dans la marge…]` ¶1043 and `[En travers…]` a clipping, because the docx style differs. They are margin notes.
- About 427 of the 446 new texts are identical. The rest differ only in OCR repair or grouping.


## Withdrawn cover pages (for when the manuscript is available)

Owner decision KRR 2026-09-28: no cover entries or cover paragraphs until the manuscript is scanned. Texts as printed:

- Livre 66, Mon Journal t.9 p.55 (docx ¶852–855; OCR «off]» read as «o[f]»):
```
H[is] G[race] t[he] D[uke] o[f] H[amilton]
Gloriae Cupiditate
Livre 66ème
depuis le dimanche 3 septembre 1876
jusqu'au jeudi 12 octobre 1876
Gavronzi
```
- The 4–11 October notebook, Mon Journal t.9 p.105 (docx ¶1491–1495). It would sit at the end of 1876-10-03. The editors' bracketed dates ¶1494 «[4 octobre au 11 octobre 1876]» **stay in the plan** as a kind editorial paragraph at that spot.
```
His Grace the Duc of Hamilton
Gloriae Cupiditate
Livre 67ème
[4 octobre au 11 octobre 1876]
Gavronzi
```

### Old layout (33 files with IDs, 532 IDs)

| Old file | IDs |
|---|---|
| 1876-09-03.md | 16 |
| 1876-09-04.md | 29 |
| 1876-09-05.md | 15 |
| 1876-09-06.md | 10 |
| 1876-09-07.md | 9 |
| 1876-09-08.md | 24 |
| 1876-09-09.md | 15 |
| 1876-09-10.md | 10 |
| 1876-09-11.md | 8 |
| 1876-09-12.md | 19 |
| 1876-09-13.md | 9 |
| 1876-09-14.md | 2 |
| 1876-09-15.md | 7 |
| 1876-09-16.md | 49 |
| 1876-09-17.md | 18 |
| 1876-09-18.md | 7 |
| 1876-09-19.md | 10 |
| 1876-09-20.md | 5 |
| 1876-09-21.md | 6 |
| 1876-09-22.md | 14 |
| 1876-09-23.md | 8 |
| 1876-09-24.md | 33 |
| 1876-09-25.md | 42 |
| 1876-09-26.md | 2 |
| 1876-09-27.md | 17 |
| 1876-09-28.md | 9 |
| 1876-09-29.md | 27 |
| 1876-09-30.md | 5 |
| 1876-10-01.md | 14 |
| 1876-10-02.md | 8 |
| 1876-10-03.md | 23 |
| 1876-10-04.md | 28 |
| 1876-10-06.md | 34 |

### New layout (39 entries)

| New file | Heading | carried | moved in | new | new chars | set_french | kinds |
|---|---|---|---|---|---|---|---|
| 1876-09-03.md | Dimanche 3 septembre 1876 (22 août) | 0 | 0 | 25 | 7,419 |  |  |
| 1876-09-04.md | Lundi 4 septembre 1876 (23 août) | 0 | 0 | 7 | 2,108 |  | rayé×1 |
| 1876-09-05.md | Mardi 5 septembre 1876 (24 août) | 0 | 0 | 22 | 3,040 |  | rayé×1 |
| 1876-09-06.md | Mercredi 6 septembre 1876 (25 août) | 0 | 0 | 14 | 3,539 |  |  |
| 1876-09-07.md | Jeudi 7 septembre 1876 (26 août) | 0 | 0 | 26 | 3,984 |  | margin×1 |
| 1876-09-08.md | Vendredi 8 septembre 1876 (27 août) | 0 | 0 | 28 | 4,069 |  | margin×1 |
| 1876-09-09.md | Samedi 9 septembre 1876 (28 août) | 0 | 0 | 20 | 5,363 |  |  |
| 1876-09-10.md | Dimanche 10 septembre 1876 (29 août) | 0 | 0 | 27 | 6,399 |  |  |
| 1876-09-11.md | Lundi 11 septembre 1876 (30 août) | 0 | 0 | 1 | 37 |  |  |
| 1876-09-12.md | Mardi 12 septembre 1876 (31 août) | 0 | 0 | 22 | 4,276 |  |  |
| 1876-09-13.md | Mercredi 13 septembre 1876 (1er sept.) | 0 | 0 | 9 | 2,451 |  |  |
| 1876-09-14.md | Jeudi 14 septembre 1876 (2 septembre) | 0 | 0 | 36 | 5,191 |  |  |
| 1876-09-15.md | Vendredi 15 septembre 1876 (3 septembre) | 0 | 0 | 32 | 3,972 |  | margin×1, rayé×1 |
| 1876-09-16.md | Samedi 16 septembre 1876 (4 septembre) | 49 | 0 | 0 | 0 |  | margin×2 |
| 1876-09-17.md | Dimanche 17 septembre 1876 (5 septembre) | 18 | 0 | 0 | 0 |  |  |
| 1876-09-18.md | Lundi 18 septembre 1876 (6 septembre) | 7 | 0 | 1 | 23 |  | editorial×1 |
| 1876-09-19.md | Mardi 19 septembre 1876 (7 septembre) | 10 | 0 | 0 | 0 |  | margin×1 |
| 1876-09-20.md | Mercredi 20 septembre 1876 (8 septembre) | 5 | 0 | 0 | 0 |  |  |
| 1876-09-21.md | Jeudi 21 septembre 1876 (9 septembre) | 6 | 0 | 0 | 0 |  | margin×1 |
| 1876-09-22.md | Vendredi 22 septembre 1876 (10 septembre) | 14 | 0 | 0 | 0 |  | rayé×1 |
| 1876-09-23.md | Samedi 23 septembre 1876 (11 septembre) | 7 | 0 | 0 | 0 |  | margin×1 |
| 1876-09-24.md | Dimanche 24 septembre 1876 (12 septembre) | 33 | 0 | 6 | 680 |  | margin×1 |
| 1876-09-25.md | Lundi 25 septembre 1876 (13 septembre) | 41 | 0 | 0 | 0 |  | margin×1, other×2 |
| 1876-09-26.md | Mardi 26 septembre 1876 (14 septembre) | 2 | 0 | 0 | 0 |  |  |
| 1876-09-27.md | Mercredi 27 septembre 1876 (15 septembre) | 17 | 0 | 34 | 4,326 | 0384 | margin×1, rayé×1 |
| 1876-09-28.md | Jeudi 28 septembre 1876 (16 septembre) | 8 | 0 | 0 | 0 |  |  |
| 1876-09-29.md | Vendredi 29 septembre 1876 (17 septembre) | 27 | 0 | 15 | 1,066 | 0420 |  |
| 1876-09-30.md | Samedi 30 septembre 1876 (18 septembre) | 5 | 0 | 0 | 0 |  |  |
| 1876-10-01.md | Dimanche 1er octobre 1876 (19 septembre) | 14 | 0 | 0 | 0 |  |  |
| 1876-10-02.md | Lundi 2 octobre 1876 (20 septembre) | 8 | 0 | 0 | 0 |  |  |
| 1876-10-03.md | Mardi 3 octobre 1876 (21 septembre) | 22 | 0 | 1 | 30 | 0450 0451 0452 0453 0454 0455 0456 0457 | letter×8, rayé×1, margin×2, editorial×1 |
| 1876-10-04.md | Mercredi 4 octobre 1876 (22 septembre) | 27 | 0 | 0 | 0 |  |  |
| 1876-10-05.md | Jeudi 5 octobre 1876 (23 septembre) | 0 | 0 | 1 | 37 |  |  |
| 1876-10-06.md | Vendredi 6 octobre 1876 (24 septembre) | 34 | 0 | 16 | 2,540 |  | margin×3, letter×1 |
| 1876-10-07.md | Samedi 7 octobre 1876 (25 septembre) | 0 | 0 | 23 | 5,082 |  |  |
| 1876-10-08.md | Dimanche 8 octobre 1876 (26 septembre) | 0 | 0 | 26 | 3,793 |  | rayé×2, margin×1 |
| 1876-10-09.md | Lundi 9 octobre 1876 (27 septembre) | 0 | 0 | 1 | 37 |  |  |
| 1876-10-10.md | Mardi 10 octobre 1876 (28 septembre) | 0 | 0 | 1 | 37 |  |  |
| 1876-10-11.md | Mercredi 11 octobre 1876 (29 septembre) | 0 | 0 | 52 | 7,968 |  | letter×2, margin×1 |

Total new paragraphs: 446, 77,467 chars.
