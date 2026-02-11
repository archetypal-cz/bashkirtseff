#!/usr/bin/env npx tsx

/**
 * Build Filter Index
 *
 * Scans all entries in content/_original/ and builds a JSON index
 * for client-side filtering in the frontend.
 *
 * Usage:
 *   npx tsx src/scripts/build-filter-index.ts
 *   npx tsx src/scripts/build-filter-index.ts --verbose
 *   just filter-index
 *
 * Output:
 *   src/frontend/public/data/filter-index.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFrontmatter } from '../shared/src/parser/frontmatter.js';

const BASE_PATH = process.cwd();
const CONTENT_BASE = path.join(BASE_PATH, 'content/_original');
const GLOSSARY_BASE = path.join(CONTENT_BASE, '_glossary');
const OUTPUT_PATH = path.join(BASE_PATH, 'src/frontend/public/data/filter-index.json');

const verbose = process.argv.includes('--verbose');

// --- Types (mirroring frontend types) ---

interface FilterEntryRecord {
  id: string;
  c: string;
  y: number;
  l?: string;
  p?: string[];
  pl?: string[];
  cu?: string[];
  k?: true;
  x?: true;
  n?: number;
}

interface FilterTag {
  id: string;
  name: string;
  count: number;
  sub?: string;
}

interface FilterCategory {
  key: string;
  label: string;
  tags: FilterTag[];
}

interface FilterIndex {
  built: string;
  totalEntries: number;
  totalParagraphs: number;
  entries: FilterEntryRecord[];
  categories: FilterCategory[];
}

// --- Subcategory resolution ---

/** Build a map of glossary ID → subcategory by scanning _glossary directory structure */
function buildSubcategoryMap(categoryDir: string): Map<string, string> {
  const map = new Map<string, string>();
  const categoryPath = path.join(GLOSSARY_BASE, categoryDir);

  if (!fs.existsSync(categoryPath)) return map;

  const subdirs = fs.readdirSync(categoryPath, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const subdir of subdirs) {
    const subPath = path.join(categoryPath, subdir.name);
    const files = fs.readdirSync(subPath)
      .filter(f => f.endsWith('.md'));

    for (const file of files) {
      const id = file.replace('.md', '');
      map.set(id, subdir.name);
    }
  }

  return map;
}

/** Convert CAPITAL_ASCII ID to display name */
function formatDisplayName(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// --- Main ---

function main() {
  console.log('Building filter index...\n');

  // Build subcategory maps
  const peopleSubcats = buildSubcategoryMap('people');
  const placesSubcats = buildSubcategoryMap('places');
  const cultureSubcats = buildSubcategoryMap('culture');

  // Minimum mention count for a tag to appear in the category picker
  const MIN_TAG_COUNT = 2;

  // Aggregate counters
  const peopleCounts = new Map<string, number>();
  const placesCounts = new Map<string, number>();
  const cultureCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  let kernbergerCount = 0;
  let censoredCount = 0;

  // Entry records
  const entries: FilterEntryRecord[] = [];
  let totalParagraphs = 0;

  // Scan carnet directories
  const carnetDirs = fs.readdirSync(CONTENT_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{3}$/.test(d.name))
    .map(d => d.name)
    .sort();

  for (const carnet of carnetDirs) {
    const carnetPath = path.join(CONTENT_BASE, carnet);
    const files = fs.readdirSync(carnetPath)
      .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== '_summary.md')
      .sort();

    for (const file of files) {
      const filePath = path.join(carnetPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
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

      // Paragraph count
      const paraStart = (metadata.para_start as number) || 0;
      const paraEnd = (metadata.para_end as number) || 0;
      const paraCount = paraEnd > 0 && paraStart > 0 ? paraEnd - paraStart + 1 : 0;
      totalParagraphs += paraCount;

      // Location
      const location = (metadata.location as string) || undefined;

      // People
      const people = entities.people?.filter(Boolean) || [];

      // Places
      const places = entities.places?.filter(Boolean) || [];

      // Cultural refs
      const cultural = entities.cultural?.filter(Boolean) || [];

      // Edition flags
      const kernberger = !!(wf.kernberger_covered || metadata.kernberger_covered);
      const censored = !!(wf.censored_1887_included || metadata.censored_1887_included);

      // Build entry record
      const record: FilterEntryRecord = {
        id: entryId,
        c: carnet,
        y: year,
      };
      if (location) record.l = location;
      if (people.length > 0) record.p = people;
      if (places.length > 0) record.pl = places;
      if (cultural.length > 0) record.cu = cultural;
      if (kernberger) record.k = true;
      if (censored) record.x = true;
      if (paraCount > 0) record.n = paraCount;

      entries.push(record);

      // Aggregate counts
      for (const id of people) {
        peopleCounts.set(id, (peopleCounts.get(id) || 0) + 1);
      }
      for (const id of places) {
        placesCounts.set(id, (placesCounts.get(id) || 0) + 1);
      }
      for (const id of cultural) {
        cultureCounts.set(id, (cultureCounts.get(id) || 0) + 1);
      }
      if (location) {
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      }
      if (kernberger) kernbergerCount++;
      if (censored) censoredCount++;
    }
  }

  // Build categories
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
    tags: buildTagList(peopleCounts, peopleSubcats, MIN_TAG_COUNT),
  });

  // Places (priority 2)
  categories.push({
    key: 'places',
    label: 'filter.places',
    tags: buildTagList(placesCounts, placesSubcats, MIN_TAG_COUNT),
  });

  // Location (priority 3)
  categories.push({
    key: 'location',
    label: 'filter.location',
    tags: Array.from(locationCounts.entries())
      .filter(([_, count]) => count >= MIN_TAG_COUNT)
      .map(([id, count]) => ({ id, name: formatDisplayName(id), count }))
      .sort((a, b) => b.count - a.count),
  });

  // Culture (priority 4)
  categories.push({
    key: 'culture',
    label: 'filter.culture',
    tags: buildTagList(cultureCounts, cultureSubcats, MIN_TAG_COUNT),
  });

  // Remove empty categories
  const nonEmptyCategories = categories.filter(c => c.tags.length > 0);

  // Build index
  const index: FilterIndex = {
    built: new Date().toISOString(),
    totalEntries: entries.length,
    totalParagraphs,
    entries,
    categories: nonEmptyCategories,
  };

  // Write output
  const outputDir = path.dirname(OUTPUT_PATH);
  fs.mkdirSync(outputDir, { recursive: true });
  const json = JSON.stringify(index);
  fs.writeFileSync(OUTPUT_PATH, json);

  // Print summary
  const rawSize = Buffer.byteLength(json);
  console.log(`Entries:     ${entries.length}`);
  console.log(`Paragraphs:  ${totalParagraphs}`);
  console.log(`Categories:  ${nonEmptyCategories.length}`);
  console.log(`Tags total:  ${nonEmptyCategories.reduce((s, c) => s + c.tags.length, 0)}`);
  console.log(`File size:   ${(rawSize / 1024).toFixed(0)} KB (raw JSON)`);
  console.log(`\nOutput: ${OUTPUT_PATH}`);

  if (verbose) {
    console.log('\nCategory breakdown:');
    for (const cat of nonEmptyCategories) {
      console.log(`  ${cat.key}: ${cat.tags.length} tags`);
      for (const tag of cat.tags.slice(0, 5)) {
        console.log(`    ${tag.name} (${tag.count})${tag.sub ? ` [${tag.sub}]` : ''}`);
      }
      if (cat.tags.length > 5) {
        console.log(`    ... and ${cat.tags.length - 5} more`);
      }
    }
  }
}

function buildTagList(
  counts: Map<string, number>,
  subcats: Map<string, string>,
  minCount = 1,
): FilterTag[] {
  return Array.from(counts.entries())
    .filter(([_, count]) => count >= minCount)
    .map(([id, count]) => {
      const tag: FilterTag = {
        id,
        name: formatDisplayName(id),
        count,
      };
      const sub = subcats.get(id);
      if (sub) tag.sub = sub;
      return tag;
    })
    .sort((a, b) => b.count - a.count);
}

main();
