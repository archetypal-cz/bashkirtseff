# CLAUDE.md - Frontend Project

Instructions for Claude Code when working on the Bashkirtseff frontend.

> Docs drift fast here. Before trusting any claim below, verify it against the
> actual code (grep / open the file). If you find this file is wrong, fix it.

---

## Project Context

An **Astro 7** Progressive Web App for reading Marie Bashkirtseff's diary. Content
is loaded at build time from `../../content/` (no CMS, no database for content).
The frontend focuses on:

1. Excellent reading experience
2. Fast, mostly-static pages (the diary is the star; chrome fades back)
3. Accessibility and performance
4. Offline reading via the PWA

The site is a **static build** (`astro build` → `dist/`), served by nginx in a
container (`Dockerfile` + `nginx.conf`), behind Nginx Proxy Manager on the host.
Deployment is automatic via GitHub Actions on push to `main`.

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Framework | **Astro 7** (static output) |
| UI Islands | **Vue 3** (Composition API), via `@astrojs/vue` |
| State | **Pinia** (`src/stores/`) |
| i18n | `vue-i18n` (islands) + a tiny build-time `t()` for `.astro` (`src/i18n/astro.ts`) |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.*`) + `src/styles/branding.css` design tokens |
| PWA | **`@vite-pwa/astro`** (Workbox `generateSW`) |
| Auth | Custom GoTrue-style client (`src/lib/auth.ts`) against `PUBLIC_AUTH_URL` (default `https://auth.bashkirtseff.org`) — used only for the "report an issue" feature. **No `@supabase/supabase-js` SDK.** |

There is **no Supabase JS client, no AdSense / ad system, and no React** in this
codebase. (If you think you need one, grep first — you almost certainly don't.)

---

## Dev server & AI agents (Astro 7 gotcha)

Astro 7 auto-detects AI coding agents (via env vars like `AI_AGENT` / `CLAUDECODE`)
and tries to start `astro dev` as a **background process** — see `astro dev
--background`, `astro dev status`, `astro dev stop`, `astro dev logs`. In sandboxes
that can't spawn a detached process this fails with *"Failed to spawn background dev
server process."*

- A normal human terminal (`just fe-dev`) is **unaffected** — it runs in the foreground.
- To force foreground in an agent shell, unset the detection vars:
  `env -u AI_AGENT -u CLAUDECODE npx astro dev`.

---

## Design System (branding.css)

`src/styles/branding.css` is the **single source of truth** for colors,
typography, spacing and theme variables (light / dark / sepia via
`[data-theme]`). Use its CSS custom properties (e.g. `var(--color-accent)`,
`var(--text-primary)`, `var(--font-serif)`) instead of hardcoding values.
Tailwind utility classes map onto these tokens; component-scoped `<style>` blocks
should reference the variables so theming keeps working.

**Brand variants (`?brand=`):** `branding.css` §6 defines opt-in alternate
palettes via `[data-brand="atelier|deuil|riviera"]` (all forward through the
`--brand-*` tokens, so light/sepia re-theme automatically; dark is explicit).
The pre-paint script in `BaseLayout.astro` reads `?brand=<name>`, persists it to
localStorage `reading-brand`, and applies `data-brand`; `?brand=default`/empty/
unknown clears it. No attribute = the default identity, unchanged.

---

## Project Structure

```
frontend/
├── CLAUDE.md              # This file
├── astro.config.mjs       # Integrations: vue, sitemap, @vite-pwa/astro
├── nginx.conf             # Container server config (try_files =404, 404.html, glossary 301)
├── Dockerfile
├── package.json
├── src/
│   ├── components/        # UI components (.astro static + .vue islands)
│   ├── layouts/           # BaseLayout.astro, ReadingLayout.astro
│   ├── pages/             # Routes (see URL Structure)
│   │   └── data/          # JSON data endpoints (see below)
│   ├── lib/               # content.ts (build-time loader), auth.ts, offline.ts, ...
│   ├── stores/            # Pinia stores (auth, filter, offline)
│   ├── i18n/              # Locale dicts + helpers (astro.ts build-time t(), index.ts)
│   ├── scripts/           # Per-page client scripts (e.g. footnote-popover.ts)
│   └── styles/            # branding.css + globals
└── public/
    └── data/              # Prebuilt JSON (filter-index.json, etc.) — generated, do not hand-edit
```

---

## URL Structure

All diary pages use unified `[lang]` routes driven by `src/lib/diary-lang-config.ts`
(the single source of truth for multi-language routing — path↔content mapping,
locales, feature flags). `DIARY_LANGUAGES` drives `getStaticPaths`.

| Route | Description |
|-------|-------------|
| `/{lang}/` | Year overview (1873-1884) with Marie's age |
| `/{lang}/1873/` | Carnets from 1873 |
| `/{lang}/001/` | Entries in Carnet 001 |
| `/{lang}/001/1873-01-11` | Individual diary entry |
| `/{lang}/000` | **Preface (special carnet — see below)** |
| `/{lang}/carnets` | Flat list of all carnets (translations only) |
| `/{lang}/glossary/` | Glossary index |
| `/{lang}/glossary/NICE` | Glossary entry |

`{lang}` is `cz`, `original`, `en`, `uk`, or `fr`.

### Carnet 000 special-casing

Carnet 000 is the editorial **preface**. Its files are *sections* (`000-01.md`,
`000-02.md`, …), not dated entries. It is rendered as **one merged page** at
`/[lang]/000/index.astro` (all sections inline with `#p-…` anchors). Consequently:

- `[lang]/[carnet]/[entry].astro` and `[lang]/[carnet]/index.astro` **both skip
  carnet 000** in `getStaticPaths` — there are **no `/{lang}/000/000-01/` pages**.
- `lib/offline.ts` filters out section ids (`/^\d{3}-\d{2}$/`) when building cache
  URL lists, so "download for offline" never queues nonexistent section pages.
- The section-vs-date mismatch branch in `[carnet]/index.astro` is defensive only
  (000 never reaches that route).

### Glossary link paths

Each language has its own glossary at `/{lang}/glossary/`. **Rule:** use
`glossaryUrl(lang, id)` from `diary-lang-config.ts` for glossary links so they
match the current language context. Bare `/glossary/<id>` URLs are redirected to
`/original/glossary/<id>` by a **301 in `nginx.conf`** (not by a build-generated
redirect page). The bare `/glossary` → `/original/glossary` redirect lives in
`astro.config.mjs` `redirects`.

---

## Content Loading (`src/lib/content.ts`)

`content.ts` is the build-time content loader (`getCarnets`, `getCarnetEntries`,
`getEntry`, `getGlossaryEntry`, `getThisDayEntries`, …). It reads markdown from
`../../content/` and parses paragraph clusters (`%% XXX.YYYY %%`), glossary tags,
footnotes and `%%`-comment annotations.

**Build caching (PROD-gated):** module-level caches (`_carnetsCache`,
`_entryCache`, glossary file/parse caches, …) make the ~35k-page build tractable.
Parsed-content caching is gated on `import.meta.env.PROD` (`CACHE_PARSED`) so that
**`astro dev` stays live when you edit content** — otherwise the dev server would
serve stale text until restart. Keep that gate in mind if you touch the caches.

---

## Data Endpoints (`src/pages/data/`)

Static JSON emitted at build time, fetched by islands at runtime (keeps heavy data
out of inlined island props / per-page HTML):

- `/data/i18n/{locale}.json` — locale dictionary, fetched by the i18n patch
  instead of inlining ~100 KB per page.
- `/data/this-day/{lang}/{MM-DD}.json` — per-day "this day in Marie's life"
  previews; `ThisDayEntry.vue` fetches only today's file.

Prebuilt data also lives in `public/data/` (e.g. `filter-index.json`) — generated
by `src/scripts/build-filter-index.ts`; do not hand-edit.

---

## PWA (`@vite-pwa/astro`)

Configured in `astro.config.mjs` (`AstroPWA({...})`, Workbox `generateSW`).
Registration happens in **`BaseLayout.astro`** via the virtual module:

```js
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });
```

The manifest `<link>` is emitted from `pwaInfo` (`virtual:pwa-info`) in
`BaseLayout.astro` — do **not** hardcode `/manifest.json` (vite-pwa emits
`/manifest.webmanifest`). There is **no `public/sw.js` and no
`public/manifest.json`**; both are generated. Re-baking those old static files is
the exact mistake that produced the dead-PWA bug — don't.

> **⚠️ `navigateFallback`:** keep it `null` (see the comment in `astro.config.mjs`).
> With Workbox `generateSW`, a `navigateFallback` registers a NavigationRoute
> *before* the runtime caching routes and serves the fallback for **every**
> navigation — even online — on this multi-page site. That took the whole site
> down once. A real offline fallback would need `injectManifest` +
> `setCatchHandler`.

Runtime caching routes (diary index/entry/section pages, `/data/*.json`, fonts)
are in `astro.config.mjs` `workbox.runtimeCaching`. The offline-download feature
(`stores/offline.ts`, `lib/offline.ts`) writes into the same `diary-entries-cache`
so the SW serves those pages offline.

---

## Components: Astro vs Vue

- **`.astro`** for static content, layouts, anything without client-side state.
- **`.vue`** islands for interactivity (paragraph toolbar, language switcher,
  filter, offline download, auth/report). Hydrate with the right directive:
  `client:load` (immediate), `client:idle`, `client:visible`, `client:media`.

Vue app entrypoint: `src/vue-app.ts` (registers Pinia, i18n).

---

## Performance Guidelines

- Keep per-page JS small; heavy data goes to `/data/*.json` endpoints, not inline
  island props or inlined `<script>`.
- The build is large (~35k pages); rely on the `content.ts` caches and avoid
  re-walking the content tree per page.

---

## Language Code Mapping

The app uses two language-code systems:

| System | Czech | French | English | Ukrainian | Original |
|--------|-------|--------|---------|-----------|----------|
| UI Locale (ISO 639-1) | `cs` | `fr` | `en` | `uk` | N/A |
| Content Path / URL | `cz` | `fr` | `en` | `uk` | `original` |

URLs use `/cz/` (not `/cs/`) for historical link stability; the UI locale system
uses ISO `cs`. Helpers in `src/i18n/index.ts`:

```ts
localeToContentPath('cs')  // → 'cz'
contentPathToLocale('cz')  // → 'cs'
```

See [docs/LOCALE_MAPPING.md](docs/LOCALE_MAPPING.md). Note: a
`src/i18n/__tests__/locale-mapping.test.ts` file exists but **there is no test
runner installed** (no vitest/jest) — it does not currently run.

---

## Design Principles

1. **Reading first** — the diary content is the star; UI fades into the background.
2. **Marie's aesthetic** — elegant, 19th-century-inspired, but modern and clean.
3. **Accessibility** — screen readers, keyboard, high contrast, focus management.
4. **Performance** — fast on mobile especially.
5. **Privacy** — minimal tracking.
