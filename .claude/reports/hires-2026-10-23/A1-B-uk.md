# A1-B-uk — sharp-scan source fixes carried into uk 015–020 (2026-10-24)

Package B-A1-uk of BRIEF-B. Tree: **uk** only. Source: A1.md and commit 46a61a4241. No git state was changed.

## Result

- **All 290 paragraphs in the A1 impact list were changed**, one TR comment each (`TR: source fix (sharp scan 2026-10-23): …`): 015: 42, 016: 42, 017: 75, 018: 46, 019: 37, 020: 48.
- I also checked **every r-label in `_original` 015–020**: 439 labels, including the 77 pre-existing runs. In uk each one now has:
  - the Ukrainian rendering wrapped in `==…==`, with the reference straight after the closing `==`;
  - exactly one definition, `В оригіналі російською; французький переклад видавця.`;
  - no English definition left (308 sync-added English definitions were localized) and no stray mechanical reference (308 end-of-line references from the sync were removed and re-placed by hand).

  A script check over all six carnets finds 0 problems: no missing or extra references, no duplicate or wrong definitions, no odd `==` count, and no Russian-note definition without a source label.
- In every paragraph, the embedded French matches `_original`, apart from the `# ` heading prefix and plain footnote references, which sync strips by design. No paragraph is missing.
- **Inherited italics and bold removed.** The old translation had kept the old source's star runs as `*…*` or `**…**`, and the mark now replaces them. In 017.0047–0048, 017.0349–0350, 018.0106–0109 and 018.0111–0112 the italics spanned several paragraphs, and they were closed per paragraph.

## Word changes (A1 "changed or added words")

| pid | change in uk |
|---|---|
| 015.0148 | «pas en âge de»: «я не здатна \*ворожити.\*» → «я ще не доросла до того, щоб ==ворожити==» |
| 017.0192 | «de l'indulgence»: «поблажливості» already fits. Only the mark was added and the italics removed. |
| 017.0429 | «Liocha Danilovski»: «з «Вочею Данилівським»» → «з ==Льошею Данилівським==», with the quotes removed. The glossary tag still points at VOCHA_DANILOVSKI (A1 owner question 3). |
| 019.0128 | «elle a un minois incroyable»: the uk already said «в неї неймовірне личко». The stray italics on «неї» were removed and the whole run is marked. |
| 019.0129 | «l'employé»: the nickname «Безробітним\*» (from the misreading «Inemployé», "the Unemployed One") → «==службовцем==», meaning Galula, the notary's clerk (see TM). It was the only occurrence in the uk tree. |
| 018.0276 | «Gênes»: the uk already has «Генуї». No change. |
| 019.0023, 019.0143, 020.0365 | Punctuation-only source fixes. No change to the uk wording; 019.0023 and 019.0143 got their marks. |

## Note relabels and replacements (label collisions, wrong uk notes)

- **015: uk notes that used the source's new r-labels were moved to `.t1`.** The uk tree had used `.r1` for its own foreign-language notes, and that label now belongs to the source's Russian run. Relabelled, with reference and definition: 015.0219 (Latin «Miserere!»), 015.0236 (English «bino-eie»), 015.0254 (English «viz.»), 015.0265 (Italian «che venerdì…»), 015.0300 (Latin «Te Deum»). The Russian r1 definition was then added.
- **uk notes replaced by the r-footnote, with their definitions removed**, because they described the run as French, italic or "Russian" in another form:
  - 017.0179 (`017.179.1`, «koulibiaks» as an italic foreign word)
  - 017.0190 (`017.190.1/2`, «pope», «sacristain»)
  - 017.0370 (`017.370.1`), 017.0379 (`017.379.1`), 017.0446 (`017.446.1`), 017.0457 (`017.457.1`), which said "the italic passage is Russian"
  - 020.0120 (`020.0120.1`, «in French: Imbécile»)
  - 020.0128 (`020.0128.1/2`, «in French: Et voilà Lambertoun», «C'est»)
  - 020.0129 (`020.0129.t1`, «in French: Eh bien»)
  - 020.0428 (`020.0428.1`, «in French: jouk»)
- **Gloss notes kept**, with the r-reference placed right after the run: 017.189.1 (the Te Deum hymn), 019.294.1, 019.314.1, 019.383.1, 019.393.3, 020.0434.1/2, and the English and Italian notes beside 016.0045, 017.0321, 017.0498 and 018.0196.
- **018.0304 and 018.0312**: a Russian word sits inside a paragraph that is all English, which the uk marks as one English `==…==[^….t1]` run. Highlights cannot nest, so the English run was split around the Russian word: `…== ==клерку==[^018.0304.r1] ==…==[^018.0304.t1]`, and the same with «Саші» in 018.0312.

## Other judgement calls (for RED)

- **018.0089**: «крамарі.» → «==крамарі!==», to follow the print's «boutiquiers !».
- **018.0359**: the broken italics (three stars) were removed. The non-standard «не прийнятимуть» was corrected to «не приймуть» inside the run.
- **017.0263**: r1 was widened to «==що вони вигадують!==», to match «ce qu'ils inventent !».
- **020.0006**: the print stars the question and the answer as one run, so «==Можна? — «Не можна, не можна!»==» is now a single run.
- **020.0180**: the marks sit on «диякон» and «засмолених» only, as in the print; «жалюгідний» is outside the run.
- **016.0066**: the old italics also covered three sentences that are not Russian. They are now plain text.
- **Runs that stop mid-sentence, as the print's do**: 018.0290 (the second «Де?»), 019.0256 («яке нещастя») and 020.0273 («(забуваю слово)») are outside the runs.
- I left italics alone when they do not come from a star run, i.e. when the French has its own italics: for example 018.0024 «потолочі», 018.0255 «сучку» and 017.0239 «Ідіоти…».

## Not done / flags

- **020.0174**: «жодної ==грандіозної== радості» is a highlight with no footnote, left over from the French italic «*immense ;*». It is not a Russian run, so I left it out of scope. RED should decide whether it is a code-switch needing a note or should be plain text.
- **New TM terms**, which I did not write to the TM:
  - Liocha Danilovski → Льоша Данилівський (017.0429)
  - l'employé (Marie's name for Galula, 019.0129) → службовець
- **019 gate WARN**: `con-after-reset` on 1874-05-03.md predates this work; I did not touch that file.

## Gates (uk)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 015 | empty | PASS (0 fail, 0 warn) |
| 016 | empty | PASS (0 fail, 0 warn) |
| 017 | empty | PASS (0 fail, 0 warn) |
| 018 | empty | PASS (0 fail, 0 warn) |
| 019 | empty | PASS (0 fail, 1 warn, which predates this work) |
| 020 | empty | PASS (0 fail, 0 warn) |

`just check-comments uk`: OK.
