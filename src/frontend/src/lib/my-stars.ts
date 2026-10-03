// ─── My stars: pure helpers (S11) ────────────────────────────────────
//
// Resolve starred paragraph ids against the paragraph index files
// (`/data/paragraphs/{lang}/{CCC}.json`, lib/paragraph-index.ts), group them by
// carnet in diary order, build the links and the export payload. No DOM, no
// store: MyStars.vue wires these to the stars store.

import { findDiaryLang } from './diary-lang-config';
import type { ServerStar } from './stars';

/** `[entryId | null, snippet]`; carnet 000 rows have a null entry (one page). */
export type IndexRow = [string | null, string];
export type IndexFile = Record<string, IndexRow>;

const ID_RE = /^(\d{3})\.(\d{4})$/;

/** `CCC.NNNN` -> parts. `DROPPED-` ids and anything else are not resolvable: null. */
export function parseParagraphId(id: string): { carnet: string; para: string } | null {
  const m = ID_RE.exec(id);
  return m ? { carnet: m[1], para: m[2] } : null;
}

/**
 * The diary URL language for a UI locale: its translation when that language is
 * live (cs -> cz), otherwise the French original (staged `es`).
 * `translated` tells whether snippets can come from the language's own tree.
 */
export function diaryLangForLocale(locale: string): { urlPath: string; translated: boolean } {
  const path = locale === 'cs' ? 'cz' : locale;
  const cfg = findDiaryLang(path);
  return cfg ? { urlPath: cfg.urlPath, translated: cfg.isTranslation } : { urlPath: 'original', translated: false };
}

export interface ResolvedStar {
  id: string;
  carnet: string | null;
  /** Entry id (`1875-08-27-28`) or null for carnet 000 / unresolved. */
  entry: string | null;
  snippet: string | null;
  /** The row came from the French original (fallback), so the page shows the badge. */
  fromOriginal: boolean;
  /** No row to show: `state` tells why. */
  missing: boolean;
  /**
   * ok: row found. unavailable: no row, but a file that could hold it failed to load
   * (network, not cached), so nothing is known. missing: the relevant files loaded (or are
   * absent, 404) and lack the row, or the id is not a paragraph id (DROPPED-).
   */
  state: 'ok' | 'unavailable' | 'missing';
  href: string | null;
}

/** `/{lang}/{carnet}/{entry}/#p-CCC-NNNN`, or `/{lang}/000/#p-000-NNNN` when entry is null. */
export function buildStarHref(lang: string, carnet: string, entry: string | null, para: string): string {
  const anchor = `#p-${carnet}-${para}`;
  return entry ? `/${lang}/${carnet}/${entry}/${anchor}` : `/${lang}/${carnet}/${anchor}`;
}

/**
 * Per-row fallback (paragraph-index contract): the language's own row wins; when
 * its key (or the whole file) is missing, the `original` row is used, and the
 * link then points at the original tree, which is known to hold that entry.
 * With `langFile` null on a language that has no tree (staged es) every row is a fallback.
 */
export function resolveStar(
  id: string,
  lang: string,
  langFile: IndexFile | null | undefined,
  originalFile: IndexFile | null | undefined,
  failed: { lang?: boolean; original?: boolean } = {},
): ResolvedStar {
  const p = parseParagraphId(id);
  const base = {
    id, carnet: p?.carnet ?? null, entry: null, snippet: null, fromOriginal: false,
    missing: true, state: 'missing' as const, href: null,
  };
  if (!p) return base;
  const isOrig = lang === 'original';
  const own = isOrig ? undefined : langFile?.[p.para];
  const orig = originalFile?.[p.para];
  const row = own ?? orig;
  if (!row) {
    // A file that failed by NETWORK (not a 404) proves nothing about the row.
    const unknown = failed.original || (!isOrig && failed.lang);
    return unknown ? { ...base, state: 'unavailable' } : base;
  }
  const fromOriginal = !isOrig && !own;
  const linkLang = fromOriginal ? 'original' : lang; // lang is 'original' itself when isOrig
  return {
    id,
    carnet: p.carnet,
    entry: row[0] ?? null,
    snippet: row[1],
    fromOriginal,
    missing: false,
    state: 'ok',
    href: buildStarHref(linkLang, p.carnet, row[0] ?? null, p.para),
  };
}

export interface CarnetGroup {
  /** null: ids that name no carnet (DROPPED-...), listed last */
  carnet: string | null;
  items: ResolvedStar[];
}

/** Diary order: carnets ascending, paragraphs ascending inside; unparseable ids last. */
export function groupByCarnet(items: ResolvedStar[]): CarnetGroup[] {
  const sorted = [...items].sort((a, b) => {
    if (!a.carnet !== !b.carnet) return a.carnet ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  const groups: CarnetGroup[] = [];
  for (const it of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.carnet === it.carnet) last.items.push(it);
    else groups.push({ carnet: it.carnet, items: [it] });
  }
  return groups;
}

/** Carnets that need an index file (unique, parseable ids only). */
export function carnetsNeeded(ids: Iterable<string>): string[] {
  const out = new Set<string>();
  for (const id of ids) {
    const p = parseParagraphId(id);
    if (p) out.add(p.carnet);
  }
  return [...out].sort();
}

export interface ExportRow {
  id: string;
  language: string | null;
  created_at: string | null;
  entry: string | null;
  snippet: string | null;
}

/**
 * Export payload: every displayed star with the server metadata when known
 * (queued, not yet synced stars have none) and the resolved entry/snippet.
 */
export function buildExport(
  resolved: ResolvedStar[],
  serverStars: ServerStar[] | null,
): { exported_at: string; count: number; stars: ExportRow[] } {
  const meta = new Map((serverStars ?? []).map((s) => [s.paragraph_id, s]));
  const stars = [...resolved]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((r) => ({
      id: r.id,
      language: meta.get(r.id)?.language ?? null,
      created_at: meta.get(r.id)?.created_at ?? null,
      entry: r.entry,
      snippet: r.snippet,
    }));
  return { exported_at: new Date().toISOString(), count: stars.length, stars };
}

export function exportFilename(now = new Date()): string {
  return `bashkirtseff-stars-${now.toISOString().slice(0, 10)}.json`;
}

/** Entry ids can be ranges (`1875-08-27-28`): format the leading date only. */
export function entryDate(entry: string | null): Date | null {
  const m = entry ? /^(\d{4})-(\d{2})-(\d{2})/.exec(entry) : null;
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}
