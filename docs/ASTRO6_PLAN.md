# Astro 6 Upgrade Plan

> Prepared March 2026. Astro 6 is in late beta (stable release expected soon).

## Current State

| Component | Version | Notes |
|-----------|---------|-------|
| Astro | 5.16.4 | Static output (SSG) |
| Node.js | 20+ | Dockerfile uses `node:20-alpine` |
| Vite | 6.x (bundled) | Via Astro |
| Zod | 3.x (bundled) | Via Astro |
| Vue | 3.5.25 | `@astrojs/vue` ^5.1.3 |
| Tailwind CSS | 4.1.17 | Via `@tailwindcss/vite` plugin |
| PWA | @vite-pwa/astro 1.2.0 | Workbox-based |
| Content loading | Custom `fs.readFileSync()` | NOT using Astro Content Collections |

**Build scale:** ~35,700 static HTML pages (5 languages x 3,763 entries + 3,229 glossary entries + year/carnet pages).

**Deployment:** Docker multi-stage (Node builder -> Nginx Alpine), triggered by push to main via GitHub Actions.

---

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
| Legacy content collections | Not used (we use Content Layer API with `glob()` loader) |
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

## Opportunities: What Astro 6 Opens Up

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

**Effort:** High. Major refactor of the content loading layer. Should be a separate project.

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

- [Astro 6 Beta Announcement](https://astro.build/blog/astro-6-beta/)
- [Upgrade to Astro v6 Guide](https://v6.docs.astro.build/en/guides/upgrade-to/v6/)
- [Server Islands Documentation](https://docs.astro.build/en/guides/server-islands/)
- [CSP Documentation](https://docs.astro.build/en/reference/experimental-flags/csp/)
- [Vite 7 Migration Guide](https://vite.dev/guide/migration)
- [What's New - February 2026](https://astro.build/blog/whats-new-february-2026/)
