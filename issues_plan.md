# Frontend + Shared Codebase Audit — Issues & Plan

Audit date: 2026-06-12. Scope: `/src/frontend` (Astro PWA), `/src/shared`, content-loading pipeline.
All issues below were verified against the actual code and, where possible, against the **live site** (bashkirtseff.org) and a production build run (`just fe-build`, log in `/tmp/fe-build.log`).

---

## CRITICAL

### C1. Service worker is never registered — PWA and all offline features are dead

- **Files:** no registration code exists anywhere in `src/frontend/src/` (only `src/frontend/src/stores/offline.ts:80` *listens* for `controllerchange`); `src/frontend/astro.config.mjs:57-172` configures `@vite-pwa/astro`.
- **What's wrong:** `@vite-pwa/astro` generates `dist/sw.js` and `dist/registerSW.js`, but the integration does not auto-inject registration into Astro pages — the app must call `virtual:pwa-register` (or include the generated `registerSW.js`). Nothing does. Verified live: `https://bashkirtseff.org/sw.js` exists (200) but no page contains `registerSW`/`navigator.serviceWorker.register`.
- **Why it matters:** No install-ability, no offline behavior at all. The entire offline-download feature (`stores/offline.ts`, `lib/offline.ts`, `OfflineDownload.vue`, `OfflineStatus.vue`, `offline.astro`, the `offline-manifest.json` freshness system) writes pages into `diary-entries-cache`, but without a controlling SW nothing ever *serves* from that cache — users who "download for offline" get nothing when offline.
- **Fix:** Add a small script in `BaseLayout.astro` head (or a `src/pwa.ts` imported on every page): `import { registerSW } from 'virtual:pwa-register'; registerSW({ immediate: true })`. Re-verify with DevTools → Application → Service Workers and an offline navigation test.

### C2. Manifest link points to a 404 — `manifest.json` doesn't exist

- **Files:** `src/frontend/src/layouts/BaseLayout.astro:90` (`<link rel="manifest" href="/manifest.json" />`); `public/` contains no `manifest.json`.
- **What's wrong:** vite-pwa emits `/manifest.webmanifest`, but the layout hardcodes `/manifest.json`. Verified live: `/manifest.json` → 404, `/manifest.webmanifest` → 200 but is referenced by nothing.
- **Why it matters:** Browsers see a broken manifest → install prompt (`InstallPrompt.vue` waits for `beforeinstallprompt`) will never fire on most browsers. Combined with C1 the app fails every PWA criterion.
- **Fix:** Use the integration's `pwaInfo` (`virtual:pwa-info`) to render the correct link tag in `BaseLayout.astro`, or change the href to `/manifest.webmanifest`.

### C3. Translation parser silently drops paragraphs — visible content loss on the live site

- **Files:** `src/frontend/src/lib/content.ts:481-630` (`parseParagraphs`, translation branch: ID detection requires `^%% ID %%$` on its own line, content.ts:566); content side: 30 translation files, mostly `content/cz/017/*.md`.
- **What's wrong:** 30 translation files have paragraph IDs (`%% 017.0301 %%`) embedded mid-line instead of on standalone lines. The line-based parser only recognizes standalone IDs, so everything after the first inline ID is treated as comment garbage of one giant paragraph. Verified live: `content/cz/017/1874-03-14.md` has 14 paragraph IDs; `https://bashkirtseff.org/cz/017/1874-03-14/` renders only **3** paragraphs — ~80 % of the entry's translated text is missing in production.
  - Detection script result: 30 affected files across cz (carnet 017 worst), found by comparing total vs standalone-line ID counts.
- **Why it matters:** Silent loss of finished, reviewed translation work; readers see truncated entries; nobody is alerted.
- **Fix (two parts):**
  1. Normalize the 30 content files (script: re-insert newlines before/after `%% NNN.NNNN %%` markers).
  2. Make the parser resilient: split on the ID regex over the whole content (as the `original` branch already does) instead of line-by-line, and/or emit a build-time warning when `total IDs > parsed paragraphs`.

### C4. Site-wide soft-404s; robots.txt and sitemap.xml serve homepage HTML with HTTP 200

- **Files:** no `src/frontend/src/pages/404.astro`; no `public/robots.txt`; no sitemap integration in `astro.config.mjs` / `package.json`; deploy-server catch-all rewrite (see `docs`/deploy config on aretea).
- **What's wrong:** Verified live: `https://bashkirtseff.org/this-page-does-not-exist-xyz` → **200** with the JS-redirect homepage; `/robots.txt` and `/sitemap.xml` → **200 with HTML content** (the noindex redirect page). The hosting config falls back to `/index.html` for any missing path.
- **Why it matters:** Search engines see ~infinite duplicate soft-404 pages; robots.txt is invalid (parsed as garbage); there is no sitemap for a ~20,000-page site whose whole point is being found and read. This badly hurts indexing of the diary.
- **Fix:** Add `404.astro` (Astro emits `404.html`), configure nginx `error_page 404 /404.html` and remove the index.html catch-all; add `public/robots.txt` referencing a sitemap; add `@astrojs/sitemap` (site URL is already set in `astro.config.mjs:22`).

---

## HIGH

### H1. Home pages ship a 1.15 MB Vue island prop (`ThisDayEntry` gets the whole year of data)

- **Files:** `src/frontend/src/pages/home/[lang].astro:35,120-126`; `src/frontend/src/lib/content.ts:2143` (`buildThisDayData`).
- **What's wrong:** `buildThisDayData()` builds previews for *every* entry of *every* day of the year and the whole map is passed as an island prop. Verified live: `/home/cs/` is **1.21 MB of HTML**, of which a single `astro-island props` attribute is **1,149,609 bytes**.
- **Why it matters:** The landing page (the first page every visitor hits after the root redirect) downloads >1 MB before rendering anything interactive; terrible LCP on mobile; ×4 languages in dist.
- **Fix:** Emit per-day JSON at build time (`/data/this-day/MM-DD.json`, ~366 small files via a script or `getStaticPaths` JSON endpoint) and have `ThisDayEntry.vue` fetch only today's file; or render "this day" server-side for the build date with a small client-side correction.

### H2. `I18nPatch` inlines 103 KB of locale JSON into every page

- **Files:** `src/frontend/src/components/I18nPatch.astro:20-34`; included by `ReadingLayout.astro:54` → every diary/glossary page (~20k pages).
- **What's wrong:** All four locale files are serialized into an inline `<script>` per page. Verified live: a short entry page (`/cz/001/1873-01-11/`) is 149 KB, of which **103 KB** is this inline script.
- **Why it matters:** ~100 KB of identical, uncacheable bytes on every page view; roughly 2 GB of duplication in `dist/`; directly against the project's own "JS under 100KB" guideline.
- **Fix:** Move the locale dictionary to a static `/i18n/messages.js` (or four per-locale files; fetch only the user's non-default locale) loaded with a regular cacheable `<script src>`; the patch logic itself is ~1 KB. Alternative: only embed the keys actually used on the page (collect `data-t` keys during render).

### H3. Every entry page eagerly fetches the 833 KB filter index on mount

- **Files:** `src/frontend/src/components/reading/EntryContent.vue:41-44` (`onMounted → filterStore.loadIndex()`); `src/frontend/src/stores/filter.ts:96-108`; index generated at 833 KB (see `/tmp/fe-build.log` head: "File size: 833 KB").
- **What's wrong:** `loadIndex()` unconditionally fetches `/data/filter-index.json` on every entry page, even though it is only needed when an entity filter is active.
- **Why it matters:** ~833 KB per session (no SW cache — see C1; depends on HTTP cache headers otherwise) for a feature most readers never touch.
- **Fix:** Call `loadIndex()` lazily — only when `filterStore` has persisted selected tags or when the filter UI is opened. Consider splitting the index per-carnet.

### H4. Glossary page builds are O(N²) — full directory walk + re-parse per page

- **Files:** `src/frontend/src/lib/content.ts:1434-1530` (`findGlossaryFiles` walks all ~3,259 files with `statSync` each; `getGlossaryEntry` calls it per lookup; `getGlossaryEntries` re-parses everything); consumers: `pages/[lang]/glossary/[id].astro:8-37` (×5 langs), `pages/glossary/[id].astro`, `pages/api/glossary/[id].json.ts`, glossary index/letter pages.
- **What's wrong:** No caching: `getStaticPaths` parses all glossary entries 6×, then *each* of ~16,000 glossary-derived pages re-walks the glossary tree (and `getGlossaryEntryWithFallback` does it twice). Measured in the build log: original glossary pages ~13 ms, translated glossary pages **250–340 ms each** → glossary alone adds ~60+ minutes of build time.
- **Why it matters:** With ~3,800 entries × 5 langs + ~3,259 glossary IDs × 6 routes, total build time balloons (build was still running after 10+ minutes at page ~10,000 of ~35,000+).
- **Fix:** Add module-level caches in `content.ts` mirroring `_usageCountsCache` (content.ts:1993): cache `findGlossaryFiles()` per glossary root, cache parsed `GlossaryEntry` per path, and cache `getCarnets`/`getCarnetEntries`/parsed `getEntry` results keyed by `lang/carnet/id`. The data is immutable during a build; this is a one-file change that should cut build time by an order of magnitude.

### H5. Entry/carnet/year page builds re-parse every entry 3–4×

- **Files:** `src/frontend/src/pages/[lang]/[carnet]/index.astro:47-88` (`getCarnetSummary` parses every entry, then `getEntry` *and* `getEntryPreview` — which internally calls `getEntry` again — per entry); `pages/[lang]/[year]/index.astro:81-88` re-derives all-years totals per page; `home/[lang].astro:35` (`buildThisDayData` parses the whole corpus per language, uncached).
- **Why it matters:** Same as H4 — multiplied file I/O and parsing; `getEntryPreview` (content.ts:2042) calling `getEntry` again doubles the cost everywhere it's used.
- **Fix:** Covered by the `getEntry` cache in H4; additionally let `getEntryPreview` accept an already-loaded `DiaryEntry`.

### H6. No hreflang alternates anywhere on a 5-variant multilingual site

- **Files:** `src/frontend/src/layouts/BaseLayout.astro` (head has canonical + og:locale but no `<link rel="alternate" hreflang>`); verified with repo-wide grep — zero occurrences.
- **What's wrong:** The same entry exists at `/cz/...`, `/original/...`, `/en/...`, `/uk/...`, `/fr/...` with no alternate annotations, and the root `/` is a `noindex` JS redirect (no server-side language negotiation, `pages/index.astro`).
- **Why it matters:** Search engines can't associate the language variants; wrong-language results for users; duplicate-content ambiguity between `/original/` and `/fr/` (both `lang="fr"`).
- **Fix:** In `ReadingLayout`/`BaseLayout`, for diary routes emit hreflang links for all `DIARY_LANGUAGES` (using availability where cheap) + `x-default`. Also add hreflang pairs for `/home/{cs,en,fr,uk}` and the `/cs/about`-style static pages.

---

## MEDIUM

### M1. SW runtime-cache patterns miss suffixed entry URLs and data files

- **Files:** `src/frontend/astro.config.mjs:150` (`/\/(cz|original|en|uk|fr)\/\d+\/\d{4}-\d{2}-\d{2}\/?$/`).
- **What's wrong:** 41 original entries (plus translations) have IDs like `1877-01-07-09` or `1878-10-04-evening` (`content/_original/068/...`); the regex requires the URL to *end* after `YYYY-MM-DD`, so these pages never match the `diary-entries-cache` route — even after C1 is fixed, the offline-download feature caches them but the SW won't serve them. Also `/data/filter-index.json` and `/data/offline-manifest.json` are neither precached (globPatterns has no `json`) nor runtime-cached, so the filter and offline-status UIs break offline; glossary pages have no caching route at all.
- **Fix:** Loosen the pattern to `/\/(cz|original|en|uk|fr)\/\d{3}\/\d{4}-\d{2}-\d{2}[^/]*\/?$/`, add a runtime route for `/data/*.json` (StaleWhileRevalidate) and optionally `/{lang}/glossary/...`.

### M2. `html lang` is overwritten by UI-language preference on content pages

- **Files:** `src/frontend/src/layouts/BaseLayout.astro:133-142` (inline script sets `document.documentElement.lang` from `localStorage['ui-language']`).
- **What's wrong:** A French original page (`lang="fr"` from `ReadingLayout` → `contentLangAttr`) gets relabeled `cs`/`uk`/... as soon as the user's UI preference differs. Screen readers will read French diary text with Czech pronunciation rules; search engines that execute JS see wrong lang.
- **Fix:** Don't override on pages whose primary content is the diary (the per-paragraph `:lang` in `ParagraphToolbar.vue:195` is correct — keep document lang = content lang; UI chrome elements can carry their own `lang` attribute if needed).

### M3. Nav links lose language context (`/glossary`, `/about`, `/marie`)

- **Files:** `src/frontend/src/components/layout/HeaderNav.vue:24,30`; `UnifiedMenu.vue:427`; `Footer.astro:38,43`.
- **What's wrong:** Hardcoded `/glossary` → 301 → `/original/glossary` even when reading `/cz/...` (violates the project rule "use `glossaryUrl(lang, id)`" in `src/frontend/CLAUDE.md`). `/about`, `/marie` go to root pages that SSR in Czech (default `lang='cs'`), while localized variants exist at `/cs/about` etc.
- **Why it matters:** Czech reader lands in the French-original glossary; localized about-pages are unreachable from nav; `/about` + `/cs/about` are duplicate content with self-canonicals.
- **Fix:** Make these components locale-aware (they're Vue islands with `useI18n` already; derive prefix from `window.location` like `getTranslationHref` does, or pass the lang from the layout).

### M4. Meta description bug: literal `"undefined..."` + English-only descriptions

- **Files:** `src/frontend/src/pages/[lang]/[carnet]/[entry].astro:55-59`.
- **What's wrong:** `entry.paragraphs[0]?.html?.replace(...)?.slice(0,160)?.trim() + '...' || ''` — precedence: when there are no paragraphs the expression is `undefined + '...'` = `"undefined..."` (truthy), so the page description becomes `"Diary entry from ... . undefined..."`. Affects every empty/untranslated entry page. Additionally the prefix `"Original Diary entry from..."` is hardcoded English for all five languages, and carnet/year/glossary pages pass no description at all (falling back to the generic English default in BaseLayout:21).
- **Fix:** `const firstParagraphText = entry.paragraphs[0]?.html ? ... + '…' : '';` and localize via `t()`.

### M5. Duplicate glossary IDs cause route collisions (build warnings) and ambiguous lookups

- **Files:** `content/_original/_glossary/places/theaters/THEATER.md` vs `culture/themes/THEATER.md`; `culture/social_customs/PROMENADE.md` vs `people/mentioned/PROMENADE.md`. Build log: 14× `[WARN] Could not render ... conflicts with higher priority route` across all 7 glossary routes.
- **What's wrong:** Glossary IDs are assumed unique; `getGlossaryEntry` (content.ts:1481) returns whichever file the directory walk finds first; one of each duplicate pair is unreachable.
- **Fix:** Rename/merge the duplicates (e.g. `THEATER_THEME`), and add a uniqueness check to `findGlossaryFiles` or a `just` lint command that fails the build on duplicate IDs.

### M6. Language switch links can target untranslated (nonexistent) entry pages

- **Files:** `src/frontend/src/i18n/index.ts:135-152` (`getTranslationHref` blindly preserves the path suffix); used by `HeaderNav.vue` / `UnifiedMenu` nav.
- **What's wrong:** On `/original/068/1877-01-07-09` switching UI language to Czech yields `/cz/068/1877-01-07-09`, which is only generated if the translation exists (`[entry].astro getStaticPaths` builds translation entry pages only from translated files) → 404 (and with C4, a soft-404 redirect home). The dedicated `LanguageSwitcher` on entry pages checks `availableLanguages`, but the header nav does not.
- **Fix:** For entry-level paths, have the nav fall back to the carnet index (`/cz/068/`) — carnet indexes exist for all languages (union logic in `[carnet]/index.astro:17-31`).

### M7. PWA manifest content: Czech-only, start_url is a noindex JS-redirect page

- **Files:** `src/frontend/astro.config.mjs:63-79`.
- **What's wrong:** `name`/`description` are Czech regardless of user language; `start_url: '/'` opens the JS redirect page on every PWA launch (extra hop, and `/home/cs` without trailing slash adds another redirect — `pages/index.astro` script uses `"/home/"+a`).
- **Fix:** Either neutral name ("Marie Bashkirtseff — Diary") or per-locale manifests; `start_url: '/?source=pwa'` is fine but consider pointing at `/home/en` or keeping `/` and making the redirect server-side.

### M8. Timezone-dependent date logic in build pipeline

- **Files:** `src/frontend/src/lib/content.ts:153-157` (`parseDateFromEntryId` → `new Date('YYYY-MM-DD')` = UTC midnight) combined with `.getFullYear()`/`.getMonth()` (local) in `getYears`, `getCarnetsByYear`, `getEntriesByYear`, `calculateMarieAge`, and date formatting in pages.
- **What's wrong:** On a build machine west of UTC, every `YYYY-01-01` entry is attributed to the previous year (cross-year carnet logic, year pages, "this day" keys). Currently builds run on UTC/CET so it's latent, but it will silently corrupt year grouping if CI ever changes region.
- **Fix:** Parse with explicit UTC accessors (`getUTCFullYear()`), or split the string arithmetic (the entry ID already *is* the date — `parseInt(entryId.slice(0,4))`).

### M9. Three different birth dates for Marie across the codebase

- **Files:** `src/frontend/src/lib/content.ts:1273-1278` & `2120-2134` (born **1858-11-11**); `src/frontend/src/layouts/BaseLayout.astro:109` (schema.org **1858-11-24**); `src/shared/src/parser/frontmatter.ts:81` (**1860-11-24**, "claimed date", used by `calculateMarieAge` in shared).
- **Why it matters:** Displayed ages ("Marie was N years old") differ by up to 2 years depending on which helper computed them; scholarly project credibility.
- **Fix:** Single exported constant in `@bashkirtseff/shared` with real (1858-11-24 N.S.) and claimed dates, used everywhere; document which is shown.

### M10. Carnet 000 special-casing is partially broken for naming-mismatch translations

- **Files:** `src/frontend/src/pages/[lang]/[carnet]/index.astro:58-79` handles section-vs-date mismatch, but `[entry].astro:16` skips carnet 000 entirely while `getCarnets()` includes it, and `lib/offline.ts` year/carnet URL building assumes date IDs (section URLs `/000-01/` covered by a separate SW route, astro.config.mjs:135 — but only after C1).
- **Fix:** Audit 000 navigation paths once; add an e2e smoke test for `/cz/000`, `/original/000`.

---

## LOW

### L1. Dead code / unused components

- `src/frontend/src/components/layout/MobileMenu.vue`, `components/reading/OriginalTextToggle.vue`, `components/layout/FilterButton.vue` — zero references.
- `FlipParagraph.vue` used only by `pages/[lang]/000/index.astro` (rest of the app uses `ParagraphToolbar`) — consolidate.
- Legacy aliases in `content.ts` (`getBooks`, `getBookEntries`, `hasBook00*`, `BookInfo`) — referenced nowhere else; remove.
- `src/i18n/__tests__/locale-mapping.test.ts` exists but no test runner is installed (no vitest/jest in any package.json) — the "test" never runs.
- `package.json` has `lint`/`format` scripts but no eslint/prettier config or dependency in the frontend — `npm run lint` fails.

### L2. Hand-rolled YAML parser duplicates shared `parseFrontmatter`

- **Files:** `src/frontend/src/lib/content.ts:1544-1616` (manual line-based YAML for glossary frontmatter) vs `src/shared/src/parser/frontmatter.ts` (proper `yaml` library, already imported by content.ts).
- **Why it matters:** The manual parser mishandles nested objects, quoted colons, multi-line strings — silent metadata loss for glossary entries. Replace with `parseFrontmatter` from shared.

### L3. Stale hardcoded "Diary volumes" data on the home page

- **Files:** `src/frontend/src/pages/home/[lang].astro:23-28` — hardcoded carnets `000/001/002/015` with entry counts (99/143/434) that don't match reality and never update.
- **Fix:** Derive from `getCarnets('_original')` (cheap once H4 caching exists), or curate explicitly with a comment.

### L4. In-text glossary links use a relative path that breaks under trailing-slash URLs

- **Files:** `src/frontend/src/lib/content.ts:415-428` (`processTextToHtml` emits `href="../glossary/{id}"`).
- **What's wrong:** From `/cz/001/1873-01-11/` (directory-format URL), `../glossary/X` resolves to `/cz/001/glossary/X` → 404. Rare in practice (most glossary links live in `%%` comments and surface via `ParagraphToolbar`, which builds absolute URLs), but the code path exists for visible `.md` links and in glossary/summary paragraph HTML.
- **Fix:** Thread the lang prefix into `processTextToHtml` (or post-process in callers) and emit `/{lang}/glossary/{id}` like `glossaryUrl()` does.

### L5. Footnote rendering: markdown links left raw; popover minor issues

- **Files:** `content.ts:442-457` (`extractFootnotes` converts only italics — `[text](url)` in a footnote renders as literal markdown via `set:html` in `[entry].astro:202`); `src/scripts/footnote-popover.ts` (popover is `position:fixed` but never repositions/dismisses on scroll).
- **Fix:** Run footnote text through `processTextToHtml`; dismiss popover on scroll.

### L6. A11y gaps in the paragraph toolbar / bottom sheet

- **Files:** `src/frontend/src/components/reading/ParagraphToolbar.vue:160-185, 205-285`.
- Toolbar opacity is 0.2 and only raised on `:hover` (`:317`) — keyboard users tab into invisible buttons; add `:focus-within { opacity: 1 }`.
- Bottom-sheet menu has no `role="dialog"`, no `aria-modal`, no focus trap, no Escape handler (Teleport-ed div). The flip button exposes state only via `title`.
- `[entry].astro:253` `document.querySelector(hash)` throws on hashes that aren't valid selectors — use `getElementById(hash.slice(1))`.

### L7. Redirect/endpoint page generation waste

- **Files:** `pages/glossary/[id].astro` builds 3,259 meta-refresh redirect pages; `pages/api/glossary/[id].json.ts` builds 3,259 JSON files whose 404 branch is dead in static output; root `redirects` in astro.config could handle the glossary alias at the server level.
- **Fix:** Move the `/glossary/:id → /original/glossary/:id` redirect to nginx; keep the JSON endpoint but feed it from the cached entry list (H4).

### L8. `isFrenchOriginal` heuristic can drop original text

- **Files:** `content.ts:498-506` — any `%%...%%` line containing `[A-Z]{2,3}:` is treated as an annotation; a French original line containing e.g. `PARIS:` or `LA: ` would be silently skipped (no original shown for that paragraph). Low frequency, but silent.
- **Fix:** Anchor the role check to the line start after the timestamp (`/^%%\s*\d{4}-..T..[^%]*[A-Z]{2,3}:/`) or require the known role codes (RSR|LAN|TR|GEM|RED|CON|PPX).

### L9. Docs drift

- `src/frontend/CLAUDE.md` says Astro 4.x / Supabase-centric structure / `public/sw.js` + `public/manifest.json` — actual stack is Astro 6, `@vite-pwa/astro`, no `public/sw.js`. Project root CLAUDE.md table also lists frontend files that moved. Update after the PWA fix so future agents don't "restore" the wrong pattern.

---

## Build verification notes

- `just fe-build` runs (no errors at the time of writing; 14 route-collision warnings from M5). Build is **very slow**: ~10,000 pages after ~9 minutes, with translated glossary pages at 250–340 ms each (H4/H5); full build projected at 60–90+ minutes for ~35k pages.
- Filter index: 3,666 entries / 47,059 paragraphs / 833 KB (H3).
- Live-site spot checks: PWA dead (C1/C2), paragraph loss (C3), soft-404s + fake robots/sitemap (C4), 1.21 MB home page (H1), 103 KB inline i18n on entry pages (H2).

---

## Suggested order of attack

1. **C3** content normalization + parser hardening (translated text is being lost *today*; small, self-contained).
2. **C1 + C2** register the SW and fix the manifest link (one small PR; unlocks the entire offline/PWA feature set already built).
3. **C4** 404 page + robots.txt + `@astrojs/sitemap` + nginx fallback fix (SEO foundation).
4. **H4 + H5** content-loading caches in `content.ts` (cuts build time dramatically; makes everything else cheaper to iterate on).
5. **H2** externalize I18nPatch locales, then **H1** per-day this-day JSON, then **H3** lazy filter index (page-weight trio).
6. **H6** hreflang + **M4** description fixes (SEO layer on now-solid foundation).
7. **M1** SW cache patterns (do together with C1 testing), **M7** manifest polish.
8. **M2, M3, M6** locale/lang correctness cluster.
9. **M5** glossary ID dedup + build-time uniqueness check; **M8, M9** date/birthdate consistency.
10. **L-items** opportunistically (L2 and L6 first — silent data loss and a11y).

---

## Manual server step required (C4)

**Status:** The soft-404 catch-all turned out to be **in-repo**, not server-side-only, so it was fixed in this repo. This section documents the change and the one remaining caveat to check on the deploy host.

### What was in-repo (now fixed)

The container's nginx config lives at `src/frontend/nginx.conf` and is baked into the image by `src/frontend/Dockerfile` (`COPY src/frontend/nginx.conf /etc/nginx/conf.d/default.conf`); `deploy.yml` then does `docker compose up -d --build` on the host. The soft-404 was this line:

```nginx
# BEFORE (every missing path → HTTP 200 homepage = soft-404; robots.txt/sitemap.xml served HTML)
try_files $uri $uri/ $uri.html /index.html;
```

Changed to:

```nginx
# AFTER (missing paths → 404, which error_page serves as the real /404.html)
try_files $uri $uri/ $uri.html =404;
```

`error_page 404 /404.html;` was already present and now actually fires (Astro emits `dist/404.html` from the new `src/pages/404.astro`). Because `try_files` resolves real files first, `/robots.txt` and the build-generated `/sitemap-index.xml` / `/sitemap-0.xml` now serve correctly instead of falling through to `index.html`. **This fix ships automatically on the next deploy — no manual host edit needed for the container itself.**

### Remaining caveat to verify on aretea (no ssh performed)

The container sits behind a reverse proxy (the config comments reference **Nginx Proxy Manager** / `X-Forwarded-*`). If that *outer* proxy has its own `try_files … /index.html`, custom-location, or "Custom Nginx Configuration" catch-all/`error_page` for `bashkirtseff.org`, it could still rewrite missing paths to the homepage and mask the container's 404. After deploying, verify against production:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://bashkirtseff.org/this-page-does-not-exist-xyz   # expect 404 (was 200)
curl -sI https://bashkirtseff.org/robots.txt | head -1                                            # expect 200 text/plain
curl -sI https://bashkirtseff.org/sitemap-index.xml | head -1                                      # expect 200 (after a full build deploy)
```

If `/this-page-does-not-exist-xyz` still returns 200 after deploy, the override is in the Nginx Proxy Manager host config (not in this repo): remove any `index.html` fallback / catch-all there and ensure it proxies the upstream 404 through unchanged (do **not** add a proxy-level `error_page 404 = @something` that rewrites to 200). No other manual server step is required.
