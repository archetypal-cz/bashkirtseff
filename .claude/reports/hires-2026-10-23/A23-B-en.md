# A23-B-en — sharp-scan source fixes carried into the en tree, carnets 021–030 (2026-10-24)

Package B-A23-en under BRIEF-B. Tree: **en only**. Source changes: commit e5f0144b18 (report `A2.md`, 021–025) and commit 7df5778edd (report `A3.md`, 026–030). The lead had already run `just sync C en --footnotes`. That sync had updated the embedded French, put mechanical r-refs at the ends of lines and put most r-definitions at the end of each file. I followed the approach of `A1-B-en.md`.

## What was done

I checked all **314** en paragraphs in 021–030 that carry an r-label in `_original`. This covers every pid in the A2 and A3 impact lists, plus the few paragraphs that already had marks (021.0165 r1, 021.0255, 021.0310, 025.0268, 027.0127, 030.0124). Each one was compared against `_original`. After the fix, all 314 pass a scripted check:

- every label wraps its English rendering as `==…==[^CCC.NNNN.rK]`, with the ref right after the closing `==`;
- each label has exactly one definition, with the standard en text, on its own line after its own paragraph (blank line before). Definitions that sync had left at the end of the file were moved;
- there are no mechanical or stray r-refs, and every paragraph has an even `==` count.

Each changed paragraph has one `TR: source fix (sharp scan 2026-10-23): …` comment on its own line after the text. There are **315 comments**: 311 r-paragraphs plus four word fixes in paragraphs that have no r-label. Visible text and definition lines were patched by a checked script. Every TR comment line, and the one new tag line, was inserted with the Edit tool.

| carnet | paragraphs changed | unchanged r-paragraphs (already right) |
|---|---|---|
| 021 | 44 (42 r + 0387, 0392) | 0255, 0310 |
| 022 | 41 | — |
| 023 | 53 (51 r + 0005, 0458) | — |
| 024 | 18 | — |
| 025 | 25 | 0268 |
| 026 | 2 | — |
| 027 | 37 | — |
| 028 | 5 | — |
| 029 | 9 | — |
| 030 | 81 | — |

No pid from either impact list was skipped.

## Word changes

| pid | change |
|---|---|
| 021.0032 | The English had "Bouver et tourner". It now reads «*Bouver et foumer*», and note [^1] reads "Macainne's mangled French for *boire et fumer* (drink and smoke)." |
| 021.0387 | `[Crossed out: but]` → `[Crossed out: that is true, but]` |
| 021.0392 | «!!!!!»: five marks, as printed. «physionnomies» is a spelling-only change. |
| 023.0005 | "Proof: Girotta I" → "Proof: Girofla!". The source tag `[#Emile_d_Audiffret]` was added (Edit tool). |
| 023.0458 | The English had dropped the garbled words. It now reads "the front row of the seats reserved by desired persons", following the editor's bracketed reading «personne[s] désiré[e]s». The TR comment notes that Marie may have meant «désirés par personne» (wanted by nobody). |
| 025.0043 | "a *mferdje*[^2]" → "a s[hi]t", which mirrors the editor's «m[erd]e». Tree note [^2], which called it an unidentified Russian word, was dropped. |
| 025.0052 | "My name again!! Again" (two marks). |
| 027.0252 | "of the cairn breed" → "of the ==*pug*== breed". This matches 026.0039 "pug". |
| 029.0029 | «en arrière»: the English already read "was looking back", so nothing changed. |
| 030.0129 | «à la mienne»: the English already read "had spoken to mine", so nothing changed and no comment was added. |

These need no English change: 021.0083 «essouflée», 023.0228 «Italien», 023.0286 «1875», 028.0230 «pélerine», 030.0003/0025 «Merjeewski» (the tree keeps Merjeewsky), 030.0124 «Impératrice».

## Changes beyond plain wrapping

- **Inherited italics and bold were dropped** from the runs. 021.0262 and 021.0446 also had bold from star debris, and 029.0076 had a stray closing `*`.
- **Italics kept inside a mark where the print has them:** 023.0289 *varenikis*, 023.0405 *Mademoiselle*, 027.0040, 027.0088, 027.0223, 027.0251, 027.0252, 027.0391, 029.0029 (the first *reveller*), 030.0077, 030.0247 *cocottes*, 030.0412. Ship names stay italic: 030.0115, 0204, 0209.
- **Print italics restored in r-paragraphs I was already editing:** 024.0270 *majestic*, 025.0119 (the middle *the little peasant*), 027.0127, 027.0287 *tables*, 027.0391 *what?*, 030.0077 *lustre*, 030.0124 *prosphora*, 030.0292, 030.0434 *perfectly*.
- **Tree notes that only claimed a language were replaced by the r-footnote:**
  - 021.0318 [^2] («si bon» called French);
  - 021.0571 [^4] (*toqué*, French);
  - 023.0122 [^1] (see below);
  - 024.0393 [^024.0393.1] (*moujik*, French);
  - 028.0158 [^2] (*bel homme*);
  - 030.0021 [^1] (*comme il faut*).
- **Notes kept, with the wrong language claim removed:**
  - 028.0230 [^1] now reads only "Skunk fur was fashionable trim in the 1870s.";
  - 029.0076 [^2] is now a gloss of *barine*;
  - 027.0389 [^6] now says that the edition prints the Russian in the editor's French;
  - 030.0412: the inline note keeps only the gloss on the censorship committee.
- **Notes kept beside or inside the run:** 027.0346 [^7] (Moussia), 029.0325 [^7] (the name), 024.0148 [^1] and 024.0193 [^1] (English), 027.0223 [^1] (Shakespeare), 028.0081 [^1].
- **English re-ordered so that the run has its own words:**
  - 027.0040 "portrayed them all, ==*imitating them*==";
  - 027.0326 "==never lowered his eyes== — almost";
  - 027.0340 "Constantin, ==isn't he something to you?==";
  - 027.0308: the quotation now runs through «jolies bêtises»;
  - 027.0108: the restored dialogue dash was added;
  - 027.0213: the run now includes "Satan!".
- **Highlights cannot nest.** In 030.0280, r2 is split around Marie's English «wild»; the r-ref sits on the last part only.
- **030.0434:** sync had added the source note [^030.0434.1] (Lovelace) at the end of the line, while the tree already had an inline Lovelace note. The source ref now sits on "Lovelace" and the duplicate inline note is gone.

## For the lead / owner (not changed, or changed on a default)

1. **023.0122 (A2 question 5):** «Je selle un cheval» is a song title that the source marks as Russian. The en text now reads "==I Saddle a Horse==" with the r-footnote. The old note [^1] had called it Marie's French title. If the owner rules that titles are never highlighted, this paragraph has to be redone.
2. **Extents that follow the source's option A, pending a ruling:** 027.0347 (A3 Q1), 030.0283 (A3 Q2), 027.0390 (A3 Q3) and 021.0505 r1 (A2 Q6).
3. **022.0080 (A2 Q1):** the 12 missing Walitsky verse lines from p.59 are not in `_original`, so nothing was added. 023.0432, 023.0465 and 023.0491 are unchanged in the source, so they are unchanged here too.
4. **Italics-only source fixes in paragraphs with no r-label were not carried**, because the brief scopes words and marks: 021.0037, 0366, 0368, 0372, 0513; 023.0226, 0453; 024.0045; 026.0040; 027.0046, 0085, 0293; 029.0248; 030.0393, 0416. An italics pass could pick them up.
5. **Not related to this package, left as found:** 021.0149 has a `==proper==` highlight with no footnote (comme il faut). The LAN note at `_original` 021.0032 still glosses «se retourner» (A2 Q7). 027.0108 «Wittengstein» was not restored (A3 Q4).
6. No TranslationMemory terms were added. *pug* for *carlin* matches 026.0039.

## Gates (en)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 021 | empty | PASS (0 fail, 0 warn) |
| 022 | empty | PASS (0 fail, 0 warn) |
| 023 | empty | PASS (0 fail, 0 warn) |
| 024 | empty | PASS (0 fail, 0 warn) |
| 025 | empty | PASS (0 fail, 0 warn) |
| 026 | empty | PASS (0 fail, 0 warn) |
| 027 | empty | PASS (0 fail, 0 warn) |
| 028 | empty | PASS (0 fail, 0 warn) |
| 029 | empty | PASS (0 fail, 0 warn) |
| 030 | empty | PASS (0 fail, 0 warn) |

`just check-comments en`: OK. Git state is unchanged and OPEN-ITEMS was not edited.
