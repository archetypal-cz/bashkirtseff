# Conventions for the tome 12/13 plans (081–089)

Work dir: /tmp/claude-1000/-home-krr-bashkirtseff/467edde8-50c6-480d-80c0-3a213d11ff10/scratchpad/plan-tome1213/ (= $W)

## Pipeline (all re-runnable; never hand-edit a generated plan)

1. `draft/` — `just rebuild-draft-plan` output (baseline; never edit). REVIEW-tome12.md / REVIEW-tome13.md.
2. `tiled/` — `tools/tiler.py`: completes cut-short old clusters. For each docx ¶ that old clusters cover only
   partly, every cluster keeps its old text verbatim and gets the missing docx text appended up to the next
   cluster's start (the first one also any prefix). Replaces the drafter's whole-¶ completions (which duplicated
   the «not found» fragments) and removes draft `new` paragraphs that duplicated a partly covered ¶.
   Marks `_tiler: true`, `_tiler_para: N` (post-apply adds an RSR note citing it). Report: `tiled/tiler-CCC.md`.
3. `common/` — `tools/fix_common.py`: cover entries removed (text → `common/withdrawn-CCC.json`, old cover
   paragraphs dropped with reason «title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript
   is scanned)»); quotes normalised (’→' “”→" as in _original); `kind: other` removed from «[Aucun texte…]»
   placeholders; dialogue dashes restored in new text (docx list numbering «-» → «- »).
4. `final/plan-CCC.json` — built by `tools/fix_CCC.py` (one per carnet, owned by the carnet's worker) from
   `common/plan-CCC.json` with scripted edits. Review notes: `final/REVIEW-CCC.md`. Drawings: `final/drawings-CCC.json`.

Helpers: `tools/tk.py` (d TOME A B = docx ¶ dump; o CCC A B = _original clusters; f CCC FILE; g TOME REGEX = grep
docx; pg TOME PARA = PDF page), `tools/page.py TOME PDFPAGE… | --para N [--dpi] [--crop y0 y1]` (run with
`uv run --quiet --with pymupdf python page.py …`; PNGs in `$W/pages/`), `tools/view.py PLAN [--full]`,
`tools/numpr12.json` / `numpr13.json` (docx ¶ with list numbering). Page offset: printed = PDF − 1 in both tomes
(verified t12 PDF 155 = p.154, t13 PDF 226 = p.225); the drafter already cites printed pages from the scan footer.

Dry runs: `just rebuild-carnets final/plan-A.json final/plan-B.json …` for carnets that exchange paragraphs,
`just rebuild-carnet CCC final/plan-CCC.json` otherwise. Never `--write` in the main repo. No git mutations.

## Decisions (owner policy KRR 2026-09-27/28 + lead brief)

1. **No cover entries.** Title-page text (Livre NN, «Gloriae Cupiditas», commencé/terminé, addresses, place
   lines, Marie's index lines such as «Dessin 3 octobre 1877 / Peinture … / Médaille …», «Livre 77, page 177
   passage…», «page 86 faire un livre») is withdrawn: draft `new` paragraphs removed, old ones dropped with the
   reason above. Record every withdrawn text verbatim with docx ¶ and «Mon Journal t.N p.X» in REVIEW-CCC.md under
   «Withdrawn cover pages». Exception, flagged for the lead: a first-person diary-like note by Marie in the title
   page's margin («[En travers: …]» with «je»/«me») stays as a `margin` paragraph at the start of the first entry.
   Stray draft entries dated from title-page lines (e.g. 083 «1878-01-27», 085 «1878-06-27») are title-page
   material: withdraw.
2. **Cross-carnet moves** only where the docx Livre title page really puts the text in the other notebook.
   083.0002–0006 (Livre 83 title) belong to 083's plan (worker B), not 082's: worker A removes them from 082.
3. **Kinds.** Tome 12's foreword: small print = Marie's margin/cross-page annotations and struck words;
   letters (sent or received, pinned or not) are printed from Coppée (1891) and Le Roy (1999). So docx style
   «Body text (4)» is small print, NOT a clipping signal.
   - `letter`: a letter copied or pinned into the notebook (Marie's own or received). New ones: the tool quotes
     them; old ones: quote with `set_french` (`> ` per line). Give `source` («Lettre de X à Y, date», no double
     quote). Dialogue openers («— Mademoiselle, …») and sentences that merely start with «Madame X …/Monsieur X …»
     are NOT letters: remove those guesses. A letter the printed edition reproduces from Coppée/Le Roy and which
     Marie did not copy/pin is still printed in the tome: keep it as `letter` and note it.
   - `clipping`: a pasted newspaper cutting or printed matter only; `source` = paper + date; add the paper's tag
     when `content/_original/_glossary/culture/newspapers/` has one (the tool adds `[#Press_clipping]`).
   - `margin`: «[En travers: …]», «[Dans la marge: …]» whole paragraphs; `rayé`: whole struck paragraphs incl.
     «[N lignes cancellées]»; `editorial`: the edition's notes about the physical manuscript («[MOITIE DE PAGE
     BLANCHE]», «[BAS DE PAGE BLANC]», «[BAS DE PAGE MANQUE]», «[Manque dans le manuscrit p. 96 à 98]», «[Manque du
     11 au 13 septembre 1880]», «[p. 2 bis …, écriture plus fine de Marie]»). «[Annotation: YEAR …]»: margin if the
     year is ≤ 1884 (Marie's later note); a later year (e.g. 1905) is not Marie's hand → `other`, source saying so,
     and flag it. Partly struck/marginal text inside a diary paragraph stays inline, no kind.
   - The printed edition's own footnotes stay out (e.g. tome12 ¶2100–2101 «1 Le Figaro du samedi 28 décembre 1878…»):
     remove such draft `new` paragraphs; note them in REVIEW.
4. **Placeholders / fabricated days.** Old clusters that are extraction artefacts, not manuscript text
   («[Pas d'entrée pour cette date…]», «[Aucune entrée pour cette date.]», «[Note: Ce contenu peut chevaucher…]»,
   «[Note de transition: …]», English notes such as «Marie's 21st birthday»): if the docx has no date line for
   that day, `drop` them (reason: «extraction artefact: no such day/text in the manuscript (tomeNN.docx)»); an entry
   left with no paragraph disappears (tool redirects it to the carnet index). If the docx has a bare date line,
   the day keeps one «[Aucun texte - date seule mentionnée]» paragraph (reuse the old cluster; `set_french` it to
   the standard text + its heading if it differs).
5. **Empty days** with a date line and no text: «[Aucun texte - date seule mentionnée]» entries (draft does this).
6. **Headings/labels match the manuscript**: the date line as printed (OCR digit splits «1 3» → 13 repaired;
   Julian second dates kept). Merged-day headings in _original («# Samedi 14 / Dimanche, 15 septembre 1878»)
   are split into the real days; a heading-only old cluster that no longer fits is `set_french`'d to its day's
   heading or dropped if the new entry gets its heading via `heading`.
7. **OCR slips** in new/completed text: fix to the printed reading when the scan clearly shows it; otherwise keep
   and list in REVIEW («OCR kept»). Fix «I !»/«I!»→«!», «II»→«!!» where obviously exclamation marks, «1 878»→1878.
8. **RSR**: every new paragraph cites docx ¶ and «Mon Journal t.N p.X» (draft does it; keep the wording
   «Restored from tomeNN.docx ¶N, Mon Journal t.NN p.X (missing from original extraction, 2026-09-28 rebuild).»).
9. **Old text not found in the docx** (drafter list): check each against the docx/scan. If it is a fragment the
   tiler completed, fine. If it is a paraphrase/duplicate of text that the plan now has as `new`, drop the `new`
   (keep the old ID, `set_french` it to the docx text). If it is genuinely absent from the tome, keep it in place
   and flag it (never drop Marie-looking text silently).
10. **Kinds on old paragraphs** set with `"kind"` on the `old` entry; letters/clippings quoted via `set_french`.
11. **Drawings**: cut at 600 dpi to WebP (tight crop, ≤1600 px long side, <300 KB) into
    `$W/drawings/CCC/tomeNN-pPPPP-n.webp` (PPPP = printed page, 4 digits); list in `final/drawings-CCC.json`
    `[{"entry": "<new entry file>", "anchor_old": "CCC.NNNN" | null, "anchor_docx": N | null, "caption": "…FR…",
    "alt": "…FR…", "source": "Mon Journal, t. NN, p. X"}]`. Only real drawings (Marie's sketches reproduced in the
    print); printed facsimiles of programmes/cards: cut but list separately under `facsimiles` (not linked).
12. Do not touch other carnets' plans. Report to the lead planner (me) only via your final message.
