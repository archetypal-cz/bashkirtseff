# Astro Upgrade Plan & Record (through Astro 7)

> Originally prepared March 2026 for the Astro 5 → 6 upgrade. **Both the Astro 6
> and Astro 7 upgrades are now complete** — Astro 7 / Vite 8 shipped **June 2026**
> (see "Astro 7 upgrade" below). The forward-looking *Opportunities* section
> further down still applies: CSP, server islands, hybrid rendering, full-text
> search, the Sessions API, and the content-loader migration are all available in
> Astro 7.
>
> Filename kept as `ASTRO6_PLAN.md` for link stability; the content now covers the
> path through Astro 7.

## Current State (post-Astro 7, June 2026)

| Component | Version | Notes |
|-----------|---------|-------|
| Astro | 7.0.0 | Static output (SSG) |
| Node.js | 22.12.0+ | Dockerfile uses `node:22-alpine` |
| Vite | 8.x (bundled) | Via Astro |
| Zod | bundled | Via Astro (`astro/zod`); minimal usage |
| Vue | 3.5.x | `@astrojs/vue` ^7.0.0 |
| Tailwind CSS | 4.x | Via `@tailwindcss/vite` plugin |
| PWA | @vite-pwa/astro 1.2.0 | Workbox `generateSW`; `vite-plugin-pwa` 1.3.x for Vite 8 |
| Sitemap | @astrojs/sitemap ^3.7.3 | |
| Content loading | Custom loader (`src/lib/content.ts`, ~2,400 lines) | **NOT** using Astro Content Collections — see `src/frontend/docs/content-loader.plan.md` |

**Build scale:** ~35,640 static HTML pages, built in ~1m35s on the Astro 7 upgrade.

**Deployment:** Docker multi-stage (Node builder -> Nginx Alpine), triggered by push to main via GitHub Actions.

---

## Astro 7 upgrade (completed June 2026)

Shipped in commit *"Upgrade frontend to Astro 7 (Vite 8)"*. What changed:

- **astro** `^6.3.7` → `^7.0.0`, **@astrojs/vue** `^6.0.1` → `^7.0.0`; Astro now
  bundles **Vite 8**.
- **`compressHTML: true`** pinned in `astro.config.mjs`. Astro 7 changed the default
  to `'jsx'`, which strips whitespace between inline elements (React-style). For
  literary prose with inline glossary links / footnote markers that whitespace is
  meaningful, so we keep Astro 6's HTML-aware compression.
- **Root `overrides`** pinning `@vite-pwa/astro`'s stale `astro` peer to `^7.0.0`.
  Its published peer range predates Astro 6/7, so npm otherwise installed a nested
  `astro@6.3.7` that dragged in a second Vite major. The override collapses the tree
  onto a single Vite 8 and dropped npm audit from 6 vulnerabilities to 0.
- **Removed the vestigial `src/frontend/package-lock.json`** (it had drifted to an
  Astro 5-era tree — proof npm never used it; in an npm-workspaces repo the root
  `package-lock.json` is authoritative) and stopped copying it in the Dockerfile.

**Breaking changes that did NOT affect us** (verified): the new **Sätteri** default
Markdown processor (we don't use remark/rehype or Astro's markdown pipeline — the
custom loader parses content itself), removal of `@astrojs/db`, the removed
`astro:transitions` deprecated APIs, and the `src/fetch.ts` advanced-routing
entrypoint.

**Astro 7 dev-server gotcha:** `astro dev` now auto-backgrounds itself when it
detects an AI agent (`AI_AGENT` / `CLAUDECODE`), which fails in sandboxes that can't
spawn a detached process. `just fe-dev` in a human terminal is unaffected; force
foreground with `env -u AI_AGENT -u CLAUDECODE npx astro dev`. See
`src/frontend/CLAUDE.md`.

**Verification:** production build 35,640 pages / 0 warnings; PWA artifacts
(`sw.js`, `manifest.webmanifest`, `workbox-*.js`) generated; dev server `v7.0.0`
served `/`, `/cz/`, `/en/`, `/original/glossary/` as HTTP 200; root `npm ci` (the
Docker path) and standalone `cd src/frontend && npm install` both clean with 0
vulnerabilities; GitHub Actions deploy succeeded.

---

## Historical: Astro 5 → 6 upgrade plan

> The phases below were the original plan for the **5 → 6** step (since completed).
> Retained as a record; details may not all match the final implementation.

## Phase 1: Prerequisites

### Node.js 22.12.0+

Astro 6 drops Node 18 and 20. Node 20 EOL is April 2026, so this is urgent regardless.

**Changes needed:**
- `src/frontend/Dockerfile`: `FROM node:20-alpine` -> `FROM node:22-alpine`
- `.nvmrc` (if exists): update to `22`
- GitHub Actions workflow: update Node version
- Local development: `nvm install 22 && nvm use 22`
- `package.json` engines field: `"node": ">=22.12.0"`

### Dependency Compatibility Audit

Check before upgrading:

| Package | Vite 7 compatible? | Action |
|---------|-------------------|--------|
| `@tailwindcss/vite` ^4.1.17 | Likely yes (Tailwind 4 is Vite-native) | Check changelog |
| `@vite-pwa/astro` ^1.2.0 | Unknown | Check for v2 or Vite 7 support |
| `@astrojs/vue` ^5.1.3 | Need ^6.x for Astro 6 | Update |
| `pinia` ^3.0.4 | Should be fine (Vue ecosystem) | Verify |
| `vue-i18n` ^11.2.8 | Should be fine | Verify |

### Zod 4 Impact Assessment

Our Zod usage is minimal (only in `src/content/config.ts`):
```typescript
schema: z.object({}).passthrough()
```
This should work in Zod 4. The breaking changes (`z.string().email()` -> `z.email()`, error customization API) don't affect us.

**Also check:** `src/shared/` for any Zod usage in the shared TypeScript package.

**Import change:** `z` should be imported from `astro/zod` instead of `astro:content`.

---

## Phase 2: Breaking Changes Checklist

### Must Fix

| Change | Impact | Migration |
|--------|--------|-----------|
| Node 22+ required | Dockerfile, CI, local dev | Update all Node references |
| Vite 7 bundled | Plugin compatibility | Update plugins |
| Zod 4 bundled | `src/content/config.ts` | Minor syntax check |
| Content config location | `src/content/config.ts` -> `src/content.config.ts` | Rename file |
| `z` import path | `astro:content` deprecated | Import from `astro/zod` |
| Shiki 4 | We don't use syntax highlighting | No impact |

### Verify (Low Risk)

| Change | Impact | Notes |
|--------|--------|-------|
| Script/style tag ordering | CSS specificity, script execution | Now renders in source order. Test visual appearance. |
| Markdown heading ID algorithm | We use custom `%% XXX.YYYY %%` IDs, not heading anchors | Probably no impact, verify |
| Image service changes | Responsive images now crop by default, never upscale | We use `astro:assets` minimally. Test existing images. |
| i18n `redirectToDefaultLocale` default | We don't use Astro's built-in i18n routing | No impact |
| `getStaticPaths()` params must be strings | Our params are already strings | No impact |
| Endpoint trailing slash behavior | Our only endpoint is `/api/glossary/[id].json` | Test it |

### Already Clean (No Action Needed)

| Removed API | Our Status |
|-------------|-----------|
| `Astro.glob()` | Not used (custom `fs` loading) |
| `<ViewTransitions />` | Not used |
| `emitESMImage()` | Not used |
| Legacy content collections | Not used — content is loaded by a custom `fs`-based loader (`src/lib/content.ts`), not Astro collections at all |
| `getDataEntryById()` / `getEntryBySlug()` | Not used |

---

## Phase 3: The Upgrade

```bash
# 1. Switch to Node 22
nvm install 22 && nvm use 22

# 2. Update Astro and Vue integration
npm install astro@^6 @astrojs/vue@^6 --workspace=bashkirtseff-frontend

# 3. Check/update Vite plugins
npm install @tailwindcss/vite@latest @vite-pwa/astro@latest --workspace=bashkirtseff-frontend

# 4. Rename content config
mv src/frontend/src/content/config.ts src/frontend/src/content.config.ts

# 5. Update Zod import if needed (in content.config.ts)
# import { z } from 'astro/zod';

# 6. Update Dockerfile
# FROM node:22-alpine (in both builder and runtime stages)

# 7. Build and test
cd src/frontend && npm run build
```

## Phase 4: Verification

- [ ] Full build completes (~35,700 pages)
- [ ] Build time is not significantly worse (baseline: ~2-3 min)
- [ ] Spot-check pages: entry, carnet, year, glossary, home
- [ ] Vue hydration works: EntryContent, LanguageSwitcher, filters, GlossarySearch
- [ ] i18n patching works (localStorage locale -> DOM patching)
- [ ] PWA: service worker registers, offline page works, install prompt appears
- [ ] Filter overlay loads and applies filters
- [ ] Reading history tracking works (IntersectionObserver -> localStorage)
- [ ] Docker build succeeds end-to-end
- [ ] Nginx serves correctly (gzip, caching headers, fallback routing)

---

## Opportunities: What Astro 6/7 Opens Up

> Still applicable on Astro 7 — none of these capabilities were removed in the
> 6 → 7 step. CSP, server islands, hybrid rendering, the Sessions API and Live
> Collections all remain available.

### 1. Content Security Policy (CSP) -- Immediate Win

**What:** Built-in CSP support, now stable in Astro 6. Automatic hash generation for all inline scripts and styles.

**Why it matters for us:**
- We have multiple inline `<script>` blocks (footnote popovers, reading history tracking, sidebar data injection, analytics)
- We embed JSON data via `define:vars` (`__sidebarJSON`, `__historyJSON`)
- We plan to add AdSense (external scripts from ad networks are a major CSP concern)
- We plan to add Supabase (external API calls)
- We load Umami analytics from an external server

**Configuration:**
```typescript
// astro.config.mjs
export default defineConfig({
  security: {
    csp: {
      scriptDirective: {
        resources: [
          "'self'",
          'https://analytics.example.com',  // Umami
        ],
        scriptDynamic: true,  // strict-dynamic for inline scripts
      },
      styleDirective: {
        resources: ["'self'"],
      },
      directives: [
        "default-src: 'self'",
        "img-src: 'self' data: https:",
        "connect-src: 'self' https://*.supabase.co",
      ],
    },
  },
});
```

**Effort:** Low. Add config, test that all scripts/styles still work.

**Impact:** Significant security hardening. Protects against XSS attacks, especially important once we add user-generated content (notes, comments).

---

### 2. Server Islands for Personalized Components -- High Value

**What:** Server Islands (`server:defer`) let you render specific components on-demand from the server while the rest of the page remains statically generated. The page loads instantly with fallback content, then the dynamic component streams in.

**Why it matters for us:**

Our site is fully static (35,700 pre-built HTML files). That's great for performance, but it means **every user sees the same page**. Server Islands would let us keep our fast static pages while adding personalized elements:

#### a) "Continue Reading" with Server-Side History

Currently `ContinueReading.vue` reads from localStorage. With Server Islands, we could:
- Store reading history server-side (Supabase)
- Show a personalized "Continue Reading" widget that works across devices
- The diary entry page loads instantly (static), then the widget fills in from the server

```astro
---
import ContinueReading from '../components/ContinueReading.astro';
---
<article>
  <!-- Static diary entry content loads immediately -->
  <EntryContent paragraphs={paragraphs} />
</article>

<ContinueReading server:defer carnet={carnet}>
  <div slot="fallback" class="animate-pulse h-12 bg-sepia rounded" />
</ContinueReading>
```

#### b) User Notes & Annotations

Per-paragraph notes/annotations are a planned feature. Without Server Islands, we'd need to:
- Load them all via client-side JavaScript after hydration
- Or pre-render them into the page (impossible -- they're per-user)

With Server Islands, each paragraph could have a `<ParagraphNotes server:defer>` component that streams in the user's notes from Supabase while the diary text is already readable.

#### c) "On This Day" Personalization

The home page "This Day" widget currently shows the same entry for everyone. With Server Islands, it could show a different entry based on the user's reading progress -- e.g., the entry matching today's date from the year they're currently reading.

#### d) Social Proof Widgets

"12 readers have annotated this paragraph" or "Most-read entry this week" -- these need live data but shouldn't block the page from loading.

**Architectural requirement:** Server Islands need on-demand rendering, so we'd switch from pure SSG to **hybrid mode** (`output: 'hybrid'`). Diary entry pages stay pre-rendered (static). Only the island endpoints are server-rendered.

**Effort:** Medium. Requires adding a Node.js adapter (instead of pure Nginx), setting up Supabase, and implementing auth.

---

### 3. Hybrid Rendering -- Slash Build Times

**What:** Astro's hybrid mode lets you choose per-route whether a page is pre-rendered (static) or server-rendered (on-demand).

**Why it matters for us:**

Our build generates ~35,700 static pages. As we add more translations, this number grows linearly (5 languages x entries). At full translation coverage, we'd have ~18,800 entry pages alone. Build time will eventually become a bottleneck.

#### Which pages should stay static?
- **Diary entries** (3,763 x 5 = 18,815 pages): Yes, keep static. These are the core reading experience, rarely change, and benefit from CDN caching.
- **Year/carnet overview pages** (535 + 60 pages): Yes, keep static. Simple navigation pages.

#### Which pages could go on-demand?

| Page Type | Current Count | Why Server-Render? |
|-----------|--------------|-------------------|
| **Glossary entries** | 3,229 x 5 = 16,145 pages | Glossary entries change frequently (new cross-references, updated research). Rendering on-demand means updates appear instantly without a full rebuild. |
| **Glossary index/letter pages** | 5 x 27 = 135 pages | Aggregate pages that depend on the full glossary. Small count but high rebuild frequency. |
| **Home page "This Day"** | 5 pages | Currently static, could be dynamic (show different content based on date/user). |
| **Search results** | 0 (doesn't exist yet) | Full-text search across 3,763 entries is impossible client-side. Server-rendered search results page would unlock this. |

#### Impact on build:
```
Current:     ~35,700 pages  (~2-3 min build)
After hybrid: ~19,400 pages  (~1-2 min build, ~45% reduction)
```

And more importantly, glossary updates no longer require rebuilding 16,000+ pages.

**Effort:** Medium. Need a Node.js adapter (e.g., `@astrojs/node`), change Dockerfile from Nginx to Node server, mark glossary routes as `export const prerender = false`.

**Tradeoff:** Adds a Node.js runtime to production (currently pure Nginx). Slightly more infrastructure complexity. Could mitigate with aggressive caching headers.

---

### 4. Full-Text Search -- New Capability

**What:** With server-side rendering available, we can build a proper search endpoint.

**Why it matters for us:**

Currently there is **no full-text search** across diary entries. The glossary has client-side search (scored, debounced, with keyboard navigation), but you can't search the actual diary text. For a 3,300-entry diary, this is a significant gap.

**Implementation options with Astro 6 hybrid:**

#### a) Server-rendered search page
```astro
---
// src/pages/[lang]/search.astro
export const prerender = false;

const query = Astro.url.searchParams.get('q');
const results = await searchEntries(query, lang);
---
<SearchResults results={results} query={query} />
```

#### b) API endpoint for client-side search UI
```typescript
// src/pages/api/search.json.ts
export const prerender = false;

export async function GET({ url }) {
  const query = url.searchParams.get('q');
  const lang = url.searchParams.get('lang') || '_original';
  const results = await searchEntries(query, lang);
  return new Response(JSON.stringify(results));
}
```

#### c) Search index options
- **SQLite FTS5** (full-text search): Build a SQLite database at build time with all entry text, query it at runtime. Lightweight, no external dependencies.
- **Pagefind** (static search): Generates a search index at build time. Client-side search with WASM. No server needed. Works with SSG. Worth investigating even without Astro 6.
- **Supabase full-text search**: If we add Supabase anyway, use PostgreSQL's `tsvector` for search.

**Effort:** Medium-High depending on approach. Pagefind would be easiest (no server needed).

---

### 5. Live Content Collections -- Real-Time Updates

**What:** Content collections can now update in real-time during development without rebuilding. In Astro 5 this was experimental; in Astro 6 it's stable.

**Why it matters for us:**

During translation work, we constantly add/edit entries and want to see the result. Currently:
1. Edit a markdown file in `content/`
2. Wait for Astro dev server to detect the change
3. Page reloads (sometimes full restart needed for new files)

With Live Collections:
- New entries appear immediately in the dev server
- Editing an entry updates the page in real-time
- Adding a new translation is reflected instantly across navigation pages

**Effort:** Low -- this works automatically with the Content Layer API we already have configured in `content.config.ts`.

**Caveat:** Our actual content loading bypasses Astro collections (uses custom `fs` calls). To benefit from Live Collections, we'd need to migrate content loading to use `getCollection()` / `getEntry()` from `astro:content`. That's a larger refactor (see Opportunity 7).

---

### 6. Sessions API -- Cross-Device Reading Progress

**What:** Astro 6 includes a built-in Sessions API with pluggable drivers (Redis, Upstash, Netlify, Cloudflare KV, etc.).

**Why it matters for us:**

Reading history is currently localStorage-only. Users lose their progress when they switch devices or clear their browser. With Astro Sessions:

```astro
---
// In a server island or on-demand page
const session = await Astro.session.get('reading-progress');
const lastRead = session?.lastParagraph;
---
```

**Use cases:**
- **Reading position sync**: Pick up where you left off on any device
- **Bookmark collections**: "My favorite entries" that persist
- **Reading statistics**: "You've read 342 of 3,763 entries"
- **Translation preference**: Remember preferred language across devices

**Architectural requirement:** Needs on-demand rendering (hybrid mode) and a session store. Could use Redis, Upstash, or even filesystem-based for our scale.

**Effort:** Medium. Requires hybrid mode + session driver setup + auth.

---

### 7. Migrate Content Loading to Astro Collections -- Technical Debt

**What:** Our `lib/content.ts` (2,100 lines) uses raw `fs.readFileSync()` to load all content. This bypasses Astro's content layer entirely.

**Why consider migrating:**
- **Live Collections** (Opportunity 5) won't work without it
- **Build caching**: Astro can cache content collection results between builds
- **Type safety**: Astro generates TypeScript types for collection schemas
- **Incremental builds**: Future Astro versions may support incremental static regeneration via the content layer
- **Less custom code**: Replace 2,100 lines of custom parsing with Astro's built-in loader

**Why we haven't yet:**
- Our markdown format is non-standard (paragraph IDs, glossary tags, role comments)
- We need custom parsing that Astro's default markdown pipeline doesn't handle
- The custom loader works and is well-tested

**Migration path:**
1. Write a custom Astro loader that uses our `@bashkirtseff/shared` parser
2. Define proper Zod schemas for entry frontmatter
3. Replace `fs.readFileSync()` calls with `getCollection()` / `getEntry()`
4. Keep the rendering pipeline (our `renderParagraph()` etc.) -- just change how we *load* content

**Effort:** High. Major refactor of the content loading layer. Should be a separate
project — scoped in detail in [`src/frontend/docs/content-loader.plan.md`](../src/frontend/docs/content-loader.plan.md)
(recommended shape: a custom Content Layer loader that *wraps* the existing parser,
not a rewrite). Deferred.

---

### 8. Improved Dev Server -- Developer Experience

**What:** Astro 6 uses Vite's Environment API to run the same runtime in dev and production.

**Why it matters for us:**
- No more "works in dev, breaks in production" surprises
- Faster HMR (Hot Module Replacement)
- Better error messages and stack traces
- If we adopt hybrid mode, the dev server runs actual server-rendered routes correctly

**Effort:** Free -- comes with the upgrade.

---

## Opportunity Matrix

| Opportunity | Effort | Value | Dependency | Priority |
|-------------|--------|-------|------------|----------|
| CSP (built-in security) | Low | High | None | **Do immediately** |
| Improved dev server | Free | Medium | None | **Free with upgrade** |
| Live Collections (dev DX) | Low* | Medium | *Migrate content loading | Later |
| Server Islands (personalization) | Medium | High | Hybrid mode + Supabase | After auth |
| Hybrid rendering (build times) | Medium | Medium | Node adapter | When builds get slow |
| Full-text search | Medium | High | Hybrid mode or Pagefind | High priority |
| Sessions API | Medium | Medium | Hybrid mode + driver | After auth |
| Content loading migration | High | Medium | Effort | Separate project |

### Suggested Roadmap

**Immediate (with the upgrade):**
1. Upgrade to Astro 6 + Node 22
2. Enable CSP
3. Enjoy improved dev server

**Short-term (next month):**
4. Evaluate Pagefind for static search (no server needed)
5. Investigate hybrid mode feasibility

**Medium-term (when adding user features):**
6. Switch to hybrid mode
7. Add Server Islands for personalized components
8. Implement Sessions API for reading progress sync

**Long-term (technical debt):**
9. Migrate content loading to Astro collections
10. Implement full-text search via server endpoint

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Vite 7 breaks `@tailwindcss/vite` | Low | Tailwind 4 is Vite-native, actively maintained |
| Vite 7 breaks `@vite-pwa/astro` | Medium | Check compatibility before upgrading. Fallback: use `vite-plugin-pwa` directly |
| Zod 4 breaks content schemas | Very Low | Our schemas are `z.object({}).passthrough()` |
| Build time regression | Low | Vite 7 should be faster. Benchmark before/after |
| Vue hydration issues | Low | Vue 3 integration is mature |
| Content loading breaks | Very Low | We use custom `fs` loading, not Astro collections |

## References

- [Upgrade to Astro v7 Guide](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Upgrade to Astro v6 Guide](https://v6.docs.astro.build/en/guides/upgrade-to/v6/)
- [Astro CHANGELOG (7.0.0 major changes)](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)
- [Server Islands Documentation](https://docs.astro.build/en/guides/server-islands/)
- [CSP Documentation](https://docs.astro.build/en/reference/experimental-flags/csp/)
- [Vite 8 Migration Guide](https://vite.dev/guide/migration)
- Content-loader migration scope: [`src/frontend/docs/content-loader.plan.md`](../src/frontend/docs/content-loader.plan.md)
