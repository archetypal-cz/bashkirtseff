# A1-B-cz: sharp-scan source fixes carried into the cz tree, carnets 015–020 (2026-10-24)

Package B-A1-cz, following BRIEF-B. Tree: cz only. Source: A1.md, commit 46a61a4241.

## What was done

Every paragraph that has an r-label in `_original` 015–020 was checked. That is 439 labels in 339 paragraphs: the 367 new runs plus the 77 marks that existed before. 290 paragraphs were changed. This matches A1's count of 290 paragraphs with new marks.

In each changed paragraph:

- The Czech rendering of the run is wrapped as `==…==[^CCC.NNNN.rK]`, with the same label as the source.
- The mechanical ref that `sync --footnotes` appended at the end of the line was removed.
- The English definition (at the end of the file, or inside the paragraph) was replaced by one localized `Pozn. překl.: V originále rusky; do francouzštiny přeložil vydavatel.` after the paragraph.
- The italics or bold inherited from the old star-garbled source were removed inside the runs. Italics are kept only where the print italicises (A1's `==*…*==`).
- One TR comment `source fix (sharp scan 2026-10-23): …` was added on its own line after the text, using the Edit tool.

Integrity check over all 439 labels: each has exactly one cz definition and exactly one ref in the visible text, and that ref sits right after `==`. No English «Written in Russian…» definition is left in cz 015–020. There are no cz-only r-labels.

Method: visible-text lines and footnote-definition lines were patched with a Python spec script. These are lines without comment markers. Comment lines were written only with the Edit tool, as the brief requires.

## Changed pids per carnet

- **015 (42):** 0017 0025 0035 0036 0037 0043 0047 0048 0050 0051 0062 0077 0091 0099 0116 0121 0126 0127 0132 0148 0177 0178 0183 0200 0203 0211 0219 0225 0236 0245 0254 0257 0265 0276 0299 0300 0301 0302 0303 0306 0333 0334
- **016 (42):** 0004 0007 0045 0062 0066 0079 0114 0127 0157 0158 0162 0163 0173 0174 0176 0182 0188 0200 0202 0204 0216 0218 0219 0220 0228 0281 0282 0299 0303 0306 0307 0308 0310 0322 0323 0325 0332 0335 0340 0351 0368 0377
- **017 (75):** every 017 pid in the A1 impact list
- **018 (46):** every 018 pid in the impact list
- **019 (37):** every 019 pid in the impact list
- **020 (48):** every 020 pid in the impact list

Paragraphs whose marks already existed were checked and left unchanged, with no comment added. They are:

- 015: 0027 0032 0052 0075 0135 0173 0228 0288
- 016: 0125 0194 0214 0312
- 017: 0060 0105 0155 0185 0417
- 018: 0095 0191 0195 0206 0217–0219 0243 0257 0258 0284 0286 0295 0302 0319 0325
- 019: 0014 0033 0077 0169 0183 0193 0287 0326 0337 0386
- 020: 0098 0191 0252 0259 0270 0295

## Word changes from the report

- **015.0148** «en âge de»: „nejsem schopná *věštit budoucnost.*“ → „ještě nejsem v tom věku, abych ==věštila budoucnost==“.
- **017.0192** «l'indulgence»: no wording change needed. „shovívavosti“ is now marked.
- **017.0429** «Liocha Danilovski»: „s „Vochou Danilovským““ → „s ==Liochou Danilovským==“. The French form is kept, like Stiopa. No other „Vocha“ is left in the cz visible text.
- **019.0128** «qu'*elle* a un minois»: „protože mám neuvěřitelně roztomilou tvářičku“ → „protože ==*má* neuvěřitelně roztomilou tvářičku==“. Tichkevitch's words are now in the third person.
- **019.0129** «l'*employé*»: „Nezaměstnaným“ (the old nickname reading) → „==*úředníkem*==“.
- **018.0276** «Gênes», 019.0023, 019.0143, 020.0365: no impact. The Czech already has „Janov“ and no stray apostrophe.
- **016.0308** «les vaches»: no impact („a krávy“).

## Other decisions (flag for RED)

1. **Old translator notes replaced by r-notes.** These cz notes said only „V originále rusky“, or called the run French, which the print now shows was wrong. Their ref and definition were removed:
   - 017.0309 `[^17.02]` (troïka)
   - 017.0321 `[^17.04]` („V originále francouzsky: tonton et tantine…“)
   - 017.0370 `[^17.370.1]`
   - 017.0379 `[^17.379.1]`
   - 017.0381 `[^17.381.1]`
   - 017.0446 `[^17.24.1]`
   - 017.0457 `[^17.25.1]`
2. **Notes edited.**
   - 018.0305.f1 no longer says „V originále anglicky“, because the print stars *clerk* as Russian. The gloss is kept, and the metalinguistic word stays italic: `==*clerk*==`.
   - 019.383.2 was trimmed to its gloss, since „Marie to slovo řekla rusky“ is now covered by r3.
   - 020.428.1 (žuk gloss) was kept.
3. **Quotation structure changed** where the star debris had split or invented quotes:
   - 018.0132: maman's speech is now one quote to the end of the r3 run.
   - 019.0143: the italics are now Czech quotes, per the cz direct-speech ruling.
   - 019.0243: two quotes joined, because the run is one utterance.
   - 019.0256: the quotes around „Můj zeť jede kolem“ were removed, because the source has none.
   - 020.0006: the mark crosses the quotation marks, because one run covers both cries.
   - 020.0180: „dehtovaných“ in quotes became `*dehtovaných*`.
4. **Small additions or fixes inside runs.**
   - 017.0130 „Zatajilo se mi dech“ → „Zatajil se mi dech“ (an agreement slip).
   - 017.0362 the print's italic *Il* is rendered as „==*On* ještě nepřijel…“.
   - 020.0286 the Czech had no rendering of the run «*en soi-même*», so „==*v duchu*==“ was added.
   - 018.0024 the run now covers „nasazuje si monokl“, following «mettant le monocle à l'œil».
5. **Footnotes inside marks.** In 015.0203 the existing note `[^15.203.1]` now sits inside the r1 mark. In 017.0184, 017.0189, 017.0190 and 019.0383 the r-ref and an existing tree note are adjacent.
6. **Out of scope, not touched.** 020.0259 already had an unlabelled `==všechno, co má cenu atd.==` beside the labelled r1 mark.

## Skipped

None. All r-labelled paragraphs exist in cz, and their embedded French matches `_original` after the lead's sync.

## Gates (cz)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 015 | empty | PASS (0 fail, 0 warn) |
| 016 | empty | PASS (0 fail, 0 warn) |
| 017 | empty | PASS (0 fail, 0 warn) |
| 018 | empty | PASS (0 fail, 0 warn) |
| 019 | empty | PASS (0 fail, 1 warn) |
| 020 | empty | PASS (0 fail, 0 warn) |

The 019 warn is `con-after-reset` on `1874-05-03.md`, which has no r-labels and was not edited in this package. The ED flag reset dated 2026-10-03 is newer than the last CON comment, so this was there before. `just check-comments cz`: OK.
