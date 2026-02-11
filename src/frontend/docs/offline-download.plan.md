# Offline Download Feature — Implementation Plan

## Overview

Allow users to proactively download diary entries by **year** or **carnet** for offline reading. Currently, pages are only cached passively (as visited). This feature adds explicit "download for offline" buttons with progress feedback and storage management.

## Architecture Decisions

### Why not extend Workbox precaching?

The Workbox precache manifest already lists every HTML page (sw.js is 1.7 MB). But precaching is all-or-nothing at install time — it doesn't support selective, user-initiated downloads with progress. We need the **Cache API** accessed directly from the main thread (or via `postMessage` to the service worker).

### Strategy: Main-thread fetch + Cache API

1. User taps "Download" on a year or carnet page
2. A Vue component fetches a URL manifest (from `filter-index.json` data)
3. Entries are fetched sequentially (or in small batches) and stored in a dedicated cache
4. Progress is tracked in a Pinia store and persisted to IndexedDB
5. The existing service worker already intercepts navigation — cached pages will be served automatically

### Cache naming

- `offline-entries` — Dedicated cache for user-downloaded entry pages
- Separate from Workbox's auto-managed caches to avoid conflicts
- The SW runtime cache (`diary-entries-cache`) handles passively visited pages; `offline-entries` handles explicitly downloaded ones

---

## Data Flow

```
filter-index.json          Pinia offlineStore            Cache API
┌─────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│ entries[].id    │───▶│ buildUrlList(scope) │───▶│ cache.add(url)   │
│ entries[].c     │    │ trackProgress()     │    │ cache.match(url) │
│ entries[].y     │    │ persist to IDB      │    │ cache.delete()   │
│ entries[].n     │    └─────────────────────┘    └──────────────────┘
└─────────────────┘
```

### URL construction from filter-index.json

Each entry in `filter-index.json` has:
- `id`: e.g. `"004-1873-04-15"` (carnet-date)
- `c`: carnet ID, e.g. `"004"`
- `y`: year, e.g. `1873`

From these, we construct URLs:
- Original: `/original/${c}/${date}/` (always available for all ~3,733 entries)
- Czech: `/cz/${c}/${date}/` (only ~101 translated entries currently)
- Carnet index: `/cz/${c}/` or `/original/${c}/`
- Year index: `/cz/${year}/` or `/original/${year}/`

We also need to cache the **carnet index page** and **year index page** themselves, plus shared assets (`_astro/*.css`, `_astro/*.js`, fonts).

---

## Components to Build

### 1. `src/stores/offline.ts` — Pinia store

The brain of the feature. Tracks what's downloaded, what's in progress, storage usage.

```typescript
interface DownloadScope {
  type: 'year' | 'carnet';
  id: string;              // "1877" or "015"
  language: string;        // "cz" | "original"
}

interface DownloadRecord {
  scope: DownloadScope;
  totalUrls: number;
  cachedUrls: number;
  sizeBytes: number;       // estimated
  downloadedAt: string;    // ISO timestamp
  status: 'complete' | 'partial' | 'downloading' | 'error';
}

interface OfflineState {
  downloads: Record<string, DownloadRecord>;  // keyed by "year:1877:original"
  isDownloading: boolean;
  currentScope: DownloadScope | null;
  progress: number;        // 0-100
  error: string | null;
  storageEstimate: { used: number; quota: number } | null;
}
```

**Key methods:**
- `buildUrlsForScope(scope)` — Uses filter-index data to enumerate entry URLs
- `downloadScope(scope)` — Fetches all URLs into cache, updates progress
- `cancelDownload()` — Aborts in-flight fetches
- `removeScope(scope)` — Deletes cached entries for a scope
- `checkCachedStatus(scope)` — Verifies what's actually in the cache
- `refreshStorageEstimate()` — Calls `navigator.storage.estimate()`
- `isAvailableOffline(scope)` — Quick check if a scope is downloaded

**Persistence:** Use `localStorage` for the `downloads` record (small JSON). The actual pages live in the Cache API.

### 2. `src/components/pwa/OfflineDownload.vue` — Download button

Placed on **year pages** and **carnet pages**. Shows contextual state:

| State | Display |
|-------|---------|
| Not downloaded | Cloud-download icon + "Download for offline" |
| Downloading | Progress bar with percentage + cancel button |
| Downloaded | Green check + "Available offline" + size + delete button |
| Partial | Warning icon + "X of Y pages" + resume button |
| Error | Red icon + error message + retry button |

**Props:**
```typescript
interface Props {
  scopeType: 'year' | 'carnet';
  scopeId: string;
  language: string;
}
```

**Placement:**
- Year page (`[year]/index.astro`): Below the year header, above carnet list
- Carnet page (`[carnet]/index.astro`): Below the carnet header, above entry list
- Both: `client:visible` hydration (no rush, only matters when user scrolls to it)

### 3. `src/components/pwa/OfflineStatus.vue` — Global offline indicator

Small indicator in the site header or footer area.

- Shows when device is offline (`navigator.onLine === false`)
- Shows total cached storage usage
- Links to a storage management section

**Placement:** In `Header.astro` or `Footer.astro`, `client:idle`

### 4. `src/components/pwa/StorageManager.vue` — Storage management panel

Accessible from the offline indicator or a settings page. Shows:

- Total storage used / available (via `navigator.storage.estimate()`)
- List of downloaded scopes with sizes
- Delete buttons per scope
- "Clear all offline data" button

**Could be a modal or a section on the About page.**

### 5. Offline fallback page — `src/pages/offline.astro`

A static page that displays when the user navigates to a non-cached page while offline.

- Explains they're offline and this page isn't downloaded
- Shows list of what IS available offline (from the store)
- Suggests downloading the content they want

**Requires a small service worker change:** Set `navigateFallback: '/offline'` or add a custom fetch handler that returns this page for uncached navigations when offline.

---

## Service Worker Changes

### Current config (astro.config.mjs)

```javascript
workbox: {
  navigateFallback: null,
  globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff,woff2}'],
  globIgnores: ['**/glossary/index.html', '**/cz/glossary/index.html'],
  runtimeCaching: [
    // Google Fonts (CacheFirst)
    // Diary entries (NetworkFirst, 500 max, 30 days)
  ]
}
```

### Needed changes

1. **Add `navigateFallback`** — Point to `/offline/index.html` (or handle with a custom handler)
   - Actually, `navigateFallback` in Workbox serves the fallback for ALL navigation requests that miss the cache. For an MPA this is too aggressive — it would serve the offline page even for pages that just haven't loaded yet while online.
   - **Better approach:** Add a `navigateFallbackDenylist` or use `injectManifest` mode with a custom handler that checks `navigator.onLine` before falling back.
   - **Simplest approach:** Keep `navigateFallback: null` and add a custom runtime caching rule that catches navigation failures and responds with `/offline/` page.

2. **Offline-aware fetch handler** — Add to `runtimeCaching`:
   ```javascript
   {
     // Catch failed navigations and serve offline page
     urlPattern: ({ request }) => request.mode === 'navigate',
     handler: 'NetworkOnly',
     options: {
       plugins: [{
         handlerDidError: async () => {
           return caches.match('/offline/');
         }
       }]
     }
   }
   ```
   Wait — this won't work with `generateSW` mode easily. We may need to use `injectManifest` for this level of control, OR we can handle it client-side with a simpler approach.

3. **Client-side offline detection (simpler alternative):**
   - Instead of SW-level fallback, detect offline status in the Vue offline indicator
   - When a navigation fails, the browser shows its default offline page
   - We intercept with a client-side script that redirects to `/offline/` if `!navigator.onLine`
   - This is less elegant but avoids SW complexity

**Recommendation:** Start with client-side offline detection. Defer SW-level fallback to a later iteration if needed.

4. **Make the `offline-entries` cache visible to SW** — The SW's runtime cache for diary entries uses `NetworkFirst`. If a page is in our `offline-entries` cache but not in the SW's `diary-entries-cache`, the SW won't find it during offline navigation.

   **Solution options:**
   - **(a)** Store downloaded pages in the SW's `diary-entries-cache` directly (same cache name) — simplest, they'll be found by the existing runtime cache rule
   - **(b)** Add a custom SW handler that also checks `offline-entries` cache — more complex
   - **(c)** Use `injectManifest` mode for full SW control — most flexible but biggest change

   **Recommendation:** Option (a) — store in `diary-entries-cache`. The existing `NetworkFirst` handler will serve cached pages when offline and refresh them when online. No SW changes needed.

---

## Implementation Steps

### Phase 1: Core infrastructure (Pinia store + cache logic)

**Files to create/modify:**

1. **Create `src/stores/offline.ts`**
   - Load filter-index.json (can share with filter store or fetch independently)
   - URL enumeration logic for year/carnet scopes
   - Cache API wrapper (add, check, delete)
   - Download orchestration with progress tracking
   - Storage estimate
   - Persist download records to localStorage

2. **Create `src/lib/offline.ts`** — Pure utility functions
   - `buildEntryUrls(entries, language)` — Convert filter-index entries to page URLs
   - `estimateSize(entryCount)` — Rough size estimate (entryCount × 70KB)
   - `CACHE_NAME = 'diary-entries-cache'` — Use the same cache as the SW runtime cache

### Phase 2: Download button component

3. **Create `src/components/pwa/OfflineDownload.vue`**
   - Reads store state for its scope
   - Shows download/progress/complete/error states
   - Install and remove actions
   - Animated progress bar

4. **Modify `src/pages/cz/[year]/index.astro`**
   - Add `<OfflineDownload client:visible scopeType="year" scopeId={year} language="original" />`
   - Position below year header

5. **Modify `src/pages/cz/[carnet]/index.astro`**
   - Add `<OfflineDownload client:visible scopeType="carnet" scopeId={carnet} language="original" />`
   - Position below carnet header

6. **Modify `src/pages/original/[carnet]/index.astro`** (if exists) — Same treatment

### Phase 3: Offline indicator + storage management

7. **Create `src/components/pwa/OfflineStatus.vue`**
   - Online/offline indicator
   - Small badge showing cached content count
   - Opens storage manager

8. **Create `src/components/pwa/StorageManager.vue`**
   - Lists downloaded scopes with sizes
   - Delete per scope
   - Clear all
   - Storage quota bar

9. **Modify `src/components/layout/Header.astro`** (or `Footer.astro`)
   - Add `<OfflineStatus client:idle />`

### Phase 4: Offline fallback page

10. **Create `src/pages/offline.astro`**
    - "You're offline" message
    - List of downloaded content (read from localStorage on client side)
    - Download suggestions

11. **Add client-side offline redirect** in `BaseLayout.astro`
    ```html
    <script>
      window.addEventListener('offline', () => { /* show indicator */ });
      // On page load, if offline and page failed to load from cache,
      // the browser error page shows. We can't intercept that without SW.
      // But we CAN show an overlay on cached pages indicating offline status.
    </script>
    ```

### Phase 5: Polish & edge cases

12. **i18n** — Add translation keys for all offline-related strings
13. **AbortController** — Wire up download cancellation properly
14. **Resumable downloads** — If download was interrupted, resume from where it left off
15. **Cache validation** — Periodically check if cached pages are stale (compare to filter-index built date)
16. **Dark mode** — Style all new components for dark theme

---

## Size Estimates & Feasibility

| Scope | Entries | Est. Size | Download Time (3G) |
|-------|---------|-----------|---------------------|
| 1 carnet (avg) | 30 | ~2.1 MB | ~15 sec |
| 1 carnet (largest, 087) | 124 | ~8.7 MB | ~60 sec |
| 1 year (avg) | 310 | ~21.7 MB | ~2.5 min |
| 1 year (largest, 1874) | 359 | ~25.1 MB | ~3 min |
| All originals | 3,733 | ~261 MB | ~30 min |
| All Czech translations | ~101 | ~7.1 MB | ~50 sec |

**Storage API:** Most browsers provide at least 50% of disk space. On a 64GB phone, that's ~32 GB. Even downloading the entire diary (~261 MB originals + 7 MB Czech) is well within limits.

**Browser support:** Cache API and `navigator.storage.estimate()` are available in all modern browsers. Safari has some quirks with storage limits but supports the core APIs.

---

## Key Technical Details

### Fetching into the right cache

```typescript
const CACHE_NAME = 'diary-entries-cache';  // Same as SW runtime cache

async function downloadUrl(url: string): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  try {
    // Check if already cached
    const existing = await cache.match(url);
    if (existing) return true;

    // Fetch and cache
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
```

### Building URL list from filter-index

```typescript
function urlsForCarnet(carnetId: string, language: string, entries: FilterEntry[]): string[] {
  const prefix = language === '_original' ? 'original' : language;
  const carnetEntries = entries.filter(e => e.c === carnetId);

  const urls = [
    `/${prefix}/${carnetId}/`,  // Carnet index page
  ];

  for (const entry of carnetEntries) {
    // entry.id format: "004-1873-04-15" → date is "1873-04-15"
    const date = entry.id.substring(4);  // Skip "XXX-"
    urls.push(`/${prefix}/${carnetId}/${date}/`);
  }

  return urls;
}

function urlsForYear(year: number, language: string, entries: FilterEntry[]): string[] {
  const prefix = language === '_original' ? 'original' : language;
  const yearEntries = entries.filter(e => e.y === year);
  const carnetIds = [...new Set(yearEntries.map(e => e.c))];

  const urls = [
    `/${prefix}/${year}/`,  // Year index page
  ];

  for (const carnetId of carnetIds) {
    urls.push(`/${prefix}/${carnetId}/`);  // Carnet index pages
    for (const entry of yearEntries.filter(e => e.c === carnetId)) {
      const date = entry.id.substring(4);
      urls.push(`/${prefix}/${carnetId}/${date}/`);
    }
  }

  return urls;
}
```

### Download orchestration with progress

```typescript
async function downloadScope(scope: DownloadScope, signal: AbortSignal) {
  const urls = buildUrlsForScope(scope);
  let completed = 0;

  // Download in batches of 3 to avoid overwhelming the connection
  const BATCH_SIZE = 3;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const batch = urls.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(url => downloadUrl(url))
    );

    completed += results.filter(r => r.status === 'fulfilled' && r.value).length;
    progress.value = Math.round((completed / urls.length) * 100);
  }
}
```

### Checking what's already cached

```typescript
async function checkCachedUrls(urls: string[]): Promise<number> {
  const cache = await caches.open(CACHE_NAME);
  let count = 0;
  for (const url of urls) {
    if (await cache.match(url)) count++;
  }
  return count;
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/stores/offline.ts` | Pinia store for download state |
| Create | `src/lib/offline.ts` | URL building, cache utilities |
| Create | `src/components/pwa/OfflineDownload.vue` | Download button + progress |
| Create | `src/components/pwa/OfflineStatus.vue` | Online/offline indicator |
| Create | `src/components/pwa/StorageManager.vue` | Manage cached content |
| Create | `src/pages/offline.astro` | Offline fallback page |
| Modify | `src/pages/cz/[year]/index.astro` | Add download button |
| Modify | `src/pages/cz/[carnet]/index.astro` | Add download button |
| Modify | `src/pages/original/[carnet]/index.astro` | Add download button (if exists) |
| Modify | `src/components/layout/Header.astro` | Add offline indicator |
| Modify | `src/i18n/locales/*.json` | Add offline-related i18n strings |
| Modify | `astro.config.mjs` | Potentially adjust SW config |

---

## Open Questions

1. **Should "Download year" also download carnet index pages for that year?** → Yes (included in plan)
2. **Should shared assets (_astro/*, fonts) be downloaded with the first offline scope?** → They're already precached by Workbox, so no action needed
3. **Should we support downloading ALL entries at once?** → Defer to later; start with per-year and per-carnet
4. **Should downloads auto-update when new translations are published?** → Not in v1; can add a "stale" indicator later
5. **Should the download button appear for languages that have no translations?** → Only show for language/scope combinations that have actual entry pages in the build. For `/cz/`, only show on carnets 001-004 and 095. For `/original/`, show on all.
