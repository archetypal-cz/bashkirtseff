# A1-B-fr: sharp-scan source fixes carried into the fr tree, carnets 015–020 (2026-10-24)

Package B-A1-fr, following BRIEF-B. Tree: fr only. Source: A1.md, commit 46a61a4241. The lead had already run `just sync C fr --footnotes` (`sync/A1-fr.txt`).

## How fr 015–020 is built

None of the 180 entries in fr 015–020 is `edition_complete: true`. A paragraph has visible fr text only where an earlier FRE pass translated a foreign passage (restored on 2026-10-03). Every other paragraph has only the embedded French. For those, the frontend renders the `_original` text (`resolveFrenchFromOriginal` in `src/frontend/src/lib/content.ts`) and keeps each `[^…]` ref the fr file defines. So:

- **Paragraph with visible fr text:** the visible text was brought to the corrected source, with the runs wrapped and the FRE translations of genuinely foreign words kept. One FRE comment was added per paragraph.
- **Paragraph without visible fr text:** it already shows the corrected `_original` text, marks included. The only fr change needed was the definition: the English «Written in Russian…» note that sync appended at the end of the file was replaced by the fr definition, placed after the paragraph. No comment was added, because the fr text was not edited.

## Counts

- 439 r-labels in 339 paragraphs (`_original` 015–020). After the pass, each label has exactly one fr definition «En russe dans le manuscrit ; traduction française de l'éditeur.». Wherever the paragraph has visible text, each label has exactly one ref there, placed right after `==`. No English r-definition is left in fr 015–020, the fr tree has no r-labels of its own, and no other fr note uses an r-label.
- 367 English definitions were replaced by the fr one (all in 127 files, placed after their paragraph). The 72 fr definitions that already existed were kept, and they cover all 14 sync WARNs. Those WARNs were not label clashes: sync compares the English definition text with the French one it found under the same label.
- Visible text changed in **38 paragraphs**, with 38 FRE comments `source fix (sharp scan 2026-10-23): …`. Visible-text and definition lines were patched by script. Comment lines were written with the Edit tool only.
- 7 paragraphs already had visible text and existing marks (015.0027 0075 0288, 018.0243 0295 0302, 019.0169). They were checked and left unchanged.

## Visible text changed (38)

- **015:** 0203 0236 0254 0265 0300
- **016:** 0004 0045 0340 0351
- **017:** 0006 0009 0015 0179 0321 0329 0498
- **018:** 0126 0128 0129 0131 0132 0137 0142 0196 0211 0294 0296 0312
- **019:** 0283 0294 0374 0383
- **020:** 0008 0164 0428 0430 0475 0488

The method was a three-way merge per paragraph: old source → new source, applied to the fr visible text. The merge was clean in 29 paragraphs. In 11 of those the visible text already equalled the old source, so the result equals the new source exactly. The other 9 were resolved by hand:

### Decisions (flag for REV)

1. **FRE re-translations of the editor's French were removed.** On 2026-02-14 FRE took star runs for untranslated Russian and "translated" French into other French. The runs are already the editor's French translation, so the fr edition now carries the source wording:
   - 017.0006 «porte-monnaie avec une pièce de cinq kopecks» (was «presque vide»)
   - 019.0374 «sans chamaillerie» (was «sans querelle»)
   - 019.0383 «bistrot russe» and «andouille» (was «restaurant russe», «: : imbécile ;»)
   - 020.0008 «Et voilà à petits pas, à leur place» (the old line was garbled: «*: : *Et les voilà marchant…*»)
   - 020.0475 «propriétaire» (was «hobereau»)
2. **FRE translations of transliterated Russian were kept inside the marks.** This follows the fr rule that foreign words are translated:
   - 015.0203 «Moussia» → «Marie»
   - 017.0179 «koulibiaks» → «tourtes russes»
   - 019.0294 «Vas., Ossip» → «Vassili Ossipovitch»
   - 020.0428 / 020.0430 «jouk» → «bourdon». In 020.0428 the editor's gloss «[bourdon]» is dropped as redundant.
3. **019.0383 «botvinia» kept.** FRE's «le soupe» had the wrong gender and duplicated the editor's gloss «[potage froid au poisson]», which already translates the word.
4. **Small repairs made while the line was open:**
   - 018.0131 «qu elle» → «qu'elle»: an apostrophe lost in the old copy.
   - 020.0164 «puisque a une femme*» → «puisqu'il a une femme»: FRE's rendering of *mulier habuit* had a stray star and no subject.
   - 019.0374: the Angot ref was put back after «(Angot)», as in the source.

## Word changes from A1

015.0148, 017.0192, 017.0429 «Liocha Danilovski», 019.0128, 019.0129 «l'*employé*», 018.0276 «Gênes», and the punctuation fixes 019.0023, 019.0143 and 020.0365 all fall in paragraphs with **no visible fr text**. They already render the corrected `_original` text, and their embedded French matches the source after the lead's sync, so fr needed no edit. No visible «Vocha» or «Inemployé» is left in fr 015–020. The glossary tag `#Vocha_Danilovski` in 017/1874-03-22 is A1 open question 3, not this package.

## Skipped: no visible fr text (definition localized only)

**252 changed paragraphs:**
- 015 (37): 0017 0025 0035 0036 0037 0043 0047 0048 0050 0051 0062 0077 0091 0099 0116 0121 0126 0127 0132 0148 0177 0178 0183 0200 0211 0219 0225 0245 0257 0276 0299 0301 0302 0303 0306 0333 0334
- 016 (38): 0007 0062 0066 0079 0114 0127 0157 0158 0162 0163 0173 0174 0176 0182 0188 0200 0202 0204 0216 0218 0219 0220 0228 0281 0282 0299 0303 0306 0307 0308 0310 0322 0323 0325 0332 0335 0368 0377
- 017 (68): 0027 0030 0038 0039 0047 0048 0056 0084 0089 0092 0093 0094 0108 0130 0136 0147 0160 0173 0184 0189 0190 0192 0209 0221 0239 0249 0260 0263 0277 0278 0291 0293 0304 0305 0309 0310 0312 0330 0332 0333 0335 0341 0347 0348 0349 0350 0362 0368 0370 0371 0373 0379 0381 0389 0413 0428 0429 0431 0446 0449 0451 0455 0457 0466 0474 0484 0491 0492
- 018 (34): 0004 0023 0024 0035 0050 0063 0089 0094 0106 0107 0108 0109 0111 0112 0113 0168 0224 0226 0231 0235 0242 0255 0260 0262 0264 0270 0277 0290 0301 0304 0305 0314 0326 0359
- 019 (33): 0018 0023 0067 0128 0129 0135 0137 0143 0192 0210 0229 0231 0232 0233 0235 0236 0240 0243 0248 0255 0256 0257 0268 0288 0289 0314 0319 0320 0321 0393 0394 0395 0396
- 020 (42): 0006 0120 0128 0129 0144 0156 0159 0160 0161 0170 0174 0179 0180 0187 0188 0201 0216 0217 0219 0220 0221 0223 0253 0254 0255 0256 0272 0273 0274 0280 0286 0299 0325 0383 0410 0418 0434 0495 0497 0508 0512 0542

**42 unchanged paragraphs (existing marks, fr definition already present):**
- 015: 0032 0052 0135 0173 0228
- 016: 0125 0194 0214 0312
- 017: 0060 0105 0155 0185 0417
- 018: 0095 0191 0195 0206 0217–0219 0257 0258 0284 0286 0319 0325
- 019: 0014 0033 0077 0183 0193 0287 0326 0337 0386
- 020: 0098 0191 0252 0259 0270 0295

## Gate repair outside the r-labels

After the lead's sync, verify-carnet failed on 12 `[^CCC.NNNN.1]` notes that `--footnotes` had added from `_original` (the 2026-10-21/22 footnote pulls): the definitions had no ref. These paragraphs have no visible text, and their embedded French equalled the source minus the ref. The ref was inserted into the embedded copy with the Edit tool:

016.0150, 017.0196, 018.0364, 019.0027, 019.0077, 019.0158, 019.0182, 019.0234, 020.0295, 020.0349, 020.0360, 020.0480.

**These 12 notes are still in English. They need translating into French (FRE/REV),** like the other English notes already in fr (for example the Worth and Lewita notes, and 019.0374.1 Angot).

## Gates (fr)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 015 | empty | PASS (0 fail, 0 warn) |
| 016 | empty | PASS (0 fail, 0 warn) |
| 017 | empty | PASS (0 fail, 0 warn) |
| 018 | empty | PASS (0 fail, 0 warn) |
| 019 | empty | PASS (0 fail, 0 warn) |
| 020 | empty | PASS (0 fail, 0 warn) |

`just check-comments fr`: OK. No git state changed.
