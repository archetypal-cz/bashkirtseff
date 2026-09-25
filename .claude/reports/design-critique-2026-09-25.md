# Design critique: bashkirtseff.org, 2026-09-25

**Scope:** visual design and polish only. UX flows, accessibility and HTTP/technical checks were done by the sibling audits and are not repeated here.
**Lens:** the 18th/19th-century book, seen through 21st-century eyes. The target is the book culture Marie read and wrote in, made to work on a screen. It should be neither pastiche nor a generic SaaS look.
**Method:**
- Viewed the live site at 1440×900 and 390×844, in light and dark themes, in cz, uk, original (fr) and en.
- Read the source: `src/frontend/src/styles/branding.css`, `global.css`, `BaseLayout.astro` and the components.
- Inspected the font binaries with fontTools: the shipped fontsource woff2 files and the upstream google/fonts TTFs.
- Screenshots are in `/tmp/claude-1000/-home-krr-bashkirtseff/b9feb4af-4102-4275-8101-365f3e93d604/scratchpad/design/` (`d-*` for desktop, `m-*` for mobile).

---

## Verdict in one paragraph

The design identity is already good. It has a parchment, ink and oxblood palette, a warm "candlelight" dark mode, Literata for the body text and Old Standard TT for display. It also has a thick-thin double rule under the masthead, a fleuron divider, a date set as a chapter head with a short oxblood rule, and an asterism at the end of each entry. All of it is tokenised in one file. The problems are execution gaps. The period features the CSS asks for are not in the fonts the site ships. Typographic quotes are wrong in cz (about 25,000 cases) and at the template level. Two components silently fall back to a font that is never loaded. Neutral greys leak into the warm dark theme. The site switches between a "book" register (entry pages) and a "dashboard card" register (year, carnet and glossary pages). Fix the gaps first. After that, the bolder direction is to make the list pages look like a book's table of contents instead of a set of tiles.

---

## 1. What works (keep)

- **Palette and tokens.** `branding.css` is a single source of truth with semantic tokens and documented contrast work. Ink #2C1810 on parchment #FFF8F0 is 16:1. Accent #9A4707 on parchment is 6.1:1. Oxblood #722F37 is used only for ornament and never for interactive elements, which is correct 19th-century rubrication logic.
- **Dark mode as "candlelight".** The brown-undertoned near-blacks (#171310 / #211B16) keep the period character instead of going to neutral grey. This is the right idea; it just isn't applied consistently (see §3).
- **Old Standard TT as the display face.** It is a revival of the late-19th-century Russian "Obyknovennaya Novaya" academic book face, the Modern/Didone-adjacent type Marie's Russian-language books were actually set in. It has full Cyrillic and cyrillic-ext. For a Ukrainian/Russian aristocrat writing in Paris it is the most authentic single choice available on Google Fonts. The uk date heading "Неділя 29 серпня 1875" in dark mode is the best-looking thing on the site.
- **Literata for the body.** It is a screen-first book face with an optical-size axis (7–72) and excellent Czech diacritics and Cyrillic. The measure is right: the reading column is about 584 px at 18 px, roughly 62–66 characters. Leading of 1.7, `hyphens:auto` and correct `lang` give good ragged-right hyphenation in cz, uk and fr.
- **Chapter-head dates** (`.entry-date-heading`). The centred display date, a 4 rem oxblood hairline and generous space below read like a 19th-century book opening.
- **The masthead's double rule** (`global.css` `header.site-header` box-shadow trick) and the woodcut "A" archetypal mark in the footer are quiet, correct period furniture.
- **The 404 page.** The large oxblood "404" in Old Standard, with language pills, is calm and on-brand.
- **Restraint.** There is no faux-parchment texture, no script fonts and no sepia photo filters. Keep it that way.

---

## 2. What jars (ranked by visibility)

### 2.1 Period typography is asked for in CSS but missing from the fonts (high impact)
fontTools inspection of the shipped fontsource woff2 files (Google Fonts API builds) found:

| Feature the CSS requests | Where | In shipped Literata? | In upstream Literata TTF? |
|---|---|---|---|
| `font-variant-numeric: oldstyle-nums` | `.prose-diary` (global.css:304), `.lit-label` (229), `.site-title-dates` (368) | **no** (GSUB has only ccmp, dnom, frac, liga, locl, numr, pnum, rvrn, tnum) | **yes** (`onum`) |
| `font-variant-caps: all-small-caps` | `.lit-label` ("AVAILABLE TRANSLATIONS", "CALENDAR") | **no**, so the browser synthesises shrunken capitals | **yes** (`smcp` + `c2sc`, covering Czech *and* Cyrillic: ř ů ж ї є ґ all map) |
| ⁂ asterism (`--ornament-asterism`) | `.entry-end::after` | **no**, so it falls back to whatever system font has U+2042 | **yes** |
| ❦ fleuron (`--ornament-fleuron`) | the entry toolbar divider | no (in no shipped face) | no (EB Garamond has ❦ ❧ ☙) |
| `opsz` optical sizing | all Literata text | not loaded (`index.css` is the wght-only build; `opsz.css` exists but isn't imported) | yes |

Consequences:
- Every date and year renders with lining figures: "1873-01-14", "14–15 years old", "3728 entries".
- The small-caps labels are faux: thin, mis-weighted strokes.
- The two signature ornaments come from random system fonts. On the screenshots the end-of-entry ⁂ is a tiny, light, off-style glyph, and on Windows, macOS and Android it will look different each time.

Other type-level findings:
- `--display-weight: 500` (branding.css:106), but Old Standard ships only 400 and 700, so 500 silently renders 400. That is harmless but misleading.

### 2.2 Quotation marks and apostrophes (high impact, cheap)
- **cz content:** 25,086 occurrences of `„…"` (a Czech low opening quote closed by an ASCII straight quote), against 3,466 correct `„…“`. It shows in the first entry: `„Un ballo in maschera"¹`.
- **en content:** about 15,800 straight `"` and almost no curly quotes. Straight apostrophes are everywhere ("Marie's", "it's", 'The Meeting'), including the /about and /marie pages.
- **fr content:** the ordinary space before `; : ! ?` can break a line before the punctuation, for example "intéressée !". French typographic convention uses U+202F (narrow no-break space) there and inside « ».
- **Template level:** the ASCII `"` is hardcoded around localised quotes:
  - `pages/home/[lang].astro:108`: `"{t('quotes.interestingBook')}"`, and again at :258
  - `components/layout/Footer.astro:70`: `"<span…>{t('quotes.existence')}</span>"`

  So the cs, uk and fr landing pages all show English-programmer quotes around their own languages' text.
- uk is already clean: 14,275 lines with «…» and only 98 straight quotes.

### 2.3 The French-original panel uses a font that isn't loaded (high impact: it's the site's signature feature)
- `components/reading/FlipParagraph.vue:153` and `:212` set `.original-text` and `.lang-symbol` in `font-family: 'Crimson Pro', Georgia, serif`.
- Crimson Pro is not imported anywhere. The loaded faces are only Literata, Old Standard TT and Inter (plus Cormorant for the riviera variant).
- So Marie's own words appear in Georgia italic on Windows and macOS, and in Noto Serif, DejaVu Serif or Liberation italic on Android and Linux. That is a different, heavier face than the translation beside it.
- `ParagraphToolbar.vue:431/507` has the same fallback, and `--brand-font-serif` lists Crimson Pro as the second fallback.
- In the flipped state the French date line ("Dimanche 29 aout 1875") also loses its chapter-head treatment. It becomes a left-aligned italic body line in a sepia box that is 16 px wider than the text column on each side (412→1029 vs 428→1012).

### 2.4 Neutral greys leak into the warm dark theme (medium)
- 48 hardcoded neutral-grey hexes (#1a1a1a, #333, #a3a3a3, #262626, #404040) sit in `[data-theme="dark"]` rules across 19 Vue components.
- The biggest offenders:

  | Component | Hardcoded greys |
  |---|---|
  | GlossaryCategoryBrowser.vue | 7 |
  | UnifiedMenu.vue | 6 |
  | CalendarWidget.vue | 4 |
  | GlossarySearch.vue | 4 |
  | ThisDayEntry.vue | 4 |
  | FlipParagraph.vue | 3 |
  | LocaleSwitcher.vue | 3 |

- Examples: FlipParagraph's dark `.original-text { color:#a3a3a3 }` and `.flip-btn { background:#1a1a1a }`. The candlelight ground is #171310, so each flip button sits on a visibly colder rectangle.
- The entry toolbar row (language pills + prev/next) also paints as a lighter `bg-secondary` slab in dark mode only (see `d-cz-entry-dark.png`, `d-uk-long-dark.png`). It floats in the page as a band with no counterpart in light mode.
- Dark body text is #E8E0D3 on #171310, which is 14.1:1. For long-form reading on OLED that is at the halation end; 11–12:1 is kinder.
- The dark ornament #B05A5E is 3.9:1. At the 0.5 opacity used for the asterism it drops to 1.9:1, so it is effectively invisible.

### 2.5 Two design languages: book vs dashboard (medium, the biggest aesthetic issue)
Entry pages read as a book. Everything above them reads as a 2020s SaaS dashboard:
- rounded bordered cards with drop shadows and gradient borders (`.summary-card::before` gradient hardcodes `rgba(180,83,9,…)`)
- a masonry grid of carnet tiles
- chevrons on every row
- a rounded-corner filled search field
- glossary category tiles with **four off-palette icon colours** (orange, blue, purple, green)
- the Tailwind **`bg-green-100 text-green-700`** "Kompletní!" badge (`pages/[lang]/index.astro:139`), the only green on the whole site

Other signs of the split:
- The /cz/1873/ year page puts one small card top-left and leaves roughly 60% of the width empty beside it (`d-cz-1873.png`).
- On the carnet page, "Download for offline" is set in Inter and wraps into three lines inside a serif card.
- Rounded image corners on /marie and the home portrait (`rounded-lg`) look like app thumbnails. A painting reproduction wants square corners and a hairline "mount".

### 2.6 The display face is used inconsistently (medium)
- Old Standard is used for the site title, the home hero, entry dates, year numbers and the 404 page.
- Page H1s are forced back to Literata with inline `style="font-family: var(--font-serif)"`: /about "A Generous Approach…", /marie, glossary entries ("Nice"), the glossary index, and the preface. The preface is the worst case: "PŘEDMLUVA" appears twice, first in heavy Literata caps and then in Old Standard caps.
  - `pages/[lang]/about.astro:35`
  - `pages/[lang]/glossary/[id].astro:129`
  - `pages/[lang]/000/index.astro:118`
- Result: there is no stable heading hierarchy from page to page.
- The UI register is also split. The nav, breadcrumbs and buttons are Literata. The calendar, "Download for offline", footnotes, "Notes" and the site-title dates are Inter. Inter shows up in sporadic islands rather than as a system.

### 2.7 Footnotes are set like a web app (medium)
- `.footnotes` (global.css:555) is Inter at 14 px, and its heading "Notes" is Inter medium.
- The markers are the internal paragraph IDs ("01.16.1.") in amber sans.
- In a 19th-century book, notes are the text face at a smaller size (Literata at opsz ≈ 10), with short numbers and a short rule above.

### 2.8 Paragraph marginalia clutter the column (medium, visual side only)
- Every paragraph has a "··· ✦" pair floating in the gap above it, and sometimes a flip glyph, at all times, on both desktop and mobile.
- Across a long entry this becomes a dotted texture running down the right edge of the column (`d-cz-entry.png`, `m-cz-entry.png`).
- I'm leaving the interaction design to the UX audit. From the visual side, desktop wants these at 0 opacity until the paragraph is hovered or focused (`:hover`/`:focus-within`), and the column wants its gutter back.

### 2.9 Masthead, meta and brand assets (lower)
- **favicon.svg:** an amber (#B45309) rounded square with "B" in *Georgia bold via `<text>`*. The font isn't guaranteed (Android has no Georgia), and the result is generic and the wrong hue (the brand amber is now #9A4707; ornament is oxblood).
- **theme-color:** a static `#9A4707`. The mobile browser chrome turns bright amber above a parchment page, and stays amber in dark mode.
- **OG image** (`public/images/og/og-image-composite.jpg`):
  - navy ground (#1a1a2e-ish) that the site never uses
  - Palatino-like type that is neither Literata nor Old Standard
  - a visible seam where the painting's black fade (x≈500–630) meets the navy panel

  It is the site's most-seen asset and the only off-brand one.
- **No system dark mode:** no `prefers-color-scheme` support anywhere, so an OS-dark visitor gets a bright parchment flash every first visit.
- **No print stylesheet:** no `@media print`. Printing an entry prints the header, the toolbar, the "··· ✦" marks and the footer.
- **Home, 390 px:** the hero portrait is floated beside the text, which leaves a column about 190 px wide with a hyphen on nearly every line (`m-home.png`). Stack the image above below 640 px.
- **Home hero:** the quote is `text-ink-light italic` with no marks worth the name. The French original under it is 14 px regular muted, and it is the *real* quote, so it deserves at least equal typographic dignity.

---

## 3. Proposals, ranked by impact ÷ effort

### Quick polish (each under half a day)

**Q1. Self-host full-feature Literata. This unlocks old-style figures, true small caps, ⁂ and optical sizing in one change.**
The fontsource/Google-API builds strip `onum`, `smcp`, `c2sc` and `dlig`. The upstream `google/fonts/ofl/literata/Literata[opsz,wght].ttf` (955 KB, OFL) has all of them, with Czech and Cyrillic small caps, and it contains U+2042. Subset it once with the features kept:
```bash
uv run --with fonttools --with brotli pyftsubset 'Literata[opsz,wght].ttf' \
  --unicodes='U+0000-024F,U+0300-036F,U+0400-052F,U+1E00-1EFF,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,U+2116' \
  --layout-features='*' --flavor=woff2 --output-file=public/fonts/literata-roman.woff2
# same for Literata-Italic[opsz,wght].ttf
```
- Replace `@fontsource-variable/literata` in `BaseLayout.astro:7-8` with an `@font-face` (`font-weight: 200 900; font-style: normal|italic;`) in `branding.css` §2.
- Add `font-optical-sizing: auto` to `body`.
- Split into latin and cyrillic files with `unicode-range` if the size matters. The existing oldstyle-nums and small-caps CSS then *just works*, with no other code changes.
- Afterwards, verify with the fontTools check used for this report (`GSUB` has `onum` and `smcp`).

**Q2. Correct quotes, at render time, per language.**
- Templates: replace the hardcoded ASCII marks with a locale map (`home/[lang].astro:108,258`, `Footer.astro:70`):
  ```ts
  const Q = { cs:['„','“'], uk:['«','»'], fr:['« ',' »'], en:['“','”'], es:['«','»'] }[locale];
  ```
- Content: add a typographic pass to the shared renderer (`src/shared`) for diary text:
  - cz: `„…"` → `„…“` (a safe regex anchored on the opening `„`, which fixes about 25k cases without touching sources)
  - en: smart quotes and apostrophes
  - fr: turn the space before `;:!?` and inside `« »` into U+202F
- Doing this at render time rather than in `content/` keeps the translation files untouched and the diff empty.

**Q3. Point the French-original panel and the ornaments at real fonts.**
- `FlipParagraph.vue:153,212` and `ParagraphToolbar.vue:431,507`: use `font-family: var(--font-serif)` (Literata italic), and drop 'Crimson Pro' from `--brand-font-serif`.
- Give the flipped French date the same `.entry-date-heading` treatment instead of body italic.
- Align the sepia card to the text column: `margin-inline: 0; padding-inline: 0` with a 2 px oxblood left rule, which reads as a pasted-in slip.
- For ❦ (and ❧ as an alternative), either subset those three glyphs from EB Garamond into a tiny `BashOrnaments` face (about 3 KB, OFL), or inline the fleuron as an SVG path. After Q1, ⁂ comes from Literata.

**Q4. Clean up the dark theme.**
Replace the 48 neutral greys with tokens. Add to branding.css §5 dark:
```css
--surface-raised: #211B16;   /* = bg-secondary: flip button, menus, calendar cells */
--surface-hover:  #2B231D;
--text-original:  #BFB3A2;   /* = text-secondary; was #a3a3a3 */
--text-primary:   #DCD2C2;   /* was #E8E0D3; 12.3:1 instead of 14.1:1, less halation */
--ornament:       #C06A6E;   /* was #B05A5E; 4.9:1 */
```
Then:
- Raise `--ornament-end-opacity` to 0.7 in dark only.
- Remove the dark-only `bg-secondary` slab behind the entry toolbar, or give it to light mode too.
- Replace the `rgba(180,83,9,…)` / `rgba(217,119,6,…)` hardcodes in `.summary-card::before` with `color-mix(in srgb, var(--accent) 15%, transparent)`.

**Q5. Unify the heading face.**
- Remove the inline `style="font-family: var(--font-serif)"` from page H1s (about.astro:35, glossary/[id].astro:129, 000/index.astro:118 and siblings).
- Let `h1` default to `var(--font-display)` at weight 400 via one base rule.
- Set `--display-weight: 400` (Old Standard has no 500).
- Delete the duplicate Literata "PŘEDMLUVA" on the preface.

**Q6. Brand chrome.**
- **theme-color:** use one tag per scheme.
  ```html
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5E6D3">
  <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#211B16">
  ```
- **Favicon:** redraw as an outlined path. Suggest an "MB" or "M" monogram in Old Standard, ink #2C1810 or oxblood #722F37 on #F5E6D3, with a 1 px double-rule frame. Convert the glyphs to paths so no font is needed.
- **Badge:** swap the green badge for the ornament colour, `bg-[color-mix(in_srgb,var(--ornament)_12%,transparent)] text-bordeaux`, or better, a small-caps "complet" with no pill.
- **Glossary icons:** move the four icon colours to a single `--text-muted` with an oxblood hover.
- **OG image:** re-render with the parchment ground, Old Standard title and oxblood rule, sized as a card (1200×630 plus a 1080² variant). Keep the portrait.

**Q7. Add a print stylesheet.** About 30 lines in `global.css`:
```css
@media print {
  header.site-header, footer.site-footer, nav, .paragraph-toolbar, .flip-btn,
  [data-print="hide"] { display:none !important; }
  body { background:#fff; color:#000; font-size:11pt; }
  .prose-diary { max-width:none; font-variant-numeric: oldstyle-nums; orphans:3; widows:3; }
  .entry-date-heading { break-after:avoid; }
  a[href^="http"]::after { content:" (" attr(href) ")"; font-size:.8em; }
  @page { margin: 22mm 20mm 25mm; }
}
```
A printed entry then looks like a page from the 1887 edition. That is a small thing that scholars and teachers will notice.

**Q8. Footnotes in the book register.** In `.footnotes` (global.css:555):
- use `font-family: var(--font-serif)`, `font-size: .85em`, `font-variation-settings: "opsz" 10` (after Q1)
- title "Notes" as `.lit-label` small caps
- a 4 rem hairline above instead of the full-width border
- display a sequential number (1, 2…) instead of "01.16.1." (keep the ID as the anchor)

### Bolder directions

**B1. "Table des matières" instead of cards.**
Year, carnet, glossary-letter and carnets-list pages become typeset contents pages instead of tile grids.
- Carnet page:
  - a centred title page: "CARNET" in letter-spaced small caps, then "001" large in Old Standard, then "janvier — février 1873" in italic, then a short double rule, with the calendar set below as a quiet two-month grid (no card)
  - the entries as a contents list: day and date on the left in Literata, a first-line incipit in italic, dot leaders, and the word count as an old-style figure on the right
- Year page: open with Marie's age and main location as a running head, then the carnets as a contents list grouped by season.
- Rules instead of boxes, leaders instead of chevrons.

Effect: this removes the dashboard register in one move, halves vertical scroll on mobile, and makes the site feel like a single edition rather than an app plus a book. CSS leaders:
```css
.toc-row { display:flex; align-items:baseline; gap:.5rem; }
.toc-row .leader { flex:1; border-bottom:1px dotted color-mix(in srgb, var(--text-primary) 35%, transparent); translate:0 -.3em; }
.toc-row .n { font-variant-numeric: oldstyle-nums tabular-nums; }
```

**B2. The atelier frontispiece.**
Marie was a Salon painter, and her work is the site's strongest visual asset, but today it appears only on /marie and the home page.
- Give each year page a frontispiece: one of her works, or a period photograph, chosen to fit that year:
  - 1873–76: Nice and the Riviera
  - 1877: the Académie Julian ("In the Studio")
  - 1880: the Salon debut
  - 1884: "The Meeting"
- Set it as a book plate: square corners, a hairline double "mount", a caption in small caps plus italic with the museum credit, and a tissue-guard fade in light mode (`mix-blend-mode: multiply` on parchment).
- Pair it with a drop cap on the first paragraph of each entry. Use Old Standard in oxblood with `initial-letter: 2` and a float fallback, only when the paragraph starts with a letter (so it skips „ « [).
  ```css
  .entry-first::first-letter { font-family:var(--font-display); color:var(--ornament); initial-letter:2; margin-inline-end:.08em; }
  @supports not (initial-letter: 2) { .entry-first::first-letter { float:left; font-size:3.1em; line-height:.8; padding:.08em .08em 0 0; } }
  ```
- Keep it to *one* drop cap per page and one image per year. The restraint is the period-correct part.

---

## Priority table

| # | Change | Impact | Effort | Where |
|---|---|---|---|---|
| Q1 | Full-feature Literata (onum, smcp, ⁂, opsz) | High | S | BaseLayout.astro:7-8, branding.css §2, public/fonts |
| Q2 | Locale-correct quotes and fr NNBSP (render-time) | High | S | home/[lang].astro:108,258; Footer.astro:70; src/shared renderer |
| Q3 | French panel on real font + chapter-head date | High | XS | FlipParagraph.vue:153,212; ParagraphToolbar.vue:431,507 |
| Q4 | Dark-theme tokens replace 48 neutral greys | Med | S | branding.css §5; 19 Vue components |
| Q5 | One heading face; display weight 400 | Med | XS | about.astro:35, glossary/[id].astro:129, 000/index.astro:118 |
| Q6 | theme-color, favicon, green badge, icon colours, OG image | Med | S | BaseLayout.astro:126, public/favicon.svg, [lang]/index.astro:139, GlossaryCategoryBrowser.vue |
| Q7 | Print stylesheet | Med | XS | global.css |
| Q8 | Footnotes in the text face | Med | XS | global.css:555-580 |
| B1 | Contents-page layout for year/carnet/glossary | High | M–L | [year]/index, [carnet]/index, glossary/*, masonry/summary-card CSS |
| B2 | Year frontispieces + drop cap | Med–High | M | [year]/index, global.css, public/images/marie/works |

## Font reference (all OFL, free, with Latin Extended and Cyrillic unless noted)

| Face | Role | Google Fonts | Cyrillic | Small caps / oldstyle figures upstream | Note |
|---|---|---|---|---|---|
| **Literata** (keep) | body, UI, notes | yes | yes + ext | **yes** (smcp, c2sc, onum, dlig; Cyrillic small caps included) | self-host the upstream TTF, since the API build strips the features |
| **Old Standard TT** (keep) | display | yes | yes + ext | no (case and dlig only) | 19th-c. Russian academic Modern; ideal for uk |
| EB Garamond | ornament source (❦ ❧ ☙), alternative italic | yes | yes + ext | yes for Latin; **no Cyrillic small caps** | take only the fleurons |
| Source Serif 4 | alternative body | yes | yes + ext | yes (smcp, onum, opsz) | cooler; only if Literata is ever dropped |
| Playfair Display / Prata | Didone display alternatives | yes | yes (Playfair: no cyr-ext) | no | higher contrast "Didot" feel; Prata is the more 1880s of the two |
| Bodoni Moda | — | yes | **no Cyrillic** | — | rule it out for uk |
| Inter (current) | UI | yes | yes | n/a | could be retired in favour of Literata small-opsz UI, saving about 100 KB |
