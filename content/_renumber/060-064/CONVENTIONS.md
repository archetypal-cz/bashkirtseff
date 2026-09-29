# Conventions for the tome 8 plans (060–064)

Work dir: /home/coder/rebuild-state/plan-tome08/ (= $W). Repo: /home/coder/bashkirtseff (main; READ ONLY for you —
never `--write`, never any git mutation, never edit content/).
Read first: /home/coder/bashkirtseff/docs/REBUILD_CARNET.md (plan format, kinds, set_french, headings).

## Pipeline (all re-runnable; never hand-edit a generated plan)
1. `draft/` — `just rebuild-draft-plan` output (patched drafter: tool/). Baseline, never edit. `draft/REVIEW.md` lists the
   drafter's guesses for all five carnets.
2. `common/plan-CCC.json` — built by `tools/common08.py` + `tools/title08.py` (the lead applier runs these; don't edit):
   cover entries removed (texts in common/withdrawn-CCC.json); quotes ’→' “”→"; «— » dialogue dashes restored in new text
   (docx list numbering); stray date-line tails removed; ID-less stubs → drop_files; «[annotation]» markers → kind
   `editorial`, the italic run after them → `margin` (source «Annotation de Marie[, YEAR]»); old clusters «[annotation] text»
   → `margin`. What it did and the **CHECK** items it could not decide: `common/log-CCC.md`.
   060 only: `title08.py` puts Marie's Livre 60 title-page note (docx ¶70–71) as 2 `margin` paragraphs after 060.0001.
3. `final/plan-CCC.json` — built by YOUR `tools/fix_CCC.py` from `common/plan-CCC.json` with scripted edits
   (re-runnable; identify paragraphs by old ID or by docx ¶ in the new paragraph's rsr, never by list index).
   Review notes: `final/REVIEW-CCC.md` (every decision; sections below). Drawings: `final/drawings-CCC.json` (probably empty).

## Helpers (in $W/tools)
- `python3 tk.py d 08 A B` docx ¶A..B (index = docx ¶; style; `W=2000` env for longer lines); `tk.py g 08 REGEX` grep docx;
  `tk.py o CCC 0001 0100` _original clusters; `tk.py f CCC FILE.md`; `tk.py pg 08 PARA` PDF page of a docx ¶.
- `uv run --quiet --with pymupdf python page.py 08 PDFPAGE [--dpi 90] [--crop y0 y1]` → PNG in $W/pages/ (then Read it).
  Printed page = PDF page in tome 8 (verified p.21, p.23, p.27, p.223). The drafter's RSR notes cite «Mon Journal t.8 p.X».
- `python3 view.py PLAN.json [--full] [--from FILE] [--to FILE]` compact plan view.
- Dry run: `cd /home/coder/bashkirtseff && just rebuild-carnet CCC $W/final/plan-CCC.json` must be accepted (rc 0).
  Warnings about footnote label collisions are fine.

## Decisions (owner policy KRR 2026-09-27/28, decided — don't re-ask)
1. **No cover entries.** Title-page formulas are withdrawn: «Gloriae cupiditate», «H[is] G[race] t[he] D[uke] o[f] H[amilton]»,
   «Livre NN», «depuis … jusqu'au …», addresses/place/itinerary lines, Latin/Italian mottos set as titles, struck lines
   on the title page. Old `_original` paragraphs that are such text are DROPPED with reason
   «title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)». Record every withdrawn
   text verbatim with docx ¶ and «Mon Journal t.8 p.X» in REVIEW under «Withdrawn cover pages».
   Exception: Marie's OWN notes on a title page (annotations, resolutions, first-person remarks) go in as `margin`
   paragraphs at the first entry (done for Livre 60 by title08.py; report any other such note you find).
   Known old title-page paragraphs: 061.0002?–0004 (Livre 61 motto «Amans ita ut fax…» / «Publius Syrus»; check 0002),
   063.0500 (Gloriae/H[is] G[race] at the end of 063 = Livre 64 title page), 064.0002–0007 (Livre 64 title + itinerary).
   Text on the last page of a notebook BEFORE the next title page (e.g. docx ¶1043 «Papier, Maria, cardinal, cigarettes.»,
   061 «Mari, femme, duc, amour, Gioia *.») is Marie's diary text: keep it at the end of its carnet.
2. **No cross-carnet moves** unless the docx Livre title page really puts text in the other notebook; tell the lead first.
   Carnet 059 (already rebuilt) is off limits.
3. **Kinds.**
   - `letter`: a letter copied/pinned into the notebook, quoted (`> `) — new ones are quoted by the tool; old ones via
     `set_french` (`> ` per line) + `source` «Lettre de X à Y, date». Dialogue openers («— Mademoiselle, …»,
     «— Madame, vous dites…», «— Monsieur, dis-je…») are NOT letters: remove those guesses.
   - `clipping`: pasted newspaper cutting / printed matter only; `source` = paper + date (no double quote); add the paper's
     tag if `content/_original/_glossary/culture/newspapers/` has one (e.g. `[#Le_Figaro](../_glossary/culture/newspapers/LE_FIGARO.md)`).
   - `margin`: «[en travers …]», «[dans la marge …]» whole paragraphs and Marie's later annotations; `rayé`: whole struck
     paragraphs incl. «[N lignes cancellées]», «[une ligne rayée]»; `editorial`: the edition's notes about the physical
     manuscript and the edition's «[annotation]» label. Partly struck/marginal text inside a diary paragraph: no kind.
   - The printed edition's own footnotes stay out.
4. **Placeholders**: old clusters that are extraction artefacts, not manuscript text («[Pas d'entrée…]», «[La suite est…]»,
   English notes, running heads such as 060.0012 «## ROME, MERCREDI 10 MAI 1876 - JEUDI 11 MAI 1876» = the printed page's
   running header) → `drop` with a reason. Days with a date line and no text keep «[Aucun texte - date seule mentionnée]».
5. **Headings/labels match the manuscript** (the date line as printed, OCR digit splits repaired, Julian second dates
   kept). Two-day date lines («Dimanche 21 mai 1876 - lundi 22 mai 1876») are ONE entry; keep the old range file name
   when `_original` has it (1876-05-21-22.md) instead of the drafter's single-date name (fewer redirects). Where the
   docx has separate date lines for days that `_original` merged, split them into separate entries (`redirect_from` for a
   removed range file whose start date survives).
6. **OCR/typo policy**: fix OCR slips in new/completed text to the printed reading when the scan shows it («I !»→«!»,
   «1 !»→«!», «? ?» as printed, line-break hyphens «Exa- minez»→«Examinez», «reconnais.- sant»→«reconnaissant»,
   «Qn»→«On»). The printed edition's obvious typesetting typos are CORRECTED (set_french/new text) with an RSR note
   citing the page; Marie's genuine spellings and «[sic]» stay. Keep «Larderei» as in the docx and _original
   (a corpus-wide rename to Larderel is scheduled separately). List every fix in REVIEW.
7. **RSR**: every new paragraph keeps the drafter's «Restored from tome08.docx ¶N, Mon Journal t.8 p.X (missing from
   original extraction, 2026-09-29 rebuild).» (add what you changed, e.g. «OCR … corrected from the scan»). An old
   paragraph you `set_french` needs a reason: add `"_rsr": "…"` on it (the lead turns these into RSR comments after --write).
8. **Completions** (drafter `set_french` on 061.0029, 062.0394, 063.0053, 063.0134): check each against the
   «not found» neighbours (061.0030, 062.0393, 063.0052…) — `_original` often splits one docx paragraph into two
   clusters, so the drafter's completion would DUPLICATE the next cluster. Remove wrong completions.
9. **Old text not found in the docx** (draft REVIEW list): mostly short dialogue lines the fuzzy matcher missed — confirm
   they are in the docx/scan at that place and keep them. Genuinely absent text: keep in place and flag. Never drop
   Marie-looking text silently.
10. **Order**: `_original` sometimes files paragraphs under the wrong day; the draft moves them to the docx day (this causes
   the footnote-collision warnings). Verify doubtful moves against the docx/scan; the manuscript order wins.
11. **Repeated text / uncertain alignments** (draft REVIEW): decide per case; a sentence Marie really wrote twice stays twice.
12. **Drawings**: none detected by the figure scan for these pages; if a scan page you look at shows a drawing or a
   facsimile, note it in REVIEW (page, what) — the lead cuts it.
13. REVIEW-CCC.md sections: Summary counts; Withdrawn cover pages; Drops; Splits/moves; Kinds (with sources);
   set_french list; OCR/typo fixes; Kept-but-flagged; Open questions for the owner (conservative default chosen).
