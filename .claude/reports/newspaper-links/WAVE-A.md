# Newspaper links, wave A — report (2026-10-24, RSR)

**Status: STOPPED at a Cloudflare challenge.** 2 of 13 groups done (both from the 7 Nov 1876 Figaro issue). The next scraper call (date URL `cb34355551z/date18761205`, for the Gazette de la Chambre) returned the page titled «Okamžik…» (Cloudflare "Just a moment"). I did not click or retry; no further scraper call was made. Nothing else in this wave was touched.

Scraper log: about 17 calls in ~70 minutes, each preceded by `sleep 90` or longer. Operational findings for the next run:
- The full page at `/full/1600,/` worked at once (cached by Gallica). Then four region/size requests in a row returned a *broken image* (Chrome tab left on `about:blank`, error «blocked URL: scheme 'about'», or a 10-50 KB black PNG), even after 5-10 min pauses. After a ~15 min gap, region requests worked again with viewport 1200x1200 / 1200x1600. Probable soft throttling of uncached IIIF derivatives; treat a broken image as a warning sign before a challenge.
- Efficient method that worked: ONE 1600-px full page to read the layout, then region tiles of width 800-1100 with viewport 1200x1600, tall tiles covering 2-3 columns (2 tiles cover an article). A trimmed tile is grayscale-converted before WebP (newsprint), q58-80.
- Helper scripts (scratchpad): `wa/shotwa.sh`, `wa/issue.sh`, `wa/trim.py`, `wa/webp.py`.

## Done

### 067.1603–1611 (Ignotus, «Le cardinal Antonelli») — DONE
- Issue ark: `bpt6k276148f` (Le Figaro, no. 312, Tuesday 7 Nov 1876), page f1, columns 1–3 (heading in col. 1, continued to the top of col. 2, ends with «Ignotus.» at the end of col. 3).
- Images (`src/frontend/public/images/marie/clippings/067/`): `figaro-1876-11-07-p1-antonelli-ignotus-1.webp` (1100x1511, 522 KB; sommaire, article start, col. 2–3 down to the death notice) and `figaro-1876-11-07-p1-antonelli-ignotus-2.webp` (850x1576, 357 KB; lower halves of cols. 1–2). Both attached to 067.1603 (the tall tiles are over the 300 KB target; the article is long).
- Transcription: compared with the print, paragraph by paragraph: **no differences**. The newspaper's own forms («dores et déjà», «il ne l'ont jamais surpris», «de quelque noms») are in the print.
- `source=` of 067.1603–1611 → «Le Figaro, 7 novembre 1876, Le cardinal Antonelli par Ignotus».
- Footnote `[^067.1603.1]` (on the heading line), RSR NOTE 2026-10-24T14:42:30.
- `drawings:` 2 items (`kind: clipping`, `source_url` = page link, paragraph 067.1603).

### 067.1612–1618 (death notice) — DONE
- Same issue and page, col. 3 under «Ignotus.», above «Echos de Paris».
- Image `figaro-1876-11-07-p1-antonelli-deces.webp` (672x1000, 190 KB), paragraph 067.1612.
- Transcription: **no differences** (1612–1618).
- `source=` of 067.1612–1618 → «Le Figaro, 7 novembre 1876, nouvelle de la mort du cardinal Antonelli».
- Footnote `[^067.1612.1]` (with one reader sentence on the date of the death), RSR NOTE 2026-10-24T14:43:00.

Gates (`_original` 067): `just splicescan _original 067` prints nothing; `just verify-carnet _original 067` PASS.

## Not done (blocked; nothing opened for them)

| group | what to do |
|---|---|
| 067.1569–1601 Gazette de la Chambre, séance du 4 déc. | issue 1876-12-05 (date URL `cb34355551z/date18761205` was the call that hit the challenge); find the page (p. 1–2, Albert Millaud). The 7 Nov page 1 shows the same column «Gazette de la Chambre» at col. 4–5 on p. 1, so on 5 Dec expect p. 1 too |
| 062.0754 Ignotus Antonelli, June 1876 | Figaro 26/27 Jun 1876, p. 1 |
| 078.0351 «huis clos» (Cassagnac) | Figaro? early March 1878; read p. 1–2 |
| 079.0120 | Le Pays, late March 1878 (evening paper, +1 day) |
| 079.0277 | Le Pays 1878-04-11, `bpt6k4670061v`, p. 1 |
| 080.0422 | Figaro 2–4 Jun 1878, Chamber echoes |
| 081.0093 | Figaro 1878-06-28 |
| 081.0315 | Figaro 4/5 Jul 1878 (Mercedes service at the Madeleine) |
| 068.0842 / 068.0895 (Le Sport) | the title ark cb328718467 still unverified |

Nothing was fetched or written for these, so their `source=` strings, footnotes and `drawings:` are unchanged.

## Translation impact (carnet 067, file `1876-12-11.md`)

- **New footnotes to localize** (cz, uk, en identical to `_original`, fr): `067.1603.1` and `067.1612.1`. Wording per PLAN §4; they carry one extra English sentence each (Ignotus article appeared the day after the cardinal's death, 6 Nov 1876; Antonelli died on the night of 5–6 Nov 1876).
- **Changed clipping `source=` text** (kind lines of 067.1603–1611 and 067.1612–1618, 16 paragraphs): `sync` follows kind markers by default.
- **New RSR notes**: two (`--notes-since 2026-10-24`), plus the 11:30 note of the pilot already there.
- **`drawings:` captions and alt to translate for cz/uk/en own lists** (fr inherits the original's): three new items (paragraphs 067.1603 ×2, 067.1612); captions «Le Figaro, 7 novembre 1876, p. 1 — « Le cardinal Antonelli » par Ignotus (début, colonnes 1 à 3)», «… (bas des colonnes 1 et 2)», «… la nouvelle de la mort du cardinal Antonelli», each with an alt. The tree lists that already hold the pilot item must get the three items appended.
- **Changed clipping text:** none.

## Files touched
- `/home/krr/bashkirtseff/content/_original/067/1876-12-11.md`
- three new WebP files in `/home/krr/bashkirtseff/src/frontend/public/images/marie/clippings/067/`
- this report

# Part 2 — resumed after cool-down (2026-10-24/25): BLOCKED, no group done

Per the coordinator's rules: 60-minute cool-down, then a probe, with another 60 minutes after each failure and a stop after 3 failed probes.

| probe | call | result |
|---|---|---|
| 1 | date URL `cb34355551z/date18760626` (Figaro, for 062.0754) | challenge page «Okamžik…» |
| 2 | same, after 60 min | challenge page |
| 3 | same, after another 60 min | challenge page |

Stopped after the third failed probe. I did not click or bypass anything and made no other scraper calls (IIIF or otherwise).

**Groups done in Part 2: none.** All 11 remaining groups are untouched: 062.0754, 078.0351, 079.0120, 079.0277, 080.0422, 081.0093, 081.0315, 067.1569–1601, and Le Sport 068.0842/0895 (its title ark is still unchecked). Only 067.1603–1618 from Part 1 is done.

Gates: no carnet touched in Part 2, so no gate was run.

Notes for the next attempt:
- The block has now lasted more than 3 hours on `scrape_url` date pages. A longer cool-down (a day), or a different egress for the scraper, is probably needed.
- The 062.0754 clipping is a June 1876 Ignotus portrait of Antonelli, the «ancien portrait» that the Nov 1876 article quotes. Date guess: Figaro 26 Jun 1876 (Monday), with 25 and 27 Jun as neighbours. This guess is unverified, so no link was written.
- The date URL is only needed to find the issue ark. The page images of known arks, e.g. Le Pays 1878-04-11 `bpt6k4670061v`, can be requested directly, so 079.0277 is the cheapest first group once calls pass.

## Translation impact (Part 2)
None: no carnet changed in Part 2.

# Part 3 — resumed 2026-10-25 (about 18 h after the block): BLOCKED, no group done

Probe as instructed: Le Pays 1878-04-11, ark `bpt6k4670061v`, f1, IIIF page image directly (no date URL), `/full/1600,/`.

| probe | time | result |
|---|---|---|
| 1 | 09:19 | page screenshot is a dark frame with a broken-image icon (16.8 KB), no challenge page |
| 2 | 09:38 (after 17 min) | same broken image (16.8 KB) |
| 3 | ~10:45 (after 60 min) | job error `blocked URL: scheme 'about' not allowed`: Chrome tab left on `about:blank`, i.e. the image request failed again |

No challenge page appeared in Part 3 (unlike Part 2, where every date-URL probe returned «Okamžik…»), but the IIIF image is not delivered, which is the same soft failure seen on 24 Oct before the first region tile worked. I stopped after 3 failed probes, as agreed. Nothing was bypassed; 3 scraper calls in total.

Possible causes, not distinguishable from here: Gallica or Cloudflare still throttling uncached IIIF derivatives for this egress; or this ark/folio not serving IIIF (the ark was only verified through its page title on 24 Oct, never through an image).

**Groups done in Part 3: none.** Remaining groups unchanged: 062.0754, 078.0351, 079.0120, 079.0277, 080.0422, 081.0093, 081.0315, 067.1569–1601, Le Sport 068.0842/0895. Only 067.1603–1618 (Part 1) is done.

Gates: no carnet touched in Part 3, no gate run.

Suggestion for the lead: a human (or a different egress) should first check in a browser that `https://gallica.bnf.fr/iiif/ark:/12148/bpt6k4670061v/f1/full/1600,/0/native.jpg` and the Figaro date pages open; if they do, the remaining groups can be done from a normal browser session with the crop method in Part 1.

## Translation impact (Part 3)
None: no carnet changed in Part 3.

# Part 4 — resumed 2026-10-26 on `"method":"chrome"`: 2 groups done, then a CHALLENGE (stopped)

Method as instructed by the coordinator: `f/scraper/screenshot` and `scrape_url` with `"method":"chrome"`, one call at a time, 120 s before each, 15 min pause after 8 calls. IIIF pages and region tiles worked (about 10 calls); one `about:blank` error on a full-page request cleared on the very next try. The calls up to the second pause: 1 full page, 3 tiles for p. 1 (Pays 1878-04-11), 1 full page + 1 tile for p. 2, 1 date page (Pays 27 Mar), 1 full page, 1 tile. The first call after the 15-minute pause was the Figaro date page `cb34355551z/date18780302` (for 078.0351) and returned the Cloudflare page «Okamžik…». Stopped there, nothing retried or bypassed. (The Le Pays date URL had worked, the Figaro one now does not: the Figaro title may be flagged separately.)

## Done in Part 4

### 079.0277–0299 (Cassagnac article on the Gent election, in `content/_original/079/1878-04-10.md`) — DONE
- Issue: Le Pays, Thursday 11 April 1878, ark `bpt6k4670061v`, p. 1 col. 6 (from «Je n'étais pas à Paris hier») continued at the top of p. 2 col. 1 to the signature «P. de C.».
- Images (`src/frontend/public/images/marie/clippings/079/`): `pays-1878-04-11-p1-cassagnac-1.webp` (760x1151, 107 KB), `…-p1-cassagnac-2.webp` (760x935, 96 KB), `pays-1878-04-11-p2-cassagnac-3.webp` (640x1068, 89 KB). All three on paragraph 079.0277. The signature and handwritten stamp below the article on p. 1 are cut off.
- Footnote `[^079.0277.1]` (issue and pp. 1–2 link), RSR NOTE 2026-10-26T09:12:00, `source=` of all 23 clipping paragraphs → «Le Pays, 11 avril 1878, article de Paul de Cassagnac», `drawings:` 3 items.
- **Finding:** this block is not a clipping pasted by Marie. It is the printed edition's footnote 5 (Mon Journal t.11 p.196), and our text follows the edition (verified against `tome11.docx`). Compared with the newspaper the edition has transcription or typesetting differences: 079.0277 «moi-même» missing; 079.0278 «Bilioni» for Biliotti, «2.000»; 079.0289 «impudence» for «imprudence»; 079.0290 the words «la persistance des injures dont son directeur a refusé réparation par les armes expose» are missing (the sentence is incomplete); 079.0292 «On a insisté, le Pays a insisté.» replaced by «On a insisté !»; 079.0295 «!» for «?»; 079.0298 punctuation; 079.0299 «défence» and the signature «P.de G» (print: «défense», «P. de C.»). **Text not changed** (the edition is the reference; these are the edition's, not Marie's, but the owner should decide whether to correct them); all listed in the RSR note.
- Print note: the right edge of the scan trims a few words («M. Gen[t]», «son e[ncontre]») in 079.0285; the transcription has them complete.

### 079.0120–0122 («Prospérité républicaine», in `content/_original/079/1878-03-27.md`) — DONE
- Issue: Le Pays, Wednesday 27 March 1878 (Paris bulletin headed 26 March; evening paper dated next day), ark `bpt6k46700465`, p. 1 col. 6, unsigned column «Prospérité républicaine», found by reading the page image.
- Image: `pays-1878-03-27-p1-prosperite-republicaine.webp` (672x1224, 117 KB), on 079.0120.
- Footnote `[^079.0120.1]`, RSR NOTE 2026-10-26T09:24:00, `source=` of 079.0120–0122 → «Le Pays, 27 mars 1878 (lignes non signées, attribuées par Marie à Cassagnac)», `drawings:` 1 item.
- Same finding: a quoted block from the edition (not a pasted clipping). Differences vs the print, text NOT changed: 079.0120 «elle [est] intraitable»; 079.0121 «(?), qui»; 079.0122 «espagnols» (edition «espagnoles») and «…le marasme, les grèves ont reparu.» (edition: «marasme. Les grèves…»).

Gates: `just splicescan _original 079` prints nothing; `just verify-carnet _original 079` PASS. Carnet 079 is finished for the Le Pays groups (079.0120, 079.0277), nothing else pending in it. Not touched: 062, 078, 080, 081, 067.1569–1601, 068.

## Not done (still pending)
062.0754 (Ignotus portrait, Figaro ~26 Jun 1876), 078.0351 (Figaro; text suggests 2 or 3 Mar 1878, letter to Périvier), 080.0422 (Figaro ~5 Jun 1878: session of 4 June, date to confirm), 081.0093 (Figaro 28 Jun 1878), 081.0315 (Figaro 5 Jul 1878; the service was «hier», 4 July), 067.1569–1601 (Figaro 5 Dec 1876), 068.0842/0895 (Le Sport). All are Le Figaro (title ark `cb34355551z`) except Le Sport. Date pages of that title challenge, so all remaining groups wait on the Figaro date pages; the Figaro issue ark for 7 Nov 1876 (`bpt6k276148f`) and the date form that worked for it earlier suggest trying again after a longer pause, or taking the issue arks from a browser.

## Translation impact (Part 4)

Carnet **079** (finished for these two groups; entries `1878-03-27`, `1878-04-10`):
- **New footnotes to localize** (cz, uk, en identical to `_original`, fr): `079.0120.1` and `079.0277.1`, per PLAN §4, wording as in `_original`.
- **Changed clipping `source=`** strings: 3 kind lines in 1878-03-27 (079.0120–0122) and 23 in 1878-04-10 (079.0277–0299). `sync` follows kind markers.
- **New RSR notes**: 079.0120 (2026-10-26T09:24:00) and 079.0277 (2026-10-26T09:12:00); `--notes-since 2026-10-26`.
- **`drawings:` captions and alt to translate** (cz/uk/en own lists; fr inherits): 1878-03-27: 1 item (079.0120); 1878-04-10: 3 items (079.0277). Captions in French: «Le Pays, 27 mars 1878, p. 1 — « Prospérité républicaine »»; «Le Pays, 11 avril 1878, p. 1 — article de Paul de Cassagnac (début)» / «(suite)» / «p. 2 — fin de l'article de Paul de Cassagnac, signé P. de C.», each with an alt.
- **Changed clipping text:** at first none; owner decision 2026-10-26 («1 yes»): the edition's copying errors were corrected to Le Pays in 15 paragraphs (079.0120–0122, 0277–0299) with a footnote each, carried into cz/uk/en/fr (0290 clause newly translated; RED should check; en CON note «Bilioni kept» is superseded).

# Part 5 — 2026-10-26, owner's Figaro arks, IIIF only (`method:"chrome"`): 5 groups done, 081.0315 and Le Sport open

No challenge page in Part 5 (about 12 scraper calls, ≥120 s apart, with pauses). Region tiles failed (broken 16×16 images) for the entire first half of the session, so, as the lead suggested, every clipping was cut LOCALLY from a 1600-px `/full/1600,/` page image (grayscale WebP, two-panel mosaics where the article spans columns). The 1600-px page is readable at column width but sharper than that is not possible; images are about 280–520 KB for the long ones. If sharper tiles are wanted later, the exact regions are in the report text below.

Owner rule 2026-10-26 applied: where `_original` holds the printed edition's quotation of a newspaper, its copying errors were corrected to the newspaper (one RSR «CORRECTED» note + one footnote per paragraph with the edition's reading); where the text is Marie's own copy, it is kept and the variants only noted. Both 079 groups (done in Part 4) were corrected by the lead before this run, as were their footnotes.

## Done

| group | issue (ark) | page | image(s) in `src/frontend/public/images/marie/clippings/…` | transcription | footnote | status |
|---|---|---|---|---|---|---|
| 062.0754–0766 «Le cardinal Antonelli», Ignotus | Le Figaro no. 178, Mon 26 Jun 1876 (`bpt6k2760102`) | p. 1, cols 1–3 | `062/figaro-1876-06-26-p1-antonelli-ignotus-1/-2/-3.webp` (314/277/159 KB) | read whole article; 1 edition error corrected: 062.0758 «Quant la République» → «Quand» | `062.0754.1` (issue link), `062.0758.1` (edition reading) | DONE |
| 067.1569–1601 Gazette de la Chambre, séance du 4 déc. | Le Figaro no. 340, Tue 5 Dec 1876 (`bpt6k2761773`) | p. 1, cols 5–6 | `067/figaro-1876-12-05-p1-gazette-chambre-1.webp` (183 KB), `…-2.webp` (271 KB) (two-panel mosaics) | no differences (also «Guyot-Montparoux/-Montpayroux» is the newspaper's) | `067.1569.1` | DONE |
| 078.0351–0377 «Pourquoi M. de Cassagnac avait demandé le huis-clos» | Le Figaro no. 62, Sun 3 Mar 1878 (`bpt6k276649c`) | p. 1, «Figaro Pic-nic», foot of col. 3 to col. 4 | `078/figaro-1878-03-03-p1-huis-clos-1.webp` (203 KB), `…-2.webp` (138 KB) | 15 paragraphs corrected to the print (see below) | `078.0351.2` link + one correction footnote in each corrected paragraph | DONE (the 2 Mar issue `bpt6k2766480` was not needed) |
| 080.0422–0424 note on Cassagnac's election | Le Figaro no. 156, Wed 5 Jun 1878 (`bpt6k276749p`) | p. 2, col. 2, «Gazette de la Chambre» of 4 June (Albert Millaud) | `080/figaro-1878-06-05-p2-seance-cassagnac.webp` (90 KB) | same words; print «la chambre» lower case and ends «à mort.» (Marie's copy: kept, noted) | `080.0422.1` | DONE |
| 081.0093–0094 wedding of Cassagnac | Le Figaro no. 179, Fri 28 Jun 1878 (`bpt6k2767756`) | p. 1, foot of col. 3 and top of col. 4 | `081/figaro-1878-06-28-p1-mariage-cassagnac.webp` (138 KB) | Marie's own copy: kept; variants listed in the RSR note («ave», «Monsieur»/«M.», «officier ,», «dans le villes», …) | `081.0093.1` | DONE |

`source=` exact dates written for all of these; `drawings:` items added (kind clipping, source «gallica.bnf.fr / BnF», source_url = the page link, paragraph = first pid of the group). 078.0351: the earlier RSR/LAN notes of 2026-10-21 said the clipping's own spelling wavers («Billioti/Biliotti», «Talendier», «lieutenant-général», «gémissement»); the new RSR note says this was the edition's copying, not the newspaper, and the old notes are superseded.

078 corrections (all in `1878-03-03.md`, each with RSR «CORRECTED» note and footnote `078.0xxx.1` = edition's reading): 0351 «huis clos»→«huis-clos»; 0354 «A props»→«A propos», «M. Billioti»→«M. de Billiotti», comma after «tribune», comma after «153»; 0360 commas, «Épousa, en Provence»; 0361 «maitresse»→«maîtresse», «bientôt,», «tendresses»→«tendresse» (the print's own «Poussés pas» is kept); 0363 «lieutenant-général»→«lieutenant-colonel», comma; 0365 «se déposer»→«se disposer», commas; 0366 «les deux pistolets»→«ses», «s"avança», «été flagrant»→«était», comma; 0367 comma, «gémissement»→«gémissements»; 0369 «Talendier»→«Talandier»; 0370 «l'accusation, emporterait… peine ; mais»; 0371 «à dû»→«a dû»; 0372 «acquité»→«acquitté»; 0374 «les fait»→«les faits»; 0376 «dans l'arrondissement»→«dans un arrondissement»; 0377 «Du reste, quant». (Left alone as number/layout style: «46^e^» etc.)

Gates (`_original`): `just splicescan` prints nothing and `just verify-carnet` PASS for 062, 067, 078, 079, 080, 081.

## Not done

- **081.0315–0326 (Mercedes service at the Madeleine):** the owner's two arks were read at p. 1–2 of the 5 Jul 1878 issue (`bpt6k276782d`, no. 186); the article is not on pp. 1–2 (p. 3–4 not opened; the other ark `bpt6k2767811` was not opened). The clipping says «Hier à onze heures a été célébré…», and Marie's entry is Friday 5 July, in which she attended the service: the service was on 5 July and the report is in the issue of **Saturday 6 July 1878**. Needed: the ark of the 6 July Figaro (one more owner lookup), then the same method (pp. 1–3 first).
- **068.0842 / 068.0895 (Le Sport):** not started; the Le Sport title ark is still unverified and a date URL would be needed, which triggered the Cloudflare challenge before. Skipped on purpose.

## Translation impact (Part 5)

For every carnet: kind-line `source=` changes follow `sync`; new RSR notes via `--notes-since 2026-10-26`; footnotes are listed per paragraph; `drawings:` captions and alts are in French in `_original` (cz/uk/en own lists need localized copies, fr inherits).

**062** (`1876-06-27.md`)
- Visible text changed: 062.0758 «Quant la République française» → «Quand la République française».
- `source=` of 062.0754–0766 (13 paragraphs) → «Le Figaro, 26 juin 1876, Le cardinal Antonelli par Ignotus».
- New footnotes: `062.0754.1` (issue link), `062.0758.1` (edition's reading «Quant …»; to be localized in each tree as a «corrected from the newspaper» note, carrying the edition's French wording).
- New RSR notes: 062.0754 (12:24) and 062.0758 (12:25).
- `drawings:` 3 items (captions: «Le Figaro, 26 juin 1876, p. 1 — « Le cardinal Antonelli » par Ignotus (début, colonnes 1 à 3)» / «(suite et fin, signature Ignotus)» / «(bas des colonnes 1 et 2)», each with an alt).

**067** (`1876-12-11.md`)
- No visible text change.
- `source=` of 067.1569–1601 (33 paragraphs) → «Le Figaro, 5 décembre 1876, Gazette de la Chambre par Albert Millaud, séance du 4 décembre 1876».
- New footnote: `067.1569.1`; new RSR note on 067.1569.
- `drawings:` 2 items (paragraph 067.1569): «Le Figaro, 5 décembre 1876, p. 1 — « Gazette de la Chambre » par Albert Millaud (début, colonne 5)» and «(suite et fin, colonne 6)». The tree lists that carry the 067.1602/1603/1612 items get these two appended.

**078** (`1878-03-03.md`)
- **Visible text changed in 15 paragraphs** (078.0351, 0354, 0360, 0361, 0363, 0365, 0366, 0367, 0369, 0370, 0371, 0372, 0374, 0376, 0377): the corrections listed above. Each gets a localized footnote of the form «Corrected from *Le Figaro* …; the edition reads …» (`078.0351.1`, `0354.1`, `0360.1`, `0361.1`, `0363.1`, `0365.1`, `0366.1`, `0367.1`, `0369.1`, `0370.1`, `0371.1`, `0372.1`, `0374.1`, `0376.1`, `0377.1`) and a new RSR «CORRECTED» note. The translated text changes only where the corrected word matters: «lieutenant-général» → «lieutenant-colonel» (0363), «Talendier» → «Talandier» (0369), «M. Billioti» → «M. de Billiotti» (0354), «dans l'arrondissement» → «dans un arrondissement» (0376), «les deux pistolets» → «ses deux pistolets» (0366), «se déposer» → «se disposer» (0365).
- Plus `078.0351.2` (issue link), and the `source=` of all 27 clipping paragraphs → «Le Figaro, 3 mars 1878, « Pourquoi M. de Cassagnac avait demandé le huis-clos » (Figaro Pic-nic)».
- `drawings:` 2 items (paragraph 078.0351): «Le Figaro, 3 mars 1878, p. 1 — « Figaro Pic-nic » : « Pourquoi M. de Cassagnac avait demandé le huis-clos » (lettre de Paul de Cassagnac)» and «… le compte rendu de 1836 (colonne 4)». The 2026-10-21 RSR and LAN notes on 078.0351 are now superseded by the NOTE of 2026-10-26T13:12 (the sync of notes does not delete the old ones; the new note says so).

**079** (finished in Part 4; the lead has already corrected its text) — nothing new in Part 5.

**080** (`1878-06-05.md`)
- No visible text change. `source=` of 080.0422–0424 → «Le Figaro, 5 juin 1878, « Gazette de la Chambre » (séance du 4 juin)».
- New footnote `080.0422.1`, new RSR note on 080.0422; `drawings:` 1 item: «Le Figaro, 5 juin 1878, p. 2 — « Gazette de la Chambre » (Albert Millaud), la demande de Paul de Cassagnac».

**081** (`1878-06-28.md`; 081.0315 in `1878-07-05.md` still pending)
- No visible text change. `source=` of 081.0093 and 081.0094 → «Le Figaro, 28 juin 1878, mariage de Paul de Cassagnac».
- New footnote `081.0093.1`, new RSR note on 081.0093; `drawings:` 1 item: «Le Figaro, 28 juin 1878, p. 1 — le mariage de Paul de Cassagnac et de Mlle Julia Acard».
- Carnet 081: the 28 June group is finished, the 5 July group is waiting for the 6 July issue.
