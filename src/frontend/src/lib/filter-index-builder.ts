/**
 * Filter Index Builder
 *
 * Scans content/_original/ and builds the JSON index consumed at runtime by
 * `stores/filter.ts` for client-side tag filtering.
 *
 * This lives in the frontend (not src/scripts/) on purpose: the production
 * image (src/frontend/Dockerfile) only copies src/shared, src/frontend and
 * content/, and runs `astro build` — it never ran src/scripts/*. The index was
 * therefore whatever happened to be committed in public/data/filter-index.json,
 * so every glossary tag added after the last manual `just fe-filter-index` was
 * missing from the deployed filter ("Show in diary" → 0 results). The Astro
 * config regenerates it via `writeFilterIndex()` at config-setup time so the
 * index can no longer drift from the content.
 *
 * `src/scripts/build-filter-index.ts` (`just fe-filter-index`) is a thin CLI
 * wrapper around this module.
 */

import { RETIRED_THEMES } from './theme-names.ts';
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '@bashkirtseff/shared';

import type {
  FilterCategory,
  FilterEntryRecord,
  FilterIndex,
  FilterTag,
} from '../types/filter-index';

/** Minimum mention count for a tag to appear in the category picker */
const MIN_TAG_COUNT = 2;

/** Default content root, relative to src/frontend/ (Astro's cwd) */
export function defaultContentRoot(): string {
  return path.resolve(process.cwd(), '../../content');
}

/** Default output path, relative to src/frontend/ */
export function defaultOutputPath(): string {
  return path.resolve(process.cwd(), 'public/data/filter-index.json');
}

/** Display name of a glossary file: frontmatter `name:`, else its first `# ` heading */
function readGlossaryName(filePath: string): string | undefined {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    const m = text.match(/^---\n[\s\S]*?^name:\s*(.+?)\s*$/m) ?? text.match(/^#\s+(.+?)\s*$/m);
    return m ? m[1].replace(/^["']|["']$/g, '') : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build a map of glossary ID → subcategory by scanning _glossary directory
 * structure; `names` collects each file's display name on the way.
 */
function buildSubcategoryMap(glossaryBase: string, categoryDir: string, names?: Map<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  const categoryPath = path.join(glossaryBase, categoryDir);

  if (!fs.existsSync(categoryPath)) return map;

  const subdirs = fs.readdirSync(categoryPath, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const subdir of subdirs) {
    const subPath = path.join(categoryPath, subdir.name);
    const files = fs.readdirSync(subPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const id = file.replace('.md', '');
      map.set(id, subdir.name);
      const name = names && readGlossaryName(path.join(subPath, file));
      if (name) names.set(id, name);
    }
  }

  return map;
}

/** Ids mapped to their glossary file id when there is one, deduped case-insensitively */
function canonicalIds(raw: string[] | undefined, fileIds: Map<string, string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const rawId of raw?.filter(Boolean) ?? []) {
    const id = fileIds.get(rawId.toLowerCase()) ?? rawId;
    if (seen.has(id.toLowerCase())) continue;
    seen.add(id.toLowerCase());
    out.push(id);
  }
  return out;
}

/** Convert CAPITAL_ASCII ID to display name */
function formatDisplayName(id: string): string {
  // ALL-CAPS file ids (KATHERINE_KERNBERGER) get title-cased; mixed-case ids
  // (Marie_Bashkirtseff, Louis_XIV) keep their casing so acronyms survive.
  const base = id === id.toUpperCase() ? id.toLowerCase() : id;
  return base
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** `name:` from a theme's glossary frontmatter (English; the UI localises it via themes.<ID>) */
function readThemeName(glossaryBase: string, id: string): string | undefined {
  try {
    const text = fs.readFileSync(path.join(glossaryBase, 'culture', 'themes', `${id}.md`), 'utf-8');
    const m = text.match(/^---\n[\s\S]*?^name:\s*(.+?)\s*$/m);
    return m ? m[1].replace(/^["']|["']$/g, '') : undefined;
  } catch {
    return undefined;
  }
}

function buildTagList(
  counts: Map<string, number>,
  subcats: Map<string, string>,
  minCount = 1,
  names?: Map<string, string>,
): FilterTag[] {
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .map(([id, count]) => {
      const tag: FilterTag = { id, name: names?.get(id) ?? formatDisplayName(id), count };
      const sub = subcats.get(id);
      if (sub) tag.sub = sub;
      return tag;
    })
    .sort((a, b) => b.count - a.count);
}

export function buildFilterIndex(contentRoot: string = defaultContentRoot()): FilterIndex {
  const contentBase = path.join(contentRoot, '_original');
  const glossaryBase = path.join(contentBase, '_glossary');

  // Subcategory maps
  // Glossary display names ("Émile d'Audiffret", not "Emile D Audiffret")
  const names = new Map<string, string>();
  const peopleSubcats = buildSubcategoryMap(glossaryBase, 'people', names);
  const placesSubcats = buildSubcategoryMap(glossaryBase, 'places', names);
  const cultureSubcats = buildSubcategoryMap(glossaryBase, 'culture', names);

  // Theme IDs (entries in culture/themes/), lowercased for case-insensitive matching
  const themeIdsLower = new Set<string>();
  const themesDir = path.join(glossaryBase, 'culture', 'themes');
  if (fs.existsSync(themesDir)) {
    for (const f of fs.readdirSync(themesDir).filter(f => f.endsWith('.md'))) {
      themeIdsLower.add(f.replace('.md', '').toLowerCase());
    }
  }

  // Canonical culture/theme ids: lowercase → glossary FILE id (CAPITAL_ASCII).
  // Inline tags are harvested by display name ([#Kernberger]) while paragraph
  // GlossaryTag ids are file basenames (KATHERINE_KERNBERGER) — keying the index
  // by the canonical file id makes entry-level and paragraph-level filtering
  // agree, and makes subcategory lookup (also keyed by file id) work.
  const canonicalCultureIds = new Map<string, string>();
  for (const id of cultureSubcats.keys()) {
    canonicalCultureIds.set(id.toLowerCase(), id);
  }

  // lowercased id → glossary file id, for canonicalIds
  const peopleIds = new Map([...peopleSubcats.keys()].map(id => [id.toLowerCase(), id]));
  const placesIds = new Map([...placesSubcats.keys()].map(id => [id.toLowerCase(), id]));

  // Aggregate counters
  const peopleCounts = new Map<string, number>();
  const placesCounts = new Map<string, number>();
  const cultureCounts = new Map<string, number>();
  const themeCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  let kernbergerCount = 0;
  let censoredCount = 0;

  const entries: FilterEntryRecord[] = [];
  let totalParagraphs = 0;

  const carnetDirs = fs.readdirSync(contentBase, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{3}$/.test(d.name))
    .map(d => d.name)
    .sort();

  for (const carnet of carnetDirs) {
    const carnetPath = path.join(contentBase, carnet);
    const files = fs.readdirSync(carnetPath)
      .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== '_summary.md')
      .sort();

    for (const file of files) {
      const content = fs.readFileSync(path.join(carnetPath, file), 'utf-8');
      const { metadata } = parseFrontmatter(content);

      const entryId = file.replace('.md', '');
      const wf = (metadata.workflow as Record<string, unknown>) || {};
      const flags = (metadata.flags as Record<string, unknown>) || {};
      const entities = (metadata.entities as Record<string, string[]>) || {};

      // Skip empty entries
      if (flags.empty_in_source || wf.empty_in_source || metadata.empty_in_source) {
        continue;
      }

      // Extract year from date or entry ID
      const dateStr = (metadata.date as string) || entryId;
      const yearMatch = dateStr.match(/^(\d{4})/);
      if (!yearMatch) continue; // section-based entries (000-01) don't have dates
      const year = parseInt(yearMatch[1], 10);

      // Paragraph count: the ID lines actually present, not para_end - para_start
      // (stale frontmatter or a file whose IDs are not one contiguous run miscounts)
      const paraCount = content.match(/^\s*%%\s*\d{3}\.\d{4}\s*%%\s*$/gm)?.length ?? 0;
      totalParagraphs += paraCount;

      const location = (metadata.location as string) || undefined;
      // Frontmatter ids arrive in mixed case ("Paris", "Emile_d_Audiffret") next
      // to file ids (PARIS): canonicalize to the file id like the cultural ids
      // below, so one place is one tag with one count, a name and a subcategory.
      const people = canonicalIds(entities.people, peopleIds);
      const places = canonicalIds(entities.places, placesIds);

      // Cultural refs (from frontmatter entities + inline tags)
      const allCultural = entities.cultural?.filter(Boolean) || [];

      // Extract inline theme tags from body: %% [#Name](../_glossary/culture/themes/X.md) %%
      // Use the FILE basename as the id (canonical), not the display name.
      const themeTagPattern = /\[#[^\]]+\]\([^)]*\/_glossary\/culture\/themes\/([^)]+)\.md\)/g;
      let themeMatch: RegExpExecArray | null;
      while ((themeMatch = themeTagPattern.exec(content)) !== null) {
        allCultural.push(themeMatch[1].split('/').pop()!);
      }

      // Also extract inline culture tags (non-theme): %% [#Name](../_glossary/culture/X.md) %%
      const cultureTagPattern = /\[#[^\]]+\]\([^)]*\/_glossary\/culture\/(?!themes\/)([^)]+)\.md\)/g;
      let cultureMatch: RegExpExecArray | null;
      while ((cultureMatch = cultureTagPattern.exec(content)) !== null) {
        allCultural.push(cultureMatch[1].split('/').pop()!);
      }

      // Canonicalize every cultural id (frontmatter ids arrive in mixed case,
      // e.g. "Censored_1887" vs file id "CENSORED_1887") and dedupe
      // case-insensitively so one tag never counts twice for an entry.
      const seenCultural = new Set<string>();
      const canonicalCultural: string[] = [];
      for (const rawId of allCultural) {
        const canonical = canonicalCultureIds.get(rawId.toLowerCase()) ?? rawId;
        const key = canonical.toLowerCase();
        if (seenCultural.has(key)) continue;
        seenCultural.add(key);
        canonicalCultural.push(canonical);
      }

      // Split into themes (from culture/themes/) and culture (everything else)
      const themes: string[] = [];
      const cultural: string[] = [];
      for (const id of canonicalCultural) {
        if (themeIdsLower.has(id.toLowerCase())) themes.push(id);
        else cultural.push(id);
      }

      const kernberger = !!(wf.kernberger_covered || metadata.kernberger_covered);
      const censored = !!(wf.censored_1887_included || metadata.censored_1887_included);

      const record: FilterEntryRecord = { id: entryId, c: carnet, y: year };
      if (location) record.l = location;
      if (people.length > 0) record.p = people;
      if (places.length > 0) record.pl = places;
      if (cultural.length > 0) record.cu = cultural;
      if (themes.length > 0) record.th = themes;
      if (kernberger) record.k = true;
      if (censored) record.x = true;
      if (paraCount > 0) record.n = paraCount;

      entries.push(record);

      for (const id of people) peopleCounts.set(id, (peopleCounts.get(id) || 0) + 1);
      for (const id of places) placesCounts.set(id, (placesCounts.get(id) || 0) + 1);
      for (const id of cultural) cultureCounts.set(id, (cultureCounts.get(id) || 0) + 1);
      for (const id of themes) themeCounts.set(id, (themeCounts.get(id) || 0) + 1);
      if (location) locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      if (kernberger) kernbergerCount++;
      if (censored) censoredCount++;
    }
  }

  const categories: FilterCategory[] = [];

  // Editions (priority 0 — always first)
  categories.push({
    key: 'editions',
    label: 'filter.editions',
    tags: [
      { id: 'kernberger', name: 'Kernberger (2013)', count: kernbergerCount },
      { id: 'censored_1887', name: 'Charpentier (1887)', count: censoredCount },
    ].filter(t => t.count > 0),
  });

  // People (priority 1)
  categories.push({
    key: 'people',
    label: 'filter.people',
    tags: buildTagList(peopleCounts, peopleSubcats, MIN_TAG_COUNT, names),
  });

  // Places (priority 2)
  categories.push({
    key: 'places',
    label: 'filter.places',
    tags: buildTagList(placesCounts, placesSubcats, MIN_TAG_COUNT, names),
  });

  // Location (priority 3)
  categories.push({
    key: 'location',
    label: 'filter.location',
    tags: Array.from(locationCounts.entries())
      .filter(([, count]) => count >= MIN_TAG_COUNT)
      .map(([id, count]) => ({ id, name: formatDisplayName(id), count }))
      .sort((a, b) => b.count - a.count),
  });

  // Themes / description tags (priority 4)
  categories.push({
    key: 'themes',
    label: 'filter.themes',
    tags: buildTagList(
      new Map([...themeCounts].filter(([id]) => !RETIRED_THEMES.has(id))),
      new Map(),
      MIN_TAG_COUNT,
    ).map(tag => ({ ...tag, name: readThemeName(glossaryBase, tag.id) ?? tag.name })),
  });

  // Culture entities (priority 5)
  // Filter out themes from the subcategory map — themes have their own category
  const cultureSubcatsFiltered = new Map(
    [...cultureSubcats.entries()].filter(([, sub]) => sub !== 'themes')
  );
  categories.push({
    key: 'culture',
    label: 'filter.culture',
    tags: buildTagList(cultureCounts, cultureSubcatsFiltered, MIN_TAG_COUNT, names),
  });

  return {
    built: new Date().toISOString(),
    totalEntries: entries.length,
    totalParagraphs,
    entries,
    categories: categories.filter(c => c.tags.length > 0),
  };
}

export interface WriteFilterIndexResult {
  outputPath: string;
  index: FilterIndex;
  bytes: number;
  /** false when the content-derived payload was identical to what was on disk */
  changed: boolean;
}

/**
 * Build the index and write it to disk.
 *
 * The `built` timestamp is deliberately carried over from the existing file
 * when nothing else changed, so a rebuild does not produce a git diff of a
 * single timestamp line.
 */
export function writeFilterIndex(
  outputPath: string = defaultOutputPath(),
  contentRoot: string = defaultContentRoot(),
): WriteFilterIndexResult {
  const index = buildFilterIndex(contentRoot);

  let changed = true;
  if (fs.existsSync(outputPath)) {
    try {
      const previous = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as FilterIndex;
      const { built: _prevBuilt, ...prevRest } = previous;
      const { built: _nextBuilt, ...nextRest } = index;
      if (JSON.stringify(prevRest) === JSON.stringify(nextRest)) {
        changed = false;
        index.built = previous.built;
      }
    } catch {
      /* unreadable/corrupt previous index — just overwrite it */
    }
  }

  const json = JSON.stringify(index);
  if (changed) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json);
  }

  return { outputPath, index, bytes: Buffer.byteLength(json), changed };
}
