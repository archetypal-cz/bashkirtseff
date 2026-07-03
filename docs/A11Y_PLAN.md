# Accessibility Plan — bashkirtseff.org

> Status: **workstreams A–H implemented** (2026-07-02/03 — see per-section STATUS notes). Remaining: WS-I (manual NVDA/VoiceOver audit protocol — the human part). The baseline tables below describe the pre-implementation state.
> Audited 2026-07-02 against the live `src/frontend` codebase (Astro 7 static +
> Vue 3 islands + Tailwind v4 + `@vite-pwa/astro`). Baseline captured with
> axe-core 4.12 driven by headless Chrome against a local `astro dev` build.
>
> **Scope of the audit tooling:** axe-core catches ~40% of WCAG issues
> automatically; the widget/focus/screen-reader findings below come from reading
> the components directly. Lighthouse's *performance* score was not measured
> (no full LH run); the a11y-category audits it runs are a strict subset of what
> axe covers, so the axe baseline is the harder gate.
>
> **Reviewed by Codex (GPT) 2026-07-02** — four verification passes against the
> live code; verdict "approve for execution", seven precision corrections folded
> in below (marked where substantive: F1 accent-light nuance, F3/B2 h1 mechanism,
> F5/C2 Escape inventory, C1 extraction target, C7 active suppression, A3 ratio,
> H2 workflow heads-up).

---

## 1. Executive summary

**Current estimated state:** Lighthouse a11y ≈ **85–90** on most page types,
lower (~80) on diary **entry** pages. The static shell is fundamentally sound —
real landmarks (`header`/`main`/`footer`), self-hosted fonts, per-page `lang`
locking (`BaseLayout.astro` `lockLang`), themed focus is partially handled, and
one island (`ParagraphToolbar.vue`) already implements a correct modal-dialog
pattern that can serve as the template for the rest.

The gaps that keep it off 100 fall into five clusters:

1. **A design-token bug that breaks contrast in dark mode and all three brand
   variants** — Tailwind's `text-accent`/`bg-accent` utilities forward to the raw
   `--brand-accent`, which the dark theme blocks never re-map (they only brighten
   the *semantic* `--accent`). Result: accent text/links render the light-mode
   accent on dark grounds at **2.0–3.7:1** (WCAG 1.4.3 fail), worst in `deuil`
   (2.0:1) and `atelier` (2.3:1).
2. **Modal/overlay islands with no dialog semantics or focus management** —
   `UnifiedMenu`, `BookSidebar`, `FilterPanel`, `ParagraphMenu`, `ReportDialog`
   are full-screen overlays with no `role="dialog"`, no focus trap, no
   focus-move-on-open / restore-on-close, several with no Escape.
3. **Structural heading/landmark defects** — no skip link anywhere; diary entry
   pages have **no `<h1>`** (date renders as `<h2>`); a nested `<footer>` produces
   a **duplicate `contentinfo` landmark on every page**; multiple unlabeled
   `<nav>` landmarks.
4. **The bilingual reading flow leaks to screen readers** — flipped paragraph
   faces stay in the accessibility tree (both translation *and* original read
   aloud), original-language text is not `lang`-tagged, and "Copied"/filter-count
   status changes are never announced.
5. **No `prefers-reduced-motion` handling at all** — smooth-scroll, the 3D
   paragraph flip, and ~10 components animate unconditionally.

**Target:**

- Lighthouse a11y **100** on all key page types (home, year, carnet-list, entry,
  glossary index/entry, about).
- **WCAG 2.2 Level AA** across all 3 themes (light/sepia/dark) × 4 brands
  (default/atelier/deuil/riviera) = 12 palette combinations, all AA.
- Fully operable with **keyboard only**, **screen reader** (NVDA + VoiceOver),
  and **200% zoom / 400% reflow**.
- A **per-PR CI gate** (axe + Lighthouse budgets) so the score cannot regress.

---

## 2. Baseline (measured 2026-07-02, axe-core 4.12, headless Chrome)

axe run with rulesets `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`:

| Page | Rule violations | Nodes | Serious rules |
|------|----------------:|------:|---------------|
| `/cz/` (year overview) | 2 | 12 | color-contrast (10), target-size (2) |
| `/cz/1873/` (carnet-year) | 2 | 12 | color-contrast (10), target-size (2) |
| `/cz/001/` (carnet entries) | 2 | 12 | color-contrast (10), target-size (2) |
| `/cz/106/1884-10-20` (entry) | 2 | **22** | color-contrast (10), **target-size (12)** |
| `/uk/106/1884-10-20` (entry, Cyrillic) | 2 | 22 | color-contrast (10), target-size (12) |
| `/cz/glossary/` | 2 | 12 | color-contrast (10), target-size (2) |
| `/` (home) | 2 | 13 | color-contrast (11), target-size (2) |
| `/cz/about` | **0** | 0 | — (clean) |

Best-practice ruleset added on top (every page): `landmark-no-duplicate-contentinfo`,
`landmark-contentinfo-is-top-level`, `landmark-unique`; home also `heading-order`;
entry also `page-has-heading-one`. **No skip link on any page; entry pages have
zero `<h1>`.**

### Contrast detail (fg / bg / ratio, from axe node data)

Cross-page, light default:
- `.site-title-dates` "1873–1884" — `#78716c` on `#f5e6d3` = **3.91:1** (header, every page)
- Footer muted text (version, byline, links) `#78716c` on sepia = **3.91:1**
- Footer `.opacity-70` license line `#9e948b` on sepia = **2.42:1** (worst light)
- Accent link at rest `#b45309` on `#faefe1` = **4.42:1** (just under 4.5 AA)

Dark + brand variants (the token bug — accent-as-text on dark ground):
- default dark: `text-accent-light` `#b45309` on `#1c1713` = **3.53:1**
- **deuil dark**: carnet-number card titles `#7a2e2e` on `#141210` = **2.0:1**;
  hover accent `#7a2e2e` on `#191614` = **1.93:1**
- **atelier dark**: card titles `#1f5c82` on `#12181e` = **2.47:1**; links **2.33:1**
- riviera dark: `#0e7c86` on `#132120` = **3.35:1**
- riviera **light**: footer `.opacity-70` `#92918c` on `#e9f0ee` = **2.73:1**
- dark muted footer `#807567` on `#211b16` = **3.77:1** (all dark variants)

The "known white-on-accent dark button" issue is real too: `.btn-primary:hover`
uses `bg-accent-light` (`#D97706`) with `text-white` ≈ **3.2:1** (global.css:398)
— fails the 4.5:1 text threshold. (Codex review 2026-07-02 corrected the ratio,
which was previously overstated as 2.4:1.)

---

## 3. Top findings inventory (file:line · severity · WCAG)

| # | Finding | Where | Sev | WCAG |
|---|---------|-------|-----|------|
| F1 | Tailwind `text-accent`/`bg-accent` forward to raw `--brand-accent`; dark theme blocks only remap semantic `--accent`, so accent text is un-brightened on dark → 2.0–3.7:1. Worse: there is **no semantic `--accent-light` at all** — `--color-accent-light` always resolves to the raw, never-theme-aware `--brand-accent-light` (A1's fix must introduce it) | `global.css:19` (`--color-accent: var(--brand-accent)`); `branding.css:179–191` (default dark) + per-brand dark blocks `243–254` (atelier), `278–289` (deuil), `313–325` (riviera) — all set `--accent`, not `--brand-accent` | Critical | 1.4.3 (AA) |
| F2 | No skip-to-content link on reading/entry/year pages (`welcome.astro` has a working one — extract that pattern; `ReadingLayout` has none) | `BaseLayout.astro:198` (`<body>` → `<slot/>` directly) | Serious | 2.4.1 (A) |
| F3 | Diary entries **sometimes** lack an `<h1>`: a real `<h1>` renders when `showDateHeading` is true, but entries whose date heading is markdown-authored in the first paragraph take the fallback branch (content.ts converts `# date` → `<h2>`, `showDateHeading` false) | `[carnet]/[entry].astro`; `content.ts` heading conversion; `global.css:121` | Serious | 1.3.1 / 2.4.6 |
| F4 | Duplicate `contentinfo` on every page — nested `<footer>` inside site `<footer>` | `Footer.astro:76` inside `Footer.astro:29` | Moderate | 1.3.1 |
| F5 | Overlay islands lack dialog semantics + focus trap + focus restore; Escape exists in UnifiedMenu and FilterPanel but is **absent** in BookSidebar, ParagraphMenu, ReportDialog (don't redo the working two) | `UnifiedMenu.vue:408`, `BookSidebar.vue:172`, `FilterPanel.vue:156`, `ParagraphMenu.vue:139`, `ReportDialog.vue:139` | Serious | 2.1.2, 4.1.2, 2.4.3 |
| F6 | Flipped paragraph: both faces stay in a11y tree; original text not `lang`-tagged; `aria-pressed`/state on flip missing on legacy `FlipParagraph` | `ParagraphToolbar.vue:249,254`; `FlipParagraph.vue:56,77` | Serious | 4.1.2, 1.3.1, 3.1.2 |
| F7 | Accordion section/category headers have no `aria-expanded`/`aria-controls` (state = chevron CSS only) | `UnifiedMenu.vue:430,477,555,616,678,747,826`; `FilterPanel.vue:200,269` | Serious | 4.1.2 |
| F8 | Toggle buttons (theme, brand, filter AND/OR) lack `aria-pressed` | `UnifiedMenu.vue:513–547,710`; `ReadingSettings.vue:124–150` | Moderate | 4.1.2 |
| F9 | Dynamic status never announced (no `aria-live`/`role=status`/`role=alert`): "Copied", filter counts, font-size %, report errors/success | `ParagraphToolbar.vue:308`, `ParagraphMenu.vue:167`, `FilterOverlay.vue:289`, `UnifiedMenu.vue:500,724`, `ReadingSettings.vue:108`, `ReportDialog.vue:159,213` | Serious | 4.1.3 |
| F10 | Touch targets < 24×24: toolbar dots 20px, fleur ~16px; filter checkbox 15px; footer license/logo links; banner-clear ~20px | `ParagraphToolbar.vue:419,430`; `FilterPanel.vue:645`; `Footer.astro:86`; `FilterOverlay.vue:334` | Serious | 2.5.8 (AA, 2.2) |
| F11 | Unlabeled search inputs (placeholder only) | `BookSidebar.vue:217`, `UnifiedMenu.vue:646,700`, `FilterPanel.vue:169` | Serious | 4.1.2 / 3.3.2 |
| F12 | Muted text fails AA: `.site-title-dates`, footer meta 3.91:1; `.opacity-70` license 2.42:1 | `global.css:295`; `Footer.astro:76,84`+`.opacity-70`; token `--brand-muted #78716C`, `branding.css:50` | Serious | 1.4.3 |
| F13 | No `prefers-reduced-motion`: smooth-scroll, 3D flip, ~10 animated components | `global.css:36`; `ParagraphToolbar.vue`/`FlipParagraph.vue` transforms; `BaseLayout.astro:202` toast | Moderate | 2.3.3 |
| F14 | Multiple `<nav>` without `aria-label` (breadcrumb, prev/next, footer, header) → `landmark-unique` fail | `HeaderNav.vue:20`; `[entry].astro:134,161,245`; `[year]/index.astro:122,268,360`; etc. | Moderate | 1.3.1 |
| F15 | Icon-only controls relying on `title` alone (no `aria-label`); SVGs not `aria-hidden` | `ParagraphMenu.vue:128,208`; `BookSidebar.vue:185`; `LanguageSwitcher.vue` `_original` globe (empty name); widespread SVGs | Moderate | 4.1.2, 1.1.1 |
| F16 | `aria-current` never used for current page/entry/language | `HeaderNav.vue`; `BookSidebar.vue:232`; `UnifiedMenu.vue:660`; `LanguageSwitcher.vue:119` | Minor | 4.1.2 |
| F17 | `ReportDialog` custom reason dropdown has zero select semantics; textarea label not associated | `ReportDialog.vue:174–198,202–203` | Serious | 4.1.2, 3.3.2 |
| F18 | `LocaleSwitcher` listbox has no arrow-key nav, no Escape, no roving tabindex | `LocaleSwitcher.vue:132–140` | Moderate | 2.1.1 |
| F19 | Heading-order jump on home (H1 → H3 for "This Day") | `home/[lang].astro` / `pages/index` ThisDay block | Moderate | 1.3.1 |
| F20 | `ParagraphToolbar` default `opacity:0.2` — controls near-invisible for low-vision mouse users | `ParagraphToolbar.vue:374` | Minor | 1.4.11-adjacent |

---

## 4. Workstreams

Each task: **what · where(file) · acceptance · effort (S/M/L)**. ParagraphToolbar
is the reference implementation for the dialog pattern; extract it into a shared
composable so the fixes below are DRY.

### WS-A · Color & contrast (3 themes × 4 brands) — highest ROI, fixes ~10 axe nodes/page

> **STATUS: IMPLEMENTED 2026-07-02.** A1 (semantic `--accent`/`--accent-light`
> forwarding + new `--accent-fill`/`--accent-fill-hover` split for white-text
> surfaces), A2 (muted darkened per theme+brand, footer `opacity-70` removed),
> A3 (`.btn-primary` on fill tokens, hover darkens), A5 (matrix script at
> `src/scripts/a11y-contrast-matrix.mjs` + `just a11y-contrast` /
> `just a11y-axe`, doc at `docs/A11Y_CONTRAST_MATRIX.md`). Raw brand accents
> darkened for AA: default `#B45309→#9A4707`, riviera `#0E7C86→#0B6A73`
> (historic ambers live on as dark-theme fill tokens). Verified: matrix ALL
> PASS (12 combos × 9 pairs); axe re-run light+dark = **0 color-contrast nodes
> on every page in the default/static state** (was 10–11/page) — interactive
> states (open menus, `.is-open` toggles) are not covered by the static scan;
> Codex spot-checked the menu toggle's `.is-open` state and it passes as a
> non-text UI component (3:1). Two induced `link-in-text-block` hits fixed with
> dotted underlines (year + carnet location links); ~30 stale `var(...,#hex)`
> fallback literals swept to the new values. Codex review 2026-07-02: approved
> after the carnet-page sibling fix. A4 focus-ring contrast remains with
> WS-B/C7 (ring doesn't exist yet).

- **A1 — Fix the accent-token forwarding bug (F1).** *What:* make Tailwind
  accent utilities theme-aware. Either (a) point `@theme` `--color-accent`/
  `--color-accent-light` at the *semantic* `--accent` (add a `--accent-light`
  semantic token per theme) instead of raw `--brand-accent`; or (b) add
  `--brand-accent*` overrides to every `[data-theme="dark"]` block (default +
  3 variants). Option (a) is cleaner and self-maintaining. *Where:* `global.css:19–20`,
  `branding.css:155,179–191,244–255,279–290,314–325`. *Acceptance:* every
  `text-accent`/`bg-accent` element ≥ 4.5:1 (or 3:1 for ≥24px/bold) in all 12
  theme×brand combos; re-run `axe-detail.mjs` shows 0 accent-on-dark nodes.
  *Effort:* M.
- **A2 — Raise muted text to AA (F12).** *What:* darken `--brand-muted`
  (`#78716C`→ ~`#5c5650`, ≥4.5:1 on sepia) and per-variant muted; remove the
  `opacity-70`/`.opacity-70` stacking on already-muted footer text. *Where:*
  `branding.css:50` + per-variant `--brand-muted`; `Footer.astro` license/version
  rows; `global.css:295` `.site-title-dates`. *Acceptance:* `.site-title-dates`,
  footer meta, license line all ≥4.5:1 in all themes; riviera-light 2.73:1 case
  resolved. *Effort:* S.
- **A3 — Fix primary-button hover contrast (F1 white-on-accent).** *What:*
  `.btn-primary:hover` `bg-accent-light` (`#D97706`) + white ≈ 3.2:1; darken hover
  fill or the text. *Where:* `global.css:398`, `branding.css:56` `--brand-accent-light`
  (note F1: no semantic `--accent-light` exists — introduce it as part of A1 so
  themes/brands can remap it). *Acceptance:* white text on primary button ≥4.5:1
  at rest AND hover, all brands. *Effort:* S.
- **A4 — Verify non-text/UI contrast (borders, focus rings, foreign-text
  underline, ornaments).** *What:* ensure interactive borders and the eventual
  focus ring meet 3:1 (1.4.11). *Where:* `branding.css --border-color`; WS-B focus
  ring. *Acceptance:* focus ring ≥3:1 against adjacent colors in all themes.
  *Effort:* S.
- **A5 — Add a documented contrast matrix** (12 combos × key token pairs) to this
  repo so future palette edits are checkable. *Where:* `docs/` + the
  `scratchpad/axe-detail.mjs` script promoted into `src/scripts/`. *Effort:* S.

### WS-B · Semantics, landmarks & headings

> **STATUS: IMPLEMENTED 2026-07-03.** B1 skip link (BaseLayout + `.skip-link`
> CSS + `id="main"` on all five mains), B2 entry `<h1>` guarantee (first-para
> `h2→h1` promotion when markdown-authored; `sr-only` h1 otherwise — exactly
> one h1 on every entry), B3 nested footer → `<p>`, B4 distinct translated
> `aria-label` on every `<nav>` (12 templates + 4 islands, 15 new `a11y.*`
> keys ×4 locales), B5 heading-order fixes (ThisDay, footer, carnet+year
> sidebars h3→h2), B6 `aria-current` (sidebar/contents entries, language
> chips). Verified with axe on 8 page types: `page-has-heading-one`,
> `heading-order`, `landmark-*`, `bypass` all CLEAN. Codex-reviewed; its one
> defect (year-page sidebar h3 siblings) fixed. Known limitation (matches
> existing convention): `aria-label`s are build-time locale, not live-patched
> by I18nPatch when the UI-language preference differs.

- **B1 — Add a skip link (F2).** *What:* first focusable element in `<body>`,
  visually-hidden until focus, jumps to `#main`. *Where:* `BaseLayout.astro:198`
  (+ give `<main>` `id="main"` in `ReadingLayout.astro:41` and the other layouts
  `offline/404/admin/home`). Translate the label via the existing `t()`.
  *Acceptance:* Tab from page load reveals "Skip to content"; activates to main.
  *Effort:* S.
- **B2 — Give every diary entry an `<h1>` (F3).** *What:* NOT "bolt on a heading" —
  a real `<h1>` already renders when `showDateHeading` is true; fix the fallback
  branch (markdown-authored date in the first paragraph → content.ts emits `<h2>`
  and `showDateHeading` goes false) so the conditional **always** yields exactly one
  `<h1>`, and demote the "Notes"/footnotes heading appropriately. *Where:*
  `[carnet]/[entry].astro`; `content.ts` heading conversion; `[lang]/000/index.astro`;
  `global.css:121` (selector already targets both levels). *Acceptance:*
  `page-has-heading-one` passes; exactly one h1; no order jump; no duplicate date
  heading on entries that already had the h1 branch. *Effort:* M.
- **B3 — Kill the duplicate contentinfo (F4).** *What:* change the blockquote
  citation `<footer>` to `<cite>`/`<p>` (or `role="none"`). *Where:* `Footer.astro:76`.
  *Acceptance:* one `contentinfo` per page; `landmark-no-duplicate-contentinfo`
  and `landmark-contentinfo-is-top-level` pass. *Effort:* S.
- **B4 — Label every `<nav>` (F14).** *What:* add distinct `aria-label`
  (translated): breadcrumb, prev/next pagination, header nav, footer links, TOC.
  *Where:* `HeaderNav.vue:20`; the `<nav>` list in §grep (all `pages/[lang]/**`
  and island navs). *Acceptance:* `landmark-unique` passes on every page type.
  *Effort:* M.
- **B5 — Fix home heading order (F19).** *What:* the "This Day" block must not
  jump H1→H3; wrap under an H2 or promote. *Where:* home page ThisDay section.
  *Acceptance:* `heading-order` passes on `/`. *Effort:* S.
- **B6 — Add `aria-current` (F16).** *What:* `aria-current="page"` on active
  header/footer nav link and current TOC entry; `aria-current="true"` on current
  language chip. *Where:* `HeaderNav.vue`, `BookSidebar.vue:232`, `UnifiedMenu.vue:660`,
  `LanguageSwitcher.vue:119`, `ContentLanguageSwitcher.vue:63`. *Acceptance:* SR
  announces "current page". *Effort:* S.

### WS-C · Keyboard & focus (dialogs, menus, sidebar)

> **STATUS: IMPLEMENTED 2026-07-03.** C1 `useDialog` composable extracted from
> ParagraphToolbar's bottom sheet (Escape, Tab trap, focus move; restore is
> post-flush with an `isConnected` guard so a vanishing trigger can't strand
> focus on `<body>`). C2 dialog semantics + composable wired into UnifiedMenu,
> ParagraphMenu and ReportDialog. C3 `aria-expanded`/`aria-controls` on the
> UnifiedMenu accordions. C4 LocaleSwitcher APG listbox keyboard (roving focus,
> Home/End, Escape-to-trigger). C5 ReportDialog native labeled `<select>` +
> textarea label association (custom div dropdown + its state machine and CSS
> removed). C6 BackToTop hands focus to `#main`. C7 global `:focus-visible`
> ring (2px accent, ≥3:1 all 12 combos); all five `outline:none` suppressions
> removed. Live-verified with puppeteer: 25-Tab trap holds, Escape closes and
> restores focus, listbox arrows work, ring renders.
> **Discovery (Codex review): `FilterPanel.vue` and `BookSidebar.vue` were
> DEAD CODE** — zero imports anywhere; UnifiedMenu's inline filter + contents
> sections are the live implementations. Both deleted (their F5/C2/C3 line
> items are moot); skill docs updated. `a11y.sidebarContents` key kept for
> future use. Remaining from the audit that referenced them: nothing — the
> live overlays are all covered.

- **C1 — Extract a `useDialog` composable** from `ParagraphToolbar.vue:103–143`
  (Escape close, Tab focus-trap, focus-move-on-open, restore `lastFocused` on
  close) into `src/composables/useDialog.ts`. Precision (Codex review): the
  reference implementation is the **Teleported bottom sheet** ParagraphToolbar
  opens — extract from that sheet's logic, not the persistent per-paragraph
  toolbar strip itself (which is not a dialog). *Acceptance:* single source; unit
  behavior matches the bottom sheet. *Effort:* M.
- **C2 — Apply dialog semantics + `useDialog` to every overlay (F5).** *What:* add
  `role="dialog"` `aria-modal="true"` `aria-label`(translated) `tabindex="-1"`,
  wire focus trap/restore + Escape. *Where:* `UnifiedMenu.vue:408`, `BookSidebar.vue:172`
  (`<aside>`→ dialog or add role), `FilterPanel.vue:156`, `ParagraphMenu.vue:139`,
  `ReportDialog.vue:139`. *Acceptance:* keyboard cannot Tab out of an open overlay;
  Escape closes; focus returns to the trigger; SR announces the dialog name.
  *Effort:* L.
- **C3 — Add `aria-expanded`/`aria-controls`/`aria-haspopup` to all disclosure
  triggers (F7).** *Where:* accordion headers in `UnifiedMenu.vue` (`:430,477,555,
  616,678,747,826`), `FilterPanel.vue:200,269`; overlay toggles that only have
  `aria-expanded` also get `aria-controls`. *Acceptance:* SR announces
  collapsed/expanded; `aria-controls` resolves. *Effort:* M.
- **C4 — `LocaleSwitcher` full listbox keyboard (F18).** *What:* Up/Down/Home/End
  roving focus, Escape closes to trigger, `aria-activedescendant` or roving
  tabindex, `aria-controls`. *Where:* `LocaleSwitcher.vue:132–140`. *Acceptance:*
  operable with arrows per APG listbox; Escape returns focus to trigger.
  *Effort:* M.
- **C5 — `ReportDialog` reason control (F17).** *What:* replace the custom
  `<div>` dropdown with a native `<select>` (simplest, fully accessible) or a
  proper ARIA listbox; associate the `<textarea>` label via `for`/`id`.
  *Where:* `ReportDialog.vue:174–198,202–203`. *Acceptance:* reason selectable by
  keyboard/SR; textarea has a programmatic label. *Effort:* M.
- **C6 — `BackToTop` focus handoff (F, minor).** *What:* on activate, move focus
  to the skip-link/`#main` top so the tab position isn't lost when the button
  hides. *Where:* `BackToTop.vue:12`. *Acceptance:* keyboard focus lands at top of
  content after "back to top". *Effort:* S.
- **C7 — Visible focus indicator audit.** *What:* the ring is not merely missing —
  it is **actively suppressed**: GlossarySearch, FilterPanel, UnifiedMenu,
  BookSidebar and ReportDialog set `outline: none` and substitute a weak `:focus`
  (not `:focus-visible`) border-color change. Remove the suppressions and install
  a global 3:1 `:focus-visible` ring token. *Where:* the five components above +
  `global.css` ring token from `branding.css`. *Acceptance:* every control shows a
  visible ring at 200% zoom in all themes. *Effort:* M.

### WS-D · Screen-reader experience for the bilingual reading flow

> **STATUS: IMPLEMENTED 2026-07-03** (D1–D6). Flip faces aria-hidden+inert with
> lang attrs (D1/D2); %%-leak assertion baked into the audit script, 0 leaks
> (D3); aria-live/status/alert on copied, filter banner, font size, report
> states, offline toast (D4, covers G2's toast); language switchers expose
> current/available/unavailable non-visually, globes named+hidden (D5);
> footnote popover is a focus-managed named dialog with localized close and
> scroll-safe dismissal (D6 — Codex empirically verified no focus/scroll race).
> Deferred: per-run lang on inline `.foreign-text` (language not attributable
> per-run from markup — WS-I manual item).


- **D1 — Tame the flip in the a11y tree (F6).** *What:* toggle `aria-hidden` on
  the hidden card face and set `inert` on the rotated-away face so SR reads only
  the visible language; add `aria-pressed`/`aria-label` announcing "showing
  translation / original". *Where:* `ParagraphToolbar.vue:245–260`,
  `FlipParagraph.vue:53–90`. *Acceptance:* with a paragraph unflipped, SR reads
  only the translation; after flip, only the original. *Effort:* M.
- **D2 — `lang`-tag original / foreign text (F6).** *What:* set `lang="fr"` (or the
  paragraph's source lang) on the original-text face and on any inline
  `.foreign-text`/quoted source. *Where:* `ParagraphToolbar.vue:254`,
  `FlipParagraph.vue:77`, `EntryContent.vue` render, `ReportDialog.vue:170`,
  `global.css:433 .foreign-text`. *Acceptance:* SR switches voice/pronunciation
  on original-language runs; matches the diary's cs/uk/en/fr + inline-French mix.
  *Effort:* M.
- **D3 — Confirm `%%` comments never reach the DOM.** *What:* verify the
  `content.ts` parser strips `%% … %%` annotation/timestamp comments before
  `v-html`. *Where:* `content.ts` parse path feeding `ParagraphToolbar.vue:249`
  (`v-html`). *Acceptance:* grep rendered HTML for `%%` = 0; add a build assertion.
  *Effort:* S.
- **D4 — Announce dynamic status (F9).** *What:* add polite `aria-live`/
  `role="status"` for "Copied", filter result counts, font-size %; `role="alert"`
  for report errors; `role="status"` for report success and offline/online toast.
  *Where:* `ParagraphToolbar.vue:308`, `ParagraphMenu.vue:167`, `FilterOverlay.vue:286–289`,
  `UnifiedMenu.vue:500,724`, `ReadingSettings.vue:108`, `ReportDialog.vue:159,213`,
  `BaseLayout.astro:202` toast. *Acceptance:* each state change is announced once,
  not spammed. *Effort:* M.
- **D5 — Content-language switchers convey state non-visually (F, part of F15/F16).**
  *What:* the current/available/unavailable distinction is color/opacity-only;
  add `aria-current`, an accessible name for the `_original` globe, and text (or
  `aria-label`) marking unavailable languages. *Where:* `LanguageSwitcher.vue:119–141`,
  `ContentLanguageSwitcher.vue:47–85`. *Acceptance:* SR user can tell which
  languages are available and which is active. *Effort:* M.
- **D6 — Footnote popover a11y (`footnote-popover.ts`).** *What:* the popover is
  built with `innerHTML`, opened on click, dismissed on Escape/scroll/outside —
  but it is not focus-managed, not a `role="dialog"`/`tooltip`, the trigger has no
  `aria-expanded`, and focus never enters the popover (Close button unreachable by
  keyboard without a Tab into detached content). *What to do:* give the trigger
  `aria-expanded`/`aria-controls`, render `role="dialog"` with a label, move focus
  to the popover (or its close), restore focus to the ref on dismiss, keep the
  existing Escape. Preserve the no-JS anchor fallback. *Where:*
  `footnote-popover.ts:66–126`, `global.css:496 .footnote-popover`. *Acceptance:*
  keyboard user can open, read, and close a footnote and return to place.
  *Effort:* M.

### WS-E · Controls naming & touch targets

> **STATUS: IMPLEMENTED 2026-07-03** (E1–E5). Menu toggle label translated,
> paragraph-menu trigger named, globes hidden (E1); search inputs labeled (E2);
> 24px targets on toolbar buttons, banner-clear, filter-tag labels, footer
> small links — entry pages went 12→0 target-size nodes (E3); toolbar resting
> opacity 0.2→0.45 (E4); aria-pressed on theme/brand toggles (E5).


- **E1 — Name every icon-only control; hide decorative SVGs (F15).** *What:* add
  translated `aria-label` (not just `title`) to icon buttons; add
  `aria-hidden="true"` + `focusable="false"` to decorative SVGs. *Where:*
  `ParagraphMenu.vue:128,208`, `BookSidebar.vue:185`, `LanguageSwitcher`/
  `ContentLanguageSwitcher` globes, `UnifiedMenu.vue:382` (also **translate** the
  hardcoded English "Menu" `aria-label`), all SVGs. *Acceptance:* axe `button-name`/
  `link-name`/`svg-img-alt` clean; SR reads meaningful names. *Effort:* M.
- **E2 — Label search inputs (F11).** *What:* add `<label class="sr-only">` or
  `aria-label`. *Where:* `BookSidebar.vue:217`, `UnifiedMenu.vue:646,700`,
  `FilterPanel.vue:169`. *Acceptance:* axe `label` passes. *Effort:* S.
- **E3 — Meet 24×24 touch targets (F10).** *What:* enlarge or pad; the entry
  ParagraphToolbar accounts for 12 of the 22 axe nodes on entry pages. Bump dots
  (20→24+), fleur (~16→24+), filter checkbox (15→24 or enlarge the label hit
  area), footer license/logo links, banner-clear. *Where:* `ParagraphToolbar.vue:419,430`,
  `FilterPanel.vue:645`, `Footer.astro:86`, `FilterOverlay.vue:334`. *Acceptance:*
  axe `target-size` = 0 nodes on entry and all pages. *Effort:* M.
- **E4 — Raise `ParagraphToolbar` resting visibility (F20).** *What:* `opacity:0.2`
  is a discoverability barrier for low-vision mouse users; raise the resting
  opacity or trigger on paragraph hover/focus with a stronger baseline. *Where:*
  `ParagraphToolbar.vue:374`. *Acceptance:* controls perceivable without hover at
  200% zoom. *Effort:* S.
- **E5 — `aria-pressed` on toggle buttons (F8).** *What:* theme/brand/filter-mode
  buttons. *Where:* `UnifiedMenu.vue:513–547,710`, `ReadingSettings.vue:124–150`.
  *Acceptance:* SR announces which theme/brand is active. *Effort:* S.

### WS-F · Motion & preferences

> **STATUS: IMPLEMENTED 2026-07-03.** Global `prefers-reduced-motion: reduce`
> block: smooth-scroll off, all transitions/animations to 0.01ms (Vue
> Transition hooks still complete — verified no duration-dependent usage).


- **F1m — Global `prefers-reduced-motion` guard (F13).** *What:* one media block
  reducing/zeroing transitions & animations; gate `scroll-behavior:smooth`; make
  the paragraph flip an instant swap under reduced motion; calm the offline toast.
  *Where:* `global.css:36` and a new `@media (prefers-reduced-motion: reduce)`
  block; `ParagraphToolbar.vue`/`FlipParagraph.vue` transform CSS; `BaseLayout.astro:202`.
  *Acceptance:* with the OS setting on, no non-essential motion; flip still works
  as instant toggle. *Effort:* M.

### WS-G · PWA specifics

> **STATUS: IMPLEMENTED 2026-07-03.** G1 manifest reviewed: maskable 192+512
> icons already present; `theme_color` (manifest + meta) updated to the
> post-WS-A brand accent #9A4707; `lang: en` left as-is (per-install-context
> lang has no meaningful platform support — noted). G2 offline toast was made
> a live region in WS-D/D4; OfflineStatus header button now has an accessible
> name (downloads count + stale state), aria-expanded, hidden decorative
> icons; the non-interactive placeholder indicator is aria-hidden. G3 skip
> link + id=main landed for all standalone layouts in WS-B/B1; admin page
> (client:only island) gained an sr-only h1 — offline/404/home already had
> one. Gate re-verified: PASS (light+dark, 0 serious/critical).


- **G1 — Manifest a11y review.** *What:* manifest already has `name`, `short_name`,
  `description`, `lang: 'en'`, `theme_color`, `background_color` (`astro.config.mjs:93`).
  Confirm maskable icon, and consider `lang` per install context (minor). Ensure
  `theme_color` matches the actual header across themes (it's the light amber
  `#B45309`; dark users see a mismatch — acceptable, note it). *Acceptance:*
  Lighthouse PWA installability green; no a11y manifest warnings. *Effort:* S.
- **G2 — Announce offline/online state accessibly.** *What:* the toast in
  `BaseLayout.astro:202` is `pointer-events:none` visual only — wrap the message in
  a `role="status"` live region so SR users hear "You are offline / Back online".
  Same for `OfflineStatus.vue` header indicator (give it an accessible name/live
  update). *Acceptance:* connection changes announced. *Effort:* S.
- **G3 — Offline/404/admin/home layouts get skip link + `id=main` + single h1**
  (these don't use ReadingLayout). *Where:* `offline.astro:6`, `404.astro:12`,
  `admin/index.astro:7`, `home/[lang].astro:84`. *Effort:* S.

### WS-H · Testing & CI

> **STATUS: IMPLEMENTED 2026-07-03.** H1 `src/scripts/a11y-audit.mjs` (axe
> serious/critical budget + %%-leak check, themes×brands sweep) + `just a11y`;
> H2 `.github/workflows/a11y.yml` PR gate (npm ci → shared build → vitest →
> frontend build → serve dist → contrast matrix → axe budget 0, light+dark);
> H3 vitest in the frontend workspace (13 tests green, runs in the CI gate).
> **Full gate verified locally: 64 scans (8 pages × light,dark × 4 brands) =
> 0 serious/critical, 0 %% leaks — A11Y GATE: PASS.**


- **H1 — Promote the axe runner into the repo.** *What:* move
  `scratchpad/axe-run.mjs`/`axe-detail.mjs` to `src/scripts/a11y-audit.mjs`
  (puppeteer-core + axe-core, already proven here), add `just a11y` covering the 8
  key URLs × {light,dark} × {default,atelier,deuil,riviera} for contrast.
  *Acceptance:* one command reproduces the baseline table. *Effort:* M.
- **H2 — Per-PR CI gate (GH Actions).** *What:* build, serve `dist/`, run axe with
  a **budget of 0 serious/critical** on the 8 page types, and Lighthouse-CI a11y
  category **≥ 100** (or ratchet) on 3 representative pages. Fail the PR on
  regression. *Where:* `.github/workflows/` (new a11y job); model on the working
  `deploy.yml` (heads-up: a leftover disabled `build-and-deploy.yml.disabled`
  exists — don't confuse or revive it). *Acceptance:* a contrast/target-size/label
  regression blocks merge. *Effort:* M.
- **H3 — Add the missing test runner** so `locale-mapping.test.ts` (and future a11y
  unit tests for `useDialog`) run — no vitest/jest is installed today
  (frontend `CLAUDE.md:243`). *Effort:* S.

### WS-I · Manual audit protocol

- **I1 — Keyboard-only pass:** Tab through home, entry, glossary; verify skip link,
  focus visible, no traps except intended dialogs, Escape everywhere, focus
  restore. Script the exact route in `docs/`.
- **I2 — NVDA (Firefox) + VoiceOver (Safari) scripts:** read one entry end-to-end
  confirming (a) single h1 = date, (b) translation read once, (c) flip → original
  read in French voice, (d) footnote open/read/close, (e) filter count announced,
  (f) language switch announces current. Provide a checklist doc.
- **I3 — 200% zoom / 400% reflow:** verify no horizontal scroll, no clipped
  controls, reading column reflows (measure is `65ch`, `global.css:227`).
- **I4 — Forced-colors / Windows High Contrast:** verify ornaments/borders survive
  and focus is visible.

---

## 5. Prioritized roadmap

### Quick wins — this week (mostly S, kills most axe nodes)
- **A1** accent-token fix (removes the 10 contrast nodes/page in dark+brands) — the
  single highest-impact change.
- **A2, A3** muted + button-hover contrast (clears remaining light-mode contrast).
- **E3** touch targets (removes 12 nodes on every entry page).
- **B1** skip link, **B3** duplicate contentinfo, **B4/B5** nav labels + heading
  order, **B2** entry `<h1>`.
- **E2** search labels, **E5** `aria-pressed`, **F1m** reduced-motion guard.

Outcome target: axe **0 serious + 0 moderate** on all 8 page types; Lighthouse
a11y ~97–100.

### Structural — this month
- **C1→C2** `useDialog` + apply to all five overlays (the big keyboard/SR win).
- **C3, C4, C5** disclosures, LocaleSwitcher, ReportDialog controls.
- **D1–D6** the bilingual SR flow: flip inert/aria-hidden, `lang` tags,
  live-region status, footnote-popover focus, language-switcher state.
- **C7** focus-ring system; **E1** icon naming sweep.
- **H1** repo-ify the axe runner.

### Continuous
- **H2** per-PR axe + Lighthouse CI gate (the ratchet that holds 100).
- **H3** test runner for `useDialog` unit tests.
- **A5** contrast matrix kept current on every palette edit.
- **I1–I4** manual NVDA/VoiceOver/zoom pass each release; add new brands only after
  they pass the 12-combo contrast matrix.

---

## 6. "Top ratings" checklist — Lighthouse a11y audits → status/task

| Lighthouse audit | Current | Task |
|------------------|---------|------|
| `color-contrast` | **FAIL** (10–11 nodes/page; 2.0:1 worst) | A1, A2, A3, A12 |
| `target-size` (2.2) | **FAIL** (12 nodes on entry) | E3 |
| `heading-order` | FAIL (home) | B5 |
| `page-has-heading-one` | FAIL (entries) | B2 |
| `landmark-one-main` / duplicate contentinfo | FAIL (every page) | B3, G3 |
| `bypass` (skip link/landmarks) | passes via landmarks; no visible skip | B1 |
| `label` (form fields) | FAIL (search inputs) | E2, C5 |
| `button-name` / `link-name` | partial (title-only, empty globe) | E1, D5 |
| `aria-*` valid & required attrs | partial (missing expanded/pressed/controls) | C3, E5 |
| `aria-dialog-name` / modal semantics | FAIL (overlays not dialogs) | C2 |
| `image-alt` / `svg-img-alt` | partial (SVGs not hidden) | E1 |
| `html-has-lang` / `valid-lang` | **PASS** (BaseLayout lockLang) | — keep, add D2 inline `lang` |
| `document-title` | PASS | — |
| `meta-viewport` (no `maximum-scale`) | PASS (`BaseLayout.astro:81`) | — |
| `tabindex` (no positive) | PASS | — |
| `focusable-controls` / keyboard | FAIL (dialogs trap-less, listbox no arrows) | C1–C6 |
| `interactive-element-affordance` / focus visible | needs audit | C7 |
| `use-landmarks` / `landmark-unique` | FAIL (unlabeled navs) | B4 |
| `aria-live` for status | FAIL (none) | D4, G2 |
| `prefers-reduced-motion` respected | FAIL (none) | F1m |
| PWA installable / manifest | PASS-ish | G1 |

---

## 7. Reproducing the baseline

Local Chrome for headless a11y runs was installed via
`npx puppeteer browsers install chrome` (`~/.cache/puppeteer/chrome`). The audit
scripts (`axe-run.mjs`, `axe-detail.mjs`, `axe-bp.mjs`, puppeteer-core + axe-core)
live in the session scratchpad and should be promoted to `src/scripts/` under
**H1**. Start the dev server for agents with
`env -u AI_AGENT -u CLAUDECODE npx astro dev --port 4407` (Astro 7 agent-detection
gotcha, see frontend `CLAUDE.md`), then point the runner at `localhost:4407`.
