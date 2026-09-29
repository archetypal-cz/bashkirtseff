# Owner policy update (KRR 2026-09-28, via lead) — apply to your carnets' final plans

(a) Obvious TYPESETTING typos of the printed edition (Mon Journal) are CORRECTED: in new text (new.french) and in
    set_french. Add the correction to the paragraph's RSR note: new paragraphs append to `rsr`, e.g.
    «… 2026-09-28 rebuild). Printer's typo corrected: «dnas» → «dans» (Mon Journal t.12 p.X).»; old paragraphs put
    it in `_rsr` (post_apply turns `_rsr` into an RSR comment; if `_rsr` already exists, append a sentence).
    Marie's genuine spellings (her own misspellings, foreign names as she writes them, «[sic]» cases) STAY.
    Headings already normalised (décembe, Dimancher, janver) count as done: make sure each has such a note.
(b) Facsimiles of printed programmes and clippings in the print are shown as images in addition to the
    transcription: cut them (600 dpi WebP, tight, ≤1600 px, <300 KB) into $W/drawings/CCC/ and list them in
    final/drawings-CCC.json with the same fields (entry, anchor_old or anchor_docx = the transcription paragraph,
    file, caption FR «Fac-similé : …», alt FR, source). Anchor on an OLD id where possible; for a new paragraph
    give anchor_docx (its docx ¶) — post_apply resolves it.
Rebuild final/plan-CCC.json via your fix script, re-run your dry run, update REVIEW-CCC.md (list every typo fixed),
and report back in ≤150 words. HEAD moved (065–067 rebuild + toolsmith fix cac96e6cd); dry-run against current main.
