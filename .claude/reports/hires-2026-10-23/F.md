# F — Marie's drawings re-cut from the sharp ABBYY scans (2026-10-24)

Brief: `BRIEF-F.md`. No git writes; no translation trees touched; no frontmatter of 022/032/034/040/067 touched.

## Summary

- **48/48 listed drawings re-cut** from the hi-res page scans, same file names and `src`, WebP, ≤1600 px
  (1400 for the four printed race programmes), gray, mild levels only (paper → white with the white point a
  little under the paper tone to drop print show-through, black point to the 0.5 % ink level; no retouching of
  strokes). Total `drawings/` 3.7 → 4.8 MB incl. SVGs.
- Crop changes beyond "same box, sharper": the old docx crops had printed text painted out in white — the same
  areas are blanked again (015, 030, 032-img01), plus folios / printed lines blanked or cropped off in 057, 070-p0080,
  070-p0116, 070-p0117, 071-p0165/0166, 095, 070-p0139 (column of print at left). Three old crops had cut the item:
  **069/tome10-p0043-1** now has «SOCIETÀ … CONCERTO» (old started at «CIETÀ … CERTO»), **070/tome10-p0117-1** gains its
  header lines «CORSA DI GARA AL TROTTO FRA SIGNORI» and «GIUDICI DEL CAMPO», 070-p0116 gains the full programme
  without the folio and the French text column.
- **Resolution gain:** tome 3 is a 600 dpi photo (4× the docx images), tomes 4–5 docx images were half-resolution of
  the 300 dpi scans (2×), tomes 6–16 crops were cut from the 75 dpi PDFs and upscaled — the 300 dpi scan is 4× the
  PDF, and the six T10 programme/clipping pages are 600 dpi (8×). Where the native 300 dpi crop is smaller than the
  old (upscaled) file, it is Lanczos-upscaled to the old pixel size so the page layout (`.entry-drawing`, natural
  size up to 32 rem) does not change; detail is now real tone instead of a thresholded 75 dpi bitmap.
- **Over 300 KB:** 071/tome10-p0165-1 (461 KB) and 071/tome10-p0166-1 (321 KB) — the printed Florence programmes
  are a heavy halftone/photocopy grain at 600 dpi; already 1400 px, median 3×3, q60. Shrinking further costs
  legibility. Owner may prefer 1200 px.
- **Citations:** every `source:` page was right (tomes 6–16 cite the printed folio; PDF page = folio + 1 in T6/T10/
  T13/T15 and T7 p. 38, +4 in T9 p. 280, +0 in T7 p. 178–304 and T16). No `source:` changed except 017-img05 (below).
- **SVG:** 14 vectorizations next to the WebP (`<same name>.svg`, vtracer binary spline, viewBox added, 21–185 KB);
  `src` not switched — owner decides.
- **New candidates (task 2):** none clear. One uncertain (T4 p. 51 monogram, carnet 021) and one placement fix
  done (017-img05). Details below.
- Disk left: **2.8 GB** (scratch frdat/page copies deleted). Maps saved to `_tools/final_T{6,7,9,10,13,15,16}.json`.

## Per drawing

Page = PDF page of `content/_raw/scans/TomeN.pdf` = hi-res page; folder = ABBYY batch folder. Old → new px; KB = new.
Crop boxes, match scores and options: `content/_raw/scans/hires/_tools/drawings_boxes.json`.

| file | tome/page | folder | px old → new | KB | SVG |
|---|---|---|---|---|---|
| 015/tome03-img01.webp | T3 PDF p.20 | 0020 (600 dpi) | 101×96 → 402×337 | 15 | yes |
| 017/tome03-img04.webp | T3 PDF p.86 | 0086 (600 dpi) | 30×51 → 119×204 | 3 | no |
| 017/tome03-img05.webp | T3 PDF p.86 | 0086 (600 dpi) | 46×46 → 181×182 | 4 | no |
| 018/tome03-img07.webp | T3 PDF p.145 | 0145 (600 dpi) | 236×354 → 939×1409 | 93 | no |
| 019/tome03-img09.webp | T3 PDF p.177 | 0177 (600 dpi) | 171×150 → 680×597 | 22 | yes |
| 020/tome03-img19.webp | T3 PDF p.226 | 0226 (600 dpi) | 610×914 → 1067×1600 | 138 | no |
| 020/tome03-img20.webp | T3 PDF p.227 | 0227 (600 dpi) | 590×904 → 1045×1600 | 189 | no |
| 023/tome04-img09.webp | T4 PDF p.122 | 0124 (300 dpi) | 287×102 → 579×204 | 11 | yes |
| 024/tome04-img17.webp | T4 PDF p.173 | 0175 (300 dpi) | 59×82 → 116×159 | 5 | no |
| 024/tome04-img18.webp | T4 PDF p.184 | 0186 (300 dpi) | 74×129 → 148×260 | 8 | no |
| 024/tome04-img26.webp | T4 PDF p.267 | 0269 (300 dpi) | 585×842 → 1111×1600 | 184 | no |
| 027/tome04-img25.webp | T4 PDF p.243 | 0245 (300 dpi) | 200×146 → 401×292 | 15 | no |
| 028/tome04-img27.webp | T4 PDF p.268 | 0270 (300 dpi) | 377×656 → 756×1277 | 119 | no |
| 030/tome04-img31.webp | T4 PDF p.345 | 0347 (300 dpi) | 282×277 → 565×554 | 34 | no |
| 032/tome05-img01.webp | T5 PDF p.44 | 0044 (300 dpi) | 219×221 → 438×442 | 22 | no |
| 032/tome05-img02.webp | T5 PDF p.45 | 0045 (300 dpi) | 410×627 → 823×1261 | 94 | no |
| 035/tome05-img03.webp | T5 PDF p.150 | 0150 (300 dpi) | 243×268 → 484×535 | 22 | no |
| 035/tome05-img05.webp | T5 PDF p.155 | 0155 (300 dpi) | 291×386 → 581×772 | 48 | no |
| 035/tome05-img06.webp | T5 PDF p.171 | 0171 (300 dpi) | 563×366 → 1125×731 | 68 | no |
| 037/tome05-img07.webp | T5 PDF p.219 | 0219 (300 dpi) | 320×242 → 645×487 | 31 | no |
| 047/tome06-p0098-1.webp | T6 PDF p.99 | 0099 (300 dpi) | 1292×1600 → 1295×1600 | 89 | no |
| 047/tome06-p0099-1.webp | T6 PDF p.100 | 0100 (300 dpi) | 967×1600 → 970×1600 | 102 | no |
| 053/tome07-p0038-1.webp | T7 PDF p.39 | 0039 (300 dpi) | 594×651 → 437×651 | 9 | yes |
| 055/tome07-p0178-1.webp | T7 PDF p.178 | 0177 (300 dpi) | 869×470 → 869×481 | 19 | no |
| 055/tome07-p0180-1.webp | T7 PDF p.180 | 0179 (300 dpi) | 1600×1480 → 1600×1475 | 64 | yes |
| 057/tome07-p0253-1.webp | T7 PDF p.253 | 0258 (300 dpi) | 1600×1339 → 1600×1362 | 71 | yes |
| 059/tome07-p0304-1.webp | T7 PDF p.304 | 0312 (300 dpi) | 1121×1600 → 1020×1600 | 69 | yes |
| 068/tome09-p0280-1.webp | T9 PDF p.284 | 0275 (300 dpi) | 926×580 → 926×560 | 43 | yes |
| 069/tome10-p0043-1.webp | T10 PDF p.44 | 0044 (300 dpi) | 1066×800 → 1066×744 | 33 | no |
| 069/tome10-p0044-1.webp | T10 PDF p.45 | 0045 (300 dpi) | 1206×1600 → 1142×1600 | 95 | no |
| 069/tome10-p0045-1.webp | T10 PDF p.46 | 0046 (300 dpi) | 1312×1439 → 1011×1439 | 98 | no |
| 070/tome10-p0079-1.webp | T10 PDF p.80 | 0080 (600 dpi) | 1232×1600 → 1095×1600 | 265 | no |
| 070/tome10-p0080-1.webp | T10 PDF p.81 | 0081 (600 dpi) | 1030×1600 → 992×1600 | 143 | no |
| 070/tome10-p0108-1.webp | T10 PDF p.109 | 0109 (300 dpi) | 1600×1060 → 1600×1060 | 222 | no |
| 070/tome10-p0108-2.webp | T10 PDF p.109 | 0109 (300 dpi) | 1600×1120 → 1600×1067 | 113 | no |
| 070/tome10-p0109-1.webp | T10 PDF p.110 | 0110 (300 dpi) | 1600×803 → 1600×806 | 113 | no |
| 070/tome10-p0116-1.webp | T10 PDF p.117 | 0117 (600 dpi) | 1600×1096 → 1400×1006 | 296 | no |
| 070/tome10-p0117-1.webp | T10 PDF p.118 | 0376 (300 dpi) | 1600×1102 → 1400×997 | 279 | no |
| 070/tome10-p0139-1.webp | T10 PDF p.140 | 0140 (600 dpi) | 886×925 → 910×925 | 115 | no |
| 071/tome10-p0165-1.webp | T10 PDF p.166 | 0165 (600 dpi) | 1400×1102 → 1400×1045 | 461 | no |
| 071/tome10-p0166-1.webp | T10 PDF p.167 | 0166 (600 dpi) | 715×1400 → 702×1400 | 321 | no |
| 072/tome10-p0262-1.webp | T10 PDF p.263 | 0267 (300 dpi) | 1443×1600 → 1446×1600 | 153 | no |
| 085/tome13-p0050-1.webp | T13 PDF p.51 | 0051 (300 dpi) | 709×442 → 709×439 | 22 | yes |
| 089/tome13-p0352-1.webp | T13 PDF p.353 | 0353 (300 dpi) | 1293×1600 → 1348×1600 | 69 | yes |
| 095/tome15-p0022-1.webp | T15 PDF p.23 | 0023 (300 dpi) | 1600×1362 → 1600×1424 | 69 | yes |
| 096/tome15-p0069-1.webp | T15 PDF p.70 | 0070 (300 dpi) | 1600×1515 → 1600×1469 | 86 | yes |
| 098/tome15-p0161-1.webp | T15 PDF p.162 | 0162 (300 dpi) | 1276×984 → 1276×1099 | 55 | yes |
| 101/tome16-p0011-1.webp | T16 PDF p.11 | 0011 (300 dpi) | 560×299 → 560×297 | 10 | yes |

## Fix made: 017 — second terrain sketch was in the wrong day

The hi-res T3 p. 86 shows both little plans side by side in the **24 Feb 1874** entry: «…le terrain aurait cette
forme, [plan 1] et avec lui celle-là, [plan 2] Je vois Biasini.» The docx anchored image 5 after ¶1111, so it had
been listed in `017/1874-02-25.md` at 017.0043 («Notre position à Nice est misérable…»), unrelated text. Moved the
`drawings:` item to `017/1874-02-24.md` after img04 (paragraph 017.0032, caption «Second croquis du terrain : avec
le lot», source «Mon Journal, t. 3, p. 86 (fac-similé) — tome03.docx image 5»). `just verify-carnet _original 017`
PASS, `just splicescan _original 017` clean.

**Source-text gap for the owner (not edited):** `_original` 017.0031/0033 lacks the printed words «et avec lui
celle-là,» between the two plans (017.0031 ends «…aurait cette forme, prom. des Anglais», 017.0033 is «prom. des
Anglais. Je vois Biasini.»). The «prom. des Anglais» labels are the printed captions over each plan.

## Caption suggestion (not edited)

- 015/tome03-img01 «une tête, le haut couvert de hachures»: the text says «un homme dont je ne puis voir la figure,
  car une bouteille assez grande la lui couvrait comme ça:» — the hatched shape is **a bottle over the man's
  face** (neck pointing left). Suggest «Croquis de Marie : un homme dont une grande bouteille cache le visage».

## Task 2 — drawings not yet listed (tomes 3–5)

Method: every page from `just scan-figures 3/4/5` (ink outside the OCR text, ABBYY picture regions; 27 + 192 + 381
regions) cut from the hi-res page into contact sheets; all unused docx images (tome03 14, tome04 25, tome05 2);
the six `[Note de l'éd. : ici un dessin de Marie dans le journal.]` paragraphs without a listed drawing.

- All tome03–05 docx images not listed are scan junk (page-holder stick, fingers, book edge, library stamp),
  except tome04 image 4 (below) and tome05 image 4 (a blank page edge).
- The six editorial «ici un dessin» notes (017.0281, 018.0036, 019.0150, 025.0270, 027.0011, 028.0286): the printed
  pages (T3 p. 111, 138, 183; T4 p. 211, 219, 283) carry **no** reproduction — the edition only notes the drawing.
  Nothing to cut.
- **Uncertain candidate — T4 PDF p. 51 (folder 0053), carnet 021, 1874-07-23, beside 021.0558** («Je marche avec
  Gambart et Body malgré une petite pluie…»): an ornate engraved-style monogram (interlaced capitals under a
  coronet, ~2 cm), set in the right margin of the paragraph like the other reproductions. It looks like a printed /
  embossed monogram pasted in (letterhead, card) rather than a pen drawing by Marie — not added. If the owner wants
  it, it would be a `kind: clipping`-style item rather than a drawing. (021 is otherwise not mine to judge; listed
  for whoever works there.)
- No candidates on 022/032/034/040/067 pages beyond those already listed.

## Maps built

Added/confirmed in `content/_raw/scans/hires/_tools/final_T*.json` (PDF page → folder): T6 99→0099, 100→0100;
T7 39→0039, 178→0177, 180→0179, 253→0258, 304→0312 (new file); T9 284→0275; T10 44→0044, 45→0045, 46→0046,
109→0109, 110→0110, 263→0267; T13 51→0051, 353→0353 (new file); T15 23→0023, 70→0070, 162→0162; T16 11→0011
(new file). Found with `drawings_bwmap.py` (match on the 40 KB `bwPage.frdat` G4 images, all copied for T6/7/9/10/13/
15/16 — far cheaper than the gray components) and confirmed by template-matching the old crop on the hi-res gray
page (scores 0.83–0.99; the low ones are pages where the old crop had white-masked areas, all checked by eye).
Lessons: folders without `bwPage.frdat` are not picture pages here (they are ordinary 300 dpi pages); the bw
correlation is weak (margins < 0.01) on dense text pages — T6 p. 100, T9 p. 284 and T15 p. 70 needed a visual check
(T9: printed 280 = folder 0275, nine folders below the PDF page).

Scripts (in `_tools/`): `drawings_locate.py` (multi-scale, 4-rotation template match of an old crop on candidate
pages), `drawings_cut.py` (crop/tighten/mask/levels/WebP + comparison sheet), `drawings_bwmap.py`,
`drawings_svg.py` (vtracer + cairosvg render + IoU check). Run with `uv run --with opencv-python-headless --with
pillow --with numpy` (+ `pymupdf`, `vtracer`, `cairosvg` as needed).

## SVG (task 3)

Kept (faithful at reading size, no lost strokes, no blobby fill, < 200 KB; IoU vs the thresholded WebP 0.86–0.93):
015/tome03-img01, 019/tome03-img09, 023/tome04-img09, 053/tome07-p0038-1, 055/tome07-p0180-1, 057/tome07-p0253-1,
059/tome07-p0304-1, 068/tome09-p0280-1, 085/tome13-p0050-1, 089/tome13-p0352-1, 095/tome15-p0022-1,
096/tome15-p0069-1, 098/tome15-p0161-1, 101/tome16-p0011-1.

Rejected: dense hatching / shaded blobs (018, 024-img17/18/26, 027, 028, 030, 035-*, 055-p0178), drawings over
show-through (020, 070-p0108/0109, 072, 047), tiny pixel-stepped sketches (017-img04/05), and all printed
programmes/clippings (069-*, 070-p0079/0080/0116/0117/0139, 071-*) — those are not pen drawings and trace to
300–1500 KB.

Strokes in the SVGs are a little heavier than the hairlines of the scan (binary threshold 160); faint dashed
lines stay dashed as in the print.
