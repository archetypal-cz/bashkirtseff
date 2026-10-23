# Brief A — verify `_original` against the sharp page images (2026-10-23)

The owner exported the original ABBYY page images of the printed edition «Mon Journal – texte intégral»
(Cercle des Amis de Marie Bashkirtseff). Until now we only had `content/_raw/scans/TomeN.pdf` with
75 dpi images (tomes 3–5) or 150 dpi (6, 8–16), so several readings were made "by rule" or from blur.
Now we can read every word. Your package (carnets, tome, items) is in your task prompt.

Read first: `.claude/skills/_shared/editing_rules.md` (§1 splice-safe comments, §3 never fact-correct
Marie, §7 never renumber), `content/CLAUDE.md` (the Russian-passage mark, line ~92), and
`.claude/reports/scan-wishlist-2026-10-23.md` (why each page was asked for).

## Tools (run from /home/krr/bashkirtseff)

- Find a page: `uv run -q --with pymupdf python -I -W ignore content/_raw/scans/hires/_tools/find.py TOME "a phrase"`
  → PDF page numbers (searches the PDF text layer; that layer is OCR and has slips).
- Read a page: `uv run -q --with pillow python -I content/_raw/scans/hires/_tools/view.py TOME PAGE top|mid|bottom|full|0.40-0.65 OUT.png`
  then Read OUT.png. Write OUT under `/tmp/claude-1000/-home-krr-bashkirtseff/602ebb90-b449-49b8-827e-aea0d7147a04/scratchpad/hires/`
  with your package name in the file name (`a1_t3_p084_top.png`), `mkdir -p` it first.
  Use crops (top/mid/bottom or a fraction range), not `full`, when you need to see apostrophes or stars.
  Hi-res images exist for: tomes 3, 4, 5 complete (`hires/Tome3..5/pNNN.jpg`); tome 6 pp. 265–267; tome 9
  pp. 121, 225–227, 298; tome 10 pp. 80, 81, 117, 118, 140, 166, 167; tome 14 p. 54; tome 15 pp. 247, 287
  (PDF page numbers). Pages outside that list: render from `content/_raw/scans/TomeN.pdf` with pymupdf.
- The machine has only 1 GB RAM: run one image command at a time, never loop over many pages in parallel.
- Russian-star candidates of tomes 3–5 from the text layer: `.claude/reports/russian-stars-tomes3-5.tsv`
  (tome, pdf_page, line). The layer renders the opening star ★ as `*`, `♦`, `'` or drops it; the closing star
  as `*`. Many `*` lines are something else (footnote calls, `[Rayé]`); the image decides.

## What to do

1. **Apostrophes restored by rule.** grep your carnets for RSR notes about apostrophes restored «by rule» /
   blurred scan (C-31). For each, look at the page image: if the print has the apostrophe, rewrite the note
   to say it was checked on the sharp image (keep it one short sentence: «Elision apostrophes checked on the
   sharp page image of Mon Journal t.N p.X (2026-10-23).»); if the print has none (it sometimes prints «l »),
   restore the print's form and say so in the note. While on each page, compare the whole paragraph with the
   print: any other OCR slip (missing word, «I» for «l», wrong letter, lost italics, lost `[Rayé: …]`) gets fixed
   with its own RSR NOTE. Never change Marie's own spelling or grammar as printed.
2. **Russian passages.** Go page by page through the tsv candidates of your carnets, and through the earlier
   RSR notes in your carnets that mention stars ★ / Russian (old 2025 notes say «Stars ★ mark …»). For every
   run the print sets between stars (★ … *), make `_original` carry the standard mark exactly as in
   `content/_original/002/1873-03-07.md`: `==run==[^CCC.NNNN.rK]` around the exact extent of the starred run,
   and a footnote definition `[^CCC.NNNN.rK]: Written in Russian in the manuscript; French translation by the editor.`
   on its own line after the paragraph (blank line before). K counts 1, 2, … per paragraph. Remove stray `*`,
   `'`, `♦`, `★` debris and wrong italics that came from the stars (keep italics the print really has).
   Runs already marked: check the extent against the image. A run that crosses paragraphs gets one mark per
   paragraph. Add one RSR NOTE per paragraph you mark: «Russian in the manuscript: Mon Journal t.N p.X prints
   the run between stars (sharp page image, 2026-10-23).» Old RSR notes that describe the stars stay.
3. **Your specific items** (listed in your task): settle each reading on the image; fix `_original`; RSR NOTE.
4. **Tags and research, where needed.** If a reading you fix names a person, place or work, check the glossary
   (`content/_original/_glossary/`, grep the name and aliases) and add the tag line if an entry exists. Create a
   new glossary entry only for someone who matters to the story, following `.claude/skills/glossary/SKILL.md`;
   otherwise put the identification in the RSR NOTE. Cite sources.

## Rules

- Edit only `content/_original/` files of your carnets (and new glossary files if item 4 requires).
  No translation trees, no OPEN-ITEMS, no git (read-only git is fine).
- Comments on their own lines (Edit tool only), real timestamps (`date +%Y-%m-%dT%H:%M:%S`), role RSR.
- Never renumber; if text is missing that needs a new paragraph, do not add it — report it (pid after which it
  belongs, the text read from the image).
- If unsure of a reading, keep the current text, add `[?]` only where the print itself has it, and report it.
- After each carnet: `just splicescan _original CCC` must print nothing and `just verify-carnet _original CCC`
  should pass (if `_original` is not accepted by these recipes, run `just check-comments` and say so).

## Report

Write `.claude/reports/hires-2026-10-23/<package>.md` with:
- a table of every change: pid · file · kind (apostrophe-confirmed / apostrophe-reverted / ocr-fix / russian-mark /
  reading / tag) · old → new (short) · tome+PDF page;
- **Translation impact**: the list of pids whose visible French changed in a way translators must follow
  (new Russian marks, changed or added words). Pure apostrophe/punctuation fixes are not translation impact;
- open questions for the owner (with the two options) and anything you could not settle;
- counts. Keep it factual and short. Your final message: the counts and the report path.
