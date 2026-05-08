import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  type DownloadScope,
  type DownloadRecord,
  CACHE_NAME,
  scopeKey,
  urlsForScope,
  urlsExclusiveTo,
  estimateSize,
  cacheUrl,
  countCachedUrls,
  deleteCachedUrls,
} from '../lib/offline';
import type { FilterEntryRecord } from '../types/filter-index';

const STORAGE_KEY = 'offline-downloads';
const BATCH_SIZE = 3;

export const useOfflineStore = defineStore('offline', () => {
  // --- State ---
  const downloads = ref<Record<string, DownloadRecord>>({});
  const isDownloading = ref(false);
  const currentScope = ref<DownloadScope | null>(null);
  const progress = ref(0);
  const error = ref<string | null>(null);
  const storageEstimate = ref<{ used: number; quota: number } | null>(null);
  const hasStaleDownloads = ref(false);
  const currentManifestCommit = ref<string | null>(null);

  // Filter index entries — loaded once
  const entries = ref<FilterEntryRecord[]>([]);
  const entriesLoaded = ref(false);

  // AbortController for cancellation
  let abortController: AbortController | null = null;
  let initialized = false;

  // --- Computed ---

  const downloadList = computed(() => Object.values(downloads.value));

  const totalCachedSize = computed(() =>
    downloadList.value.reduce((sum, d) => sum + d.sizeBytes, 0)
  );

  // --- Init ---

  function init() {
    if (typeof window === 'undefined') return;
    if (initialized) return;
    initialized = true;

    // Restore persisted download records
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        downloads.value = JSON.parse(saved);
        // Sanitize stale downloading records from crashed/refreshed sessions
        for (const record of Object.values(downloads.value)) {
          if (record.status === 'downloading') {
            record.status = record.cachedUrls > 0 ? 'partial' : 'error';
          }
        }
      } catch {
        /* ignore corrupt data */
      }
    }

    refreshStorageEstimate();
    queueMicrotask(() => validateRecords());

    // Check for content updates when online
    if (navigator.onLine) {
      queueMicrotask(() => checkFreshness());
    }
    window.addEventListener('online', () => checkFreshness());

    // When a new service worker takes control, content may have changed
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      checkFreshness();
    });
  }

  function persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads.value));
  }

  // --- Entry loading ---

  async function loadEntries() {
    if (entriesLoaded.value) return;
    try {
      const res = await fetch('/data/filter-index.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      entries.value = data.entries;
      entriesLoaded.value = true;
    } catch (e) {
      console.error('[OfflineStore] Failed to load filter index:', (e as Error).message);
    }
  }

  // --- Core actions ---

  async function downloadScope(scope: DownloadScope) {
    if (isDownloading.value) {
      error.value = 'A download is already in progress';
      return;
    }

    await loadEntries();
    if (!entriesLoaded.value) {
      error.value = 'Failed to load entry index';
      return;
    }

    // Fetch current manifest commit if not already known
    if (!currentManifestCommit.value) {
      try {
        const res = await fetch('/data/offline-manifest.json', { cache: 'no-store' });
        if (res.ok) {
          const manifest = await res.json();
          currentManifestCommit.value = manifest.commit;
        }
      } catch { /* ignore */ }
    }

    const key = scopeKey(scope);
    const urls = urlsForScope(scope, entries.value);

    if (urls.length === 0) {
      error.value = 'No pages found for this scope';
      return;
    }

    // Set up state
    isDownloading.value = true;
    currentScope.value = scope;
    progress.value = 0;
    error.value = null;
    abortController = new AbortController();

    downloads.value = {
      ...downloads.value,
      [key]: {
        scope,
        totalUrls: urls.length,
        cachedUrls: 0,
        sizeBytes: 0,
        downloadedAt: new Date().toISOString(),
        status: 'downloading',
      },
    };
    persist();

    let completed = 0;

    try {
      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        if (abortController.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const batch = urls.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(url => cacheUrl(url, abortController!.signal))
        );

        completed += results.filter(
          r => r.status === 'fulfilled' && r.value
        ).length;

        progress.value = Math.round((completed / urls.length) * 100);

        // Update record in-place
        const record = downloads.value[key];
        if (record) {
          record.cachedUrls = completed;
          record.sizeBytes = estimateSize(completed);
        }
      }

      // Mark complete or partial
      const record = downloads.value[key];
      if (record) {
        record.status = completed === urls.length ? 'complete' : 'partial';
        record.cachedUrls = completed;
        record.sizeBytes = estimateSize(completed);
        record.downloadedAt = new Date().toISOString();
        record.manifestCommit = currentManifestCommit.value ?? undefined;
      }
    } catch (e) {
      const record = downloads.value[key];
      if (record) {
        if ((e as Error).name === 'AbortError') {
          record.status = completed > 0 ? 'partial' : 'error';
          record.cachedUrls = completed;
          record.sizeBytes = estimateSize(completed);
        } else {
          record.status = 'error';
          error.value = (e as Error).message;
        }
      }
    } finally {
      isDownloading.value = false;
      currentScope.value = null;
      abortController = null;
      persist();
      refreshStorageEstimate();
    }
  }

  function cancelDownload() {
    if (abortController) {
      abortController.abort();
    }
  }

  async function removeScope(scope: DownloadScope) {
    if (isDownloading.value) {
      error.value = 'Cannot remove while download is in progress';
      return;
    }

    await loadEntries();
    const key = scopeKey(scope);
    const exclusiveUrls = urlsExclusiveTo(scope, downloads.value, entries.value);

    await deleteCachedUrls(exclusiveUrls);

    const next = { ...downloads.value };
    delete next[key];
    downloads.value = next;
    persist();
    refreshStorageEstimate();
  }

  async function checkCachedStatus(scope: DownloadScope) {
    await loadEntries();
    const key = scopeKey(scope);
    const urls = urlsForScope(scope, entries.value);
    const cached = await countCachedUrls(urls);

    const record = downloads.value[key];
    if (record) {
      record.cachedUrls = cached;
      record.status = cached === record.totalUrls ? 'complete'
        : cached > 0 ? 'partial' : 'error';
      persist();
    }

    return cached;
  }

  function getRecord(scope: DownloadScope): DownloadRecord | undefined {
    return downloads.value[scopeKey(scope)];
  }

  function isAvailableOffline(scope: DownloadScope): boolean {
    const record = downloads.value[scopeKey(scope)];
    return record?.status === 'complete';
  }

  async function refreshStorageEstimate() {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;
    try {
      const est = await navigator.storage.estimate();
      storageEstimate.value = {
        used: est.usage ?? 0,
        quota: est.quota ?? 0,
      };
    } catch {
      /* ignore */
    }
  }

  async function clearAll() {
    if (isDownloading.value) {
      error.value = 'Cannot clear while download is in progress';
      return;
    }

    for (const record of Object.values(downloads.value)) {
      await loadEntries();
      const urls = urlsForScope(record.scope, entries.value);
      await deleteCachedUrls(urls);
    }
    downloads.value = {};
    persist();
    refreshStorageEstimate();
  }

  async function validateRecords() {
    await loadEntries();
    if (!entriesLoaded.value) return;
    const cache = await caches.open(CACHE_NAME);
    for (const [key, record] of Object.entries(downloads.value)) {
      if (record.status !== 'complete' && record.status !== 'partial') continue;
      const urls = urlsForScope(record.scope, entries.value);
      if (urls.length === 0) continue;
      // Spot-check 3 random URLs
      const sampleSize = Math.min(3, urls.length);
      let missing = 0;
      for (let i = 0; i < sampleSize; i++) {
        const idx = Math.floor(Math.random() * urls.length);
        if (!(await cache.match(urls[idx]))) missing++;
      }
      if (missing > 0) {
        const actualCached = await countCachedUrls(urls);
        record.cachedUrls = actualCached;
        record.status = actualCached === urls.length ? 'complete'
          : actualCached > 0 ? 'partial' : 'error';
      }
    }
    persist();
  }

  async function checkFreshness() {
    if (typeof window === 'undefined') return;
    if (Object.keys(downloads.value).length === 0) return;

    try {
      const res = await fetch('/data/offline-manifest.json', { cache: 'no-store' });
      if (!res.ok) return;
      const manifest = await res.json();
      currentManifestCommit.value = manifest.commit;

      let stale = false;
      for (const record of Object.values(downloads.value)) {
        if (record.status !== 'complete' && record.status !== 'partial') continue;
        if (!record.manifestCommit || record.manifestCommit !== manifest.commit) {
          stale = true;
          break;
        }
      }
      hasStaleDownloads.value = stale;
    } catch {
      // Network error — can't check freshness
    }
  }

  async function updateStaleDownloads() {
    if (!currentManifestCommit.value) return;

    await loadEntries();
    if (!entriesLoaded.value) return;

    for (const [key, record] of Object.entries(downloads.value)) {
      if (record.status !== 'complete' && record.status !== 'partial') continue;
      if (record.manifestCommit === currentManifestCommit.value) continue;

      // Re-download this scope with force
      const urls = urlsForScope(record.scope, entries.value);
      isDownloading.value = true;
      currentScope.value = record.scope;
      progress.value = 0;
      error.value = null;
      abortController = new AbortController();

      record.status = 'downloading';
      persist();

      let completed = 0;
      try {
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
          if (abortController.signal.aborted) break;
          const batch = urls.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map(url => cacheUrl(url, abortController!.signal, true))
          );
          completed += results.filter(r => r.status === 'fulfilled' && r.value).length;
          progress.value = Math.round((completed / urls.length) * 100);
          record.cachedUrls = completed;
          record.sizeBytes = estimateSize(completed);
        }
        record.status = completed === urls.length ? 'complete' : 'partial';
        // Only stamp manifestCommit if fully complete — partial updates are still stale
        if (completed === urls.length) {
          record.manifestCommit = currentManifestCommit.value;
        }
        record.downloadedAt = new Date().toISOString();
      } catch {
        record.status = completed > 0 ? 'partial' : 'error';
      }

      persist();
    }

    isDownloading.value = false;
    currentScope.value = null;
    abortController = null;
    // Recheck — some scopes may still be stale if updates were partial
    const stillStale = Object.values(downloads.value).some(
      r => (r.status === 'complete' || r.status === 'partial') &&
           r.manifestCommit !== currentManifestCommit.value
    );
    hasStaleDownloads.value = stillStale;
    persist();
    refreshStorageEstimate();
  }

  return {
    // State
    downloads,
    isDownloading,
    currentScope,
    progress,
    error,
    storageEstimate,
    hasStaleDownloads,
    currentManifestCommit,

    // Computed
    downloadList,
    totalCachedSize,

    // Actions
    init,
    loadEntries,
    downloadScope,
    cancelDownload,
    removeScope,
    checkCachedStatus,
    getRecord,
    isAvailableOffline,
    refreshStorageEstimate,
    clearAll,
    checkFreshness,
    updateStaleDownloads,
  };
});
