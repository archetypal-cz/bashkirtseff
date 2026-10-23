# A23-B-uk — sharp-scan source fixes carried into uk 021–030 (2026-10-24)

Package B-A23-uk of BRIEF-B. Tree: **uk** only. Sources: A2.md (021–025, commit e5f0144b18) and A3.md (026–030, commit 7df5778edd). I followed the approach of A1-B-uk. No git state was changed.

## Result

- **313 paragraphs changed**, each with one comment `TR: source fix (sharp scan 2026-10-23): …` on its own line after the text. By carnet: 021: 44, 022: 41, 023: 52, 024: 18, 025: 26, 026: 2, 027: 36, 028: 5, 029: 9, 030: 80. This covers every paragraph in the A2 and A3 impact lists, plus the word fixes 021.0387, 021.0392 and 025.0053.
- **Every r-label in `_original` 021–030 was checked**, including the pre-existing ones: 021.0165.r1, 021.0310, 025.0268, 027.0126.r1 and 030.0124. Each uk paragraph now has:
  - the Ukrainian rendering wrapped in `==…==`;
  - the reference straight after the closing `==`;
  - exactly one definition, `В оригіналі російською; французький переклад видавця.`
- **Sync leftovers cleaned up:**
  - 97 English definitions added by sync were localized.
  - 321 mechanical end-of-line references were stripped and placed again by hand.
  - The definitions that sync skipped with a WARN were added after their paragraph.
- **A script check over 021–030 finds 0 problems**: no missing or extra references, no duplicate or English definitions, no odd `==` count. Its only hit is a false positive: 027.0126.r1 sits in paragraph 0127 because of a legacy label that the source note keeps.
- **Embedded French matches `_original`** in every r-labelled paragraph.
- **Inherited star italics and bold removed** in all the changed paragraphs. Italics that the print really has were kept inside the run, as in the source: 027.0040, 0088, 0223, 0251, 0252, 0391, 029.0029, 030.0077 and 0412.
- **Verse layout kept**: one run spans several lines in 023.0218, 0220, 0227, 0228, 0463, 0498 and 027.0290, the same as the source. In 022.0080–0105 each line is its own paragraph and gets its own run.

## Word changes

| pid | uk change |
|---|---|
| 021.0032 | «Буве і турне» → «Буве і фуме» (*Bouver et foumer* = boire et fumer) |
| 021.0038 | The Russian gloss «petit garçon» was missing in uk; added as «==хлопчик==» after «*молодий пан*» |
| 021.0387 | «[Викреслено: але]» → «[Викреслено: це правда, але]» |
| 021.0392 | «!!!!» → «!!!!!» |
| 023.0005 | «доказ Жіротта I» → «доказ — Джирофла!» (TM lock). I also copied the source's new Emile_d_Audiffret tag line into uk |
| 023.0218 | The line «Денгоф-незграба / Доглядач російських лісів» is now split as printed |
| 023.0458 | No change needed: «для жаданих осіб» already fits «personne[s] désiré[e]s» |
| 025.0043 | «якась mferdje» → «якесь г[івн]о», keeping the editor's brackets of «m[erd]e» |
| 025.0052 | «Знову моє ім'я!» → «Знову моє ім'я!!» |
| 025.0053 | «[нерозбірливо*]» → «[нерозбірливо]» |
| 027.0108 | Dialogue dash «— » restored |
| 027.0252 | «породи кернтер'єр» → «породи ==*мопсів*==» (carlins = pugs) |
| 027.0040 | «передражнював їх усіх» → «зобразив їх усіх, ==*передражнюючи*==», so that *en les imitant* has words of its own |
| 029.0029 | «en arrière»: the uk «озирнувся» already says this. Only the mark was added, and «**фетар**» was fixed |
| 030.0129 | No change needed: the uk «з моєю» already matches «à la mienne» |
| 030.0003/0025, 028.0230 | Spelling-only fixes in the source; uk wording unchanged |
| 024.0045, 024.0270, 025.0119, 027.0308, 030.0292, 030.0434 | The print's restored italics were followed: «*клопотанням*», «*велична*», «*маленького мужика*», «*Дрібниці*», «*усі мої приспані пристрасті*», «*цілком*» |

Other italics-only source fixes were not carried over, because the brief asks for minimal changes. Examples: 021.0366–0372, 021.0513, 026.0040, 027.0046 and 027.0127 «*c'est vrai.*».

## uk notes deleted and replaced by the r-note

These notes described the run as French or English, or as a puzzle word:

- 021.0032 `21.32.1` and 021.0109 `21.109.1`: «В оригіналі французькою (… по-російськи)»
- 023.0161 `023.0161.1`: «est mort» [sic]. The source now reads «morte», and the sentence is the editor's French.
- 024.0393 `024.393.1`: «moujik»
- 025.0043 `025.43.1`: «mferdje»
- 026.0039 `026.39.1`: *Carlin*
- 028.0158 `028.158.1`: «bel homme»
- 028.0230 `028.230.1`: «skunks», given as English
- 029.0076 `029.55.5`: «gueule»
- 030.0021 `030.021.1`: «comme il faut». Its highlight was nested inside the Russian run.
- 030.0077 `030.077.2`: «questionnaire»

**Kept**:
- The gloss and English notes beside runs. These are 024.47.1, 024.148.1, 024.193.1, 025.52.1, 025.146.1, 027.29.1, 027.223.1, 027.326.1, 027.391.1, 029.150.1, 030.67.1, 030.077.1, 030.104.1, 030.125.1, 030.206.1, 030.276.1, 030.412.1 and 030.434.x.
- 030.280.1 (*wild*, metalinguistic). It now sits inside r2, because the print's run contains the English word.

There were no label collisions, so nothing needed relabelling to `.tN`.

## Flags for RED / lead

1. **023.0122 «Я сідлаю коня»** is a song title. I marked it «==…==» to follow the source mark (A2 open question 5), although titles are otherwise never highlighted. This needs an owner or RED decision.
2. **022.0080**: the missing 13-line Walitsky verse (A2 open question 1) is not in uk either. Nothing was invented.
3. **Runs that include the speech tag, as in the print**: 023.0300, 025.0017, 027.0033, 030.0014 and 030.0291. A run that crosses a closing quote: 027.0308. Runs where the uk word order puts a French word inside the run: 027.0340 («Константен») and 030.0280 (rephrased as «==Кажуть==, ==що вона — … — *wild*, як то кажуть.==»).
4. **024.0362**: «що «може прив'язатися до мене з пошаною»» may reverse who becomes attached to whom («je peux m'attacher à elle»). I only marked it; RED should check the meaning.
5. **021.0082**: «Муся, ваш» is a vocative and should probably be «Мусю». I left it, as it is outside scope.
6. **New TM terms**, not written to the TM:
   - Bouver et foumer (Macainne) → «Буве і фуме»
   - carlin → мопс (027.0252, 026.0039)

## Gates (uk)

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

`just check-comments uk`: OK.
