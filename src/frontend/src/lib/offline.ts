/**
 * Offline Download Utilities
 *
 * Pure functions for building URL lists and interacting with the Cache API.
 * Used by the offline Pinia store.
 */

import type { FilterEntryRecord } from '../types/filter-index';

/** Use the same cache as the SW runtime cache so cached pages are served automatically */
export const CACHE_NAME = 'diary-entries-cache';

/** Rough estimate per entry page (HTML + inline assets) */
const BYTES_PER_ENTRY = 70_000;

export interface DownloadScope {
  type: 'year' | 'carnet';
  id: string;        // "1877" or "015"
  language: string;   // "original" | "cz"
}

export interface DownloadRecord {
  scope: DownloadScope;
  totalUrls: number;
  cachedUrls: number;
  sizeBytes: number;
  downloadedAt: string;
  status: 'complete' | 'partial' | 'downloading' | 'error';
  /** Git commit hash from manifest at download time — undefined for legacy records */
  manifestCommit?: string;
}

/** Build a stable key for a download scope */
export function scopeKey(scope: DownloadScope): string {
  return `${scope.type}:${scope.id}:${scope.language}`;
}

/** Estimate download size in bytes */
export function estimateSize(entryCount: number): number {
  return entryCount * BYTES_PER_ENTRY;
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Convert language param to URL prefix */
function langPrefix(language: string): string {
  return language === '_original' ? 'original' : language;
}

/**
 * Carnet 000 special-casing: its "entries" are preface SECTIONS (ids like
 * "000-01") that are NOT rendered as individual pages — [entry].astro skips
 * carnet 000 entirely and the whole preface is rendered merged on one page at
 * /{lang}/000/. So a section id has no cacheable entry URL; including it would
 * queue 404 downloads. We detect section ids and cache only the merged page.
 */
const SECTION_ID = /^\d{3}-\d{2}$/;
function isSectionId(id: string): boolean {
  return SECTION_ID.test(id);
}

/** Build list of URLs to cache for a carnet scope */
export function urlsForCarnet(
  carnetId: string,
  language: string,
  entries: FilterEntryRecord[],
): string[] {
  const prefix = langPrefix(language);
  const carnetEntries = entries.filter(e => e.c === carnetId);

  const urls = [
    `/${prefix}/${carnetId}/`, // Carnet index (or, for 000, the merged preface page)
  ];

  for (const entry of carnetEntries) {
    // Section ids (carnet 000) have no standalone page — skip; the merged
    // /{prefix}/000/ page above already covers them.
    if (isSectionId(entry.id)) continue;
    // entry.id format: "1873-04-15" → full date
    urls.push(`/${prefix}/${carnetId}/${entry.id}/`);
  }

  return urls;
}

/** Build list of URLs to cache for a year scope */
export function urlsForYear(
  year: string,
  language: string,
  entries: FilterEntryRecord[],
): string[] {
  const prefix = langPrefix(language);
  const yearNum = parseInt(year, 10);
  const yearEntries = entries.filter(e => e.y === yearNum);
  const carnetIds = [...new Set(yearEntries.map(e => e.c))];

  const urls = [
    `/${prefix}/${year}/`, // Year index page (only for /cz/)
  ];

  for (const carnetId of carnetIds) {
    urls.push(`/${prefix}/${carnetId}/`); // Carnet index pages
    for (const entry of yearEntries.filter(e => e.c === carnetId)) {
      // Skip carnet-000 section ids (no standalone page; see isSectionId).
      if (isSectionId(entry.id)) continue;
      urls.push(`/${prefix}/${carnetId}/${entry.id}/`);
    }
  }

  return urls;
}

/** Build URLs for a given scope */
export function urlsForScope(
  scope: DownloadScope,
  entries: FilterEntryRecord[],
): string[] {
  if (scope.type === 'carnet') {
    return urlsForCarnet(scope.id, scope.language, entries);
  }
  return urlsForYear(scope.id, scope.language, entries);
}

/** Compute URLs that belong to this scope but NOT to any other active scope */
export function urlsExclusiveTo(
  scope: DownloadScope,
  allRecords: Record<string, DownloadRecord>,
  entries: FilterEntryRecord[],
): string[] {
  const targetUrls = new Set(urlsForScope(scope, entries));
  const targetKey = scopeKey(scope);
  for (const [key, record] of Object.entries(allRecords)) {
    if (key === targetKey) continue;
    if (record.status === 'complete' || record.status === 'partial') {
      for (const url of urlsForScope(record.scope, entries)) {
        targetUrls.delete(url);
      }
    }
  }
  return [...targetUrls];
}

/** Fetch a single URL into the cache. Returns true if successful. */
export async function cacheUrl(
  url: string,
  signal?: AbortSignal,
  force: boolean = false,
): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  try {
    if (!force) {
      const existing = await cache.match(url);
      if (existing) return true;
    }

    const response = await fetch(url, { signal, ...(force && { cache: 'reload' as RequestCache }) });
    if (response.ok) {
      await cache.put(url, response);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Count how many of the given URLs are already cached */
export async function countCachedUrls(urls: string[]): Promise<number> {
  const cache = await caches.open(CACHE_NAME);
  let count = 0;
  for (const url of urls) {
    if (await cache.match(url)) count++;
  }
  return count;
}

/** Delete specific URLs from the cache */
export async function deleteCachedUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  for (const url of urls) {
    await cache.delete(url);
  }
}
