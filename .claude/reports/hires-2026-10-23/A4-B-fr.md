# A4-B-fr: sharp-scan source fixes carried into the fr tree, carnets 031–037 (2026-10-24)

Package B-A4-fr, following BRIEF-B. Tree: fr only. Source: A4.md, commit 9297e472e4. The lead had already run `just sync C fr --footnotes`. Its WARN list `sync/A4-fr.txt` is empty. The method is the one in A1-B-fr.md and A23-B-fr.md: a three-way merge per paragraph (old source → new source, applied to the fr visible text). No git state was changed.

## How fr 031–037 is built

No entry is `edition_complete: true`. Paragraphs with no visible fr text render the `_original` text, marks included (`resolveFrenchFromOriginal`), so for those the only fr change needed is the definition. Paragraphs with visible fr text are never touched by the renderer, so their text was brought to the corrected source.

## Counts

- **89 r-labels** in 84 paragraphs (`_original` 031–037, all new in this package). After the pass:
  - each label has exactly one fr definition, «En russe dans le manuscrit ; traduction française de l'éditeur.»;
  - wherever the paragraph has visible text, each label has exactly one ref there, placed right after `==`;
  - the script check found 0 problems, and no English r-definition is left in fr 031–037.
- **89 English definitions** added by sync were replaced by the fr one and placed after their paragraph. fr had no r-definitions of its own here.
- **Visible text changed in 15 paragraphs**, each with one FRE comment. 14 of them say `source fix (sharp scan 2026-10-23): …`; the 15th is 034.0081 (see below).
- **Mechanical refs:** sync had appended refs at the end of visible lines. They were removed from the changed paragraphs. In 4 more paragraphs with visible text they were moved to the source position:
  - 032.0036.1, with no comment;
  - 034.0020.1/.2/.3, placed after the FRE translations «Dors tranquille», «Joie» and «Si vous voulez savoir mon nom», with no comment;
  - 035.0108.1, with no comment;
  - 034.0081.1, with a comment, because «c est» → «c'est» was fixed on the same line.
- **How the edits were made:** visible-text and definition lines were patched by script. Comment lines were written with the Edit tool only: 45 embedded refs in 42 lines, and 15 FRE comments. A per-file diff against the before-state backup confirms that the only other comment-line changes are those refs.

## Visible text changed (15)

- **031:** 0044
- **032:** 0002 0041 0042 0043 0044 0198 0199 0200 0203 0204 0205 0273
- **033:** 0129
- **034:** 0081 (ref and apostrophe only)

The visible text equalled the old source in 032.0198 and 032.0203–0205, so the result equals the new source exactly. 032.0041–0044, 0199 and 0200 also now equal the new source exactly: their visible copy had lost the dialogue dash «— » and carried star-italics (`*…*`) in place of the marks. The others were resolved as follows.

### Decisions (flag for REV)

1. **032.0203–0205: the restored words are in fr.** The visible fr text was a stale copy of the old source, with no FRE work in it. It now equals `_original`:
   - 032.0203 «une idylle, notre»;
   - 032.0204 «écrirai»;
   - 032.0205: the 66 restored words, with «[Croquis]» gone.

   In 032.0205 the mottos *Ich diene* and *volo* were kept as cited devices, not translated in the text. Each got a short fr note: `[^32.0205.1]` «N.d.É. : *Ich diene* (« Je sers ») : la devise du prince de Galles…» and `[^32.0205.2]` «*volo* : « je veux », en latin». They use the fr tree's own short-label scheme, as in 05.0279.1. **REV:** the fr rule «on traduit tout» would instead put «Je sers» / «je veux» in the text.
2. **032.0002 «plachtchanitsa».** The visible line was broken: «*à la procession de la du Christ.». FRE (2026-02-14) had meant to translate the transliterated Russian word, so the whole marked run now reads «==à la procession du linceul du Christ==». **REV:** check the wording; «épitaphios» or «saint suaire» are alternatives.
3. **032.0273 «botvinia» restored.** FRE's «le soupe froide russe» had the wrong gender, and «(l'écrire me salit la plume)» is about the word itself, so the source word is back inside the mark (as A1 decision 3). «^1^» (the print's own note call) is kept as in `_original`. **REV:** a gloss note would help the reader.
4. **FRE translation of transliterated Russian kept inside the marks** (as A1 decision 2): 031.0044 «Moussinka» → «==ma petite Marie==».
5. **033.0129:** the apostrophes «qu'avec l'aide» are restored (A4 confirms them on the print). FRE's translation of the English «accomplirons notre pèlerinage» is kept.
6. **Notes that quote the foreign original next to FRE's translated visible text** (034.0020.1–3, 035.0108.1 «Douraque», 034.0081.1 «tcncô»): the fr versions say «dans le manuscrit» / «le manuscrit transcrit porte…», so each note now serves as the footnote that holds the original.

## Word changes from A4 in paragraphs without visible fr text

These already render the corrected `_original`, and their embedded French equals the source after the lead's sync (inventory check: 0 mismatches), so fr needed no edit:

- 031.0062/0063 (italics) and 031.0078, 0079, 0253;
- 032.0073 (dash) and 032.0323;
- 033.0088, 0091, 0148, 0179, 0185, 0314, 0320, 0325, 0340, 0343–0345, 0348, 0351, 0352, 0355, 0356, 0361, 0362, 0363, 0367;
- 034.0017, 0114, 0304, 0408;
- 035.0327;
- 036.0066, 0067, 0071, 0102;
- 037.0346, 0425.

None of them carries visible «Saetone».

## Skipped: no visible fr text (definition localized only)

These **74 r-labelled paragraphs** got only the fr definition:

- 031 (21): 0008 0024–0036 0057–0060 0062 0063 0067
- 032 (26): 0071–0088 0090–0093 0103 0105 0109 0412
- 033 (9): 0190 0223 0233 0293 0294 0296 0331 0426 0427
- 034 (6): 0021 0042 0114 0129 0202 0276
- 035 (5): 0161–0163 0282 0284
- 036 (3): 0105 0106 0108
- 037 (4): 0206 0319 0499 0500

## Source notes carried by sync: refs placed and notes translated

- **Refs placed:** after the sync, verify-carnet failed on **45 `[^CCC.NNNN.N]` definitions with no ref** (031: 1, 033: 7, 034: 21, 035: 6, 037: 10). None of these paragraphs has visible text, so the ref was inserted with the Edit tool into the embedded copy, at the source position. Each embedded line now equals the source line exactly (script check: 0 mismatches).
- **Notes translated:** all **54 English notes that sync added** to fr 031–037 are now in French. These are the 45 above, the 6 with moved visible refs, and the 3 whose ref was already in the embedded copy (034.0021.1, 034.0158.1, 035.0107.1). Paragraph cross-references became dates or «même entrée» (for example 050.0756 → «14 décembre 1875», 063.0321 → «15 juillet 1876», 032.0377–0370 → «le 9 mai 1875»). No English note is left in fr 031–037.

## Open points

1. **A4 open question 1** (the print's i-for-l at 033.0340–0368): those paragraphs have no visible fr text and render `_original` as it stands. Nothing was done in fr.
2. **A4 open question 2** (034.0081 «tcncô»/«tcncó»): the fr note quotes «*tcncô*» as the source does. If the owner picks option (b), patch the fr note too.
3. The FRE «teneo» correction in 034.0081 visible text predates this pass and was kept.

## Gates (fr)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 031 | empty | PASS (0 fail, 0 warn) |
| 032 | empty | PASS (0 fail, 0 warn) |
| 033 | empty | PASS (0 fail, 0 warn) |
| 034 | empty | PASS (0 fail, 0 warn) |
| 035 | empty | PASS (0 fail, 0 warn) |
| 036 | empty | PASS (0 fail, 0 warn) |
| 037 | empty | PASS (0 fail, 0 warn) |

`just check-comments fr`: OK.

The before-state backup and helper scripts are in the session scratchpad, `frA4/`.
