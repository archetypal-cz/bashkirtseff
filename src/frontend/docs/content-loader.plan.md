# Content Loader — Migration Assessment (custom loader → Astro Content Layer)

Status: **proposal / not scheduled**. Captured during the Astro 7 upgrade (June 2026).

## Current state

`src/lib/content.ts` is a **~2,400-line custom build-time loader** with ~30 exported
functions (`getCarnets`, `getCarnetEntries`, `getEntry`, `getGlossaryEntry`,
`getCarnetSummary`, `getYearSummary`, `getThisDayEntries`, `getEntryNavigation`,
glossary tree/usage helpers, …). It reads markdown directly from `../../content/`
at build time — there is **no `astro:content` collection, no CMS, no DB**.

It does a lot that is *specific to this project*, not generic markdown:

- Custom `%% XXX.YYYY %%` paragraph-cluster syntax
- Inline `%%`-comment annotations parsed out of the body (RSR / LAN / TR / GEM / OPS / RED / CON / ED / PPX)
- Glossary tags `[#Entity](…)` with cross-language fallback
- Footnotes, multi-file merging (carnet 000 preface sections), "this day" aggregation
- Per-language path mapping (`cz`/`original`/`en`/`uk`/`fr`)
- Derived aggregations: year/carnet summaries, glossary usage counts, navigation
- PROD-gated in-memory caches (`_carnetsCache`, `_entryCache`, glossary caches) so the
  ~35k-page build stays tractable while `astro dev` stays live on content edits

## The "standard Astro" option

The conventional mechanism is the **Content Layer API** (`astro:content` collections
+ loaders, stable since Astro 5, unchanged in 6/7). For non-standard sources the
sanctioned shape is a **custom loader** that parses files into Astro's data store.

### What we'd actually gain

1. **Persistent build cache / data store** — survives *across* builds, which can
   meaningfully speed up the 35k-page build. Today's caches are in-memory and
   rebuilt every run (and cold in CI).
2. **Type-safe Zod schemas** for frontmatter.
3. **Conventional query API** (`getCollection` / `getEntry` / `render`) that future
   contributors recognize.

### What we would NOT gain

We would **not** delete `content.ts`. None of the heavy lifting (paragraph clusters,
inline annotations, glossary cross-refs, multi-file merging) maps onto Astro's
frontmatter + markdown-body model. The parsing logic stays; the Content Layer would
wrap it.

## Recommendation

**Do it eventually, as its own initiative — not bundled with a framework upgrade.**

- Right shape: a **custom Content Layer loader that wraps the existing parser** and
  pushes parsed entries into the data store. *Wrapper, not rewrite.*
- This is a real project with real regression risk on a content-critical site:
  - Author loader(s) + Zod schema(s) per collection (entries, glossary, …)
  - Refactor **every** `getCarnets / getEntry / getGlossaryEntry / …` call site
    across `src/pages/**` and components
  - Re-verify cross-year carnets, carnet-000 preface merge, glossary fallback,
    "this day", offline-download URL lists, sitemap filter
- Primary payoff is **incremental build caching** (needs CI cache persistence to
  realize the win) + type safety + conventionality.

## Suggested phased approach (when scheduled)

1. **Spike**: one collection (e.g. glossary) behind a custom loader; measure cold
   vs. warm build time and confirm the data store persists usefully in CI.
2. **Entries**: port carnet/entry parsing into a loader; keep `content.ts` parser
   functions, call them from the loader.
3. **Migrate call sites** incrementally; keep old `getX` helpers as thin adapters
   over `getCollection`/`getEntry` to shrink the diff.
4. **Aggregations** (summaries, this-day, glossary usage, navigation): rebuild on
   top of the collections; delete the in-memory caches once the data store covers
   them.
5. Remove dead code, update `src/frontend/CLAUDE.md` and `docs/ARCHITECTURE.md`.

## Decision

Deferred. The Astro 7 upgrade shipped without touching the loader (the custom loader
is unaffected by Astro 7 — no remark/rehype, no content collections in play).
