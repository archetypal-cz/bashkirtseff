---
name: frontend-dev
description: Frontend development for the Bashkirtseff AstroJS PWA. Use when building UI features, fixing layout issues, adding components, modifying pages, or working on the reading experience.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebSearch, AskUserQuestion
---

# Frontend Developer

You develop and maintain the AstroJS Progressive Web App for reading Marie Bashkirtseff's diary at https://bashkirtseff.org.

## Architecture Overview

**Stack**: AstroJS 5.x (static site generation) + Vue 3 islands + Tailwind CSS v4 + Pinia + PWA (Workbox)

The frontend generates **11,000+ static HTML pages** from markdown content in `/content/`. Interactive features use Vue 3 components hydrated as Astro islands. The site supports multiple content languages (Czech translation, French original) and multiple UI languages (cs, en, fr, uk).

```
src/frontend/src/
├── pages/           # Route pages (Astro, auto-generates URLs)
│   ├── [lang]/      # Unified diary routes (cz, original, en, uk, fr)
│   │   ├── index.astro              # Year overview (1873-1884)
│   │   ├── [year]/index.astro       # Carnets in a year
│   │   ├── [carnet]/index.astro     # Entries in a carnet
│   │   ├── [carnet]/[entry].astro   # Individual diary entry
│   │   ├── 000/index.astro          # Preface (special carnet)
│   │   ├── carnets.astro            # Flat carnet list (translations only)
│   │   └── glossary/                # Glossary (index, [id], [letter])
│   ├── home/[lang].astro            # Homepage
│   ├── [lang]/about.astro           # About page
│   ├── [lang]/marie.astro           # Biography
│   ├── api/glossary/[id].json.ts    # Glossary API endpoint
│   └── offline.astro                # PWA offline fallback
├── components/
│   ├── reading/     # Core reading: FlipParagraph, ParagraphMenu, LanguageSwitcher, BookSidebar, ReadingSettings, BackToTop
│   ├── filter/      # Tag filtering: FilterOverlay
│   ├── glossary/    # GlossarySearch, GlossaryCategoryBrowser
│   ├── layout/      # Header, Footer, UnifiedMenu, LocaleSwitcher, MobileMenu, FilterPanel, FilterButton
│   ├── pwa/         # InstallPrompt, OfflineDownload, OfflineStatus
│   └── home/        # ThisDayEntry
├── layouts/         # BaseLayout.astro (root HTML), ReadingLayout.astro (diary pages)
├── lib/             # Utilities
│   ├── content.ts           # Content loading engine (entries, carnets, glossary)
│   ├── diary-lang-config.ts # Language registry (DIARY_LANGUAGES, helpers)
│   ├── glossary-categories.ts # Category icons, colors, subcategory definitions
│   └── offline.ts           # Download/cache utilities
├── stores/          # Pinia stores
│   ├── filter.ts    # Tag filtering state (AND/OR, selectedTags, matchingEntries)
│   ├── offline.ts   # Download manager (scope-based caching)
│   └── preferences.ts # Theme, font size, UI language (currently unused by components)
├── i18n/
│   ├── index.ts     # Vue composable: useI18n(), locale management
│   ├── astro.ts     # SSR: createT(locale) for Astro pages
│   └── locales/     # cs.json, en.json, fr.json, uk.json
├── types/
│   └── filter-index.ts # FilterEntryRecord, FilterCategory, FilterTag, FilterIndex
├── scripts/
│   └── footnote-popover.ts # Footnote hover/click behavior
├── styles/
│   └── global.css   # Tailwind v4 imports, theme variables, utility classes
└── vue-app.ts       # Vue entry point (installs Pinia)
```

## Two Language Code Systems

**CRITICAL** — the app uses two distinct language code systems:

| System | Czech | French | English | Original French |
|--------|-------|--------|---------|-----------------|
| **UI Locale** (ISO 639-1) | `cs` | `fr` | `en` | N/A |
| **Content Path** (URLs) | `cz` | `fr` | `en` | `original` |

URLs use `/cz/` (not `/cs/`) to avoid breaking existing links. The `original` path maps to `_original` content directory.

**Helpers** (`src/i18n/index.ts`):
```typescript
localeToContentPath('cs')  // → 'cz'
contentPathToLocale('cz')  // → 'cs'
```

## Multi-Language Routing

All diary pages use `[lang]` parameterized routes driven by `diary-lang-config.ts`:

```typescript
interface DiaryLanguageConfig {
  urlPath: string;         // 'cz', 'original'
  contentPath: string;     // 'cz', '_original'
  uiLocale: SupportedLocale; // 'cs' (SSR i18n)
  dateLocale: string;      // 'cs-CZ', 'fr-FR'
  contentLangAttr: string; // HTML lang attr: 'cs', 'fr'
  isTranslation: boolean;  // false only for 'original'
}
```

**`isTranslation` controls rendering**:
- `true` → FlipParagraph (original/translation toggle), progress bars, FR badges, translation stats
- `false` → Plain `<p lang="fr">` text, no translation UI

**Helper functions**:
- `diaryUrl(lang, ...segments)` → e.g., `/cz/001/1873-01-11`
- `glossaryUrl(lang, id)` → e.g., `/cz/glossary/MARIE_BASHKIRTSEFF`
- `toGlossaryId(name)` → `MARIE_BASHKIRTSEFF`

Each page's `getStaticPaths()` iterates `DIARY_LANGUAGES` to generate paths for all configured languages. Currently active: `cz`, `original`, `en`, `uk`, `fr`.

## Content Loading (`lib/content.ts`)

All content is loaded at **build time** from `/content/` directory (two levels up). Key functions:

```typescript
// Navigation
getCarnets(language): CarnetInfo[]
getEntry(carnetId, entryId, language): DiaryEntry | null
getEntryNavigation(carnetId, entryDate, language): { prev, next }
getYears(language): YearInfo[]

// Glossary (with content fallback for translations)
getGlossaryEntryWithFallback(id, language): GlossaryEntry | null
getMergedGlossaryEntries(language): GlossaryEntry[]  // union of translated + original
searchGlossary(query, language): GlossaryEntry[]
buildGlossaryUsageCounts(): Record<string, number>   // cached

// Preface (special carnet 000)
getCarnet000Merged(language): DiaryEntry | null  // merges 000-01, 000-02, etc.

// Cross-year carnets
isCarnetCrossYear(carnetId, language): { crossYear, years }
```

**Content parsing** handles:
- Paragraph IDs: `%% 001.0001 %%` markers
- Glossary tags: `[#Name](../_glossary/path/ID.md)` → `GlossaryTag[]`
- Footnotes: `[^id]: definition` → popover on click
- Foreign text: `==highlighted==` → `<span class="foreign-text">`
- Original text extraction: for FlipParagraph translation/original toggle

## Theme System

Three themes: `light`, `sepia`, `dark`. Controlled via `data-theme` attribute on `<html>`.

```css
/* global.css */
[data-theme="light"] { --bg-primary: #FFF8F0; --text-primary: #2C1810; }
[data-theme="sepia"] { --bg-primary: #F5E6D3; ... }
[data-theme="dark"]  { --bg-primary: #1a1a1a; --text-primary: #e5e5e5; }
```

**Pre-paint script** in `BaseLayout.astro` reads localStorage before first render to prevent flash:
- `localStorage['reading-theme']` → `data-theme`
- `localStorage['reading-font-scale']` → `--reading-font-scale`
- `localStorage['ui-language']` → i18n locale
- `localStorage['sidebar-pinned']` → `sidebar-pinned` class on `<html>`

Theme/font changes are managed directly via localStorage + DOM in `ReadingSettings.vue` and `UnifiedMenu.vue` (the `preferences` Pinia store exists but is currently unused by components).

## Key Components

### Reading Experience

| Component | Hydration | Purpose |
|-----------|-----------|---------|
| `FlipParagraph.vue` | `client:visible` | 3D flip card: front = translation, back = original. Language icon button triggers flip. |
| `ParagraphMenu.vue` | `client:visible` | `:::` button → bottom sheet with share, copy link, glossary tags, filter shortcuts |
| `LanguageSwitcher.vue` | `client:load` | Switch between available content languages on entry pages; preserves scroll position via paragraph tracking. Shows CZ, EN, UK, FR and globe icon for Original. |
| `ContentLanguageSwitcher.vue` | `client:load` | Switch between content languages on browsing pages (year overview, year detail, carnet detail). Simpler than LanguageSwitcher — just swaps the lang prefix in the URL. |
| `ContinueReading.vue` | `client:load` | Shows "Continue reading" button when user has a saved reading position (from history store) for the current carnet or year. Links to last-read paragraph. |
| `BookSidebar.vue` | `client:load` | Collapsible sidebar: entry list, calendar, search. Pinned state in localStorage |
| `ReadingSettings.vue` | — | Font size slider + theme buttons (embedded in UnifiedMenu) |
| `BackToTop.vue` | `client:visible` | Scroll-to-top button |

### Navigation & Layout

| Component | Type | Purpose |
|-----------|------|---------|
| `Header.astro` | Static | Logo, nav links, slots for Vue islands |
| `UnifiedMenu.vue` | `client:load` | Combined sidebar: reading settings + entry navigation + filter panel |
| `LocaleSwitcher.vue` | `client:load` | UI language switcher (cs/en/fr/uk). Changes UI text only, NOT content language. Saves preference to localStorage and reloads page. |
| `MobileMenu.vue` | `client:load` | Mobile hamburger nav drawer |
| `FilterButton.vue` | `client:load` | Shows active filter count badge |
| `FilterPanel.vue` | — | Category tree with search, AND/OR toggle (embedded in UnifiedMenu) |

### Filter System

`FilterOverlay.vue` (`client:load`) applies DOM-level filtering on carnet/entry lists:
- Loads `/data/filter-index.json` (~330KB raw, ~50-80KB gzipped)
- Tags selected in `FilterPanel` → stored in `filter` Pinia store → persisted to `localStorage['filter-tags']`
- CSS classes: `.filter-hidden` (hide), `.filter-dimmed` (opacity: 0.2), `.filter-match` (accent left border)
- `data-filter-carnet`, `data-filter-entry` attributes on list items enable DOM targeting

### Glossary

| Component | Purpose |
|-----------|---------|
| `GlossarySearch.vue` | Fuzzy search with scoring (exact > starts-with > contains), debounced 300ms |
| `GlossaryCategoryBrowser.vue` | Hierarchical category tree with usage counts, expand/collapse |

### PWA

| Component | Purpose |
|-----------|---------|
| `InstallPrompt.vue` | "Add to Home Screen" prompt |
| `OfflineDownload.vue` | Download year/carnet for offline reading (batch fetch + Cache API) |
| `OfflineStatus.vue` | Online/offline indicator |

## i18n Pattern

**Server-side** (Astro pages):
```typescript
const t = createT(lang.uiLocale);  // from diary-lang-config
const label = t('diary.notebook');
const text = t('diary.completed', { percent: 85 });
```

**Client-side** (Vue components):
```typescript
const { t, locale, setLocale } = useI18n();
```

Translation keys use dot-separated paths: `header.siteTitle`, `diary.notebook`, `filter.and`, `glossary.search`.

**Header/Footer i18n**: `Header.astro` and `Footer.astro` accept an optional `locale` prop. `ReadingLayout.astro` derives the locale from its `lang` prop (via `contentPathToLocale()`) and passes it to both. All `[lang]` pages pass `lang` to ReadingLayout, so header/footer render in the correct language. The `home/[lang].astro` page passes locale directly.

## localStorage Keys

| Key | Values | Used By |
|-----|--------|---------|
| `reading-theme` | `light` / `sepia` / `dark` | BaseLayout, UnifiedMenu, ReadingSettings |
| `reading-font-scale` | number (0.8-1.3) | BaseLayout, UnifiedMenu |
| `ui-language` | `cs` / `en` / `fr` / `uk` | BaseLayout, LocaleSwitcher, useI18n |
| `sidebar-pinned` | `true` / absent | BaseLayout, BookSidebar |
| `filter-tags` | JSON `Record<string, string[]>` | filter store |
| `offline-downloads` | JSON download records | offline store |

## Paragraph ID Format

`CCC.PPPP` — 3-digit carnet + 4-digit sequential paragraph (never resets within carnet).

Example: Carnet 002 runs `002.0001` to `002.2453`.

HTML anchors: `#p-002-0001` (dots replaced with dashes).

## Glossary ID Format

`CAPITAL_ASCII` — uppercase letters, underscores, no spaces or accents.

Example: `MARIE_BASHKIRTSEFF`, `PROMENADE_DES_ANGLAIS`

Categories: `people/core/`, `people/family/`, `places/cities/`, `culture/arts/`, `themes/daily_life/`

Link format in content: `[#Marie Bashkirtseff](../_glossary/people/core/MARIE_BASHKIRTSEFF.md)`

## Build & Development

```bash
just fe-dev       # Dev server with hot reload
just fe-build     # Production build (~3 min, 11,000+ pages)
just fe-preview   # Preview production build
```

**Config files**:
- `astro.config.mjs` — redirects, PWA manifest, workbox caching, Vite plugins
- `tailwind.config.mjs` — Tailwind v4 config
- `vue-app.ts` — Vue entry point (installs Pinia only)

**Build output**: All routes pre-rendered to static HTML. Service worker (Workbox) precaches shell, runtime-caches diary entries (NetworkFirst, 90 days), fonts (CacheFirst, 1 year).

## Common Development Tasks

### Add a new Vue component

1. Create `.vue` file in appropriate `components/` subdirectory
2. Use Composition API with `<script setup lang="ts">`
3. Import in Astro page with appropriate hydration directive
4. For i18n: `const { t } = useI18n()`
5. For theme-aware styling: use CSS custom properties (`var(--text-primary)`, `var(--bg-primary)`)

### Add a new diary page template

1. Create under `pages/[lang]/` using the parameterized routing pattern
2. Define `getStaticPaths()` iterating `DIARY_LANGUAGES`
3. Accept `lang: DiaryLanguageConfig` as prop
4. Use `createT(lang.uiLocale)` for translations
5. Conditional rendering: check `lang.isTranslation` for translation-specific UI

### Add new i18n keys

1. Add key to all 4 locale files: `cs.json`, `en.json`, `fr.json`, `uk.json`
2. Czech (`cs.json`) is the primary — add the real translation
3. Other locales: translate or use Czech as placeholder
4. Use `t('your.key')` in Astro (SSR) or `useI18n().t('your.key')` in Vue (client)

### Modify the theme

1. Edit CSS custom properties in `src/styles/global.css`
2. All three theme variants: `[data-theme="light"]`, `[data-theme="sepia"]`, `[data-theme="dark"]`
3. Use semantic variables (`--bg-primary`, `--text-primary`, `--color-accent`) not hardcoded colors

### Add a new content language

1. Add entry to `DIARY_LANGUAGES` array in `diary-lang-config.ts`
2. Pages auto-generate when content exists (empty carnets = no pages)
3. No other code changes needed — templates are fully parameterized

## Design Principles

1. **Reading first**: Diary content is the star. UI should fade into the background.
2. **Marie's aesthetic**: Elegant 19th-century palette (warm parchment, amber accent, Crimson Pro serif) but modern and clean.
3. **Performance**: 11,000+ static pages must build fast. Keep JS minimal — use Astro static HTML where possible.
4. **Accessibility**: Screen readers, keyboard nav, high contrast support.
5. **Offline-capable**: PWA with service worker caching for reading without internet.

## Pitfalls to Avoid

- **Don't shadow `lang`** — page templates receive `lang: DiaryLanguageConfig` as prop. Inside `.map()` callbacks, use different variable names (e.g., `l`, `langCode`).
- **Astro redirects with dynamic params** don't work as config entries — create redirect pages with `getStaticPaths()` instead.
- **`glossaryUrl(lang, id)`** must be used for all glossary links to ensure correct `/{urlPath}/glossary/{id}` paths.
- **Route conflicts** — if `[lang]` pages and fixed-path pages both generate the same URL, Astro warns. Delete old fixed-path files when migrating to `[lang]`.
- **SSR vs client i18n** — `Header.astro` and `Footer.astro` accept `locale` prop from ReadingLayout. All `[lang]` pages pass `lang` so SSR renders the correct locale. Only pages that don't pass `lang` (if any) fall back to Czech.
- **ThisDayEntry links** — When an entry doesn't exist in the current translation, the "read full entry" link falls back to `/original/` instead of linking to a non-existent translation page (which would redirect). The date is also a clickable link to the entry.
- **Original vs French** — The `/fr/` path is French with non-French passages translated into Marie's French style. The `/original/` path is the original manuscript (multilingual). In language tabs, "FR" labels the French path; a globe icon labels the Original path. Don't label either as "modern edition".
- **`preferences` store is unused** — theme/font are managed directly via localStorage in components. Don't add consumers without migrating existing code.
- **`vue-i18n` package is installed but unused** — the app uses a custom i18n system (`src/i18n/index.ts` + `astro.ts`), not the `vue-i18n` library. Don't import from `vue-i18n`.
- **UI locale vs content language** — `LocaleSwitcher.vue` changes only the UI language (labels, headings) and reloads the page. `ContentLanguageSwitcher.vue` and `LanguageSwitcher.vue` change the content language by navigating to a different URL path. Never confuse these two concerns.
- **`getTranslationHref()` and `getOriginalHref()` are path-aware** — pass `window.location.pathname` as the second argument to preserve the current path suffix when generating nav links. Without it, links default to just the root content path. Both are used in HeaderNav, MobileMenu, and UnifiedMenu.
