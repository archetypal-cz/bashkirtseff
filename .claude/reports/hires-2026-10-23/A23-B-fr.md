# A23-B-fr: sharp-scan source fixes carried into the fr tree, carnets 021–030 (2026-10-24)

Package B-A23-fr, following BRIEF-B. Tree: fr only. Sources: A2.md (021–025, commit e5f0144b18) and A3.md (026–030, commit 7df5778edd). The lead had already run `just sync C fr --footnotes` (`sync/A2-fr.txt`, `sync/A3-fr.txt`). The method is the one in A1-B-fr.md: a three-way merge per paragraph (old source → new source, applied to the fr visible text). No git state was changed.

## How fr 021–030 is built

None of the 280 entries is `edition_complete: true`. Paragraphs with no visible fr text render the `_original` text, marks included (`resolveFrenchFromOriginal`). For those, the only fr change needed is the definition. Paragraphs with visible fr text are never touched by the renderer, so their text was brought to the corrected source.

## Counts

- **367 r-labels** in `_original` 021–030 (334 changed paragraphs, plus the unchanged 021.0255, 021.0310 and 025.0268). After the pass:
  - each label has exactly one fr definition, «En russe dans le manuscrit ; traduction française de l'éditeur.»;
  - wherever the paragraph has visible text, each label has exactly one ref there, placed right after `==`;
  - the script check found 0 problems, and no English r-definition is left in fr 021–030.
- **362 English definitions** added by sync were replaced by the fr one and placed after their paragraph. The 5 fr definitions that already existed were kept. They include 025.0268.r1, the only sync WARN (`sync/A2-fr.txt`): fr already had the right definition and ref, so it was not a clash.
- **Visible text changed in 31 paragraphs**, each with one FRE comment `source fix (sharp scan 2026-10-23): …`.
- **Mechanical refs:** sync had appended refs at the end of visible lines. They were removed from the 31 changed paragraphs. In 7 more paragraphs with visible text they were moved to the source position, without a comment: 025.0241.1, 026.0030.1, 026.0031.1, 026.0034.1/.2, 028.0077.1, 028.0119.1 and 030.0100.1.
- **How the edits were made:** visible-text and definition lines were patched by script. Comment lines (52 embedded refs, 31 FRE comments and 1 tag line) were written with the Edit tool only. A diff against a backup confirms that the only comment-line changes are those inserted refs.

## Visible text changed (31)

- **021:** 0032 0082 0149 0368 0371 0372 0392 0394
- **023:** 0226 0227 0228
- **024:** 0270
- **025:** 0231 0232 0233
- **027:** 0223 0252
- **028:** 0081 0230
- **030:** 0193 0204 0206 0209 0217 0218 0219 0220 0221 0222 0223 0238

In 18 of these the visible text equalled the old source, so the result equals the new source exactly. The others were resolved as follows.

### Decisions (flag for REV)

1. **028.0230 «canailles» → «skunks».** FRE (2026-02-14) took «skunks» for English and "translated" it. The run is the editor's French rendering of Russian, so the source wording comes back, as in A1 decision 1. «pèlerine» → «pélerine», as printed.
   **Defect fixed while the line was open:** the visible block also held an unaccented copy of 028.0231 («Toutes ces choses … enchantee …»). 028.0231 itself renders from `_original`, so that text showed twice. The copy was removed.
2. **030.0238: the paragraph body was missing.** The visible text held only the date heading, so the paragraph body did not display. It is restored from `_original`.
3. **030.0217–0220, 0222, 0223:** the visible text had lost the dialogue dash «- » and kept stray stars. It now equals the new source, dash included.
4. **FRE translations of transliterated Russian kept inside the marks**, as in A1 decision 2:
   - 021.0082 «Moussia» → «Marie»
   - 021.0149 «Douchenka» → «petite âme». This covers the marked occurrence and the unmarked second one.
   - 021.0032 «Makak» → «le singe».
   **REV should look at 021.0032.** Marie's point is that the name *Macainne* turns into the Russian *Makak*, and «le singe» loses that pun. In the same line «blunt» is still English, although the FRE note says it was translated. That predates this pass and was left alone.
5. **FRE translations of English kept:** 027.0223 «Telle est la question» and 027.0252 «chiot» (*puppy*). In 027.0252 «cairins» → «==*carlins*==», as printed.

## Word changes from A2/A3 in paragraphs without visible fr text

These already render the corrected `_original`, so fr needed no edit:

- 021.0387 «[Rayé: c'est vrai, mais]»
- 023.0005 «Girofla !»
- 023.0458
- 025.0043 «m[erd]e»
- 025.0052 «!!»
- 025.0053
- 029.0029 «en arrière»
- 030.0129

Their embedded French matches the source. The 6 apparent mismatches (023.0231, 0453, 0482, 028.0230, 030.0193, 0238) are only the date-heading form: `%% Jour… %%` in fr against `# Jour…` in the source.

The new d'Audiffret tag line of 023.0005 was missing in fr and was added (Edit).

## Skipped: no visible fr text (definition localized only)

These **303 paragraphs** got only the fr definition:

- 021 (41): 0017 0018 0037 0038 0083 0084 0085 0109 0131 0133 0165 0194 0195 0196 0197 0257 0262 0278 0293 0313 0314 0318 0327 0366 0378 0383 0387 0406 0418 0423 0446 0502 0504 0505 0507 0511 0513 0520 0526 0527 0571
- 022 (41): 0073 0080–0105 0154 0179 0180 0182–0186 0189 0202 0341 0399 0407 0434
- 023 (53): 0005 0006 0050 0064 0096 0097 0122 0133 0147 0148 0161 0162 0189 0204 0209 0218 0220 0231 0234 0275 0279 0286 0289 0294 0295 0300 0301 0302 0342 0343 0372 0374 0376 0388 0405 0423 0427 0431 0434 0435 0453 0455 0458 0463 0474 0482 0498 0499 0510 0525 0559 0646 0674
- 024 (17): 0045 0047 0050 0051 0106 0148 0164 0175 0193 0242 0250 0276 0362 0371 0380 0391 0393
- 025 (23): 0016 0017 0018 0037 0040 0043 0045 0047 0048 0051 0052 0053 0076 0112 0117 0119 0141 0142 0143 0145 0146 0149 0258
- 026 (3): 0019 0039 0040
- 027 (38): 0027 0029 0031 0033 0034 0040 0045 0046 0064 0085 0087 0088 0108 0111 0123 0127 0213 0244 0251 0286 0287 0290 0291 0293 0296 0308 0326 0339 0340 0341 0342 0344 0346 0347 0389 0390 0391 0394
- 028 (3): 0116 0158 0268
- 029 (11): 0029 0074 0075 0076 0116 0150 0208 0216 0247 0248 0325
- 030 (73): 0003–0036 (r-labelled ones), 0054 0056 0067–0070 0077 0082–0084 0104 0115 0124 0125 0129 0247 0276–0283 0287–0292 0368 0385–0390 0393 0412 0416 0419–0421 0434

## Source notes carried by sync: refs placed and notes translated

- **Refs placed:** verify-carnet failed on **52 `[^CCC.NNNN.N]` definitions with no ref** (021: 8, 022: 1, 023: 7, 024: 15, 025: 2, 026: 4, 027: 3, 028: 3, 029: 5, 030: 4). None of these paragraphs has visible text, so the ref was inserted with the Edit tool into the embedded copy, at the source position.
- **Notes translated:** all **65 English notes that sync added** to fr 021–030 are now in French. These are the 52 above, the 7 with moved visible refs, and 021.0278.1, 025.0052.1, 027.0046.1, 030.0104.1 and 030.0434.1. Cross-references such as «007/1873-08-06» became «voir la note du 6 août 1873». No English footnote is left in fr 021–030.

## Open points

1. **022.0080:** the missing 13-line Walitsky verse (A2 open question 1) is not in fr either. Nothing was invented.
2. **023.0122 «Je selle un cheval»** is a song title that the source marks as Russian (A2 open question 5). It has no visible fr text, so it renders with the mark as in `_original`.
3. **Pre-existing English left in fr visible text:** «blunt» (021.0032) and «*curling the lip*» (028.0081). These are FRE work still to do and outside this package.

## Gates (fr)

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

`just check-comments fr`: OK.

The before-state backup and helper scripts are in the session scratchpad, `frA23/`.
