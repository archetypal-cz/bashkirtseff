# A23-B-cz: sharp-scan source fixes carried into the cz tree, carnets 021–030 (2026-10-24)

Package B-A23-cz, following BRIEF-B. Tree: cz only. Sources: A2.md (021–025, commit e5f0144b18) and A3.md (026–030, commit 7df5778edd). The lead had already run `just sync C cz --footnotes`; sync's WARN lines (`sync/A2-cz.txt`, `A3-cz.txt`) were resolved by hand.

## What was done

Every paragraph that has an r-label in `_original` 021–030 was checked: 367 labels in 314 paragraphs (021–025: 197 labels, 026–030: 170). 309 of those paragraphs were changed. Four further paragraphs got word fixes only. That makes 313 changed paragraphs, each with one TR comment.

In each changed paragraph:

- The Czech rendering of the run is wrapped as `==…==[^CCC.NNNN.rK]`, with the label from the source.
- The ref that sync had appended mechanically at the end of the line was removed.
- The English definitions were removed, wherever sync had put them: at the end of the file or inside the paragraph. One localized `Pozn. překl.: V originále rusky; do francouzštiny přeložil vydavatel.` now follows each paragraph.
- The italics or bold left over from the old star-garbled source were removed. Italics stay only where the print sets them inside the run (`==*dotazník*==`, `==*mopsů*==`, `==*výslechový protokol*==`, `==*censurním výborem*==`, `==*a napodoboval*==`, `==*flámař*, flámař==`, `==*Slečno*. …==`). Ship names keep their usual italics (`==*Kníže Pojarski*==`).
- One TR comment `source fix (sharp scan 2026-10-23): …` was added on its own line after the paragraph's text and comments, using the Edit tool.

Integrity check over all 367 labels:

- Each label has exactly one cz definition, with the exact localized text.
- Each label has exactly one ref in the visible text, and it sits right after `==`.
- No English «Written in Russian…» definition is left in cz 021–030.
- No r-label is missing from cz, and cz has no r-labels the source lacks.
- Compared with HEAD, visible text changed only in the 313 listed paragraphs.

Method: visible-text lines and footnote-definition lines were patched by a Python spec script. These lines carry no comment markers. Comment lines were written only with the Edit tool.

## Changed pids per carnet

- **021 (44):** 0017 0018 0032 0038 0082 0083 0084 0085 0109 0131 0133 0149 0165 (r2) 0194–0197 0257 0262 0278 0293 0313 0314 0318 0327 0371 0378 0383 0394 0406 0418 0423 0446 0502 0504 0505 0507 0511 0520 0526 0527 0571, plus word fixes in 0387 and 0392
- **022 (41):** 0073, 0080–0105 (Walitsky verse, one paragraph per line, layout kept), 0154 0179 0180 0182–0186 0189 0202 0341 0399 0407 0434
- **023 (53):** every 023 pid in the A2 impact list, plus word fixes in 0005 and 0458
- **024 (18):** every 024 pid in the impact list
- **025 (25):** every 025 pid in the impact list
- **026 (2):** 0019 0039
- **027 (36):** every 027 pid in the A3 list except 0127
- **028 (5):** 0081 0116 0158 0230 0268
- **029 (9):** 0029 0074 0075 0076 0150 0216 0247 0248 0325
- **030 (80):** every 030 pid in the A3 list except 0124

These paragraphs already had correct marks. They were checked, left unchanged, and got no comment: 021.0165 r1, 021.0255, 021.0310, 025.0268, 027.0127 (its label is `027.0126.r1`, as in the source), 030.0124.

## Word changes from the reports

- **021.0032** «Bouver et foumer»: „Bouver et tourner,“ → „Bouver et foumer,“. Note 21.32.1 now reads „Macainnova zkomolenina „boire et fumer“ (pít a kouřit).“ The old LAN note in the embedded French still glosses «se retourner»; it was left in place, as A2 #7 says.
- **021.0387**: „[Škrtnuto: ale]“ → „[Škrtnuto: to je pravda, ale]“.
- **021.0392**: «!!!!!» now has five marks. «physionnomies» needs no change.
- **023.0005**: „důkaz Girotta I“ → „důkaz Girofla!“. 023.0286 needed no change.
- **023.0458**: «réservés par personne[s] désiré[e]s» had been dropped by the translator because of the OCR garble. It now reads „do první řady křesel vyhrazených pro vítané osoby“.
- **023.0525**: the OCR debris „Viviani II!“ → „Vivianiové!!!“ («de la Viviani !!!»).
- **025.0043**: „nějaká mferdje“ → „nějaké h[ovn]o“. The editor's brackets are kept.
- **025.0052**: „Zase mé jméno!!“ («!!»).
- **025.0053**: the cz text had no star debris, so nothing changed.
- **027.0252** «carlins»: „z plemene cairnů“ → „z plemene ==*mopsů*==“. This matches „mopslíka“ in 026.0039.
- **027.0108**: the dialogue dash was restored in the source, so the speech is now in „…“, per the cz direct-speech ruling.
- **029.0029** «en arrière»: no change needed, because the cz already had „díval se nazpět“.
- **030.0129** «à la mienne»: no change needed, because the cz already had „mluvila s mou“.
- **Italics from the source:** 025.0119 the middle „*toho malého sedláka*“, and 030.0125 „*r*“.

## Decisions to flag for RED and the owner

1. **023.0122, song title «Je selle un cheval» (A2 open question 5).** The title is kept as printed, `==*Je selle un cheval*==[^023.0122.r1][^23.122.1]`, and the gloss note stays. The source marks the title as Russian, but cz titles are never `==…==`. If the owner chooses the title-only option, drop the mark and the r-note.
2. **The mark includes the inquit where the print's run does.** Affected: 023.0300, 025.0017, 027.0033, 027.0034, 029.0076, 030.0014, 030.0291.
3. **The mark crosses quotation marks where one run covers two utterances, or narration plus speech.** Affected: 021.0504 (r2), 024.0393 (r1), 027.0308 (r1), 030.0084, 030.0276.
4. **Small rewordings so the runs can be marked:**
   - 030.0003: word order changed so the two runs frame «cabinet de toilette».
   - 027.0340: „Constantin ==není pro vás něco==?“
   - 027.0308: the quote now closes after „*Hlouposti*“ (r1), and «jolies bêtises» stays Marie's comment.
   - 030.0016: r2 is the narration „když jsem se přiznala“.
   - 030.0009: «Justement, dis-je» lies outside the run, so its italics were removed.
   - 030.0368: only „Moussinko“ is marked, and the italics were removed from the rest of the speech.
   - 021.0371: „seděl jako ==zkoprnělý==“.
5. **Old tree notes changed:**
   - 028.0158 `[^28.158.1]` («V originále francouzsky: bel homme») was removed, because the print stars it as Russian.
   - 028.0230 `[^28.230.1]` («V originále anglicky: skunks») was removed for the same reason.
   - 029.0076 `[^29.55.3]` was trimmed to the gloss: „Ve francouzském textu „barine“ — ruský výraz pro šlechtice, pána.“
6. **Existing tree notes next to the r-ref:**
   - 023.0289 `==vareniky==[^r1][^23.280.1]`
   - 029.0076 `…==[^r1]“[^29.55.3]`
   - 024.0193: the Russian `==haraburdí==[^r1]` is now next to the English `==smetí==[^24.193.1]`
7. **Extents taken from the source's current choices, which are still open owner questions:** 027.0347 (A3 #1), 030.0283 (A3 #2), 027.0390 r1 (A3 #3), 021.0505 r1 (A2 #6). The cz text follows `_original` as it stands now.
8. **021.0149 / 021.0165 / 021.0109 «Imbécile».** The tree's existing rendering „Imbecile/imbecile“ is kept inside the mark. No polish was applied.

## Skipped / not done

- **022.0080: the missing 13-line Merjeewsky verse (A2 open question 1)** is not in `_original`, so nothing was added to cz. The TR comment on 022.0080 mentions it.
- No r-labelled paragraph was missing from cz. The embedded French matched `_original` everywhere after the lead's sync. The inventory flagged verse paragraphs as mismatches only because their French spans several comment lines; each was checked by hand.

## Gates (cz)

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

`just check-comments cz`: OK. No git state was changed, and OPEN-ITEMS was not edited.
