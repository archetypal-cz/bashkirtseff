# Brief F — Marie's drawings from the sharp ABBYY scans (owner 2026-10-24: «mariiny kresby bychom taky měli
proskenovat … ve vyšší kvalitě (nebo z nich udělat svg!)»)

## Background

48 drawings are listed in `_original` frontmatter `drawings:` (docs/REBUILD_CARNET.md §Drawings; files in
`src/frontend/public/images/marie/drawings/<carnet>/`, 3.7 MB). They were cut from the 75–150 dpi tome PDFs
(`content/_raw/scans/TomeN.pdf`) or from images embedded in `content/_raw/tomeNN.docx`. The printed edition's
original ABBYY page scans (300 dpi text pages, **600 dpi for facsimile/picture pages**) are on the share
`/mnt/arrdata/backups/OneDrive/bashkirtseff/{tome1..5,Tome6..16}/NNNN/Image/*.frdat` (cifs automount, slow:
copy, don't read in place). Read memory-style notes: `/home/krr/.claude/projects/-home-krr-bashkirtseff/memory/abbyy-hires-scans.md`.
Already extracted: tomes 3–5 complete (`content/_raw/scans/hires/Tome3..5/pNNN.jpg`, page = PDF page) and single
pages of T6/9/10/14/15. Tools: `content/_raw/scans/hires/_tools/` (extract.py, match.py, match2.py, global.py,
sheet.py, pull.sh, view.py, final_T*.json maps). **Folder number ≠ PDF page** (gaps, rescans appended at the
end of a batch): build or extend the folder→page map for the pages you need (full-gray-image matching against
the PDF page render at ~96×136, confirm with a contact sheet; a 600 dpi folder is a strong hint of a picture page).

Limits: **disk has ~3 GB free** — extract only the pages you need, keep frdat copies in the scratchpad
`/tmp/claude-1000/-home-krr-bashkirtseff/602ebb90-b449-49b8-827e-aea0d7147a04/scratchpad/drawings/` and delete
them when a tome is done; **1.8 GB RAM** — one image process at a time.

## Tasks

1. **Re-cut every listed drawing** from the sharp scan: same crop intent, tighter/cleaner edges, WebP, ≤1600 px
   long side (2000 px allowed for detailed pen drawings), aim <300 KB, mild cleanup only (levels/paper tone; no
   retouching of the drawing). Keep file names and frontmatter `src` unchanged where the drawing is the same, so
   no content edit is needed; update `source:` only if the page citation was wrong. For docx-image sources
   (tome03–05 `imgNN`), find the page in the hi-res tome.
2. **Find drawings not yet listed:** in tomes 3–5 (complete hi-res) look at every page with ink outside the
   text block (you may use `just scan-figures N` / `src/scripts/scans/` output and the 600 dpi folders of other
   tomes as leads). Report candidates (tome, page, pid, what it shows); add the clear ones (Marie's drawings, not
   printers' ornaments) to `_original` frontmatter with caption in French, `source`, `paragraph` — RSR-style care,
   check the paragraph text mentions or adjoins the drawing.
3. **SVG:** for clean pen line drawings only, make an SVG vectorization as an extra (potrace/vtracer via `uv run
   --with …` or a static binary in the scratchpad; no apt). Judge each on the image: keep SVG only when it is
   faithful at reading size (no lost strokes, no blobby shading) and small (<200 KB). Put it next to the WebP
   with the same base name `.svg`; do not switch `src` yet — list them, the owner decides.
4. Check that the site still builds the entry pages that changed: not needed for pure image replacements;
   for new frontmatter entries run `just verify-carnet _original CCC` + `just splicescan _original CCC`.

No git writes, no OPEN-ITEMS, no translation trees (translations show the original's drawings). Do not touch
carnets 022/032/034/040/067 frontmatter while other agents work there (list candidates for them instead).

## Report

`.claude/reports/hires-2026-10-23/F.md`: table per drawing (file, tome/page, folder, old px → new px, KB,
SVG yes/no), new candidates, maps you built (save them as `_tools/final_T<N>.json` updates), disk left.
Final message: counts + path.
