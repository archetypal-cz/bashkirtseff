# Newspaper links and clipping images — plan (2026-10-24)

Files: `inventory.tsv` (333 rows), `titles.md` (arks, libraries), this plan. Pilot: 067.1602 done in `_original`, cz, uk, en, fr (uncommitted). Nothing else in content was touched; no git writes; OPEN-ITEMS untouched (A-71 there is answered by the pilot and should be ticked by the lead).

## 1. Renderer: links in footnotes work, bare autolinks do not

- `src/frontend/src/lib/content.ts:1119-1130` `extractFootnotes` runs every definition through `processTextToHtml` (line ~990).
- `content.ts:1023-1038`: markdown `[text](url)` becomes `<a href=… target="_blank" rel="noopener" class="text-accent … underline">`. The URL pattern allows one level of parentheses. URLs ending in `.md` are treated as glossary links, so never end a Gallica URL in `.md` (they end `.item` or `dateYYYYMMDD`).
- `src/frontend/src/pages/[lang]/[carnet]/[entry].astro:332` renders the HTML with `set:html={fn.text}`; the popover (`src/frontend/src/scripts/footnote-popover.ts:106`) copies `fnItem.innerHTML`, so the link works in the popover too.
- Typography (`lib/typography.ts:76-79`) splits on tags and only touches text nodes, so `href` is safe; the visible link text is the only thing it can alter.
- **Bare `<https://…>` does NOT render**: there is no autolink rule and `<https:…>` is left as raw HTML, which the browser parses as an unknown element and shows nothing. Bare URLs without angle brackets are shown as plain text, not linked. Rule: always `[label](url)`.
- Not verified by a build; verified by reading the code (no existing diary footnote carries a link yet; glossary pages do). Also: `_` in a URL could meet the `_italic_` rule (`content.ts:1042`), Gallica URLs have none.
- `src/shared` only round-trips footnote text (`patterns.ts:32`, `paragraph-renderer.ts:88`); no change needed there.

## 2. Inventory (content/_original)

Classes: **C** pasted clipping groups (24 groups, 24 per-group rows; 191 clipping paragraphs in all; 4 further groups are printed programmes, class P); **S** diary text naming an issue whose date follows from the entry (90); **A** article known, date only approximate (55); **R** back-reference to an article already listed (19, mostly one Figaro «Courses de Nice» note of Jan 1877 cited ten times: 068.0962, 068.1641, 072.0474, 073.0484, 074.0398, 084.0425/0474, 091.0432, 093.0093, 096.0203, 100.0092); **G** generic mention (69); **N** not a newspaper (the character Figaro, letters to editors, La Vie parisienne the operetta…; 72).

Per title (C / S / A / R): Le Figaro 9/26/16/15; Galignani's Messenger 6/11/3/1; Le Pays 2/11/5/1; Le Gaulois 0/13/1/2; La Vie mondaine 1/2/6/0; L'Estafette 0/6/2/0; Le Voltaire 0/5/3/0; Le Sport 2/3/2/0; La Citoyenne 0/2/3/0; Gil Blas 0/3/0/0; Les Échos de Nice 0/2/1/0; La République française 0/2/0/0; Le Patriote niçois 0/0/2/0; La Justice 0/1/1/0; one each of Daily News, L'Événement, Revue des Deux Mondes (S), Le Temps, Journal amusant, L'Illustration universelle, Phare du Littoral (A); other/unnamed 4 C + 6 A. The regex is conservative: a second pass for «le journal», «l'article de X» etc. found ~15 more (added as unnamed rows); unnamed «journal de ce matin» cases (about 700 paragraphs mention journal/article) are not inventoried.

Highest-value targets (date explicit or near-certain): Revue des Deux Mondes 15 Oct 1883 (102.0001); Figaro 28 Dec 1878 (083.0524); Figaro 28 Jun 1878 (081.0093); Le Pays 11 Apr 1878 (079.0275, with a clipping); Figaro 10 Jun 1882; Figaro 15 Jan 1883; Gil Blas 3 Feb 1883; Le Sport 17 Jan 1883; Salon numbers of Figaro/Gaulois/Voltaire 30 Apr 1884; Gil Blas 15 Apr 1881 (has footnote [^1]); La Citoyenne March/May 1881 (Marie's own articles as Pauline Orell).
Pitfalls found: (1) evening papers (Pays, Estafette, Gaulois «de ce soir») carry the NEXT day's date; (2) the clipping `source=` strings give a month only for most items, so the issue must be found by reading the page; (3) several clippings are marked `[Manque]` in the text (087.0014, 086.0557, 088.0838, …): no clipping exists to image, but a link to the article is still valuable; (4) the Gallica `date` URL fails for a date with no issue.

## 3. Titles

See `titles.md`. Verified: Le Figaro, Le Temps, Le Pays (Gallica); Le Voltaire is on RetroNews (paid). Others: arks from Wikidata, unverified. Cloudflare began blocking this machine after ~12 rapid scraper calls (challenge page, not bypassed): pace the wave at one call per minute and stop at the first challenge. Not on Gallica (name only): Galignani's Messenger and the English papers (BNA/Gale, paid), Nice local papers (departmental archives/Nice libraries), Russian papers (RSL/PrLib), Neapolitan paper.

## 4. Proposed footnote format

One footnote per issue per paragraph, source-side in `_original` (English), localized in cz/uk/fr, en identical to `_original`. Label `[^CCC.NNNN.n]`. Marker at the end of the clipping's first line (or right after the newspaper's name in diary prose). Link text names the library; the link is a markdown link only.

| tree | text |
|---|---|
| _original / en | `*Le Figaro*, no. 312, Tuesday 7 November 1876, p. 1 — [read the issue on Gallica (BnF)](https://gallica.bnf.fr/ark:/12148/bpt6k276148f/f1.item).` plus an optional sentence |
| cz | `*Le Figaro*, č. 312, úterý 7. listopadu 1876, s. 1 — [číst číslo na Gallice (BnF)](…).` |
| uk | `*Le Figaro*, № 312, вівторок, 7 листопада 1876, с. 1 — [прочитати число на Gallica (BnF)](…).` |
| fr | `*Le Figaro*, n° 312, mardi 7 novembre 1876, p. 1 — [lire le numéro sur Gallica (BnF)](…).` |

Variants: no page known → drop «p. N» and link the date URL `https://gallica.bnf.fr/ark:/12148/cb34355551z/date18761107` (works without knowing the issue ark); evening papers → «L'Estafette du 22 juin 1879 (daté du lendemain)». Only link what has been SEEN: the page image (IIIF) must show the cited text; never link an A-class guess. RetroNews links get «(accès payant)» / «(paid access)». Clipping `source=` gets the exact date: `Le Figaro, 7 novembre 1876 (…)`, so every tree's kind line changes identically (sync follows kind markers by default).

Pilot decisions worth the owner's eye: the RSR note of 2026-10-23 («Henry [illisible]» kept) was trimmed to point to the new note; the page 1 sommaire gets its footnote on the «SOMMAIRE»/«OBSAH»/«ЗМІСТ» line; uk transliterates the name «Анрі Дейніс» in running text, the footnote keeps «Henry Deynisse».

## 5. Clipping images

Mechanism: frontmatter `drawings:` already fits (src, caption, alt, source, paragraph; `src/frontend/src/lib/drawings.ts:1-66`; shown after the named paragraph; translations show the original's list unless they carry their own, which is how captions get translated). Only `src` must start with `/`, so a new folder `public/images/marie/clippings/<carnet>/` works with no code change. Possible small frontend improvements (not done): a `kind: clipping` value (or `credit_url`) so the source line can link to the Gallica page and the default alt uses «Press clipping» instead of «Drawing» (`drawingLabel` / `t('diary.drawing')` in `[entry].astro:302-312`); the caption must say «Gallica» as the credit.
Credit: «gallica.bnf.fr / BnF» in `source:` on every image (Gallica's non-commercial reuse conditions require attribution; the project is a non-profit; commercial reuse of the images would need BnF permission — to confirm before any print/commercial edition).
Method (works, tested): `wmill script run f/scraper/screenshot` with `method: chrome`, URL `https://gallica.bnf.fr/iiif/ark:/12148/<bpt6k…>/f<N>/pct:X,Y,W,H/<width>,/0/native.jpg`, viewport sized to the region's aspect (1200×1200 is fine), then trim the black border with Pillow (`ImageChops.difference` bbox), save WebP q80 ≤1600 px (pilot: 1085×1013, 175 KB), download from `storage_url` with curl. First get the whole page with `/full/1600,/0/native.jpg` and a 1600×2300 viewport, locate the region by eye, then the region at full resolution. Region fractions are guesses until seen: expect 2 iterations per clipping.
Pilot image: `src/frontend/public/images/marie/clippings/067/figaro-1876-11-07-p1-sommaire.webp` (7 Nov 1876, p. 1, sommaire; reads «Le Sénat : Henry Deynisse»).

Per clipping group (issue → page → crop):

| first pid | clipping | issue | page / crop | Gallica? |
|---|---|---|---|---|
| 067.1602 | Figaro sommaire | 1876-11-07 bpt6k276148f | f1, top-left box | yes — DONE |
| 067.1603–1618 | Ignotus «Le cardinal Antonelli» + death notice | same issue | f1 col 1–2 (article), echo columns | yes; two crops, the long article may need 2–3 tiles or one tall crop |
| 067.1569–1601 | Gazette de la Chambre, séance du 4 déc. | 1876-12-05 (issue to find) | p. 1–2, col. of A. Millaud | yes |
| 062.0754 | Ignotus, Antonelli article | Figaro 26/27 Jun 1876 | p. 1 | yes |
| 078.0351 | «Pourquoi M. de Cassagnac…huis clos» | Figaro ~2–3 Mar 1878 (source says "Figaro ?") | find by reading p. 1–2 | yes if Figaro |
| 080.0422 | note on the session | Figaro 2–4 Jun 1878 | Chamber echoes | yes |
| 081.0093 | Figaro 28 Jun 1878 | 1878-06-28 | to find | yes |
| 081.0315 | Mercedes service at the Madeleine | Figaro 4/5 Jul 1878 | to find | yes |
| 079.0277 | Le Pays, Cassagnac | 1878-04-11 bpt6k4670061v | p. 1 | yes (verified issue) |
| 079.0120 | Le Pays unsigned lines | Le Pays late Mar 1878 | search | yes |
| 068.0842, 068.0895 | Le Sport, R. Milton | Le Sport late Jan 1877 | to find | maybe (check ark cb328718467) |
| 084.0158 | La Vie mondaine (Nice) | Feb 1879 | | probably not |
| 011.0044; 013.0263; 014.0047/0058/0104/0208 | Galignani's Messenger | Oct–Dec 1873 | | not on Gallica (to confirm): keep the facsimile |
| 069.0518, 070.0121/0610, 071.0226 | programmes | | | no |
| 070.0909, 083.0357, 084.0615, 067.1619 | unidentified | | | no, unless identified |

Where the manuscript facsimile exists and is legible, the Gallica crop goes next to it (the original's `drawings:` list can hold both); where the facsimile is blurry or cropped (the pilot), the Gallica crop is the better source for the transcription check too.

## 6. Wave plan

0. **Lead** (now): read this report; decide the footnote wording, the caption/credit convention and whether to add a `clipping` kind to `drawings.ts` (frontend-dev, small); tick A-71.
1. **Wave A — clippings with a free Gallica issue (≈13 groups, mostly Figaro/Pays)**. One researcher (Sonnet) per ~3 groups, strictly serial scraper use (≥60 s between calls; stop at a challenge, report). Per group: resolve the issue by the date URL, read the pages with IIIF screenshots, confirm the text equals the transcription (compare word by word against the transcription: a second transcription check, as the pilot did for the Deynisse byline), crop, WebP, `drawings:` entry, footnote in `_original`, exact `source=` date. Report issue ark, page, regions. A name or word that was `[illisible]` in the facsimile gets fixed the same way (pilot pattern).
2. **Sync** (lead or entry-restructurer): `just sync CCC L` (plain: kind marker + embedded French) for each language, then hand-add the localized footnote and caption (translators; mechanical, one sentence from the table above). Do NOT use `--footnotes` for the carnet as a whole: in the pilot it pulled 68 unrelated source notes into fr (I reverted by restoring HEAD copies from `git show`); if used, use it per entry file after `--dry-run`. `--notes-since DATE` alone is safe and carried the RSR note correctly. Gates: `just splicescan L CCC` empty, `just verify-carnet L CCC` PASS for all five trees, `just sync-verify CCC L` OK.
3. **Wave B — diary mentions, class S with high/med confidence (≈60 rows; Figaro, Pays, Gaulois, Gil Blas, Sport, Estafette, Voltaire, RDM)**. Same method but no crop: only the footnote with issue link (and page if the article is found). Verify each by reading the page; evening papers +1 day. Start with the high-confidence list in §2. Footnote goes source-side, then localized by the language agents.
4. **Wave C — class A/R**: one footnote per distinct article (the Figaro «Courses de Nice» note first: find the exact issue, link it once in 072.0474 and cross-reference from the others via a short «See 072.0474» note, or repeat the link). Needs reading pages around the guessed dates.
5. **Wave D — titles not on Gallica**: La Citoyenne (BnF/Gallica to be found by a human in a browser, 1881 issues carry Marie's articles), Nice papers (local archives), Galignani (BNA); only a glossary line per title («Where to read») rather than per-paragraph links unless a free digitised source is found. Add a «Where to read» section to the newspaper glossary entries (LE_FIGARO etc., currently stubs) with the Gallica title link; this also serves the diary mentions we do not footnote.
6. **Order of work**: Figaro first (biggest count, verified title), then Le Pays, Gaulois, Gil Blas, Estafette/Voltaire, Sport; ark verification for the unverified titles precedes each. Estimated effort: wave A ≈ 6–8 agent-hours with the throttled scraper; B and C each ≈ 2–3.

## 7. Pilot result (067.1602)

- `_original/067/1876-12-11.md`: `Henry [illisible]` → `Henry Deynisse`; `source="Le Figaro, 7 novembre 1876 (sommaire du numéro qui annonce la mort du cardinal Antonelli)"`; footnote `[^067.1602.1]` on the SOMMAIRE line (English, issue link `https://gallica.bnf.fr/ark:/12148/bpt6k276148f/f1.item`); one RSR NOTE (2026-10-24T11:30) with the owner's check; the 2026-10-23 RSR note trimmed to "resolved in the next note"; frontmatter `drawings:` with the image, caption «Le Figaro, 7 novembre 1876, p. 1 — sommaire», source «gallica.bnf.fr / BnF», paragraph 067.1602.
- cz, uk, en, fr: kind line, embedded French, visible name, localized footnote, RSR note (via `sync --notes-since 2026-10-24`); cz/uk/en carry their own localized `drawings:` caption and alt, fr inherits the original's.
- Gates: `just splicescan L 067` empty and `just verify-carnet L 067` PASS for `_original`, cz, uk, en, fr; `just sync-verify 067 L` OK (visible text unchanged apart from the name and marker). Not committed. The other clipping paragraphs of the same issue (067.1603 and 067.1612, sources «novembre 1876») still say only the month: update with wave A.
- Side effect to know: the first attempt used `sync --footnotes` and touched 25 fr files of carnet 067; all were restored to HEAD (byte-identical) by rewriting them from `git show HEAD:path`, so no change remains outside the five 1876-12-11 files plus the new WebP.
