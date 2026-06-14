# Design Review & Proposals — bashkirtseff.org

*Review date: 2026-06-12. Method: full read of layouts, global CSS, and key pages in `src/frontend/`, **plus** live rendering — dev server run locally and screenshotted (homepage, `/cz/`, `/cz/1873/`, `/cz/001/`, `/cz/001/1873-01-11`, and the entry page in dark mode).*

Design brief: **keep it simple and readable, but make it less bland.** All proposals below are readability-first; nothing adds clutter or JS weight (everything is CSS/typography except where noted).

---

## 1. Survey: what the design is today

**Where the design lives:**

| Concern | File |
|---|---|
| Design tokens, themes, prose styles | `src/frontend/src/styles/global.css` (Tailwind v4 `@theme` — there is no `tailwind.config.mjs`) |
| Font loading | `src/frontend/src/layouts/BaseLayout.astro` (Google Fonts `<link>`, lines 81–87) |
| Page chrome | `src/frontend/src/components/layout/Header.astro`, `Footer.astro` |
| Year overview | `src/frontend/src/pages/[lang]/index.astro` |
| Year detail (carnet list) | `src/frontend/src/pages/[lang]/[year]/index.astro` |
| Carnet detail (entry list) | `src/frontend/src/pages/[lang]/[carnet]/index.astro` |
| Entry reader | `src/frontend/src/pages/[lang]/[carnet]/[entry].astro` + `components/reading/EntryContent.vue` |
| Homepage | `src/frontend/src/pages/home/[lang].astro` |

**Current tokens** (`global.css`):

- Palette: parchment `#FFF8F0`, sepia `#F5E6D3`, ink `#2C1810`, ink-light `#4A3728`, accent amber `#B45309` / `#D97706`, muted `#78716C`.
- Fonts: body `'Crimson Pro', Georgia, serif`; UI `'Inter', system-ui, sans-serif`. Loaded weights: Crimson Pro 400/600 + italic 400; Inter 400/500/600.
- Themes: light (parchment), sepia, dark (`#1a1a1a` / `#252525` neutral gray).
- Reading column: `max-w-2xl` (672px) at 18px base, `line-height: 1.8`.
- One decorative element exists: `.entry-divider` (gradient hairline) and `.summary-card` (gradient-border card).

**Character of the current design:** The foundation is genuinely good — warm parchment ground, brown ink text, a serif body, restrained chrome. It already avoids the "default Tailwind blue/gray SaaS" look. But it stops at the foundation. In the screenshots, every page is the *same* composition: rounded-`lg` cards with 1px `ink/10` borders in a grid, same radius, same padding, sans-serif labels, amber accent. The entry reader — the heart of the site — is a column of uniform 18px paragraphs with no heading, no date treatment, no opening or closing mark. Dark mode discards the entire warm identity and becomes a generic neutral-gray night theme. The result reads as "tasteful but anonymous": a competent app skin, not the home of a singular 19th-century literary voice.

---

## 2. Assessment: where exactly it is bland

1. **No display typography.** Crimson Pro is used at `font-normal` for everything from the site title to `h1`s to body text. There is no second register — no face that says "1870s print culture." Headings are just bigger body text (`text-3xl font-normal`).
2. **The entry page has no typographic event.** The date — the single most diary-defining element — appears only as raw `1873-01-11` in the breadcrumb and as a slightly-enlarged first paragraph (via a fragile hack: `.prose-diary > .paragraph-container:first-child > div { font-size: …*1.2; margin-left: -1rem; }`, `global.css:189–193`). No drop cap, no entry-ending mark, entries end on a plain `border-t`.
3. **Cyrillic readers never see the chosen serif.** Crimson Pro ships **no Cyrillic subset** (verified against the Google Fonts API: latin, latin-ext, vietnamese only). The entire Ukrainian edition — one of four target languages, and Marie's homeland — renders in fallback Georgia. This is both a blandness and a brand problem.
4. **One-accent palette.** Amber `#B45309` does everything: links, buttons, progress bars, hovers, footnote refs. With no secondary color there is no warmth gradient, no hierarchy between "interactive" and "ornamental."
5. **Dark mode loses the identity.** `#1a1a1a`/`#252525` neutral grays with cool `#e5e5e5` text (`global.css:51–58`). The parchment/ink metaphor — the strongest thing the design has — vanishes at night.
6. **Cards all look alike.** Year cards, carnet cards, entry rows, summary panels: identical `rounded-lg border border-ink/10 bg-parchment` treatment. A *notebook* (carnet) looks exactly like a *year* looks exactly like an *entry row*. Nothing evokes a physical carnet.
7. **Sans-serif section labels** (`KEY PEOPLE`, `PLACES`, uppercase Inter with letter-spacing) are the most "modern dashboard" element on otherwise literary pages.
8. **Minor polish gaps:** `.paragraph-highlight` uses `bg-amber-100` with no dark-mode override (light flash on dark theme); text selection color is browser default; fonts come from Google's CDN (privacy + FOUT) instead of being self-hosted.

---

## 3. Proposals

Conventions: hex values are concrete suggestions, ready to paste. Effort: **S** ≤ 1h, **M** = half-day, **L** = day+.

### P1 — Typography with character: add a display face, fix Cyrillic *(M — highest impact)*

**What:** Two-register typography. Keep a bookish serif for body text, add a Didone display face for the site title, dates, year numerals, and headings. Didot/Bodoni-style faces are precisely the typography of 1870s–80s French print — period character without pastiche.

- **Display:** `Playfair Display` — Didone flavor, **has Cyrillic** (verified), variable weight.
- **Body:** `Literata` — designed for long-form screen reading, optical size axis, oldstyle numerals, **full Cyrillic + cyrillic-ext** (verified). Replaces Crimson Pro as primary so Ukrainian finally gets the real typeface; keep Crimson Pro in the stack as latin fallback if preferred.

**Where & how:**

- `global.css` `@theme`:
  ```css
  --font-serif: 'Literata', 'Crimson Pro', Georgia, 'Times New Roman', serif;
  --font-display: 'Playfair Display', 'Literata', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  ```
- `BaseLayout.astro:81–87` — replace the Google Fonts link:
  ```
  https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..600;1,7..72,400..600&family=Playfair+Display:ital,wght@0,400..700;1,400..600&family=Inter:wght@400;500;600&display=swap
  ```
  Better: self-host via `@fontsource-variable/literata` + `@fontsource-variable/playfair-display` (privacy, no third-party request, no layout shift; aligns with the project's "minimal tracking" principle). Subset to latin + latin-ext + cyrillic.
- Apply `var(--font-display)` to: site title (`Header.astro:22`), page `h1`s (currently inline `style="font-family: var(--font-serif)"` in `[lang]/index.astro:94`, `[year]/index.astro:136`, `[carnet]/index.astro:224`, homepage hero `home/[lang].astro:60`), and the entry date line (see P2).
- Enable quality settings on body: `font-kerning: normal; font-variant-ligatures: common-ligatures;` and `hyphens: auto` on `.prose-diary` (the `lang` attribute is already set correctly per language, so Czech/Ukrainian hyphenation works).

**Why readability-first:** Literata is a purpose-built e-reading face (better than Crimson Pro at 18px on low-DPI screens); the display face only touches short strings; Cyrillic fix is a straight readability win for `/uk/`.

### P2 — Make the entry date a typographic event *(S–M)*

**What:** Give each diary entry a real heading: the formatted date in the display face, centered, with an ornamental rule beneath — like a chapter opening. Replace the current first-paragraph hack.

**Where:** `[lang]/[carnet]/[entry].astro` (the header area around lines 120–179) + `global.css:189–193`.

**Concrete:** The entry already has `entry.title` and `entry.date` at build time — render a real `<h1>` above the content instead of relying on paragraph 1:

```html
<h1 class="entry-date-heading">{formattedDate}</h1>
```
```css
.entry-date-heading {
  font-family: var(--font-display);
  font-size: calc(1.75rem * (1 + (var(--reading-font-scale) - 1) * 0.5));
  font-weight: 500;
  text-align: center;
  color: var(--text-primary);
  margin: 1.5rem 0 0.5rem;
}
.entry-date-heading::after {        /* short centered rule, like a chapter head */
  content: '';
  display: block;
  width: 4rem;
  height: 1px;
  margin: 0.875rem auto 0;
  background: var(--color-accent);
  opacity: 0.5;
}
```
Then drop the `margin-left: -1rem` hack and reduce the `:first-child` paragraph scaling (the in-text date line can stay normal size, or be styled small-caps — see P7).

**Why:** Visual hierarchy is the #1 missing readability feature on the entry page; this is also the single biggest "diary feel" gain.

### P3 — Warm dark mode ("candlelight") *(S)*

**What:** Replace neutral grays with warm near-blacks so the parchment/ink identity survives at night.

**Where:** `global.css:51–58`.

```css
[data-theme="dark"] {
  --bg-primary: #171310;     /* warm near-black, brown undertone */
  --bg-secondary: #211B16;
  --text-primary: #E8E0D3;   /* warm off-white */
  --text-secondary: #BFB3A2;
  --text-muted: #A89B89;     /* keep ~8:1+ on bg-primary */
  --border-color: rgba(232, 224, 211, 0.10);
}
```
Also brighten the dark accent where amber is used on dark grounds (e.g. expose `--color-accent` per theme and set it to `#D97706` or `#E08E2B` in dark for contrast), fix `[data-theme="dark"] .bg-ink` (`global.css:261`) to `#0E0B09`, and add the missing dark override for `.paragraph-highlight`:
```css
[data-theme="dark"] .paragraph-highlight { background-color: rgba(217, 119, 6, 0.15); }
```

**Why:** Identical contrast math, zero layout change — pure character recovery. (The hardcoded values were verified bland in the dark-mode screenshot.)

### P4 — Ornamental dividers & entry-end fleuron *(S)*

**What:** Lean into the one ornament that already exists. Upgrade `.entry-divider` to a centered fleuron between hairlines, and end each entry with a small mark instead of a bare `border-t`.

**Where:** `global.css:100–112` (divider), `[entry].astro:210` (bottom nav `border-t`).

```css
.entry-divider {
  border: none; height: auto; background: none;
  display: flex; align-items: center; gap: 1rem;
  margin: 1rem 0;
  color: var(--color-accent); opacity: 0.45;
}
.entry-divider::before,
.entry-divider::after {
  content: ''; flex: 1; height: 1px;
  background: currentColor;
}
/* the glyph, via a wrapped span or CSS content on a child */
.entry-divider-glyph { font-size: 0.9rem; }  /* ❦ U+2766 or ⁂ U+2042 */
```
Entry end (after the last paragraph / before footnotes):
```css
.entry-end::after { content: '⁂'; display: block; text-align: center;
  color: var(--color-accent); opacity: 0.4; font-size: 1rem; margin: 2rem 0 0; }
```
Use these glyphs sparingly: one divider at top, one asterism at the end. Verify glyph rendering across fonts (Playfair/Literata carry ❦/⁂; otherwise inline a 24px SVG fleuron).

**Why:** Period-correct print furniture, costs nothing in attention, gives entries a clear "you've finished" signal — a genuine reading aid for long entries.

### P5 — Header & footer with print character *(S)*

**What:**
- Site title in the display face, slightly larger, with the dates as a subtitle device on desktop: `Diary of Marie Bashkirtseff · 1873–1884` (the dates in muted small text).
- Replace the header's plain `border-b border-ink/10` with a classic **double rule** (thick-thin), the signature of 19th-century newspapers/journals:

**Where:** `Header.astro:17,22`; mirror a single hairline-over-double rule at the footer top (`Footer.astro:22`).

```css
header.site-header {
  border-bottom: none;
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--text-primary) 25%, transparent),
    0 4px 0 -2px color-mix(in srgb, var(--text-primary) 12%, transparent);
}
```
(Theme-aware via `var(--text-primary)`; works in all three themes.)

**Why:** The header appears on every page; this is the cheapest site-wide character gain available.

### P6 — Carnet cards that feel like notebooks *(M)*

**What:** Differentiate the three list levels which currently share one card style.

- **Year cards** (`[lang]/index.astro:247–302`): set the year numeral in the display face — `font-family: var(--font-display); font-weight: 500;` replacing `text-3xl font-light text-accent` — with a short baseline rule under it (same `::after` device as P2). Keeps the grid, changes the voice.
- **Carnet cards** (`[year]/index.astro:299–347` masonry + `[carnet]/index.astro` header card): give them a **spine** — a 3–4px left border in accent over the parchment card, like a cloth-bound notebook edge:
  ```css
  .carnet-card {
    border-left: 4px solid color-mix(in srgb, var(--color-accent) 55%, var(--bg-secondary));
    border-radius: 0.375rem 0.5rem 0.5rem 0.375rem;
  }
  .carnet-card:hover { border-left-color: var(--color-accent); }
  ```
  And set the carnet number in display face with the period numero: `Carnet № 001` (№ available in both proposed fonts; for i18n, keep the localized label and add № only in the styled number lockup if it reads well in cs/uk/en/fr — it is natural in all four).
- **Entry rows** (`[carnet]/index.astro:401–441`): keep flat/quiet as they are — the contrast against spined carnet cards *is* the hierarchy. Just set the `<time>` element in the serif with oldstyle figures: `font-family: var(--font-serif); font-variant-numeric: oldstyle-nums;`.

**Why:** Encodes the content model (year → notebook → entry) visually; the spine metaphor is restrained and meaning-bearing rather than decorative.

### P7 — Small-caps for UI labels in literary contexts *(S)*

**What:** The uppercase Inter labels (`KEY PEOPLE`, `PLACES`, `THEMES`, `CHOOSE LANGUAGE`) become serif small-caps:

**Where:** the repeated `class="text-sm font-medium text-muted uppercase" style="letter-spacing: 0.08em;"` pattern in `[year]/index.astro:203,225,247`, `[carnet]/index.astro:318,339,360,377`, `[lang]/index.astro:103`. Extract to one class in `global.css`:

```css
.section-label {
  font-family: var(--font-serif);
  font-variant-caps: all-small-caps;
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
```
(Literata has real small caps; `all-small-caps` works for Cyrillic too. Keep Inter for buttons, menus, toolbars — functional UI should stay sans.)

**Why:** Removes the strongest "admin dashboard" signal from reading pages; also de-duplicates an inline style repeated 8+ times.

### P8 — A second accent: Bordeaux ink *(S)*

**What:** Add one secondary color — a deep Bordeaux/oxblood, the classic 19th-century bookbinding and rubrication color — used **only** for non-interactive ornament: drop caps, fleurons, the date-heading rule, blockquote borders. Amber stays the sole *interactive* color (links/buttons), preserving affordance clarity.

**Where:** `global.css` `@theme`:
```css
--color-bordeaux: #722F37;        /* light + sepia themes */
/* dark theme: */
[data-theme="dark"] { --color-bordeaux: #B05A5E; }
```

**Why:** Two-tone (amber + wine on parchment) is exactly the palette of period book covers; reserving it for ornament means zero usability cost.

### P9 — Drop caps on entry openings *(S, do after P2)*

**What:** A 2–3 line drop cap on the first text paragraph of each entry, display face, Bordeaux.

**Where:** `global.css`, scoped to the reader. With P2's real `<h1>` in place, target the first paragraph container:

```css
.prose-diary .paragraph-container:first-of-type > div::first-letter {
  font-family: var(--font-display);
  font-weight: 500;
  color: var(--color-bordeaux);
  float: left;
  font-size: 3.1em;
  line-height: 0.85;
  padding: 0.05em 0.08em 0 0;
}
@supports (initial-letter: 3) {
  .prose-diary .paragraph-container:first-of-type > div::first-letter {
    float: none; padding: 0; font-size: inherit; line-height: inherit;
    initial-letter: 3 2;
  }
}
```
Caveats to handle: paragraphs opening with `«`, `"`, `[`, or `—` (skip drop cap when first char is punctuation — needs a small build-time class, or accept punctuation drop caps as period-authentic); `::first-letter` includes leading punctuation by spec, which usually looks fine. Test with Cyrillic (`Щ`, `Ї`) and Czech (`Ř`, `Č`) — both proposed fonts cover them.

**Why:** The single most recognizable "literary edition" gesture; one per entry, so it never competes with the text. Mildly fiddly to get right across 4 languages — hence ranked behind P2.

### P10 — Reading measure & rhythm tune-up *(S)*

**What:** Small metric refinements to `.prose-diary` (`global.css:174–208`):
- Measure: `max-width: 65ch` (instead of `max-w-2xl`/672px ≈ 74 chars at 18px) — the classic 60–70ch sweet spot, scales with the user's font-size setting automatically.
- `line-height: 1.7` (1.8 at 65ch is slightly loose; optional, test).
- Paragraph spacing `1.25rem` for clearer paragraph rhythm at the new measure.
- `text-rendering: optimizeLegibility;` and `font-variant-numeric: oldstyle-nums;` on `.prose-diary` (oldstyle figures inside diary text — dates, sums — look typeset rather than typed; Literata supports `onum`).
- Themed selection: `::selection { background: #EFD9B8; }` / dark: `rgba(217,119,6,0.30)`.

**Why:** Pure readability; `ch`-based measure is the readability-first version of "refined spacing."

### P11 — Homepage hero with Marie present *(M, nice-to-have)*

**What:** The hero (`home/[lang].astro:57–83`) is text on a gradient; the self-portrait only appears lower, float-right. Move a portrait into the hero: portrait right (or background-faded on mobile), title + quote left; frame it like a plate in a period edition:
```css
.portrait-frame {
  border: 1px solid color-mix(in srgb, var(--text-primary) 30%, transparent);
  outline: 4px solid var(--bg-primary);
  outline-offset: -8px;             /* inner "mat" line */
  box-shadow: 0 6px 20px rgba(44, 24, 16, 0.18);
}
```
Assets already exist: `public/images/marie/self-portrait.jpg`, `the-meeting.jpg`, `in-the-studio.jpg` (plus 220 Kernberger images in `content/_raw/images/kernberger/` for future carnet covers). Apply the same frame to the existing intro-section portrait either way (that part is S).

**Why:** A painter's diary whose landing page shows no painting above the fold is the definition of bland. Image weight is the only cost — use `astro:assets` with `loading="eager"` + proper sizes.

### P12 — Optional: whisper of paper texture *(S, strictly optional)*

**What:** An almost-subliminal paper grain on the body background — inline SVG `feTurbulence` data-URI at 2–3% opacity, light/sepia themes only, disabled under `prefers-reduced-data`. **Skip if in doubt** — the warm palette + real typography may be enough, and texture is the first thing to cross into kitsch. Prototype, screenshot, decide.

---

## 4. Ranked plan

### Do these first (high impact ÷ effort)

| # | Proposal | Effort | Impact |
|---|----------|--------|--------|
| 1 | **P1** Display face + Literata body + **Cyrillic fix** | M | Transforms every page; fixes a real defect for `/uk/` |
| 2 | **P2** Entry date as chapter heading | S–M | The reader is the product; biggest single "diary feel" gain |
| 3 | **P3** Warm dark mode | S | Recovers the identity for night readers; trivial diff |
| 4 | **P4** Fleuron dividers + entry-end asterism | S | Visible character on every entry, zero clutter |
| 5 | **P5** Header double rule + display-face site title | S | Site-wide, every page, ~20 lines of CSS |

These five together are roughly two focused days and would move the site from "tasteful default" to "designed edition" without touching layout or interaction.

### Nice-to-haves (next wave)

6. **P7** Serif small-caps section labels (S) — quick de-dashboarding.
7. **P8** Bordeaux secondary color (S) — enables P9; tiny token change.
8. **P6** Notebook-spine carnet cards + display-face year numerals (M).
9. **P10** Measure/rhythm tune-up + themed selection (S).
10. **P9** Drop caps (S, after P2; needs multilingual testing).
11. **P11** Hero portrait with period frame (M).
12. **P12** Paper texture (S, only if a prototype convinces).

### Incidental fixes spotted during review (do alongside any of the above)

- `.paragraph-highlight` has no dark-mode override → light-amber flash on dark theme (`global.css:342`).
- The first-paragraph `margin-left: -1rem` hack (`global.css:191`) breaks column alignment; superseded by P2.
- Self-hosting fonts (P1) also removes the render-blocking Google Fonts request and the third-party call (privacy principle in `frontend/CLAUDE.md`).
- The inline `style="font-family: var(--font-serif)"` repeated on every `h1` should become a heading rule in `global.css` once P1 lands.

---

## 5. Suggested token diff (summary)

```css
@theme {
  /* palette — existing, kept */
  --color-parchment: #FFF8F0;
  --color-sepia:     #F5E6D3;
  --color-ink:       #2C1810;
  --color-ink-light: #4A3728;
  --color-accent:       #B45309;   /* interactive only */
  --color-accent-light: #D97706;
  --color-muted:     #78716C;
  /* new */
  --color-bordeaux:  #722F37;      /* ornament only: drop caps, rules, fleurons */

  /* typography — changed */
  --font-serif:   'Literata', 'Crimson Pro', Georgia, 'Times New Roman', serif;
  --font-display: 'Playfair Display', 'Literata', Georgia, serif;
  --font-sans:    'Inter', system-ui, sans-serif;
}

[data-theme="dark"] {
  --bg-primary:   #171310;
  --bg-secondary: #211B16;
  --text-primary:   #E8E0D3;
  --text-secondary: #BFB3A2;
  --text-muted:     #A89B89;
  --border-color: rgba(232, 224, 211, 0.10);
  --color-bordeaux: #B05A5E;
}
```
