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
