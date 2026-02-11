import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  type DownloadScope,
  type DownloadRecord,
  scopeKey,
  urlsForScope,
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

  // Filter index entries — loaded once
  const entries = ref<FilterEntryRecord[]>([]);
  const entriesLoaded = ref(false);

  // AbortController for cancellation
  let abortController: AbortController | null = null;

  // --- Computed ---

  const downloadList = computed(() => Object.values(downloads.value));

  const totalCachedSize = computed(() =>
    downloadList.value.reduce((sum, d) => sum + d.sizeBytes, 0)
  );

  // --- Init ---

  function init() {
    if (typeof window === 'undefined') return;

    // Restore persisted download records
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        downloads.value = JSON.parse(saved);
      } catch {
        /* ignore corrupt data */
      }
    }

    refreshStorageEstimate();
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
    await loadEntries();
    if (!entriesLoaded.value) {
      error.value = 'Failed to load entry index';
      return;
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
    await loadEntries();
    const key = scopeKey(scope);
    const urls = urlsForScope(scope, entries.value);

    await deleteCachedUrls(urls);

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
    for (const record of Object.values(downloads.value)) {
      await loadEntries();
      const urls = urlsForScope(record.scope, entries.value);
      await deleteCachedUrls(urls);
    }
    downloads.value = {};
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
  };
});
